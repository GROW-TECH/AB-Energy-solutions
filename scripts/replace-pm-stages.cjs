const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/components/projects/ProjectsView.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const startMarker = "Step {stages.indexOf(selectedStageMilestone) + 1} of 8: {selectedStageMilestone} Workspace";
const endMarker = "Handover certificate signed by {selectedProject.customerName}. AMC contract registered in service schedule.";

const startIndex = content.indexOf(startMarker);
if (startIndex === -1) {
  console.error("Start marker not found!");
  process.exit(1);
}

const endIndex = content.indexOf(endMarker);
if (endIndex === -1) {
  console.error("End marker not found!");
  process.exit(1);
}

// Find the enclosing </p> </div> </div> )} </div> after endMarker
const tailSnippet = content.indexOf(")}\\n              </div>\\n            )}", endIndex) !== -1 
  ? content.indexOf(")}\\n              </div>\\n            )}", endIndex) 
  : content.indexOf(")}\n              </div>\n            )}", endIndex);

let closingEndIndex = -1;
if (tailSnippet !== -1) {
  closingEndIndex = tailSnippet + ")}\\n              </div>".length;
  // If it was raw newline
  if (content[tailSnippet + 1] === '\n') {
    closingEndIndex = tailSnippet + ")}\n              </div>".length;
  }
} else {
  // Try CRLF
  const crlfTail = content.indexOf(")}\r\n              </div>\r\n            )}", endIndex);
  if (crlfTail !== -1) {
    closingEndIndex = crlfTail + ")}\r\n              </div>".length;
  } else {
    console.error("Closing tail not found!");
    process.exit(1);
  }
}

// We also want to replace from before startMarker: `Step {stages.indexOf(selectedStageMilestone) + 1} of 8:`
// Let's locate the opening of the header containing startMarker
const headerStart = content.lastIndexOf("<div>\n                      <div className=\"flex items-center gap-2\">", startIndex);
const headerStartCRLF = content.lastIndexOf("<div>\r\n                      <div className=\"flex items-center gap-2\">", startIndex);
const actualHeaderStart = headerStart !== -1 ? headerStart : headerStartCRLF;

if (actualHeaderStart === -1) {
  console.error("Header start not found!");
  process.exit(1);
}

const replacement = `<div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-900">
                          Step {stages.indexOf(selectedStageMilestone) + 1} of 4: {selectedStageMilestone} Workspace
                        </span>
                        <span className={\`px-2 py-0.5 rounded text-[10px] font-bold \${
                          stages.indexOf(selectedStageMilestone) < stages.indexOf(mapTo4Step(selectedProject.stage)) 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : selectedStageMilestone === mapTo4Step(selectedProject.stage) 
                            ? 'bg-emerald-600 text-white' 
                            : 'bg-slate-200 text-slate-700'
                        }\`}>
                          {stages.indexOf(selectedStageMilestone) < stages.indexOf(mapTo4Step(selectedProject.stage)) 
                            ? 'Completed ✓' 
                            : selectedStageMilestone === mapTo4Step(selectedProject.stage) 
                            ? 'Currently Active' 
                            : 'Upcoming'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Coordinated workflow between Project Manager and Installation Field Crew.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Previous Stage */}
                    <button
                      disabled={stages.indexOf(selectedStageMilestone) === 0}
                      onClick={() => {
                        const prevIdx = stages.indexOf(selectedStageMilestone) - 1;
                        if (prevIdx >= 0) setSelectedStageMilestone(stages[prevIdx]);
                      }}
                      className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1 cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Prev Stage</span>
                    </button>

                    {/* Next Stage */}
                    <button
                      disabled={stages.indexOf(selectedStageMilestone) === stages.length - 1}
                      onClick={() => {
                        const nextIdx = stages.indexOf(selectedStageMilestone) + 1;
                        if (nextIdx < stages.length) setSelectedStageMilestone(stages[nextIdx]);
                      }}
                      className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1 cursor-pointer"
                    >
                      <span>Next Stage</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    {/* Set Project Stage Action */}
                    {selectedProject.stage === 'Completed' ? (
                      <span className="px-3 py-1.5 bg-slate-100 text-slate-500 rounded-lg text-xs font-bold border border-slate-200 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Project Completed (Locked)</span>
                      </span>
                    ) : selectedStageMilestone !== mapTo4Step(selectedProject.stage) ? (
                      <button
                        onClick={() => {
                          updateProjectStage(selectedProject.id, selectedStageMilestone);
                          setSelectedProject({ ...selectedProject, stage: selectedStageMilestone });
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer shadow-xs"
                      >
                        Set Project to this Stage
                      </button>
                    ) : null}
                  </div>
                </div>

                {/* ------------------------------------------------------------- */}
                {/* 1. STAGE: MATERIAL ARRIVED ON SITE                            */}
                {/* ------------------------------------------------------------- */}
                {selectedStageMilestone === 'Material Arrived' && (
                  <div className="space-y-4">
                    {/* Material Arrival On-Site Status Card */}
                    <div className={\`p-5 rounded-2xl border transition-all \${
                      selectedProject.materialArrivedOnSite
                        ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                        : 'bg-amber-50/80 border-amber-300 text-amber-950'
                    }\`}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-3.5">
                          {selectedProject.materialArrivedOnSite ? (
                            <PackageCheck className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                          ) : (
                            <Truck className="w-6 h-6 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
                          )}
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-black text-sm sm:text-base">
                                {selectedProject.materialArrivedOnSite
                                  ? 'Materials Confirmed Arrived on Site'
                                  : 'Material Sourcing & Delivery to Site in Progress'}
                              </h3>
                              <span className={\`px-2.5 py-0.5 rounded text-[10px] font-bold \${
                                selectedProject.materialArrivedOnSite
                                  ? 'bg-emerald-200 text-emerald-900 border border-emerald-300'
                                  : 'bg-amber-200 text-amber-900 border border-amber-300'
                              }\`}>
                                {selectedProject.materialArrivedOnSite ? 'Materials On Site ✓' : 'Awaiting Arrival'}
                              </span>
                            </div>
                            <p className="text-xs mt-1 leading-relaxed">
                              {selectedProject.materialArrivedOnSite ? (
                                <span>
                                  Installation Team confirmed all purchased BOM items arrived intact at customer rooftop on{' '}
                                  <strong className="font-mono text-emerald-900">
                                    {selectedProject.materialArrivedConfirmedAt ? new Date(selectedProject.materialArrivedConfirmedAt).toLocaleString() : 'Recently'}
                                  </strong>{' '}
                                  (Verified by {selectedProject.materialArrivedConfirmedBy || 'Installation Lead'}).
                                </span>
                              ) : (
                                <span>
                                  Purchase team has dispatched components. When the delivery arrives at the customer site, the on-site installation crew inspects the BOM and confirms arrival. Project Manager is notified immediately upon receipt.
                                </span>
                              )}
                            </p>
                          </div>
                        </div>

                        {!selectedProject.materialArrivedOnSite && (
                          <button
                            onClick={async () => {
                              const now = new Date().toISOString();
                              const pmName = currentUser?.name || 'Project Manager';
                              await updateProject(selectedProject.id, {
                                materialArrivedOnSite: true,
                                materialArrivedConfirmedAt: now,
                                materialArrivedConfirmedBy: pmName,
                                stage: 'Installation Scheduled'
                              });
                              setSelectedProject({
                                ...selectedProject,
                                materialArrivedOnSite: true,
                                materialArrivedConfirmedAt: now,
                                materialArrivedConfirmedBy: pmName,
                                stage: 'Installation Scheduled'
                              });
                              setSelectedStageMilestone('Installation Scheduled');
                            }}
                            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                          >
                            <PackageCheck className="w-4 h-4" />
                            <span>Confirm Material Arrived on Site ✓</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Commercial & Contract Value Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Linked Quotation</span>
                        <div className="font-mono font-bold text-slate-900">{selectedProject.quotationId || 'QT-2026-00026-V1'}</div>
                        <div className="text-[11px] text-slate-500">{selectedProject.capacityKw} kW System</div>
                      </div>
                      <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Contract Value</span>
                        <div className="font-mono font-bold text-emerald-700">₹{Number(selectedProject.totalAmount || 0).toLocaleString('en-IN')}</div>
                        <div className="text-[11px] text-emerald-600 font-semibold">13.8% Composite GST Inclusive</div>
                      </div>
                      <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Payment Milestone</span>
                        <div className="font-bold text-slate-900">90% Advance Paid</div>
                        <div className="text-[11px] text-slate-500">Balance 10% on Commissioning</div>
                      </div>
                    </div>

                    {/* Dispatched Equipment Bill of Materials Table */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <div>
                          <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                            <Layers className="w-4 h-4 text-emerald-600" />
                            <span>Dispatched Equipment &amp; Bill of Materials (BOM)</span>
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            Verified items issued by procurement for delivery directly to site
                          </p>
                        </div>
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold">
                          {commandCentre?.bom?.length || 10} Items Dispatched
                        </span>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                              <th className="py-2.5 px-3 w-12 text-center">#</th>
                              <th className="py-2.5 px-3">Equipment / Component Description</th>
                              <th className="py-2.5 px-3">Specification</th>
                              <th className="py-2.5 px-3 text-right">Quantity</th>
                              <th className="py-2.5 px-3 text-center">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-medium">
                            {(commandCentre?.bom && commandCentre.bom.length > 0 ? commandCentre.bom : [
                              { id: '1', item_name: 'Solar PV Modules (Tier-1 TopCon DCR)', spec: '550 Wp Monocrystalline Half-Cut Cell', qty: Math.ceil(selectedProject.capacityKw * 1.8), uom: 'Nos' },
                              { id: '2', item_name: 'On-Grid String Inverter', spec: \`\${selectedProject.capacityKw} kW MPPT Three/Single Phase\`, qty: 1, uom: 'Nos' },
                              { id: '3', item_name: 'Pre-Engineered Aluminum Mounting Rails', spec: 'Anodized 6005-T5 Solar Rails & Hardware', qty: Math.ceil(selectedProject.capacityKw * 3.5), uom: 'Mtrs' },
                              { id: '4', item_name: 'Fasteners & End/Mid Clamps', spec: 'SS304 Heavy Duty Solar Clamps', qty: Math.ceil(selectedProject.capacityKw * 6), uom: 'Sets' },
                              { id: '5', item_name: 'DC Solar Cable (UV Protected)', spec: '4 sq.mm Cross-Linked Polyolefin Insulated', qty: 60, uom: 'Mtrs' },
                              { id: '6', item_name: 'AC Power Evacuation Cable', spec: '4-Core 6 sq.mm Armored Copper Cable', qty: 30, uom: 'Mtrs' },
                              { id: '7', item_name: 'Chemical Earthing Electrode Kit', spec: '17.2mm Copper Bonded 3M Rod + Compound', qty: 2, uom: 'Sets' },
                              { id: '8', item_name: 'Surge Protection & Lightning Arrestor', spec: 'Early Streamer Emission (ESE) Type', qty: 1, uom: 'Set' },
                              { id: '9', item_name: 'DCDB / ACDB Distribution Enclosures', spec: 'IP65 Enclosure with SPD & MCBs', qty: 2, uom: 'Boxes' },
                              { id: '10', item_name: 'HDPE Conduit Pipes & Cable Ties', spec: '25mm UV-Resistant Flexible Conduits', qty: 40, uom: 'Mtrs' }
                            ]).map((item: any, idx: number) => (
                              <tr key={item.id || idx} className="hover:bg-slate-50/60">
                                <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                                <td className="py-2.5 px-3 font-semibold text-slate-800">{item.item_name || item.name}</td>
                                <td className="py-2.5 px-3 text-slate-600">{item.spec || item.specification || '-'}</td>
                                <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">{item.qty || item.quantity} {item.uom || item.unit || 'Nos'}</td>
                                <td className="py-2.5 px-3 text-center">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    {selectedProject.materialArrivedOnSite ? 'On Site ✓' : 'Dispatched'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="pt-2 flex justify-end">
                        <button
                          onClick={() => setSelectedStageMilestone('Installation Scheduled')}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <span>Proceed to Step 2: Schedule &amp; Survey Clearness</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* ------------------------------------------------------------- */}
                {/* 2. STAGE: INSTALLATION SCHEDULED & SURVEY VERIFIED             */}
                {/* ------------------------------------------------------------- */}
                {selectedStageMilestone === 'Installation Scheduled' && (
                  <div className="space-y-4">
                    {/* Schedule & Duration Card */}
                    <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                        <div>
                          <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-emerald-600" />
                            <span>Installation Execution Schedule &amp; Duration</span>
                          </h3>
                          <p className="text-[11px] text-slate-500">
                            Determined by the Installation Team based on system capacity and site conditions
                          </p>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                          {selectedProject.siteSurveyVerified ? 'Schedule Locked ✓' : 'Kickoff Scheduled'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Kickoff Date</span>
                          <div className="font-mono font-bold text-slate-900 text-sm">
                            {selectedProject.startDate || '2026-11-05'}
                          </div>
                          <div className="text-[10px] text-slate-500">Installation Start</div>
                        </div>

                        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Duration Required</span>
                          <div className="font-mono font-bold text-emerald-700 text-sm">
                            {selectedProject.installationDurationDays || 2} Days
                          </div>
                          <div className="text-[10px] text-emerald-600 font-semibold">Decided by Field Crew</div>
                        </div>

                        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Target Handover</span>
                          <div className="font-mono font-bold text-slate-900 text-sm">
                            {selectedProject.targetCompletionDate || '2026-11-07'}
                          </div>
                          <div className="text-[10px] text-slate-500">Target Completion</div>
                        </div>

                        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Assigned Field Lead</span>
                          <div className="font-bold text-slate-900 truncate">
                            {selectedProject.installationLeadName || 'Muthu Vel'}
                          </div>
                          <div className="text-[10px] text-slate-500">Field Operations</div>
                        </div>
                      </div>
                    </div>

                    {/* Site Survey Clearness Verification Card */}
                    <div className={\`p-5 rounded-2xl border transition-all \${
                      selectedProject.siteSurveyVerified
                        ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                        : 'bg-amber-50/80 border-amber-300 text-amber-950'
                    }\`}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-3.5">
                          {selectedProject.siteSurveyVerified ? (
                            <CheckCheck className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                          ) : (
                            <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
                          )}
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-black text-sm sm:text-base">
                                Site Survey Measurements &amp; Clearness Verification
                              </h3>
                              <span className={\`px-2.5 py-0.5 rounded text-[10px] font-bold \${
                                selectedProject.siteSurveyVerified
                                  ? 'bg-emerald-200 text-emerald-900 border border-emerald-300'
                                  : 'bg-amber-200 text-amber-900 border border-amber-300'
                              }\`}>
                                {selectedProject.siteSurveyVerified ? 'Clearness Verified ✓' : 'Verification Required'}
                              </span>
                            </div>
                            <p className="text-xs mt-1 leading-relaxed">
                              {selectedProject.siteSurveyVerified ? (
                                <span>
                                  Installation team verified site survey measurements, shadow-free area, and structural anchors on{' '}
                                  <strong className="font-mono text-emerald-900">
                                    {selectedProject.siteSurveyVerifiedAt ? new Date(selectedProject.siteSurveyVerifiedAt).toLocaleString() : 'Recently'}
                                  </strong>{' '}
                                  (Verified by {selectedProject.siteSurveyVerifiedBy || 'Installation Lead'}).
                                </span>
                              ) : (
                                <span>
                                  The technical survey conducted by the survey engineer is shown below. The installation team reviews dimensions and clicks &quot;Verified Site Clearness &amp; Measurements&quot; to authorize commencement.
                                </span>
                              )}
                            </p>
                          </div>
                        </div>

                        {!selectedProject.siteSurveyVerified && (
                          <button
                            onClick={async () => {
                              const now = new Date().toISOString();
                              const pmName = currentUser?.name || 'Project Manager';
                              await updateProject(selectedProject.id, {
                                siteSurveyVerified: true,
                                siteSurveyVerifiedAt: now,
                                siteSurveyVerifiedBy: pmName,
                                stage: 'Installation In Progress'
                              });
                              setSelectedProject({
                                ...selectedProject,
                                siteSurveyVerified: true,
                                siteSurveyVerifiedAt: now,
                                siteSurveyVerifiedBy: pmName,
                                stage: 'Installation In Progress'
                              });
                              setSelectedStageMilestone('Installation In Progress');
                            }}
                            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                          >
                            <ShieldCheck className="w-4 h-4" />
                            <span>Confirm Site Clearness &amp; Authorize Crew ✓</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Direct Technical Survey Audit (Readout from Survey Engineer) */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <div>
                          <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                            <FolderKanban className="w-4 h-4 text-teal-600" />
                            <span>Technical Site Survey Audit (Engineer Survey Readout)</span>
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            Direct technical audit captured during the initial on-site engineering survey
                          </p>
                        </div>
                        <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                          Survey Ref: SRV-2026-009
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                          <div className="font-bold text-slate-800 text-[11px] flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Rooftop Structural &amp; Orientation Details</span>
                          </div>
                          <div className="space-y-1.5 text-slate-600">
                            <div className="flex justify-between">
                              <span className="text-slate-500">Roof Surface Type:</span>
                              <span className="font-bold text-slate-900">RCC Flat Roof (Waterproofed)</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Feasible Shadow-Free Area:</span>
                              <span className="font-mono font-bold text-slate-900">278 sq.ft Unobstructed</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">True South Orientation:</span>
                              <span className="font-bold text-emerald-700">Azimuth 180° / 12° Optimal Tilt</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Structure Anchoring:</span>
                              <span className="font-bold text-slate-800">Pre-Engineered Fasteners (Non-Penetrating)</span>
                            </div>
                          </div>
                        </div>

                        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                          <div className="font-bold text-slate-800 text-[11px] flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5 text-amber-600" />
                            <span>Electrical &amp; Grid Interconnect Clearances</span>
                          </div>
                          <div className="space-y-1.5 text-slate-600">
                            <div className="flex justify-between">
                              <span className="text-slate-500">Inverter Mounting Location:</span>
                              <span className="font-bold text-slate-900">Covered Utility Wall (Shaded)</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">DC Cable Route Length:</span>
                              <span className="font-mono font-bold text-slate-900">25 Meters (4 sq.mm UV)</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">AC Cable Route Length:</span>
                              <span className="font-mono font-bold text-slate-900">12 Meters (6 sq.mm Copper)</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">DISCOM Grid Sanction:</span>
                              <span className="font-mono font-bold text-emerald-700">{selectedProject.discomSanctionNumber || 'BESCOM-SANC-2026-9941'}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 flex justify-end">
                        <button
                          onClick={() => setSelectedStageMilestone('Installation In Progress')}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <span>Proceed to Step 3: Daily Crew Attendance &amp; Tasks</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* ------------------------------------------------------------- */}
                {/* 3. STAGE: DAILY ATTENDANCE & INSTALLATION EXECUTION            */}
                {/* ------------------------------------------------------------- */}
                {selectedStageMilestone === 'Installation In Progress' && (
                  <div className="space-y-4">
                    {/* Daily Field Crew Attendance Card */}
                    <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                        <div>
                          <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                            <Users className="w-4 h-4 text-emerald-600" />
                            <span>Daily Field Crew Attendance &amp; On-Site Verification</span>
                          </h3>
                          <p className="text-[11px] text-slate-500">
                            Rooftop labor crew check-in with live photographic evidence and GPS timestamp
                          </p>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                          Crew Checked-In ✓
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Attendance Details */}
                        <div className="md:col-span-2 space-y-3 text-xs">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                              <span className="text-[10px] font-bold text-slate-400 uppercase">Site Lead</span>
                              <div className="font-bold text-slate-900 block mt-0.5">{selectedProject.installationLeadName || 'Muthu Vel'}</div>
                              <div className="text-[10px] text-slate-500">Team Commander</div>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                              <span className="text-[10px] font-bold text-slate-400 uppercase">Check-In GPS &amp; Timestamp</span>
                              <div className="font-mono font-bold text-emerald-700 block mt-0.5">
                                {selectedProject.attendanceGpsCoords || '12.9716° N, 77.5946° E'}
                              </div>
                              <div className="text-[10px] text-slate-500">Today, 08:45 AM</div>
                            </div>
                          </div>

                          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Assigned Rooftop Crew Members</span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                              <div className="flex items-center gap-2 p-1.5 bg-white rounded-lg border border-slate-200">
                                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                <span className="font-semibold text-slate-800">Muthu Vel</span>
                                <span className="text-[10px] text-slate-400">(Site Lead)</span>
                              </div>
                              <div className="flex items-center gap-2 p-1.5 bg-white rounded-lg border border-slate-200">
                                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                <span className="font-semibold text-slate-800">Karthik Mani</span>
                                <span className="text-[10px] text-slate-400">(Inverter / Cabling)</span>
                              </div>
                              <div className="flex items-center gap-2 p-1.5 bg-white rounded-lg border border-slate-200">
                                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                <span className="font-semibold text-slate-800">Saravanan Perumal</span>
                                <span className="text-[10px] text-slate-400">(Earthing / BOS)</span>
                              </div>
                              <div className="flex items-center gap-2 p-1.5 bg-white rounded-lg border border-slate-200">
                                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                <span className="font-semibold text-slate-800">Rajesh Varma</span>
                                <span className="text-[10px] text-slate-400">(Structure Mounts)</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* On-Site Verification Selfie Photo */}
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col items-center justify-center text-center">
                          <span className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">Live Rooftop Check-In Photo</span>
                          <img
                            src={selectedProject.attendancePhotoUrl || "https://images.unsplash.com/photo-1509391365360-2e959784a276?w=600&auto=format&fit=crop&q=80"}
                            alt="Field Crew Check-In"
                            className="w-full h-32 object-cover rounded-lg border border-slate-200 shadow-2xs mb-2"
                          />
                          <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Photo Verified with Geotag</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Live Installation Tasks & Quality Checklist */}
                    <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                        <div>
                          <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                            <ListTodo className="w-4 h-4 text-emerald-600" />
                            <span>Installation Execution Tasks &amp; Quality Checklist</span>
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            Field tasks tracked in real-time between Project Manager and Installation Crew
                          </p>
                        </div>
                        <button
                          onClick={() => setShowPmAddTaskModal(true)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs self-start sm:self-auto"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Assign New Task</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        {[
                          { id: 't1', title: 'Pre-engineered aluminum mounting structure & anchor bolting', category: 'Structure', done: true },
                          { id: 't2', title: 'Tier-1 solar PV modules mounted, aligned, and clamped', category: 'Structure', done: true },
                          { id: 't3', title: 'DC string cabling, conduit routing, and MC4 connectors crimped', category: 'Electrical', done: true },
                          { id: 't4', title: 'Dual chemical earthing pits installed with copper electrodes', category: 'BOS', done: true },
                          { id: 't5', title: 'Inverter mounted on wall, ACDB/DCDB connected, and isolators wired', category: 'Inverter', done: true },
                          { id: 't6', title: 'Pre-commissioning test: Voc, Isc, and earth resistance check (< 5 ohms)', category: 'Safety', done: true },
                        ].map(task => (
                          <div key={task.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 flex items-start gap-3">
                            <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                              ✓
                            </span>
                            <div className="flex-1 min-w-0">
                              <span className="font-semibold text-slate-800 text-xs block leading-snug">{task.title}</span>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700">{task.category}</span>
                                <span className="text-[10px] text-emerald-600 font-semibold">Completed on Site</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="pt-2 flex justify-end">
                        <button
                          onClick={() => setSelectedStageMilestone('Completed')}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <span>Proceed to Step 4: Media, Warranty &amp; Handover</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* ------------------------------------------------------------- */}
                {/* 4. STAGE: MEDIA EVIDENCE, WARRANTY & SERVICE HANDOVER          */}
                {/* ------------------------------------------------------------- */}
                {selectedStageMilestone === 'Completed' && (
                  <div className="space-y-4">
                    {/* PM Field Review & Leave-Site Clearance Status */}
                    <div className="p-5 rounded-2xl border bg-emerald-50/80 border-emerald-300 text-emerald-950">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-3.5">
                          <CheckCheck className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-black text-sm sm:text-base">PM Field Clearance &amp; Photographic Evidence Review</h3>
                              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-200 text-emerald-900 border border-emerald-300">
                                Crew Cleared to Leave Site ✓
                              </span>
                            </div>
                            <p className="text-xs mt-1 leading-relaxed">
                              Site photos and live commissioning video reviewed and verified. Field installation crew is cleared for demobilization. Ready for final Grid Live sync and Service Team warranty transfer.
                            </p>
                          </div>
                        </div>

                        {selectedProject.stage !== 'Completed' && (
                          <button
                            onClick={() => setShowGridLiveModal(true)}
                            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5 shrink-0 cursor-pointer animate-pulse"
                          >
                            <Zap className="w-4 h-4" />
                            <span>Activate Grid Live &amp; Handover to Service</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* 4 Geotagged Installed Photos from 4 Angles (Client Meeting Requirement) */}
                    <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <div>
                          <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                            <Camera className="w-4 h-4 text-emerald-600" />
                            <span>Post-Installation Photographic Evidence (4 Angles)</span>
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            Geotagged high-resolution evidence captured before demobilizing crew
                          </p>
                        </div>
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold">
                          All 4 Angles Verified
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="space-y-1.5">
                          <div className="h-32 rounded-xl bg-slate-900 overflow-hidden relative group">
                            <img
                              src={selectedProject.postInstallPhotos?.panelFixing || "https://images.unsplash.com/photo-1509391365360-2e959784a276?w=600&auto=format&fit=crop&q=80"}
                              alt="Angle 1"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/40 flex items-end p-2">
                              <span className="text-[10px] font-bold text-white">Angle 1: PV Array &amp; Tilt</span>
                            </div>
                          </div>
                          <span className="text-[10px] text-slate-500 font-semibold block text-center">Solar Module Layout</span>
                        </div>

                        <div className="space-y-1.5">
                          <div className="h-32 rounded-xl bg-slate-900 overflow-hidden relative group">
                            <img
                              src={selectedProject.postInstallPhotos?.inverterCabling || "https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?w=600&auto=format&fit=crop&q=80"}
                              alt="Angle 2"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/40 flex items-end p-2">
                              <span className="text-[10px] font-bold text-white">Angle 2: Inverter &amp; Wiring</span>
                            </div>
                          </div>
                          <span className="text-[10px] text-slate-500 font-semibold block text-center">ACDB/DCDB Dressing</span>
                        </div>

                        <div className="space-y-1.5">
                          <div className="h-32 rounded-xl bg-slate-900 overflow-hidden relative group">
                            <img
                              src={selectedProject.postInstallPhotos?.earthingProtection || "https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?w=600&auto=format&fit=crop&q=80"}
                              alt="Angle 3"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/40 flex items-end p-2">
                              <span className="text-[10px] font-bold text-white">Angle 3: Earthing Pit</span>
                            </div>
                          </div>
                          <span className="text-[10px] text-slate-500 font-semibold block text-center">Dual Electrodes &amp; Arrestor</span>
                        </div>

                        <div className="space-y-1.5">
                          <div className="h-32 rounded-xl bg-slate-900 overflow-hidden relative group">
                            <img
                              src={selectedProject.postInstallPhotos?.plantWithCustomer || "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop&q=80"}
                              alt="Angle 4"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/40 flex items-end p-2">
                              <span className="text-[10px] font-bold text-white">Angle 4: Net-Meter &amp; Plant</span>
                            </div>
                          </div>
                          <span className="text-[10px] text-slate-500 font-semibold block text-center">With Customer On Site</span>
                        </div>
                      </div>
                    </div>

                    {/* 20-Second Live Commissioning Video Confirmation Player */}
                    <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <div>
                          <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                            <Video className="w-4 h-4 text-emerald-600" />
                            <span>20-Second Rooftop Client Confirmation Video</span>
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            Live on-site video confirming customer satisfaction and plant operation
                          </p>
                        </div>
                        <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                          Video Confirmed ✓
                        </span>
                      </div>

                      <div className="bg-slate-900 rounded-xl overflow-hidden aspect-video max-h-72 flex items-center justify-center relative">
                        <video
                          controls
                          src={selectedProject.commissioningVideoUrl || "/sample-rooftop-video.mp4"}
                          className="w-full h-full object-cover"
                          poster="https://images.unsplash.com/photo-1509391365360-2e959784a276?w=1000&auto=format&fit=crop&q=80"
                        >
                          Your browser does not support HTML5 video.
                        </video>
                      </div>
                    </div>

                    {/* Warranty & AMC Duration Selection & Service Team Transfer */}
                    <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <div>
                          <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-emerald-600" />
                            <span>Customer Warranty &amp; Service Team Handover</span>
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            Automatic registration into Service Team portal with recurring maintenance visits
                          </p>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                          {selectedProject.stage === 'Completed' ? 'Service Handover Active ✓' : 'Ready for Handover'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        {[
                          { years: 5, label: '5 Years (Standard Included)', desc: 'Included with EPC contract' },
                          { years: 7, label: '7 Years (Extended Care)', desc: 'Quarterly health audits' },
                          { years: 8, label: '8 Years (Premium Complete)', desc: 'Comprehensive coverage' },
                          { years: 10, label: '10 Years (Full Lifecycle AMC)', desc: 'Full replacement guarantee' }
                        ].map(opt => (
                          <div
                            key={opt.years}
                            onClick={() => setAmcYearsInput(opt.years)}
                            className={\`p-3 rounded-xl border text-left cursor-pointer transition-all \${
                              amcYearsInput === opt.years
                                ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500 shadow-xs'
                                : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                            }\`}
                          >
                            <span className="font-extrabold text-slate-900 block text-xs">{opt.years} Years</span>
                            <span className="text-[10px] text-slate-600 font-semibold block mt-0.5">{opt.label}</span>
                            <span className="text-[9px] text-slate-400 block mt-1">{opt.desc}</span>
                          </div>
                        ))}
                      </div>

                      {selectedProject.stage !== 'Completed' ? (
                        <div className="p-4 bg-emerald-50/80 border border-emerald-300 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
                          <div>
                            <span className="font-black text-sm text-emerald-950 flex items-center gap-1.5">
                              <Rocket className="w-4 h-4 text-emerald-600" />
                              <span>Complete Project &amp; Transfer to Service Team</span>
                            </span>
                            <p className="text-xs text-emerald-800 mt-0.5">
                              This sets the project status to Completed, generates the warranty dossier, and automatically schedules recurring AMC visits for {amcYearsInput} years in the Service Team portal.
                            </p>
                          </div>
                          <button
                            onClick={() => setShowGridLiveModal(true)}
                            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs shadow-md transition-all flex items-center gap-2 shrink-0 cursor-pointer animate-pulse"
                          >
                            <Zap className="w-4 h-4" />
                            <span>Confirm Grid Live &amp; Handover ({amcYearsInput} Years)</span>
                          </button>
                        </div>
                      ) : (
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                          <div className="space-y-0.5">
                            <div className="font-bold text-slate-800 text-xs">Project Successfully Closed &amp; Transferred</div>
                            <div className="text-[11px] text-slate-500">Registered in Service schedule expiring {new Date().getFullYear() + amcYearsInput}.</div>
                          </div>
                          <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold border border-emerald-300">
                            Closed ✓
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>`;

const newContent = content.slice(0, actualHeaderStart) + replacement + content.slice(closingEndIndex);
fs.writeFileSync(filePath, newContent, 'utf8');
console.log('Successfully replaced 8 milestones with 4 Coordinated Milestones!');
