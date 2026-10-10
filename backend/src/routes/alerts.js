const express = require("express");
const { getRecentAlerts, markAlertRead, triggerAlert } = require("../services/alertService");
const { authenticateToken, requireRole } = require("../middleware/auth");

const router = express.Router();

router.get("/", authenticateToken, (req, res) => {
  res.json(getRecentAlerts());
});

router.put("/:id/read", authenticateToken, (req, res) => {
  const updated = markAlertRead(req.params.id);
  res.json({ success: true, alert: updated });
});

router.post("/test", authenticateToken, async (req, res) => {
  const { title, message, severity } = req.body;
  const alert = await triggerAlert({
    type: "TEST",
    title: title || "Test Notification",
    message: message || "StockPulse alert system is functioning properly.",
    severity: severity || "INFO"
  });
  res.json({ success: true, alert });
});

module.exports = router;
