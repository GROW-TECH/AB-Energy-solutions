import React, { useState } from 'react';
import { Compass, Calculator, PackageSearch, CheckCircle2, ClipboardCheck, LayoutDashboard, Layers } from 'lucide-react';
import { useCrm } from '../../context/CrmContext';

// Existing Views & Role Dashboard
import { SurveyDashboard } from './SurveyDashboard';
import { SiteSurveysView } from '../../components/solar/SiteSurveysView';
import { SurveyBomView } from '../../components/solar/SurveyBomView';
import { SolarCalculatorView } from '../../components/solar/SolarCalculatorView';
import { SolarPackagesView } from '../../components/solar/SolarPackagesView';

interface SurveyPanelProps {
  initialSubTab?: 'dashboard' | 'surveys' | 'field-bom' | 'calculator' | 'packages';
  onTabChange?: (tab: string) => void;
  onNavigateToQuotation?: (leadId?: string) => void;
}

export const SurveyPanel: React.FC<SurveyPanelProps> = ({
  initialSubTab = 'dashboard',
  onTabChange,
  onNavigateToQuotation,
}) => {
  const { surveys } = useCrm();
  const [activeSubTab, setActiveSubTab] = useState<'dashboard' | 'surveys' | 'field-bom' | 'calculator' | 'packages'>(initialSubTab);
  const [isAuditing, setIsAuditing] = useState(false);

  React.useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  const handleSubTabClick = (tab: 'dashboard' | 'surveys' | 'field-bom' | 'calculator' | 'packages') => {
    setActiveSubTab(tab);
    setIsAuditing(false);
    if (onTabChange) {
      const navMap: Record<string, string> = {
        dashboard: 'dashboard',
        surveys: 'site-surveys',
        'field-bom': 'field-bom',
        calculator: 'solar-calculator',
        packages: 'solar-packages',
      };
      onTabChange(navMap[tab] || tab);
    }
  };

  const completedCount = surveys.filter(s => s.status === 'Completed').length;
  const pendingCount = surveys.filter(s => s.status !== 'Completed').length;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Survey Panel Header - shown on dashboard */}
      {!isAuditing && activeSubTab === 'dashboard' && (
        <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-3.5 sm:p-5 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="p-1.5 bg-emerald-600 text-white rounded-lg">
                  <Compass className="w-5 h-5" />
                </span>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Survey Engineer &amp; Solar Auditing Panel
                </h1>
                <span className="px-2.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold rounded-full">
                  Technical Feasibility &amp; Roof Audits
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Conduct on-site rooftop inspections, shadow obstacle evaluations, roof strength audits, and calculate PV kW requirements.
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200/80 rounded-xl text-xs font-semibold text-amber-800">
                <ClipboardCheck className="w-4 h-4 text-amber-600" />
                <span>{pendingCount} Pending Audits</span>
              </div>

              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200/80 rounded-xl text-xs font-semibold text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{completedCount} Audits Approved</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub navigation bar for Survey Engineer */}
      {!isAuditing && (
        <div className="bg-white border border-slate-200 rounded-2xl p-2 shadow-xs flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => handleSubTabClick('dashboard')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              activeSubTab === 'dashboard'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-emerald-400" />
            <span>Survey Dashboard</span>
          </button>

          <button
            onClick={() => handleSubTabClick('surveys')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              activeSubTab === 'surveys'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Compass className="w-4 h-4 text-emerald-400" />
            <span>Assigned Site Surveys</span>
          </button>

          <button
            onClick={() => handleSubTabClick('field-bom')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              activeSubTab === 'field-bom'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>Field BOMs &amp; Materials</span>
          </button>

          <button
            onClick={() => handleSubTabClick('calculator')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              activeSubTab === 'calculator'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Calculator className="w-4 h-4 text-emerald-400" />
            <span>Solar PV Calculator</span>
          </button>

          <button
            onClick={() => handleSubTabClick('packages')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              activeSubTab === 'packages'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <PackageSearch className="w-4 h-4 text-emerald-400" />
            <span>Solar Packages</span>
          </button>
        </div>
      )}

      {/* Sub-view Content */}
      <div>
        {activeSubTab === 'dashboard' && (
          <SurveyDashboard
            onNavigateToTab={(tab) => {
              if (tab === 'surveys' || tab === 'field-bom' || tab === 'calculator' || tab === 'packages') {
                handleSubTabClick(tab as any);
              } else if (onTabChange) {
                onTabChange(tab);
              }
            }}
            onNavigateToQuotation={onNavigateToQuotation}
          />
        )}

        {activeSubTab === 'surveys' && (
          <SiteSurveysView
            onNavigateToQuotation={(leadId) => {
              if (onNavigateToQuotation) onNavigateToQuotation(leadId);
            }}
            onNavigateToBom={(surveyId) => {
              handleSubTabClick('field-bom');
            }}
            onAuditModeChange={(auditing) => setIsAuditing(auditing)}
          />
        )}

        {activeSubTab === 'field-bom' && (
          <SurveyBomView />
        )}

        {activeSubTab === 'calculator' && (
          <SolarCalculatorView onNavigateToQuotation={() => {
            if (onNavigateToQuotation) onNavigateToQuotation();
          }} />
        )}

        {activeSubTab === 'packages' && <SolarPackagesView />}
      </div>
    </div>
  );
};
