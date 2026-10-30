import React, { useState, useEffect } from 'react';
import { 
  Layers, Plus, Trash2, Save, Send, CheckCircle2, 
  Clock, AlertTriangle, Search, Filter, ArrowRight, 
  ArrowLeft, RefreshCw, FileText, ChevronRight, User, 
  Phone, MapPin, Zap, Info, ShieldCheck, Check, Building,
  Edit3, FolderPlus
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { BomItem, SiteSurvey } from '../../types';
import { getApiUrl } from '../../utils/apiUrl';

interface SurveyBomViewProps {
  onNavigateToSurvey?: (surveyId: string) => void;
}

export const SurveyBomView: React.FC<SurveyBomViewProps> = ({
  onNavigateToSurvey,
}) => {
  const { surveys, projects } = useCrm();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSurveyId, setSelectedSurveyId] = useState<string | null>(null);
  const [bomsMap, setBomsMap] = useState<Record<string, any>>({});
  const [isLoadingBoms, setIsLoadingBoms] = useState(false);

  // Active BOM Builder state
  const [activeBomItems, setActiveBomItems] = useState<BomItem[]>([]);
  const [activeBomStatus, setActiveBomStatus] = useState<string>('Draft');
  const [activeBomComments, setActiveBomComments] = useState<string>('');
  const [isEditingUnlocked, setIsEditingUnlocked] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Dynamic Categories matching the official AB Energy Solutions proposal document
  const DEFAULT_CATEGORIES = [
    'solar panels',
    'Inverter',
    'Structure',
    'DCDB',
    'ACDB',
    'Earth Electrode',
    'Earthing Wire',
    'Lightning Arrester',
    'PVC pipe',
    'MC4 Connector',
    'DC cable',
    'AC Cable',
    'SS Bolt &Nuts',
    'Other Accessories',
  ];
  const [categoriesList, setCategoriesList] = useState<string[]>(DEFAULT_CATEGORIES);
  const [customCategoryRows, setCustomCategoryRows] = useState<Record<string, boolean>>({});
  const [showNewCategoryModal, setShowNewCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const handleAddNewCategory = () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    if (!categoriesList.includes(trimmed)) {
      setCategoriesList(prev => [...prev, trimmed]);
      showToast(`Category "${trimmed}" added to dropdown list!`, 'success');
    }
    setNewCategoryName('');
    setShowNewCategoryModal(false);
  };

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const authFetch = (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('ab_solar_token');
    return fetch(getApiUrl(url), {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
      },
    });
  };

  // Load all BOMs from backend
  const loadBoms = async () => {
    setIsLoadingBoms(true);
    try {
      const res = await authFetch('/api/boms/all');
      const data = await res.json();
      if (data.success && data.boms) {
        const map: Record<string, any> = {};
        data.boms.forEach((b: any) => {
          if (b.surveyId) {
            map[b.surveyId] = b;
          }
        });
        setBomsMap(map);
      }
    } catch (err) {
      console.error('Failed to load BOMs:', err);
    } finally {
      setIsLoadingBoms(false);
    }
  };

  useEffect(() => {
    loadBoms();
  }, []);

  // Filter:
  // 1. Main survey MUST be 'Completed'
  // 2. Already completed projects must NOT come here
  const eligibleSurveys = surveys.filter(s => {
    // Only surveys where the main audit has been completed/submitted by the engineer
    // (i.e. 'Submitted for Review', 'Completed', or 'Approved' - excluding unvisited 'Scheduled' or 'In Progress')
    const isSurveyCompleted = 
      s.status === 'Completed' || 
      s.status === 'Submitted for Review' || 
      s.status === 'Approved' ||
      (s.status as string)?.toLowerCase().includes('completed') ||
      (s.status as string)?.toLowerCase().includes('review');
    if (!isSurveyCompleted) return false;

    // Exclude projects that are already completed
    const isProjectCompleted = projects.some(p => 
      (p.stage === 'Completed' || (p as any).status === 'Completed') && (
        (s.leadId && p.leadId === s.leadId) ||
        (s.phone && p.customerPhone === s.phone) ||
        (s.customerName && p.customerName.toLowerCase() === s.customerName.toLowerCase())
      )
    );
    if (isProjectCompleted) return false;

    const matchesSearch = 
      s.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.leadName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.phone && s.phone.includes(searchQuery)) ||
      (s.address && s.address.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesSearch;
  });

  // Default BOM template generator based on exact AB Energy Solutions proposal document
  const getDefaultBomItems = (kw: number): BomItem[] => {
    const cap = kw || 5;
    return [
      {
        id: `BI-${Date.now()}-1`,
        bomId: '',
        category: 'solar panels',
        itemName: 'solar panels',
        technicalSpecification: '600-630Wp N-Topcon',
        brandMake: 'Waaree/Adani/Premier/Vikram',
        quantity: cap,
        unit: 'KWp',
        estimatedUnitCost: 28000,
        estimatedTotalCost: cap * 28000,
        remarks: 'Tier-1 Mono PERC / N-Topcon (DCR Compliant)',
      },
      {
        id: `BI-${Date.now()}-2`,
        bomId: '',
        category: 'Inverter',
        itemName: 'Inverter',
        technicalSpecification: `${cap}KW/3 Phase`,
        brandMake: 'Solis/Sungrow',
        quantity: 1,
        unit: 'Nos',
        estimatedUnitCost: cap > 10 ? 85000 : 55000,
        estimatedTotalCost: cap > 10 ? 85000 : 55000,
        remarks: 'On-Grid 3 Phase MPPT with WiFi remote monitoring',
      },
      {
        id: `BI-${Date.now()}-3`,
        bomId: '',
        category: 'Structure',
        itemName: 'Structure',
        technicalSpecification: 'GP Structure',
        brandMake: 'Reputed',
        quantity: 1,
        unit: 'Set',
        estimatedUnitCost: cap * 1800,
        estimatedTotalCost: cap * 1800,
        remarks: 'Pre-Galvanized / Mini Rail rooftop mounting structure',
      },
      {
        id: `BI-${Date.now()}-4`,
        bomId: '',
        category: 'DCDB',
        itemName: 'DCDB',
        technicalSpecification: cap > 15 ? '63A With SPD' : '32A MCB With SPD',
        brandMake: 'Reputed',
        quantity: 1,
        unit: 'Nos',
        estimatedUnitCost: 6500,
        estimatedTotalCost: 6500,
        remarks: '1000V DC protection box with Type-II SPD',
      },
      {
        id: `BI-${Date.now()}-5`,
        bomId: '',
        category: 'ACDB',
        itemName: 'ACDB',
        technicalSpecification: cap > 15 ? '3PN/63A MCB' : '3PN/32A MCB with SPD',
        brandMake: 'Reputed',
        quantity: 1,
        unit: 'Nos',
        estimatedUnitCost: 7500,
        estimatedTotalCost: 7500,
        remarks: 'Bi-directional utility grid isolator with SPD',
      },
      {
        id: `BI-${Date.now()}-6`,
        bomId: '',
        category: 'Earth Electrode',
        itemName: 'Earth Electrode',
        technicalSpecification: 'Coper Bonded 100 Micron, 19mm dia, 1Mtr',
        brandMake: 'Reputed',
        quantity: cap > 10 ? 3 : 1,
        unit: 'Nos',
        estimatedUnitCost: 3500,
        estimatedTotalCost: (cap > 10 ? 3 : 1) * 3500,
        remarks: 'Chemical compound earthing electrode (< 2 Ohms)',
      },
      {
        id: `BI-${Date.now()}-7`,
        bomId: '',
        category: 'Earthing Wire',
        itemName: 'Earthing Wire',
        technicalSpecification: cap > 10 ? '6 Sq mm Copper wire' : '4 Sq mm Copper wire',
        brandMake: 'polycab/RR cable',
        quantity: cap > 10 ? 90 : 60,
        unit: 'Mtrs',
        estimatedUnitCost: 45,
        estimatedTotalCost: (cap > 10 ? 90 : 60) * 45,
        remarks: 'Insulated copper grounding conductor',
      },
      {
        id: `BI-${Date.now()}-8`,
        bomId: '',
        category: 'Lightning Arrester',
        itemName: 'Lightning Arrester',
        technicalSpecification: 'Coper Bonded 100 Micron, 19mm dia, 1Mtr',
        brandMake: 'Reputed',
        quantity: 1,
        unit: 'Nos',
        estimatedUnitCost: 4500,
        estimatedTotalCost: 4500,
        remarks: 'ESE Lightning protection rod mounted elevated',
      },
      {
        id: `BI-${Date.now()}-9`,
        bomId: '',
        category: 'PVC pipe',
        itemName: 'PVC pipe',
        technicalSpecification: '1 inch',
        brandMake: 'Reputed',
        quantity: 1,
        unit: 'Nos',
        estimatedUnitCost: 1800,
        estimatedTotalCost: 1800,
        remarks: 'Heavy duty UV resistant conduit',
      },
      {
        id: `BI-${Date.now()}-10`,
        bomId: '',
        category: 'MC4 Connector',
        itemName: 'MC4 Connector',
        technicalSpecification: '1000V DC, IP68',
        brandMake: 'Staubli',
        quantity: 3,
        unit: 'Sets',
        estimatedUnitCost: 350,
        estimatedTotalCost: 3 * 350,
        remarks: 'Waterproof crimp connector sets',
      },
      {
        id: `BI-${Date.now()}-11`,
        bomId: '',
        category: 'DC cable',
        itemName: 'DC cable',
        technicalSpecification: '6sqmm copper cable',
        brandMake: 'Polycab / Equivalen',
        quantity: cap > 10 ? 200 : 15,
        unit: 'Mtrs',
        estimatedUnitCost: 65,
        estimatedTotalCost: (cap > 10 ? 200 : 15) * 65,
        remarks: 'Tinned copper solar grade DC cable',
      },
      {
        id: `BI-${Date.now()}-12`,
        bomId: '',
        category: 'AC Cable',
        itemName: 'AC Cable',
        technicalSpecification: cap > 10 ? '3.5 Core × 35 Sq.mm al.armd Cable' : '3.5 Core × 6 Sq.mm Copper Cable',
        brandMake: 'Polycab / Equivalen',
        quantity: cap > 10 ? 35 : 10,
        unit: 'Mtrs',
        estimatedUnitCost: cap > 10 ? 320 : 180,
        estimatedTotalCost: (cap > 10 ? 35 : 10) * (cap > 10 ? 320 : 180),
        remarks: 'Armoured grid interconnection cable',
      },
      {
        id: `BI-${Date.now()}-13`,
        bomId: '',
        category: 'SS Bolt &Nuts',
        itemName: 'SS Bolt &Nuts',
        technicalSpecification: 'M8x25 SS203 grade',
        brandMake: 'Reputed',
        quantity: 1,
        unit: 'Sets',
        estimatedUnitCost: 2500,
        estimatedTotalCost: 2500,
        remarks: 'Stainless steel module and structure fastening hardware',
      },
      {
        id: `BI-${Date.now()}-14`,
        bomId: '',
        category: 'Other Accessories',
        itemName: 'Other Accessories',
        technicalSpecification: 'As Required',
        brandMake: 'Reputed',
        quantity: 1,
        unit: 'Sets',
        estimatedUnitCost: 3000,
        estimatedTotalCost: 3000,
        remarks: 'Cable ties, ferrules, caution signages, and accessories',
      },
    ];
  };

  // Open full-page BOM builder
  const handleOpenBomBuilder = async (survey: SiteSurvey) => {
    setSelectedSurveyId(survey.id);
    setIsSaving(false);
    setIsSubmitting(false);

    try {
      const res = await authFetch(`/api/boms?surveyId=${survey.id}`);
      const data = await res.json();
      if (data.success && data.bom && data.bom.items && data.bom.items.length > 0) {
        setActiveBomItems(data.bom.items);
        setActiveBomStatus(data.bom.status || 'Draft');
        setActiveBomComments(data.bom.revisionComments || '');
        // Collect existing categories from saved items
        const existingCats = data.bom.items.map((it: any) => it.category).filter(Boolean);
        setCategoriesList(prev => Array.from(new Set([...prev, ...existingCats])));
      } else {
        setActiveBomItems(getDefaultBomItems(survey.recommendedKw || 5));
        setActiveBomStatus('Draft');
        setActiveBomComments('');
      }
    } catch (err) {
      setActiveBomItems(getDefaultBomItems(survey.recommendedKw || 5));
      setActiveBomStatus('Draft');
    }
  };

  // Add custom line item
  const handleAddCustomItem = () => {
    const newItemId = `BI-${Date.now()}-${activeBomItems.length + 1}`;
    const newItem: BomItem = {
      id: newItemId,
      bomId: '',
      category: '',
      itemName: '',
      technicalSpecification: '',
      brandMake: '',
      quantity: 1,
      unit: 'Nos',
      estimatedUnitCost: 0,
      estimatedTotalCost: 0,
      remarks: '',
    };
    setActiveBomItems(prev => [...prev, newItem]);
    setCustomCategoryRows(prev => ({ ...prev, [newItemId]: true }));
  };

  // Save BOM draft
  const handleSaveDraft = async () => {
    if (!selectedSurveyId) return;
    setIsSaving(true);
    try {
      const res = await authFetch('/api/boms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          surveyId: selectedSurveyId,
          items: activeBomItems,
          status: 'Draft',
          revisionComments: activeBomComments,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActiveBomStatus('Draft');
        showToast('BOM draft successfully saved! Ready for editing or submission.', 'success');
        loadBoms();
      } else {
        showToast(data.error || 'Failed to save BOM', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Submit BOM to Project Manager
  const handleSubmitToPm = async () => {
    if (!selectedSurveyId) return;
    setIsSubmitting(true);
    try {
      const res = await authFetch('/api/boms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          surveyId: selectedSurveyId,
          items: activeBomItems,
          status: 'Submitted',
          revisionComments: activeBomComments,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActiveBomStatus('Submitted');
        showToast('BOM successfully submitted to Project Manager for Technical Approval!', 'success');
        loadBoms();
      } else {
        showToast(data.error || 'Failed to submit BOM', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedSurvey = surveys.find(s => s.id === selectedSurveyId);
  const totalBomValue = activeBomItems.reduce((sum, it) => sum + (Number(it.estimatedTotalCost) || 0), 0);
  const isLocked = (activeBomStatus === 'Submitted' || activeBomStatus === 'Approved') && !isEditingUnlocked;

  return (
    <div className="space-y-6">
      {/* Toast notification */}
      {toastMessage && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-xl border text-xs font-bold animate-in fade-in slide-in-from-top-2 duration-200 flex items-center gap-2 ${
          toastMessage.type === 'success' 
            ? 'bg-emerald-600 text-white border-emerald-700' 
            : 'bg-red-600 text-white border-red-700'
        }`}>
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 1: FULL-WIDTH LIST OF COMPLETED SURVEYS NEEDING BOM CONFIGURATION    */}
      {/* ========================================================================= */}
      {!selectedSurveyId ? (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Top Banner */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="p-1.5 bg-emerald-600 text-white rounded-lg">
                  <Layers className="w-5 h-5" />
                </span>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Field Bill of Materials (BOM) &amp; Equipment Planning
                </h1>
                <span className="px-2.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold rounded-full">
                  Post-Survey Engineering
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Completed site audits ready for Bill of Materials preparation. Select a completed survey below to open the dedicated full-width BOM Builder.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search completed surveys..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs w-64 focus:outline-hidden focus:border-emerald-500"
                />
              </div>
              <button
                onClick={loadBoms}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors cursor-pointer"
                title="Refresh records"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingBoms ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Full-Width Table / Cards of Completed Surveys */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <span>Completed Surveys Awaiting BOM ({eligibleSurveys.length})</span>
                <span className="text-[11px] font-normal text-slate-400">
                  (Only surveys with audit completed • Finished projects excluded)
                </span>
              </div>
            </div>

            {eligibleSurveys.length === 0 ? (
              <div className="p-16 text-center text-slate-400 space-y-3">
                <CheckCircle2 className="w-12 h-12 mx-auto text-slate-300" />
                <h3 className="text-base font-bold text-slate-800">No Pending Surveys Requiring BOM</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Only surveys with completed on-site audits that are not yet closed as completed projects appear here. Complete a site survey in "Assigned Site Surveys" to begin its BOM.
                </p>
              </div>
            ) : (
              <>
                {/* Mobile Cards (< lg) */}
                <div className="lg:hidden divide-y divide-slate-100">
                  {eligibleSurveys.map(srv => {
                    const bom = bomsMap[srv.id];
                    const hasBom = !!bom;
                    const status = bom?.status || 'Pending';

                    return (
                      <div key={srv.id} className="p-4 hover:bg-slate-50/80 transition-colors space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h4 className="font-bold text-slate-900 text-sm truncate">{srv.customerName}</h4>
                            <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                              <span>{srv.id}</span>
                              <span>&bull;</span>
                              <span>{srv.leadName}</span>
                            </div>
                          </div>
                          <span className="font-bold font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-xs shrink-0">
                            {srv.recommendedKw || 5} kWp
                          </span>
                        </div>

                        <div className="p-2.5 bg-slate-50 rounded-xl text-xs space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-slate-400 uppercase font-semibold">Phone</span>
                            <span className="font-mono text-slate-700 text-[11px]">{srv.phone}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-slate-400 uppercase font-semibold">Roof Type</span>
                            <span className="font-medium text-slate-700 text-[11px]">{srv.roofType || 'RCC Flat Terrace'}</span>
                          </div>
                          <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                            <span className="text-[10px] text-slate-400 uppercase font-semibold">Material Status</span>
                            {!hasBom || status === 'Draft' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                Need material update
                              </span>
                            ) : status === 'Submitted' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                BOM Under PM Review
                              </span>
                            ) : status === 'Approved' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                BOM Approved by PM
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                Changes Requested
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => handleOpenBomBuilder(srv)}
                          className={`w-full py-2 font-bold rounded-xl text-xs transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5 shadow-xs ${
                            status === 'Submitted' || status === 'Approved'
                              ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300'
                              : 'bg-slate-900 hover:bg-emerald-700 text-white'
                          }`}
                        >
                          <span>
                            {!hasBom || status === 'Draft' 
                              ? 'Configure BOM' 
                              : status === 'Submitted' 
                                ? '🔒 View Locked BOM' 
                                : status === 'Approved' 
                                  ? '✅ View Approved BOM' 
                                  : 'Edit BOM'}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop Table (>= lg) */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full text-left text-xs divide-y divide-slate-200">
                    <thead className="bg-slate-50 text-slate-700 font-bold text-[11px] uppercase tracking-wider">
                      <tr>
                        <th className="p-4">Customer &amp; Lead</th>
                        <th className="p-4">Survey Details</th>
                        <th className="p-4">System Capacity</th>
                        <th className="p-4">Rooftop Type</th>
                        <th className="p-4">Survey Status</th>
                        <th className="p-4">Material Status</th>
                        <th className="p-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {eligibleSurveys.map(srv => {
                        const bom = bomsMap[srv.id];
                        const hasBom = !!bom;
                        const status = bom?.status || 'Pending';

                        return (
                          <tr key={srv.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="p-4">
                              <div className="font-bold text-slate-900 text-sm">{srv.customerName}</div>
                              <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                                <Building className="w-3.5 h-3.5 text-slate-400" />
                                <span>{srv.leadName}</span>
                              </div>
                            </td>

                            <td className="p-4">
                              <div className="font-mono font-semibold text-slate-700">{srv.id}</div>
                              <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                                <Phone className="w-3 h-3 text-slate-400" />
                                <span>{srv.phone}</span>
                              </div>
                            </td>

                            <td className="p-4">
                              <span className="font-bold font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg text-xs">
                                {srv.recommendedKw || 5} kWp
                              </span>
                            </td>

                            <td className="p-4 text-slate-700 font-medium">
                              <div>{srv.roofType || 'RCC Flat Terrace'}</div>
                              <div className="text-[11px] text-slate-400 truncate max-w-[200px]">{srv.address}</div>
                            </td>

                            <td className="p-4">
                              {srv.status === 'Approved' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-full text-[10px] font-bold">
                                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                  <span>Approved by PM</span>
                                </span>
                              ) : srv.status === 'Submitted for Review' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-full text-[10px] font-bold">
                                  <Clock className="w-3 h-3 text-blue-600" />
                                  <span>Pending PM Review</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Survey Completed</span>
                                </span>
                              )}
                            </td>

                            <td className="p-4">
                              {!hasBom || status === 'Draft' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                  <span>Need material update</span>
                                </span>
                              ) : status === 'Submitted' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                  <Clock className="w-3 h-3" />
                                  <span>BOM Under PM Review</span>
                                </span>
                              ) : status === 'Approved' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                  <ShieldCheck className="w-3 h-3" />
                                  <span>BOM Approved by PM</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                  <AlertTriangle className="w-3 h-3" />
                                  <span>Changes Requested</span>
                                </span>
                              )}
                            </td>

                            <td className="p-4 text-right">
                              <button
                                onClick={() => handleOpenBomBuilder(srv)}
                                className={`px-4 py-2 font-bold rounded-xl text-xs transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-xs ${
                                  status === 'Submitted' || status === 'Approved'
                                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300'
                                    : 'bg-slate-900 hover:bg-emerald-700 text-white'
                                }`}
                              >
                                <span>
                                  {!hasBom || status === 'Draft' 
                                    ? 'Configure BOM' 
                                    : status === 'Submitted' 
                                      ? '🔒 View Locked BOM' 
                                      : status === 'Approved' 
                                        ? '✅ View Approved BOM' 
                                        : 'Edit BOM'}
                                </span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* VIEW 2: DEDICATED FULL-WIDTH BOM BUILDER WORKSPACE                        */
        /* ========================================================================= */
        selectedSurvey && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Top Navigation Bar with Back Button */}
            <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <button
                onClick={() => setSelectedSurveyId(null)}
                className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Completed Surveys List</span>
              </button>

              <div className="flex items-center gap-3">
                <span className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                  activeBomStatus === 'Approved' ? 'bg-emerald-50 text-emerald-800 border border-emerald-300' :
                  activeBomStatus === 'Submitted' ? 'bg-blue-50 text-blue-800 border border-blue-300' :
                  activeBomStatus === 'Changes Requested' ? 'bg-rose-50 text-rose-800 border border-rose-200' :
                  'bg-amber-50 text-amber-800 border border-amber-200'
                }`}>
                  {isLocked && <ShieldCheck className="w-3.5 h-3.5" />}
                  <span>Status: {activeBomStatus}</span>
                </span>

                {isLocked ? (
                  <div className="flex items-center gap-2">
                    <span className="px-3.5 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs border border-slate-200 flex items-center gap-1.5">
                      🔒 Read-Only Inspection Mode
                    </span>
                    <button
                      onClick={() => {
                        setIsEditingUnlocked(true);
                        showToast('BOM editing unlocked! Saving changes will increment version and mark it as Edited for PM review.', 'info' as any);
                      }}
                      className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span>Edit BOM Materials</span>
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={handleAddCustomItem}
                      className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Custom Item</span>
                    </button>
                    <button
                      onClick={() => setShowNewCategoryModal(!showNewCategoryModal)}
                      className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                      title="Add or create a new category for the dropdown"
                    >
                      <FolderPlus className="w-4 h-4" />
                      <span>+ New Category</span>
                    </button>
                    <button
                      onClick={handleSaveDraft}
                      disabled={isSaving}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      <span>{isSaving ? 'Saving...' : 'Save Draft'}</span>
                    </button>
                    <button
                      onClick={handleSubmitToPm}
                      disabled={isSubmitting}
                      className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                    >
                      <Send className="w-4 h-4" />
                      <span>{isSubmitting ? 'Submitting...' : 'Submit BOM to Project Manager'}</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Locked Notice Banner */}
            {isLocked && (
              <div className={`p-4 rounded-2xl border flex items-start gap-3 shadow-xs animate-in fade-in ${
                activeBomStatus === 'Approved'
                  ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
                  : 'bg-blue-50/90 border-blue-300 text-blue-950'
              }`}>
                {activeBomStatus === 'Approved' ? (
                  <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                ) : (
                  <Clock className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
                )}
                <div className="space-y-0.5">
                  <h4 className="font-bold text-sm">
                    {activeBomStatus === 'Approved'
                      ? '🔒 Technical Bill of Materials Approved & Locked by Project Manager'
                      : '🔒 BOM Submitted — Awaiting PM Review (Read-Only Mode)'}
                  </h4>
                  <p className="text-xs">
                    {activeBomStatus === 'Approved'
                      ? 'The Project Manager has approved and locked this Bill of Materials. Approved technical specifications have been forwarded to Sales for formal Quotation creation and procurement.'
                      : 'This BOM has been formally submitted to the Project Manager for Technical Approval. All fields are locked in read-only inspection mode. If changes are requested by the PM, editing will unlock automatically.'}
                  </p>
                </div>
              </div>
            )}

            {/* Quick Add Custom Category Bar */}
            {showNewCategoryModal && (
              <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl flex flex-col sm:flex-row items-center gap-3 animate-in fade-in duration-200">
                <div className="flex-1 w-full">
                  <label className="block text-[11px] font-bold text-indigo-900 mb-1">
                    Add Custom Equipment Category to Dropdown:
                  </label>
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={e => setNewCategoryName(e.target.value)}
                    placeholder="e.g. Battery Storage / BESS, Net Metering Enclosure, Stanchions..."
                    className="w-full p-2 bg-white border border-indigo-300 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-indigo-600"
                    autoFocus
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleAddNewCategory();
                    }}
                  />
                </div>
                <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-4">
                  <button
                    onClick={handleAddNewCategory}
                    disabled={!newCategoryName.trim()}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs"
                  >
                    Add Category
                  </button>
                  <button
                    onClick={() => {
                      setShowNewCategoryModal(false);
                      setNewCategoryName('');
                    }}
                    className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Customer Details Banner */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-slate-900">{selectedSurvey.customerName}</h2>
                  <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {selectedSurvey.id}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Lead: <strong className="text-slate-800">{selectedSurvey.leadName}</strong> • Phone: <strong className="text-slate-800">{selectedSurvey.phone}</strong> • Address: <span className="text-slate-700">{selectedSurvey.address}</span>
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-right">
                  <span className="block text-[10px] text-slate-400 font-bold uppercase">System Sizing</span>
                  <span className="text-lg font-bold font-mono text-emerald-700">{selectedSurvey.recommendedKw || 5} kWp</span>
                </div>
                <div className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-right">
                  <span className="block text-[10px] text-slate-400 font-bold uppercase">Roof Profile</span>
                  <span className="text-xs font-bold text-slate-800">{selectedSurvey.roofType || 'RCC Flat'}</span>
                </div>
              </div>
            </div>

            {/* Revision Comments / PM Feedback Banner if changes requested */}
            {activeBomComments && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-start gap-3">
                <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-sm">Project Manager Technical Feedback:</span>
                  <p className="text-xs text-amber-800 mt-1">{activeBomComments}</p>
                </div>
              </div>
            )}

            {/* Full-Width Spacious BOM Line Items Table */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs divide-y divide-slate-200">
                  <thead className="bg-slate-50 text-slate-700 font-bold text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="p-3 text-center w-12">S.NO</th>
                      <th className="p-3.5">MATERIALS</th>
                      <th className="p-3.5">SPECIFICATION</th>
                      <th className="p-3.5">MAKE</th>
                      <th className="p-3.5 text-center">UNITS</th>
                      <th className="p-3.5 text-center">QUANTITY</th>
                      <th className="p-3.5 text-right">EST. UNIT RATE</th>
                      <th className="p-3.5 text-right">TOTAL AMOUNT</th>
                      <th className="p-3.5 text-center">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activeBomItems.map((item, idx) => (
                      <tr key={item.id || idx} className="hover:bg-slate-50/80 transition-colors">
                        {/* S.NO */}
                        <td className="p-3 text-center font-mono font-bold text-slate-400">
                          {idx + 1}
                        </td>

                        {/* MATERIALS */}
                        <td className="p-3 font-semibold text-slate-800 min-w-[200px]">
                          {isLocked ? (
                            <div className="font-bold text-slate-900 py-1 text-xs">{item.category}</div>
                          ) : customCategoryRows[item.id] ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={item.category || ''}
                                onChange={e => {
                                  const val = e.target.value;
                                  const next = [...activeBomItems];
                                  next[idx].category = val;
                                  next[idx].itemName = val;
                                  setActiveBomItems(next);
                                }}
                                placeholder="add item"
                                className="w-full p-2 bg-white border-2 border-emerald-500 rounded-xl text-xs font-semibold focus:outline-hidden text-slate-900"
                                autoFocus
                                onKeyDown={e => {
                                  if (e.key === 'Enter') {
                                    if (item.category && !categoriesList.includes(item.category)) {
                                      setCategoriesList(prev => [...prev, item.category]);
                                    }
                                    setCustomCategoryRows(prev => ({ ...prev, [item.id]: false }));
                                  }
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  if (item.category && !categoriesList.includes(item.category)) {
                                    setCategoriesList(prev => [...prev, item.category]);
                                  }
                                  setCustomCategoryRows(prev => ({ ...prev, [item.id]: false }));
                                }}
                                className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer shrink-0 shadow-xs"
                                title="Done"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <select
                                value={item.category || ''}
                                onChange={e => {
                                  if (e.target.value === '__CUSTOM__') {
                                    setCustomCategoryRows(prev => ({ ...prev, [item.id]: true }));
                                  } else {
                                    const next = [...activeBomItems];
                                    next[idx].category = e.target.value;
                                    next[idx].itemName = e.target.value;
                                    setActiveBomItems(next);
                                  }
                                }}
                                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-emerald-500 font-semibold text-slate-800"
                              >
                                {!item.category && <option value="" disabled>-- add item --</option>}
                                {categoriesList.map(cat => (
                                  <option key={cat} value={cat}>{cat}</option>
                                ))}
                                <option value="__CUSTOM__" className="text-emerald-700 font-bold bg-emerald-50">
                                  ➕ + Type Custom Material...
                                </option>
                              </select>
                              <button
                                type="button"
                                onClick={() => setCustomCategoryRows(prev => ({ ...prev, [item.id]: true }))}
                                className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg cursor-pointer shrink-0 transition-colors"
                                title="Edit / Type Custom Material"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>

                        {/* SPECIFICATION */}
                        <td className="p-3 min-w-[240px]">
                          {isLocked ? (
                            <div className="text-xs text-slate-800 font-medium py-1">{item.technicalSpecification || '—'}</div>
                          ) : (
                            <input
                              type="text"
                              value={item.technicalSpecification || ''}
                              onChange={e => {
                                const next = [...activeBomItems];
                                next[idx].technicalSpecification = e.target.value;
                                setActiveBomItems(next);
                              }}
                              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden focus:border-emerald-500"
                              placeholder="e.g. 600-630Wp N-Topcon / GP Structure / 32A MCB With SPD"
                            />
                          )}
                        </td>

                        {/* MAKE */}
                        <td className="p-3 min-w-[160px]">
                          {isLocked ? (
                            <div className="text-xs font-semibold text-slate-800 py-1">{item.brandMake || '—'}</div>
                          ) : (
                            <input
                              type="text"
                              value={item.brandMake || ''}
                              onChange={e => {
                                const next = [...activeBomItems];
                                next[idx].brandMake = e.target.value;
                                setActiveBomItems(next);
                              }}
                              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-emerald-500"
                              placeholder="e.g. Waaree / Solis / Reputed"
                            />
                          )}
                        </td>

                        {/* UNITS */}
                        <td className="p-3 text-center min-w-[95px]">
                          {isLocked ? (
                            <span className="px-2.5 py-1 bg-slate-100 text-slate-800 font-bold rounded-lg text-xs">{item.unit}</span>
                          ) : (
                            <select
                              value={item.unit}
                              onChange={e => {
                                const next = [...activeBomItems];
                                next[idx].unit = e.target.value;
                                setActiveBomItems(next);
                              }}
                              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:border-emerald-500 text-center"
                            >
                              <option value="KWp">KWp</option>
                              <option value="Nos">Nos</option>
                              <option value="Set">Set</option>
                              <option value="Sets">Sets</option>
                              <option value="Mtrs">Mtrs</option>
                              <option value="Lot">Lot</option>
                              <option value="Pkts">Pkts</option>
                              <option value="Kg">Kg</option>
                            </select>
                          )}
                        </td>

                        {/* QUANTITY */}
                        <td className="p-3 text-center min-w-[90px]">
                          {isLocked ? (
                            <span className="font-bold font-mono text-slate-900 text-xs px-2.5 py-1 bg-slate-100 rounded-lg">{item.quantity}</span>
                          ) : (
                            <input
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={e => {
                                const next = [...activeBomItems];
                                const q = Number(e.target.value) || 1;
                                next[idx].quantity = q;
                                next[idx].estimatedTotalCost = q * (Number(next[idx].estimatedUnitCost) || 0);
                                setActiveBomItems(next);
                              }}
                              className="w-20 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-center text-slate-900 focus:outline-hidden focus:border-emerald-500"
                            />
                          )}
                        </td>

                        {/* EST. UNIT RATE */}
                        <td className="p-3 text-right font-mono min-w-[120px]">
                          {isLocked ? (
                            <span className="font-mono text-slate-700 text-xs">₹{(Number(item.estimatedUnitCost) || 0).toLocaleString('en-IN')}</span>
                          ) : (
                            <input
                              type="number"
                              value={item.estimatedUnitCost}
                              onChange={e => {
                                const next = [...activeBomItems];
                                const c = Number(e.target.value) || 0;
                                next[idx].estimatedUnitCost = c;
                                next[idx].estimatedTotalCost = (Number(next[idx].quantity) || 1) * c;
                                setActiveBomItems(next);
                              }}
                              className="w-24 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-right font-mono focus:outline-hidden focus:border-emerald-500"
                              placeholder="₹ Rate"
                            />
                          )}
                        </td>

                        {/* TOTAL AMOUNT */}
                        <td className="p-3 text-right font-bold text-slate-900 font-mono text-xs min-w-[120px]">
                          ₹{Number(item.estimatedTotalCost || 0).toLocaleString('en-IN')}
                        </td>

                        {/* ACTION */}
                        <td className="p-3 text-center">
                          {isLocked ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">
                              🔒 Locked
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setActiveBomItems(activeBomItems.filter((_, i) => i !== idx))}
                              className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-xl transition-colors cursor-pointer"
                              title="Delete Item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 border-t border-slate-200 font-bold text-xs">
                    {!isLocked && (
                      <tr className="bg-white border-t border-slate-200">
                        <td colSpan={7} className="p-3.5">
                          <div className="flex items-center gap-2.5">
                            <button
                              type="button"
                              onClick={handleAddCustomItem}
                              className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                              title="Add custom line item with empty fields"
                            >
                              <Plus className="w-4 h-4 text-emerald-600" />
                              <span>+ Add Custom Item</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowNewCategoryModal(true)}
                              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                              title="Create and add a new material category"
                            >
                              <Layers className="w-4 h-4 text-slate-600" />
                              <span>+ New Category</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                    <tr>
                      <td colSpan={5} className="p-4 text-right uppercase tracking-wider text-slate-600 text-xs">
                        Total Estimated BOM Equipment Cost:
                      </td>
                      <td className="p-4 text-right text-emerald-700 font-mono text-base">
                        ₹{totalBomValue.toLocaleString('en-IN')}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Bottom Actions Bar */}
              {isLocked ? (
                <div className="p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="text-slate-600 text-xs flex items-center gap-2">
                    <span className="font-bold text-slate-900">
                      {activeBomStatus === 'Approved' ? '✅ Status: Technical Specifications Approved by PM' : '🔒 Status: Awaiting PM Review'}
                    </span>
                    <span>• Read-only inspection mode</span>
                  </div>
                  <div>
                    <button
                      onClick={() => setSelectedSurveyId(null)}
                      className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs transition-colors"
                    >
                      Back to Completed Surveys List
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="text-slate-500 text-xs space-y-0.5">
                    <p className="font-bold text-slate-800">Ready to Submit?</p>
                    <p>Submitting this Bill of Materials stages it for Project Manager technical verification (without pricing visible to PM).</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSelectedSurveyId(null)}
                      className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs cursor-pointer"
                    >
                      Cancel &amp; Close
                    </button>
                    <button
                      onClick={handleSaveDraft}
                      disabled={isSaving}
                      className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs cursor-pointer"
                    >
                      {isSaving ? 'Saving...' : 'Save Draft'}
                    </button>
                    <button
                      onClick={handleSubmitToPm}
                      disabled={isSubmitting}
                      className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs flex items-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      <span>{isSubmitting ? 'Submitting...' : 'Submit BOM to Project Manager'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      )}
    </div>
  );
};
