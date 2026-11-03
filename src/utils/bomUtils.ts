export interface BomDisplayItem {
  id: string;
  category: string;
  itemName: string;
  technicalSpecification: string;
  unit: string;
  quantity: number;
  remarks?: string;
  brandMake?: string;
}

export const getProjectBomItems = (
  commandCentreBomItems?: any[],
  capacityKw: number = 5
): BomDisplayItem[] => {
  if (commandCentreBomItems && commandCentreBomItems.length > 0) {
    return commandCentreBomItems.map((it: any, idx: number) => ({
      id: it.id ? String(it.id) : `bom-${idx + 1}`,
      category: it.category || 'Components',
      itemName: it.itemName || it.item_name || it.name || '',
      technicalSpecification: it.technicalSpecification || it.technical_specification || it.specification || '',
      brandMake: it.brandMake || it.brand_make || '',
      unit: it.unit || it.uom || 'Nos',
      quantity: Number(it.quantity || it.qty) || 1,
      remarks: it.remarks || '',
    }));
  }

  // 14 Standard verified items matching technical verification specifications
  return [
    { id: '1', category: 'Solar Panels', itemName: 'solar panels', technicalSpecification: '600 630Wp N Topcon', unit: 'kWp', quantity: capacityKw, remarks: 'Tier-1 Mono PERC / N Topcon (DCR Compliant)' },
    { id: '2', category: 'Electrical', itemName: 'MC4 Connector', technicalSpecification: '1000V DC, IP68', unit: 'Sets', quantity: 3, remarks: 'Waterproof crimp connector sets' },
    { id: '3', category: 'Cabling', itemName: 'DC cable', technicalSpecification: '6sqmm copper cable', unit: 'Mtrs', quantity: 15, remarks: 'Tinned copper solar grade DC cable' },
    { id: '4', category: 'Cabling', itemName: 'AC Cable', technicalSpecification: '3.5 Core × 6 Sq.mm Copper Cable', unit: 'Mtrs', quantity: 10, remarks: 'Armoured grid interconnection cable' },
    { id: '5', category: 'Hardware', itemName: 'SS Bolt &Nuts', technicalSpecification: 'M8x25 SS203 grade', unit: 'Sets', quantity: 1, remarks: 'Stainless steel module and structure fastening hardware' },
    { id: '6', category: 'Accessories', itemName: 'Other Accessories', technicalSpecification: 'As Required', unit: 'Sets', quantity: 1, remarks: 'Cable ties, ferrules, caution signages, and accessories' },
    { id: '7', category: 'Inverter', itemName: 'Inverter', technicalSpecification: `${capacityKw}KW/3 Phase`, unit: 'Nos', quantity: 1, remarks: 'On-Grid 3 Phase MPPT with WIFI remote monitoring' },
    { id: '8', category: 'Structure', itemName: 'Structure', technicalSpecification: 'GP Structure', unit: 'Set', quantity: 1, remarks: 'Pre-Galvanized / Mini Rail rooftop mounting structure' },
    { id: '9', category: 'Protection', itemName: 'DCDB', technicalSpecification: '32A MCB With SPD', unit: 'Nos', quantity: 1, remarks: '1000V DC protection box with Type-II SPD' },
    { id: '10', category: 'Protection', itemName: 'ACDB', technicalSpecification: '3PN/32A MCB with SPD', unit: 'Nos', quantity: 1, remarks: 'Bi-directional utility grid isolator with SPD' },
    { id: '11', category: 'Earthing', itemName: 'Earth Electrode', technicalSpecification: 'Copper Bonded 100 Micron, 19mm dia, 1Mtr', unit: 'Nos', quantity: 1, remarks: 'Chemical compound earthing electrode (< 2 Ohms)' },
    { id: '12', category: 'Earthing', itemName: 'Earthing Wire', technicalSpecification: '4 Sq mm Copper wire', unit: 'Mtrs', quantity: 60, remarks: 'Insulated copper grounding conductor' },
    { id: '13', category: 'Protection', itemName: 'Lightning Arrester', technicalSpecification: 'Copper Bonded 100 Micron, 19mm dia, 1Mtr', unit: 'Nos', quantity: 1, remarks: 'ESE Lightning protection rod mounted elevated' },
    { id: '14', category: 'Accessories', itemName: 'PVC pipe', technicalSpecification: '1 inch', unit: 'Nos', quantity: 1, remarks: 'Heavy duty UV resistant conduit' },
  ];
};

