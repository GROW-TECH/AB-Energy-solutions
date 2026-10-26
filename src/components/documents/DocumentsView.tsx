import React, { useState } from 'react';
import { useCrm } from '../../context/CrmContext';
import { 
  FolderOpen, FileText, Download, Upload, Search, 
  Filter, CheckCircle2, ShieldCheck, Tag, Eye
} from 'lucide-react';

export const DocumentsView: React.FC = () => {
  const { projects } = useCrm();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const sampleDocuments = [
    {
      id: 'DOC-01',
      title: 'DISCOM Net-Metering Feasibility & Bi-Directional Sanction Letter',
      category: 'DISCOM Approvals',
      projectName: 'Nandini Dairy Cooperative (45 kW)',
      projectId: 'PROJECT-2026-001',
      date: '2026-09-22',
      size: '2.4 MB',
      type: 'PDF',
      verified: true,
    },
    {
      id: 'DOC-02',
      title: 'CEIG Electrical Inspectorate Single Line Diagram (SLD) Approved',
      category: 'Engineering Drawings',
      projectName: 'Nandini Dairy Cooperative (45 kW)',
      projectId: 'PROJECT-2026-001',
      date: '2026-09-21',
      size: '5.1 MB',
      type: 'PDF',
      verified: true,
    },
    {
      id: 'DOC-03',
      title: 'Structural Wind Load & Purlin Fastening Analysis Certificate (150 km/h)',
      category: 'Structural Reports',
      projectName: 'Nandini Dairy Cooperative (45 kW)',
      projectId: 'PROJECT-2026-001',
      date: '2026-09-20',
      size: '3.8 MB',
      type: 'PDF',
      verified: true,
    },
    {
      id: 'DOC-04',
      title: 'PM Surya Ghar National Portal Central Subsidy Direct Benefit Acknowledgment',
      category: 'Government Subsidy',
      projectName: 'Dr. Aravind Swamy Villa (10 kW)',
      projectId: 'PROJECT-2026-002',
      date: '2026-09-23',
      size: '1.2 MB',
      type: 'PDF',
      verified: true,
    },
    {
      id: 'DOC-05',
      title: 'Solar PV String Voc & Isc Earth Resistance Megger Calibration Certificate',
      category: 'Commissioning & Testing',
      projectName: 'Suresh Narang Villa (10 kW)',
      projectId: 'PROJECT-2026-003',
      date: '2026-07-28',
      size: '1.9 MB',
      type: 'PDF',
      verified: true,
    },
    {
      id: 'DOC-06',
      title: 'Joint Plant Inspection Report (JIR) & BESCOM Commissioning Signoff',
      category: 'Commissioning & Testing',
      projectName: 'Suresh Narang Villa (10 kW)',
      projectId: 'PROJECT-2026-003',
      date: '2026-08-01',
      size: '3.2 MB',
      type: 'PDF',
      verified: true,
    },
  ];

  const filteredDocs = sampleDocuments.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.category.toLowerCase().includes(searchQuery.toLowerCase());
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
              <option value="all">All Document Categories</option>
              <option value="DISCOM Approvals">DISCOM Approvals</option>
              <option value="Engineering Drawings">Engineering Drawings</option>
              <option value="Structural Reports">Structural Reports</option>
              <option value="Government Subsidy">Government Subsidy</option>
              <option value="Commissioning & Testing">Commissioning & Testing</option>
            </select>
          </div>
        </div>
      </div>

      {/* Document Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDocs.map(doc => (
          <div key={doc.id} className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="flex items-start justify-between gap-2">
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
                  <FileText className="w-5 h-5" />
                </div>
                {doc.verified && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <ShieldCheck className="w-3 h-3" /> Statutory Verified
                  </span>
                )}
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
                onClick={() => alert(`Simulated downloading ${doc.title}`)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200"
              >
                <Download className="w-3 h-3" />
                <span>Download</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
