const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { authenticateToken, requireRole } = require("../middleware/auth");

const router = express.Router();
const prisma = new PrismaClient();

// Get all items with batch and stock counts
router.get("/", authenticateToken, async (req, res) => {
  try {
    const { category, department, search, lowStockOnly } = req.query;

    const where = {};
    if (category) where.category = category;
    if (department) where.department = department;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
        { barcode: { contains: search } }
      ];
    }

    const items = await prisma.item.findMany({
      where,
      include: {
        batches: {
          where: { status: "ACTIVE" },
          orderBy: { expiryDate: "asc" } // FEFO order
        }
      },
      orderBy: { name: "asc" }
    });

    const enriched = items.map((item) => {
      const activeBatchStock = item.batches.reduce((sum, b) => sum + b.quantity, 0);
      const isLowStock = activeBatchStock <= item.minThreshold;
      return {
        ...item,
        currentStock: activeBatchStock,
        isLowStock,
        earliestExpiry: item.batches.length > 0 ? item.batches[0].expiryDate : null
      };
    });

    if (lowStockOnly === "true") {
      return res.json(enriched.filter((i) => i.isLowStock));
    }

    res.json(enriched);
  } catch (error) {
    console.error("Get items error:", error);
    res.status(500).json({ error: "Failed to fetch items" });
  }
});

// Lookup by Barcode / QR (for html5-qrcode scanner)
router.get("/barcode/:code", authenticateToken, async (req, res) => {
  try {
    const { code } = req.params;
    const item = await prisma.item.findFirst({
      where: {
        OR: [{ barcode: code }, { sku: code }]
      },
      include: {
        batches: {
          where: { status: "ACTIVE" },
          orderBy: { expiryDate: "asc" }
        }
      }
    });

    if (!item) {
      return res.status(404).json({ error: "Item not found with scanned code: " + code });
    }

    const activeBatchStock = item.batches.reduce((sum, b) => sum + b.quantity, 0);
    res.json({
      ...item,
      currentStock: activeBatchStock,
      isLowStock: activeBatchStock <= item.minThreshold
    });
  } catch (error) {
    res.status(500).json({ error: "Barcode lookup failed" });
  }
});

// Get single item by ID
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const item = await prisma.item.findUnique({
      where: { id: req.params.id },
      include: {
        batches: { orderBy: { expiryDate: "asc" } },
        transactions: { take: 15, orderBy: { timestamp: "desc" } },
        reorders: { orderBy: { createdAt: "desc" } }
      }
    });

    if (!item) return res.status(404).json({ error: "Item not found" });
    const currentStock = item.batches.filter(b => b.status === "ACTIVE").reduce((sum, b) => sum + b.quantity, 0);

    res.json({
      ...item,
      currentStock,
      isLowStock: currentStock <= item.minThreshold
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch item" });
  }
});

// Create new item (Admin & Staff)
router.post("/", authenticateToken, requireRole(["admin", "staff"]), async (req, res) => {
  try {
    const {
      sku,
      barcode,
      name,
      category,
      department,
      unit,
      initialQuantity = 0,
      minThreshold = 10,
      safetyStock = 5,
      leadTimeDays = 4,
      unitCost = 0.0,
      supplierName = "Campus Vendor",
      supplierEmail = "orders@vendor.example.com",
      supplierPhone = "+91 98765 43210",
      batchNumber,
      expiryDate,
      location = "Main Storage"
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Item name is required" });
    }

    let finalSku = sku && sku.trim() ? sku.trim() : `SKU-${Date.now().toString().slice(-6)}`;
    let finalBarcode = barcode && barcode.trim() ? barcode.trim() : `BC-${Date.now().toString().slice(-6)}`;

    // Avoid collision crashes
    const existingSku = await prisma.item.findUnique({ where: { sku: finalSku } });
    if (existingSku) {
      finalSku = `${finalSku}-${Math.floor(100 + Math.random() * 900)}`;
    }
    const existingBarcode = await prisma.item.findUnique({ where: { barcode: finalBarcode } });
    if (existingBarcode) {
      finalBarcode = `${finalBarcode}-${Math.floor(100 + Math.random() * 900)}`;
    }

    const newItem = await prisma.item.create({
      data: {
        sku: finalSku,
        barcode: finalBarcode,
        name: name.trim(),
        category: category || "General",
        department: department || "General",
        unit: unit || "units",
        currentStock: Number(initialQuantity) || 0,
        minThreshold: Number(minThreshold) || 10,
        safetyStock: Number(safetyStock) || 5,
        leadTimeDays: Number(leadTimeDays) || 4,
        unitCost: Number(unitCost) || 0.0,
        supplierName: supplierName || "Campus Vendor",
        supplierEmail: supplierEmail || "orders@vendor.example.com",
        supplierPhone: supplierPhone || "+91 98765 43210"
      }
    });

    // Create initial batch if quantity > 0
    if (Number(initialQuantity) > 0) {
      await prisma.batch.create({
        data: {
          itemId: newItem.id,
          batchNumber: batchNumber || `BATCH-INIT-${Date.now().toString().slice(-4)}`,
          quantity: Number(initialQuantity),
          initialQuantity: Number(initialQuantity),
          location: location || "Main Storage",
          expiryDate: expiryDate ? new Date(expiryDate) : null,
          status: "ACTIVE"
        }
      });

      await prisma.stockTransaction.create({
        data: {
          itemId: newItem.id,
          type: "IN",
          quantity: Number(initialQuantity),
          previousStock: 0,
          newStock: Number(initialQuantity),
          reason: "Initial Stocking",
          performedBy: req.user?.name || "Staff"
        }
      });
    }

    // Automatically link with a supplier quote so AI procurement immediately has dealer data
    const firstSup = await prisma.supplier.findFirst();
    if (firstSup) {
      await prisma.supplierQuote.create({
        data: {
          itemId: newItem.id,
          supplierId: firstSup.id,
          unitPrice: Number(unitCost) > 0 ? Number(unitCost) : 10.0,
          deliveryDays: Number(leadTimeDays) || 3,
          minOrderQty: 1,
          isPreferred: true
        }
      });
    }

    // Audit Log
    await prisma.auditLog.create({
      data: {
        action: "CREATE",
        entity: "Item",
        entityId: newItem.id,
        details: `Registered item '${newItem.name}' (${newItem.sku}) with ${initialQuantity} ${newItem.unit}`,
        performedBy: req.user?.name || "Staff"
      }
    });

    res.status(201).json(newItem);
  } catch (error) {
    console.error("Create item error:", error);
    res.status(500).json({ error: error.message || "Failed to create item" });
  }
});

// Update item
router.put("/:id", authenticateToken, requireRole(["admin", "staff"]), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    delete updateData.id;
    delete updateData.batches;
    delete updateData.transactions;

    const updated = await prisma.item.update({
      where: { id },
      data: updateData
    });

    await prisma.auditLog.create({
      data: {
        action: "UPDATE",
        entity: "Item",
        entityId: id,
        details: `Updated item details for '${updated.name}'`,
        performedBy: req.user?.name || "Staff"
      }
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Failed to update item" });
  }
});

// Delete item (Admin only, with inventory protection safeguard)
router.delete("/:id", authenticateToken, requireRole(["admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    const item = await prisma.item.findUnique({
      where: { id },
      include: { batches: { where: { status: "ACTIVE" } } }
    });
    if (!item) return res.status(404).json({ error: "Item not found" });

    // Inventory protection safeguard: Protect items that have active stock
    const activeStock = item.batches.reduce((sum, b) => sum + b.quantity, 0);
    if (activeStock > 0 && req.query.force !== "true") {
      return res.status(400).json({
        error: `Protected: Cannot delete '${item.name}' while ${activeStock} ${item.unit} are actively held in inventory. Please deplete or dispose stock first.`
      });
    }

    await prisma.item.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        action: "DELETE",
        entity: "Item",
        entityId: id,
        details: `Deleted item '${item.name}' (${item.sku})`,
        performedBy: req.user?.name || "Admin"
      }
    });

    res.json({ message: "Item deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete item: " + error.message });
  }
});

module.exports = router;
