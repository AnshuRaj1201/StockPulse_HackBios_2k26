const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { authenticateToken, requireRole } = require("../middleware/auth");
const { triggerAlert } = require("../services/alertService");

const router = express.Router();
const prisma = new PrismaClient();

// Quick 1-tap stock in or out (+/-)
router.post("/quick", authenticateToken, requireRole(["admin", "staff"]), async (req, res) => {
  try {
    const { itemId, delta, reason } = req.body; // delta: +1, -1, +5, etc.
    const change = parseInt(delta, 10);
    if (!itemId || isNaN(change) || change === 0) {
      return res.status(400).json({ error: "Invalid item or quantity change" });
    }

    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: {
        batches: {
          where: { status: "ACTIVE" },
          orderBy: { expiryDate: "asc" } // FEFO
        }
      }
    });

    if (!item) return res.status(404).json({ error: "Item not found" });

    const totalActiveStock = item.batches.reduce((sum, b) => sum + b.quantity, 0);

    if (change < 0 && totalActiveStock + change < 0) {
      return res.status(400).json({
        error: `Insufficient stock! Current available is ${totalActiveStock} ${item.unit}.`
      });
    }

    let remainingToIssue = Math.abs(change);
    let targetBatchId = null;

    if (change < 0) {
      // FEFO allocation across active batches
      for (const batch of item.batches) {
        if (remainingToIssue <= 0) break;
        targetBatchId = batch.id;
        const deduct = Math.min(batch.quantity, remainingToIssue);
        const newBatchQty = batch.quantity - deduct;
        remainingToIssue -= deduct;

        await prisma.batch.update({
          where: { id: batch.id },
          data: {
            quantity: newBatchQty,
            status: newBatchQty === 0 ? "DEPLETED" : "ACTIVE"
          }
        });
      }
    } else {
      // Stock IN: add to earliest active batch or create default batch
      if (item.batches.length > 0) {
        const primaryBatch = item.batches[0];
        targetBatchId = primaryBatch.id;
        await prisma.batch.update({
          where: { id: primaryBatch.id },
          data: { quantity: primaryBatch.quantity + change }
        });
      } else {
        const newBatch = await prisma.batch.create({
          data: {
            itemId: item.id,
            batchNumber: `BATCH-RESTOCK-${Date.now().toString().slice(-4)}`,
            quantity: change,
            initialQuantity: change,
            location: "Main Storage",
            status: "ACTIVE"
          }
        });
        targetBatchId = newBatch.id;
      }
    }

    const newStock = totalActiveStock + change;
    await prisma.item.update({
      where: { id: itemId },
      data: { currentStock: newStock }
    });

    // Record stock transaction
    const tx = await prisma.stockTransaction.create({
      data: {
        itemId,
        batchId: targetBatchId,
        type: change > 0 ? "IN" : "OUT",
        quantity: Math.abs(change),
        previousStock: totalActiveStock,
        newStock,
        reason: reason || (change > 0 ? "Quick Restock" : "Quick Issue"),
        performedBy: req.user?.name || "Staff"
      }
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        action: change > 0 ? "STOCK_IN" : "STOCK_OUT",
        entity: "Item",
        entityId: item.id,
        details: `${change > 0 ? "Added" : "Issued"} ${Math.abs(change)} ${item.unit} for '${item.name}' (Stock: ${totalActiveStock} -> ${newStock})`,
        performedBy: req.user?.name || "Staff"
      }
    });

    // Trigger Smart Low-Stock Alert & Automatic Dealer Dispatch if threshold reached
    if (newStock <= item.minThreshold) {
      await triggerAlert({
        type: newStock === 0 ? "STOCKOUT" : "LOW_STOCK",
        title: newStock === 0 ? `Out of Stock: ${item.name}` : `Low Stock Warning: ${item.name}`,
        message: `${item.name} is down to ${newStock} ${item.unit} (Threshold is ${item.minThreshold}). AI is contacting dealer.`,
        severity: newStock === 0 ? "CRITICAL" : "HIGH",
        itemId: item.id
      });

      // Automatically dispatch purchase order to registered dealer
      const activeDispatch = await prisma.dealerDispatchOrder.findFirst({
        where: {
          itemId: item.id,
          status: { in: ["AUTO_DISPATCHED", "ACKNOWLEDGED", "SHIPPED"] }
        }
      });

      if (!activeDispatch) {
        const preferredQuote = await prisma.supplierQuote.findFirst({
          where: { itemId: item.id },
          include: { supplier: true },
          orderBy: { isPreferred: "desc" }
        });

        if (preferredQuote) {
          const orderQty = Math.max(item.minThreshold * 2, 10);
          const totalCost = Number((orderQty * preferredQuote.unitPrice).toFixed(2));
          const expDate = new Date();
          expDate.setDate(expDate.getDate() + (preferredQuote.deliveryDays || 3));

          await prisma.dealerDispatchOrder.create({
            data: {
              itemId: item.id,
              supplierId: preferredQuote.supplierId,
              quantity: orderQty,
              unitPrice: preferredQuote.unitPrice,
              totalCost,
              status: "AUTO_DISPATCHED",
              triggerType: "AUTO_LOW_STOCK",
              dispatchMessage: `AUTOMATED DEALER DISPATCH: ${item.name} hit low stock (${newStock} ${item.unit}). Autonomous PO sent to ${preferredQuote.supplier.name}.`,
              dealerContactEmail: preferredQuote.supplier.email,
              expectedDeliveryDate: expDate
            }
          });

          await prisma.auditLog.create({
            data: {
              action: "AUTO_DEALER_DISPATCH",
              entity: "DealerDispatchOrder",
              entityId: item.id,
              details: `Autonomous PO dispatched to dealer '${preferredQuote.supplier.name}' for ${orderQty} ${item.unit} (${item.name}) on low stock trigger.`,
              performedBy: "StockPulse AI Auto-Procurement"
            }
          });
        }
      }
    }

    res.json({
      success: true,
      item: { id: item.id, name: item.name, currentStock: newStock, minThreshold: item.minThreshold },
      transaction: tx
    });
  } catch (error) {
    console.error("Quick stock error:", error);
    res.status(500).json({ error: error.message || "Quick stock operation failed" });
  }
});

// Detailed Stock In / Out / Adjust with specific Batch & Dates
router.post("/transaction", authenticateToken, requireRole(["admin", "staff"]), async (req, res) => {
  try {
    const {
      itemId,
      type, // "IN", "OUT", "ADJUST", "WASTE"
      quantity,
      reason,
      batchNumber,
      expiryDate,
      location = "Main Storage"
    } = req.body;

    const qty = parseInt(quantity, 10);
    if (!itemId || !type || isNaN(qty) || qty <= 0) {
      return res.status(400).json({ error: "Invalid transaction payload" });
    }

    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: {
        batches: {
          where: { status: "ACTIVE" },
          orderBy: { expiryDate: "asc" }
        }
      }
    });

    if (!item) return res.status(404).json({ error: "Item not found" });

    const totalActiveStock = item.batches.reduce((sum, b) => sum + b.quantity, 0);
    let newTotalStock = totalActiveStock;
    let targetBatchId = null;

    if (type === "IN") {
      newTotalStock = totalActiveStock + qty;
      const newBatch = await prisma.batch.create({
        data: {
          itemId: item.id,
          batchNumber: batchNumber || `B-${Date.now().toString().slice(-4)}`,
          quantity: qty,
          initialQuantity: qty,
          location,
          expiryDate: expiryDate ? new Date(expiryDate) : null,
          status: "ACTIVE"
        }
      });
      targetBatchId = newBatch.id;
    } else {
      // OUT or WASTE
      if (totalActiveStock < qty) {
        return res.status(400).json({
          error: `Insufficient stock! Requested ${qty} ${item.unit}, but only ${totalActiveStock} available.`
        });
      }
      newTotalStock = totalActiveStock - qty;
      let remaining = qty;
      for (const b of item.batches) {
        if (remaining <= 0) break;
        targetBatchId = b.id;
        const take = Math.min(b.quantity, remaining);
        const updatedQty = b.quantity - take;
        remaining -= take;
        await prisma.batch.update({
          where: { id: b.id },
          data: {
            quantity: updatedQty,
            status: updatedQty === 0 ? "DEPLETED" : "ACTIVE"
          }
        });
      }
    }

    await prisma.item.update({
      where: { id: itemId },
      data: { currentStock: newTotalStock }
    });

    const tx = await prisma.stockTransaction.create({
      data: {
        itemId,
        batchId: targetBatchId,
        type,
        quantity: qty,
        previousStock: totalActiveStock,
        newStock: newTotalStock,
        reason: reason || `Manual ${type} entry`,
        performedBy: req.user?.name || "Staff"
      }
    });

    await prisma.auditLog.create({
      data: {
        action: `STOCK_${type}`,
        entity: "Item",
        entityId: item.id,
        details: `${type} ${qty} ${item.unit} for '${item.name}'. Reason: ${reason || "N/A"}`,
        performedBy: req.user?.name || "Staff"
      }
    });

    if (newTotalStock <= item.minThreshold) {
      await triggerAlert({
        type: newTotalStock === 0 ? "STOCKOUT" : "LOW_STOCK",
        title: newTotalStock === 0 ? `Stockout: ${item.name}` : `Low Stock Warning: ${item.name}`,
        message: `${item.name} has only ${newTotalStock} ${item.unit} remaining.`,
        severity: newTotalStock === 0 ? "CRITICAL" : "HIGH",
        itemId: item.id
      });
    }

    res.json({ success: true, newStock: newTotalStock, transaction: tx });
  } catch (error) {
    console.error("Stock transaction error:", error);
    res.status(500).json({ error: error.message || "Transaction failed" });
  }
});

// Get recent transactions log
router.get("/transactions", authenticateToken, async (req, res) => {
  try {
    const transactions = await prisma.stockTransaction.findMany({
      take: 50,
      orderBy: { timestamp: "desc" },
      include: {
        item: { select: { id: true, name: true, sku: true, unit: true, category: true, department: true } },
        batch: { select: { batchNumber: true, location: true, expiryDate: true } }
      }
    });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

module.exports = router;
