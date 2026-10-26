import React, { useState } from 'react';
import { useCrm } from '../../context/CrmContext';
import { InventoryProduct } from '../../types';
import { 
  BarChart3, AlertTriangle, CheckCircle2, Search, Filter, 
  Warehouse, ArrowUpRight, ShoppingCart, RefreshCw, Layers, Plus, X
} from 'lucide-react';

interface StockLevelsViewProps {
  onNavigateToPo?: () => void;
}

export const StockLevelsView: React.FC<StockLevelsViewProps> = ({ onNavigateToPo }) => {
  const { products, createPurchaseOrder, addProduct, suppliers } = useCrm();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [healthFilter, setHealthFilter] = useState<'all' | 'critical' | 'warning' | 'healthy'>('all');
  const [quickOrderSuccessSku, setQuickOrderSuccessSku] = useState<string | null>(null);

  // New Inventory Product Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [prodName, setProdName] = useState('');
  const [prodSku, setProdSku] = useState('');
  const [prodCategory, setProdCategory] = useState<InventoryProduct['category']>('Solar Panels');
  const [prodBrand, setProdBrand] = useState('Waaree');
  const [prodSupplier, setProdSupplier] = useState(suppliers[0]?.name || 'Waaree Energies Ltd');
  const [prodStock, setProdStock] = useState(100);
  const [prodMinThreshold, setProdMinThreshold] = useState(25);
  const [prodUnit, setProdUnit] = useState('Nos');
  const [prodUnitCost, setProdUnitCost] = useState(8500);
  const [prodSpecs, setProdSpecs] = useState('');

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim()) return;

    const autoSku = prodSku.trim() || `SKU-${prodCategory.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`;

    addProduct({
      name: prodName.trim(),
      sku: autoSku,
      category: prodCategory,
      brand: prodBrand.trim() || 'Tier-1 Solar',
      supplierName: prodSupplier,
      currentStock: Number(prodStock),
      reservedStock: 0,
      availableStock: Number(prodStock),
      minThreshold: Number(prodMinThreshold),
      unit: prodUnit,
      unitCost: Number(prodUnitCost),
      specifications: prodSpecs.trim(),
    });

    setProdName('');
    setProdSku('');
    setProdSpecs('');
    setShowAddModal(false);
  };

  const getStockHealth = (p: InventoryProduct): 'critical' | 'warning' | 'healthy' => {
    if (p.availableStock <= 0) return 'critical';
    if (p.availableStock <= p.minThreshold) return 'warning';
    return 'healthy';
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
    const health = getStockHealth(p);
    const matchesHealth = healthFilter === 'all' || health === healthFilter;

    return matchesSearch && matchesCategory && matchesHealth;
  });

  const totalSKUs = products.length;
  const criticalCount = products.filter(p => getStockHealth(p) === 'critical').length;
  const warningCount = products.filter(p => getStockHealth(p) === 'warning').length;
  const healthyCount = products.filter(p => getStockHealth(p) === 'healthy').length;

  const handleQuickRestock = (product: InventoryProduct) => {
    const reorderQty = Math.max(product.minThreshold * 2, 20);
    const subtotal = reorderQty * product.unitCost;
    const taxAmount = Math.round(subtotal * 0.12);

    createPurchaseOrder({
      supplierName: product.supplierName,
      items: [
        {
          sku: product.sku,
          name: product.name,
          category: product.category,
          quantity: reorderQty,
          unit: product.unit,
          unitPrice: product.unitCost,
          totalAmount: subtotal,
        },
      ],
      subtotal,
      taxAmount,
      grandTotal: subtotal + taxAmount,
      status: 'Issued',
      deliveryWarehouse: 'Central Bengaluru Hub',
      notes: `Automated reorder triggered due to stock buffer warning for ${product.sku}.`,
    });

    setQuickOrderSuccessSku(product.sku);
    setTimeout(() => setQuickOrderSuccessSku(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
              <BarChart3 className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Warehouse Stock Levels &amp; Safety Buffers</h1>
              <p className="text-xs text-slate-500">Live inventory reservation, stockout prevention, and automated reorder buffers</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <span>+ Add Inventory Item</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Total Cataloged SKUs</span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{totalSKUs}</div>
          <div className="mt-1 text-[11px] text-slate-400">Solar modules, inverters, cables & structures</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Healthy Stock Buffers</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600">{healthyCount}</div>
          <div className="mt-1 text-[11px] text-emerald-700 font-medium">Sufficient for scheduled installations</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Buffer Warnings</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-600">{warningCount}</div>
          <div className="mt-1 text-[11px] text-amber-700 font-medium">Below safety threshold</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Stockouts / Critical</span>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-red-600">{criticalCount}</div>
          <div className="mt-1 text-[11px] text-red-700 font-medium">0 free units available</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by SKU, item name, or manufacturer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-700 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Product Categories</option>
              <option value="Solar Panels">Solar Panels</option>
              <option value="Inverters">Inverters</option>
              <option value="Mounting Structures">Mounting Structures</option>
              <option value="DC/AC Cables">DC/AC Cables</option>
              <option value="Protection BOS">Protection BOS</option>
              <option value="Earthing & Lightning">Earthing & Lightning</option>
            </select>

            <div className="flex items-center border border-slate-300 rounded-lg p-0.5 bg-slate-50 text-xs">
              <button
                onClick={() => setHealthFilter('all')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${healthFilter === 'all' ? 'bg-white shadow-xs text-slate-900 font-semibold' : 'text-slate-600'}`}
              >
                All
              </button>
              <button
                onClick={() => setHealthFilter('critical')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${healthFilter === 'critical' ? 'bg-white shadow-xs text-red-700 font-semibold' : 'text-slate-600'}`}
              >
                Critical
              </button>
              <button
                onClick={() => setHealthFilter('warning')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${healthFilter === 'warning' ? 'bg-white shadow-xs text-amber-700 font-semibold' : 'text-slate-600'}`}
              >
                Low Buffer
              </button>
              <button
                onClick={() => setHealthFilter('healthy')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${healthFilter === 'healthy' ? 'bg-white shadow-xs text-emerald-700 font-semibold' : 'text-slate-600'}`}
              >
                Healthy
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stock Levels Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase text-[11px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Solar Equipment / SKU</th>
                <th className="py-3.5 px-4">Category & Brand</th>
                <th className="py-3.5 px-4 text-center">Current Total</th>
                <th className="py-3.5 px-4 text-center">Reserved for EPC</th>
                <th className="py-3.5 px-4 text-center">Free Available</th>
                <th className="py-3.5 px-4 text-center">Safety Threshold</th>
                <th className="py-3.5 px-4 text-center">Buffer Status</th>
                <th className="py-3.5 px-4 text-right">Quick Restock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <BarChart3 className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-medium text-slate-600">No inventory products match criteria</p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map(prod => {
                  const health = getStockHealth(prod);
                  const isOrdered = quickOrderSuccessSku === prod.sku;

                  return (
                    <tr key={prod.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{prod.name}</div>
                        <div className="text-[11px] font-mono text-slate-400 mt-0.5">{prod.sku}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">{prod.brand}</div>
                        <div className="text-[11px] text-emerald-700">{prod.category}</div>
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-900 text-sm">
                        {prod.currentStock} <span className="text-[10px] font-normal text-slate-500">{prod.unit}</span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-semibold text-amber-600 text-sm">
                        {prod.reservedStock} <span className="text-[10px] font-normal text-slate-500">{prod.unit}</span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-sm">
                        <span className={health === 'critical' ? 'text-red-600' : health === 'warning' ? 'text-amber-600' : 'text-emerald-600'}>
                          {prod.availableStock} <span className="text-[10px] font-normal text-slate-500">{prod.unit}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-medium text-slate-600">
                        {prod.minThreshold} {prod.unit}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                          health === 'healthy' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          health === 'warning' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          'bg-red-50 text-red-700 border-red-200'
                        }`}>
                          {health === 'healthy' ? 'Adequate' : health === 'warning' ? 'Low Stock' : 'Critical'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {isOrdered ? (
                          <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 justify-end">
                            <CheckCircle2 className="w-3.5 h-3.5" /> PO Issued!
                          </span>
                        ) : (
                          <button
                            onClick={() => handleQuickRestock(prod)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200"
                            title={`Issue PO to ${prod.supplierName}`}
                          >
                            <ShoppingCart className="w-3 h-3" />
                            <span>Restock</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Inventory Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between p-4 bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-bold text-sm">Add New Inventory Product / Equipment</h3>
                  <p className="text-[10px] text-slate-400">Register new equipment SKU into warehouse catalog</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="p-5 space-y-4 text-xs max-h-[85vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Equipment / Item Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Adani 545W Mono PERC Bifacial Solar PV Modules"
                  value={prodName}
                  onChange={e => setProdName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={prodCategory}
                    onChange={e => setProdCategory(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold text-xs bg-white"
                  >
                    <option value="Solar Panels">Solar Panels</option>
                    <option value="Inverters">Inverters</option>
                    <option value="Mounting Structures">Mounting Structures</option>
                    <option value="DC/AC Cables">DC/AC Cables</option>
                    <option value="Protection BOS">Protection BOS</option>
                    <option value="Earthing & Lightning">Earthing &amp; Lightning</option>
                    <option value="Accessories">Accessories</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">SKU / Code (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. MOD-ADANI-545"
                    value={prodSku}
                    onChange={e => setProdSku(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Brand / Make</label>
                  <input
                    type="text"
                    placeholder="e.g. Adani Solar"
                    value={prodBrand}
                    onChange={e => setProdBrand(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Supplier</label>
                  <select
                    value={prodSupplier}
                    onChange={e => setProdSupplier(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold text-xs bg-white"
                  >
                    {suppliers.map(s => (
                      <option key={s.id} value={s.name}>{s.name} ({s.category})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Current Stock *</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={prodStock}
                    onChange={e => setProdStock(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Buffer Threshold</label>
                  <input
                    type="number"
                    min={1}
                    value={prodMinThreshold}
                    onChange={e => setProdMinThreshold(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Unit</label>
                  <select
                    value={prodUnit}
                    onChange={e => setProdUnit(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold text-xs bg-white"
                  >
                    <option value="Nos">Nos</option>
                    <option value="Units">Units</option>
                    <option value="Meters">Meters</option>
                    <option value="Sets">Sets</option>
                    <option value="Pairs">Pairs</option>
                    <option value="Rolls">Rolls</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Unit Purchase Cost (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={prodUnitCost}
                    onChange={e => setProdUnitCost(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Technical Specs</label>
                  <input
                    type="text"
                    placeholder="e.g. 545W Mono PERC 144 Cells"
                    value={prodSpecs}
                    onChange={e => setProdSpecs(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Save &amp; Catalog Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
