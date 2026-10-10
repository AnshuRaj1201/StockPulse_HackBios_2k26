require("dotenv").config();
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const itemsRoutes = require("./routes/items");
const stockRoutes = require("./routes/stock");
const forecastRoutes = require("./routes/forecast");
const reordersRoutes = require("./routes/reorders");
const alertsRoutes = require("./routes/alerts");
const analyticsRoutes = require("./routes/analytics");
const batchesRoutes = require("./routes/batches");
const dealersRoutes = require("./routes/dealers");
const subscriptionsRoutes = require("./routes/subscriptions");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/items", itemsRoutes);
app.use("/api/stock", stockRoutes);
app.use("/api/forecast", forecastRoutes);
app.use("/api/reorders", reordersRoutes);
app.use("/api/alerts", alertsRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/batches", batchesRoutes);
app.use("/api/dealers", dealersRoutes);
app.use("/api/subscriptions", subscriptionsRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    app: "StockPulse API",
    version: "1.0.0",
    theme: "Smart Campus & Small Business Operations",
    time: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🚀 StockPulse Backend running on port ${PORT}`);
  console.log(`📡 Health: http://localhost:${PORT}/api/health`);
  console.log(`===============================================`);
});
