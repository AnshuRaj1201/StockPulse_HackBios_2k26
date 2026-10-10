# StockPulse
> **A Smart Campus / Small Business Inventory & Reorder Tracker**  
> *Theme*: Smart Campus & Small Business Operations  
> *Event*: HACKBIOS  
> *Team*: **War Machine** (Anshu Raj, Aditya Kumar Yadaw, Akarshan Mishra, Md. Adil Mokarram)

---

## 🎯 Goal
> **"Never run out of stock, never over-order — and know exactly WHERE, WHEN, and HOW MUCH to buy."**

StockPulse eliminates paper registers, scattered spreadsheets, costly emergency stockouts, and expiry wastage across campus labs, hostel mess/canteens, medical rooms, and stationery shops.

---

## 🚀 Key Features Implemented

### 1. ⚡ Real-Time Tracking & Fast Logging
- Camera-based barcode & QR scanning (`html5-qrcode`) right in the browser.
- Built-in 1-tap simulator for instantaneous barcode testing without physical labels.
- One-tap quick stock increment (`+`) and decrement (`-`) with reason logging.
- Printable QR label generator (`qrcode.react`) for physical store bins and shelves.

### 2. 🤝 Automated Low-Stock Dealer Dispatch (NEW in v2.0)
- Verified dealer records with contact info, delivery history, and live catalog quotes.
- When an item drops to low stock or out-of-stock, the system **automatically dispatches a purchase order directly to the dealer**.
- Autonomous dealer order tracking: `AUTO_DISPATCHED` &rarr; `ACKNOWLEDGED` &rarr; `SHIPPED` &rarr; `DELIVERED`.
- 1-click **Receive & Add Stock** automatically restocks inventory upon dealer delivery!

### 3. 🧠 AI Supplier Recommendation & Trade-Off Engine (NEW in v2.0)
- **Multi-Criteria Evaluation Matrix**: Compares suppliers across 5 dimensions:
  1. **Product Unit Price & Total Cost**
  2. **Delivery Transit Time (Lead Days)**
  3. **Historical On-Time Delivery Reliability (%)**
  4. **Quality & Defect Return Rate (%)**
  5. **Urgency & Required Quantity**
- **Dynamic Weighting**: Automatically elevates delivery speed and reliability when stock is running out fast, and prioritizes cost-efficiency during planned routine orders.
- **AI Plain-Language Explainer**: Explains trade-offs in simple, human language:
  > *"Recommended: Apex BioLab Supplies (Score: 96.3/100). Current stock of Nitrile Gloves risks a stockout within 1.5 days. Although ChemGlobal offers a lower price ($10.50 vs $12.50, saving $2.00/box), their 7-day transit risks an immediate 5.5-day lab shutdown. Apex BioLab delivers in 2 days with a 98.2% on-time record, protecting lab continuity."*

### 4. 📅 Monthly Scheduled Deliveries & Auto-Deductions (NEW in v2.0)
- **Standing Recurring Deliveries (e.g., 5th of every month)**: Customer subscriptions for recurring essentials (e.g., Paracetamol for the Dispensary or Lab Gloves for Biochemistry).
- **Customer Opt-in Consent Verification**: Permission toggle (`GRANTED` vs `REVOKED`) ensures delivery only executes with valid customer consent.
- **Automated Inventory Deduction**: Upon scheduled delivery execution, stock is **automatically deducted from inventory using FEFO batch ordering**.
- **1-Click Simulation Runner**: Allows judges and users to simulate Day-5 monthly fulfillment in 1 click and watch inventory counts update in real time!
- **Customer Notification Logs**: Records delivery confirmations and logs audit trail entries.

### 5. ⏳ FEFO (First-Expiry-First-Out) & Wastage Prevention
- Strict batch-level tracking with manufacturing and expiry countdowns.
- Automatically prioritizes earliest-expiring stock when items are issued.
- One-tap expired waste disposal and logging.

### 6. 🔐 Dedicated Authentication Portals
- **👑 Admin Portal**: Direct 1-tap login as Lead Admin (**Anshu Raj**, `admin@campus.edu`) + Password Sign-In & Sign-Up.
- **🛠️ Staff Operations Portal**: Separate dedicated 1-tap login button for each campus department:
  - 🧪 **Chemistry Lab In-charge**: Aditya Yadaw (`staff.chemistry@campus.edu`)
  - 🍲 **Central Mess & Canteen**: Akarshan Mishra (`staff.mess@campus.edu`)
  - 📚 **Stationery & Store**: Md. Adil Mokarram (`staff.stationery@campus.edu`)
  - 🏥 **Campus Health Center**: Health Staff (`staff.health@campus.edu`)
- **👁️ Auditor / Viewer Portal**: 1-tap sign-in as Campus Auditor (`viewer@campus.edu`).

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide React, html5-qrcode, qrcode.react |
| **Backend** | Node.js, Express REST API, Prisma ORM, JWT Auth, CORS |
| **Database** | SQLite (zero-config, portable, ready for PostgreSQL) |
| **Procurement AI** | Multi-criteria scoring algorithm & natural language trade-off generator |
| **Forecasting Engine** | Python 3 + JS mirror, Exponential Smoothing, Moving Average, ROP math |
| **Logistics Engine** | Monthly scheduled recurring delivery runner with automated FEFO deduction |

---

## 🚀 How to Run the Project

### Option 1: 1-Click Windows Runner
Double-click:
```powershell
C:\Users\anshu\Documents\COMPUTER SCIENCE ENGINEERING\HackBios 2026\stockpulse\start.bat
```

### Option 2: PowerShell Execution
1. **Backend**:
   ```powershell
   cd "C:\Users\anshu\Documents\COMPUTER SCIENCE ENGINEERING\HackBios 2026\stockpulse\backend"
   npm start
   ```
2. **Frontend**:
   ```powershell
   cd "C:\Users\anshu\Documents\COMPUTER SCIENCE ENGINEERING\HackBios 2026\stockpulse\frontend"
   npm run dev
   ```
   Open `http://localhost:3000` in your web browser.

---

## 🧪 Demonstration Walkthrough (For Hackathon Judges)

1. **AI Supplier Trade-Off & Recommendation**:
   - Navigate to the **AI Sourcing & Dealers** tab.
   - Select **Nitrile Examination Gloves** (8 boxes left, high urgency).
   - Read the **AI Procurement Decision Support** trade-off explanation: notice how the AI explains that saving $2.00/box with ChemGlobal isn't worth the 7-day transit delay that risks an emergency stockout!
   - Click **"Auto-Dispatch to Recommended Dealer"** to fire an autonomous PO.
2. **Autonomous Dealer Dispatches Feed**:
   - In the **Autonomous Dealer Dispatches** sub-tab, see orders automatically fired when items hit low stock.
   - Click **"Receive & Add Stock"** when a delivery arrives to watch inventory instantly increment.
3. **Monthly Scheduled Delivery (Day 5)**:
   - Navigate to the **Day-5 Deliveries** tab.
   - View standing subscriptions (e.g. Paracetamol for Dispensary Ward A, Gloves for Biochem Lab).
   - Check the **Customer Consent Active** status.
   - Click **"⚡ Simulate / Run Scheduled Deliveries (Day 5)"** &rarr; watch the stock automatically deduct, customer notification confirm, and inventory update live on the dashboard!
4. **Separate Role Logins**:
   - In the top-right header, click on your user profile pill to access separate logins for Admin (Anshu Raj), Chemistry Lab (Aditya Yadaw), Mess (Akarshan Mishra), and Stationery (Md. Adil Mokarram).