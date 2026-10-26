import React, { useState } from 'react';
import { 
  Cpu, Plus, CheckCircle2, Clock, AlertTriangle, 
  ArrowRight, ToggleLeft, ToggleRight, Play, Filter, RefreshCw 
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { AutomationRule } from '../../types';

export const AutomationCenter: React.FC = () => {
  const { automationRules, toggleAutomationRule, addAutomationRule, automationLogs } = useCrm();

  const [activeTab, setActiveTab] = useState<'rules' | 'logs'>('rules');
  const [showNewRuleModal, setShowNewRuleModal] = useState(false);

  // Form states for creating custom automation rule
  const [triggerEvent, setTriggerEvent] = useState<any>('LEAD_QUALIFIED');
  const [whenText, setWhenText] = useState('Lead status transitions to Qualified');
  const [conditionText, setConditionText] = useState('Valid phone number and roof area >= 400 sq.ft');
  const [actionText, setActionText] = useState('Auto-schedule Site Survey, assign engineer, alert sales');
  const [ruleName, setRuleName] = useState('');

  const totalExecutions = automationRules.reduce((acc, r) => acc + (r.actionsExecutedCount || 0), 0);
  const activeCount = automationRules.filter(r => r.isActive).length;

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    addAutomationRule({
      name: ruleName || `Auto ${triggerEvent} Rule`,
      triggerEvent,
      whenText,
      conditionText,
      actionText,
      isActive: true,
      actionsExecutedCount: 0,
    });

    setShowNewRuleModal(false);
    setRuleName('');
    setWhenText('');
    setConditionText('');
    setActionText('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-emerald-600" />
            <span>Autonomous Solar Business Automation Engine</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configurable WHEN → CONDITION → ACTION triggers eliminating repetitive manual tasks across your solar pipeline.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex bg-slate-200/80 p-0.5 rounded-lg text-xs font-semibold text-slate-600">
            <button
              onClick={() => setActiveTab('rules')}
              className={`px-3 py-1.5 rounded-md transition-colors ${activeTab === 'rules' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'}`}
            >
              Active Rules ({automationRules.length})
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`px-3 py-1.5 rounded-md transition-colors ${activeTab === 'logs' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'}`}
            >
              Execution Stream ({automationLogs.length})
            </button>
          </div>

          <button
            onClick={() => setShowNewRuleModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create Automation Rule</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Active Rules</span>
          <div className="text-2xl font-black text-slate-900">{activeCount} / {automationRules.length}</div>
          <span className="text-[10px] text-emerald-700 font-semibold">100% Operational Health</span>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Actions Executed</span>
          <div className="text-2xl font-black text-emerald-700">{totalExecutions}</div>
          <span className="text-[10px] text-slate-500">Autonomous Triggers Run</span>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Estimated Hours Saved</span>
          <div className="text-2xl font-black text-slate-900">{Math.round(totalExecutions * 0.45)} hrs</div>
          <span className="text-[10px] text-emerald-700 font-semibold">Saved for Sales &amp; PM teams</span>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Execution Speed</span>
          <div className="text-2xl font-black text-slate-900">&lt; 150 ms</div>
          <span className="text-[10px] text-slate-500">Zero manual delay</span>
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'rules' ? (
        <div className="space-y-3.5">
          {automationRules.map(rule => (
            <div
              key={rule.id}
              className={`p-4 rounded-2xl border transition-all shadow-xs bg-white ${
                rule.isActive ? 'border-slate-200 hover:border-emerald-300' : 'border-slate-200/60 opacity-60'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                    rule.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                  }`}>
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                      <span>{rule.name}</span>
                      <span className="text-[10px] font-mono text-slate-400 font-normal">{rule.id}</span>
                    </h3>
                    <p className="text-slate-500 text-xs">Trigger: {rule.triggerEvent}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <span className="text-[11px] text-slate-400 font-medium">
                    Executed: <strong className="text-slate-800">{rule.actionsExecutedCount} times</strong>
                  </span>

                  <button
                    onClick={() => toggleAutomationRule(rule.id)}
                    className="p-1 text-slate-600 hover:text-emerald-700 transition-colors"
                    title={rule.isActive ? 'Deactivate rule' : 'Activate rule'}
                  >
                    {rule.isActive ? (
                      <ToggleRight className="w-8 h-8 text-emerald-600" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-slate-300" />
                    )}
                  </button>
                </div>
              </div>

              {/* Visual Flow Pipeline (WHEN -> CONDITION -> ACTION) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-3 text-xs">
                {/* WHEN */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    1. WHEN (Event Trigger)
                  </span>
                  <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <span>{rule.whenText}</span>
                  </div>
                </div>

                {/* CONDITION */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    2. IF CONDITION MET
                  </span>
                  <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span>{rule.conditionText}</span>
                  </div>
                </div>

                {/* ACTION */}
                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                    3. AUTOMATIC ACTION
                  </span>
                  <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{rule.actionText}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Real-time execution logs */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
              Automated Business OS Execution Stream
            </h2>
            <span className="text-xs text-slate-400">{automationLogs.length} events logged</span>
          </div>

          <div className="divide-y divide-slate-100">
            {automationLogs.map(log => (
              <div key={log.id} className="p-4 hover:bg-slate-50/80 transition-colors flex items-start justify-between gap-3 text-xs">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mt-0.5 flex-shrink-0">
                    <Cpu className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{log.ruleName}</span>
                      <span className="text-[10px] font-mono text-slate-400">{log.targetEntityId}</span>
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                        {log.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5">{log.actionSummary}</p>
                  </div>
                </div>

                <span className="text-[10px] text-slate-400 flex-shrink-0">
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New Automation Rule Modal */}
      {showNewRuleModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Create Business Automation Rule</h3>

            <form onSubmit={handleCreateRule} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Rule Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Instant Survey Dispatch on Lead Qualification"
                  value={ruleName}
                  onChange={e => setRuleName(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* 1. Trigger */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider block">
                  1. Trigger (WHEN Event Happens)
                </span>
                <select
                  value={triggerEvent}
                  onChange={e => setTriggerEvent(e.target.value as any)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="LEAD_CREATED">New Solar Lead Created</option>
                  <option value="LEAD_QUALIFIED">Lead Qualified</option>
                  <option value="SURVEY_COMPLETED">Site Survey Completed</option>
                  <option value="QUOTATION_SENT">Quotation Sent to Client</option>
                  <option value="QUOTATION_ACCEPTED">Quotation Accepted (Deal Won)</option>
                  <option value="PROJECT_CREATED">Project Initialized</option>
                  <option value="INSTALLATION_COMPLETED">12-Point Installation Signed Off</option>
                  <option value="COMMISSIONING_COMPLETED">DISCOM Net-Meter Commissioned</option>
                  <option value="INVOICE_OVERDUE">Invoice Payment Overdue</option>
                  <option value="AMC_RENEWAL_DUE">AMC Annual Renewal Due</option>
                </select>
                <input
                  type="text"
                  value={whenText}
                  onChange={e => setWhenText(e.target.value)}
                  placeholder="e.g. Lead status becomes Qualified"
                  className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs mt-1"
                />
              </div>

              {/* 2. Condition */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider block">
                  2. Condition (IF Valid)
                </span>
                <input
                  type="text"
                  value={conditionText}
                  onChange={e => setConditionText(e.target.value)}
                  placeholder="e.g. Lead has valid mobile number and monthly bill >= ₹2,000"
                  className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                />
              </div>

              {/* 3. Action */}
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1.5">
                <span className="font-bold text-emerald-900 text-[11px] uppercase tracking-wider block">
                  3. Action (THEN Execute Automatically)
                </span>
                <input
                  type="text"
                  value={actionText}
                  onChange={e => setActionText(e.target.value)}
                  placeholder="e.g. Create Site Survey task, assign engineer, set follow-up"
                  className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewRuleModal(false)}
                  className="px-3 py-1.5 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs"
                >
                  Save &amp; Activate Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
