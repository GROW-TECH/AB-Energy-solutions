import React, { useState } from 'react';
import { useCrm } from '../../context/CrmContext';
import { MaterialAllocation } from '../../types';
import { 
  Layers, Package, Truck, CheckCircle2, Clock, AlertTriangle, 
  Search, Filter, ArrowRight, Warehouse, Check, MapPin, Plus, X
} from 'lucide-react';

export const MaterialsPlanningView: React.FC = () => {
  const { materialAllocations, updateMaterialAllocationStatus, addMaterialAllocation, projects, products } = useCrm();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Add BOM Indent Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [targetProjectId, setTargetProjectId] = useState(projects[0]?.id || 'PROJECT-2026-001');
  const [selectedProductSku, setSelectedProductSku] = useState(products[0]?.sku || '');
  const [customItemName, setCustomItemName] = useState('');
  const [customCategory, setCustomCategory] = useState('Solar Panels');
  const [customQuantity, setCustomQuantity] = useState(20);
  const [customUnit, setCustomUnit] = useState('Nos');
  const [customWarehouse, setCustomWarehouse] = useState('Central Bengaluru Hub (Aisle A-01)');
  const [customStatus, setCustomStatus] = useState<MaterialAllocation['status']>('Indented');

  const handleCreateAllocation = (e: React.FormEvent) => {
    e.preventDefault();
    const matchedProject = projects.find(p => p.id === targetProjectId);
    const matchedProduct = products.find(p => p.sku === selectedProductSku);

    const productName = customItemName.trim() || matchedProduct?.name || 'Solar PV Equipment';
    const sku = matchedProduct?.sku || `SKU-${Date.now().toString().slice(-4)}`;
    const category = matchedProduct?.category || customCategory;
    const unit = matchedProduct?.unit || customUnit;

    addMaterialAllocation({
      projectId: targetProjectId,
      projectName: matchedProject?.customerName || 'Solar Project',
      sku,
      productName,
      category,
      requiredQuantity: Number(customQuantity),
      allocatedQuantity: Number(customQuantity),
      unit,
      status: customStatus,
      warehouseLocation: customWarehouse,
    });

    setCustomItemName('');
    setShowAddModal(false);
  };

  const filteredAllocations = materialAllocations.filter(item => {
    const matchesSearch = item.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProject = selectedProjectId === 'all' || item.projectId === selectedProjectId;
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;

    return matchesSearch && matchesProject && matchesCategory && matchesStatus;
  });

  const totalItems = materialAllocations.length;
  const receivedOnSiteCount = materialAllocations.filter(m => m.status === 'Received on Site').length;
  const inTransitCount = materialAllocations.filter(m => m.status === 'Dispatched').length;
  const pendingCount = materialAllocations.filter(m => m.status === 'Planning' || m.status === 'Indented' || m.status === 'Allocated').length;

  const getStatusBadge = (status: MaterialAllocation['status']) => {
    switch (status) {
      case 'Received on Site':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Dispatched':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Allocated':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Indented':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Planning':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
              <Layers className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Project BOM &amp; Materials Planning</h1>
              <p className="text-xs text-slate-500">Bill of Materials indentation, warehouse reservation &amp; site dispatches</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <span>+ Add BOM Indent</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Total BOM Allocations</span>
            <Package className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{totalItems}</div>
          <div className="mt-1 text-[11px] text-slate-400">Across active solar installations</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Delivered to Site</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600">{receivedOnSiteCount}</div>
          <div className="mt-1 text-[11px] text-emerald-700 font-medium">
            {totalItems > 0 ? Math.round((receivedOnSiteCount / totalItems) * 100) : 0}% site fulfillment
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>In-Transit / Dispatched</span>
            <Truck className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-blue-600">{inTransitCount}</div>
          <div className="mt-1 text-[11px] text-slate-400">En route to installation rooftops</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Pending Staging</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-600">{pendingCount}</div>
          <div className="mt-1 text-[11px] text-slate-400">Allocated in Central Warehouse</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by equipment, SKU, or project name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-700 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Solar Projects</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>
                  {p.id} - {p.customerName}
                </option>
              ))}
            </select>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-700 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Categories</option>
              <option value="Solar Panels">Solar Panels</option>
              <option value="Inverters">Inverters</option>
              <option value="Mounting Structures">Mounting Structures</option>
              <option value="DC/AC Cables">DC/AC Cables</option>
              <option value="Earthing & Lightning">Earthing & Lightning</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-700 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Delivery Statuses</option>
              <option value="Planning">Planning</option>
              <option value="Indented">Indented</option>
              <option value="Allocated">Allocated</option>
              <option value="Dispatched">Dispatched</option>
              <option value="Received on Site">Received on Site</option>
            </select>
          </div>
        </div>
      </div>

      {/* Materials List: Mobile Cards (< lg) & Desktop Table (>= lg) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Mobile Cards (< lg) */}
        <div className="lg:hidden divide-y divide-slate-100">
          {filteredAllocations.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <Layers className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="font-medium text-slate-600 text-xs">No BOM materials match the filter</p>
            </div>
          ) : (
            filteredAllocations.map(item => (
              <div key={item.id} className="p-4 hover:bg-slate-50 transition-colors space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm truncate">{item.productName}</h4>
                    <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                      <span>{item.sku}</span>
                      <span>&bull;</span>
                      <span className="text-emerald-700 font-semibold">{item.category}</span>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${getStatusBadge(item.status)}`}>
                    {item.status}
                  </span>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-xl text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Project</span>
                    <span className="font-semibold text-slate-800 text-[11px] truncate max-w-[200px]" title={item.projectName}>
                      {item.projectName} ({item.projectId})
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Allocated / Req</span>
                    <span className="font-mono font-bold text-slate-900 text-xs">
                      {item.allocatedQuantity} <span className="text-[10px] text-slate-500 font-normal">{item.unit}</span>
                      <span className="text-[10px] text-slate-400 font-normal ml-1">/ Req: {item.requiredQuantity}</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Warehouse</span>
                    <div className="flex items-center gap-1 text-slate-700">
                      <Warehouse className="w-3 h-3 text-slate-400" />
                      <span className="font-medium text-[11px]">{item.warehouseLocation}</span>
                    </div>
                  </div>
                  {item.dispatchDate && (
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Dispatched</span>
                      <span className="text-[10px] text-slate-500">{item.dispatchDate}</span>
                    </div>
                  )}
                </div>

                <div className="pt-1">
                  {item.status === 'Planning' && (
                    <button
                      onClick={() => updateMaterialAllocationStatus(item.id, 'Indented')}
                      className="w-full py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 cursor-pointer text-center"
                    >
                      Submit Indent
                    </button>
                  )}
                  {item.status === 'Indented' && (
                    <button
                      onClick={() => updateMaterialAllocationStatus(item.id, 'Allocated')}
                      className="w-full py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 cursor-pointer text-center"
                    >
                      Allocate Stock
                    </button>
                  )}
                  {item.status === 'Allocated' && (
                    <button
                      onClick={() => updateMaterialAllocationStatus(item.id, 'Dispatched')}
                      className="w-full py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 cursor-pointer text-center"
                    >
                      Dispatch to Site
                    </button>
                  )}
                  {item.status === 'Dispatched' && (
                    <button
                      onClick={() => updateMaterialAllocationStatus(item.id, 'Received on Site')}
                      className="w-full py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Confirm Delivery</span>
                    </button>
                  )}
                  {item.status === 'Received on Site' && (
                    <span className="text-[11px] font-medium text-emerald-600 flex items-center gap-1 justify-center py-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Ready for Installation
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop Table (>= lg) */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase text-[11px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">BOM Item / Specification</th>
                <th className="py-3.5 px-4">Associated Project</th>
                <th className="py-3.5 px-4">Quantity</th>
                <th className="py-3.5 px-4">Warehouse Location</th>
                <th className="py-3.5 px-4">Delivery Status</th>
                <th className="py-3.5 px-4 text-right">Workflow Transition</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredAllocations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Layers className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-medium text-slate-600">No BOM materials match the filter</p>
                  </td>
                </tr>
              ) : (
                filteredAllocations.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{item.productName}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span className="font-mono">{item.sku}</span>
                        <span>•</span>
                        <span className="text-emerald-700 font-medium">{item.category}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">{item.projectName}</div>
                      <div className="text-[11px] text-slate-400">{item.projectId}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 text-sm">
                        {item.allocatedQuantity} <span className="text-xs font-normal text-slate-500">{item.unit}</span>
                      </div>
                      <div className="text-[10px] text-slate-400">Req: {item.requiredQuantity} {item.unit}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Warehouse className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-medium">{item.warehouseLocation}</span>
                      </div>
                      {item.dispatchDate && (
                        <div className="text-[10px] text-slate-400 mt-0.5">Dispatched: {item.dispatchDate}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${getStatusBadge(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {item.status === 'Planning' && (
                        <button
                          onClick={() => updateMaterialAllocationStatus(item.id, 'Indented')}
                          className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200"
                        >
                          Submit Indent
                        </button>
                      )}
                      {item.status === 'Indented' && (
                        <button
                          onClick={() => updateMaterialAllocationStatus(item.id, 'Allocated')}
                          className="px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded border border-indigo-200"
                        >
                          Allocate Stock
                        </button>
                      )}
                      {item.status === 'Allocated' && (
                        <button
                          onClick={() => updateMaterialAllocationStatus(item.id, 'Dispatched')}
                          className="px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200"
                        >
                          Dispatch to Site
                        </button>
                      )}
                      {item.status === 'Dispatched' && (
                        <button
                          onClick={() => updateMaterialAllocationStatus(item.id, 'Received on Site')}
                          className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200 flex items-center gap-1 ml-auto"
                        >
                          <Check className="w-3 h-3" />
                          <span>Confirm Delivery</span>
                        </button>
                      )}
                      {item.status === 'Received on Site' && (
                        <span className="text-[11px] font-medium text-emerald-600 flex items-center gap-1 justify-end">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Ready for Install
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add BOM Indent Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between p-4 bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-bold text-sm">Add Project BOM Indent / Material Allocation</h3>
                  <p className="text-[10px] text-slate-400">Allocate equipment &amp; staged materials to solar installation site</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAllocation} className="p-5 space-y-4 text-xs max-h-[85vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Associated Solar Project *</label>
                <select
                  value={targetProjectId}
                  onChange={e => setTargetProjectId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold text-xs bg-white focus:ring-2 focus:ring-emerald-500"
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.id}: {p.customerName} ({p.capacityKw} kW - {p.stage})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Cataloged Equipment (Or enter custom below)</label>
                <select
                  value={selectedProductSku}
                  onChange={e => {
                    const skuVal = e.target.value;
                    setSelectedProductSku(skuVal);
                    const prod = products.find(p => p.sku === skuVal);
                    if (prod) {
                      setCustomItemName(prod.name);
                      setCustomCategory(prod.category);
                      setCustomUnit(prod.unit);
                    }
                  }}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold text-xs bg-white"
                >
                  <option value="">-- Choose from Warehouse SKUs --</option>
                  {products.map(prod => (
                    <option key={prod.id} value={prod.sku}>
                      {prod.name} ({prod.sku}) • Avail: {prod.availableStock} {prod.unit}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Material Item / Specification Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Waaree 550W Mono PERC Half-Cut PV Panels"
                  value={customItemName}
                  onChange={e => setCustomItemName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={customCategory}
                    onChange={e => setCustomCategory(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold text-xs bg-white"
                  >
                    <option value="Solar Panels">Solar Panels</option>
                    <option value="Inverters">Inverters</option>
                    <option value="DC/AC Cables">DC/AC Cables</option>
                    <option value="Mounting Structures">Mounting Structures</option>
                    <option value="Earthing & Lightning">Earthing &amp; Lightning</option>
                    <option value="Protection BOS">Protection BOS</option>
                    <option value="Accessories">Accessories</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Allocation Status</label>
                  <select
                    value={customStatus}
                    onChange={e => setCustomStatus(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold text-xs bg-white"
                  >
                    <option value="Indented">Indented (Awaiting PO/Dispatch)</option>
                    <option value="Allocated">Allocated (Reserved in Warehouse)</option>
                    <option value="Dispatched">Dispatched (En Route to Site)</option>
                    <option value="Received on Site">Received on Site (Verified by GRN)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Indented Quantity *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={customQuantity}
                    onChange={e => setCustomQuantity(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Unit of Measure</label>
                  <select
                    value={customUnit}
                    onChange={e => setCustomUnit(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold text-xs bg-white"
                  >
                    <option value="Nos">Nos</option>
                    <option value="Units">Units</option>
                    <option value="Meters">Meters</option>
                    <option value="Sets">Sets</option>
                    <option value="Pairs">Pairs</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Warehouse Staging Location</label>
                <input
                  type="text"
                  value={customWarehouse}
                  onChange={e => setCustomWarehouse(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold text-xs"
                />
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
                  Create BOM Indent
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
