import React, { useState } from 'react';
import { useCrm } from '../../context/CrmContext';
import { 
  Settings, Cpu, Save, RotateCcw, ShieldCheck, 
  Sun, Bell, Database, CheckCircle2
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { resetAllDemoData } = useCrm();

  const [compositeGstRate, setCompositeGstRate] = useState(13.8);
  const [autoCreateSurvey, setAutoCreateSurvey] = useState(true);
  const [autoReserveInventory, setAutoReserveInventory] = useState(true);
  const [autoActivateWarranty, setAutoActivateWarranty] = useState(true);
  const [nationalPortalSync, setNationalPortalSync] = useState(true);
  const [smsGatewayActive, setSmsGatewayActive] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
              <Settings className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Automation & Solar System Settings</h1>
              <p className="text-xs text-slate-500">Autonomous CRM rules, DISCOM sync endpoints, PM Surya Ghar parameters, and GST rates</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          {savedSuccess && (
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Settings Saved!
            </span>
          )}
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Save Changes</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Solar Statutory & Tax Configuration */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Sun className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-slate-900 text-sm">Solar Tax &amp; Statutory Tariffs</h3>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Composite Solar EPC GST Rate (%)
              </label>
              <div className="text-slate-500 text-[11px] mb-1.5">
                Standard 70% Goods @ 12% + 30% Services @ 18% = Effective 13.80%
              </div>
              <input
                type="number"
                step="0.1"
                value={compositeGstRate}
                onChange={(e) => setCompositeGstRate(Number(e.target.value))}
                className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                PM Surya Ghar Max Central Subsidy Cap (₹)
              </label>
              <input
                type="text"
                defaultValue="₹78,000 (for systems 3 kW and above)"
                disabled
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 font-medium"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                DISCOM Bi-Directional Net-Meter Test Threshold
              </label>
              <input
                type="text"
                defaultValue="CEIG Inspection mandatory above 10 kW connected load"
                disabled
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 font-medium"
              />
            </div>
          </div>
        </div>

        {/* Autonomous Triggers */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Cpu className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-slate-900 text-sm">Autonomous Event Automations</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div>
                <div className="font-semibold text-slate-900">Auto-Generate Site Survey Task</div>
                <div className="text-[11px] text-slate-500">Assigns nearest field engineer once lead is qualified</div>
              </div>
              <input
                type="checkbox"
                checked={autoCreateSurvey}
                onChange={(e) => setAutoCreateSurvey(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div>
                <div className="font-semibold text-slate-900">Auto-Reserve Warehouse BOM Inventory</div>
                <div className="text-[11px] text-slate-500">Locks panel & inverter stock upon quotation acceptance</div>
              </div>
              <input
                type="checkbox"
                checked={autoReserveInventory}
                onChange={(e) => setAutoReserveInventory(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div>
                <div className="font-semibold text-slate-900">Auto-Activate 25-Yr Warranty & AMC</div>
                <div className="text-[11px] text-slate-500">Creates warranty cards and 4-visit AMC after commissioning</div>
              </div>
              <input
                type="checkbox"
                checked={autoActivateWarranty}
                onChange={(e) => setAutoActivateWarranty(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div>
                <div className="font-semibold text-slate-900">PM Surya Ghar National Portal Webhook</div>
                <div className="text-[11px] text-slate-500">Pushes consumer number and sanction load to MNRE portal</div>
              </div>
              <input
                type="checkbox"
                checked={nationalPortalSync}
                onChange={(e) => setNationalPortalSync(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Reset / Demo Data Tools */}
        <div className="col-span-1 lg:col-span-2 bg-white p-5 rounded-xl border border-red-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-red-600 font-bold text-sm">
            <Database className="w-4 h-4" />
            <span>Developer & Demonstration Controls</span>
          </div>
          <p className="text-xs text-slate-600">
            Reset all Leads, Projects, Inventory, POs, Expenses, and Invoices back to initial factory demo state.
          </p>
          <button
            onClick={() => {
              if (window.confirm('Reset all solar CRM data to initial sample dataset?')) {
                resetAllDemoData();
                alert('All sample records and automation logs have been refreshed.');
              }
            }}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo Data</span>
          </button>
        </div>
      </div>
    </div>
  );
};
