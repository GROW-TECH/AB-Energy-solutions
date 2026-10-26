/**
 * AB Energy Solutions — Authoritative Solar EPC Quotation Engine
 * 
 * Centralized calculation service for preliminary estimates, engineering proposals,
 * pricing, Bill of Materials (BOM), item-wise GST, government subsidies, and financial projections.
 * 
 * Shared between frontend client previews and backend server validation.
 */

export interface CustomLineItemInput {
  id?: string;
  category?: 'Panels' | 'Inverter' | 'Structure' | 'Cabling' | 'Protection & BOS' | 'Installation & Commissioning' | 'Discom Net Metering' | string;
  description?: string;
  specification?: string;
  make?: string;
  makeModel?: string;
  hsnSacCode?: string;
  quantity?: number;
  unit?: string;
  unitPrice?: number;
  gstRate?: number;
}

export interface QuotationCalculationInput {
  leadId?: string;
  leadName?: string;
  customerPhone?: string;
  customerAddress?: string;
  customerCategory?: 'Residential' | 'Commercial' | 'Industrial' | 'Institutional';
  systemCapacityKw: number;
  packageTier?: 'Standard' | 'Premium Bifacial' | 'Commercial Heavy Duty';
  discountAmount?: number;
  surveyId?: string;
  isSurveyApproved?: boolean;
  roofType?: 'RCC Flat' | 'Metal Sheet' | 'Tiled' | 'Elevated';
  discomName?: string;
  sanctionedLoadKw?: number;
  customTariffPerKwh?: number;
  taxMode?: 'ITEMIZED' | 'COMPOSITE';
  taxType?: 'CGST_SGST' | 'IGST';
  customerState?: string;
  supplierState?: string;
  customItems?: CustomLineItemInput[];
}

export interface QuotationLineItem {
  id: string;
  category: 'Panels' | 'Inverter' | 'Structure' | 'Cabling' | 'Protection & BOS' | 'Installation & Commissioning' | 'Discom Net Metering' | string;
  description: string;
  specification?: string;
  make?: string;
  makeModel: string;
  hsnSacCode: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  grossAmount: number;
  discountAmount: number;
  taxableAmount: number;
  gstRate: number; // e.g. 5, 12, 18
  taxType: 'CGST_SGST' | 'IGST';
  cgstRate: number;
  sgstRate: number;
  igstRate: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  taxAmount: number;
  totalPrice: number; // taxableAmount + taxAmount
  warrantyPeriod: string;
}

export interface QuotationCalculationResult {
  proposalType: 'Preliminary' | 'Final_Technical';
  packageTier: 'Standard' | 'Premium Bifacial' | 'Commercial Heavy Duty';
  systemCapacityKw: number;
  actualCapacityKwp: number;
  panelCount: number;
  moduleWattageW: number;
  inverterDescription: string;
  items: QuotationLineItem[];
  
  // Financial breakdown
  subtotal: number; // Gross total before discount
  discountAmount: number;
  requiresApproval: boolean;
  approvalStatus: 'Approved' | 'Pending_Approval';
  taxableAmount: number; // Net taxable base (subtotal - discount)
  
  // Tax details
  taxMode: 'ITEMIZED' | 'COMPOSITE';
  taxType: 'CGST_SGST' | 'IGST';
  gstRate: number; // Effective weighted GST rate (%)
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  gstAmount: number; // Total GST across all lines
  finalContractAmount: number; // Legally payable under contract (taxable + tax)
  amountInWords: string;
  
  // Government Subsidy (PM Surya Ghar: Muft Bijli Yojana)
  subsidyEligible: boolean;
  subsidyAmount: number;
  subsidyNotes: string;
  indicativeNetCustomerCost: number; // Post-DBT subsidy indicative cost
  
  // Projections
  annualGenerationKwh: number;
  annualSavingsInr: number;
  lifetimeSavings25Yr: number;
  simplePaybackYears: number;
  tariffAssumedPerKwh: number;
  
  // Milestones & Terms
  milestones: {
    advanceBooking: { percentage: number; amount: number; description: string };
    materialDispatch: { percentage: number; amount: number; description: string };
    finalHandover: { percentage: number; amount: number; description: string };
  };
  terms: string[];
  warranties: {
    panels: string;
    inverter: string;
    structure: string;
    workmanship: string;
  };
}

// Configurable Company Policies & Statutory Defaults
export const QUOTATION_CONFIG = {
  // Discount threshold requiring manager approval
  DISCOUNT_APPROVAL_THRESHOLD_INR: 15000,
  MAX_DISCOUNT_PERCENT: 15, // max 15% discount allowed
  
  // Default Company Location (Karnataka / Tamil Nadu)
  DEFAULT_SUPPLIER_STATE: 'Karnataka',
  DEFAULT_SUPPLIER_GSTIN: '29AABCS1429B1Z8',
  
  // Client-Configured Statutory Defaults:
  // - Solar Panels & Inverters: 5% GST
  // - Structure, Cables/BOS, Installation Services: 18% GST
  DEFAULT_GST_RATES: {
    PANELS: 5,
    INVERTER: 5,
    STRUCTURE: 18,
    BOS: 18,
    INSTALLATION: 18,
  },
  
  // Standard HSN / SAC Codes
  DEFAULT_HSN_CODES: {
    PANELS: '8541',
    INVERTER: '8504',
    STRUCTURE: '7308',
    BOS: '8544',
    INSTALLATION: '9954',
  },
  
  // Legacy composite rate for backward compatibility
  COMPOSITE_GST_RATE: 13.8, // 70% goods @ 12% + 30% services @ 18%
  
  // Solar irradiance & financial defaults
  SPECIFIC_YIELD_KWH_PER_KWP: 1450,
  DEFAULT_TARIFF_INR: 8.20,
  
  // PM Surya Ghar Muft Bijli Yojana Central Subsidy Slabs (Residential Only)
  RESIDENTIAL_SUBSIDY: {
    SLAB_1KW_MAX: 30000,
    SLAB_2KW_MAX: 60000,
    SLAB_3KW_AND_ABOVE_MAX: 78000,
  },
};

/**
 * Converts a numeric currency amount into formal Indian English words.
 * Example: 349366 -> "Rupees Three Lakh Forty-Nine Thousand Three Hundred Sixty-Six Only"
 */
export function convertNumberToWords(amount: number): string {
  const rounded = Math.round(Number(amount) || 0);
  if (rounded === 0) return 'Rupees Zero Only';

  const units = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertHundreds(n: number): string {
    let str = '';
    if (n >= 100) {
      str += units[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 20) {
      str += tens[Math.floor(n / 10)] + (n % 10 ? ' ' + units[n % 10] : '');
    } else if (n > 0) {
      str += units[n];
    }
    return str.trim();
  }

  let words = '';
  let crore = Math.floor(rounded / 10000000);
  let remCrore = rounded % 10000000;
  let lakh = Math.floor(remCrore / 100000);
  let remLakh = remCrore % 100000;
  let thousand = Math.floor(remLakh / 1000);
  let remThousand = remLakh % 1000;

  if (crore > 0) words += convertHundreds(crore) + ' Crore ';
  if (lakh > 0) words += convertHundreds(lakh) + ' Lakh ';
  if (thousand > 0) words += convertHundreds(thousand) + ' Thousand ';
  if (remThousand > 0) words += convertHundreds(remThousand);

  return `Rupees ${words.trim()} Only`;
}

/**
 * Determines whether a transaction is Intrastate (CGST+SGST) or Interstate (IGST)
 */
export function resolveTaxType(input: QuotationCalculationInput): 'CGST_SGST' | 'IGST' {
  if (input.taxType) return input.taxType;

  const supplier = (input.supplierState || QUOTATION_CONFIG.DEFAULT_SUPPLIER_STATE).toLowerCase().trim();
  const address = (input.customerAddress || '').toLowerCase();
  const customerState = (input.customerState || '').toLowerCase().trim();

  // If customer is specifically noted as another state (e.g. Kerala, Andhra, Maharashtra, Delhi)
  if (customerState && customerState !== supplier) {
    return 'IGST';
  }

  // Check state hints in address
  if (supplier === 'karnataka') {
    if (address.includes('tamil nadu') || address.includes('kerala') || address.includes('andhra') || address.includes('telangana') || address.includes('delhi')) {
      return 'IGST';
    }
  } else if (supplier === 'tamil nadu') {
    if (address.includes('karnataka') || address.includes('bengaluru') || address.includes('bangalore') || address.includes('kerala')) {
      return 'IGST';
    }
  }

  // Default to Intrastate for domestic customer locations
  return 'CGST_SGST';
}

/**
 * Calculates a complete, mathematically verified solar quotation with Item-Wise GST.
 * Deterministic and stateless.
 */
export function calculateQuotation(input: QuotationCalculationInput): QuotationCalculationResult {
  const capacityKw = Math.max(0.5, Number(input.systemCapacityKw) || 5);
  const tier = input.packageTier || 'Premium Bifacial';
  const category = input.customerCategory || (capacityKw > 20 ? 'Commercial' : 'Residential');
  const roof = input.roofType || 'RCC Flat';
  const tariff = input.customTariffPerKwh || QUOTATION_CONFIG.DEFAULT_TARIFF_INR;
  const isApproved = Boolean(input.isSurveyApproved);
  const taxMode: 'ITEMIZED' | 'COMPOSITE' = input.taxMode || 'ITEMIZED';
  const taxType = resolveTaxType(input);

  // 1. Sizing and Module Selection
  let moduleWattageW = 550;
  let moduleBrand = 'Waaree 550W Mono PERC Half-Cut Bifacial (ALMM Approved)';
  let modulePrice = 11500; // ~₹20.9/W

  if (tier === 'Premium Bifacial') {
    moduleWattageW = 575;
    moduleBrand = 'Jinko 575W Tiger Neo N-Type TOPCon Bifacial Module';
    modulePrice = 12800; // ~₹22.2/W
  } else if (tier === 'Commercial Heavy Duty') {
    moduleWattageW = 550;
    moduleBrand = 'Waaree 550W High-Efficiency Bifacial Mono PERC';
    modulePrice = 11200;
  }

  const panelCount = Math.ceil((capacityKw * 1000) / moduleWattageW);
  const actualCapacityKwp = Number(((panelCount * moduleWattageW) / 1000).toFixed(2));
  const panelTotal = panelCount * modulePrice;

  // 2. Inverter Matching
  let inverterDesc = '';
  let inverterPrice = 0;
  let inverterBrand = '';

  if (capacityKw <= 3) {
    inverterDesc = '3 kW Single-Phase Grid-Tied Inverter with Dual MPPT and Cloud WiFi';
    inverterBrand = 'Sungrow / Growatt 3K-1P';
    inverterPrice = 32000;
  } else if (capacityKw <= 5) {
    inverterDesc = '5 kW Single/Three-Phase Dual-MPPT Inverter with WiFi & IP65';
    inverterBrand = 'Sungrow SG5.0RT / Growatt';
    inverterPrice = 38500;
  } else if (capacityKw <= 10) {
    inverterDesc = '10 kW Three-Phase 415V Grid Inverter with Dual MPPT & DC Switch';
    inverterBrand = 'Sungrow SG10RT 3-Phase';
    inverterPrice = 68000;
  } else if (capacityKw <= 25) {
    inverterDesc = `${capacityKw} kW Three-Phase Dual-MPPT Commercial Inverter with Cloud Monitoring`;
    inverterBrand = 'Sungrow SG20RT / Growatt 25K';
    inverterPrice = 115000;
  } else {
    inverterDesc = `${capacityKw} kW Commercial Multi-MPPT High Yield Solar Inverter`;
    inverterBrand = 'Growatt MAX / Sungrow Commercial';
    inverterPrice = Math.round(capacityKw * 4300);
  }

  // 3. Mounting Structure (Scaled per kW)
  let structureRatePerKw = 2500;
  let structureDesc = 'Hot Dip Galvanized (HDG) 80-micron elevated structure (15° Tilt)';
  if (roof === 'Metal Sheet') {
    structureRatePerKw = 1900;
    structureDesc = 'Anodized Aluminum AL6005-T5 Mini-Rail structure with EPDM rubber gaskets';
  } else if (tier === 'Premium Bifacial') {
    structureRatePerKw = 2800;
    structureDesc = 'Heavy Duty 80-micron HDG elevated mounting structure with SS304 fasteners';
  }
  const structureTotal = Math.round(capacityKw * structureRatePerKw);

  // 4. Protection & Balance of System (BOS)
  const bosRatePerKw = tier === 'Premium Bifacial' ? 4800 : 4500;
  const bosTotal = Math.round(capacityKw * bosRatePerKw);
  const bosDesc = 'ACDB & DCDB with Type-II SPDs, Polycab Solar DC/AC Cables, Chemical Earthing Pits & ESE Lightning Arrester';

  // 5. Turnkey Installation & Commissioning
  const installRatePerKw = tier === 'Premium Bifacial' ? 4200 : 4000;
  const installTotal = Math.round(capacityKw * installRatePerKw);
  const installDesc = 'Complete civil mounting, cable routing in conduits, safety labeling, DISCOM net-metering liaison and synchronization';

  // Base raw materials before tax & discount allocation
  let rawItems: Array<{
    id: string;
    category: QuotationLineItem['category'];
    description: string;
    specification?: string;
    make?: string;
    makeModel: string;
    hsnSacCode: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    grossAmount: number;
    defaultGstRate: number;
    warrantyPeriod: string;
  }> = [];

  if (input.customItems && input.customItems.length > 0) {
    rawItems = input.customItems.map((ci: any, idx: number) => {
      const catLower = (ci.category || ci.description || '').toLowerCase();
      // Solar panels and inverters attract 5% GST; all other materials (BOS, structure, cables) attract 18% GST
      const isFivePercent = 
        catLower.includes('solar') || 
        catLower.includes('panel') || 
        catLower.includes('inverter') || 
        catLower.includes('module');
      const defaultGst = isFivePercent ? 5 : 18;
      const gstRate = ci.gstRate !== undefined ? ci.gstRate : defaultGst;
      const hsn = ci.hsnSacCode || (isFivePercent ? '8541' : (catLower.includes('cable') || catLower.includes('wire') ? '8544' : '7308'));
      const qty = Number(ci.quantity) || 1;
      const rate = Number(ci.unitPrice !== undefined ? ci.unitPrice : ci.estimated_unit_cost) || 0;
      const gross = Math.round(qty * rate);
      const spec = ci.specification || ci.technical_specification || '';
      const make = ci.make || ci.brand_make || '';
      const makeModel = ci.makeModel || `${make} ${spec}`.trim() || 'Standard';

      return {
        id: ci.id || `QI-${idx + 1}`,
        category: ci.category || 'General',
        description: ci.description || ci.item_name || ci.category,
        specification: spec,
        make: make,
        makeModel: makeModel,
        hsnSacCode: hsn,
        quantity: qty,
        unit: ci.unit || 'Nos',
        unitPrice: rate,
        grossAmount: gross,
        defaultGstRate: gstRate,
        warrantyPeriod: ci.warrantyPeriod || (isFivePercent ? '10-Yr Replacement / 25-Yr Performance' : '5-Yr Comprehensive Warranty'),
      };
    });
  } else {
    rawItems = [
      {
        id: 'QI-1',
        category: 'Panels',
        description: `${panelCount} × ${moduleBrand}`,
        specification: `${moduleWattageW}W Mono PERC Bifacial`,
        make: moduleBrand.split(' ')[0] || 'Waaree',
        makeModel: moduleBrand,
        hsnSacCode: QUOTATION_CONFIG.DEFAULT_HSN_CODES.PANELS,
        quantity: panelCount,
        unit: 'Nos',
        unitPrice: modulePrice,
        grossAmount: panelTotal,
        defaultGstRate: QUOTATION_CONFIG.DEFAULT_GST_RATES.PANELS, // 5%
        warrantyPeriod: '12-Yr Product / 25-Yr Linear Performance',
      },
      {
        id: 'QI-2',
        category: 'Inverter',
        description: inverterDesc,
        specification: `${capacityKw} kW Grid-Tied Inverter`,
        make: inverterBrand.split(' ')[0] || 'Sungrow',
        makeModel: inverterBrand,
        hsnSacCode: QUOTATION_CONFIG.DEFAULT_HSN_CODES.INVERTER,
        quantity: 1,
        unit: 'Unit',
        unitPrice: inverterPrice,
        grossAmount: inverterPrice,
        defaultGstRate: QUOTATION_CONFIG.DEFAULT_GST_RATES.INVERTER, // 5%
        warrantyPeriod: '10-Yr Replacement Warranty',
      },
      {
        id: 'QI-3',
        category: 'Structure',
        description: structureDesc,
        specification: 'Pre-Galvanized / Mini Rail',
        make: 'Reputed',
        makeModel: 'AB Solar HDG Custom Fabricated',
        hsnSacCode: QUOTATION_CONFIG.DEFAULT_HSN_CODES.STRUCTURE,
        quantity: capacityKw,
        unit: 'kW',
        unitPrice: structureRatePerKw,
        grossAmount: structureTotal,
        defaultGstRate: QUOTATION_CONFIG.DEFAULT_GST_RATES.STRUCTURE, // 18%
        warrantyPeriod: '10-Yr Anti-Corrosion Warranty',
      },
      {
        id: 'QI-4',
        category: 'Protection & BOS',
        description: bosDesc,
        specification: '63A DCDB & ACDB with SPDs',
        make: 'Schneider / L&T / Polycab',
        makeModel: 'Schneider / L&T / Polycab',
        hsnSacCode: QUOTATION_CONFIG.DEFAULT_HSN_CODES.BOS,
        quantity: 1,
        unit: 'Set',
        unitPrice: bosTotal,
        grossAmount: bosTotal,
        defaultGstRate: QUOTATION_CONFIG.DEFAULT_GST_RATES.BOS, // 18%
        warrantyPeriod: '5-Yr Comprehensive Warranty',
      },
      {
        id: 'QI-5',
        category: 'Installation & Commissioning',
        description: installDesc,
        specification: 'Civil mounting & liaison',
        make: 'AB Energy Solutions',
        makeModel: 'AB Energy Solutions Certified EPC Crew',
        hsnSacCode: QUOTATION_CONFIG.DEFAULT_HSN_CODES.INSTALLATION,
        quantity: 1,
        unit: 'Turnkey',
        unitPrice: installTotal,
        grossAmount: installTotal,
        defaultGstRate: QUOTATION_CONFIG.DEFAULT_GST_RATES.INSTALLATION, // 18%
        warrantyPeriod: '5-Yr Comprehensive Workmanship & O&M',
      },
    ];
  }

  // 6. Subtotal Calculation
  const subtotal = rawItems.reduce((sum, item) => sum + item.grossAmount, 0);

  // 7. Discount & Approval Validation
  let rawDiscount = Math.max(0, Number(input.discountAmount) || 0);
  const maxAllowedDiscount = Math.round(subtotal * (QUOTATION_CONFIG.MAX_DISCOUNT_PERCENT / 100));
  if (rawDiscount > maxAllowedDiscount) {
    rawDiscount = maxAllowedDiscount;
  }

  const requiresApproval = rawDiscount > QUOTATION_CONFIG.DISCOUNT_APPROVAL_THRESHOLD_INR;
  const approvalStatus = requiresApproval ? 'Pending_Approval' : 'Approved';
  const taxableAmount = Math.max(0, subtotal - rawDiscount);

  // 8. Item-Wise Discount Allocation & GST Calculation
  // Discounter shares proportionally across lines so tax is calculated strictly on discounted taxable values.
  let allocatedDiscountTotal = 0;
  const items: QuotationLineItem[] = rawItems.map((raw, idx) => {
    let lineDiscount = 0;
    if (subtotal > 0 && rawDiscount > 0) {
      if (idx === rawItems.length - 1) {
        // Last item absorbs rounding difference so exact discount matches
        lineDiscount = rawDiscount - allocatedDiscountTotal;
      } else {
        lineDiscount = Math.round((raw.grossAmount / subtotal) * rawDiscount);
        allocatedDiscountTotal += lineDiscount;
      }
    }
    const lineTaxable = Math.max(0, raw.grossAmount - lineDiscount);
    const gstRate = taxMode === 'COMPOSITE' ? QUOTATION_CONFIG.COMPOSITE_GST_RATE : raw.defaultGstRate;

    const lineTax = Math.round(lineTaxable * (gstRate / 100));

    let cgstRate = 0;
    let sgstRate = 0;
    let igstRate = 0;
    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;

    if (taxType === 'IGST') {
      igstRate = gstRate;
      igstAmount = lineTax;
    } else {
      cgstRate = Number((gstRate / 2).toFixed(2));
      sgstRate = Number((gstRate / 2).toFixed(2));
      cgstAmount = Math.round(lineTax / 2);
      sgstAmount = lineTax - cgstAmount; // Balance cents/rupees
    }

    return {
      id: raw.id,
      category: raw.category,
      description: raw.description,
      specification: raw.specification,
      make: raw.make,
      makeModel: raw.makeModel,
      hsnSacCode: raw.hsnSacCode,
      quantity: raw.quantity,
      unit: raw.unit,
      unitPrice: raw.unitPrice,
      grossAmount: raw.grossAmount,
      discountAmount: lineDiscount,
      taxableAmount: lineTaxable,
      gstRate,
      taxType,
      cgstRate,
      sgstRate,
      igstRate,
      cgstAmount,
      sgstAmount,
      igstAmount,
      taxAmount: lineTax,
      totalPrice: lineTaxable + lineTax,
      warrantyPeriod: raw.warrantyPeriod,
    };
  });

  // Totals across all lines
  const totalCgstAmount = items.reduce((sum, item) => sum + item.cgstAmount, 0);
  const totalSgstAmount = items.reduce((sum, item) => sum + item.sgstAmount, 0);
  const totalIgstAmount = items.reduce((sum, item) => sum + item.igstAmount, 0);
  const totalGstAmount = totalCgstAmount + totalSgstAmount + totalIgstAmount;
  const finalContractAmount = taxableAmount + totalGstAmount;
  const effectiveGstRate = taxableAmount > 0 ? Number(((totalGstAmount / taxableAmount) * 100).toFixed(2)) : 0;
  const amountInWords = convertNumberToWords(finalContractAmount);

  // 9. Government Subsidy Calculation (PM Surya Ghar: Muft Bijli Yojana)
  let subsidyEligible = false;
  let subsidyAmount = 0;
  let subsidyNotes = '';

  if (category === 'Residential') {
    subsidyEligible = true;
    if (capacityKw <= 1) {
      subsidyAmount = QUOTATION_CONFIG.RESIDENTIAL_SUBSIDY.SLAB_1KW_MAX;
      subsidyNotes = 'PM Surya Ghar: ₹30,000 for 1 kW residential rooftop';
    } else if (capacityKw <= 2) {
      subsidyAmount = QUOTATION_CONFIG.RESIDENTIAL_SUBSIDY.SLAB_2KW_MAX;
      subsidyNotes = 'PM Surya Ghar: ₹60,000 for 2 kW residential rooftop';
    } else {
      subsidyAmount = QUOTATION_CONFIG.RESIDENTIAL_SUBSIDY.SLAB_3KW_AND_ABOVE_MAX;
      subsidyNotes = 'PM Surya Ghar: ₹78,000 maximum capped central subsidy for ≥ 3 kW';
    }
  } else {
    subsidyEligible = false;
    subsidyAmount = 0;
    subsidyNotes = 'Commercial / Industrial / Institutional installations are not eligible for PM Surya Ghar residential central subsidy.';
  }

  // Indicative net customer investment (Post Direct Benefit Transfer)
  const indicativeNetCustomerCost = Math.max(0, finalContractAmount - subsidyAmount);

  // 10. Projections
  const annualGenerationKwh = Math.round(actualCapacityKwp * QUOTATION_CONFIG.SPECIFIC_YIELD_KWH_PER_KWP);
  const annualSavingsInr = Math.round(annualGenerationKwh * tariff);
  const lifetimeSavings25Yr = Math.round(annualSavingsInr * 25);
  const simplePaybackYears = annualSavingsInr > 0 ? Number((indicativeNetCustomerCost / annualSavingsInr).toFixed(1)) : 0;

  // 11. Payment Milestones (40% / 50% / 10%)
  const advanceAmount = Math.round(finalContractAmount * 0.40);
  const dispatchAmount = Math.round(finalContractAmount * 0.50);
  const handoverAmount = finalContractAmount - advanceAmount - dispatchAmount;

  return {
    proposalType: isApproved ? 'Final_Technical' : 'Preliminary',
    packageTier: tier,
    systemCapacityKw: capacityKw,
    actualCapacityKwp,
    panelCount,
    moduleWattageW,
    inverterDescription: inverterDesc,
    items,
    subtotal,
    discountAmount: rawDiscount,
    requiresApproval,
    approvalStatus,
    taxableAmount,
    taxMode,
    taxType,
    gstRate: effectiveGstRate,
    cgstAmount: totalCgstAmount,
    sgstAmount: totalSgstAmount,
    igstAmount: totalIgstAmount,
    gstAmount: totalGstAmount,
    finalContractAmount,
    amountInWords,
    subsidyEligible,
    subsidyAmount,
    subsidyNotes,
    indicativeNetCustomerCost,
    annualGenerationKwh,
    annualSavingsInr,
    lifetimeSavings25Yr,
    simplePaybackYears,
    tariffAssumedPerKwh: tariff,
    milestones: {
      advanceBooking: {
        percentage: 40,
        amount: advanceAmount,
        description: '40% Advance on project booking and detailed engineering approval',
      },
      materialDispatch: {
        percentage: 50,
        amount: dispatchAmount,
        description: '50% on material dispatch and arrival at installation site',
      },
      finalHandover: {
        percentage: 10,
        amount: handoverAmount,
        description: '10% upon DISCOM net-metering synchronization and commissioning handover',
      },
    },
    terms: [
      '40% Advance on project booking and detailed engineering approval.',
      '50% upon material dispatch against warehouse delivery challan.',
      '10% upon successful DISCOM net-metering synchronization and commissioning sign-off.',
      'Quotation valid for 14 calendar days from date of issuance.',
      'Central subsidy under PM Surya Ghar is credited directly by the Government to the customer bank account post DISCOM inspection via DBT.',
      'Standard 25-Year linear performance warranty on Tier-1 ALMM solar panels.',
    ],
    warranties: {
      panels: '12-Year Product Workmanship / 25-Year 80% Linear Power Output',
      inverter: '10-Year Comprehensive Replacement Warranty',
      structure: '10-Year Corrosion-Free Galvanization Warranty',
      workmanship: '5-Year Comprehensive EPC Workmanship & Operations & Maintenance',
    },
  };
}
