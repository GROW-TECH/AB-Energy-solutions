import React, { useState } from 'react';
import { useCrm } from '../../context/CrmContext';
import { Supplier } from '../../types';
import { 
  Truck, Plus, Search, Star, Phone, Mail, MapPin, 
  CheckCircle2, Clock, ShieldCheck, X, ShoppingCart, Tag,
  FileText, Upload, Eye, ExternalLink, Paperclip, Download, Trash2,
  FileCheck
} from 'lucide-react';

interface SuppliersViewProps {
  onNavigateToPo?: () => void;
}

export const SuppliersView: React.FC<SuppliersViewProps> = ({ onNavigateToPo }) => {
  const { suppliers, addSupplier, updateSupplier } = useCrm();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [viewingDoc, setViewingDoc] = useState<{ url: string; name: string; type: string } | null>(null);

  // New Supplier Form
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Supplier['category']>('Solar Panels');
  const [rating, setRating] = useState(4.8);
  const [gstin, setGstin] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Salem');
  const [state, setState] = useState('Tamil Nadu');
  const [paymentTerms, setPaymentTerms] = useState('30 Days Net');
  const [leadTimeDays, setLeadTimeDays] = useState(5);
  const [isPreferred, setIsPreferred] = useState(true);

  // New Supplier Document Attachment
  const [uploadedDocUrl, setUploadedDocUrl] = useState<string>('');
  const [uploadedDocName, setUploadedDocName] = useState<string>('');
  const [uploadedDocType, setUploadedDocType] = useState<string>('');

  const filteredSuppliers = suppliers.filter(sup => {
    const matchesSearch = sup.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sup.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sup.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sup.gstin.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || sup.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedDocName(file.name);
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    setUploadedDocType(ext);

    const reader = new FileReader();
    reader.onload = (ev) => {
      setUploadedDocUrl(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAddSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !contactPerson) return;

    const docs = uploadedDocUrl ? [{
      id: `DOC-${Date.now()}`,
      name: uploadedDocName || 'Supplier Rate Card / Certificate',
      fileType: uploadedDocType || 'pdf',
      url: uploadedDocUrl,
      uploadedAt: new Date().toISOString().split('T')[0]
    }] : [];

    addSupplier({
      name,
      category,
      rating: Number(rating),
      gstin: gstin || '33AAACW9999Z1Z5',
      contactPerson,
      email: email || 'orders@vendor.in',
      phone: phone || '+91 95664-00000',
      city: city || 'Salem',
      state: state || 'Tamil Nadu',
      paymentTerms,
      leadTimeDays: Number(leadTimeDays),
      isPreferred,
      documents: docs,
      primaryDocUrl: uploadedDocUrl || undefined
    });

    setName('');
    setContactPerson('');
    setEmail('');
    setPhone('');
    setGstin('');
    setUploadedDocUrl('');
    setUploadedDocName('');
    setUploadedDocType('');
    setShowAddSupplierModal(false);
  };

  const handleAttachDocToExistingSupplier = (supId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name;
    const fileType = file.name.split('.').pop()?.toLowerCase() || '';

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      const targetSup = suppliers.find(s => s.id === supId);
      const existingDocs = targetSup?.documents || [];
      const newDoc = {
        id: `DOC-${Date.now()}`,
        name: fileName,
        fileType,
        url: dataUrl,
        uploadedAt: new Date().toISOString().split('T')[0]
      };

      updateSupplier(supId, {
        documents: [newDoc, ...existingDocs],
        primaryDocUrl: dataUrl
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Truck className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">Solar Tier-1 Equipment Suppliers</h1>
              <p className="text-xs text-slate-500">Approved solar module manufacturers, inverter OEMs, and BOS hardware vendors with verified document vault</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowAddSupplierModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-xs transition-colors cursor-pointer"
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
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-hidden"
            />
          </div>

          <div className="flex items-center gap-2.5">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-700 focus:ring-2 focus:ring-emerald-500 outline-hidden"
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
        {filteredSuppliers.map(supplier => {
          const hasDocs = Boolean(supplier.primaryDocUrl || (supplier.documents && supplier.documents.length > 0));
          const primaryDoc = supplier.documents?.[0] || (supplier.primaryDocUrl ? {
            name: `${supplier.name} Authorized Document`,
            url: supplier.primaryDocUrl,
            fileType: 'pdf'
          } : null);

          return (
            <div key={supplier.id} className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-black text-slate-900 text-sm">{supplier.name}</h3>
                    <div className="text-[11px] text-emerald-700 font-bold flex items-center gap-1.5 mt-0.5">
                      <span>{supplier.category}</span>
                      <span>•</span>
                      <span className="font-mono text-slate-400">{supplier.supplierCode}</span>
                    </div>
                  </div>
                  {supplier.isPreferred && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" /> Tier-1 OEM
                    </span>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span className="font-bold text-slate-800">{supplier.rating} / 5.0</span>
                    <span className="text-slate-400 text-[11px]">• Lead Time: {supplier.leadTimeDays} days</span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-700">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{supplier.city}, {supplier.state}</span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-700">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{supplier.contactPerson} ({supplier.phone})</span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-700">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{supplier.email}</span>
                  </div>

                  <div className="pt-2 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100">
                    <span>GSTIN: <span className="font-mono font-bold text-slate-800">{supplier.gstin}</span></span>
                    <span className="text-emerald-700 font-bold">{supplier.paymentTerms}</span>
                  </div>
                </div>

                {/* Uploaded Supplier Documents Chip & Action */}
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>Authorized Documents &amp; Rates</span>
                    <label className="text-emerald-700 hover:text-emerald-800 text-[10px] font-bold cursor-pointer inline-flex items-center gap-1">
                      <Upload className="w-3 h-3" />
                      <span>Attach Doc</span>
                      <input
                        type="file"
                        accept="image/*,.pdf,.doc,.docx"
                        className="hidden"
                        onChange={(e) => handleAttachDocToExistingSupplier(supplier.id, e)}
                      />
                    </label>
                  </div>

                  {hasDocs && primaryDoc ? (
                    <div className="flex items-center justify-between p-2 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                        <span className="truncate text-slate-800 font-bold text-[11px]">
                          {primaryDoc.name}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setViewingDoc({ url: primaryDoc.url, name: primaryDoc.name, type: primaryDoc.fileType || 'pdf' })}
                        className="px-2.5 py-1 bg-white hover:bg-emerald-100 border border-emerald-300 rounded-lg text-emerald-800 font-bold text-[10px] shrink-0 transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                      >
                        <Eye className="w-3 h-3" />
                        <span>View</span>
                      </button>
                    </div>
                  ) : (
                    <div className="p-2 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-[11px] text-slate-400 text-center">
                      No documents attached yet
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="text-[11px] text-slate-500">
                  Active POs: <span className="font-bold text-slate-800">{supplier.activeOrdersCount}</span>
                </div>
                <button
                  onClick={onNavigateToPo}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-black rounded-xl transition-colors cursor-pointer shadow-2xs"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>Issue PO</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Supplier Modal with Document Upload */}
      {showAddSupplierModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between p-4 bg-slate-900 text-white shrink-0">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm">Add Solar Equipment Vendor</h3>
              </div>
              <button 
                onClick={() => setShowAddSupplierModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSupplier} className="p-5 space-y-3.5 text-xs overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Company / Supplier Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Adani Solar Technologies"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-hidden font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Equipment Vertical</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Supplier['category'])}
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-hidden font-semibold"
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
                    placeholder="33AAACW1234F1Z1"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-hidden font-mono"
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
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-hidden"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+91 95664-11223"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    placeholder="Salem"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">State</label>
                  <input
                    type="text"
                    placeholder="Tamil Nadu"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Terms</label>
                <input
                  type="text"
                  placeholder="e.g. 30 Days Net / 20% Advance"
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />
              </div>

              {/* Document Upload Input */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Upload Supplier Document (Rate Card / OEM Cert / Image / PDF / DOC)
                </label>
                {uploadedDocUrl ? (
                  <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-300 rounded-xl">
                    <div className="flex items-center gap-2 truncate">
                      <FileCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span className="font-bold text-emerald-950 text-xs truncate">{uploadedDocName}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setUploadedDocUrl('');
                        setUploadedDocName('');
                        setUploadedDocType('');
                      }}
                      className="text-rose-600 hover:text-rose-800 font-bold text-xs shrink-0 cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer bg-slate-50 hover:bg-emerald-50/20 transition-colors">
                    <Upload className="w-5 h-5 text-slate-400 mb-1" />
                    <span className="text-xs font-bold text-slate-700">Click to attach document or image</span>
                    <span className="text-[10px] text-slate-400">PDF, JPG, PNG, DOC up to 10MB</span>
                    <input
                      type="file"
                      accept="image/*,.pdf,.doc,.docx"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </label>
                )}
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAddSupplierModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Supplier Document Viewer Modal */}
      {viewingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 bg-slate-900 text-white shrink-0">
              <div className="flex items-center gap-2 truncate">
                <FileText className="w-5 h-5 text-emerald-400 shrink-0" />
                <h3 className="font-bold text-sm truncate">{viewingDoc.name}</h3>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={viewingDoc.url}
                  download={viewingDoc.name}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>
                <button 
                  onClick={() => setViewingDoc(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-4 overflow-y-auto flex-1 flex items-center justify-center bg-slate-100 min-h-[350px]">
              {viewingDoc.type.includes('png') || viewingDoc.type.includes('jpg') || viewingDoc.type.includes('jpeg') || viewingDoc.url.startsWith('data:image') ? (
                <img
                  src={viewingDoc.url}
                  alt={viewingDoc.name}
                  className="max-h-[70vh] max-w-full object-contain rounded-xl shadow-md border border-slate-200"
                />
              ) : viewingDoc.type.includes('pdf') || viewingDoc.url.includes('application/pdf') ? (
                <iframe
                  src={viewingDoc.url}
                  title={viewingDoc.name}
                  className="w-full h-[70vh] rounded-xl border border-slate-300 bg-white"
                />
              ) : (
                <div className="text-center p-8 bg-white rounded-2xl border border-slate-200 shadow-xs max-w-sm">
                  <FileText className="w-12 h-12 text-emerald-600 mx-auto mb-2" />
                  <h4 className="font-bold text-slate-900 text-sm">{viewingDoc.name}</h4>
                  <p className="text-xs text-slate-500 mt-1 mb-4">Binary Document (DOC/PDF). Click below to download and view.</p>
                  <a
                    href={viewingDoc.url}
                    download={viewingDoc.name}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-xs hover:bg-emerald-500"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download File</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
