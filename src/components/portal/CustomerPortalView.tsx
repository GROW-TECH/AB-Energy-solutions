import React, { useState } from 'react';
import { 
  Sun, TrendingUp, ShieldCheck, Clock, FileText, 
  Leaf, LifeBuoy, AlertCircle, CheckCircle2, ChevronRight, 
  ExternalLink, Phone, ArrowDownRight, ArrowUpRight, Download
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { getApiUrl } from '../../utils/apiUrl';

interface CustomerPortalViewProps {
  onBackToAdmin?: () => void;
}

export const CustomerPortalView: React.FC<CustomerPortalViewProps> = ({ onBackToAdmin }) => {
  const { currentUser, customers, selectedCustomerIdForPortal, setSelectedCustomerIdForPortal, projects, invoices, warranties, amcs, quotations, tickets, createServiceTicket } = useCrm();

  const isRealCustomer = currentUser?.role === 'Customer';
  const customerId = isRealCustomer 
    ? (currentUser?.customerId || selectedCustomerIdForPortal || customers[0]?.id)
    : (selectedCustomerIdForPortal || customers[0]?.id);

  const currentCustomer = customers.find(c => c.id === customerId) || customers[0];

  const customerProjects = projects.filter(p => p.customerId === currentCustomer?.id);
  const customerInvoices = invoices.filter(i => i.customerId === currentCustomer?.id);
  const customerWarranties = warranties.filter(w => w.customerId === currentCustomer?.id);
  const customerAmcs = amcs.filter(a => a.customerId === currentCustomer?.id);
  const customerTickets = (tickets || []).filter(t => t.customerId === currentCustomer?.id);
  const customerQuotations = quotations.filter(q => 
    q.customerPhone === currentCustomer?.phone || 
    (currentCustomer?.convertedFromLeadId && q.leadId === currentCustomer.convertedFromLeadId)
  );

  // Service ticket quick request
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [issueCategory, setIssueCategory] = useState<any>('Inverter Error / Offline');
  const [issueDesc, setIssueDesc] = useState('');
  const [ticketSuccess, setTicketSuccess] = useState(false);

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCustomer) return;

    createServiceTicket({
      customerId: currentCustomer.id,
      customerName: currentCustomer.name,
      customerPhone: currentCustomer.phone,
      customerAddress: currentCustomer.address,
      issueCategory,
      severity: 'Medium',
      description: issueDesc,
    });

    setShowServiceModal(false);
    setIssueDesc('');
    setTicketSuccess(true);
    setTimeout(() => setTicketSuccess(false), 4000);
  };

  // Mock live solar generation data for demo
  const systemCapacity = currentCustomer?.totalSystemKw || 5;
  const liveKw = (systemCapacity * 0.78).toFixed(2);
  const todayKwh = (systemCapacity * 4.2).toFixed(1);
  const monthKwh = Math.round(systemCapacity * 125);
  const monthSavings = (monthKwh * 8).toLocaleString('en-IN');
  const co2AvoidedKg = Math.round(monthKwh * 0.82);
  const treesPlanted = Math.round(co2AvoidedKg / 20);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Customer Switcher Bar - ONLY visible to Super Admin in preview mode, NEVER to real customer */}
      {!isRealCustomer && (
        <div className="bg-slate-900 text-white p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs shadow-md border border-slate-800">
          <div className="flex items-center gap-3">
            {onBackToAdmin && (
              <button
                type="button"
                onClick={onBackToAdmin}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <span>← Back to Customers</span>
              </button>
            )}
            <div className="flex items-center gap-2">
              <span className="font-bold text-amber-400 uppercase tracking-wider text-[10px] bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded">
                ADMIN PREVIEW MODE
              </span>
              <span className="text-slate-300">Viewing Customer Self-Service Portal</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">Preview as Customer:</span>
            <select
              value={currentCustomer?.id}
              onChange={e => setSelectedCustomerIdForPortal(e.target.value)}
              className="p-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white font-semibold text-xs focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              {customers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.totalSystemKw} kW - {c.city})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {ticketSuccess && (
        <div className="p-4 bg-emerald-100 border border-emerald-300 text-emerald-950 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-700 flex-shrink-0" />
          <span>Service request submitted successfully! A certified solar engineer has been assigned to your plant.</span>
        </div>
      )}

      {/* Main Solar Plant Hero Banner */}
      <div className="bg-gradient-to-r from-[#0a192f] via-[#0f2744] to-[#0c1f38] text-white p-6 md:p-8 rounded-3xl border border-slate-800 shadow-lg relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                Plant Online &amp; Synchronized with Grid
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white mt-1">
              {currentCustomer?.name}&apos;s Solar Station
            </h1>
            <p className="text-xs text-slate-300 mt-1">
              {currentCustomer?.totalSystemKw} kW On-Grid Rooftop System • DISCOM: {currentCustomer?.consumerNumberDiscom || 'BESCOM KA-0891'}
            </p>
          </div>

          <button
            onClick={() => setShowServiceModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-md transition-all self-start md:self-auto"
          >
            <LifeBuoy className="w-4 h-4" />
            <span>Request Support / Cleaning</span>
          </button>
        </div>

        {/* Live Generation Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-700/60 relative z-10">
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-bold">Instant Power Output</div>
            <div className="text-2xl font-black text-emerald-400 mt-0.5">{liveKw} kW</div>
            <div className="text-[10px] text-slate-400 mt-0.5">82% Peak Capacity</div>
          </div>

          <div>
            <div className="text-[10px] text-slate-400 uppercase font-bold">Today&apos;s Generation</div>
            <div className="text-2xl font-black text-white mt-0.5">{todayKwh} kWh</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Units produced today</div>
          </div>

          <div>
            <div className="text-[10px] text-slate-400 uppercase font-bold">Monthly Bill Saved</div>
            <div className="text-2xl font-black text-emerald-400 mt-0.5">₹{monthSavings}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">{monthKwh} Units Offset</div>
          </div>

          <div>
            <div className="text-[10px] text-slate-400 uppercase font-bold">Clean Green Impact</div>
            <div className="text-2xl font-black text-white mt-0.5">{co2AvoidedKg} kg</div>
            <div className="text-[10px] text-slate-400 mt-0.5">≈ {treesPlanted} Trees Planted</div>
          </div>
        </div>
      </div>

      {/* 2-Column Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 Cols): Project Status & Active Equipment */}
        <div className="lg:col-span-7 space-y-6">
          {/* Active Projects Tracker */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center justify-between">
              <span>Rooftop Solar Project Status</span>
              <span className="text-xs font-mono text-slate-400">Turnkey EPC</span>
            </h3>

            {customerProjects.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                No active installation projects. System fully commissioned and delivering power.
              </div>
            ) : (
              customerProjects.map(proj => (
                <div key={proj.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">{proj.capacityKw} kW Rooftop Solar EPC</h4>
                      <span className="text-[10px] text-slate-500 font-mono">Project ID: {proj.id}</span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {proj.stage}
                    </span>
                  </div>

                  {/* Stage Progress Tracker */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between text-[11px] font-semibold text-slate-700">
                      <span>Execution Milestone</span>
                      <span>Target: {proj.targetCompletionDate}</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div className="bg-emerald-600 h-full rounded-full w-4/5" />
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500 flex justify-between pt-1">
                    <span>Project Manager: <strong className="text-slate-700">{proj.projectManagerName}</strong></span>
                    <span>Installation Lead: <strong className="text-slate-700">{proj.installationLeadName}</strong></span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Equipment Warranties */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Registered Equipment Warranties</span>
            </h3>

            <div className="space-y-2.5">
              {customerWarranties.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                  Equipment warranties will appear here upon commissioning.
                </div>
              ) : (
                customerWarranties.map(w => (
                  <div key={w.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-900">{w.equipmentType} - {w.makeModel}</div>
                      <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                        Serial: <strong className="text-slate-800">{w.serialNumber}</strong> • {w.warrantyPeriodYears} Years Full Coverage
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {w.status}
                      </span>
                      <div className="text-[10px] text-slate-400 mt-0.5">Until: {w.endDate}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column (5 Cols): Invoices, AMC, Support */}
        <div className="lg:col-span-5 space-y-6">
          {/* AMC Maintenance Status */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>Annual Maintenance Contract (AMC)</span>
            </h3>

            {customerAmcs.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                No active AMC contract.
              </div>
            ) : (
              customerAmcs.map(a => (
                <div key={a.id} className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{a.planName}</span>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                      {a.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600">
                    Visits completed: <strong>{a.completedVisits} of {a.visitsPerYear}</strong>
                  </div>
                  <div className="text-[11px] text-emerald-900 font-semibold pt-1 border-t border-emerald-200/60">
                    Next preventative visit scheduled: {a.nextScheduledVisit}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Approved Proposals & Technical Documents */}
          {customerQuotations.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center justify-between">
                <span>Solar Contract Proposals</span>
                <span className="text-xs text-slate-400">{customerQuotations.length} Proposals</span>
              </h3>
              <div className="space-y-2 text-xs">
                {customerQuotations.map(q => (
                  <div key={q.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3">
                    <div>
                      <div className="font-bold text-slate-900">{q.quotationNumber}</div>
                      <div className="text-[11px] text-slate-500 font-medium">
                        {q.systemCapacityKw} kW System • ₹{q.totalAmount.toLocaleString('en-IN')}
                      </div>
                      <div className="text-[10px] text-slate-400">Valid until: {q.validUntil}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">
                        {q.status}
                      </span>
                      <a
                        href={getApiUrl(`/api/quotations/${q.id}/pdf`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold rounded-lg text-xs shadow-xs transition-colors"
                        title="Download Official Proposal PDF"
                      >
                        <Download className="w-3.5 h-3.5 text-emerald-600" />
                        <span>PDF</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* My Service Requests & Maintenance */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <LifeBuoy className="w-4 h-4 text-emerald-600" />
                <span>My Service Requests</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowServiceModal(true)}
                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              >
                + Request Service
              </button>
            </div>

            {customerTickets.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                No active service requests. All solar plant components running smoothly.
              </div>
            ) : (
              <div className="space-y-2 text-xs">
                {customerTickets.map(tkt => (
                  <div key={tkt.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{tkt.ticketNumber}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        tkt.status === 'Resolved' || tkt.status === 'Closed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : tkt.status === 'In Progress'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {tkt.status}
                      </span>
                    </div>
                    <div className="font-semibold text-slate-800 text-[11px]">{tkt.issueCategory}</div>
                    <p className="text-[11px] text-slate-500 line-clamp-2">{tkt.description}</p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200/60">
                      <span>Created: {tkt.createdAt ? new Date(tkt.createdAt).toLocaleDateString() : 'Recent'}</span>
                      {tkt.technicianName && (
                        <span className="text-slate-700 font-semibold">Eng: {tkt.technicianName}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Invoices & Payment Ledger */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center justify-between">
              <span>Billing &amp; Receipts</span>
              <span className="text-xs text-slate-400">{customerInvoices.length} Invoices</span>
            </h3>

            <div className="space-y-2 text-xs">
              {customerInvoices.map(inv => (
                <div key={inv.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900">{inv.invoiceNumber}</div>
                    <div className="text-[10px] text-slate-400">Due: {inv.dueDate}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-slate-900">₹{inv.totalAmount.toLocaleString('en-IN')}</div>
                    <span className={`text-[10px] font-bold ${inv.status === 'Paid' ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {inv.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Contact Support Card */}
          <div className="p-4 bg-slate-900 text-white rounded-2xl text-xs space-y-2">
            <div className="font-bold text-sm text-emerald-400">Need Immediate Assistance?</div>
            <p className="text-slate-300 text-[11px]">
              Call our dedicated 24/7 Solar Operations Center for technical diagnostics or billing queries.
            </p>
            <div className="pt-2 flex items-center justify-between font-mono font-bold text-slate-200">
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                +91 80 4920 1888
              </span>
              <span className="text-emerald-400 text-xs">Toll-Free</span>
            </div>
          </div>
        </div>
      </div>

      {/* Service Request Modal */}
      {showServiceModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200">
            <h3 className="font-bold text-slate-900 text-sm mb-1">Submit Solar Support Ticket</h3>
            <p className="text-xs text-slate-500 mb-3">{currentCustomer?.name} • {currentCustomer?.totalSystemKw} kW System</p>

            <form onSubmit={handleCreateTicket} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Issue Category</label>
                <select
                  value={issueCategory}
                  onChange={e => setIssueCategory(e.target.value as any)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Inverter Error / Offline">Inverter Error / Red Light Fault</option>
                  <option value="Low Solar Generation Alert">Low Solar Generation</option>
                  <option value="Module Soiling / Cleaning Request">Rooftop Module Cleaning Request</option>
                  <option value="Net-Meter Error / DISCOM Sync">Net-Meter Reading Mismatch</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Describe the problem</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Inverter WiFi dropped connection, or need routine panel wash..."
                  value={issueDesc}
                  onChange={e => setIssueDesc(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowServiceModal(false)}
                  className="px-3 py-1.5 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs"
                >
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
