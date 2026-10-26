import React, { useState } from 'react';
import { 
  PackageSearch, CheckCircle2, ShieldCheck, 
  ArrowRight, FileText, Check, DollarSign, Sun 
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';

interface SolarPackage {
  id: string;
  name: string;
  capacityKw: number;
  badge: string;
  targetAudience: string;
  grossPrice: number;
  subsidy: number;
  netPrice: number;
  monthlyGeneration: string;
  panelsCount: number;
  inverterSpec: string;
  features: string[];
}

export const SolarPackagesView: React.FC = () => {
  const { createQuotation, leads } = useCrm();

  const [selectedLeadId, setSelectedLeadId] = useState(leads[0]?.id || '');
  const [quotedPackageId, setQuotedPackageId] = useState<string | null>(null);

  const packages: SolarPackage[] = [
    {
      id: 'PKG-3KW',
      name: '3 kW Eco Home System',
      capacityKw: 3,
      badge: 'Popular for Homes',
      targetAudience: '2-3 BHK Apartments & Independent Houses (Bill: ₹2,500 - ₹4,500/mo)',
      grossPrice: 195000,
      subsidy: 78000,
      netPrice: 117000,
      monthlyGeneration: '360 - 400 kWh',
      panelsCount: 6,
      inverterSpec: '3.3 kW Single Phase Dual MPPT with Cloud WiFi',
      features: [
        'Waaree / Adani ALMM Mono PERC 550W Modules',
        'Hot Dip Galvanized (HDG) Rooftop Structure',
        'Polycab DC Solar Cables with UV Conduit',
        'DISCOM Net-metering documentation included',
        '10-Year Inverter / 25-Year Panel Warranty',
      ],
    },
    {
      id: 'PKG-5KW',
      name: '5 kW Premium Villa Care',
      capacityKw: 5,
      badge: 'Best Value',
      targetAudience: 'Villas, Duplexes & Joint Families with Multiple ACs (Bill: ₹5,000 - ₹9,000/mo)',
      grossPrice: 295000,
      subsidy: 78000,
      netPrice: 217000,
      monthlyGeneration: '600 - 680 kWh',
      panelsCount: 10,
      inverterSpec: '5 kW Three Phase Grid Inverter with Remote Mobile App',
      features: [
        '550W Bifacial High Efficiency Glass-to-Glass Panels',
        'Elevated 80-micron HDG Walkway Structure',
        'Schneider ACDB / DCDB with Type II SPDs',
        'Copper Bonded Chemical Earthing Pits (3 Nos)',
        '1 Year Comprehensive Free O&M Included',
      ],
    },
    {
      id: 'PKG-10KW',
      name: '10 kW Commercial Pro',
      capacityKw: 10,
      badge: 'Commercial',
      targetAudience: 'Clinics, Offices, Showrooms & Petrol Pumps (Bill: ₹12,000 - ₹20,000/mo)',
      grossPrice: 540000,
      subsidy: 0,
      netPrice: 540000,
      monthlyGeneration: '1,200 - 1,400 kWh',
      panelsCount: 18,
      inverterSpec: '10 kW Three Phase High-Yield String Inverter',
      features: [
        '40% Accelerated Depreciation tax benefit eligible',
        'Tier-1 TopCon Half-Cut Bifacial Modules',
        'Zero Export Device ready (if DISCOM quota delayed)',
        'Class-1 Accuracy Bi-directional Energy Metering',
        'Comprehensive 5-Year Maintenance Contract Included',
      ],
    },
    {
      id: 'PKG-25KW',
      name: '25 kW Industrial High-Yield',
      capacityKw: 25,
      badge: 'Industrial',
      targetAudience: 'Warehouses, Manufacturing Workshops & Cold Storage',
      grossPrice: 1250000,
      subsidy: 0,
      netPrice: 1250000,
      monthlyGeneration: '3,200 - 3,600 kWh',
      panelsCount: 46,
      inverterSpec: '25 kW Commercial Inverter with SCADA / RS485 Interface',
      features: [
        'Tin Shed Klip-Lok or RCC Penetration-Free Rail Mounts',
        'CEIG Safety Approval and CEIG drawings endorsement',
        'ESE Lightning Protection System with 40m radius',
        'Dedicated Plant Performance Dashboard',
      ],
    },
  ];

  const handleCreatePackageQuote = (pkg: SolarPackage) => {
    const lead = leads.find(l => l.id === selectedLeadId);
    createQuotation({
      leadId: selectedLeadId,
      leadName: lead?.name || 'Customer',
      customerPhone: lead?.phone || '+91 98000-00000',
      customerAddress: lead?.address || 'Bengaluru',
      systemCapacityKw: pkg.capacityKw,
    });
    setQuotedPackageId(pkg.id);
    setTimeout(() => setQuotedPackageId(null), 3000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <PackageSearch className="w-5 h-5 text-emerald-600" />
            <span>Turnkey Solar EPC Standard Packages</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Pre-engineered BOM bundles optimized for residential subsidy and commercial payback.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="font-bold text-slate-700">Quote For Lead:</span>
          <select
            value={selectedLeadId}
            onChange={e => setSelectedLeadId(e.target.value)}
            className="p-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800"
          >
            {leads.map(l => (
              <option key={l.id} value={l.id}>
                {l.name} ({l.city}) - Needs ~{l.recommendedKw}kW
              </option>
            ))}
          </select>
        </div>
      </div>

      {quotedPackageId && (
        <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
          <span>Quotation for package successfully generated in Quotations section!</span>
        </div>
      )}

      {/* Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {packages.map(pkg => (
          <div
            key={pkg.id}
            className="bg-white rounded-2xl border border-slate-200 hover:border-emerald-400 p-5 shadow-xs flex flex-col justify-between transition-all space-y-4 hover:shadow-md relative overflow-hidden"
          >
            <div>
              <div className="flex items-start justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {pkg.badge}
                </span>
                <span className="font-mono text-[10px] text-slate-400 font-bold">{pkg.id}</span>
              </div>

              <h3 className="text-base font-black text-slate-900 mt-2">{pkg.name}</h3>
              <p className="text-[11px] text-slate-500 mt-1 leading-snug">{pkg.targetAudience}</p>

              {/* Pricing */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <div className="flex items-baseline justify-between">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Net Investment</span>
                  {pkg.subsidy > 0 && (
                    <span className="text-[10px] text-emerald-700 font-bold">
                      Subsidy: ₹{pkg.subsidy.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>
                <div className="text-2xl font-black text-slate-900 mt-0.5">
                  ₹{pkg.netPrice.toLocaleString('en-IN')}
                </div>
                {pkg.subsidy > 0 && (
                  <div className="text-[10px] text-slate-400 line-through">
                    Gross: ₹{pkg.grossPrice.toLocaleString('en-IN')}
                  </div>
                )}
              </div>

              {/* Key Specs */}
              <div className="mt-4 space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="flex justify-between">
                  <span className="text-[11px]">Monthly Yield:</span>
                  <strong className="text-slate-900 text-[11px]">{pkg.monthlyGeneration}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[11px]">Panel Modules:</span>
                  <strong className="text-slate-900 text-[11px]">{pkg.panelsCount} × 550W</strong>
                </div>
                <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-200/60 leading-tight">
                  {pkg.inverterSpec}
                </div>
              </div>

              {/* Feature Checklist */}
              <div className="mt-4 space-y-1.5 text-[11px] text-slate-600">
                {pkg.features.map((feat, i) => (
                  <div key={i} className="flex items-start gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => handleCreatePackageQuote(pkg)}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Quote This Package</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
