import React, { useState, useEffect } from 'react';
import { useCrm } from '../../context/CrmContext';
import { 
  FolderOpen, FileText, Download, Upload, Search, 
  ShieldCheck, Plus, Trash2, X, CheckCircle2, AlertTriangle
} from 'lucide-react';

export interface EngineeringDoc {
  id: string;
  title: string;
  category: string;
  projectName: string;
  projectId: string;
  date: string;
  size: string;
  type: string;
  verified: boolean;
  fileData?: string;
  fileName?: string;
}

const STORAGE_KEY = 'ab_engineering_regulatory_documents';

export const DocumentsView: React.FC = () => {
  const { projects } = useCrm();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Stored documents initialized to empty array (cleared mock data)
  const [documents, setDocuments] = useState<EngineeringDoc[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to parse saved engineering documents:', e);
    }
    return [];
  });

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(documents));
    } catch (e) {
      console.error('Failed to save engineering documents:', e);
    }
  }, [documents]);

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('DISCOM Approvals');
  const [newProjectId, setNewProjectId] = useState(projects[0]?.id || '');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newVerified, setNewVerified] = useState(true);
  const [newFileData, setNewFileData] = useState<string>('');
  const [newFileName, setNewFileName] = useState<string>('');
  const [newFileSize, setNewFileSize] = useState<string>('');
  const [newFileType, setNewFileType] = useState<string>('PDF');

  const handleOpenUploadModal = () => {
    setNewTitle('');
    setNewCategory('DISCOM Approvals');
    setNewProjectId(projects[0]?.id || '');
    setNewDate(new Date().toISOString().split('T')[0]);
    setNewVerified(true);
    setNewFileData('');
    setNewFileName('');
    setNewFileSize('');
    setNewFileType('PDF');
    setShowUploadModal(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewFileName(file.name);
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      setNewFileSize(`${sizeMb} MB`);
      const ext = file.name.split('.').pop()?.toUpperCase() || 'PDF';
      setNewFileType(ext);
      if (!newTitle) {
        setNewTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        setNewFileData(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const matchedProj = projects.find(p => p.id === newProjectId);
    const projName = matchedProj 
      ? `${matchedProj.customerName} (${matchedProj.capacityKw || 5} kW)`
      : (newProjectId ? `Project ${newProjectId}` : 'General / Central Repository');

    const newDoc: EngineeringDoc = {
      id: `DOC-${Date.now().toString().slice(-6)}`,
      title: newTitle.trim(),
      category: newCategory,
      projectName: projName,
      projectId: newProjectId || 'GENERAL',
      date: newDate,
      size: newFileSize || '1.5 MB',
      type: newFileType || 'PDF',
      verified: newVerified,
      fileData: newFileData || undefined,
      fileName: newFileName || `${newTitle.trim()}.pdf`,
    };

    setDocuments(prev => [newDoc, ...prev]);
    setShowUploadModal(false);
  };

  const handleDeleteDocument = (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      setDocuments(prev => prev.filter(d => d.id !== id));
    }
  };

  const handleClearAllDocuments = () => {
    if (window.confirm('Are you sure you want to delete ALL documents? This action will permanently remove all uploaded records.')) {
      setDocuments([]);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const handleDownloadDocument = (doc: EngineeringDoc) => {
    if (doc.fileData) {
      const link = document.createElement('a');
      link.href = doc.fileData;
      link.download = doc.fileName || `${doc.title}.${doc.type.toLowerCase()}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Fallback document export
      const content = `AB Energy Solutions - Solar Engineering & Regulatory Record\n============================================================\nDocument ID : ${doc.id}\nTitle       : ${doc.title}\nCategory    : ${doc.category}\nProject     : ${doc.projectName}\nProject ID  : ${doc.projectId}\nIssue Date  : ${doc.date}\nVerification: ${doc.verified ? 'Statutory Verified' : 'Pending Verification'}\n============================================================\nTurnkey Solar EPC & Distributed Rooftop Solar Business OS`;
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${doc.title.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.projectId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'all' || doc.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
              <FolderOpen className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Solar Engineering & Regulatory Documents</h1>
              <p className="text-xs text-slate-500">DISCOM sanction orders, CEIG SLDs, subsidy documents, and testing reports</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {documents.length > 0 && (
            <button
              onClick={handleClearAllDocuments}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-colors cursor-pointer"
              title="Delete all documents"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All ({documents.length})</span>
            </button>
          )}

          <button
            onClick={handleOpenUploadModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Upload Document</span>
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
              placeholder="Search documents by name, project, or certificate..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2.5">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-700 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Document Categories ({documents.length})</option>
              <option value="DISCOM Approvals">DISCOM Approvals</option>
              <option value="Engineering Drawings">Engineering Drawings</option>
              <option value="Structural Reports">Structural Reports</option>
              <option value="Government Subsidy">Government Subsidy</option>
              <option value="Commissioning & Testing">Commissioning & Testing</option>
              <option value="Statutory & CEIG">Statutory & CEIG</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Document Grid or Empty State */}
      {filteredDocs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
            <FolderOpen className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="font-bold text-slate-900 text-base">
              {documents.length === 0 ? 'No Engineering or Regulatory Documents' : 'No Matching Documents Found'}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {documents.length === 0
                ? 'Mock sample records have been completely cleared. Upload your genuine DISCOM sanction letters, CEIG SLDs, net-metering approvals, or commissioning certificates below.'
                : 'Try adjusting your search keywords or filter category.'}
            </p>
          </div>
          {documents.length === 0 && (
            <button
              onClick={handleOpenUploadModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Upload First Document</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocs.map(doc => (
            <div key={doc.id} className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    {doc.verified && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <ShieldCheck className="w-3 h-3" /> Statutory Verified
                      </span>
                    )}
                    <button
                      onClick={() => handleDeleteDocument(doc.id, doc.title)}
                      className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title="Delete document"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="font-bold text-slate-900 text-xs mt-3 line-clamp-2">{doc.title}</h3>
                <div className="text-[11px] text-emerald-700 font-medium mt-1">{doc.projectName}</div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">{doc.projectId}</div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>{doc.date}</span>
                  <span>{doc.size} • {doc.type}</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  {doc.category}
                </span>
                <button
                  onClick={() => handleDownloadDocument(doc)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 cursor-pointer"
                >
                  <Download className="w-3 h-3" />
                  <span>Download</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Document Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Upload Engineering &amp; Regulatory Document</h3>
                <p className="text-xs text-slate-500">Attach sanction orders, electrical single line diagrams, or test reports</p>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDocument} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Document Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CEIG Approved Single Line Diagram (SLD)"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 text-slate-900 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category *</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 text-slate-900"
                  >
                    <option value="DISCOM Approvals">DISCOM Approvals</option>
                    <option value="Engineering Drawings">Engineering Drawings</option>
                    <option value="Structural Reports">Structural Reports</option>
                    <option value="Government Subsidy">Government Subsidy</option>
                    <option value="Commissioning & Testing">Commissioning & Testing</option>
                    <option value="Statutory & CEIG">Statutory & CEIG</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Linked Solar Project</label>
                  <select
                    value={newProjectId}
                    onChange={(e) => setNewProjectId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 text-slate-900"
                  >
                    <option value="">General (No Specific Project)</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.customerName} ({p.capacityKw || 5} kW - {p.id})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Date of Issue / Clearance</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Attach Document File (PDF / Images)</label>
                {newFileName ? (
                  <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-emerald-700" />
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">{newFileName}</span>
                        <span className="text-[10px] text-emerald-700 font-semibold">{newFileSize} • {newFileType}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setNewFileData('');
                        setNewFileName('');
                        setNewFileSize('');
                      }}
                      className="text-xs text-red-600 hover:text-red-700 font-bold px-2 py-1 rounded cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl bg-slate-50 hover:bg-white transition-colors cursor-pointer text-center">
                    <Upload className="w-6 h-6 text-emerald-600 mb-1" />
                    <span className="font-semibold text-slate-700 text-xs">Click to browse document file</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">Supports PDF, PNG, JPG up to 25 MB</span>
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="docVerifiedCheckbox"
                  checked={newVerified}
                  onChange={(e) => setNewVerified(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                />
                <label htmlFor="docVerifiedCheckbox" className="font-semibold text-slate-700 cursor-pointer">
                  Mark as Statutory Verified by Electrical Inspector / DISCOM
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Save &amp; Index Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
