export type Role = 
  | 'Super Admin'
  | 'Sales Manager'
  | 'Sales Executive'
  | 'Survey Engineer'
  | 'Project Manager'
  | 'Purchase Team'
  | 'Installation Team'
  | 'Accounts'
  | 'Service Team'
  | 'Customer';

export type UserRole = Role;

export type LeadSource = 
  | 'Website'
  | 'Google Ads'
  | 'Meta Ads'
  | 'Facebook'
  | 'Instagram'
  | 'WhatsApp'
  | 'Phone'
  | 'Referral'
  | 'Walk-in'
  | 'Exhibition'
  | 'Dealer'
  | 'Manual Entry'
  | 'API';

export type LeadStatus = 
  | 'New'
  | 'Contacted'
  | 'Follow-up Scheduled'
  | 'Site Survey Scheduled'
  | 'Survey Completed'
  | 'Quotation Sent'
  | 'Negotiation'
  | 'Qualified'
  | 'Won'
  | 'Lost'
  | 'Attention Required';

export type ProjectStage = 
  | 'Booking'
  | 'Documentation'
  | 'Material Planning'
  | 'Material Ready'
  | 'Installation Scheduled'
  | 'Installation In Progress'
  | 'Installation Completed'
  | 'Testing'
  | 'Commissioning'
  | 'Net Metering'
  | 'Completed';

export type TicketStatus = 
  | 'Open'
  | 'Assigned'
  | 'Scheduled'
  | 'In Progress'
  | 'Waiting for Parts'
  | 'Resolved'
  | 'Closed';

export type Priority = 'Low' | 'Medium' | 'High' | 'Urgent';

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  department: string;
  avatar: string;
  activeLeadsCount: number;
  completedProjectsCount: number;
  location: string;
}

export type CustomerApplicationType = 'Home' | 'Residential' | 'Commercial' | 'Industrial' | 'Water Pump';
export type SolarSystemType = 'On-Grid' | 'Off-Grid' | 'Hybrid';

export interface Lead {
  id: string; // e.g. LD-2026-001
  name: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  address: string;
  pincode: string;
  source: LeadSource;
  status: LeadStatus;
  priority: Priority;
  recommendedPriority?: Priority;
  priorityOverrideReason?: string;
  buyingIntent?: 'Immediate (< 15 days)' | '1-2 months' | 'Budgetary / Researching' | 'Future (> 3 months)';
  customerType?: CustomerApplicationType;
  systemType?: SolarSystemType;
  assignedToId: string;
  assignedToName: string;
  monthlyBill: number; // in ₹
  sanctionLoad: number; // in kW
  roofAreaSqFt: number;
  roofType: 'RCC Flat' | 'Tin Shed' | 'Tiled' | 'Elevated Structure';
  recommendedKw: number;
  estimatedBudget: number; // in ₹
  createdAt: string;
  updatedAt: string;
  lastContactedAt?: string;
  notes: string;
  surveyId?: string;
  quotationId?: string;
  projectId?: string;
  customerId?: string;
}


export interface FollowUp {
  id: string;
  leadId?: string;
  leadName?: string;
  customerId?: string;
  customerName?: string;
  quotationId?: string;
  title: string;
  dueDate: string; // YYYY-MM-DD
  dueTime?: string;
  type: 'Call' | 'WhatsApp' | 'Site Visit' | 'Email' | 'Quotation Review' | 'Payment Collection';
  status: 'Pending' | 'Completed' | 'Overdue';
  priority: Priority;
  assignedToId: string;
  assignedToName: string;
  notes: string;
  completedAt?: string;
  dayInterval?: number; // e.g. Day 1, Day 3, Day 7
}

export interface Customer {
  id: string; // e.g. CUST-2026-001
  name: string;
  email: string;
  phone: string;
  alternatePhone?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  consumerNumberDiscom: string; // Indian electricity consumer number
  discomName: string; // e.g. BESCOM, Tata Power, MSEDCL, TANGEDCO
  gstin?: string;
  convertedFromLeadId?: string;
  totalSystemKw: number;
  totalOrderValue: number;
  paidAmount: number;
  balanceAmount: number;
  createdAt: string;
  status: 'Active' | 'Under Installation' | 'Warranty Active' | 'AMC Active';
  portalUsername?: string;
}

export type SurveyStatus = 
  | 'Scheduled' 
  | 'In Progress' 
  | 'Submitted for Review' 
  | 'Changes Required' 
  | 'Approved' 
  | 'Completed' 
  | 'Cancelled';

export type SurveyPhotoCategory = 
  | 'full_rooftop_view'
  | 'mounting_area'
  | 'water_tank_obstacles'
  | 'main_electricity_meter'
  | 'distribution_board'
  | 'earthing_arrangement'
  | 'cable_route_inverter'
  | 'roof_damage_concerns'
  | 'additional_evidence';

export interface SurveyPhoto {
  id: string;
  surveyId: string;
  category: SurveyPhotoCategory;
  fileName: string;
  filePath: string;
  fileSize?: number;
  mimeType?: string;
  caption?: string;
  uploaderId?: string;
  uploaderName?: string;
  capturedAt?: string | null;
  uploadedAt: string;
  latitude?: number | null;
  longitude?: number | null;
  gpsAccuracyMeters?: number | null;
  geoVerified: boolean;
  verificationStatus: 'Uploaded' | 'Pending Review' | 'Verified' | 'Rejected';
  verificationNotes?: string;
}

export interface SurveyReviewHistory {
  id: string;
  surveyId: string;
  reviewerId?: string;
  reviewerName?: string;
  action: 'Submitted' | 'Changes Required' | 'Approved' | 'Completed';
  comments?: string;
  createdAt: string;
}

export interface SiteSurvey {
  id: string; // e.g. SRV-2026-001
  leadId: string;
  leadName: string;
  customerName: string;
  phone: string;
  address: string;
  scheduledDate: string;
  scheduledTime?: string;
  engineerId: string;
  engineerName: string;
  status: SurveyStatus;
  roofAreaSqFt: number;
  shadowFreeAreaSqFt: number;
  roofType: string;
  azimuthAngle: number; // e.g. 180° South
  tiltAngle: number; // e.g. 15°
  existingSanctionLoadKw: number;
  gridPhase: 'Single Phase' | 'Three Phase' | string;
  distanceToLtPanelMeters: number;
  recommendedKw: number;
  panelQuantity: number;
  estimatedGenerationUnitsPerYear: number;
  estimatedAnnualSavings: number; // ₹
  estimatedCost: number; // ₹
  paybackYears: number;
  co2ReductionTonsPerYear: number;
  photosUploaded: string[];
  billPhotoUploaded: boolean;
  notes: string;
  completedAt?: string;

  // Rooftop Engineering & Measurement status
  roofDimensionsShape?: string;
  surfaceCondition?: string;
  measurementStatus?: 'Initial Estimate' | 'Engineer Entered' | 'Verified' | 'Requires Correction' | string;
  obstaclesWaterTank?: boolean;
  obstaclesMumty?: boolean;
  obstaclesParapet?: boolean;
  obstaclesTreesNeighbors?: boolean;
  obstaclesOther?: string;
  accessPathwaysClearance?: string;

  // Electrical Inspection
  mainMeterStatus?: 'Pass' | 'Needs Attention' | 'Not Assessed' | string;
  mainMeterNotes?: string;
  dbCondition?: 'Pass' | 'Needs Attention' | 'Not Assessed' | string;
  earthingStatus?: 'Pass' | 'Needs Attention' | 'Not Assessed' | string;
  earthingResistanceOhms?: number | null;
  proposedInverterLocation?: string;
  electricalConstraints?: string;
  electricalUpgradesNeeded?: string;

  // Structural & Shading Assessment
  structuralConcerns?: string;
  visibleCracksDamage?: boolean;
  waterproofingStatus?: 'Good' | 'Needs Repair' | 'Critical' | string;
  mountingStructureType?: string;
  shadingSources?: string;
  shadingAffectedAreaSqFt?: number;
  structuralEngineerApprovalRequired?: boolean;

  // Engineering Findings & Feasibility
  feasibilityVerdict?: 'Feasible' | 'Feasible with Conditions' | 'Not Feasible' | string;
  proposedPanelWattage?: number;
  inverterRecommendation?: string;
  cableSpecification?: string;
  unresolvedTechnicalIssues?: string;
  engineerRecommendations?: string;

  // Review & Workflow
  submittedAt?: string | null;
  submittedById?: string | null;
  reviewedAt?: string | null;
  reviewedById?: string | null;
  reviewerName?: string | null;
  reviewDecision?: 'Approved' | 'Changes Required' | null;
  reviewComments?: string | null;
  isDraft?: boolean;
  quotationId?: string | null;

  // Survey Engineer Custom Fields
  customFields?: { id: string; label: string; value: string }[];

  // Attached individual photos & history
  photos?: SurveyPhoto[];
  reviewHistory?: SurveyReviewHistory[];
}

export interface QuotationItem {
  id: string;
  category: 'Panels' | 'Inverter' | 'Structure' | 'Cabling' | 'Protection & BOS' | 'Installation & Commissioning' | 'Discom Net Metering' | string;
  description: string;
  specification?: string;
  make?: string;
  makeModel: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  warrantyPeriod: string;
  hsnSacCode?: string;
  taxableAmount?: number;
  gstRate?: number;
  taxType?: 'INTRASTATE' | 'INTERSTATE' | 'CGST_SGST' | 'IGST';
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  taxAmount?: number;
}

export interface QuotationVersion {
  version: number;
  quotationNumber: string; // e.g. QT-2026-00001-V1
  createdAt: string;
  items: QuotationItem[];
  subtotal: number;
  subsidyDeduction: number; // PM Surya Ghar Muft Bijli Yojana or MNRE
  discount: number;
  taxableAmount: number;
  gstRate: number; // e.g. 13.8% composite or 18%
  gstAmount: number;
  taxMode?: 'ITEM_WISE' | 'ITEMIZED' | 'COMPOSITE';
  taxType?: 'INTRASTATE' | 'INTERSTATE' | 'CGST_SGST' | 'IGST';
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  amountInWords?: string;
  netTotal: number;
  terms: string[];
  notes: string;
}

export type QuotationStatus = 'Draft' | 'Sent' | 'Negotiation' | 'Accepted' | 'Customer_Accepted' | 'Converted_To_Project' | 'Declined' | 'Expired';

export interface Quotation {
  id: string; // e.g. QT-2026-00001
  quotationNumber: string; // Current version code, e.g. QT-2026-00001-V1
  leadId: string;
  leadName: string;
  customerPhone: string;
  customerAddress: string;
  systemCapacityKw: number;
  currentVersion: number;
  versions: QuotationVersion[];
  status: QuotationStatus;
  sentDate?: string;
  validUntil: string;
  salespersonId: string;
  salespersonName: string;
  createdAt: string;
  subtotal?: number;
  totalAmount: number;
  proposalType?: 'Preliminary' | 'Final_Technical';
  packageTier?: 'Standard' | 'Premium Bifacial' | 'Commercial Heavy Duty';
  approvalStatus?: 'Approved' | 'Pending_Approval';
  discountAmount?: number;
  discountApprovedBy?: string;
  subsidyAmount?: number;
  taxableAmount?: number;
  gstRate?: number;
  gstAmount?: number;
  taxMode?: 'ITEM_WISE' | 'ITEMIZED' | 'COMPOSITE';
  taxType?: 'INTRASTATE' | 'INTERSTATE' | 'CGST_SGST' | 'IGST';
  totalCgst?: number;
  totalSgst?: number;
  totalIgst?: number;
  amountInWords?: string;
  pdfUrl?: string;
  convertedToProjectId?: string;
  surveyId?: string;
  notes?: string;
}

export interface ProjectTask {
  id: string;
  title: string;
  stage: ProjectStage;
  isCompleted: boolean;
  assignedRole: Role;
  assignedToName: string;
  dueDate: string;
  completedAt?: string;
  category?: 'Structure' | 'Electrical' | 'Inverter' | 'Safety' | 'BOS' | string;
  status?: 'Pending' | 'In Progress' | 'Completed';
  assignedTo?: string;
}

export interface InstallationChecklist {
  structureFastening: boolean;
  moduleClampingTorque: boolean;
  inverterWallMounting: boolean;
  dcWiringConduit: boolean;
  acWiringArmoured: boolean;
  chemicalEarthingPits: boolean; // Solar earthing
  lightningArrester: boolean;
  dcdbProtectionFuses: boolean;
  acdbMccbIsolator: boolean;
  remoteMonitoringConfigured: boolean;
  vocAndIscTesting: boolean;
  safetySignagesAffixed: boolean;
  photosUploaded: string[];
  completedBy?: string;
  completionDate?: string;
}

export interface Project {
  id: string; // e.g. PROJECT-2026-00125
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  quotationId: string;
  capacityKw: number;
  totalAmount: number;
  stage: ProjectStage;
  startDate: string;
  targetCompletionDate: string;
  projectManagerId: string;
  projectManagerName: string;
  installationLeadId: string;
  installationLeadName: string;
  tasks: ProjectTask[];
  checklist: InstallationChecklist;
  inventoryReserved: boolean;
  materialShortageFlag: boolean;
  shortageDetails?: string;
  commissioningDate?: string;
  netMeterInstalledDate?: string;
  warrantyActivated: boolean;
  amcInitiated: boolean;
  discomSanctionNumber?: string;
  material_readiness_status?: 'Pending BOM' | 'PO Issued' | 'Partially Inwarded' | 'Fully Inwarded' | 'Ready for Installation' | 'Fully Received at Site' | 'Partial Shortage' | 'In Warehouse';
  leadId?: string;
  notes: string;
}

export interface InventoryProduct {
  id: string;
  sku: string;
  name: string;
  category: 'Solar Panels' | 'Inverters' | 'Mounting Structures' | 'DC/AC Cables' | 'Protection BOS' | 'Earthing & Lightning' | 'Accessories';
  brand: string;
  specifications: string;
  unit: string;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  minThreshold: number;
  unitCost: number;
  supplierName: string;
}

export interface PaymentScheduleItem {
  id: string;
  milestoneName: string; // e.g. "40% Advance on Booking", "50% On Material Dispatch", "10% On Net Metering"
  percentage: number;
  amount: number;
  dueDate: string;
  status: 'Pending' | 'Paid' | 'Overdue';
  paidDate?: string;
  paymentMode?: 'NEFT/RTGS' | 'UPI' | 'Cheque' | 'Net Banking' | 'Cash';
  referenceNo?: string;
}

export interface Invoice {
  id: string; // e.g. INV-2026-00045
  invoiceNumber: string;
  projectId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerGstin?: string;
  issueDate: string;
  dueDate: string;
  items: {
    description: string;
    hsnCode: string; // e.g. 8471, 8541 (Solar PV)
    quantity: number;
    rate: number;
    amount: number;
  }[];
  subtotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  status: 'Draft' | 'Sent' | 'Partially Paid' | 'Paid' | 'Overdue';
}

export interface Payment {
  id: string; // e.g. PAY-2026-00088
  paymentNumber: string;
  invoiceId: string;
  projectId: string;
  customerId: string;
  customerName: string;
  amount: number;
  paymentDate: string;
  paymentMode: 'NEFT/RTGS' | 'UPI' | 'Cheque' | 'Net Banking';
  transactionReference: string;
  bankName?: string;
  status: 'Verified' | 'Pending Verification';
  recordedBy: string;
}

export interface Warranty {
  id: string;
  projectId: string;
  customerId: string;
  customerName: string;
  equipmentType: 'Solar Panels (Performance)' | 'Solar Panels (Product)' | 'Solar Inverter' | 'Mounting Structure' | 'Lithium Battery';
  makeModel: string;
  serialNumber: string;
  warrantyPeriodYears: number;
  startDate: string;
  endDate: string;
  daysRemaining: number;
  status: 'Active' | 'Expiring Soon' | 'Expired';
}

export interface AmcContract {
  id: string; // e.g. AMC-2026-0012
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  projectId: string;
  capacityKw: number;
  planName: 'Basic Solar Care' | 'Gold Annual Care' | 'Commercial Max Performance';
  annualPrice: number;
  visitsPerYear: number;
  completedVisits: number;
  startDate: string;
  endDate: string;
  status: 'Active' | 'Renewal Due' | 'Expired';
  nextScheduledVisit: string;
}

export interface ServiceTicket {
  id: string; // e.g. TKT-2026-0045
  ticketNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  projectId?: string;
  issueCategory: 'Inverter Error / Offline' | 'Low Generation' | 'Panel Cleaning Required' | 'Cable / Tripping Issue' | 'Net Meter Display Error' | 'Structure Rust / Loose Clamp';
  severity: Priority;
  status: TicketStatus;
  technicianId?: string;
  technicianName?: string;
  description: string;
  createdAt: string;
  scheduledDate?: string;
  resolvedAt?: string;
  resolutionNotes?: string;
  customerFeedbackScore?: number; // 1-5 stars
}

export interface AutomationRule {
  id: string;
  name: string;
  triggerEvent: 
    | 'LEAD_CREATED'
    | 'LEAD_QUALIFIED'
    | 'SURVEY_COMPLETED'
    | 'QUOTATION_SENT'
    | 'QUOTATION_ACCEPTED'
    | 'PROJECT_CREATED'
    | 'MATERIAL_SHORTAGE'
    | 'INSTALLATION_COMPLETED'
    | 'COMMISSIONING_COMPLETED'
    | 'INVOICE_OVERDUE'
    | 'WARRANTY_EXPIRING'
    | 'AMC_RENEWAL_DUE';
  whenText: string;
  conditionText: string;
  actionText: string;
  isActive: boolean;
  actionsExecutedCount: number;
  lastTriggeredAt?: string;
}

export interface AutomationLog {
  id: string;
  ruleName: string;
  triggerEvent: string;
  timestamp: string;
  targetEntityId: string;
  targetEntityName: string;
  actionSummary: string;
  status: 'Success' | 'Failed' | 'Warning';
  details?: string;
}

export interface ActivityTimelineItem {
  id: string;
  entityType: 'Lead' | 'Customer' | 'Project' | 'Quotation' | 'Ticket';
  entityId: string;
  timestamp: string;
  title: string;
  description: string;
  performedBy: string; // e.g. "Automation Engine" or employee name
  iconType: 'lead' | 'survey' | 'quote' | 'project' | 'payment' | 'install' | 'warranty' | 'service' | 'alert';
}

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  type: 'Task' | 'Lead' | 'Sales' | 'Payment' | 'Project' | 'Installation' | 'Inventory' | 'Service' | 'Warranty' | 'AMC';
  timestamp: string;
  isRead: boolean;
  targetId?: string;
  targetType?: string;
}

export interface SolarCalculationInputs {
  monthlyBill: number; // ₹
  tariffPerUnit: number; // ₹/kWh
  monthlyUnitsUsage: number; // kWh
  roofAreaSqFt: number;
  locationCity: string;
  systemType: 'On-Grid Rooftop' | 'Hybrid with Battery' | 'Commercial Industrial';
  desiredOffsetPercentage: number; // 50 - 100%
  panelWattage: number; // 550W Mono PERC
  panelEfficiency: number; // 21.5%
  inverterEfficiency: number; // 98%
}

export interface SolarCalculationResults {
  recommendedCapacityKw: number;
  panelQuantity: number;
  estimatedDailyUnits: number;
  estimatedMonthlyUnits: number;
  estimatedAnnualUnits: number;
  estimatedMonthlySavings: number; // ₹
  estimatedAnnualSavings: number; // ₹
  estimatedSystemCost: number; // ₹
  centralSubsidyEstimate: number; // ₹ (PM Surya Ghar)
  netCustomerCost: number; // ₹
  paybackPeriodYears: number;
  lifetimeSavings25Years: number; // ₹
  co2ReductionTonsPerYear: number;
  treesEquivalentPlanted: number;
}

export interface ExpenseItem {
  id: string;
  expenseNumber: string;
  projectId?: string;
  projectName?: string;
  title: string;
  category: 'Civil & Structural' | 'DISCOM Fees' | 'Cranage & Lifting' | 'Freight & Logistics' | 'Electrical BOS' | 'Safety & PPE' | 'Testing & Inspection' | 'Travel & Site Allowance';
  amount: number;
  taxAmount: number;
  totalAmount: number;
  vendorName: string;
  paymentMode: 'Bank Transfer' | 'Company Card' | 'Petty Cash' | 'UPI';
  paymentDate: string;
  status: 'Paid' | 'Pending Approval' | 'Reimbursed';
  receiptReference?: string;
  recordedBy: string;
  notes?: string;
}

export interface Supplier {
  id: string;
  supplierCode: string;
  name: string;
  category: 'Solar Panels' | 'Inverters' | 'Mounting Structures' | 'DC/AC Cables' | 'Electrical BOS' | 'Earthing & Lightning';
  rating: number;
  gstin: string;
  contactPerson: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  paymentTerms: string;
  leadTimeDays: number;
  activeOrdersCount: number;
  isPreferred: boolean;
}

export interface PurchaseOrderItem {
  sku: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalAmount: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  orderDate: string;
  expectedDeliveryDate: string;
  deliveryWarehouse: string;
  items: PurchaseOrderItem[];
  subtotal: number;
  taxAmount: number;
  grandTotal: number;
  status: 'Draft' | 'Issued' | 'In-Transit' | 'Received' | 'Cancelled';
  grnNumber?: string;
  receivedDate?: string;
  notes?: string;
}

export interface MaterialAllocation {
  id: string;
  projectId: string;
  projectName: string;
  sku: string;
  productName: string;
  category: string;
  requiredQuantity: number;
  allocatedQuantity: number;
  unit: string;
  status: 'Planning' | 'Indented' | 'Allocated' | 'Dispatched' | 'Received on Site';
  dispatchDate?: string;
  warehouseLocation: string;
}

export type BomStatus = 'Draft' | 'Submitted' | 'Under Review' | 'Changes Requested' | 'Approved' | 'Rejected';

export interface BomItem {
  id: string;
  bomId: string;
  productId?: string;
  category: string;
  itemName: string;
  technicalSpecification: string;
  brandMake?: string;
  quantity: number;
  unit: string;
  estimatedUnitCost: number;
  estimatedTotalCost: number;
  remarks?: string;
  photoUrl?: string;
}

export interface ProjectBom {
  id: string;
  projectId?: string;
  surveyId?: string;
  version: number;
  status: BomStatus;
  preparedById?: string;
  preparedByName?: string;
  approvedById?: string;
  approvedByName?: string;
  totalEstimatedCost: number;
  revisionComments?: string;
  items: BomItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CustomerDocument {
  id: string;
  customerId?: string;
  projectId?: string;
  surveyId?: string;
  documentType: string;
  idNumber?: string;
  customerPhotoPath?: string;
  docFrontPath?: string;
  docBackPath?: string;
  notes?: string;
  uploadedById?: string;
  uploadedByName?: string;
  uploadedAt: string;
}

export interface GrnItem {
  id: string;
  grnId: string;
  bomItemId?: string;
  itemName: string;
  orderedQty: number;
  receivedQty: number;
  acceptedQty: number;
  damagedQty: number;
  rejectedQty: number;
  damagePhotoPath?: string;
  remarks?: string;
}

export interface GoodsReceiptNote {
  id: string;
  poId: string;
  projectId?: string;
  supplierId?: string;
  challanNumber: string;
  challanDate?: string;
  receivedDate: string;
  deliveryLocation?: string;
  challanDocumentPath?: string;
  hasDiscrepancy: boolean;
  discrepancySummary?: string;
  receivedById?: string;
  receivedByName?: string;
  items: GrnItem[];
  createdAt: string;
}

export interface InstallationAttendance {
  id: string;
  projectId: string;
  date: string;
  teamLeadId?: string;
  teamLeadName?: string;
  techniciansPresent: { id: string; name: string }[];
  checkInTime: string;
  gpsLat?: number;
  gpsLng?: number;
  status: 'On_Site' | 'En_Route' | 'Weather_Delay' | 'Site_Inaccessible';
  notes?: string;
}

export interface InstallationProgressLog {
  id: string;
  projectId: string;
  reportedDate: string;
  stageReached: string;
  progressPercent: number;
  isBlocked: boolean;
  blockerReason?: string;
  materialsReadyConfirmed: boolean;
  photos?: string[];
  reportedById?: string;
  createdAt: string;
}


