import React from 'react';
import { 
  Compass, Calculator, CheckCircle2, Clock, 
  MapPin, Phone, ArrowRight, Sun, Calendar, 
  Layers, AlertTriangle, ShieldCheck
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';

interface SurveyDashboardProps {
  onNavigateToTab: (tab: string) => void;
  onNavigateToQuotation?: (leadId?: string) => void;
}

export const SurveyDashboard: React.FC<SurveyDashboardProps> = ({
  onNavigateToTab,
}) => {
  const { surveys, leads } = useCrm();

  const totalSurveys = surveys.length;
  const completedSurveys = surveys.filter(s => s.status === 'Completed' || s.status === 'Approved');
  const pendingSurveys = surveys.filter(s => s.status !== 'Completed' && s.status !== 'Approved');
  const totalCapacitySurveyed = surveys.reduce((sum, s) => sum + (s.recommendedKw || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Welcome & KPI Summary */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-teal-50 border border-teal-200 rounded-full text-xs font-bold text-teal-800 mb-2">
              <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse" />
              <span>Survey Engineer Operations</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Site Survey &amp; Technical Feasibility Dashboard
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Field inspection schedule, rooftop shadow obstruction assessments, roof area metrics, and PV plant sizing.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigateToTab('calculator')}
              className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Calculator className="w-4 h-4" />
              <span>Solar Calculator</span>
            </button>
            <button
              onClick={() => onNavigateToTab('surveys')}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Compass className="w-4 h-4 text-teal-400" />
              <span>All Site Visits</span>
            </button>
          </div>
        </div>

        {/* 4 KPI Metric Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Assigned Audits</span>
              <Compass className="w-4 h-4 text-teal-600" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900">{totalSurveys} Sites</div>
            <div className="text-[11px] text-slate-500 mt-1 font-medium">
              Across residential &amp; C&amp;I rooftops
            </div>
          </div>

          <div className="p-4 bg-amber-50/60 border border-amber-200/80 rounded-xl">
            <div className="flex items-center justify-between text-amber-800 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Pending Visits</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-extrabold text-amber-900">{pendingSurveys.length} Scheduled</div>
            <div className="text-[11px] text-amber-700 mt-1 font-medium">
              Awaiting site audit &amp; shadow study
            </div>
          </div>

          <div className="p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-xl">
            <div className="flex items-center justify-between text-emerald-800 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Feasibility Approved</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-extrabold text-emerald-900">{completedSurveys.length} Ready</div>
            <div className="text-[11px] text-emerald-700 mt-1 font-medium">
              Reports pushed to Sales for quoting
            </div>
          </div>

          <div className="p-4 bg-blue-50/60 border border-blue-200/80 rounded-xl">
            <div className="flex items-center justify-between text-blue-800 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Surveyed Capacity</span>
              <Sun className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-extrabold text-blue-900">{totalCapacitySurveyed} kW</div>
            <div className="text-[11px] text-blue-700 mt-1 font-medium">
              Verified shadow-free potential
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Split: Scheduled Audits + Field Toolkits */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Field Visits Roster */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-teal-100 text-teal-800 rounded-lg">
                  <Calendar className="w-4 h-4" />
                </span>
                <h3 className="font-bold text-slate-900 text-sm">Scheduled Rooftop Audits</h3>
              </div>
              <button
                onClick={() => onNavigateToTab('surveys')}
                className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1 cursor-pointer"
              >
                <span>Full List ({surveys.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100 mt-3">
              {surveys.slice(0, 5).map(survey => (
                <div key={survey.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 text-xs truncate">{survey.customerName}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                        survey.status === 'Completed'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}>
                        {survey.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                      <span className="flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {survey.address}
                      </span>
                      <span>•</span>
                      <span className="font-semibold text-slate-700">{survey.roofType || 'RCC Flat'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2 py-1 rounded-lg">
                      {survey.recommendedKw || 5} kW
                    </span>
                    <button
                      onClick={() => onNavigateToTab('surveys')}
                      className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      Audit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 bg-slate-50 -mx-5 -mb-5 p-3 rounded-b-2xl flex items-center justify-between text-xs text-slate-600">
            <span>Audit app supports offline camera &amp; measurement capture</span>
            <button
              onClick={() => onNavigateToTab('surveys')}
              className="text-teal-700 font-bold hover:underline cursor-pointer"
            >
              Start Rooftop Audit
            </button>
          </div>
        </div>

        {/* Survey Engineering Field Checklist */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="pb-4 border-b border-slate-100 flex items-center gap-2">
              <span className="p-1.5 bg-blue-100 text-blue-800 rounded-lg">
                <ShieldCheck className="w-4 h-4" />
              </span>
              <h3 className="font-bold text-slate-900 text-sm">Pre-Audit Field Checklist</h3>
            </div>

            <ul className="mt-4 space-y-3 text-xs text-slate-600">
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-600 mt-1.5 flex-shrink-0" />
                <span>Verify existing DISCOM sanctioned load &amp; meter phases (1-Phase / 3-Phase).</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-600 mt-1.5 flex-shrink-0" />
                <span>Inspect true South azimuth angle using compass &amp; calculate tilt angle (10°-15° in Tamil Nadu).</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-600 mt-1.5 flex-shrink-0" />
                <span>Photograph parapet walls, water tanks, trees &amp; shade trajectory between 9 AM to 4 PM.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-600 mt-1.5 flex-shrink-0" />
                <span>Measure DC cable run from roof array to inverter and AC cable run to main distribution board.</span>
              </li>
            </ul>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <button
              onClick={() => onNavigateToTab('calculator')}
              className="w-full py-2.5 bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-800 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Launch PV Sizing Calculator</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
