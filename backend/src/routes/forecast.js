const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { authenticateToken, requireRole } = require("../middleware/auth");
const { runForecast } = require("../services/forecastService");

const router = express.Router();
const prisma = new PrismaClient();

// Get forecast & reorder suggestions for all items
router.get("/", authenticateToken, async (req, res) => {
  try {
    const items = await prisma.item.findMany({
      include: {
        batches: { where: { status: "ACTIVE" } },
        transactions: {
          where: { type: { in: ["OUT", "WASTE"] } },
          orderBy: { timestamp: "desc" },
          take: 30
        },
        reorders: {
          where: { status: { in: ["DRAFT", "APPROVED", "ORDERED"] } },
          orderBy: { createdAt: "desc" },
          take: 1
        }
      }
    });

    const itemsForForecast = items.map((item) => {
      const activeStock = item.batches.reduce((sum, b) => sum + b.quantity, 0);

      // Derive daily usage history from recent OUT transactions or synthetic baseline
      let usageHistory = [];
      if (item.transactions.length > 0) {
        usageHistory = item.transactions.map((t) => t.quantity);
      } else {
        // Fallback baseline based on item department / minThreshold
        const estimatedDaily = Math.max(0.5, item.minThreshold / 7);
        usageHistory = [estimatedDaily * 0.9, estimatedDaily * 1.1, estimatedDaily, estimatedDaily * 1.2, estimatedDaily * 0.8];
      }

      return {
        id: item.id,
        name: item.name,
        category: item.category,
        department: item.department,
        currentStock: activeStock,
        unit: item.unit,
        unitCost: item.unitCost,
        minThreshold: item.minThreshold,
        safetyStock: item.safetyStock,
        leadTimeDays: item.leadTimeDays,
        supplierName: item.supplierName,
        supplierEmail: item.supplierEmail,
        supplierPhone: item.supplierPhone,
        activeReorder: item.reorders[0] || null,
        usageHistory
      };
    });

    const forecastResults = await runForecast(itemsForForecast);

    // Merge forecast results with item metadata
    const merged = itemsForForecast.map((item) => {
      const fc = forecastResults.find((f) => f.itemId === item.id) || {};
      const estCost = fc.suggestedQuantity ? Number((fc.suggestedQuantity * item.unitCost).toFixed(2)) : 0;
      return {
        ...item,
        ...fc,
        estimatedCost: estCost
      };
    });

    res.json(merged);
  } catch (error) {
    console.error("Forecast route error:", error);
    res.status(500).json({ error: "Failed to generate forecast" });
  }
});

// Auto-generate or refresh draft reorders based on forecast
router.post("/generate-drafts", authenticateToken, requireRole(["admin", "staff"]), async (req, res) => {
  try {
    const items = await prisma.item.findMany({
      include: {
        batches: { where: { status: "ACTIVE" } },
        transactions: {
          where: { type: { in: ["OUT", "WASTE"] } },
          orderBy: { timestamp: "desc" },
          take: 30
        }
      }
    });

    const itemsForForecast = items.map((item) => {
      const activeStock = item.batches.reduce((sum, b) => sum + b.quantity, 0);
      const usageHistory = item.transactions.length > 0
        ? item.transactions.map((t) => t.quantity)
        : [item.minThreshold / 7, (item.minThreshold / 7) * 1.2, item.minThreshold / 7];

      return {
        id: item.id,
        name: item.name,
        currentStock: activeStock,
        leadTimeDays: item.leadTimeDays,
        safetyStock: item.safetyStock,
        unitCost: item.unitCost,
        usageHistory
      };
    });

    const forecasts = await runForecast(itemsForForecast);
    const createdOrUpdated = [];

    for (const fc of forecasts) {
      if (fc.needsReorder && fc.suggestedQuantity > 0) {
        const item = items.find((i) => i.id === fc.itemId);
        const estCost = Number((fc.suggestedQuantity * (item?.unitCost || 0)).toFixed(2));

        // Check if active draft exists
        const existingDraft = await prisma.reorderSuggestion.findFirst({
          where: {
            itemId: fc.itemId,
            status: "DRAFT"
          }
        });

        if (existingDraft) {
          const updated = await prisma.reorderSuggestion.update({
            where: { id: existingDraft.id },
            data: {
              suggestedQuantity: fc.suggestedQuantity,
              estimatedCost: estCost,
              avgDailyUsage: fc.dailyUsageRate,
              daysUntilStockout: fc.daysUntilStockout,
              urgency: fc.urgency,
              notes: `Forecast: ${fc.daysUntilStockout} days until stockout. Reorder point: ${fc.reorderPoint}.`
            }
          });
          createdOrUpdated.push(updated);
        } else {
          const created = await prisma.reorderSuggestion.create({
            data: {
              itemId: fc.itemId,
              suggestedQuantity: fc.suggestedQuantity,
              estimatedCost: estCost,
              avgDailyUsage: fc.dailyUsageRate,
              daysUntilStockout: fc.daysUntilStockout,
              urgency: fc.urgency,
              status: "DRAFT",
              notes: `Auto-suggested: current stock (${fc.currentStock}) is below ROP (${fc.reorderPoint}).`
            }
          });
          createdOrUpdated.push(created);
        }
      }
    }

    res.json({
      message: `Generated/updated ${createdOrUpdated.length} reorder drafts`,
      drafts: createdOrUpdated
    });
  } catch (error) {
    console.error("Generate drafts error:", error);
    res.status(500).json({ error: "Failed to generate reorder drafts" });
  }
});

module.exports = router;
