# AB Energy Solutions — Solar CRM & Business OS
## Standard Operating Procedure (SOP) & Comprehensive System Manual

---

## 1. System Overview & Architectural Purpose

**AB Energy Solutions Solar CRM & Business OS** is a unified, end-to-end digital operating system designed specifically for rooftop and distributed commercial solar Engineering, Procurement, and Construction (EPC) companies.

Unlike general-purpose CRMs, this platform natively bridges the entire 30-to-90 day solar project lifecycle:
1. **Demand Generation & Sales Pipeline:** Lead ingestion, qualification, automated distribution, and SIM call tracking.
2. **Technical Site Survey & Rooftop Engineering:** Mobile-first roof auditing, shadow mapping, azimuth/tilt checks, electrical LT panel distance measurement, and Bill of Materials (BOM) drafting.
3. **Quotation & Proposal Engine:** PM Surya Ghar Central Government subsidy modeling, Tamil Nadu State Top-Up subsidy calculation, itemized vs composite GST tax engines, tiered system packages, and instant PDF proposal generation.
4. **Negotiation Hub & Customer Advances:** Advance booking receipts, payment screenshot uploads, accounts team verification, and project conversion.
5. **EPC Project Delivery & Field Execution:** 8-stage project kanban, milestone tracking, field technician checklists, attendance logging, and DISCOM net-metering synchronization.
6. **Supply Chain & Warehouse Inventory:** Multi-warehouse stock tracking, project-level material reservations, vendor Purchase Orders (PO), and Goods Receipt Notes (GRN).
7. **Billing, Invoicing & Project Financials:** Milestone payment schedules (20% Advance / 60% Material Dispatch / 20% Commissioning), GST-compliant tax invoices, operating expenses, and project gross margin analysis.
8. **25-Year Post-Commissioning & O&M Care:** Digital warranty vault, customer service ticketing desk with SLA tracking, and Annual Maintenance Contracts (AMC).
9. **Customer Self-Service Portal:** Client-facing tracking portal for homeowners and factory owners to view real-time progress, download documents, and submit service tickets.
10. **SIM Call Hub & Telephony Bridge:** Companion Android application synchronization, auto-matching phone calls to customer records, and click-to-call dialing.

---

## 2. Role-Based Access Control (RBAC) & Persona SOP

The application enforces strict role-based access. Operational staff only see what is relevant to their function, while the Super Admin maintains company-wide operational and financial oversight.

### 2.1 Staff Personas & Access Boundaries

| Role | Username / Identity | Department | Core SOP Scope & Capabilities |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `superadmin` / `admin` | Executive Management | Full administrative access: view and edit all data, manage users and roles, approve discounts, review audit logs, and inspect financial margins. |
| **Sales Manager** | `salesmanager` | Solar Residential & Commercial Sales | Supervises lead assignment, reviews sales pipeline stages, approves quotation discounts, and monitors sales team performance. |
| **Sales Executive** | `salesexecutive` | Direct Solar Sales | Manages assigned leads, conducts follow-up calls, logs notes, configures preliminary quotes, and leads customer negotiations. |
| **Survey Engineer** | `surveyengineer` | Technical & Site Engineering | Mobile field visits: performs rooftop audits, captures shade and orientation data, uploads photos and electricity bills, and submits BOM proposals for review. |
| **Project Manager** | `projectmanager` | Solar EPC Operations | Reviews and approves engineer BOMs, manages project kanban stages, dispatches installation teams, and coordinates DISCOM net-metering filings. |
| **Installation Team** | `installation` | Field EPC & Commissioning | Executes physical roof installation, logs daily attendance and photo progress, checks technical safety checklists, and performs inverter earthing tests. |
| **Accounts & Finance** | `accounts` | Finance & Taxation | Verifies advance payment receipts and screenshots, issues milestone GST invoices, records vendor payments, logs project expenses, and reconciles balances. |
| **Service Team** | `service` | O&M & Client Service | Handles post-commissioning maintenance, responds to service tickets within 24-hour SLAs, tracks equipment warranties, and manages AMC renewals. |
| **Customer** | `customer` | Client Portal | End-user self-service view: tracks project progress, accesses signed agreements, tax invoices, and warranty cards, and submits service requests. |

### 2.2 Operational Procedure: User Account Management
1. **Accessing User Directory:** Super Admin navigates to **People & RBAC** > **User Directory & RBAC**.
2. **Creating a User Account:** Click **+ Add User**, provide Full Name, unique Username, secure Password, Role, Department, and Branch Location (`Valapady` or `Bengaluru HQ`). Click **Create Account**.
3. **Impersonation ("View As"):** Super Admins can click the **View As** button beside any user to instantly simulate that user's view for quality assurance and field support without knowing their password.
4. **Deactivating / Deleting Users:** Click **Deactivate** to revoke system access immediately while preserving lead and project history, or click the **Trash icon** to permanently delete the account.

---

## 3. Module 1: Lead Intake, Pipeline & SIM Call Hub SOP

### 3.1 Lead Ingestion & Qualification
* **Automatic Ingestion:** Web inquiries, landing pages, Meta lead forms, and Google Ads feed directly into the CRM database.
* **Manual Walk-In Entry:**
  1. Click **+ Add Solar Lead** from the Leads Pipeline view.
  2. Enter Consumer Name, Primary Phone (10 digits), Email, Address, City, State, and Pincode.
  3. Enter Customer Sizing Variables: Monthly Electricity Bill (₹), Roof Area (sq. ft), Roof Type (`RCC Flat`, `Metal Sheet`, `Tiled`, `Elevated`), Connection Space (`Single Space`, `Multi Space`), and DISCOM Name (e.g. `TANGEDCO`, `BESCOM`).
  4. System automatically runs preliminary feasibility:
     $$\text{Recommended Capacity (kW)} = \min\left(\frac{\text{Monthly Bill}}{1200}, \frac{\text{Roof Area}}{100}\right)$$
  5. Select Lead Source (`Website`, `WhatsApp`, `Google Ads`, `Referral`, `Walk-in`) and Initial Priority (`High`, `Medium`, `Low`).
  6. Choose whether to **Schedule Site Survey Immediately** or leave in qualification. Click **Save Lead**.

### 3.2 Lead Assignment & Workload Balancing
* **Manual Assignment:** Sales Managers can use the inline dropdown in the Lead Table to assign any lead to a specific Sales Executive.
* **Auto-Assign All Leads:** Click **Auto-Assign Leads** at the top of the Leads view. The system distributes unassigned leads evenly among active Sales Executives using round-robin logic.

### 3.3 SIM Call Hub & Telephony Bridge SOP
* **Purpose:** Synchronizes field executive phone calls made via SIM cards with lead and customer activity timelines.
* **Mobile Bridge Connection:** The companion Android call tracker app uploads call logs to `/api/telephony/sync` via secure Bearer token.
* **Call Matching Logic:** The server strips formatting from phone numbers (`+91`, spaces, hyphens) and matches incoming/outgoing/missed calls against the `leads` and `customers` database tables.
* **Click-to-Call Procedure:**
  1. Click the **Call** button (green phone icon) on any lead row.
  2. If running on a mobile browser or paired workstation, it initiates the phone dialer.
  3. The call timestamp, call type (`OUTGOING`, `INCOMING`, `MISSED`), and duration are recorded in the lead activity log.

### 3.4 Follow-Up Activity Management
1. Navigate to **Sales & CRM** > **Follow-ups**.
2. Review due calls categorized into **Urgent**, **Today**, **Upcoming**, and **Completed**.
3. After completing a phone interaction, click the checkmark to mark as done and type a summary note (e.g., *"Customer requested 5kW quote with bifacial panels; site visit requested Saturday"*).
4. System automatically updates `last_contacted_at` on the linked Lead record.

---

## 4. Module 2: Technical Rooftop Site Survey SOP

The Site Survey is the engineering foundation of every solar project. An inaccurate survey leads to structural redesigns, DISCOM approval failures, and installation delays.

### 4.1 Survey Scheduling & Engineer Dispatch
1. When a lead agrees to a rooftop audit, click **Survey** on the lead row.
2. Select the assigned **Survey Engineer**, audit **Date**, and time window (e.g., `10:00 AM - 12:00 PM`).
3. Click **Schedule Survey**. Lead status automatically moves to `Site Survey Scheduled`.

### 4.2 Mobile Field Audit Execution SOP
The Survey Engineer opens the CRM on a mobile device or tablet:
1. Navigate to **Projects & EPC** > **Site Surveys** and select the assigned survey.
2. **Step 1: Rooftop Physical Measurements:**
   - Measure total rooftop length and width. Calculate gross area.
   - Measure perimeter parapet wall height (determines minimum mounting structure height to avoid parapet shadows).
   - Record roof construction type: `RCC Flat Concrete`, `Trapezoidal Metal Sheet`, `Mangalore Tiled`, or `Elevated Canopy`.
3. **Step 2: Shadow & Obstacle Profile:**
   - Identify shadow-casting structures: Overhead water tanks, lift machine rooms, staircase headrooms, adjacent high-rise buildings, and large trees.
   - Document shadow timings (e.g. morning 9:00 AM shadow or late afternoon 4:00 PM shadow).
   - Enter **Net Shadow-Free Usable Area (sq. ft)**.
4. **Step 3: Solar Array Alignment & Tilt:**
   - Record True South compass bearing (Azimuth angle: ideally $180^\circ$ South $\pm 15^\circ$).
   - Record recommended structural tilt angle ($10^\circ$ to $15^\circ$ for South India/Tamil Nadu latitude).
5. **Step 4: Electrical Infrastructure Audit:**
   - Inspect main electrical distribution board (LT Panel) and meter room location.
   - Measure DC Cable run distance from rooftop array to inverter location (meters).
   - Measure AC Cable run distance from inverter to LT Panel (meters).
   - Verify Earthing Pit location feasibility (requires dedicated chemical earthing pits for Lightning Arrester, DC side, and AC side).
   - Verify DISCOM Sanctioned Load against proposed capacity:
     $$\text{System Capacity (kW)} \le \text{Sanctioned Load (kW)}$$
     *(If proposed solar capacity exceeds sanctioned load, flag lead for DISCOM Load Enhancement application).*
6. **Step 5: Media & Document Capture:**
   - Take and upload at least 4 clear photos:
     1. Rooftop full view facing South.
     2. Main electricity meter displaying consumer number.
     3. Distribution board / LT panel switchgear.
     4. Proposed inverter mounting wall and earthing pit ground location.
   - Upload latest physical electricity bill photo.
7. **Step 6: Preliminary Field Bill of Materials (BOM):**
   - Enter recommended capacity (kW), panel count, preferred inverter make, and mounting structure type.
   - Click **Submit Survey for Review**. Status changes to `Submitted for Review`.

### 4.3 Engineering Review & Project Manager Approval
1. Project Manager reviews survey data, shadow notes, and uploaded photos under **Site Surveys**.
2. If roof area or electrical sizing is deficient, click **Request Changes** and enter technical notes for the surveyor.
3. If valid, click **Approve Survey**.
4. System automatically triggers generation of the technical Bill of Materials (BOM) record and unlocks the quotation generator.

---

## 5. Module 3: Authoritative Solar Calculation & Quotation Engine SOP

Quotations must be 100% accurate, legally binding, and reflect exact Central and State solar subsidies, itemized GST taxation rules, and engineering hardware.

### 5.1 Solar Sizing & Generation Calculations
* **Daily Generation Rule:** 1 kW of grid-tied solar generates an average of $4.2\text{ kWh (units)}$ per day under Indian solar irradiance conditions ($1,500\text{ units/kW/year}$).
* **Annual CO2 Offset:** $1\text{ kW} \approx 1.2\text{ tonnes of CO}_2\text{ offset/year}$ ($\approx 55\text{ trees planted}$).

### 5.2 Financial Subsidy Modeling SOP
The calculation engine strictly incorporates Indian national and state subsidies:
* **PM Surya Ghar: Muft Bijli Yojana (Central Financial Assistance - CFA):**
  - **1 kW System:** ₹30,000 flat subsidy
  - **2 kW System:** ₹60,000 flat subsidy
  - **3 kW up to 10 kW System:** ₹78,000 maximum capped subsidy
  - **Commercial / Industrial Systems:** ₹0 subsidy (Eligible for 40% Accelerated Depreciation tax benefit).
* **Tamil Nadu State Top-Up Subsidy (G.O. 102):**
  - Additional ₹22,000 state subsidy for eligible residential consumers with domestic tariff.
  - Total combined subsidy for 3 kW residential: ₹1,00,000 (₹78,000 Central + ₹22,000 State).
* **Net Customer Investment:**
  $$\text{Net Payable} = \text{Gross Contract Amount (incl. GST)} - \text{Total Government Subsidy}$$

### 5.3 Authoritative GST Tax Calculation Engines
The system supports two legal tax modes:
1. **Itemized GST Mode (Standard Hardware + Services):**
   - Solar PV Panels (HSN 8541): 5% GST (or applicable rate)
   - Solar Inverters (HSN 8504): 12% GST
   - Galvanized Mounting Structure (HSN 7308): 18% GST
   - DC/AC Cables, Switchgear, BOS (HSN 8544): 18% GST
   - Installation, Testing & Commissioning Service (SAC 9954): 18% GST
2. **Composite Solar EPC Contract Mode (70:30 Statutory Rule):**
   - Deemed Goods Component (70% of contract value): Taxed at 12% GST
   - Deemed Services Component (30% of contract value): Taxed at 18% GST
   - **Blended Effective GST Rate:** $(0.70 \times 12\%) + (0.30 \times 18\%) = 8.4\% + 5.4\% = \mathbf{13.80\%}$
   - The engine automatically calculates CGST ($6.90\%$) and SGST ($6.90\%$) for intra-state supply, or IGST ($13.80\%$) for inter-state supply.

### 5.4 Quotation Creation & Revision SOP
1. Navigate to **Sales & CRM** > **Quotations** and click **+ New Quotation**.
2. Select the target customer from the dropdown. (System auto-populates address, phone, and recommended capacity from approved survey).
3. Select System Package Tier:
   - **Standard Package:** Tier-1 Mono PERC Half-Cut 550W modules + Single MPPT on-grid string inverter.
   - **Premium Bifacial Package:** High-efficiency TopCon Bifacial Dual-Glass modules + Dual MPPT inverter with cloud WiFi monitoring + Elevated Walkway structure.
   - **Commercial Heavy Duty:** High-capacity string inverters + CEIG compliance + Lightning Arrester radius protection.
4. Enter any authorized customer discount (₹).
5. Click **Generate Quotation**.
6. The system generates collision-free ID `QT-2026-xxxxx-V1`, calculates all line items, compiles financial ROI projections, and renders the proposal document.
7. **Customer Revisions:** When negotiating, click **Edit Quote** to create Version 2 (`-V2`) or Version 3 (`-V3`). Previous versions are preserved in edit history for audit compliance.
8. **Digital PDF Export:** Click **Print / Export PDF** to download the branded Techno-Commercial proposal containing company profile, component data sheets, generation projections, terms of warranty, and payment schedules.

---

## 6. Module 4: Negotiation Hub & Customer Advances SOP

### 6.1 Negotiation Tracking
1. Navigate to **Sales & CRM** > **Deals & Pipeline** or **Negotiation Hub**.
2. Track proposals in `Quotation Sent` stage.
3. Review customer feedback regarding price, brand preference, or payment terms.

### 6.2 Advance Payment Collection Procedure
Solar EPC projects require a booking advance before detailed engineering and procurement commence:
1. Navigate to **Finance & Accounts** > **Customer Advances** or open the quotation details.
2. Click **Record Advance Payment**.
3. Enter:
   - **Advance Amount Received (₹):** Standard is 20% of contract value.
   - **Payment Date:** Date credit appeared in company bank account.
   - **Payment Mode:** `NEFT/RTGS`, `IMPS`, `UPI`, `Cheque`, or `Direct Bank Transfer`.
   - **Bank Reference / UTR Number:** Official bank transaction reference.
   - **Payment Screenshot / Deposit Slip:** Upload photo/PDF proof of transfer.
4. Click **Save Advance Record**. Status moves to `Pending Accounts Verification`.
5. Accounts Manager reviews bank statement and verifies the UTR. Upon clicking **Verify & Approve**, the advance is locked and credited against the project ledger.
6. The quotation status transitions to `Won (Customer Accepted)`.

### 6.3 Converting Won Quotation to Active EPC Project
1. Open the accepted quotation and click **Convert to EPC Project**.
2. System automatically:
   - Creates a new Project record in the Projects database.
   - Migrates customer name, address, phone, system size (kW), and quotation reference.
   - Allocates the approved Bill of Materials to the project.
   - Initializes Milestone 1 Invoice (Booking Deposit).
   - Changes linked Lead status to `Won`.

---

## 7. Module 5: EPC Project Execution & Field Milestones SOP

### 7.1 The 8 EPC Project Lifecycle Stages

```
[1. Booking Confirmed]
          │
          ▼
[2. Net Metering Application Filed]
          │
          ▼
[3. Material Planning & Dispatch] ──(Requires Milestone 2 Payment: 60%)
          │
          ▼
[4. Installation In Progress]
          │
          ▼
[5. Structure & Module Mounting Completed]
          │
          ▼
[6. Inverter Wiring & Testing]
          │
          ▼
[7. DISCOM Inspection & Net-Meter Synchronization]
          │
          ▼
[8. Plant Commissioned & Handed Over]
```

### 7.2 Stage-by-Stage Operational SOP
* **Stage 1: Booking Confirmed:** Project Manager verifies contract documents, customer identity proof (Aadhaar), property tax receipt, and electricity bill.
* **Stage 2: Net Metering Application Filed:** Operations team logs into the DISCOM portal (e.g. TANGEDCO/BESCOM), submits grid connectivity application, and records application acknowledgement number.
* **Stage 3: Material Planning & Dispatch:**
  - Verify Milestone 2 (60% Pre-Dispatch payment) has cleared.
  - Review material reservation in warehouse inventory.
  - Generate dispatch manifest and assign delivery vehicle.
* **Stage 4: Installation In Progress:**
  - Field installation crew arrives on site.
  - Crew leader logs attendance on mobile device.
  - Mark delivery of solar panels, inverter, mounting rails, and hardware.
* **Stage 5: Structure & Module Mounting Completed:**
  - Fasten base plates with anchor bolts.
  - Mount rails, place solar PV modules, and torque mid/end clamps to specification.
  - Upload photo proof of completed array mounting.
* **Stage 6: Inverter Wiring & Testing:**
  - Complete DC cabling inside UV-resistant conduit.
  - Wire DC Surge Protection Devices (SPD) and DC Isolator switch.
  - Wire on-grid inverter AC output to AC Distribution Box (ACDB).
  - Measure earth pit resistance using earth tester (must be $< 5\ \Omega$).
  - Perform inverter cold startup test and verify string open-circuit voltage ($V_{oc}$).
* **Stage 7: DISCOM Inspection & Net-Meter Sync:**
  - Assistant Executive Engineer (AEE) from DISCOM inspects installation safety, anti-islanding protection, and dual-source disconnect.
  - Old unidirectional energy meter is replaced with bidirectional Net-Meter.
* **Stage 8: Commissioned & Handed Over:**
  - Solar generation switch turned ON.
  - Inverter mobile WiFi app paired with homeowner's network.
  - Customer handover pack delivered (Warranty cards, commissioning report, user manual).

### 7.3 Installation Quality & Safety Checklist SOP
Before any project can move to Stage 8, the field technician must complete the mandatory safety checklist in the mobile app:
1. `[x]` Anchor fasteners pull-out test verified.
2. `[x]` Mid and end clamp bolt torque checked.
3. `[x]` DC cable polarity verified prior to inverter connection.
4. `[x]` Dedicated chemical earthing connected to panels, structure, and inverter.
5. `[x]` Danger / Caution signage affixed to ACDB and DCDB boxes.
6. `[x]` Rooftop cleaned of metal filings, cable ties, and debris.

---

## 8. Module 6: Supply Chain, Warehouse & Inventory SOP

### 8.1 Inventory Catalog Management
All solar hardware items are tracked under **Supply Chain & Inventory** with real-time stock counts:
* **Solar PV Modules:** Brand (Waaree, Adani, Vikram, Tata Power), Type (Mono PERC, Bifacial TopCon), Wattage (540Wp, 550Wp, 580Wp), stock quantity (units).
* **Grid-Tied Inverters:** Brand (Solis, Sungrow, Growatt, Enphase), Phase (Single Phase 3kW/5kW, Three Phase 10kW-50kW), stock quantity.
* **Mounting Structures:** Galvanized aluminum rails, L-feet, mid-clamps, end-clamps, fasteners (sets).
* **Cables & Electrical BOS:** 4 sq. mm / 6 sq. mm DC solar cables (meters), AC cables, ACDB/DCDB boxes, earthing rods, chemical compound bags.

### 8.2 Material Allocation SOP
To prevent stockouts on committed projects:
1. When a quotation is converted to an EPC Project, the Project Manager reviews the Bill of Materials.
2. Click **Allocate Stock**.
3. The specified quantities of modules, inverters, and BOS are tagged as **Reserved** for that Project ID.
4. Available stock decreases immediately, preventing sales reps from promising stock already reserved for field installation.

### 8.3 Purchase Order (PO) & Goods Receipt Note (GRN) SOP
1. **Low Stock Alert:** When stock falls below configured minimum reorder threshold, an alert appears.
2. **Generating Purchase Order:**
   - Navigate to **Finance & Accounts** > **Purchase Orders** > **+ New PO**.
   - Select Tier-1 Supplier (e.g. Waaree Solar OEM Distributor), item specifications, quantities, unit prices, and delivery terms.
   - Generate official PO document and send to vendor.
3. **Inward Receiving (GRN):**
   - When freight carrier delivers hardware at the warehouse, storekeeper navigates to **Goods Receipt Notes (GRN)**.
   - Inspect delivery against vendor delivery challan. Check for panel micro-cracks or transit damage.
   - Enter accepted quantity and rejected quantity. Upload receiving bill photo.
   - Click **Approve GRN**. Warehouse stock levels automatically update in real-time.

---

## 9. Module 7: Billing, Milestone Invoicing & Financial Accounting SOP

### 9.1 Solar EPC Milestone Payment Schedules
Standard customer contract value is collected in three distinct milestones:
1. **Milestone 1 — Booking & Design (20%):** Due upon signing agreement. Unlocks detailed engineering survey and DISCOM net-meter application filing.
2. **Milestone 2 — Pre-Dispatch (60%):** Due when engineering BOM is approved and hardware is staged for dispatch. Materials do not leave the warehouse until Milestone 2 is received.
3. **Milestone 3 — Commissioning & Grid Sync (20%):** Due upon mechanical installation, successful DISCOM net-meter sync, and plant commissioning.

### 9.2 Invoicing Procedure
1. Navigate to **Finance & Accounts** > **Invoices**.
2. Click **+ Create Invoice** (or auto-generate from Project Milestone).
3. Select Customer and Project ID.
4. System automatically pulls customer billing address, state, GSTIN, system capacity, and line items.
5. Invoicing applies statutory GST (Itemized or 13.80% Composite EPC mode).
6. Click **Save & Issue Invoice**.
7. Click **Print Tax Invoice** to export compliant tax document featuring company corporate seal, GSTIN, bank payment details, and amount in words.

### 9.3 Payment Reconciliation SOP
1. When customer transfers funds, navigate to **Payment Receipts** > **+ Log Receipt**.
2. Enter Invoice Number, Amount Paid (₹), Payment Mode (`NEFT/RTGS`, `UPI`, `Cheque`, `Cash`), Bank Transaction Ref / UTR, and Receipt Date.
3. System credits invoice, reduces customer outstanding balance, and updates project cash collection percentage.

### 9.4 Project Expense Logging & Margin SOP
To ensure profitability on every installation:
1. Navigate to **Operating Expenses** > **+ Record Expense**.
2. Select Project ID and Expense Category:
   - `Transportation & Freight`
   - `Labor Contractor Wages`
   - `DISCOM Net-Meter & Registration Fees`
   - `Crane / Rooftop Lifting Charges`
   - `Site Safety & Consumables`
3. Enter amount, vendor name, and upload bill receipt.
4. Real-time Project Financials dashboard updates:
   $$\text{Gross Profit} = \text{Total Collected Revenue} - (\text{Hardware BOM Cost} + \text{Direct Project Expenses})$$
   $$\text{Gross Margin \%} = \left(\frac{\text{Gross Profit}}{\text{Total Collected Revenue}}\right) \times 100$$

---

## 10. Module 8: Post-Commissioning, Warranties & O&M Care SOP

### 10.1 Digital Warranty Vault SOP
1. Once a project is commissioned, navigate to **Service & Care** > **Warranties**.
2. System automatically generates active warranty certificates linked to equipment serial numbers:
   - **Solar PV Modules:** 10-Year Workmanship Warranty, 25-Year 80% Linear Power Output Performance Warranty.
   - **Grid Inverter:** 5-Year Standard Replacement Warranty (extendable to 10 years).
   - **EPC Installation Workmanship:** 1-Year All-Inclusive System Guarantee.
3. Customer can view and download warranty cards directly from the Customer Portal.

### 10.2 Service Desk & Incident Ticketing SOP
* **Customer Ticket Intake:** Customers submit tickets via their portal, or staff logs call reports via **Service Tickets** > **+ New Ticket**.
* **Issue Categories:**
  - Inverter Fault Code / Red LED flashing
  - Low Energy Generation (soiling, shading, inverter clipping)
  - Grid Synchronization / Net-Meter Display Error
  - Physical Damage (broken panel glass, loose structure clamp)
* **SLA Resolution Protocol:**
  1. **Tier 1 (First Response):** Within **24 hours** of ticket creation. Technician contacts customer via phone to diagnose error code and check AC/DC isolator positions.
  2. **Tier 2 (On-Site Dispatch):** If remote diagnosis fails, dispatch service technician within **48 hours**.
  3. **Tier 3 (Resolution Sign-Off):** Replace faulty component or clean panels within **72 hours**. Customer provides digital OTP/signature on mobile to close ticket.

### 10.3 Annual Maintenance Contracts (AMC) SOP
1. Navigate to **Service & Care** > **AMC Contracts**.
2. Track AMC contract coverage (`Active`, `Renewal Due`, `Expired`).
3. **Preventative Maintenance Schedule (Semi-Annual):**
   - High-pressure demineralized water module washing.
   - Array thermal imaging scan (detect hotspot cells and bypassed diodes).
   - Electrical terminal tightening with torque wrench.
   - Inverter heat-sink dusting and fan inspection.
   - Earth pit resistance test and earth watering.
4. When AMC contract is 30 days from expiration, system flags badge `Renewal Due` to trigger sales outreach for annual renewal.

---

## 11. Module 9: Customer Self-Service Portal SOP

### 11.1 Customer Access & Credentials
1. When a quotation is accepted, system auto-generates a customer portal login.
2. Homeowner receives their unique URL and login credentials.
3. Customer navigates to the portal on desktop or smartphone.

### 11.2 Portal Features
* **Live Visual Milestone Tracker:** Real-time stepper displaying exact progress (e.g. `Site Survey Completed` ➔ `DISCOM Application Approved` ➔ `Materials Dispatched` ➔ `Installation In Progress` ➔ `Net Meter Active`).
* **Plant Hardware Specifications:** Displays commissioned capacity (kW), panel manufacturer, inverter model, and expected monthly solar unit generation.
* **Download Vault:** One-click download access to Customer Agreement, GST Invoices, Payment Receipts, Net-Meter Feasibility Approval, and Equipment Warranty Certificates.
* **One-Click Support:** Homeowner can file service requests with uploaded roof photos directly to the service desk.

---

## 12. System Administration, Deployment & Troubleshooting SOP

### 12.1 Demo Account Protection & Self-Healing Policies
* The application runs in **Live Production Mode**.
* Startup migration scripts (`runAuthMigration` in `server/migrations/init-auth.ts`) are strictly guarded:
  - Demo accounts (`Rajesh Sharma`, `Ananya Deshmukh`, `Vikram Mehta`, `Nandini Dairy`, etc.) are **only** provisioned if `user_accounts` is completely empty (0 users).
  - In active production databases, the server **never** re-inserts deleted demo accounts on startup.
  - Duplicate employee rows in `employees` sharing usernames with live accounts (`@service`, `@installation`, `@projectmanager`) are automatically pruned to prevent UI list duplication.

### 12.2 Updating Code & cPanel Deployment SOP
Whenever code updates or new features are compiled:
1. Compile frontend and backend bundles:
   ```bash
   npm run build
   ```
   *(Verifies zero TypeScript errors, builds client chunk into `dist/assets/`, and bundles server into `server.js`).*
2. Package deployment bundle:
   ```powershell
   tar.exe -a -cf latest_changes_only.zip dist server.js
   ```
3. Upload `latest_changes_only.zip` to cPanel File Manager in the application root directory (`public_html/AB_Energy_Solutions`).
4. Extract zip, replacing existing `dist/` and `server.js`.
5. Open cPanel **Setup Node.js App** and click **Restart Application**.
6. Hard refresh browser (`Ctrl + Shift + R`) to clear cached client assets.

---

## 13. Summary Operations Checklist (Daily Cadence)

| Time Window | Role | Mandatory Daily Operating Task |
| :--- | :--- | :--- |
| **09:00 AM - 09:30 AM** | Sales Manager | Review overnight incoming web/ad leads; verify auto-assignment; check overdue follow-ups. |
| **09:30 AM - 10:00 AM** | Survey Engineers | Review daily field visit routes; verify mobile battery, laser distance meter, and compass. |
| **10:00 AM - 12:00 PM** | Sales Executives | Conduct primary discovery calls; update lead stage notes; generate proposals for qualified inquiries. |
| **01:00 PM - 02:00 PM** | Project Manager | Inspect pending survey reviews; approve completed BOMs; dispatch stage 4 installation teams. |
| **02:00 PM - 03:30 PM** | Warehouse Keeper | Process inward Goods Receipt Notes (GRN); stage reserved materials for tomorrow's dispatches. |
| **03:30 PM - 04:30 PM** | Accounts Manager | Check bank UTR credits; verify advance payment screenshots; issue milestone tax invoices. |
| **04:30 PM - 05:30 PM** | Service Team | Review open incident tickets; monitor 24-hr first-response SLAs; schedule AMC cleaning visits. |
| **05:30 PM - 06:00 PM** | Super Admin | Review executive dashboard KPIs: Total kW booked, gross profit margins, and project pipeline velocity. |

---
*End of Standard Operating Procedure (SOP) Manual — AB Energy Solutions Solar CRM & Business OS.*
