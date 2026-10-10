const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { authenticateToken, requireRole } = require("../middleware/auth");
const { triggerAlert } = require("../services/alertService");

const router = express.Router();
const prisma = new PrismaClient();

// List reorder suggestions & purchase orders
router.get("/", authenticateToken, async (req, res) => {
  try {
    const { status } = req.query;
    const where = status ? { status } : {};

    const reorders = await prisma.reorderSuggestion.findMany({
      where,
      include: {
        item: {
          select: {
            id: true,
            name: true,
            sku: true,
            category: true,
            department: true,
            unit: true,
            currentStock: true,
            minThreshold: true,
            supplierName: true,
            supplierEmail: true,
            supplierPhone: true,
            unitCost: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    res.json(reorders);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch reorder suggestions" });
  }
});

// Create manual reorder
router.post("/", authenticateToken, requireRole(["admin", "staff"]), async (req, res) => {
  try {
    const { itemId, suggestedQuantity, notes } = req.body;
    const item = await prisma.item.findUnique({ where: { id: itemId } });
    if (!item) return res.status(404).json({ error: "Item not found" });

    const qty = parseInt(suggestedQuantity, 10);
    const estimatedCost = Number((qty * item.unitCost).toFixed(2));

    const reorder = await prisma.reorderSuggestion.create({
      data: {
        itemId,
        suggestedQuantity: qty,
        estimatedCost,
        status: "DRAFT",
        notes: notes || "Manual reorder created by staff"
      },
      include: { item: true }
    });

    res.status(201).json(reorder);
  } catch (error) {
    res.status(500).json({ error: "Failed to create reorder" });
  }
});

// Approve reorder (Manager / Admin)
router.put("/:id/approve", authenticateToken, requireRole(["admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    const reorder = await prisma.reorderSuggestion.findUnique({
      where: { id },
      include: { item: true }
    });

    if (!reorder) return res.status(404).json({ error: "Reorder not found" });

    const updated = await prisma.reorderSuggestion.update({
      where: { id },
      data: { status: "APPROVED" }
    });

    await prisma.auditLog.create({
      data: {
        action: "REORDER_APPROVED",
        entity: "ReorderSuggestion",
        entityId: id,
        details: `Approved order of ${reorder.suggestedQuantity} ${reorder.item.unit} of '${reorder.item.name}' for supplier '${reorder.item.supplierName}' ($${reorder.estimatedCost})`,
        performedBy: req.user?.name || "Admin"
      }
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Failed to approve reorder" });
  }
});

// Reject reorder
router.put("/:id/reject", authenticateToken, requireRole(["admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await prisma.reorderSuggestion.update({
      where: { id },
      data: { status: "REJECTED" }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Failed to reject reorder" });
  }
});

// Mark as Ordered / PO Dispatched
router.put("/:id/order", authenticateToken, requireRole(["admin", "staff"]), async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await prisma.reorderSuggestion.update({
      where: { id },
      data: { status: "ORDERED" }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Failed to mark as ordered" });
  }
});

// Mark as Received -> logs new batch and increases stock
router.put("/:id/receive", authenticateToken, requireRole(["admin", "staff"]), async (req, res) => {
  try {
    const { id } = req.params;
    const { receivedQuantity, batchNumber, expiryDate, location = "Main Storage" } = req.body;

    const reorder = await prisma.reorderSuggestion.findUnique({
      where: { id },
      include: { item: { include: { batches: { where: { status: "ACTIVE" } } } } }
    });

    if (!reorder) return res.status(404).json({ error: "Reorder not found" });

    const qty = parseInt(receivedQuantity || reorder.suggestedQuantity, 10);
    const item = reorder.item;
    const previousStock = item.batches.reduce((sum, b) => sum + b.quantity, 0);
    const newStock = previousStock + qty;

    // Create new batch
    const batch = await prisma.batch.create({
      data: {
        itemId: item.id,
        batchNumber: batchNumber || `RECV-${Date.now().toString().slice(-4)}`,
        quantity: qty,
        initialQuantity: qty,
        location,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        status: "ACTIVE"
      }
    });

    // Update item stock
    await prisma.item.update({
      where: { id: item.id },
      data: { currentStock: newStock }
    });

    // Log transaction
    await prisma.stockTransaction.create({
      data: {
        itemId: item.id,
        batchId: batch.id,
        type: "IN",
        quantity: qty,
        previousStock,
        newStock,
        reason: `Reorder Received (PO #${reorder.id.slice(0, 8)})`,
        performedBy: req.user?.name || "Staff"
      }
    });

    // Mark reorder status as RECEIVED
    const updatedReorder = await prisma.reorderSuggestion.update({
      where: { id },
      data: { status: "RECEIVED" }
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: "REORDER_RECEIVED",
        entity: "Item",
        entityId: item.id,
        details: `Received ${qty} ${item.unit} of '${item.name}' from reorder PO #${reorder.id.slice(0, 8)}. Stock is now ${newStock}.`,
        performedBy: req.user?.name || "Staff"
      }
    });

    res.json({ success: true, reorder: updatedReorder, newStock });
  } catch (error) {
    console.error("Receive reorder error:", error);
    res.status(500).json({ error: "Failed to receive reorder" });
  }
});

module.exports = router;
