const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const { JWT_SECRET } = require("../middleware/auth");

const router = express.Router();
const prisma = new PrismaClient();

// Signup / Register (Admin, Staff, Viewer)
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role = "staff", department = "General" } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: "Name, email, and password are required" });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: "An account with this email already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: ["admin", "staff", "viewer"].includes(role) ? role : "staff",
        department
      }
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role, department: user.department },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department
      }
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ error: error.message || "Failed to register account" });
  }
});

// Alias for /signup
router.post("/signup", async (req, res) => {
  req.url = "/register";
  return router.handle(req, res);
});

// Login with optional role check
router.post("/login", async (req, res) => {
  try {
    const { email, password, expectedRole } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    if (expectedRole && user.role !== expectedRole) {
      return res.status(403).json({
        error: `This account is registered as '${user.role.toUpperCase()}', not '${expectedRole.toUpperCase()}'. Please use the ${user.role.toUpperCase()} login portal.`
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role, department: user.department },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Demo login switch (quick one-click login for specific role & department)
router.post("/demo-login", async (req, res) => {
  try {
    const { role, department, email } = req.body; // e.g. role: "staff", department: "Chemistry Lab"

    let user = null;
    if (email) {
      user = await prisma.user.findUnique({ where: { email } });
    }
    if (!user && department) {
      user = await prisma.user.findFirst({
        where: { department: { contains: department } }
      });
    }
    if (!user && role) {
      user = await prisma.user.findFirst({ where: { role } });
    }
    if (!user) {
      user = await prisma.user.findFirst();
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role, department: user.department },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department
      }
    });
  } catch (error) {
    res.status(500).json({ error: "Demo login failed" });
  }
});

// List available staff accounts for direct staff login
router.get("/staff-list", async (req, res) => {
  try {
    const staffMembers = await prisma.user.findMany({
      where: { role: "staff" },
      select: { id: true, name: true, email: true, department: true }
    });
    res.json(staffMembers);
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch staff list" });
  }
});

// Current user
router.get("/me", async (req, res) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department
    });
  } catch (e) {
    res.status(401).json({ error: "Invalid token" });
  }
});

module.exports = router;
