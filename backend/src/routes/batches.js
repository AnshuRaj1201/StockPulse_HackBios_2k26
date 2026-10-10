const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();
const prisma = new PrismaClient();

// Get all active batches sorted by FEFO (First-Expiry-First-Out)
router.get("/fefo", authenticateToken, async (req, res) => {
  try {
    const batches = await prisma.batch.findMany({
      where: {
        status: "ACTIVE",
        quantity: { gt: 0 }
      },
      include: {
        item: {
          select: {
            id: true,
            name: true,
            sku: true,
            category: true,
            department: true,
            unit: true
          }
        }
      },
      orderBy: [
        { expiryDate: "asc" }
      ]
    });

    const now = new Date();
    const enriched = batches.map((b) => {
      let daysRemaining = null;
      let statusLabel = "HEALTHY";

      if (b.expiryDate) {
        const exp = new Date(b.expiryDate);
        const diffMs = exp.getTime() - now.getTime();
        daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        if (daysRemaining < 0) {
          statusLabel = "EXPIRED";
        } else if (daysRemaining <= 15) {
          statusLabel = "CRITICAL_NEAR_EXPIRY";
        } else if (daysRemaining <= 45) {
          statusLabel = "WARNING_EXPIRING_SOON";
        }
      }

      return {
        ...b,
        daysRemaining,
        statusLabel
      };
    });

    res.json(enriched);
  } catch (error) {
    console.error("FEFO batches error:", error);
    res.status(500).json({ error: "Failed to fetch FEFO batches" });
  }
});

module.exports = router;
