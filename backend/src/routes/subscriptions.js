const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { authenticateToken, requireRole } = require("../middleware/auth");
const { triggerAlert } = require("../services/alertService");

const router = express.Router();
const prisma = new PrismaClient();

// List all recurring subscriptions with item & history
router.get("/", authenticateToken, async (req, res) => {
  try {
    const subscriptions = await prisma.recurringSubscription.findMany({
      include: {
        item: {
          select: {
            id: true,
            name: true,
            sku: true,
            unit: true,
            currentStock: true,
            minThreshold: true,
            department: true
          }
        },
        deliveryLogs: {
          take: 5,
          orderBy: { executedAt: "desc" }
        }
      },
      orderBy: { createdAt: "desc" }
    });
    res.json(subscriptions);
  } catch (error) {
    console.error("Fetch subscriptions error:", error);
    res.status(500).json({ error: "Failed to fetch subscriptions" });
  }
});

// Create new recurring subscription (e.g. medicine delivery on 5th of every month)
router.post("/", authenticateToken, requireRole(["admin", "staff"]), async (req, res) => {
  try {
    const {
      customerName,
      customerEmail,
      customerPhone,
      itemId,
      quantity = 1,
      dayOfMonth = 5,
      destination,
      notes
    } = req.body;

    const item = await prisma.item.findUnique({ where: { id: itemId } });
    if (!item) return res.status(404).json({ error: "Item not found" });

    const now = new Date();
    const nextDate = new Date(now.getFullYear(), now.getMonth(), parseInt(dayOfMonth, 10));
    if (nextDate < now) {
      nextDate.setMonth(nextDate.getMonth() + 1);
    }

    const sub = await prisma.recurringSubscription.create({
      data: {
        customerName,
        customerEmail: customerEmail || "customer@campus.edu",
        customerPhone: customerPhone || "+91 98000 11223",
        itemId,
        quantity: parseInt(quantity, 10) || 1,
        dayOfMonth: parseInt(dayOfMonth, 10) || 5,
        customerPermission: true, // Permission granted by default upon agreement
        status: "ACTIVE",
        destination: destination || "Campus Dispensary / Health Center",
        notes: notes || "Monthly recurring scheduled delivery",
        nextDeliveryDate: nextDate
      },
      include: { item: true }
    });

    await prisma.auditLog.create({
      data: {
        action: "RECURRING_SUBSCRIPTION_CREATED",
        entity: "RecurringSubscription",
        entityId: sub.id,
        details: `Created monthly scheduled delivery for '${sub.customerName}' of ${sub.quantity} ${item.unit} '${item.name}' on Day ${sub.dayOfMonth} every month.`,
        performedBy: req.user?.name || "Staff"
      }
    });

    res.status(201).json(sub);
  } catch (error) {
    console.error("Create subscription error:", error);
    res.status(500).json({ error: error.message || "Failed to create subscription" });
  }
});

// Update subscription details (e.g. change customer's chosen delivery day or quantity)
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { dayOfMonth, quantity, destination, notes, customerName, customerEmail, customerPhone } = req.body;

    const data = {};
    if (dayOfMonth !== undefined) {
      data.dayOfMonth = Math.max(1, Math.min(31, parseInt(dayOfMonth, 10)));
      const now = new Date();
      data.nextDeliveryDate = new Date(now.getFullYear(), now.getMonth(), data.dayOfMonth);
    }
    if (quantity !== undefined) data.quantity = Math.max(1, parseInt(quantity, 10));
    if (destination !== undefined) data.destination = destination;
    if (notes !== undefined) data.notes = notes;
    if (customerName !== undefined) data.customerName = customerName;
    if (customerEmail !== undefined) data.customerEmail = customerEmail;
    if (customerPhone !== undefined) data.customerPhone = customerPhone;

    const updated = await prisma.recurringSubscription.update({
      where: { id },
      data,
      include: { item: true }
    });

    await prisma.auditLog.create({
      data: {
        action: "SUBSCRIPTION_UPDATED",
        entity: "RecurringSubscription",
        entityId: id,
        details: `Updated subscription for '${updated.customerName}': Preferred Delivery Day is now Day ${updated.dayOfMonth} of every month.`,
        performedBy: req.user?.name || "Staff"
      }
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Failed to update subscription" });
  }
});

// Toggle Customer Permission / Consent
router.put("/:id/permission", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const sub = await prisma.recurringSubscription.findUnique({ where: { id } });
    if (!sub) return res.status(404).json({ error: "Subscription not found" });

    const updated = await prisma.recurringSubscription.update({
      where: { id },
      data: { customerPermission: !sub.customerPermission }
    });

    await prisma.auditLog.create({
      data: {
        action: "SUBSCRIPTION_PERMISSION_TOGGLED",
        entity: "RecurringSubscription",
        entityId: id,
        details: `Customer delivery permission for ${updated.customerName} set to: ${updated.customerPermission ? "GRANTED" : "REVOKED"}`,
        performedBy: req.user?.name || "Staff"
      }
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Failed to update permission" });
  }
});

// Execute Scheduled Delivery Run (Can be triggered on the exact date or simulated on demand)
router.post("/run-scheduled", authenticateToken, requireRole(["admin", "staff"]), async (req, res) => {
  try {
    const { subscriptionId, targetDay, forceRun = false } = req.body;

    const where = { status: "ACTIVE" };
    if (subscriptionId) {
      where.id = subscriptionId;
    } else if (targetDay) {
      where.dayOfMonth = parseInt(targetDay, 10);
    }

    const subscriptions = await prisma.recurringSubscription.findMany({
      where,
      include: {
        item: {
          include: {
            batches: {
              where: { status: "ACTIVE", quantity: { gt: 0 } },
              orderBy: { expiryDate: "asc" } // FEFO
            }
          }
        }
      }
    });

    const executionResults = [];

    for (const sub of subscriptions) {
      // Check customer permission
      if (!sub.customerPermission) {
        await prisma.subscriptionDeliveryLog.create({
          data: {
            subscriptionId: sub.id,
            quantity: sub.quantity,
            status: "PERMISSION_REVOKED",
            stockBefore: sub.item.batches.reduce((sum, b) => sum + b.quantity, 0),
            stockAfter: sub.item.batches.reduce((sum, b) => sum + b.quantity, 0),
            message: `Delivery blocked: Customer has revoked authorization for this cycle.`
          }
        });
        executionResults.push({ id: sub.id, status: "PERMISSION_REVOKED", customer: sub.customerName });
        continue;
      }

      const totalActiveStock = sub.item.batches.reduce((sum, b) => sum + b.quantity, 0);

      // Check inventory availability
      if (totalActiveStock < sub.quantity) {
        // Insufficient stock warning!
        await prisma.subscriptionDeliveryLog.create({
          data: {
            subscriptionId: sub.id,
            quantity: sub.quantity,
            status: "FAILED_INSUFFICIENT_STOCK",
            stockBefore: totalActiveStock,
            stockAfter: totalActiveStock,
            message: `Delivery failed: Insufficient stock. Required ${sub.quantity} ${sub.item.unit}, but only ${totalActiveStock} available.`
          }
        });

        await triggerAlert({
          type: "SUBSCRIPTION_STOCKOUT_RISK",
          title: `Delivery Failed: ${sub.item.name}`,
          message: `Scheduled monthly delivery for ${sub.customerName} failed due to low stock (${totalActiveStock} available, needed ${sub.quantity}).`,
          severity: "CRITICAL",
          itemId: sub.itemId
        });

        executionResults.push({
          id: sub.id,
          status: "FAILED_INSUFFICIENT_STOCK",
          customer: sub.customerName,
          available: totalActiveStock,
          needed: sub.quantity
        });
        continue;
      }

      // Sufficient stock: AUTOMATICALLY DEDUCT FROM INVENTORY USING FEFO
      let remainingToDeduct = sub.quantity;
      let primaryBatchId = null;

      for (const batch of sub.item.batches) {
        if (remainingToDeduct <= 0) break;
        primaryBatchId = batch.id;
        const take = Math.min(batch.quantity, remainingToDeduct);
        const updatedQty = batch.quantity - take;
        remainingToDeduct -= take;

        await prisma.batch.update({
          where: { id: batch.id },
          data: {
            quantity: updatedQty,
            status: updatedQty === 0 ? "DEPLETED" : "ACTIVE"
          }
        });
      }

      const newStock = totalActiveStock - sub.quantity;

      // Update Item stock
      await prisma.item.update({
        where: { id: sub.itemId },
        data: { currentStock: newStock }
      });

      // Log Stock OUT Transaction
      await prisma.stockTransaction.create({
        data: {
          itemId: sub.itemId,
          batchId: primaryBatchId,
          type: "RECURRING_DELIVERY",
          quantity: sub.quantity,
          previousStock: totalActiveStock,
          newStock,
          reason: `Scheduled Monthly Delivery (Day ${sub.dayOfMonth}) to ${sub.customerName}`,
          performedBy: "StockPulse Automated Subscription Scheduler"
        }
      });

      // Roll next delivery date to next month
      const now = new Date();
      const nextDate = new Date(now.getFullYear(), now.getMonth() + 1, sub.dayOfMonth);

      await prisma.recurringSubscription.update({
        where: { id: sub.id },
        data: {
          lastDeliveredDate: now,
          nextDeliveryDate: nextDate
        }
      });

      // Record successful delivery log
      const deliveryLog = await prisma.subscriptionDeliveryLog.create({
        data: {
          subscriptionId: sub.id,
          quantity: sub.quantity,
          status: "SUCCESS",
          stockBefore: totalActiveStock,
          stockAfter: newStock,
          message: `Delivered ${sub.quantity} ${sub.item.unit} to ${sub.customerName} (${sub.destination}). Inventory auto-deducted to ${newStock}.`
        }
      });

      // Log Audit Trail
      await prisma.auditLog.create({
        data: {
          action: "RECURRING_DELIVERY_EXECUTED",
          entity: "RecurringSubscription",
          entityId: sub.id,
          details: `Fulfilled monthly delivery of ${sub.quantity} ${sub.item.unit} '${sub.item.name}' for ${sub.customerName}. Stock updated from ${totalActiveStock} to ${newStock}.`,
          performedBy: req.user?.name || "Automated Scheduler"
        }
      });

      // Trigger Delivery Customer Notification
      await triggerAlert({
        type: "CUSTOMER_DELIVERY_CONFIRMED",
        title: `Monthly Delivery Dispatched: ${sub.customerName}`,
        message: `${sub.quantity} ${sub.item.unit} of ${sub.item.name} delivered to ${sub.destination}. Customer notified via email/SMS.`,
        severity: "INFO",
        itemId: sub.itemId
      });

      executionResults.push({
        id: sub.id,
        status: "SUCCESS",
        customer: sub.customerName,
        item: sub.item.name,
        quantity: sub.quantity,
        previousStock: totalActiveStock,
        newStock,
        log: deliveryLog
      });
    }

    res.json({
      success: true,
      message: `Processed ${executionResults.length} recurring deliveries.`,
      results: executionResults
    });
  } catch (error) {
    console.error("Scheduled delivery run error:", error);
    res.status(500).json({ error: error.message || "Failed to execute scheduled deliveries" });
  }
});

// Delete / Cancel subscription
router.delete("/:id", authenticateToken, requireRole(["admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.recurringSubscription.delete({ where: { id } });
    res.json({ message: "Subscription cancelled successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete subscription" });
  }
});

module.exports = router;