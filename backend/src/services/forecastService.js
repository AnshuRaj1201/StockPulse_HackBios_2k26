const { spawn } = require("child_process");
const path = require("path");

function calculateJsForecast(items) {
  return items.map((item) => {
    const currentStock = item.currentStock || 0;
    const leadTime = item.leadTimeDays || 4;
    const history = item.usageHistory || [];

    let dailyUsage = 1.0;
    let variance = 0.2;

    if (history.length > 0) {
      dailyUsage = history.reduce((a, b) => a + b, 0) / history.length;
      variance =
        history.reduce((acc, x) => acc + Math.pow(x - dailyUsage, 2), 0) /
        Math.max(1, history.length - 1);
    }

    const stdDev = Math.sqrt(variance);

    // Exponential smoothing
    let expSmoothed = history.length > 0 ? history[0] : dailyUsage;
    const alpha = 0.3;
    for (let i = 1; i < history.length; i++) {
      expSmoothed = alpha * history[i] + (1 - alpha) * expSmoothed;
    }

    // Safety Stock = Z * stdDev * sqrt(L) (Z = 1.65)
    const zFactor = 1.65;
    const computedSS = Math.ceil(zFactor * stdDev * Math.sqrt(Math.max(1, leadTime)));
    const safetyStock = Math.max(computedSS, item.safetyStock || 3);

    // Reorder Point
    const reorderPoint = Math.ceil(dailyUsage * leadTime + safetyStock);

    const daysUntilStockout =
      dailyUsage > 0 ? Number((currentStock / dailyUsage).toFixed(1)) : 999.0;
    const needsReorder = currentStock <= reorderPoint;

    // Target reorder: 2-week cycle + safety stock
    const targetCycleStock = Math.ceil(dailyUsage * 14);
    const suggestedQuantity = needsReorder
      ? Math.max(targetCycleStock + safetyStock - currentStock, targetCycleStock)
      : 0;

    let urgency = "NORMAL";
    if (currentStock === 0) urgency = "CRITICAL_STOCKOUT";
    else if (daysUntilStockout <= leadTime) urgency = "CRITICAL";
    else if (needsReorder) urgency = "HIGH";
    else if (daysUntilStockout <= leadTime * 2) urgency = "MEDIUM";

    return {
      itemId: item.id,
      name: item.name,
      currentStock,
      dailyUsageRate: Number(dailyUsage.toFixed(2)),
      expSmoothedUsage: Number(expSmoothed.toFixed(2)),
      safetyStock,
      reorderPoint,
      daysUntilStockout,
      needsReorder,
      suggestedQuantity,
      urgency
    };
  });
}

async function runForecast(items) {
  return new Promise((resolve) => {
    const pythonScriptPath = path.join(__dirname, "../../python/forecast.py");
    const pyProcess = spawn("python", [pythonScriptPath]);

    let output = "";
    let errorOutput = "";

    pyProcess.stdout.on("data", (data) => {
      output += data.toString();
    });

    pyProcess.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    pyProcess.on("close", (code) => {
      if (code === 0 && output.trim()) {
        try {
          const parsed = JSON.parse(output);
          if (parsed.success && parsed.forecast) {
            return resolve(parsed.forecast);
          }
        } catch (e) {
          console.warn("Python forecast parse failed, falling back to JS engine:", e.message);
        }
      }
      // Resilient fallback
      resolve(calculateJsForecast(items));
    });

    pyProcess.on("error", () => {
      resolve(calculateJsForecast(items));
    });

    try {
      pyProcess.stdin.write(JSON.stringify({ items }));
      pyProcess.stdin.end();
    } catch {
      resolve(calculateJsForecast(items));
    }
  });
}

module.exports = { runForecast, calculateJsForecast };
