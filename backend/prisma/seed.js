const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding StockPulse database with Multi-Supplier & Subscription Engine...");

  // Clean existing data
  await prisma.subscriptionDeliveryLog.deleteMany({});
  await prisma.recurringSubscription.deleteMany({});
  await prisma.dealerDispatchOrder.deleteMany({});
  await prisma.supplierQuote.deleteMany({});
  await prisma.supplier.deleteMany({});
  await prisma.stockTransaction.deleteMany({});
  await prisma.reorderSuggestion.deleteMany({});
  await prisma.batch.deleteMany({});
  await prisma.item.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.auditLog.deleteMany({});

  // Seed Users
  const passwordHash = await bcrypt.hash("admin123", 10);
  const staffHash = await bcrypt.hash("staff123", 10);
  const viewerHash = await bcrypt.hash("viewer123", 10);

  const admin = await prisma.user.create({
    data: {
      email: "admin@campus.edu",
      passwordHash,
      name: "Anshu Raj (Admin)",
      role: "admin",
      department: "Procurement & Labs"
    }
  });

  const staffChemistry = await prisma.user.create({
    data: {
      email: "staff.chemistry@campus.edu",
      passwordHash: staffHash,
      name: "Aditya Yadaw (Chemistry Lab In-charge)",
      role: "staff",
      department: "Chemistry Lab"
    }
  });

  await prisma.user.create({
    data: {
      email: "staff@campus.edu",
      passwordHash: staffHash,
      name: "Aditya Yadaw (Store In-charge)",
      role: "staff",
      department: "Chemistry Lab & Stores"
    }
  });

  const staffMess = await prisma.user.create({
    data: {
      email: "staff.mess@campus.edu",
      passwordHash: staffHash,
      name: "Akarshan Mishra (Central Mess In-charge)",
      role: "staff",
      department: "Central Mess"
    }
  });

  const staffStationery = await prisma.user.create({
    data: {
      email: "staff.stationery@campus.edu",
      passwordHash: staffHash,
      name: "Md. Adil Mokarram (Stationery In-charge)",
      role: "staff",
      department: "Stationery & Store"
    }
  });

  const staffHealth = await prisma.user.create({
    data: {
      email: "staff.health@campus.edu",
      passwordHash: staffHash,
      name: "Campus Health Center Staff",
      role: "staff",
      department: "Campus Health Center"
    }
  });

  await prisma.user.create({
    data: {
      email: "viewer@campus.edu",
      passwordHash: viewerHash,
      name: "Campus Auditor (Viewer)",
      role: "viewer",
      department: "Finance Inspection"
    }
  });

  console.log("Users created with distinct staff departments.");

  const now = new Date();
  const daysFromNow = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d;
  };
  const daysAgo = (days) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d;
  };

  // ----------------- SEED SUPPLIERS / DEALERS -----------------
  console.log("Seeding verified suppliers & dealers...");

  const supApex = await prisma.supplier.create({
    data: {
      name: "Apex BioLab Supplies",
      code: "SUP-APEX",
      contactPerson: "Vikram Malhotra",
      email: "orders@apexbio.example.com",
      phone: "+91 98450 11223",
      rating: 4.8,
      reliabilityRate: 98.2, // 98.2% on-time delivery
      defectRate: 0.5,       // only 0.5% return rate
      avgLeadDays: 2,
      location: "East Campus Science Corridor",
      verified: true
    }
  });

  const supChemGlobal = await prisma.supplier.create({
    data: {
      name: "ChemGlobal Distributors",
      code: "SUP-CHEMGLO",
      contactPerson: "Rohan Verma",
      email: "sales@chemglobal.example.com",
      phone: "+91 97120 44556",
      rating: 4.1,
      reliabilityRate: 84.5, // 84.5% on-time delivery (slower/inconsistent)
      defectRate: 2.4,       // 2.4% return rate
      avgLeadDays: 7,        // takes 7 days but cheaper
      location: "Metropolitan Chemical Depot",
      verified: true
    }
  });

  const supAgro = await prisma.supplier.create({
    data: {
      name: "AgroFresh Wholesale Co.",
      code: "SUP-AGRO",
      contactPerson: "Suresh Patel",
      email: "orders@agrofresh.example.com",
      phone: "+91 98230 77889",
      rating: 4.7,
      reliabilityRate: 96.0,
      defectRate: 0.8,
      avgLeadDays: 2,
      location: "Greenbelt Agricultural Market",
      verified: true
    }
  });

  const supKisan = await prisma.supplier.create({
    data: {
      name: "Kisan Direct Agro Mart",
      code: "SUP-KISAN",
      contactPerson: "Manoj Singh",
      email: "supply@kisandirect.example.com",
      phone: "+91 99112 33445",
      rating: 4.3,
      reliabilityRate: 88.0,
      defectRate: 1.5,
      avgLeadDays: 5,
      location: "Rural Logistics Hub",
      verified: true
    }
  });

  const supHealth = await prisma.supplier.create({
    data: {
      name: "HealthFirst Pharma Dealers",
      code: "SUP-HEALTH1",
      contactPerson: "Dr. Arvind Rao",
      email: "pharma@healthfirst.example.com",
      phone: "+91 94455 66778",
      rating: 4.9,
      reliabilityRate: 99.1,
      defectRate: 0.2,
      avgLeadDays: 1,
      location: "Medical City Complex",
      verified: true
    }
  });

  const supMedExp = await prisma.supplier.create({
    data: {
      name: "MedSupply Express",
      code: "SUP-MEDEXP",
      contactPerson: "Kavita Nair",
      email: "support@medexpress.example.com",
      phone: "+91 93344 55667",
      rating: 4.2,
      reliabilityRate: 86.0,
      defectRate: 1.8,
      avgLeadDays: 4,
      location: "Outer Ring Distribution Park",
      verified: true
    }
  });

  const supStationery = await prisma.supplier.create({
    data: {
      name: "Campus Books & Stationery",
      code: "SUP-STN",
      contactPerson: "Adil Khan",
      email: "support@campusbooks.example.com",
      phone: "+91 98770 12345",
      rating: 4.6,
      reliabilityRate: 94.0,
      defectRate: 0.6,
      avgLeadDays: 2,
      location: "University Market Plaza",
      verified: true
    }
  });

  // ----------------- SEED ITEMS & BATCHES -----------------
  console.log("Seeding campus items & supplier quotes...");

  // 1. Nitrile Examination Gloves
  const gloves = await prisma.item.create({
    data: {
      sku: "LAB-GLV-001",
      barcode: "890123456781",
      name: "Nitrile Examination Gloves (Box of 100)",
      category: "Lab Supplies",
      department: "Chemistry Lab",
      unit: "boxes",
      currentStock: 8,
      minThreshold: 10,
      safetyStock: 4,
      leadTimeDays: 2,
      unitCost: 12.5,
      supplierName: "Apex BioLab Supplies",
      supplierEmail: "orders@apexbio.example.com",
      supplierPhone: "+91 98450 11223",
      batches: {
        create: [
          {
            batchNumber: "GLV-2026-A1",
            quantity: 8,
            initialQuantity: 30,
            location: "Cabinet 3, Shelf A",
            expiryDate: daysFromNow(180),
            status: "ACTIVE"
          }
        ]
      },
      reorders: {
        create: [
          {
            suggestedQuantity: 20,
            estimatedCost: 250.0,
            avgDailyUsage: 0.71,
            daysUntilStockout: 11.2,
            status: "DRAFT",
            urgency: "HIGH",
            notes: "Usage ~5 boxes/week. Automated reorder recommendation prepared."
          }
        ]
      }
    }
  });

  // Multi-Supplier Quotes for Gloves (Demonstrates Trade-Off!)
  await prisma.supplierQuote.createMany({
    data: [
      {
        itemId: gloves.id,
        supplierId: supApex.id,
        unitPrice: 12.5,
        deliveryDays: 2,
        minOrderQty: 5,
        isPreferred: true
      },
      {
        itemId: gloves.id,
        supplierId: supChemGlobal.id,
        unitPrice: 10.5, // Cheaper by $2 but 7 days lead time!
        deliveryDays: 7,
        minOrderQty: 10,
        isPreferred: false
      }
    ]
  });

  // 2. Hydrochloric Acid 1M Reagent
  const hcl = await prisma.item.create({
    data: {
      sku: "LAB-HCL-002",
      barcode: "890123456782",
      name: "Hydrochloric Acid 1M Reagent Grade",
      category: "Lab Supplies",
      department: "Chemistry Lab",
      unit: "bottles (500ml)",
      currentStock: 4,
      minThreshold: 6,
      safetyStock: 2,
      leadTimeDays: 3,
      unitCost: 18.0,
      supplierName: "Apex BioLab Supplies",
      supplierEmail: "orders@apexbio.example.com",
      batches: {
        create: [
          {
            batchNumber: "HCL-2025-X",
            quantity: 4,
            initialQuantity: 10,
            location: "Chemical Vault - Shelf 1",
            expiryDate: daysFromNow(22),
            status: "ACTIVE"
          }
        ]
      }
    }
  });

  await prisma.supplierQuote.createMany({
    data: [
      {
        itemId: hcl.id,
        supplierId: supApex.id,
        unitPrice: 18.0,
        deliveryDays: 3,
        minOrderQty: 2,
        isPreferred: true
      },
      {
        itemId: hcl.id,
        supplierId: supChemGlobal.id,
        unitPrice: 15.2,
        deliveryDays: 6,
        minOrderQty: 4,
        isPreferred: false
      }
    ]
  });

  // 3. Sunflower Cooking Oil 15L
  const oil = await prisma.item.create({
    data: {
      sku: "MSS-OIL-001",
      barcode: "890123456783",
      name: "Sunflower Cooking Oil (15L Tin)",
      category: "Mess & Canteen",
      department: "Central Mess",
      unit: "tins",
      currentStock: 3,
      minThreshold: 5,
      safetyStock: 2,
      leadTimeDays: 2,
      unitCost: 32.0,
      supplierName: "AgroFresh Wholesale Co.",
      supplierEmail: "orders@agrofresh.example.com",
      batches: {
        create: [
          {
            batchNumber: "OIL-LOT-88",
            quantity: 3,
            initialQuantity: 15,
            location: "Mess Dry Pantry 2",
            expiryDate: daysFromNow(90),
            status: "ACTIVE"
          }
        ]
      }
    }
  });

  await prisma.supplierQuote.createMany({
    data: [
      {
        itemId: oil.id,
        supplierId: supAgro.id,
        unitPrice: 32.0,
        deliveryDays: 2,
        minOrderQty: 2,
        isPreferred: true
      },
      {
        itemId: oil.id,
        supplierId: supKisan.id,
        unitPrice: 29.5,
        deliveryDays: 5,
        minOrderQty: 5,
        isPreferred: false
      }
    ]
  });

  // 4. Premium Basmati Rice 25kg
  const rice = await prisma.item.create({
    data: {
      sku: "MSS-RIC-002",
      barcode: "890123456784",
      name: "Premium Basmati Rice (25kg Bag)",
      category: "Mess & Canteen",
      department: "Central Mess",
      unit: "bags",
      currentStock: 18,
      minThreshold: 8,
      safetyStock: 4,
      leadTimeDays: 3,
      unitCost: 28.5,
      supplierName: "AgroFresh Wholesale Co.",
      supplierEmail: "orders@agrofresh.example.com",
      batches: {
        create: [
          {
            batchNumber: "RIC-B2",
            quantity: 18,
            initialQuantity: 25,
            location: "Mess Grain Depot",
            expiryDate: daysFromNow(365),
            status: "ACTIVE"
          }
        ]
      }
    }
  });

  // 5. Blue Gel Pens
  const pens = await prisma.item.create({
    data: {
      sku: "STN-PEN-001",
      barcode: "890123456785",
      name: "QuickDry Blue Gel Pens (Pack of 20)",
      category: "Stationery",
      department: "Stationery & Store",
      unit: "packs",
      currentStock: 5,
      minThreshold: 12,
      safetyStock: 4,
      leadTimeDays: 2,
      unitCost: 6.0,
      supplierName: "Campus Books & Stationery",
      supplierEmail: "support@campusbooks.example.com",
      batches: {
        create: [
          {
            batchNumber: "PEN-2026-P",
            quantity: 5,
            initialQuantity: 40,
            location: "Aisle 2 - Shelf B",
            status: "ACTIVE"
          }
        ]
      }
    }
  });

  await prisma.supplierQuote.create({
    data: {
      itemId: pens.id,
      supplierId: supStationery.id,
      unitPrice: 6.0,
      deliveryDays: 2,
      minOrderQty: 5,
      isPreferred: true
    }
  });

  // 6. Paracetamol 500mg (Key Item for Monthly Scheduled Deliveries!)
  const pcm = await prisma.item.create({
    data: {
      sku: "MED-PCM-001",
      barcode: "890123456786",
      name: "Paracetamol Tablets 500mg (Box of 100)",
      category: "Medical",
      department: "Campus Health Center",
      unit: "boxes",
      currentStock: 14,
      minThreshold: 10,
      safetyStock: 5,
      leadTimeDays: 1,
      unitCost: 4.5,
      supplierName: "HealthFirst Pharma Dealers",
      supplierEmail: "pharma@healthfirst.example.com",
      batches: {
        create: [
          {
            batchNumber: "PCM-BATCH-EARLY",
            quantity: 4,
            initialQuantity: 20,
            location: "Dispensary Rack 1",
            expiryDate: daysFromNow(14),
            status: "ACTIVE"
          },
          {
            batchNumber: "PCM-BATCH-LATER",
            quantity: 10,
            initialQuantity: 20,
            location: "Dispensary Rack 1",
            expiryDate: daysFromNow(240),
            status: "ACTIVE"
          }
        ]
      }
    }
  });

  await prisma.supplierQuote.createMany({
    data: [
      {
        itemId: pcm.id,
        supplierId: supHealth.id,
        unitPrice: 4.5,
        deliveryDays: 1,
        minOrderQty: 2,
        isPreferred: true
      },
      {
        itemId: pcm.id,
        supplierId: supMedExp.id,
        unitPrice: 3.8, // Cheaper, but slower and lower quality
        deliveryDays: 4,
        minOrderQty: 5,
        isPreferred: false
      }
    ]
  });

  // Historical glove usage
  const gloveUsages = [
    { qty: 5, daysAgo: 21, reason: "Organic Chemistry Lab session" },
    { qty: 6, daysAgo: 14, reason: "Biochemistry practical exam" },
    { qty: 5, daysAgo: 7, reason: "Weekly student lab work" },
    { qty: 6, daysAgo: 2, reason: "Research scholars synthesis run" }
  ];

  for (const u of gloveUsages) {
    await prisma.stockTransaction.create({
      data: {
        itemId: gloves.id,
        type: "OUT",
        quantity: u.qty,
        previousStock: 30,
        newStock: 25,
        reason: u.reason,
        performedBy: "Aditya Yadaw",
        timestamp: daysAgo(u.daysAgo)
      }
    });
  }

  // ----------------- SEED AUTO DEALER DISPATCH ORDER -----------------
  console.log("Seeding automated dealer dispatch log...");
  await prisma.dealerDispatchOrder.create({
    data: {
      itemId: gloves.id,
      supplierId: supApex.id,
      quantity: 20,
      unitPrice: 12.5,
      totalCost: 250.0,
      status: "AUTO_DISPATCHED",
      triggerType: "AUTO_LOW_STOCK",
      dispatchMessage: "AUTO-DISPATCH: Nitrile Gloves dropped to 8 boxes (below threshold 10). Urgent PO generated for 20 boxes to Apex BioLab Supplies.",
      dealerContactEmail: supApex.email,
      expectedDeliveryDate: daysFromNow(2)
    }
  });

  // ----------------- SEED RECURRING MONTHLY SUBSCRIPTIONS (DAY 5 EVERY MONTH) -----------------
  console.log("Seeding monthly scheduled delivery subscriptions (Day 5 of every month)...");

  const sub1 = await prisma.recurringSubscription.create({
    data: {
      customerName: "Dr. Sarah Thomas (Dispensary Ward A)",
      customerEmail: "sarah.health@campus.edu",
      customerPhone: "+91 98112 44332",
      itemId: pcm.id,
      quantity: 3,
      dayOfMonth: 5, // On the 5th of every month
      customerPermission: true, // Permission granted!
      status: "ACTIVE",
      destination: "Campus Health Center - Emergency Ward A",
      notes: "Monthly scheduled chronic care dispensary replenishment (5th of month)",
      nextDeliveryDate: new Date(now.getFullYear(), now.getMonth(), 5)
    }
  });

  const sub2 = await prisma.recurringSubscription.create({
    data: {
      customerName: "Prof. R. K. Sharma (Biochem Lab)",
      customerEmail: "rksharma.chem@campus.edu",
      customerPhone: "+91 98450 77123",
      itemId: gloves.id,
      quantity: 2,
      dayOfMonth: 5, // On the 5th of every month
      customerPermission: true,
      status: "ACTIVE",
      destination: "Science Block B, Room 204",
      notes: "Monthly standing lab gloves allocation",
      nextDeliveryDate: new Date(now.getFullYear(), now.getMonth(), 5)
    }
  });

  // Initial audit log
  await prisma.auditLog.create({
    data: {
      action: "INIT_SYSTEM",
      entity: "System",
      entityId: "SYSTEM",
      details: "StockPulse v2.0 initialized with verified dealer scorecards, AI trade-off quotes, and Day-5 recurring subscriptions.",
      performedBy: "Anshu Raj"
    }
  });

  console.log("Seeding complete! Successfully initialized StockPulse v2.0 data.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });