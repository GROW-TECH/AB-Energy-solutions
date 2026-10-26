import React, { useState } from 'react';
import { 
  X, Download, Eye, Layers, FileText, Send, Sparkles, 
  Printer, ArrowRight, CheckCircle2
} from 'lucide-react';
import { Quotation } from '../../types';
import { getApiUrl } from '../../utils/apiUrl';

export const getQuotationPdfUrl = (id: string, download = false) => {
  const token = localStorage.getItem('ab_solar_token') || '';
  const query = [
    token ? `token=${encodeURIComponent(token)}` : '',
    download ? 'download=true' : ''
  ].filter(Boolean).join('&');
  return getApiUrl(`/api/quotations/${id}/pdf${query ? `?${query}` : ''}`);
};

interface QuotationProposalModalProps {
  quotation: Quotation | null;
  isOpen: boolean;
  onClose: () => void;
  onHandoverToSales?: (q: Quotation) => void;
  onConvertProject?: (q: Quotation) => void;
  currentUserRole?: string;
}

export const QuotationProposalModal: React.FC<QuotationProposalModalProps> = ({
  quotation,
  isOpen,
  onClose,
  onHandoverToSales,
  onConvertProject,
  currentUserRole,
}) => {
  const [docTab, setDocTab] = useState<'proposal' | 'tax_audit'>('proposal');

  if (!isOpen || !quotation) return null;

  const activeVer = quotation.versions?.[quotation.versions.length - 1] || quotation.versions?.[0] || {};
  const items: any[] = activeVer.items || [];

  // Categorize for GST Audit Breakdown
  const solarInverterItems = items.filter(
    (it) => it.gstRate === 5 || it.category === 'Solar Modules' || it.category === 'Inverter'
  );
  const otherBosItems = items.filter(
    (it) => it.gstRate !== 5 && it.category !== 'Solar Modules' && it.category !== 'Inverter'
  );

  const solarInverterTaxable = solarInverterItems.reduce(
    (sum, it) => sum + (it.taxableAmount || (it.quantity || 1) * (it.unitPrice || 0)), 
    0
  );
  const solarInverterGst = solarInverterItems.reduce(
    (sum, it) => sum + (it.taxAmount || ((it.quantity || 1) * (it.unitPrice || 0) * 0.05)), 
    0
  );
  const bosTaxable = otherBosItems.reduce(
    (sum, it) => sum + (it.taxableAmount || (it.quantity || 1) * (it.unitPrice || 0)), 
    0
  );
  const bosGst = otherBosItems.reduce(
    (sum, it) => sum + (it.taxAmount || ((it.quantity || 1) * (it.unitPrice || 0) * 0.18)), 
    0
  );

  const dailyKwh = Math.round(quotation.systemCapacityKw * 5);
  const hasSubsidy = quotation.subsidyEligible && (quotation.subsidyAmount > 0);
  const netCustomerCost = quotation.indicativeNetCustomerCost || (quotation.totalAmount - (quotation.subsidyAmount || 0));

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Print Specific CSS to ensure authentic A4 printing matching the PDF */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm 10mm;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            background: #FFFFFF !important;
          }
          body * {
            visibility: hidden;
          }
          #printable-proposal-modal, #printable-proposal-modal * {
            visibility: visible;
          }
          #printable-proposal-modal {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0 !important;
            padding: 0 !important;
            background: #FFFFFF !important;
          }
          .print-page-break {
            page-break-after: always !important;
            break-after: page !important;
            box-shadow: none !important;
            border: 1px solid #CBD5E1 !important;
            border-radius: 0 !important;
            margin-bottom: 0 !important;
            min-height: 275mm;
            padding: 24px !important;
            background: #FFFFFF !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}} />

      <div className="bg-slate-100 rounded-2xl border border-slate-300 shadow-2xl max-w-5xl w-full my-auto flex flex-col max-h-[95vh] overflow-hidden animate-in zoom-in-95">
        
        {/* MODAL TOP HEADER (Hidden when printing) */}
        <div className="bg-white px-6 py-3.5 border-b border-slate-200 flex items-center justify-between shrink-0 shadow-2xs no-print">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-slate-900 text-white rounded-xl font-bold">
              <FileText className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-black font-mono">
                  {quotation.quotationNumber}
                </h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-slate-100 text-slate-800 border border-slate-300">
                  {quotation.status}
                </span>
                <span className="text-xs font-bold text-black">
                  {quotation.systemCapacityKw} kW On-Grid
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Client: <strong className="text-black font-bold">{quotation.leadName}</strong> ({quotation.customerPhone}) &bull; {quotation.customerAddress || 'Tamil Nadu, India'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
              title="Print Clean A4 Proposal"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Proposal</span>
            </button>

            <a
              href={getQuotationPdfUrl(quotation.id, false)}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
              title="Open Official PDF in New Tab"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Open PDF</span>
            </a>

            <a
              href={getQuotationPdfUrl(quotation.id, true)}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
              title="Download PDF to Device"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Download</span>
            </a>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-black hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* VIEW SELECTOR TOGGLE (OFFICIAL PROPOSAL vs STATUTORY GST BREAKDOWN) */}
        <div className="bg-white px-6 py-2.5 border-b border-slate-200 flex items-center justify-between shrink-0 no-print">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setDocTab('proposal')}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                docTab === 'proposal'
                  ? 'bg-white text-black shadow-xs'
                  : 'text-slate-600 hover:text-black'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-black" />
              <span>Official Quotation Proposal (Client View)</span>
            </button>
            <button
              onClick={() => setDocTab('tax_audit')}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                docTab === 'tax_audit'
                  ? 'bg-white text-black shadow-xs'
                  : 'text-slate-600 hover:text-black'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-emerald-600" />
              <span>Statutory GST Audit (5% &amp; 18%)</span>
            </button>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Contract Value</span>
            <span className="text-base font-black text-black font-mono">
              ₹{quotation.totalAmount.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* MODAL BODY (SCROLLABLE) */}
        <div className="overflow-y-auto flex-1 p-6 space-y-6">

          {/* ======================================================== */}
          {/* TAB 1: OFFICIAL AUTHENTIC 6-PAGE AB ENERGY PROPOSAL     */}
          {/* ======================================================== */}
          {docTab === 'proposal' && (
            <div id="printable-proposal-modal" className="space-y-6 max-w-4xl mx-auto">
              
              {/* PAGE 1: COVER PAGE */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-8 space-y-5 print-page-break">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <img
                    src={getApiUrl('/logo.png')}
                    alt="AB Energy Solutions"
                    className="h-12 w-auto object-contain"
                  />
                  <div className="text-right">
                    <span className="font-mono font-black text-black text-xs block">
                      GST: 33FSQPA3244H1ZU
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold">Turnkey Solar EPC &bull; Electrical Infrastructure &bull; O&amp;M</span>
                  </div>
                </div>

                <div className="text-center pt-1">
                  <h1 className="text-xl sm:text-2xl font-black text-black tracking-tight">
                    Quotation for {quotation.systemCapacityKw} kW Grid-Connected Rooftop Solar Power System
                  </h1>
                  <p className="text-xs text-emerald-700 font-semibold mt-1">
                    Turnkey Engineering, Procurement, Installation &amp; Commissioning Proposal
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs font-bold text-slate-700 pb-1">
                  <span>Quotation No.: <span className="font-mono text-black font-black">{quotation.quotationNumber}</span></span>
                  <span className="text-slate-500 font-normal">Package Tier: <strong>{activeVer.packageTier || 'Premium Tier-1'}</strong></span>
                  <span>Date: <span className="text-black font-black">{new Date(quotation.createdAt).toLocaleDateString('en-GB')}</span></span>
                </div>

                <div className="rounded-xl overflow-hidden border border-slate-200 shadow-xs">
                  <img
                    src={getApiUrl('/solar-roof-cover.jpg')}
                    alt="Solar Rooftop Plant"
                    className="w-full h-64 sm:h-72 object-cover"
                  />
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <h3 className="font-black text-black text-xs uppercase tracking-wider mb-2">Customer Details</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-800">
                    <div><span className="font-bold text-black">Client Name:</span> {quotation.leadName}</div>
                    <div><span className="font-bold text-black">Contact Phone:</span> {quotation.customerPhone || 'N/A'}</div>
                    <div><span className="font-bold text-black">Service Number:</span> 045310081264 / {quotation.systemCapacityKw}KWp</div>
                    <div><span className="font-bold text-black">Site Address:</span> {quotation.customerAddress || 'West Rajapalayam, P.N palayam, TN'}</div>
                    <div><span className="font-bold text-black">Quoted Capacity:</span> {quotation.systemCapacityKw} kW On-Grid</div>
                    <div><span className="font-bold text-black">Proposal Type:</span> Grid-Tied Rooftop EPC</div>
                  </div>
                </div>

                {/* Key Metrics Strip */}
                <div className="grid grid-cols-3 gap-3 pt-1">
                  <div className="p-3 bg-white border border-slate-200 rounded-xl text-center">
                    <span className="text-[10px] text-slate-500 uppercase block font-semibold">Plant Capacity</span>
                    <span className="text-sm font-black text-emerald-700 font-mono">{quotation.systemCapacityKw} kW On-Grid</span>
                  </div>
                  <div className="p-3 bg-white border border-slate-200 rounded-xl text-center">
                    <span className="text-[10px] text-slate-500 uppercase block font-semibold">Estimated Annual Yield</span>
                    <span className="text-sm font-black text-emerald-700 font-mono">~{Math.round(quotation.systemCapacityKw * 1500).toLocaleString('en-IN')} Units</span>
                  </div>
                  <div className="p-3 bg-white border border-slate-200 rounded-xl text-center">
                    <span className="text-[10px] text-slate-500 uppercase block font-semibold">Module Performance</span>
                    <span className="text-sm font-black text-emerald-700">25-30 Years Tier-1</span>
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 text-right pt-2 border-t border-slate-100">
                  Page 1 of 6 &bull; AB Energy Solutions Techno-Commercial Proposal
                </div>
              </div>

              {/* PAGE 2: CORPORATE PROFILE & LETTER */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-8 space-y-6 text-xs text-slate-700 leading-relaxed print-page-break">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <img src={getApiUrl('/logo.png')} alt="AB" className="h-7 w-auto" />
                    <div>
                      <span className="font-black text-black text-xs block">AB ENERGY SOLUTIONS</span>
                      <span className="text-[9px] text-slate-500">Corporate Profile &amp; Letter</span>
                    </div>
                  </div>
                  <div className="text-right font-mono text-[10px] text-slate-500">
                    Quote: <strong className="text-emerald-700">{quotation.quotationNumber}</strong> &bull; GST: 33FSQPA3244H1ZU
                  </div>
                </div>

                <div>
                  <h2 className="font-black text-black text-sm mb-3">
                    Subject: Proposal for Supply, Installation, Testing &amp; Commissioning of {quotation.systemCapacityKw} kW Grid-Connected Rooftop Solar Power System
                  </h2>
                  <p className="mb-2 font-medium">Dear Sir,</p>
                  <p className="mb-2">
                    Thank you for giving us the opportunity to submit our quotation for your {quotation.systemCapacityKw} kW Solar Rooftop Project. We are pleased to offer our professional turnkey services as detailed below.
                  </p>
                  <p>
                    The quotation includes the complete supply, installation, testing, and commissioning of a Grid-Connected Solar Rooftop System.
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <h3 className="text-sm font-black text-black mb-3 tracking-tight uppercase">
                    ABOUT AB ENERGY SOLUTION
                  </h3>
                  <div className="space-y-3 text-slate-700 leading-relaxed">
                    <p>
                      AB Energy Solution is a trusted Solar EPC &amp; Electrical Engineering Company specializing in Project Management Consultancy (PMC), Owner's Engineer Services, Solar EPC, Installation, Testing &amp; Commissioning (I&amp;C), HT/LT Electrical Works, and Solar Material Supply.
                    </p>
                    <p>
                      With <strong>12+ years of industry experience</strong>, we have successfully completed <strong>50+ Solar &amp; Electrical Projects</strong> across Residential, Commercial, Industrial, and Agricultural sectors. Our team includes <strong>TNEB C Licence Certified Engineers</strong> and experienced professionals dedicated to delivering projects with the highest standards of <strong>Quality, Safety, and On-Time Delivery</strong>.
                    </p>
                    <p>
                      We provide complete end-to-end solar solutions, from Site Survey, Design, Engineering, Procurement, Installation, Testing &amp; Commissioning to Net Metering, CEIG Documentation, and Annual Maintenance (O&amp;M).
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="font-black text-black text-xs uppercase tracking-wider">
                    Quality &amp; Compliance Assurance
                  </div>
                  <p className="text-slate-600 text-[11px]">
                    All engineering designs, structural fabrications, module installations, and electrical grid synchronizations are performed strictly complying with MNRE standards, CEA technical regulations, DISCOM grid codes, and TANGEDCO net-metering protocols.
                  </p>
                </div>

                <div className="text-[10px] text-slate-400 text-right pt-2 border-t border-slate-100">
                  Page 2 of 6 &bull; AB Energy Solutions Techno-Commercial Proposal
                </div>
              </div>

              {/* PAGE 3: SERVICES, ADVANTAGES & VISION */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-8 space-y-6 text-xs text-slate-700 leading-relaxed print-page-break">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <img src={getApiUrl('/logo.png')} alt="AB" className="h-7 w-auto" />
                    <div>
                      <span className="font-black text-black text-xs block">AB ENERGY SOLUTIONS</span>
                      <span className="text-[9px] text-slate-500">Services &amp; Why Choose Us</span>
                    </div>
                  </div>
                  <div className="text-right font-mono text-[10px] text-slate-500">
                    Quote: <strong className="text-emerald-700">{quotation.quotationNumber}</strong> &bull; GST: 33FSQPA3244H1ZU
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-black text-black mb-3 tracking-tight uppercase">
                    OUR SERVICES
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-800 font-medium">
                    <div>&bull; Solar Rooftop EPC Projects</div>
                    <div>&bull; HT &amp; LT Electrical Works</div>
                    <div>&bull; Ground Mounted Solar Power Plants</div>
                    <div>&bull; Transmission Line &amp; Pole Yard Works</div>
                    <div>&bull; Project Management Consultancy (PMC)</div>
                    <div>&bull; Net Metering &amp; CEIG Approval Support</div>
                    <div>&bull; Owner's Engineer Services</div>
                    <div>&bull; Comprehensive Operation &amp; Maintenance (O&amp;M)</div>
                    <div>&bull; Installation, Testing &amp; Commissioning (I&amp;C)</div>
                    <div>&bull; Solar Material Supply</div>
                    <div>&bull; Solar Water Pump Systems</div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <h3 className="text-sm font-black text-black mb-3 tracking-tight uppercase">
                    WHY CHOOSE AB ENERGY SOLUTION?
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 font-medium">
                    {[
                      '12+ Years of Industry Experience',
                      'Professional Project Management',
                      '50+ Successfully Completed Projects',
                      'On-Time Project Delivery',
                      'TNEB C Licence Certified Engineers',
                      'Transparent Communication',
                      'Quality Workmanship & Safety Standards',
                      'Reliable After-Sales Support'
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-emerald-600 font-black text-sm">✔</span>
                        <span className="font-semibold text-slate-900">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div>
                    <span className="font-black text-black text-xs uppercase block">Our Commitment</span>
                    <span className="text-slate-700 text-xs font-semibold">Quality &bull; Safety &bull; Innovation &bull; Integrity &bull; Customer Satisfaction</span>
                  </div>
                  <div>
                    <span className="font-black text-black text-xs uppercase block">Our Vision</span>
                    <span className="text-slate-600 text-[11px] italic">
                      "To deliver sustainable, reliable, and high-quality solar energy solutions that create long-term value for our customers and contribute to a greener future."
                    </span>
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 text-right pt-2 border-t border-slate-100">
                  Page 3 of 6 &bull; AB Energy Solutions Techno-Commercial Proposal
                </div>
              </div>

              {/* PAGE 4: SCOPE OF WORK & DYNAMIC BILL OF MATERIALS */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-8 space-y-5 text-xs text-slate-700 leading-relaxed print-page-break">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <img src={getApiUrl('/logo.png')} alt="AB" className="h-7 w-auto" />
                    <div>
                      <span className="font-black text-black text-xs block">AB ENERGY SOLUTIONS</span>
                      <span className="text-[9px] text-slate-500">Technical Scope &amp; BOM</span>
                    </div>
                  </div>
                  <div className="text-right font-mono text-[10px] text-slate-500">
                    Quote: <strong className="text-emerald-700">{quotation.quotationNumber}</strong> &bull; GST: 33FSQPA3244H1ZU
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-black text-black mb-2 tracking-tight uppercase">
                    Scope of Work
                  </h3>
                  <p className="text-slate-600 mb-2">We will execute the complete following turnkey EPC activities:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-1 text-slate-900 font-medium">
                    <div>&bull; Site Survey</div>
                    <div>&bull; Complete Installation</div>
                    <div>&bull; Engineering Support</div>
                    <div>&bull; Testing &amp; Commissioning</div>
                    <div>&bull; Supply of Material</div>
                    <div>&bull; Service Support</div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-black text-black tracking-tight uppercase">
                      Bill Of Materials
                    </h3>
                    <span className="text-[10px] text-black font-black bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-300">
                      Populated dynamically from Database BOM ({items.length} Line Items)
                    </span>
                  </div>

                  <div className="overflow-x-auto border border-slate-300 rounded-xl shadow-2xs">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-900 text-white font-black text-[10px] uppercase border-b border-slate-300">
                        <tr>
                          <th className="py-2 px-3 text-center w-12">S.NO</th>
                          <th className="py-2 px-3 w-40">MATERIALS</th>
                          <th className="py-2 px-3">SPECIFICATION</th>
                          <th className="py-2 px-3 w-36">MAKE</th>
                          <th className="py-2 px-3 text-center w-16">UNITS</th>
                          <th className="py-2 px-3 text-center w-16">QUANTITY</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 font-medium">
                        {items.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-4 text-center text-slate-400">
                              No BOM items found.
                            </td>
                          </tr>
                        ) : (
                          items.map((item, idx) => (
                            <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                              <td className="py-2 px-3 text-center font-mono text-slate-500 font-bold">{idx + 1}</td>
                              <td className="py-2 px-3 font-bold text-slate-900">{item.category || item.description}</td>
                              <td className="py-2 px-3 text-slate-700 font-mono text-[11px]">
                                {item.specification || item.description || item.makeModel}
                              </td>
                              <td className="py-2 px-3 text-slate-800 font-semibold">{item.make || item.makeModel?.split(' ')[0] || 'Reputed'}</td>
                              <td className="py-2 px-3 text-center text-slate-600">{item.unit || 'Nos'}</td>
                              <td className="py-2 px-3 text-center font-mono font-black text-black">{item.quantity}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-3 p-2.5 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-[11px] font-bold">
                    Note: As this project is proposed under the Government Subsidy Scheme, all supplied solar modules must comply with the Domestic Content Requirement (DCR) guidelines.
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 text-right pt-2 border-t border-slate-100">
                  Page 4 of 6 &bull; AB Energy Solutions Techno-Commercial Proposal
                </div>
              </div>

              {/* PAGE 5: CLIENT SCOPE, FEATURES & WARRANTY, SYSTEM CAPACITY & PRICING */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-8 space-y-5 text-xs text-slate-700 leading-relaxed print-page-break">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <img src={getApiUrl('/logo.png')} alt="AB" className="h-7 w-auto" />
                    <div>
                      <span className="font-black text-black text-xs block">AB ENERGY SOLUTIONS</span>
                      <span className="text-[9px] text-slate-500">Client Scope &amp; Commercial Pricing</span>
                    </div>
                  </div>
                  <div className="text-right font-mono text-[10px] text-slate-500">
                    Quote: <strong className="text-emerald-700">{quotation.quotationNumber}</strong> &bull; GST: 33FSQPA3244H1ZU
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-black text-black mb-2 tracking-tight uppercase">
                    Client Scope
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-slate-800">
                    <div>➢ Provide a shadow-free installation area.</div>
                    <div>➢ Minor civil works, if required.</div>
                    <div>➢ Statutory charges for the Bi-Directional Net Meter.</div>
                    <div>➢ Non-statutory charges related to Net Metering.</div>
                    <div>➢ Additional charges for elevated structures (if applicable).</div>
                    <div>➢ SIM card for the Wi-Fi monitoring dongle / APFC.</div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <h3 className="text-sm font-black text-black mb-2 tracking-tight uppercase">
                    Features and Warranty
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-slate-800">
                    <div>- Tier-1 High-Efficiency Solar Modules</div>
                    <div>- Workmanship Warranty: 1 Year</div>
                    <div>- Inverter Warranty: Up to 8 Years</div>
                    <div>- Estimated Energy Generation: ~{dailyKwh} kWh/day</div>
                    <div>- Solar Module Product Warranty: 12 Years</div>
                    <div>- Non DCR / DCR Solar Panels as applicable</div>
                    <div>- Solar Module Performance Warranty: Up to 30 Years</div>
                    <div>- Compliant with MNRE and DISCOM Standards</div>
                  </div>
                </div>

                {/* System Capacity & Pricing Box */}
                <div className="pt-3 border-t border-slate-100">
                  <h3 className="text-sm font-black text-black mb-2 tracking-tight uppercase">
                    System Capacity &amp; Pricing
                  </h3>
                  <div className="overflow-x-auto border border-slate-300 rounded-xl">
                    <table className="w-full text-center text-xs">
                      <thead className="bg-slate-900 text-white font-black border-b border-slate-300">
                        <tr>
                          <th className="py-2.5 px-4 w-1/3">System Capacity</th>
                          <th className="py-2.5 px-4 w-1/3">Domestic Price<br /><span className="text-[10px] font-normal text-slate-300">(Including GST)</span></th>
                          <th className="py-2.5 px-4 w-1/3">{hasSubsidy ? 'Govt Subsidy / Net Cost' : 'Estimated ROI'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="divide-x divide-slate-200">
                          <td className="py-3 px-4 font-bold text-black">
                            {quotation.systemCapacityKw}KW On-grid Solar System
                          </td>
                          <td className="py-3 px-4 font-mono font-black text-black text-base">
                            ₹{quotation.totalAmount.toLocaleString('en-IN')}/-
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-800">
                            {hasSubsidy ? (
                              <div>
                                <span className="text-emerald-700 font-black block">Subsidy: ₹{Math.round(quotation.subsidyAmount).toLocaleString('en-IN')}</span>
                                <span className="text-slate-900 text-xs block">Net Cost: ₹{Math.round(netCustomerCost).toLocaleString('en-IN')}/-</span>
                              </div>
                            ) : (
                              <span>3.5 - 4.0 Years</span>
                            )}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Payment Terms */}
                <div className="pt-3 border-t border-slate-100">
                  <h3 className="text-sm font-black text-black mb-1.5 tracking-tight uppercase">
                    Payment Terms
                  </h3>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 font-bold text-black text-xs">
                    <div>&bull; 90% Advance Payment with Purchase Order / Agreement</div>
                    <div>&bull; 10% After Successful Commissioning &amp; Grid Synchronization</div>
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 text-right pt-2 border-t border-slate-100">
                  Page 5 of 6 &bull; AB Energy Solutions Techno-Commercial Proposal
                </div>
              </div>

              {/* PAGE 6: TERMS & CONDITIONS, CONTACT CARD & SIGNATORY */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-8 space-y-5 text-xs text-slate-700 leading-relaxed print-page-break">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <img src={getApiUrl('/logo.png')} alt="AB" className="h-7 w-auto" />
                    <div>
                      <span className="font-black text-black text-xs block">AB ENERGY SOLUTIONS</span>
                      <span className="text-[9px] text-slate-500">Commercial Terms &amp; Authorization</span>
                    </div>
                  </div>
                  <div className="text-right font-mono text-[10px] text-slate-500">
                    Quote: <strong className="text-emerald-700">{quotation.quotationNumber}</strong> &bull; GST: 33FSQPA3244H1ZU
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-black text-black mb-2 tracking-tight uppercase">
                    Terms &amp; Conditions
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-slate-700 text-[11px]">
                    <div>&bull; Quotation Validity: 7 Days from issue date.</div>
                    <div>&bull; GST is included in the above price.</div>
                    <div>&bull; Additional civil work will be charged extra 800/kW.</div>
                    <div>&bull; Net Meter approval is subject to TANGEDCO / DISCOM regulations.</div>
                    <div>&bull; Delivery is subject to material readiness and site access.</div>
                    <div>&bull; Any additional work outside the quoted scope will be charged extra.</div>
                    <div>&bull; Elevated above 4 Feet mounting structures extra 2500/kW.</div>
                    <div>&bull; Force majeure conditions and grid outages are excluded.</div>
                  </div>
                </div>

                {/* Valued Opportunity Thank You Note */}
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center text-emerald-900 font-bold text-xs">
                  Thank you for your valuable opportunity. We look forward to delivering a reliable solar solution and building a long-term partnership with you.
                </div>

                {/* Contact Details & Visiting Card */}
                <div className="pt-2 border-t border-slate-100">
                  <h3 className="text-sm font-black text-black mb-2 tracking-tight uppercase">
                    Contact Details
                  </h3>
                  <div className="p-5 bg-slate-900 text-white rounded-2xl shadow-md border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="text-base font-black tracking-tight text-white">A Boopathi BE.,</div>
                      <div className="text-xs font-bold text-emerald-400">CEO &amp; Managing Director &bull; AB ENERGY SOLUTIONS</div>
                      <div className="text-xs text-slate-300 font-mono pt-0.5">
                        Phone: <strong className="text-white">+91 95664 99678</strong> | Email: abenergysolutiontn@gmail.com
                      </div>
                      <div className="text-xs text-slate-300">
                        1/359, Maruthi Nagar, Chinnakavandanur, Namakkal, TN - 636202
                      </div>
                      <div className="text-[10px] text-emerald-400 font-semibold pt-0.5">
                        12+ Years Solar Experience &bull; TNEB C-Licence Certified Enterprise
                      </div>
                    </div>

                    <div className="bg-white text-black p-3 rounded-xl border border-slate-200 text-center shrink-0 w-48">
                      <div className="text-[10px] font-black uppercase text-black">For AB Energy Solutions</div>
                      <div className="h-10 border-b border-dashed border-slate-300 my-1" />
                      <div className="text-[10px] text-slate-500 font-semibold">Authorized Signatory</div>
                    </div>
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 text-right pt-2 border-t border-slate-100">
                  Page 6 of 6 &bull; AB Energy Solutions Techno-Commercial Proposal
                </div>
              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: STATUTORY GST AUDIT BREAKDOWN (INTERNAL/STATUTORY) */}
          {/* ======================================================== */}
          {docTab === 'tax_audit' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              
              {/* Statutory Split Card */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-base font-black text-black uppercase">
                      Two-Tier Statutory GST Breakdown
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Compliant with GST Council Circular No. 163/19/2021: 5% for Solar PV &amp; Inverter (70%), 18% for Structure &amp; BOS (30%)
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-slate-100 text-black border border-slate-300 rounded-full text-xs font-black font-mono">
                    Composite Rate: 13.80%
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Category 1: 5% GST */}
                  <div className="p-4 rounded-xl border border-slate-300 bg-slate-50 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-black uppercase tracking-wide">
                        Solar PV &amp; Inverters (5% GST)
                      </span>
                      <span className="px-2 py-0.5 bg-slate-200 text-black rounded font-mono font-bold text-[10px]">
                        CGST 2.5% + SGST 2.5%
                      </span>
                    </div>
                    <div className="text-xl font-black text-black font-mono">
                      ₹{(solarInverterTaxable + solarInverterGst).toLocaleString('en-IN')}
                    </div>
                    <div className="text-xs text-slate-600 space-y-1 pt-2 border-t border-slate-200 font-mono">
                      <div className="flex justify-between">
                        <span>Taxable Value:</span>
                        <span className="font-bold text-black">₹{solarInverterTaxable.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-black font-bold">
                        <span>Total 5% GST:</span>
                        <span>+ ₹{solarInverterGst.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {solarInverterItems.length} items (Panels, Inverter)
                      </div>
                    </div>
                  </div>

                  {/* Category 2: 18% GST */}
                  <div className="p-4 rounded-xl border border-slate-300 bg-slate-50 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-black uppercase tracking-wide">
                        Structures &amp; BOS (18% GST)
                      </span>
                      <span className="px-2 py-0.5 bg-slate-200 text-black rounded font-mono font-bold text-[10px]">
                        CGST 9% + SGST 9%
                      </span>
                    </div>
                    <div className="text-xl font-black text-black font-mono">
                      ₹{(bosTaxable + bosGst).toLocaleString('en-IN')}
                    </div>
                    <div className="text-xs text-slate-600 space-y-1 pt-2 border-t border-slate-200 font-mono">
                      <div className="flex justify-between">
                        <span>Taxable Value:</span>
                        <span className="font-bold text-black">₹{bosTaxable.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-black font-bold">
                        <span>Total 18% GST:</span>
                        <span>+ ₹{bosGst.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {otherBosItems.length} items (Structure, Cables, BOS, Labor)
                      </div>
                    </div>
                  </div>
                </div>

                {/* Statutory Line Items Audit Table */}
                <div className="pt-2">
                  <h4 className="text-xs font-black text-black uppercase tracking-wider mb-2">
                    Itemized Tax Breakdown ({items.length} Items)
                  </h4>
                  <div className="overflow-x-auto border border-slate-300 rounded-xl">
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="bg-slate-100 text-black font-black uppercase text-[10px] border-b border-slate-300">
                        <tr>
                          <th className="py-2.5 px-3">#</th>
                          <th className="py-2.5 px-3">Description</th>
                          <th className="py-2.5 px-3 text-center">Qty</th>
                          <th className="py-2.5 px-3 text-right">Taxable (₹)</th>
                          <th className="py-2.5 px-3 text-center">GST Rate</th>
                          <th className="py-2.5 px-3 text-right">GST (₹)</th>
                          <th className="py-2.5 px-3 text-right">Total (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                        {items.map((it, idx) => {
                          const is5 = it.gstRate === 5 || it.category === 'Solar Modules' || it.category === 'Inverter';
                          const rate = is5 ? 5 : 18;
                          const taxable = it.taxableAmount || (it.quantity || 1) * (it.unitPrice || 0);
                          const gstVal = it.taxAmount || (taxable * (rate / 100));
                          const total = taxable + gstVal;

                          return (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="py-2 px-3 text-slate-400 font-sans">{idx + 1}</td>
                              <td className="py-2 px-3 font-sans">
                                <div className="font-bold text-black">{it.description || it.category}</div>
                                {it.makeModel && <div className="text-[10px] text-slate-500">{it.makeModel}</div>}
                              </td>
                              <td className="py-2 px-3 text-center">{it.quantity} {it.unit || 'Nos'}</td>
                              <td className="py-2 px-3 text-right">₹{taxable.toLocaleString('en-IN')}</td>
                              <td className="py-2 px-3 text-center">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  is5 ? 'bg-blue-100 text-blue-900 font-black' : 'bg-slate-200 text-black font-black'
                                }`}>
                                  {rate}%
                                </span>
                              </td>
                              <td className="py-2 px-3 text-right">₹{gstVal.toLocaleString('en-IN')}</td>
                              <td className="py-2 px-3 text-right font-black text-black">₹{total.toLocaleString('en-IN')}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Grand Summary */}
                <div className="bg-slate-900 text-white rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono">
                  <div className="space-y-1 text-xs">
                    <div>Taxable Subtotal: <strong className="text-white">₹{(solarInverterTaxable + bosTaxable).toLocaleString('en-IN')}</strong></div>
                    <div>Total GST Accrued: <strong className="text-emerald-400">₹{(solarInverterGst + bosGst).toLocaleString('en-IN')}</strong></div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest block">Final Contract Value</span>
                    <span className="text-2xl font-black text-emerald-400">
                      ₹{quotation.totalAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER (Hidden during print) */}
        <div className="bg-white px-6 py-3.5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0 no-print">
          <div className="text-xs text-slate-600">
            Payment Terms: <strong className="text-black font-black">90% Advance</strong>, 10% on Commissioning.
          </div>

          <div className="flex items-center gap-2">
            {onHandoverToSales && quotation.status === 'Draft' && (
              <button
                onClick={() => {
                  onHandoverToSales(quotation);
                  onClose();
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Handover to Sales Workspace</span>
              </button>
            )}

            {onConvertProject && quotation.status === 'Customer_Accepted' && (
              <button
                onClick={() => {
                  onConvertProject(quotation);
                  onClose();
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Convert to Active EPC Project</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
