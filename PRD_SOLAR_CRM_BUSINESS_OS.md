# Product Requirements Document (PRD)
## AB Energy Solutions — Solar CRM & Business Operating System

---

| **Document Attribute** | **Details** |
|:---|:---|
| **Product Name** | AB Energy Solutions — Solar CRM & Business OS |
| **Document Version** | 1.0.0 (Comprehensive Specification) |
| **Status** | Approved for Implementation & Expansion |
| **Target Audience** | Executive Leadership, Product Managers, Engineering Teams, UI/UX Designers, EPC Operations |
| **Domain** | Rooftop Solar EPC (Engineering, Procurement & Construction), CleanTech CRM, Field Operations |

---

## 1. Executive Summary

### 1.1 Product Overview
**AB Energy Solutions Solar CRM & Business OS** is a unified, end-to-end digital operating system built specifically for solar rooftop Engineering, Procurement, and Construction (EPC) companies. Unlike generic CRMs (such as Salesforce or HubSpot) that lack clean-tech domain capabilities, this platform bridges the entire lifecycle of a solar installation:
1. **Demand Generation & Sales Pipeline:** Lead intake from Meta, Google Ads, WhatsApp, and field dealers.
2. **Solar Engineering & Rooftop Auditing:** Mobile rooftop site survey, shadow profile, DISCOM sanction load verification, and system design.
3. **Smart Solar Calculation & Quoting:** Automated financial feasibility, PM Surya Ghar subsidy modeling, generation estimation, and instant PDF proposals.
4. **EPC Project & Field Execution:** Milestone-based project management, BOM allocation, installation crew mobile checklists, and net-meter grid commissioning.
5. **Supply Chain & Inventory Management:** Real-time warehouse inventory for solar PV modules, inverters, structures, and DC cables with vendor purchase orders.
6. **Financials & Milestone Cash Flows:** Milestone invoices (Booking, Material Dispatch, Commissioning), payment reconciliation, and project expense logs.
7. **25-Year Lifecycle Support:** Post-commissioning service tickets, warranty tracking, and Annual Maintenance Contracts (AMC).
8. **Customer Self-Service Portal:** Transparent tracking for the homeowner or factory manager from deposit to daily green power generation.

---

## 2. Market Problem & Strategic Objective

### 2.1 The Problem in Distributed Solar
Rooftop solar is an operationally intensive, multi-stakeholder business spanning 30 to 90 days per project:
* **Fragmented Tools:** Sales uses WhatsApp/Excel; field surveyors take notes on paper; warehouse teams use standalone stock registers; accountants use Tally/Zoho.
* **Costly Site Survey Mistakes:** Incorrect rooftop dimensions, overlooking shade trees, or missing sanction load limits leads to project delays, redesigns, and customer disputes.
* **Cash Flow Bottlenecks:** Solar projects run on tight margins. Failure to collect milestone payments at the right moment (e.g., before materials leave warehouse) strains working capital.
* **Customer Anxiety:** Homeowners investing substantial capital often feel uninformed between contract signing and rooftop installation.

### 2.2 Strategic Objectives & KPIs
* **Lead-to-Survey Turnaround:** Reduce average time from lead qualification to site survey completion from 5 days to < 36 hours.
* **Quote Turnaround Time:** Generate accurate, engineering-backed proposals in under 5 minutes.
* **Installation Velocity:** Shorten project cycle from contract to net-meter commissioning by 30%.
* **Payment Aging:** Reduce delayed milestone payments by 45% via automated WhatsApp/SMS payment reminders.
* **Customer Referral Rate:** Increase customer satisfaction (NPS > 65) via transparent progress visibility.

---

## 3. User Personas & Role-Based Access Control (RBAC)

The system enforces strict Role-Based Access Control to ensure each department interacts only with relevant tools and data.

```
+-----------------------------------------------------------------------------------------+
|                                    SUPER ADMIN (Owner / CEO)                            |
|             (Full access to Financials, Margins, Team, Operations, Settings & Logs)    |
+-------------------+--------------------+-------------------+--------------------+-------+
                    |                    |                   |                    |
        +-----------v----------+ +-------v---------+ +-------v----------+ +-------v---------+
        |   Sales Manager /    | | Survey Engineer | | Project Manager/ | | Accounts / Fin  |
        |   Sales Executive    | | (Mobile / Field)| | Installation     | | (Invoicing, GST,|
        | (Leads, Calculator,  | | (Roof Audits,   | | (Field Tasks,    | |  Vendor POs,    |
        |  Quotes, Follow-ups) | |  Shadow Checks) | |  Milestones, BOM)| |  Collections)   |
        +----------------------+ +-----------------+ +------------------+ +-----------------+
                                                     |
                                         +-----------v-----------+
                                         |    CUSTOMER PORTAL    |
                                         | (Live tracker, Docs,  |
                                         |  Warranty, Tickets)   |
                                         +-----------------------+
```

### 3.1 Role Matrix

| Role | Core Responsibilities | Primary Views / Permissions |
|:---|:---|:---|
| **Super Admin** | Company Owner, Managing Director | **Full Access**: All financial reports, employee performance, audit logs, system configurations, and automation rules. |
| **Sales Manager** | Supervises sales team, pipeline quotas | Lead distribution, sales reports, team targets, quotation discounts approval. |
| **Sales Executive** | Lead qualification, customer visits, closing | Assigned leads, follow-up calendar, solar savings calculator, quotation creator. Restricted from viewing company cost margins or vendor POs. |
| **Survey Engineer** | Rooftop technical feasibility analysis | Mobile-optimized Site Survey tool: Roof dimensions, tilt angle, azimuth, LT panel proximity, photos, shadow meter data. |
| **Project Manager (EPC)**| Project delivery from contract to net-meter | Project kanban, installation milestones, team dispatch, material requisitions, DISCOM net-meter documentation. |
| **Installation Crew** | Field technicians and electrical wiremen | Mobile checklist: Structure erection, module clamping, inverter wiring, earth pit resistance test, photo uploads. |
| **Inventory / Warehouse**| Stock keeper and procurement officer | Stock levels, inward/outward registers, purchase orders to module/inverter OEMs, material allocations per project. |
| **Accounts & Finance** | Cash collection, milestone invoicing, billing | Customer invoices, GST reports, payment milestone receipts, supplier payment entries, project direct expenses. |
| **Service Team** | After-sales repair, AMC maintenance | Service ticketing desk, warranty claim validation, AMC renewal schedule, technician dispatch. |
| **Customer (End-User)**| Residential homeowner or commercial plant owner | View installation progress, download signed contract, view warranty certificates, track net-meter status, submit service ticket. |

---

## 4. Complete Module Specifications

### Module 1: Lead Intake & Sales Pipeline Management
* **1.1 Lead Ingestion Channels:**
  * Web form submissions and landing pages.
  * Google Ads & Meta Lead Form Webhooks.
  * WhatsApp Business incoming chat integration.
  * Direct manual walk-in / dealer referral entry.
* **1.2 Lead Profiling:**
  * Contact info (Name, Phone, Email, Pin Code, Address).
  * Consumer profile: Monthly bill (₹), sanction load (kW), consumer connection number, DISCOM provider (e.g., BESCOM, Tata Power, MSEDCL, DHBVN).
  * Roof type: RCC Flat, Tin Shed, Mangalore Tiled, Elevated Canopy.
  * AI Lead Score & Priority: Auto-calculated based on bill size and roof area.
* **1.3 Pipeline Stages:**
  1. `New` ➔ 2. `Contacted` ➔ 3. `Follow-up Scheduled` ➔ 4. `Site Survey Scheduled` ➔ 5. `Survey Completed` ➔ 6. `Quotation Sent` ➔ 7. `Negotiation` ➔ 8. `Won (Converted to Project)` / `Lost`.
* **1.4 Follow-Up Management:**
  * Activity reminders (Call, WhatsApp, In-Person Visit, Proposal Review).
  * Due date and priority tagging with one-click quick actions.

---

### Module 2: Solar Engineering & Site Survey Suite
* **2.1 Technical Audit Form:**
  * Roof measurements: Usable square footage, parapet wall height, orientation (Azimuth & Tilt).
  * Obstacle & Shade Mapping: Water tanks, staircase towers, adjacent trees/towers.
  * Electrical Infrastructure: Sanctioned load check, meter location, cable routing distance from roof to LT panel, earthing pit location.
* **2.2 Media & Verification:**
  * Roof photo upload (Overview, South-facing angle, Meter box, Distribution box).
  * Upload latest electricity bill image (auto-extract consumer ID and Sanction load).
* **2.3 Engineering Output:**
  * Auto-calculated maximum DC capacity (kW) based on usable shadow-free area (Rule of thumb: 100 sq ft per 1 kW).

---

### Module 3: Dynamic Solar Calculator & Proposal Generator
* **3.1 Generation & Sizing Engine:**
  * Recommends system size based on average monthly consumption (units/month) and roof constraint.
  * Solar yield calculations: Standard 4.0 to 4.5 units generated per kW per day (weather adjusted).
* **3.2 Financial & Subsidy Modeling:**
  * Central Govt Subsidy (e.g., PM Surya Ghar: ₹30,000 for 1kW, ₹60,000 for 2kW, ₹78,000 for 3kW+).
  * Net investment cost calculation (Gross System Price - Govt Subsidy).
  * Annual savings, 25-year lifetime generation forecast, and Return on Investment (ROI) / Payback period (typically 3.2 – 4.5 years).
  * Green Impact metrics: Metric tons of CO2 offset, equivalent trees planted.
* **3.3 Quotation Management:**
  * Tiered solar packages: Premium (Topcon Bifacial + Microinverters), Standard (Mono PERC Half-cut + String Inverter), Budget.
  * Revision versioning (v1, v2, v3).
  * Instant generation of customer proposal document.

---

### Module 4: EPC Project Management & Field Execution
* **4.1 Project Conversion:**
  * Converting a "Won" quotation automatically creates a project record, assigns a Project Manager, and links customer history.
* **4.2 Project Lifecycle Stages:**
  1. `Booking Confirmed`
  2. `Net Metering Application Filed`
  3. `Material Planning & Dispatch`
  4. `Installation In Progress`
  5. `Structure & Module Mounting Completed`
  6. `Inverter Wiring & Testing`
  7. `DISCOM Inspection & Net-Meter Synchronization`
  8. `Plant Commissioned & Handed Over`
* **4.3 Installation Quality & Safety Checklist:**
  * Structure anchoring and pull-out strength verified.
  * Module clamp torque specification verified.
  * DC surge protection device (SPD) and AC isolator wired.
  * Inverter earthing resistance (< 5 Ohms).
  * Photo sign-off per checkpoint before closing stage.

---

### Module 5: Warehouse & Supply Chain Inventory
* **5.1 Catalog Management:**
  * Tier-1 Solar PV Modules (Bifacial, Mono PERC, 540Wp - 580Wp).
  * On-Grid / Hybrid Inverters (Single Phase 3kW/5kW, Three Phase 10kW - 50kW).
  * Mounting structures, aluminum mid-clamps, end-clamps, and rails.
  * DC Solar Cables (4 sq mm / 6 sq mm UV resistant), AC cables, conduits.
  * ACDB / DCDB junction boxes, earthing rods, chemical earthing compound.
* **5.2 Inventory Operations:**
  * Multi-warehouse stock tracking with minimum threshold reorder alerts.
  * Material Allocation: Reserving stock for specific project IDs to prevent stockouts.
  * Supplier management with Purchase Order (PO) creation and inward receiving records.

---

### Module 6: Billing, Milestone Invoicing & Project Finances
* **6.1 Milestone Payment Schedules:**
  * Standard Solar EPC Payment Schedule:
    * **Milestone 1 (Advance):** 20% on booking & engineering design.
    * **Milestone 2 (Pre-Dispatch):** 60% before materials leave warehouse.
    * **Milestone 3 (Commissioning):** 20% upon installation completion & net-meter sync.
* **6.2 Invoicing & Collections:**
  * GST-compliant tax invoices (SAC/HSN code auto-tagging for solar hardware).
  * Payment receipts logging (NEFT, RTGS, UPI, Cheque, Solar Loan disbursement).
* **6.3 Project Expense Tracking:**
  * Labor contractor costs, freight/transport charges, local DISCOM fees, crane/lifting charges.
  * Real-time calculation of Gross Margin per Project.

---

### Module 7: Post-Commissioning, Warranty & AMC
* **7.1 Warranty Vault:**
  * Solar PV Modules: 10–12 year product warranty, 25-year linear performance warranty.
  * Inverter Warranty: 5–10 years manufacturer replacement.
  * Installation Workmanship: 1–5 years EPC warranty.
  * Digital warranty certificates stored against customer serial numbers.
* **7.2 Service Desk:**
  * Incident ticket logging (Inverter error codes, grid dropouts, generation drop, broken glass).
  * SLA tracking (response within 24 hours, resolution within 72 hours).
* **7.3 Annual Maintenance Contracts (AMC):**
  * Preventative maintenance schedules (panel deep cleaning, thermal scanning, terminal tightening).
  * Automated renewal reminders prior to AMC expiration.

---

### Module 8: Customer Self-Service Portal
* **8.1 Live Project Tracker:**
  * Visual progress stepper (Survey ➔ Approvals ➔ Dispatch ➔ Mounting ➔ Net Meter ➔ Live).
* **8.2 System Details & Document Vault:**
  * System specs: Plant capacity (kW), panel count, inverter model, estimated monthly generation.
  * Downloadable documents: Proposal, signed agreement, tax invoice, warranty letters, net-meter approval.
* **8.3 Support Desk:**
  * One-click ticket submission with photo attachment.

---

### Module 9: Intelligence, Automations & AI Solar Advisor
* **9.1 Rule-Based Automation Engine:**
  * When lead status = `Won` ➔ Create Project + Generate Milestone 1 Invoice.
  * When Survey status = `Completed` ➔ Send WhatsApp notification with survey report link.
  * When Stock drops below reorder point ➔ Alert procurement officer.
  * When Milestone 2 payment received ➔ Notify warehouse to dispatch materials.
* **9.2 AI Solar Advisor (LLM Powered):**
  * Analyzes lead variables (bill, roof type, location) and suggests customized sales closing scripts.
  * Generates next-best tactical actions for sales reps and operations managers.
  * Offers deterministic fallback for uninterrupted offline/local operation.

---

## 5. Technical Architecture & Tech Stack

```
+---------------------------------------------------------------------------------+
|                               CLIENT LAYER (Browser / PWA)                      |
|           React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Motion           |
+---------------------------------------------------------------------------------+
                                       |
                                       | REST APIs / Vite Dev Server
                                       v
+---------------------------------------------------------------------------------+
|                               BACKEND APPLICATION SERVER                        |
|        Node.js + Express + TSX (High-velocity TypeScript execution)            |
|       - REST Endpoints for AI Analysis (/api/ai/suggest-action)                |
|       - Single Page Application (SPA) Serving Middleware                        |
+---------------------------------------+-----------------------------------------+
                                        |
                 +----------------------+----------------------+
                 |                                             |
                 v                                             v
+---------------------------------+           +-----------------------------------+
|       AI INTELLIGENCE ENGINE    |           |       DATA PERSISTENCE            |
|   Google Gemini API (@google/genai) |       |   Local state + LocalStorage sync |
|   with deterministic rule-fallback  |       |   (Ready for PostgreSQL / Supabase)|
+---------------------------------+           +-----------------------------------+
```

### 5.1 Tech Stack Justification
* **Frontend:** React 19 + TypeScript provides zero-latency reactivity for complex calculations (solar yield, payback, BOM generation).
* **Styling:** Tailwind CSS v4 provides modern, high-density dashboard layouts optimized for complex data tables and mobile field use.
* **Icons & Animation:** Lucide-React + Motion provides clear visual indicators for solar hardware and smooth workflow transitions.
* **Backend:** Express with TypeScript (`tsx`) keeps full-stack language parity and simplifies microservice deployment.
* **AI Engine:** Google Gemini GenAI SDK enables intelligent tactical recommendations, customer response drafting, and technical feasibility reviews.

---

## 6. Implementation & Product Roadmap

### Phase 1: MVP & Core Engine *(Completed in current build)*
- [x] Unified Super Admin workspace with 15 integrated modules.
- [x] Solar Rooftop Calculator & PM Surya Ghar subsidy engine.
- [x] Lead ingestion, follow-up calendar, and sales pipeline.
- [x] Technical Site Survey form & roof profiling.
- [x] EPC Project stages and installation checklist.
- [x] Invoicing, milestone payments, and expense tracking.
- [x] Inventory stock levels, purchase orders, and supplier directory.
- [x] Customer self-service portal prototype.
- [x] AI Solar Advisor with Gemini integration + deterministic fallback.

### Phase 2: Role Separation & Field Apps *(Next Phase)*
- [ ] Implement authenticated login screens per role with dynamic sidebar filtering.
- [ ] Dedicated mobile PWA layout for Site Survey Engineers (offline camera capture, GPS geotagging of roof).
- [ ] Dedicated technician portal for on-roof installation checklists.
- [ ] PDF proposal export engine with custom company branding and digital signatures.

### Phase 3: Hardware Integrations & Customer Experience
- [ ] Integration with solar inverter monitoring APIs (Growatt, Solis, Sungrow, Enphase, SolarEdge) to display real-time kWh generation inside the Customer Portal.
- [ ] Automated WhatsApp Business API integration for invoice links and milestone updates.
- [ ] Payment gateway integration (Razorpay / Cashfree) for direct customer milestone payments.

### Phase 4: Enterprise & Franchise Scaling
- [ ] Multi-branch and regional dealer management.
- [ ] Commission tracking for solar channel partners and direct selling agents (DSAs).
- [ ] Integration with state DISCOM portals for net-metering application tracking.

---

## 7. Glossary of Solar Domain Terminology

* **kW / kWp (Kilowatt / Kilowatt-peak):** The rated power generation capacity of a solar system under standard test conditions.
* **BOM (Bill of Materials):** The exact list of all physical components (panels, inverters, nuts, bolts, cables) required for a specific solar plant.
* **DISCOM:** Distribution Company (the regional electricity board providing grid power).
* **Sanctioned Load:** The maximum electrical load permitted by the electricity utility for a meter connection.
* **Net Metering:** A bi-directional electrical meter that records both electricity drawn from the grid and solar electricity exported into the grid.
* **Azimuth & Tilt Angle:** The compass orientation (usually South in the Northern Hemisphere) and vertical angle of solar panels to maximize annual sunshine capture.
* **AMC (Annual Maintenance Contract):** A paid yearly service agreement covering panel cleaning, inverter diagnostics, and electrical health checkups.
* **PM Surya Ghar: Muft Bijli Yojana:** Indian Government rooftop solar scheme offering direct bank transfer subsidies to residential consumers.
