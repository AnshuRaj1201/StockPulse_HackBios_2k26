const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { authenticateToken, requireRole } = require("../middleware/auth");
const { evaluateSuppliers } = require("../services/recommendationService");
const { triggerAlert } = require("../services/alertService");

const router = express.Router();
const prisma = new PrismaClient();

// List all verified dealers / suppliers
router.get("/", authenticateToken, async (req, res) => {
  try {
    const suppliers = await prisma.supplier.findMany({
      include: {
        quotes: {
          include: {
            item: { select: { id: true, name: true, sku: true, category: true, department: true } }
          }
        },
        dispatches: {
          take: 5,
          orderBy: { dispatchedAt: "desc" }
        }
      },
      orderBy: { rating: "desc" }
    });
    res.json(suppliers);
  } catch (error) {
    console.error("Fetch suppliers error:", error);
    res.status(500).json({ error: "Failed to fetch dealers" });
  }
});

// Get multi-supplier quotes for a specific item
router.get("/quotes/:itemId", authenticateToken, async (req, res) => {
  try {
    const { itemId } = req.params;
    const quotes = await prisma.supplierQuote.findMany({
      where: { itemId },
      include: {
        supplier: true,
        item: true
      },
      orderBy: { unitPrice: "asc" }
    });
    res.json(quotes);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch quotes" });
  }
});

// AI Supplier Recommendation & Trade-Off Analysis for an item
router.get("/recommend/:itemId", authenticateToken, async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.query;

    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: {
        batches: { where: { status: "ACTIVE" } },
        transactions: {
          where: { type: "OUT" },
          orderBy: { timestamp: "desc" },
          take: 10
        }
      }
    });

    if (!item) return res.status(404).json({ error: "Item not found" });

    const quotes = await prisma.supplierQuote.findMany({
      where: { itemId },
      include: { supplier: true }
    });

    const activeStock = item.batches.reduce((sum, b) => sum + b.quantity, 0);
    const avgUsage = item.transactions.length > 0
      ? item.transactions.reduce((acc, t) => acc + t.quantity, 0) / item.transactions.length
      : Math.max(0.5, item.minThreshold / 7);

    const daysUntilStockout = avgUsage > 0 ? Number((activeStock / avgUsage).toFixed(1)) : 999;
    const reqQty = parseInt(quantity, 10) || Math.max(item.minThreshold * 2, 10);

    const evaluation = evaluateSuppliers({
      item: { ...item, currentStock: activeStock },
      quotes,
      requestedQuantity: reqQty,
      daysUntilStockout
    });

    res.json({
      item: {
        id: item.id,
        name: item.name,
        currentStock: activeStock,
        minThreshold: item.minThreshold,
        unit: item.unit
      },
      ...evaluation
    });
  } catch (error) {
    console.error("AI recommendation error:", error);
    res.status(500).json({ error: "Failed to generate AI supplier recommendation" });
  }
});

// Auto-Dispatch Low Stock Products directly to Dealers
router.post("/auto-dispatch", authenticateToken, requireRole(["admin", "staff"]), async (req, res) => {
  try {
    const { itemId } = req.body;

    // If specific item given, check that item; otherwise scan all low-stock items
    const where = itemId ? { id: itemId } : {};
    const items = await prisma.item.findMany({
      where,
      include: {
        batches: { where: { status: "ACTIVE" } },
        supplierQuotes: { include: { supplier: true } }
      }
    });

    const dispatchedOrders = [];

    for (const item of items) {
      const activeStock = item.batches.reduce((sum, b) => sum + b.quantity, 0);

      // Trigger condition: stock is at or below threshold
      if (activeStock <= item.minThreshold) {
        // Evaluate quotes to find best dealer
        const quotes = item.supplierQuotes;
        let selectedSupplierId;
        let unitPrice;
        let deliveryDays;

        if (quotes.length > 0) {
          const evalRes = evaluateSuppliers({
            item: { ...item, currentStock: activeStock },
            quotes,
            requestedQuantity: Math.max(item.minThreshold * 2, 10),
            daysUntilStockout: 2.0
          });
          const best = evalRes.recommended;
          selectedSupplierId = best.supplierId;
          unitPrice = best.unitPrice;
          deliveryDays = best.deliveryDays;
        } else {
          // Fallback to primary supplier or first available
          const firstSup = await prisma.supplier.findFirst();
          selectedSupplierId = firstSup ? firstSup.id : null;
          unitPrice = item.unitCost;
          deliveryDays = item.leadTimeDays;
        }

        if (selectedSupplierId) {
          const supplier = await prisma.supplier.findUnique({ where: { id: selectedSupplierId } });
          const orderQty = Math.max(item.minThreshold * 2, 10);
          const totalCost = Number((orderQty * unitPrice).toFixed(2));
          const expDate = new Date();
          expDate.setDate(expDate.getDate() + (deliveryDays || 3));

          const dispatchMsg = `🚨 AUTOMATED REPLENISHMENT DISPATCH: ${item.name} dropped to ${activeStock} ${item.unit} (Threshold: ${item.minThreshold}). AI selected ${supplier.name} for PO of ${orderQty} ${item.unit} (Est. Delivery: ${deliveryDays} days).`;

          const dispatch = await prisma.dealerDispatchOrder.create({
            data: {
              itemId: item.id,
              supplierId: selectedSupplierId,
              quantity: orderQty,
              unitPrice,
              totalCost,
              status: "AUTO_DISPATCHED",
              triggerType: "AUTO_LOW_STOCK",
              dispatchMessage: dispatchMsg,
              dealerContactEmail: supplier.email,
              expectedDeliveryDate: expDate
            },
            include: {
              item: true,
              supplier: true
            }
          });

          await prisma.auditLog.create({
            data: {
              action: "DEALER_DISPATCH",
              entity: "DealerDispatchOrder",
              entityId: dispatch.id,
              details: `Auto-dispatched PO #${dispatch.id.slice(0, 8)} to ${supplier.name} for ${orderQty} ${item.unit} of ${item.name} ($${totalCost})`,
              performedBy: req.user?.name || "StockPulse AI Autonomous Procurement"
            }
          });

          await triggerAlert({
            type: "DEALER_DISPATCH",
            title: `Auto-Ordered to Dealer: ${item.name}`,
            message: `StockPulse dispatched order for ${orderQty} ${item.unit} to ${supplier.name} (${supplier.email}).`,
            severity: "HIGH",
            itemId: item.id
          });

          dispatchedOrders.push(dispatch);
        }
      }
    }

    res.json({
      success: true,
      count: dispatchedOrders.length,
      dispatches: dispatchedOrders
    });
  } catch (error) {
    console.error("Auto-dispatch error:", error);
    res.status(500).json({ error: "Failed to auto-dispatch orders to dealers" });
  }
});

// List all Dealer Dispatches
router.get("/dispatches", authenticateToken, async (req, res) => {
  try {
    const dispatches = await prisma.dealerDispatchOrder.findMany({
      include: {
        item: { select: { id: true, name: true, sku: true, unit: true, department: true } },
        supplier: { select: { id: true, name: true, contactPerson: true, email: true, phone: true } }
      },
      orderBy: { dispatchedAt: "desc" }
    });
    res.json(dispatches);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch dealer dispatches" });
  }
});

// Update Dealer Dispatch Status (e.g. Delivered -> Adds stock to inventory!)
router.put("/dispatches/:id/status", authenticateToken, requireRole(["admin", "staff"]), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // "ACKNOWLEDGED", "SHIPPED", "DELIVERED", "CANCELLED"

    const order = await prisma.dealerDispatchOrder.findUnique({
      where: { id },
      include: { item: { include: { batches: { where: { status: "ACTIVE" } } } }, supplier: true }
    });

    if (!order) return res.status(404).json({ error: "Dispatch order not found" });

    // If delivered, automatically replenish stock!
    if (status === "DELIVERED" && order.status !== "DELIVERED") {
      const prevStock = order.item.batches.reduce((sum, b) => sum + b.quantity, 0);
      const newStock = prevStock + order.quantity;

      // Create new batch
      const expDate = new Date();
      expDate.setDate(expDate.getDate() + 180);

      await prisma.batch.create({
        data: {
          itemId: order.itemId,
          batchNumber: `DEALER-RECV-${Date.now().toString().slice(-4)}`,
          quantity: order.quantity,
          initialQuantity: order.quantity,
          location: "Main Storage Bin",
          expiryDate: expDate,
          status: "ACTIVE"
        }
      });

      await prisma.item.update({
        where: { id: order.itemId },
        data: { currentStock: newStock }
      });

      await prisma.stockTransaction.create({
        data: {
          itemId: order.itemId,
          type: "IN",
          quantity: order.quantity,
          previousStock: prevStock,
          newStock,
          reason: `Fulfilled Dealer Delivery (PO #${order.id.slice(0, 8)} from ${order.supplier.name})`,
          performedBy: req.user?.name || "Staff"
        }
      });

      await prisma.auditLog.create({
        data: {
          action: "DEALER_DELIVERY_RECEIVED",
          entity: "Item",
          entityId: order.itemId,
          details: `Received shipment of ${order.quantity} ${order.item.unit} for ${order.item.name} from ${order.supplier.name}. Stock: ${prevStock} -> ${newStock}`,
          performedBy: req.user?.name || "Staff"
        }
      });
    }

    const updated = await prisma.dealerDispatchOrder.update({
      where: { id },
      data: { status }
    });

    res.json(updated);
  } catch (error) {
    console.error("Update dispatch status error:", error);
    res.status(500).json({ error: "Failed to update dispatch order status" });
  }
});

module.exports = router;