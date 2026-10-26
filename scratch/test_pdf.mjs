import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function test() {
  const { generateProposalPdf } = await import('../server/services/pdf-generator.ts');

  const sampleData = {
    quotationNumber: 'ABES/RT/2026/0148',
    versionNumber: 1,
    createdAt: new Date().toISOString(),
    validUntil: '2026-11-15',
    leadName: 'Vikrant Deshpande',
    customerPhone: '+91 97412-55890',
    customerAddress: '228, Sathya nagar, North Ammapet, Salem, Tamil Nadu',
    systemCapacityKw: 20,
    actualCapacityKwp: 20,
    packageTier: 'Commercial EPC',
    proposalType: 'Final_Technical',
    salespersonName: 'Vikram Mehta (Sales)',
    items: [
      { category: 'solar panels', specification: '600-630Wp Topcon panel', make: 'Waaree/Adani/Vikram/Premier', quantity: 20, unit: 'KWp', unitPrice: 28000, totalPrice: 560000, gstRate: 5 },
      { category: 'Inverter', specification: '20KW/3 Phase', make: 'Solis/Sungrow', quantity: 1, unit: 'Nos', unitPrice: 85000, totalPrice: 85000, gstRate: 5 },
      { category: 'Structure', specification: 'Pre- Galvanized/Mini Rail', make: 'Reputed', quantity: 1, unit: 'Set', unitPrice: 36000, totalPrice: 36000, gstRate: 18 },
      { category: 'DCDB', specification: '63A With SPD', make: 'Reputed', quantity: 1, unit: 'Nos', unitPrice: 6500, totalPrice: 6500, gstRate: 18 },
      { category: 'ACDB', specification: '3PN/63A MCB', make: 'Reputed', quantity: 1, unit: 'Nos', unitPrice: 7500, totalPrice: 7500, gstRate: 18 },
      { category: 'Earth Electrode', specification: 'Coper Bonded 100 Micron,19mm dia,1.2Mtr', make: 'Reputed', quantity: 3, unit: 'Nos', unitPrice: 3500, totalPrice: 10500, gstRate: 18 },
      { category: 'Earthing Wire', specification: '6 Sq mm Copper wire', make: 'polycab/RR cable', quantity: 90, unit: 'Mtrs', unitPrice: 45, totalPrice: 4050, gstRate: 18 },
      { category: 'Lightning Arrester', specification: 'Coper Bonded 100 Micron,19mm dia,1.2Mtr', make: 'Reputed', quantity: 1, unit: 'Nos', unitPrice: 4500, totalPrice: 4500, gstRate: 18 },
      { category: 'PVC pipe', specification: '1 inch', make: 'Reputed', quantity: 1, unit: 'Nos', unitPrice: 1800, totalPrice: 1800, gstRate: 18 },
      { category: 'MC4 Connector', specification: '1000V DC, IP68', make: 'Staubli', quantity: 3, unit: 'Sets', unitPrice: 350, totalPrice: 1050, gstRate: 18 },
      { category: 'DC cable', specification: '6Sqmm copper cable', make: 'Polycab / Equivalen', quantity: 200, unit: 'Mtrs', unitPrice: 65, totalPrice: 13000, gstRate: 18 },
      { category: 'AC Cable', specification: '3.5 Core × 35 Sq.mm al.armd Cable', make: 'Polycab / Equivalen', quantity: 35, unit: 'Mtrs', unitPrice: 320, totalPrice: 11200, gstRate: 18 },
      { category: 'SS Bolt &Nuts', specification: 'M8x25 SS203 grade', make: 'Reputed', quantity: 1, unit: 'Sets', unitPrice: 2500, totalPrice: 2500, gstRate: 18 },
      { category: 'Other Accessories', specification: 'As Required', make: 'Reputed', quantity: 1, unit: 'Sets', unitPrice: 3000, totalPrice: 3000, gstRate: 18 }
    ],
    subtotal: 746600,
    discountAmount: 0,
    taxableAmount: 746600,
    gstRate: 6.9,
    gstAmount: 51500,
    finalContractAmount: 798100,
    subsidyEligible: false,
    subsidyAmount: 0,
    indicativeNetCustomerCost: 798100,
    annualGenerationKwh: 29000,
    annualSavingsInr: 237800,
    lifetimeSavings25Yr: 5945000,
    simplePaybackYears: 3.5,
    terms: ['90% Advance Payment', '10% After Successful Commissioning']
  };

  const res = await generateProposalPdf(sampleData);
  console.log('PDF Generated successfully:', res);
  const stats = fs.statSync(res.filePath);
  console.log('PDF File size bytes:', stats.size);
}

test().catch(console.error);
