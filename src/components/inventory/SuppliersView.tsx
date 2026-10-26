import React, { useState } from 'react';
import { useCrm } from '../../context/CrmContext';
import { Supplier } from '../../types';
import { 
  Truck, Plus, Search, Star, Phone, Mail, MapPin, 
  CheckCircle2, Clock, ShieldCheck, X, ShoppingCart, Tag
} from 'lucide-react';

interface SuppliersViewProps {
  onNavigateToPo?: () => void;
}

export const SuppliersView: React.FC<SuppliersViewProps> = ({ onNavigateToPo }) => {
  const { suppliers, addSupplier } = useCrm();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);

  // New Supplier Form
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Supplier['category']>('Solar Panels');
  const [rating, setRating] = useState(4.8);
  const [gstin, setGstin] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Karnataka');
  const [paymentTerms, setPaymentTerms] = useState('30 Days Net');
  const [leadTimeDays, setLeadTimeDays] = useState(5);
  const [isPreferred, setIsPreferred] = useState(true);

  const filteredSuppliers = suppliers.filter(sup => {
    const matchesSearch = sup.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sup.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sup.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sup.gstin.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || sup.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const handleAddSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !contactPerson) return;

    addSupplier({
      name,
      category,
      rating: Number(rating),
      gstin: gstin || '29AAACW9999Z1Z5',
      contactPerson,
      email: email || 'orders@vendor.in',
      phone: phone || '+91 98000-00000',
      city: city || 'Bengaluru',
      state,
      paymentTerms,
      leadTimeDays: Number(leadTimeDays),
      isPreferred,
    });

    setName('');
    setContactPerson('');
    setEmail('');
    setPhone('');
    setShowAddSupplierModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
              <Truck className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Solar Tier-1 Equipment Suppliers</h1>
              <p className="text-xs text-slate-500">Approved solar module manufacturers, inverter OEMs, and BOS hardware vendors</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowAddSupplierModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Supplier</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search suppliers by name, contact person, city, or GSTIN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2.5">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-700 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Product Verticals</option>
              <option value="Solar Panels">Solar Panels</option>
              <option value="Inverters">Inverters</option>
              <option value="Mounting Structures">Mounting Structures</option>
              <option value="DC/AC Cables">DC/AC Cables</option>
              <option value="Earthing & Lightning">Earthing & Lightning</option>
            </select>
          </div>
        </div>
      </div>

      {/* Suppliers Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSuppliers.map(supplier => (
          <div key={supplier.id} className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{supplier.name}</h3>
                  <div className="text-[11px] text-emerald-700 font-medium flex items-center gap-1.5 mt-0.5">
                    <span>{supplier.category}</span>
                    <span>•</span>
                    <span className="font-mono text-slate-400">{supplier.supplierCode}</span>
                  </div>
                </div>
                {supplier.isPreferred && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <ShieldCheck className="w-3 h-3" /> Tier-1 OEM
                  </span>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span className="font-bold text-slate-800">{supplier.rating} / 5.0</span>
                  <span className="text-slate-400 text-[11px]">• Lead Time: {supplier.leadTimeDays} days</span>
                </div>

                <div className="flex items-center gap-2 text-slate-700">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{supplier.city}, {supplier.state}</span>
                </div>

                <div className="flex items-center gap-2 text-slate-700">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{supplier.contactPerson} ({supplier.phone})</span>
                </div>

                <div className="flex items-center gap-2 text-slate-700">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate">{supplier.email}</span>
                </div>

                <div className="pt-2 text-[11px] text-slate-500 flex items-center justify-between">
                  <span>GSTIN: <span className="font-mono font-medium text-slate-700">{supplier.gstin}</span></span>
                  <span className="text-emerald-700 font-semibold">{supplier.paymentTerms}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <div className="text-[11px] text-slate-500">
                Active Orders: <span className="font-bold text-slate-800">{supplier.activeOrdersCount}</span>
              </div>
              <button
                onClick={onNavigateToPo}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Issue PO</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Supplier Modal */}
      {showAddSupplierModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between p-4 bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm">Add Solar Equipment Vendor</h3>
              </div>
              <button 
                onClick={() => setShowAddSupplierModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSupplier} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Company / Supplier Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Adani Solar Technologies"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Equipment Vertical</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Supplier['category'])}
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Solar Panels">Solar Panels</option>
                    <option value="Inverters">Inverters</option>
                    <option value="Mounting Structures">Mounting Structures</option>
                    <option value="DC/AC Cables">DC/AC Cables</option>
                    <option value="Electrical BOS">Electrical BOS</option>
                    <option value="Earthing & Lightning">Earthing & Lightning</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">GSTIN</label>
                  <input
                    type="text"
                    placeholder="29AAACW1234F1Z1"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Person *</label>
                  <input
                    type="text"
                    placeholder="e.g. Rajesh Khurana"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+91 98450-11223"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    placeholder="Bengaluru"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Terms</label>
                  <input
                    type="text"
                    placeholder="e.g. 30 Days Net / 20% Advance"
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddSupplierModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
