import React, { useState, useMemo } from 'react';
import { X, Plus, Trash2, Save, Calculator, AlertTriangle, ShieldAlert } from 'lucide-react';
import { Quotation, QuotationItem } from '../../types';
import { convertNumberToWords } from '../../utils/quotationEngine';

interface EditQuotationModalProps {
  quotation: Quotation;
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: any) => Promise<boolean>;
}

export const EditQuotationModal: React.FC<EditQuotationModalProps> = ({
  quotation,
  isOpen,
  onClose,
  onSave,
}) => {
  if (!isOpen) return null;

  const currentVer = quotation.versions?.[quotation.currentVersion - 1] || quotation.versions?.[0];

  const [capacityKw, setCapacityKw] = useState<number>(quotation.systemCapacityKw || 5);
  const [packageTier, setPackageTier] = useState<any>(quotation.packageTier || 'Premium Bifacial');
  const [discountAmount, setDiscountAmount] = useState<number>(quotation.discountAmount || 0);
  const [notes, setNotes] = useState<string>(currentVer?.notes || '');
  const [saving, setSaving] = useState(false);

  // Initialize line items
  const initialItems: any[] = useMemo(() => {
    if (currentVer?.items && currentVer.items.length > 0) {
      return currentVer.items.map((it, idx) => ({
        id: it.id || `ITEM-${idx + 1}`,
        category: it.category || 'Protection & BOS',
        description: it.description || '',
        makeModel: it.makeModel || '',
        hsnSacCode: it.hsnSacCode || '8541',
        quantity: it.quantity || 1,
        unit: it.unit || 'Nos',
        unitPrice: it.unitPrice || 0,
        gstRate: it.gstRate !== undefined ? it.gstRate : 18,
        warrantyPeriod: it.warrantyPeriod || '5-Yr Comprehensive',
      }));
    }
    return [
      {
        id: 'QI-1',
        category: 'Panels',
        description: `${Math.ceil((capacityKw * 1000) / 575)} × Tier-1 Bifacial Solar Modules`,
        makeModel: 'Jinko 575W Tiger Neo TOPCon',
        hsnSacCode: '8541',
        quantity: Math.ceil((capacityKw * 1000) / 575),
        unit: 'Nos',
        unitPrice: 12800,
        gstRate: 5,
        warrantyPeriod: '12-Yr Product / 30-Yr Output',
      },
      {
        id: 'QI-2',
        category: 'Inverter',
        description: `${capacityKw} kW High-Yield Cloud Inverter`,
        makeModel: 'Growatt / Sungrow Smart Inverter',
        hsnSacCode: '8504',
        quantity: 1,
        unit: 'Unit',
        unitPrice: 48000,
        gstRate: 5,
        warrantyPeriod: '10-Yr Replacement Warranty',
      },
    ];
  }, [currentVer, capacityKw]);

  const [items, setItems] = useState<any[]>(initialItems);

  // Update item field
  const handleItemChange = (index: number, field: string, value: any) => {
    setItems(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  // Add new custom row
  const handleAddItem = () => {
    const newItem = {
      id: `CUSTOM-${Date.now().toString().slice(-4)}`,
      category: 'Protection & BOS',
      description: 'Custom Auxiliary Equipment / Surcharge',
      makeModel: 'Standard EPC Spec',
      hsnSacCode: '8544',
      quantity: 1,
      unit: 'Set',
      unitPrice: 10000,
      gstRate: 18,
      warrantyPeriod: '5-Yr Workmanship',
    };
    setItems(prev => [...prev, newItem]);
  };

  // Delete row
  const handleDeleteItem = (index: number) => {
    if (items.length <= 1) {
      alert('At least one item must remain in the quotation.');
      return;
    }
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  // Real-time calculations
  const calculations = useMemo(() => {
    let subtotal = 0;
    const computedItems = items.map(item => {
      const gross = Math.round((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0));
      subtotal += gross;
      return { ...item, gross };
    });

    const discount = Math.min(subtotal, Math.max(0, Number(discountAmount) || 0));
    const taxableTotal = Math.max(0, subtotal - discount);

    let totalGst = 0;
    computedItems.forEach(item => {
      const ratio = subtotal > 0 ? item.gross / subtotal : 0;
      const lineTaxable = item.gross - Math.round(discount * ratio);
      const lineGst = Math.round(lineTaxable * ((Number(item.gstRate) || 0) / 100));
      totalGst += lineGst;
    });

    const finalAmount = taxableTotal + totalGst;
    const amountInWords = convertNumberToWords(finalAmount);
    const requiresApproval = discount > 15000;

    return {
      subtotal,
      discount,
      taxableTotal,
      totalGst,
      finalAmount,
      amountInWords,
      requiresApproval,
      computedItems,
    };
  }, [items, discountAmount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        systemCapacityKw: Number(capacityKw),
        packageTier,
        discountAmount: calculations.discount,
        notes,
        customItems: items.map(it => ({
          id: it.id,
          category: it.category,
          description: it.description,
          makeModel: it.makeModel,
          hsnSacCode: it.hsnSacCode,
          quantity: Number(it.quantity) || 1,
          unit: it.unit || 'Nos',
          unitPrice: Number(it.unitPrice) || 0,
          gstRate: Number(it.gstRate) || 18,
          warrantyPeriod: it.warrantyPeriod,
        })),
      };

      const success = await onSave(payload);
      if (success) {
        onClose();
      }
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl my-6 flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Edit Quotation &amp; Bill of Materials
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-600/30 text-blue-300 font-mono">
                  {quotation.quotationNumber}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Client: {quotation.leadName} • Custom engineering &amp; item-wise GST configuration
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Top Parameters Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                System Capacity (kW DC)
              </label>
              <input
                type="number"
                step="0.1"
                min="0.5"
                max="500"
                value={capacityKw}
                onChange={e => setCapacityKw(parseFloat(e.target.value) || 1)}
                className="w-full text-sm font-semibold px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-hidden"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Package Tier
              </label>
              <select
                value={packageTier}
                onChange={e => setPackageTier(e.target.value)}
                className="w-full text-sm font-medium px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-hidden"
              >
                <option value="Standard">Standard Monocrystalline</option>
                <option value="Premium Bifacial">Premium Bifacial TOPCon</option>
                <option value="Commercial Heavy Duty">Commercial Heavy Duty Gantry</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                <span>Commercial Discount (₹)</span>
                {calculations.requiresApproval && (
                  <span className="text-[10px] text-amber-600 font-bold flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3" /> &gt; ₹15k Needs Approval
                  </span>
                )}
              </label>
              <input
                type="number"
                step="500"
                min="0"
                value={discountAmount}
                onChange={e => setDiscountAmount(parseFloat(e.target.value) || 0)}
                className="w-full text-sm font-semibold px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-hidden"
              />
            </div>
          </div>

          {/* BOM Items Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Bill of Materials (BOM) &amp; Item-Wise GST</h4>
                <p className="text-xs text-slate-500">Edit material descriptions, quantities, unit prices, HSN codes, and statutory GST rates.</p>
              </div>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Custom Line</span>
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-900 text-white font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3 w-10 text-center">#</th>
                    <th className="py-2.5 px-3 min-w-[220px]">Item Description &amp; Make</th>
                    <th className="py-2.5 px-2 w-20 text-center">HSN/SAC</th>
                    <th className="py-2.5 px-2 w-16 text-center">Qty</th>
                    <th className="py-2.5 px-2 w-16 text-center">Unit</th>
                    <th className="py-2.5 px-3 w-24 text-right">Unit Rate (₹)</th>
                    <th className="py-2.5 px-3 w-24 text-right">Gross (₹)</th>
                    <th className="py-2.5 px-2 w-16 text-center">GST %</th>
                    <th className="py-2.5 px-2 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {items.map((item, index) => {
                    const gross = Math.round((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0));
                    return (
                      <tr key={item.id || index} className="hover:bg-slate-50/70">
                        <td className="py-2 px-3 text-center text-slate-400 font-mono text-[11px]">
                          {index + 1}
                        </td>

                        {/* Description & Make */}
                        <td className="py-2 px-3 space-y-1">
                          <input
                            type="text"
                            value={item.description}
                            onChange={e => handleItemChange(index, 'description', e.target.value)}
                            className="w-full px-2 py-1 text-xs font-semibold border border-slate-200 rounded-md focus:border-blue-500 outline-hidden"
                            placeholder="Description..."
                            required
                          />
                          <input
                            type="text"
                            value={item.makeModel}
                            onChange={e => handleItemChange(index, 'makeModel', e.target.value)}
                            className="w-full px-2 py-0.5 text-[11px] text-slate-500 border border-slate-200 rounded-md focus:border-blue-500 outline-hidden"
                            placeholder="Make / Model..."
                          />
                        </td>

                        {/* HSN/SAC */}
                        <td className="py-2 px-2 text-center">
                          <input
                            type="text"
                            value={item.hsnSacCode}
                            onChange={e => handleItemChange(index, 'hsnSacCode', e.target.value)}
                            className="w-full text-center px-1 py-1 text-xs font-mono border border-slate-200 rounded-md focus:border-blue-500 outline-hidden"
                            placeholder="8541"
                          />
                        </td>

                        {/* Quantity */}
                        <td className="py-2 px-2 text-center">
                          <input
                            type="number"
                            min="1"
                            step="any"
                            value={item.quantity}
                            onChange={e => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                            className="w-full text-center px-1 py-1 text-xs font-bold border border-slate-200 rounded-md focus:border-blue-500 outline-hidden"
                            required
                          />
                        </td>

                        {/* Unit */}
                        <td className="py-2 px-2 text-center">
                          <select
                            value={item.unit}
                            onChange={e => handleItemChange(index, 'unit', e.target.value)}
                            className="w-full text-center px-1 py-1 text-xs border border-slate-200 rounded-md focus:border-blue-500 outline-hidden"
                          >
                            <option value="Nos">Nos</option>
                            <option value="Unit">Unit</option>
                            <option value="kW">kW</option>
                            <option value="Set">Set</option>
                            <option value="Turnkey">Turnkey</option>
                            <option value="Mtrs">Mtrs</option>
                            <option value="Job">Job</option>
                          </select>
                        </td>

                        {/* Unit Price */}
                        <td className="py-2 px-3 text-right">
                          <input
                            type="number"
                            min="0"
                            step="100"
                            value={item.unitPrice}
                            onChange={e => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                            className="w-full text-right px-2 py-1 text-xs font-semibold border border-slate-200 rounded-md focus:border-blue-500 outline-hidden"
                            required
                          />
                        </td>

                        {/* Gross */}
                        <td className="py-2 px-3 text-right font-bold text-slate-800 font-mono">
                          ₹{gross.toLocaleString('en-IN')}
                        </td>

                        {/* GST % */}
                        <td className="py-2 px-2 text-center">
                          <select
                            value={item.gstRate}
                            onChange={e => handleItemChange(index, 'gstRate', parseFloat(e.target.value) || 0)}
                            className="w-full text-center font-bold px-1 py-1 text-xs border border-slate-200 rounded-md focus:border-blue-500 outline-hidden"
                          >
                            <option value={5}>5%</option>
                            <option value={12}>12%</option>
                            <option value={18}>18%</option>
                          </select>
                        </td>

                        {/* Delete Action */}
                        <td className="py-2 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(index)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Amount in Words Banner */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-600">Total Contract Amount in Words:</span>
            <span className="font-bold text-slate-900 italic font-serif">
              "{calculations.amountInWords}"
            </span>
          </div>

          {/* Bottom Financial Summary Card */}
          <div className="bg-slate-900 text-white rounded-xl p-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Gross Subtotal</p>
              <p className="text-lg font-bold mt-0.5">₹{calculations.subtotal.toLocaleString('en-IN')}</p>
            </div>
            <div>
              <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Commercial Discount</p>
              <p className="text-lg font-bold text-emerald-400 mt-0.5">- ₹{calculations.discount.toLocaleString('en-IN')}</p>
            </div>
            <div>
              <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Total Item-Wise GST</p>
              <p className="text-lg font-bold text-blue-400 mt-0.5">+ ₹{calculations.totalGst.toLocaleString('en-IN')}</p>
            </div>
            <div className="border-l border-slate-800 pl-4">
              <p className="text-[11px] text-emerald-400 uppercase tracking-wider font-bold">Final Contract Payable</p>
              <p className="text-xl font-extrabold text-white mt-0.5">₹{calculations.finalAmount.toLocaleString('en-IN')}</p>
            </div>
          </div>

          {/* Internal Engineering / Sales Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Quotation Revision Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Customized structure height to 2.5m and updated bifacial modules as requested by client."
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-hidden"
            />
          </div>
        </form>

        {/* Modal Actions */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors"
          >
            Cancel
          </button>
          
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Recalculating & Generating PDF...' : 'Save Changes & Update Proposal'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
