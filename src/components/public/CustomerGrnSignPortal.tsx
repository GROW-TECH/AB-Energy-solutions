import React, { useState, useEffect, useRef } from 'react';
import { 
  CheckCircle2, AlertTriangle, XCircle, FileText, Download, 
  ShieldCheck, RefreshCw, Eraser, Eye, Lock, Clock, Building, User, Phone, MapPin
} from 'lucide-react';
import { getApiUrl } from '../../utils/apiUrl';

interface CustomerGrnSignPortalProps {
  token: string;
}

export const CustomerGrnSignPortal: React.FC<CustomerGrnSignPortalProps> = ({ token }) => {
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [portalStatus, setPortalStatus] = useState<'Pending' | 'Signed' | 'Expired' | 'Cancelled'>('Pending');
  const [grnData, setGrnData] = useState<any>(null);

  // Form states
  const [signerName, setSignerName] = useState('');
  const [hasConsent, setHasConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signedResult, setSignedResult] = useState<any>(null);

  // Signature canvas
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  // Fetch GRN details using public token
  const fetchGrnDetails = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await fetch(getApiUrl(`/api/procurement/sign-grn/${token}`));
      const data = await res.json();
      setLoading(false);

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Failed to load signing portal');
        return;
      }

      setPortalStatus(data.status);

      if (data.status === 'Signed') {
        setSignedResult(data.grn);
      } else if (data.status === 'Expired' || data.status === 'Cancelled') {
        setErrorMsg(data.error);
        if (data.grnNumber) {
          setGrnData({ grnNumber: data.grnNumber, expiresAt: data.expiresAt });
        }
      } else {
        setGrnData(data.grn);
        setSignerName(data.grn.customerName || '');
      }
    } catch (err: any) {
      setLoading(false);
      setErrorMsg(err.message || 'Network error while loading document');
    }
  };

  useEffect(() => {
    if (token) {
      fetchGrnDetails();
    }
  }, [token]);

  // Canvas drawing handlers (mouse & touch)
  const getCanvasPos = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    } else {
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const { x, y } = getCanvasPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#047857'; // Deep emerald
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCanvasPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  // Submit electronic signature
  const handleSubmitSignature = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasSignature || !canvasRef.current) {
      alert('Please provide your electronic signature in the signature box before submitting.');
      return;
    }
    if (!hasConsent) {
      alert('Please confirm the material receipt declaration checkbox.');
      return;
    }
    if (!signerName.trim()) {
      alert('Please enter your full name as the authorized recipient.');
      return;
    }

    try {
      setIsSubmitting(true);
      const signatureDataUrl = canvasRef.current.toDataURL('image/png');

      const res = await fetch(getApiUrl(`/api/procurement/sign-grn/${token}`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: signerName.trim(),
          customerSignature: signatureDataUrl,
          declarationConsent: true,
        }),
      });

      const data = await res.json();
      setIsSubmitting(false);

      if (res.ok && data.success) {
        setPortalStatus('Signed');
        setSignedResult(data);
      } else {
        alert(data.error || 'Failed to submit signature. Please try again.');
      }
    } catch (err: any) {
      setIsSubmitting(false);
      alert(err.message || 'Error communicating with server.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-white font-sans antialiased">
      {/* Top Corporate Branding Header */}
      <header className="bg-slate-950/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40 px-4 py-3 sm:px-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white p-1 rounded-xl shadow-xs">
              <img src={getApiUrl('/logo.png')} alt="AB Energy Solutions" className="h-9 w-auto object-contain" />
            </div>
            <div>
              <span className="text-sm font-black text-white tracking-tight block">AB ENERGY SOLUTIONS</span>
              <span className="text-[10px] text-emerald-400 font-semibold block">Client Electronic Signing Portal</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-right">
            <span className="p-1.5 bg-emerald-950/60 text-emerald-400 rounded-lg border border-emerald-800/50 hidden sm:inline-flex">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <div className="hidden sm:block">
              <span className="text-[11px] font-bold text-slate-300 block">Secure 256-Bit Session</span>
              <span className="text-[9px] text-slate-500 block">IT Act Compliant E-Signature</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* Loading Spinner */}
        {loading && (
          <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-12 text-center space-y-4 shadow-xl">
            <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <div className="space-y-1">
              <h2 className="text-base font-bold text-white">Loading Material Delivery Note</h2>
              <p className="text-xs text-slate-400">Verifying security token and fetching item manifest...</p>
            </div>
          </div>
        )}

        {/* Expired State */}
        {!loading && portalStatus === 'Expired' && (
          <div className="bg-slate-800/90 border border-amber-600/40 rounded-2xl p-8 sm:p-10 text-center space-y-5 shadow-2xl animate-in zoom-in-95">
            <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center mx-auto text-amber-400">
              <Clock className="w-8 h-8" />
            </div>
            <div className="space-y-2 max-w-md mx-auto">
              <h2 className="text-xl font-black text-white">Signing Link Expired</h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                This Goods Receipt Note signing link for <strong className="text-white font-mono">{grnData?.grnNumber || 'your order'}</strong> has expired for security reasons.
              </p>
              <p className="text-xs text-slate-400">
                Please contact the AB Energy Solutions logistics team to request a fresh signing link.
              </p>
            </div>
            <div className="pt-2 flex flex-wrap justify-center gap-3 text-xs">
              <a
                href="tel:+919566499678"
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors flex items-center gap-2"
              >
                <Phone className="w-4 h-4" />
                <span>Call Logistics Team</span>
              </a>
              <button
                onClick={fetchGrnDetails}
                className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold rounded-xl transition-colors flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Check Again</span>
              </button>
            </div>
          </div>
        )}

        {/* Cancelled / Revoked State */}
        {!loading && portalStatus === 'Cancelled' && (
          <div className="bg-slate-800/90 border border-rose-600/40 rounded-2xl p-8 sm:p-10 text-center space-y-5 shadow-2xl animate-in zoom-in-95">
            <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center justify-center mx-auto text-rose-400">
              <XCircle className="w-8 h-8" />
            </div>
            <div className="space-y-2 max-w-md mx-auto">
              <h2 className="text-xl font-black text-white">Signing Link Revoked</h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                {errorMsg || 'This material delivery signing link has been revoked or cancelled by AB Energy Solutions.'}
              </p>
              <p className="text-xs text-slate-400">
                A revised Goods Receipt Note will be provided if material dispatch is being rescheduled.
              </p>
            </div>
          </div>
        )}

        {/* Success / Already Signed State */}
        {!loading && portalStatus === 'Signed' && signedResult && (
          <div className="bg-slate-800/90 border border-emerald-500/40 rounded-2xl p-8 sm:p-10 text-center space-y-6 shadow-2xl animate-in zoom-in-95">
            <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl flex items-center justify-center mx-auto text-emerald-400 animate-bounce">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-2 max-w-lg mx-auto">
              <span className="text-xs font-mono font-black text-emerald-400 uppercase tracking-widest bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-800/50">
                Receipt Verified &amp; Signed
              </span>
              <h2 className="text-2xl font-black text-white pt-2">
                Material Delivery Acknowledged
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Thank you! The electronic signature for Goods Receipt Note <strong className="text-white font-mono">{signedResult.grnNumber}</strong> has been successfully recorded and locked against alteration.
              </p>
            </div>

            <div className="bg-slate-900/80 border border-slate-700/80 rounded-xl p-4 max-w-md mx-auto text-left text-xs space-y-2">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Signer Name:</span>
                <span className="text-white font-bold">{signedResult.signerName || signedResult.customerName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Signing Timestamp:</span>
                <span className="text-white font-mono">{signedResult.signedAt || new Date().toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Audit Status:</span>
                <span className="text-emerald-400 font-bold">✓ Logged &amp; Transferred to PM</span>
              </div>
            </div>

            {signedResult.signedPdfUrl && (
              <div className="pt-2">
                <a
                  href={getApiUrl(signedResult.signedPdfUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-emerald-900/30 inline-flex items-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Signed Delivery Receipt (PDF)</span>
                </a>
              </div>
            )}

            <p className="text-[10px] text-slate-400 max-w-sm mx-auto">
              A copy has been permanently filed in the AB Energy Solutions operations log. The installation engineering crew will proceed with site work as scheduled.
            </p>
          </div>
        )}

        {/* Active Pending Signing Workflow */}
        {!loading && portalStatus === 'Pending' && grnData && (
          <form onSubmit={handleSubmitSignature} className="space-y-6">
            
            {/* Banner card */}
            <div className="bg-linear-to-r from-emerald-950/70 via-slate-800 to-slate-900 border border-emerald-600/30 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    Awaiting Customer Signature
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    Ref: {grnData.grnNumber}
                  </span>
                </div>
                <h1 className="text-lg sm:text-xl font-black text-white mt-1.5">
                  Goods Receipt Note &amp; Site Material Handover
                </h1>
                <p className="text-xs text-slate-300 mt-0.5">
                  Please review the verified solar equipment delivery below and apply your electronic signature to confirm receipt.
                </p>
              </div>

              {grnData.previewPdfUrl && (
                <a
                  href={getApiUrl(grnData.previewPdfUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0"
                >
                  <Eye className="w-4 h-4 text-emerald-400" />
                  <span>Preview Full PDF</span>
                </a>
              )}
            </div>

            {/* Delivery Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Customer / Site Card */}
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-700">
                  <User className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-black text-white uppercase tracking-wider">
                    Customer &amp; Site Location
                  </h3>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Customer Name:</span>
                    <strong className="text-white">{grnData.customerName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Contact Phone:</span>
                    <span className="text-slate-200 font-mono">{grnData.customerPhone || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Installation Site Address:</span>
                    <span className="text-slate-200">{grnData.customerAddress || 'Client Site Delivery'}</span>
                  </div>
                </div>
              </div>

              {/* Dispatch / Order Card */}
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-700">
                  <Building className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-black text-white uppercase tracking-wider">
                    Delivery &amp; Logistics Details
                  </h3>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">PO Reference:</span>
                    <strong className="text-white font-mono">{grnData.poNumber}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Supplier / Delivery Challan:</span>
                    <span className="text-slate-200">{grnData.supplierName} • DC #{grnData.deliveryChallanNo || 'On-Site'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Material Arrival Date:</span>
                    <span className="text-slate-200 font-mono">{grnData.receivedDate}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Verified Materials Manifest Table (Read-Only) */}
            <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl overflow-hidden shadow-md">
              <div className="px-5 py-3.5 bg-slate-950/60 border-b border-slate-700/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-black text-white uppercase tracking-wider">
                    Delivered Equipment Manifest ({grnData.items?.length || 0} Items)
                  </h3>
                </div>
                <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                  Read-Only Verification
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/70 text-slate-400 font-bold text-[10px] uppercase border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-4 w-12 text-center">#</th>
                      <th className="py-2.5 px-4">Item Description</th>
                      <th className="py-2.5 px-4 w-32">Category</th>
                      <th className="py-2.5 px-4 text-right w-24">Delivered Qty</th>
                      <th className="py-2.5 px-4 text-center w-20">Unit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {grnData.items && grnData.items.map((item: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-800/50">
                        <td className="py-2.5 px-4 text-center font-mono text-slate-500">{idx + 1}</td>
                        <td className="py-2.5 px-4">
                          <span className="font-bold text-white block">{item.itemName}</span>
                          {item.remarks && <span className="text-[10px] text-slate-400 block">{item.remarks}</span>}
                        </td>
                        <td className="py-2.5 px-4 text-slate-300 font-medium">{item.category || 'Solar BOS'}</td>
                        <td className="py-2.5 px-4 text-right font-mono font-black text-emerald-400">
                          {item.receivedQuantity}
                        </td>
                        <td className="py-2.5 px-4 text-center text-slate-400">{item.unit || 'Nos'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Legal Consent Declaration Box */}
            <div className="bg-emerald-950/40 border border-emerald-600/40 rounded-2xl p-5 space-y-3">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="consentCheckbox"
                  checked={hasConsent}
                  onChange={(e) => setHasConsent(e.target.checked)}
                  className="mt-1 h-5 w-5 rounded-md border-slate-600 bg-slate-900 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <label htmlFor="consentCheckbox" className="text-xs text-slate-200 leading-relaxed cursor-pointer select-none">
                  <strong className="text-emerald-400 block font-black uppercase text-[11px] mb-0.5">
                    Mandatory Material Receipt Declaration:
                  </strong>
                  I, <strong className="text-white underline">{signerName || grnData.customerName}</strong>, hereby acknowledge physical receipt of the turnkey solar power plant equipment, modules, inverters, and BOS accessories listed above at our site in sound, un-damaged condition, subject to the discrepancy inspection recorded herein.
                </label>
              </div>
            </div>

            {/* Electronic Signature Pad Box */}
            <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-700">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-black text-white uppercase tracking-wider">
                    Customer Electronic Signature
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={clearCanvas}
                  className="px-2.5 py-1 text-[11px] bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Eraser className="w-3.5 h-3.5" />
                  <span>Clear Pad</span>
                </button>
              </div>

              {/* Signer Full Name Input */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Full Name of Signatory at Site <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  placeholder="Enter full legal name of person signing at site"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-hidden focus:border-emerald-500 font-medium"
                />
              </div>

              {/* Touch & Mouse Signature Canvas */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Draw Signature with Touch or Mouse <span className="text-rose-400">*</span>
                </label>
                <div className="bg-white rounded-xl overflow-hidden border border-slate-600 shadow-inner relative touch-none">
                  <canvas
                    ref={canvasRef}
                    width={700}
                    height={160}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-40 cursor-crosshair block"
                  />
                  {!hasSignature && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-slate-400 text-xs font-medium">
                      <span>Sign here using finger (mobile) or mouse (desktop)</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Legal Electronic Signature Notice */}
              <div className="p-3 bg-slate-900/60 border border-slate-700 rounded-xl text-[10px] text-slate-400 leading-relaxed">
                <strong className="text-slate-300">Electronic Signature Audit Notice:</strong> By submitting, you apply an authenticated electronic signature under the Information Technology Act. Your IP address, device browser information, and timestamp will be permanently cryptographically bound to this Goods Receipt Note. This workflow records an electronic signature and is not a certificate-based digital signature.
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || !hasSignature || !hasConsent || !signerName.trim()}
                  className={`w-full py-3.5 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2 shadow-lg ${
                    isSubmitting || !hasSignature || !hasConsent || !signerName.trim()
                      ? 'bg-slate-700 text-slate-500 cursor-not-allowed shadow-none'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/40 cursor-pointer active:scale-[0.99]'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Generating Signed Delivery Note &amp; Locking Record...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Sign &amp; Complete Material Receipt</span>
                    </>
                  )}
                </button>
              </div>

            </div>

          </form>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-800/80 px-4 py-4 text-center text-slate-500 text-[10px]">
        AB Energy Solutions • Turnkey Solar EPC, Engineering &amp; Operations • GST: 33FSQPA3244H1ZU
      </footer>
    </div>
  );
};
