import React, { useState } from 'react';
import { 
  Calculator, SunMedium, TrendingUp, DollarSign, 
  Leaf, ShieldCheck, ArrowRight, RotateCcw, FileText, CheckCircle2, Trees
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';

interface SolarCalculatorViewProps {
  onOpenNewLeadWithData?: (calcData: any) => void;
  onNavigateToQuotation?: () => void;
}

export const SolarCalculatorView: React.FC<SolarCalculatorViewProps> = ({
  onOpenNewLeadWithData,
  onNavigateToQuotation,
}) => {
  const { createQuotation } = useCrm();

  // Inputs
  const [monthlyBill, setMonthlyBill] = useState<number>(7500);
  const [tariffRate, setTariffRate] = useState<number>(8.0);
  const [roofAreaSqFt, setRoofAreaSqFt] = useState<number>(650);
  const [shadeFreePercent, setShadeFreePercent] = useState<number>(90);
  const [customerType, setCustomerType] = useState<'Residential' | 'Commercial' | 'Industrial'>('Residential');
  const [sunHoursPerDay, setSunHoursPerDay] = useState<number>(4.8);

  // Solar Calculations
  // Monthly units = Monthly bill / tariff
  const monthlyUnitsConsumed = Math.round(monthlyBill / tariffRate);
  const annualUnitsConsumed = monthlyUnitsConsumed * 12;

  // 1 kW solar in India generates ~4 units/day * 365 = 1460 units/year
  // Required kW to offset 100% of bill
  const rawKwNeeded = annualUnitsConsumed / 1460;
  
  // Available shadow-free roof area limit: ~100 sq.ft per kW
  const effectiveRoofArea = roofAreaSqFt * (shadeFreePercent / 100);
  const maxKwByRoof = effectiveRoofArea / 100;

  // Recommended system size (rounded to nearest 0.5 kW)
  const recommendedKw = Math.max(1, Math.min(Math.round(rawKwNeeded * 2) / 2, Math.floor(maxKwByRoof)));

  // Output Metrics
  const panelWattage = 550;
  const panelQuantity = Math.ceil((recommendedKw * 1000) / panelWattage);
  const dailyGenUnits = Number((recommendedKw * sunHoursPerDay * 0.82).toFixed(1));
  const annualGenUnits = Math.round(dailyGenUnits * 365);
  
  // Financials (₹ INR)
  const grossCostPerWatt = recommendedKw <= 3 ? 65 : recommendedKw <= 10 ? 58 : 50;
  const grossPlantCost = recommendedKw * 1000 * grossCostPerWatt;

  // PM Surya Ghar Muft Bijli Yojana Subsidy (Govt of India standard)
  let subsidy = 0;
  if (customerType === 'Residential') {
    if (recommendedKw === 1) subsidy = 30000;
    else if (recommendedKw === 2) subsidy = 60000;
    else if (recommendedKw >= 3) subsidy = 78000; // max cap
  }

  const netInvestmentCost = Math.max(0, grossPlantCost - subsidy);

  // Annual bill savings
  const annualSavings = Math.round(Math.min(annualUnitsConsumed, annualGenUnits) * tariffRate);
  const paybackYears = Number((netInvestmentCost / Math.max(1, annualSavings)).toFixed(1));

  // 25-Year Cumulative Savings (with 0.7% annual panel degradation and 3% electricity tariff escalation)
  let cumulative25YearSavings = 0;
  let runningTariff = tariffRate;
  let runningGen = annualGenUnits;
  for (let year = 1; year <= 25; year++) {
    cumulative25YearSavings += runningGen * runningTariff;
    runningGen *= 0.993; // 0.7% degradation
    runningTariff *= 1.03; // 3% tariff increase
  }
  cumulative25YearSavings = Math.round(cumulative25YearSavings - netInvestmentCost);

  // Environmental Impact
  // 1 unit solar = ~0.82 kg CO2 reduction
  const annualCo2ReductionTons = Number(((annualGenUnits * 0.82) / 1000).toFixed(1));
  const equivalentTreesPlanted = Math.round(annualCo2ReductionTons * 45);

  const [quoteCreatedAlert, setQuoteCreatedAlert] = useState(false);

  const handleInstantQuote = () => {
    createQuotation({
      leadName: 'Solar Calculation Prospect',
      customerPhone: '+91 98450-XXXXX',
      customerAddress: 'Site Roof, Bengaluru',
      systemCapacityKw: recommendedKw,
    });
    setQuoteCreatedAlert(true);
    setTimeout(() => setQuoteCreatedAlert(false), 3000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-emerald-600" />
            <span>Solar Engineering &amp; ROI Calculator</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Tariff simulation, PM Surya Ghar subsidy modeling, and 25-year financial payback projection.
          </p>
        </div>

        <button
          onClick={handleInstantQuote}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors self-start sm:self-auto"
        >
          <FileText className="w-4 h-4" />
          <span>Convert Calculation to Quotation</span>
        </button>
      </div>

      {quoteCreatedAlert && (
        <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
          <span>New Quotation for {recommendedKw} kW successfully created in Quotations module!</span>
        </div>
      )}

      {/* Main Grid: Inputs (Left) and Results / Charts (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Inputs (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="font-bold text-slate-900 text-sm">Site &amp; Consumption Inputs</h2>
            <button
              onClick={() => {
                setMonthlyBill(7500);
                setTariffRate(8.0);
                setRoofAreaSqFt(650);
                setShadeFreePercent(90);
              }}
              className="text-[11px] text-slate-400 hover:text-slate-600 flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Customer Consumer Category
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['Residential', 'Commercial', 'Industrial'] as const).map(cat => (
                <button
                  key={cat}
                  onClick={() => setCustomerType(cat)}
                  className={`py-2 rounded-lg font-semibold text-xs transition-colors border ${
                    customerType === cat 
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-400' 
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold text-slate-700">Average Monthly Electricity Bill</label>
              <span className="font-extrabold text-slate-900 text-sm">₹{monthlyBill.toLocaleString('en-IN')}</span>
            </div>
            <input
              type="range"
              min={1000}
              max={100000}
              step={500}
              value={monthlyBill}
              onChange={e => setMonthlyBill(Number(e.target.value))}
              className="w-full accent-emerald-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
              <span>₹1,000 (125 units)</span>
              <span>₹50,000</span>
              <span>₹1,00,000</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold text-slate-700">Electricity Tariff Rate (₹ / kWh)</label>
              <span className="font-extrabold text-slate-900 text-sm">₹{tariffRate.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min={4}
              max={15}
              step={0.5}
              value={tariffRate}
              onChange={e => setTariffRate(Number(e.target.value))}
              className="w-full accent-emerald-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
              <span>₹4.0 (Subsidized)</span>
              <span>₹8.0 (BESCOM Avg)</span>
              <span>₹15.0 (Commercial Peak)</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold text-slate-700">Available Roof Area (Sq. Ft.)</label>
              <span className="font-extrabold text-slate-900 text-sm">{roofAreaSqFt} Sq. Ft.</span>
            </div>
            <input
              type="range"
              min={100}
              max={5000}
              step={50}
              value={roofAreaSqFt}
              onChange={e => setRoofAreaSqFt(Number(e.target.value))}
              className="w-full accent-emerald-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
              <span>100 sq.ft (1 kW)</span>
              <span>2,500 sq.ft</span>
              <span>5,000 sq.ft</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold text-slate-700">Shadow-Free Sun Clearance (%)</label>
              <span className="font-extrabold text-slate-900 text-sm">{shadeFreePercent}%</span>
            </div>
            <input
              type="range"
              min={50}
              max={100}
              step={5}
              value={shadeFreePercent}
              onChange={e => setShadeFreePercent(Number(e.target.value))}
              className="w-full accent-emerald-600"
            />
          </div>

          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
            <div className="flex justify-between">
              <span>Monthly Units Consumed:</span>
              <strong className="text-slate-800">{monthlyUnitsConsumed} Units (kWh)</strong>
            </div>
            <div className="flex justify-between">
              <span>Effective Shadow-Free Roof:</span>
              <strong className="text-slate-800">{Math.round(effectiveRoofArea)} Sq. Ft.</strong>
            </div>
          </div>
        </div>

        {/* Right Outputs & Projections (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Main Recommended Sizing Card */}
          <div className="bg-gradient-to-br from-[#0c1932] via-[#0f2244] to-[#122952] rounded-2xl p-6 text-white shadow-md border border-slate-800 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Recommended Sizing
                </span>
                <div className="text-3xl font-black mt-2 flex items-baseline gap-2">
                  <span>{recommendedKw}</span>
                  <span className="text-base text-emerald-400 font-bold">kW On-Grid System</span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  Requires {panelQuantity} × 550W Bifacial Mono PERC Modules &amp; {Math.round(recommendedKw * 95)} sq.ft roof.
                </p>
              </div>

              <div className="text-right">
                <div className="text-[11px] text-slate-400 font-medium">Simple Payback</div>
                <div className="text-2xl font-black text-emerald-400 mt-0.5">{paybackYears} Years</div>
                <div className="text-[10px] text-slate-400">ROI: ~{((1 / paybackYears) * 100).toFixed(0)}% Annually</div>
              </div>
            </div>

            {/* Quick 3-metric bar */}
            <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-slate-700/70 text-center">
              <div>
                <div className="text-[10px] text-slate-400">Daily Generation</div>
                <div className="text-base font-bold text-white mt-0.5">{dailyGenUnits} kWh</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">Annual Generation</div>
                <div className="text-base font-bold text-white mt-0.5">{annualGenUnits} kWh</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">Annual Electricity Saved</div>
                <div className="text-base font-bold text-emerald-400 mt-0.5">₹{annualSavings.toLocaleString('en-IN')}</div>
              </div>
            </div>
          </div>

          {/* Financial Breakdown & PM Surya Ghar Subsidy Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 text-xs">
            <h3 className="font-bold text-slate-900 text-sm flex items-center justify-between">
              <span>Financial Model &amp; Direct Subsidy Deduction</span>
              {subsidy > 0 && (
                <span className="text-xs font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                  PM Surya Ghar Eligible
                </span>
              )}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Gross Plant Cost</span>
                <div className="text-base font-extrabold text-slate-900">₹{grossPlantCost.toLocaleString('en-IN')}</div>
                <span className="text-[10px] text-slate-500">Tier-1 EPC Turnkey</span>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <span className="text-[10px] text-emerald-700 uppercase font-bold block mb-1">Govt. DBT Subsidy</span>
                <div className="text-base font-extrabold text-emerald-800">- ₹{subsidy.toLocaleString('en-IN')}</div>
                <span className="text-[10px] text-emerald-600">Direct Bank Transfer</span>
              </div>

              <div className="p-3 bg-slate-900 text-white rounded-xl shadow-xs">
                <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Net Investment</span>
                <div className="text-base font-extrabold text-emerald-400">₹{netInvestmentCost.toLocaleString('en-IN')}</div>
                <span className="text-[10px] text-slate-400">Inclusive of GST &amp; DISCOM</span>
              </div>
            </div>

            {/* 25-Year Long-Term Financial Impact */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span>25-Year Lifetime Net Wealth Saved</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Calculated with 3% annual grid tariff escalation and 0.7% panel degradation.
                </p>
              </div>
              <div className="text-right">
                <div className="text-xl font-black text-emerald-700">₹{(cumulative25YearSavings / 100000).toFixed(1)} Lakhs</div>
                <div className="text-[10px] text-slate-400">Pure Free Energy Returns</div>
              </div>
            </div>

            {/* Environmental Impact Card */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl flex items-center gap-3">
                <Leaf className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                <div>
                  <div className="text-base font-extrabold text-slate-900">{annualCo2ReductionTons} Tons/Year</div>
                  <div className="text-[10px] text-slate-500">CO2 Emissions Prevented</div>
                </div>
              </div>

              <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl flex items-center gap-3">
                <Trees className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                <div>
                  <div className="text-base font-extrabold text-slate-900">{equivalentTreesPlanted} Trees</div>
                  <div className="text-[10px] text-slate-500">Equivalent Trees Planted / Year</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
