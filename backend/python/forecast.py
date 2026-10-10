import sys
import json
import math
from datetime import datetime

def compute_forecast(data):
    """
    Computes stock forecast, safety stock, reorder point, and days to stockout
    Supports moving averages and exponential smoothing.
    """
    items = data.get("items", [])
    results = []

    for item in items:
        item_id = item.get("id")
        name = item.get("name")
        current_stock = item.get("currentStock", 0)
        lead_time_days = item.get("leadTimeDays", 4)
        history = item.get("usageHistory", []) # daily usage records e.g. [5, 4, 6, 7, 5, 8, 6]

        if not history:
            # Default fallback estimate if no history exists yet
            daily_usage = 1.0
            variance = 0.2
        else:
            daily_usage = sum(history) / len(history)
            variance = sum((x - daily_usage) ** 2 for x in history) / max(1, len(history) - 1)
        
        std_dev = math.sqrt(variance)

        # Exponential Smoothing (alpha = 0.3)
        alpha = 0.3
        if history:
            exp_smoothed = history[0]
            for val in history[1:]:
                exp_smoothed = alpha * val + (1 - alpha) * exp_smoothed
        else:
            exp_smoothed = daily_usage

        # Safety Stock formula: Z * std_dev * sqrt(lead_time)
        # Z = 1.65 for ~95% service level in campus operations
        z_factor = 1.65
        safety_stock = math.ceil(z_factor * std_dev * math.sqrt(max(1, lead_time_days)))
        safety_stock = max(safety_stock, item.get("safetyStock", 3))

        # Reorder Point (ROP) = (Daily Usage * Lead Time) + Safety Stock
        reorder_point = math.ceil((daily_usage * lead_time_days) + safety_stock)

        # Days until stockout
        if daily_usage > 0:
            days_until_stockout = round(current_stock / daily_usage, 1)
        else:
            days_until_stockout = 999.0

        # Suggested Reorder Quantity
        # Target stock = Reorder Point + (daily_usage * 14) (2 weeks cycle)
        target_cycle_stock = math.ceil(daily_usage * 14)
        needs_reorder = current_stock <= reorder_point

        if needs_reorder:
            suggested_quantity = max(target_cycle_stock + safety_stock - current_stock, target_cycle_stock)
        else:
            suggested_quantity = 0

        # Urgency level
        if current_stock == 0:
            urgency = "CRITICAL_STOCKOUT"
        elif days_until_stockout <= lead_time_days:
            urgency = "CRITICAL"
        elif current_stock <= reorder_point:
            urgency = "HIGH"
        elif days_until_stockout <= lead_time_days * 2:
            urgency = "MEDIUM"
        else:
            urgency = "NORMAL"

        results.append({
            "itemId": item_id,
            "name": name,
            "currentStock": current_stock,
            "dailyUsageRate": round(daily_usage, 2),
            "expSmoothedUsage": round(exp_smoothed, 2),
            "safetyStock": safety_stock,
            "reorderPoint": reorder_point,
            "daysUntilStockout": days_until_stockout,
            "needsReorder": needs_reorder,
            "suggestedQuantity": suggested_quantity,
            "urgency": urgency
        })

    return results

if __name__ == "__main__":
    try:
        raw_input = sys.stdin.read()
        if raw_input.strip():
            payload = json.loads(raw_input)
            output = compute_forecast(payload)
            print(json.dumps({"success": True, "forecast": output}))
        else:
            print(json.dumps({"success": True, "forecast": []}))
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))
