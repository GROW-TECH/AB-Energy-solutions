import React, { useState, useEffect, useMemo } from 'react';
import { X, Plus, Trash2, Save, Calculator, AlertCircle, Loader2, Layers } from 'lucide-react';

// =========================================================================
// 1. EDIT BILL OF MATERIALS (BOM) MODAL
// =========================================================================
interface EditBomModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotationNumber: string;
  initialItems: any[];
  onSave: (updatedItems: any[]) => Promise<boolean>;
}

export const EditBomModal: React.FC<EditBomModalProps> = ({
  isOpen,
  onClose,
  quotationNumber,
  initialItems,
  onSave,
}) => {
  const [items, setItems] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const cloned = (initialItems || []).map((it, idx) => ({
        id: it.id || `ITEM-${idx + 1}`,
        category: it.category || it.description || '',
        description: it.description || it.category || '',
        specification: it.specification || it.makeModel || '',
        unit: it.unit || 'Nos',
        quantity: it.quantity !== undefined ? it.quantity : 1,
        unitPrice: it.unitPrice || 0,
        gstRate: it.gstRate !== undefined ? it.gstRate : 18,
        hsnSacCode: it.hsnSacCode || '8541',
        taxableAmount: it.taxableAmount || 0,
        taxAmount: it.taxAmount || 0,
        totalPrice: it.totalPrice || 0,
      }));
      setItems(cloned.length > 0 ? cloned : [
        { id: 'ITEM-1', category: 'Solar Modules', description: 'Solar Modules', specification: '550W Mono PERC', unit: 'KWp', quantity: 5, unitPrice: 28000, gstRate: 5 }
      ]);
      setError(null);
    }
  }, [isOpen, initialItems]);

  if (!isOpen) return null;

  const handleChange = (index: number, field: string, value: any) => {
    setItems(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      if (field === 'category') {
        copy[index].description = value;
      }
      return copy;
    });
  };

  const handleAddRow = () => {
    setItems(prev => [
      ...prev,
      {
        id: `ITEM-NEW-${Date.now()}`,
        category: '',
        description: '',
        specification: '',
        unit: 'Nos',
        quantity: 1,
        unitPrice: 0,
        gstRate: 18,
        hsnSacCode: '7308',
      }
    ]);
  };

  const handleDeleteRow = (index: number) => {
    if (items.length <= 1) {
      setError('At least one Bill of Materials line item is required.');
      return;
    }
    setError(null);
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    for (let i = 0; i < items.length; i++) {
      if (!items[i].category?.trim()) {
        setError(`Row #${i + 1} material name cannot be empty.`);
        return;
      }
      if (Number(items[i].quantity) <= 0 || isNaN(Number(items[i].quantity))) {
        setError(`Row #${i + 1} quantity must be a valid positive number.`);
        return;
      }
    }

    setSaving(true);
    setError(null);
    try {
      const ok = await onSave(items);
      if (ok) {
        onClose();
      } else {
        setError('Failed to update Bill of Materials. Please try again.');
      }
    } catch (err: any) {
      setError(err?.message || 'Error saving BOM.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-300 shadow-2xl max-w-4xl w-full my-auto flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95">
        
        {/* Header */}
        <div className="bg-slate-900 px-5 py-4 border-b border-slate-800 flex items-center justify-between text-white">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-slate-800 text-emerald-400 rounded-lg">
              <Layers className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-sm sm:text-base font-black tracking-tight text-white flex items-center gap-2">
                Edit Bill Of Materials
                <span className="text-xs px-2 py-0.5 rounded font-mono bg-slate-800 text-slate-300 border border-slate-700">
                  {quotationNumber}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Update line items, technical specifications, units, and quantities for the proposal.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <div className="overflow-x-auto border border-slate-300 rounded-xl shadow-2xs">
            <table className="w-full min-w-[620px] text-left text-xs">
              <thead className="bg-slate-900 text-white font-black text-[10px] uppercase border-b border-slate-300">
                <tr>
                  <th className="py-2.5 px-3 text-center w-12">S.NO</th>
                  <th className="py-2.5 px-3 min-w-[160px]">MATERIALS *</th>
                  <th className="py-2.5 px-3 min-w-[200px]">SPECIFICATION</th>
                  <th className="py-2.5 px-3 text-center w-28">UNITS *</th>
                  <th className="py-2.5 px-3 text-center w-24">QUANTITY *</th>
                  <th className="py-2.5 px-3 text-center w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {items.map((item, idx) => (
                  <tr key={item.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="py-2 px-3 text-center font-mono font-bold text-slate-500">
                      {idx + 1}
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={item.category || item.description || ''}
                        onChange={e => handleChange(idx, 'category', e.target.value)}
                        placeholder="e.g. Solar panels, Inverter..."
                        className="w-full px-2.5 py-1.5 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-lg focus:border-slate-900 outline-hidden"
                        required
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={item.specification || ''}
                        onChange={e => handleChange(idx, 'specification', e.target.value)}
                        placeholder="e.g. 600-630Wp N-Topcon..."
                        className="w-full px-2.5 py-1.5 text-xs font-mono text-slate-800 bg-white border border-slate-300 rounded-lg focus:border-slate-900 outline-hidden"
                      />
                    </td>
                    <td className="py-2 px-3 text-center">
                      <input
                        type="text"
                        value={item.unit || 'Nos'}
                        onChange={e => handleChange(idx, 'unit', e.target.value)}
                        placeholder="KWp, Sets, Mtrs..."
                        className="w-full px-2 py-1.5 text-xs text-center font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg focus:border-slate-900 outline-hidden"
                        required
                      />
                    </td>
                    <td className="py-2 px-3 text-center">
                      <input
                        type="number"
                        step="any"
                        min="0.01"
                        value={item.quantity !== undefined ? item.quantity : 1}
                        onChange={e => handleChange(idx, 'quantity', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 text-xs text-center font-mono font-black text-black bg-white border border-slate-300 rounded-lg focus:border-slate-900 outline-hidden"
                        required
                      />
                    </td>
                    <td className="py-2 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleDeleteRow(idx)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete line item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={handleAddRow}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer border border-slate-300 shadow-2xs"
            >
              <Plus className="w-4 h-4 text-slate-700" />
              <span>Add Line Item</span>
            </button>
            <span className="text-xs text-slate-500 font-medium font-mono">
              Total Items: {items.length}
            </span>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-slate-900 hover:bg-black text-white font-bold rounded-xl text-xs transition-all flex items-center gap-2 cursor-pointer shadow-sm"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{saving ? 'Saving Changes...' : 'Save BOM Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


// =========================================================================
// 2. EDIT SYSTEM CAPACITY & SUBSIDY DETAILS MODAL
// =========================================================================
interface EditCapacitySubsidyModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotationNumber: string;
  initialCapacityKw: number;
  initialDomesticPrice: number;
  initialSubsidyAmount: number;
  onSave: (data: { systemCapacityKw: number; totalAmount: number; subsidyAmount: number }) => Promise<boolean>;
}

export const EditCapacitySubsidyModal: React.FC<EditCapacitySubsidyModalProps> = ({
  isOpen,
  onClose,
  quotationNumber,
  initialCapacityKw,
  initialDomesticPrice,
  initialSubsidyAmount,
  onSave,
}) => {
  const [capacity, setCapacity] = useState<number>(initialCapacityKw || 5);
  const [price, setPrice] = useState<number>(initialDomesticPrice || 0);
  const [subsidy, setSubsidy] = useState<number>(initialSubsidyAmount || 0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCapacity(initialCapacityKw || 5);
      setPrice(initialDomesticPrice || 0);
      setSubsidy(
        initialSubsidyAmount !== undefined && initialSubsidyAmount !== null 
          ? initialSubsidyAmount 
          : (initialCapacityKw >= 3 ? 100000 : initialCapacityKw === 2 ? 70000 : initialCapacityKw * 35000)
      );
      setError(null);
    }
  }, [isOpen, initialCapacityKw, initialDomesticPrice, initialSubsidyAmount]);

  if (!isOpen) return null;

  const netCustomerCost = Math.max(0, price - subsidy);
  const advance90 = Math.round(price * 0.9);
  const commissioning10 = Math.max(0, price - advance90);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (capacity <= 0 || isNaN(capacity)) {
      setError('System capacity must be greater than 0 kW.');
      return;
    }
    if (price <= 0 || isNaN(price)) {
      setError('Domestic price must be a valid amount.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const ok = await onSave({
        systemCapacityKw: Number(capacity),
        totalAmount: Number(price),
        subsidyAmount: Number(subsidy) || 0,
      });
      if (ok) {
        onClose();
      } else {
        setError('Failed to update system capacity and subsidy details.');
      }
    } catch (err: any) {
      setError(err?.message || 'Error saving details.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-300 shadow-2xl max-w-xl w-full my-auto flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95">
        
        {/* Header */}
        <div className="bg-slate-900 px-5 py-4 border-b border-slate-800 flex items-center justify-between text-white">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-slate-800 text-emerald-400 rounded-lg">
              <Calculator className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-sm sm:text-base font-black tracking-tight text-white flex items-center gap-2">
                Edit System Capacity &amp; Subsidy Details
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Quotation: {quotationNumber}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                System Capacity (kW On-Grid) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.1"
                value={capacity}
                onChange={e => setCapacity(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm font-black font-mono text-black bg-white border border-slate-300 rounded-xl focus:border-slate-900 outline-hidden"
                required
              />
              <span className="text-[11px] text-slate-500">
                Determines plant sizing, panel counts, and energy yield estimates.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Domestic Price (Including GST) (₹) *
              </label>
              <input
                type="number"
                step="1"
                min="1000"
                value={price}
                onChange={e => setPrice(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm font-black font-mono text-black bg-white border border-slate-300 rounded-xl focus:border-slate-900 outline-hidden"
                required
              />
              <span className="text-[11px] text-slate-500">
                Official gross contract amount inclusive of all statutory taxes.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center justify-between">
                <span>Govt Subsidy Support (₹ DBT Subsidy)</span>
                <button
                  type="button"
                  onClick={() => setSubsidy(capacity >= 3 ? 100000 : capacity === 2 ? 70000 : capacity * 35000)}
                  className="text-[11px] text-emerald-700 font-bold hover:underline cursor-pointer"
                >
                  Apply TN State + Central DBT Slabs (G.O. 102)
                </button>
              </label>
              <input
                type="number"
                step="500"
                min="0"
                value={subsidy}
                onChange={e => setSubsidy(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm font-black font-mono text-emerald-700 bg-white border border-slate-300 rounded-xl focus:border-slate-900 outline-hidden"
              />
              <span className="text-[11px] text-slate-500">
                Direct Benefit Transfer credited directly to customer account. Enter 0 if commercial/ineligible.
              </span>
            </div>
          </div>

          {/* Live Calculated Preview Card */}
          <div className="mt-4 p-4 bg-slate-50 border border-slate-300 rounded-xl space-y-2.5">
            <h4 className="text-[11px] font-black text-slate-700 uppercase tracking-wider">
              Live Commercial Calculation Preview
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                <span className="text-[10px] text-slate-500 font-semibold block">Net Customer Cost</span>
                <span className="text-sm font-black text-emerald-800 font-mono">
                  ₹{Math.round(netCustomerCost).toLocaleString('en-IN')}/-
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Effective Investment</span>
              </div>
              <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                <span className="text-[10px] text-slate-500 font-semibold block">90% Advance Milestone</span>
                <span className="text-sm font-black text-slate-900 font-mono">
                  ₹{Math.round(advance90).toLocaleString('en-IN')}/-
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Booking / Mobilization</span>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-slate-900 hover:bg-black text-white font-bold rounded-xl text-xs transition-all flex items-center gap-2 cursor-pointer shadow-sm"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{saving ? 'Saving Details...' : 'Save Capacity & Subsidy'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


// =========================================================================
// 3. EDIT STATUTORY GST & MATERIAL COST BREAKDOWN MODAL ("CALCULATION")
// =========================================================================
interface EditCalculationModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotationNumber: string;
  initialItems: any[];
  onSave: (data: {
    items: any[];
    totalAmount: number;
    taxableAmount: number;
    gstAmount: number;
    cgstAmount: number;
    sgstAmount: number;
    subtotal: number;
  }) => Promise<boolean>;
}

export const EditCalculationModal: React.FC<EditCalculationModalProps> = ({
  isOpen,
  onClose,
  quotationNumber,
  initialItems,
  onSave,
}) => {
  const [items, setItems] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const cloned = (initialItems || []).map((it, idx) => {
        const qty = Number(it.quantity) || 1;
        const rate = it.unitPrice !== undefined ? Number(it.unitPrice) : (it.totalPrice ? Math.round(Number(it.totalPrice) / qty) : 0);
        const gstRate = it.gstRate !== undefined ? Number(it.gstRate) : 18;
        return {
          id: it.id || `ITEM-${idx + 1}`,
          category: it.category || it.description || '',
          description: it.description || it.category || '',
          specification: it.specification || it.makeModel || '',
          hsnSacCode: it.hsnSacCode || (gstRate === 5 ? '8541' : '8544'),
          quantity: qty,
          unit: it.unit || 'Nos',
          unitPrice: rate,
          gstRate: gstRate,
        };
      });
      setItems(cloned.length > 0 ? cloned : [
        { id: 'ITEM-1', category: 'Solar Modules', description: 'Solar Modules', specification: '550W Mono PERC', hsnSacCode: '8541', quantity: 5, unit: 'KWp', unitPrice: 28000, gstRate: 5 }
      ]);
      setError(null);
    }
  }, [isOpen, initialItems]);

  // Real-time authoritative calculation across line items
  const calculations = useMemo(() => {
    let sumTaxable = 0;
    let sumCgst = 0;
    let sumSgst = 0;

    const computedItems = items.map((it) => {
      const qty = Number(it.quantity) || 0;
      const unitRate = Number(it.unitPrice) || 0;
      const taxable = Math.round(qty * unitRate);
      const gstPercent = Number(it.gstRate) || 0;
      const cgst = Math.round(taxable * (gstPercent / 200));
      const sgst = Math.round(taxable * (gstPercent / 200));
      const total = taxable + cgst + sgst;

      sumTaxable += taxable;
      sumCgst += cgst;
      sumSgst += sgst;

      return {
        ...it,
        taxableAmount: taxable,
        taxAmount: cgst + sgst,
        cgstAmount: cgst,
        sgstAmount: sgst,
        totalPrice: total,
      };
    });

    const sumGst = sumCgst + sumSgst;
    const finalContractTotal = sumTaxable + sumGst;
    const advance90 = Math.round(finalContractTotal * 0.90);
    const balance10 = Math.max(0, finalContractTotal - advance90);

    return {
      computedItems,
      sumTaxable,
      sumCgst,
      sumSgst,
      sumGst,
      finalContractTotal,
      advance90,
      balance10,
    };
  }, [items]);

  if (!isOpen) return null;

  const handleChange = (index: number, field: string, value: any) => {
    setItems(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      if (field === 'description') {
        copy[index].category = value;
      }
      return copy;
    });
  };

  const handleAddRow = () => {
    setItems(prev => [
      ...prev,
      {
        id: `ITEM-NEW-${Date.now()}`,
        category: '',
        description: '',
        specification: '',
        hsnSacCode: '7308',
        quantity: 1,
        unit: 'Nos',
        unitPrice: 0,
        gstRate: 18,
      }
    ]);
  };

  const handleDeleteRow = (index: number) => {
    if (items.length <= 1) {
      setError('At least one calculation item is required.');
      return;
    }
    setError(null);
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    for (let i = 0; i < items.length; i++) {
      if (!items[i].description?.trim() && !items[i].category?.trim()) {
        setError(`Row #${i + 1} material description cannot be empty.`);
        return;
      }
      if (Number(items[i].quantity) <= 0 || isNaN(Number(items[i].quantity))) {
        setError(`Row #${i + 1} quantity must be a valid positive number.`);
        return;
      }
      if (Number(items[i].unitPrice) < 0 || isNaN(Number(items[i].unitPrice))) {
        setError(`Row #${i + 1} unit rate cannot be negative.`);
        return;
      }
    }

    setSaving(true);
    setError(null);
    try {
      const ok = await onSave({
        items: calculations.computedItems,
        totalAmount: calculations.finalContractTotal,
        taxableAmount: calculations.sumTaxable,
        gstAmount: calculations.sumGst,
        cgstAmount: calculations.sumCgst,
        sgstAmount: calculations.sumSgst,
        subtotal: calculations.sumTaxable,
      });
      if (ok) {
        onClose();
      } else {
        setError('Failed to update calculation. Please try again.');
      }
    } catch (err: any) {
      setError(err?.message || 'Error saving calculation.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-300 shadow-2xl max-w-5xl w-full my-auto flex flex-col max-h-[95vh] overflow-hidden animate-in zoom-in-95">
        
        {/* Header */}
        <div className="bg-slate-900 px-5 py-4 border-b border-slate-800 flex items-center justify-between text-white">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-slate-800 text-emerald-400 rounded-lg">
              <Calculator className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-sm sm:text-base font-black tracking-tight text-white flex items-center gap-2">
                Edit Statutory GST &amp; Material Cost Breakdown
                <span className="text-xs px-2 py-0.5 rounded font-mono bg-slate-800 text-emerald-400 border border-slate-700">
                  {quotationNumber}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Adjust quantities, unit rates, and statutory GST rates. Taxable base, CGST, SGST, and contract totals recalculate live.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto border border-slate-300 rounded-xl shadow-2xs">
            <table className="w-full min-w-[850px] text-left text-xs">
              <thead className="bg-slate-900 text-white font-black text-[9px] uppercase border-b border-slate-300">
                <tr>
                  <th className="py-2.5 px-2 text-center w-8">Sl.</th>
                  <th className="py-2.5 px-2 w-20">HSN/SAC</th>
                  <th className="py-2.5 px-2.5 min-w-[200px]">Material Description &amp; Spec *</th>
                  <th className="py-2.5 px-2 text-center w-24">Qty &amp; Unit *</th>
                  <th className="py-2.5 px-2 text-right w-24">Unit Rate (₹) *</th>
                  <th className="py-2.5 px-2 text-right w-24">Taxable Base (₹)</th>
                  <th className="py-2.5 px-2 text-center w-20">GST %</th>
                  <th className="py-2.5 px-2 text-right w-20">CGST (₹)</th>
                  <th className="py-2.5 px-2 text-right w-20">SGST (₹)</th>
                  <th className="py-2.5 px-2.5 text-right w-24 font-black">Total (₹)</th>
                  <th className="py-2.5 px-1.5 text-center w-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {calculations.computedItems.map((item, idx) => (
                  <tr key={item.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="py-2 px-2 text-center font-mono font-bold text-slate-500">
                      {idx + 1}
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="text"
                        value={item.hsnSacCode || ''}
                        onChange={e => handleChange(idx, 'hsnSacCode', e.target.value)}
                        placeholder="8541"
                        className="w-full px-1.5 py-1 text-[11px] font-mono text-slate-700 bg-white border border-slate-300 rounded-md focus:border-slate-900 outline-hidden"
                      />
                    </td>
                    <td className="py-2 px-2.5 space-y-1">
                      <input
                        type="text"
                        value={item.description || item.category || ''}
                        onChange={e => handleChange(idx, 'description', e.target.value)}
                        placeholder="Material name..."
                        className="w-full px-2 py-1 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-md focus:border-slate-900 outline-hidden"
                        required
                      />
                      <input
                        type="text"
                        value={item.specification || ''}
                        onChange={e => handleChange(idx, 'specification', e.target.value)}
                        placeholder="Technical specification..."
                        className="w-full px-2 py-0.5 text-[10px] font-mono text-slate-600 bg-white border border-slate-200 rounded-md focus:border-slate-900 outline-hidden"
                      />
                    </td>
                    <td className="py-2 px-2 text-center">
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="any"
                          min="0.01"
                          value={item.quantity !== undefined ? item.quantity : 1}
                          onChange={e => handleChange(idx, 'quantity', parseFloat(e.target.value) || 0)}
                          className="w-14 px-1 py-1 text-xs text-center font-mono font-bold text-black bg-white border border-slate-300 rounded-md focus:border-slate-900 outline-hidden"
                          required
                        />
                        <input
                          type="text"
                          value={item.unit || 'Nos'}
                          onChange={e => handleChange(idx, 'unit', e.target.value)}
                          className="w-10 px-1 py-1 text-[10px] text-center font-medium text-slate-700 bg-white border border-slate-300 rounded-md focus:border-slate-900 outline-hidden"
                        />
                      </div>
                    </td>
                    <td className="py-2 px-2 text-right">
                      <input
                        type="number"
                        step="1"
                        min="0"
                        value={item.unitPrice !== undefined ? item.unitPrice : 0}
                        onChange={e => handleChange(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                        className="w-full px-1.5 py-1 text-xs text-right font-mono font-bold text-black bg-white border border-slate-300 rounded-md focus:border-slate-900 outline-hidden"
                        required
                      />
                    </td>
                    <td className="py-2 px-2 text-right font-mono font-bold text-slate-900">
                      ₹{item.taxableAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-2 px-2 text-center">
                      <select
                        value={item.gstRate !== undefined ? item.gstRate : 18}
                        onChange={e => handleChange(idx, 'gstRate', parseInt(e.target.value) || 18)}
                        className={`px-1.5 py-1 text-xs font-bold rounded-md border border-slate-300 outline-hidden cursor-pointer ${
                          item.gstRate === 5 ? 'bg-amber-50 text-amber-900 font-black' : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        <option value={5}>5%</option>
                        <option value={18}>18%</option>
                        <option value={0}>0%</option>
                        <option value={12}>12%</option>
                        <option value={28}>28%</option>
                      </select>
                    </td>
                    <td className="py-2 px-2 text-right font-mono text-slate-700">
                      ₹{item.cgstAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-2 px-2 text-right font-mono text-slate-700">
                      ₹{item.sgstAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-2 px-2.5 text-right font-mono font-black text-slate-900">
                      ₹{item.totalPrice.toLocaleString('en-IN')}
                    </td>
                    <td className="py-2 px-1.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleDeleteRow(idx)}
                        className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                        title="Delete line"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={handleAddRow}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer border border-slate-300 shadow-2xs"
            >
              <Plus className="w-4 h-4 text-slate-700" />
              <span>Add Custom Item</span>
            </button>
            <span className="text-xs text-slate-500 font-mono">
              Total Lines: {items.length}
            </span>
          </div>

          {/* Tax Audit Summary (matches statutory preview perfectly) */}
          <div className="p-4 bg-slate-50 border border-slate-300 rounded-xl flex flex-col md:flex-row justify-between gap-6 pt-4">
            <div className="space-y-2 text-xs flex-1">
              <div className="font-bold text-slate-800">Verified Payment Milestones (Recalculated Live):</div>
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                <div className="flex justify-between font-bold text-emerald-900">
                  <span>90% Advance Mobilization:</span>
                  <span className="font-mono">₹{calculations.advance90.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-600 text-[11px]">
                  <span>10% on Commissioning &amp; Net-Metering:</span>
                  <span className="font-mono">₹{calculations.balance10.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            <div className="w-full md:w-80 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Taxable Base Value:</span>
                <span className="font-mono font-semibold text-slate-900">₹{calculations.sumTaxable.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Central GST (CGST):</span>
                <span className="font-mono font-semibold text-slate-900">₹{calculations.sumCgst.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>State GST (SGST):</span>
                <span className="font-mono font-semibold text-slate-900">₹{calculations.sumSgst.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-800 font-bold border-t border-slate-200 pt-1">
                <span>Total GST Amount:</span>
                <span className="font-mono text-slate-900">₹{calculations.sumGst.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between bg-slate-900 text-white p-3 rounded-xl font-bold text-sm shadow-xs">
                <span>FINAL PAYABLE AMOUNT:</span>
                <span className="font-mono text-emerald-400">₹{calculations.finalContractTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-2 cursor-pointer shadow-sm"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{saving ? 'Saving Calculation...' : 'Save & Apply Calculation'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

