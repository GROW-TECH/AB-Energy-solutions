import React, { useState, useEffect, useRef } from 'react';
import { 
  X, UserPlus, Phone, Mail, MapPin, Building2, 
  CheckCircle, AlertCircle, ArrowRight, Sun, Compass,
  Sparkles, Calendar, Clock, UserCheck, ShieldCheck,
  CheckCircle2, Info, Loader2, RotateCcw
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { LeadSource, Priority, CustomerApplicationType, SolarSystemType } from '../../types';

interface NewLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PriorityRecommendation {
  recommendedPriority: Priority;
  explanation: string;
  followUpTarget: string;
  estimatedKw: number;
  score: number;
}

export const NewLeadModal: React.FC<NewLeadModalProps> = ({ isOpen, onClose }) => {
  const { createLead, qualifyLead, leads, employees, authFetch, currentUser, surveys } = useCrm();

  const salesExecutives = employees.filter(e => e.role === 'Sales Executive' && e.status !== 'Inactive');
  const isExecutive = currentUser?.role === 'Sales Executive';
  const [assignedToId, setAssignedToId] = useState<string>(() => {
    return isExecutive ? (currentUser?.employeeId || currentUser?.id || 'auto') : 'auto';
  });

  // 1. Contact & Site Details (NO pre-filled fake defaults)
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [address, setAddress] = useState('');
  const [pincode, setPincode] = useState('');
  const [customerType, setCustomerType] = useState<CustomerApplicationType>('Residential');
  const [systemType, setSystemType] = useState<SolarSystemType>('On-Grid');
  const [formError, setFormError] = useState<string | null>(null);
  const [monthlyBill, setMonthlyBill] = useState<number | ''>('');
  const [sanctionLoad, setSanctionLoad] = useState<number | ''>('');
  const [roofAreaSqFt, setRoofAreaSqFt] = useState<number | ''>('');
  const [roofType, setRoofType] = useState<'RCC Flat' | 'Tin Shed' | 'Tiled' | 'Elevated Structure'>('RCC Flat');
  const [source, setSource] = useState<LeadSource>('Website');
  const [buyingIntent, setBuyingIntent] = useState<'Immediate (< 15 days)' | '1-2 months' | 'Budgetary / Researching' | 'Future (> 3 months)'>('Immediate (< 15 days)');
  const [notes, setNotes] = useState('');

  // 2. Priority Recommendation State
  const [priority, setPriority] = useState<Priority>('Medium');
  const [recommendation, setRecommendation] = useState<PriorityRecommendation | null>(null);
  const [isEvaluatingPriority, setIsEvaluatingPriority] = useState<boolean>(false);
  const [hasManualPriorityOverride, setHasManualPriorityOverride] = useState<boolean>(false);
  const [priorityOverrideReason, setPriorityOverrideReason] = useState<string>('');

  // 3. Site Survey Scheduling State
  const [scheduleSurveyNow, setScheduleSurveyNow] = useState(false);
  const [surveyDate, setSurveyDate] = useState(() => {
    const d = new Date(Date.now() + 86400000 * 2);
    return d.toISOString().split('T')[0];
  });
  const [surveyTime, setSurveyTime] = useState('10:00 AM - 12:00 PM');
  const [surveyEngineerId, setSurveyEngineerId] = useState<string>('');
  const [surveyNotes, setSurveyNotes] = useState('');

  // 4. Submission & State Guards
  const [isSubmitting, setIsSubmitting] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Available Survey Engineers
  const surveyEngineers = employees.filter(e => e.role === 'Survey Engineer');

  // Initialize default survey engineer if available
  useEffect(() => {
    if (surveyEngineers.length > 0 && !surveyEngineerId) {
      setSurveyEngineerId(surveyEngineers[0].id);
    }
  }, [surveyEngineers, surveyEngineerId]);

  // Phone sanitization: strictly digits only, maximum 10 digits
  const handlePhoneChange = (val: string) => {
    const digitsOnly = val.replace(/\D/g, '').slice(0, 10);
    setPhone(digitsOnly);
  };

  // Preliminary Solar Sizing calculation (Dynamic based on user input)
  const numBill = Number(monthlyBill) || 0;
  const numLoad = Number(sanctionLoad) || 0;
  const calculatedUnitsPerMonth = numBill > 0 ? Math.round(numBill / 8) : 0;
  const calculatedKw = Math.max(
    numLoad > 0 ? numLoad : 0,
    calculatedUnitsPerMonth > 0 ? Math.round(calculatedUnitsPerMonth / 120) : 0
  ) || (numBill > 0 || numLoad > 0 ? 3 : 0);

  const estimatedCost = calculatedKw * 60000;
  const estimatedSubsidy = calculatedKw > 0 ? (calculatedKw <= 3 ? 78000 : 78000) : 0;
  const netEstimatedCost = Math.max(0, estimatedCost - estimatedSubsidy);

  // Duplicate Check against existing leads by 10-digit phone or email
  const isDuplicate = phone.length === 10
    ? leads.some(l => {
        const lClean = l.phone.replace(/\D/g, '');
        return lClean.length >= 10 && lClean.endsWith(phone);
      })
    : false;

  const existingLead = isDuplicate
    ? leads.find(l => l.phone.replace(/\D/g, '').endsWith(phone))
    : undefined;

  // Lead Qualification Verification for Site Survey
  const isQualified = Boolean(
    name.trim().length >= 2 &&
    phone.length === 10 &&
    !isDuplicate &&
    (numBill > 0 || numLoad > 0) &&
    (city.trim().length > 0 || address.trim().length > 0)
  );

  const qualificationGaps: string[] = [];
  if (name.trim().length < 2) qualificationGaps.push('Valid customer/entity name');
  if (phone.length !== 10) qualificationGaps.push('Full 10-digit mobile number');
  if (numBill <= 0 && numLoad <= 0) qualificationGaps.push('Monthly bill or sanctioned load');
  if (city.trim().length === 0 && address.trim().length === 0) qualificationGaps.push('City or site address');

  // Debounced Backend-Driven Priority Recommendation
  useEffect(() => {
    if (!isOpen) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      setIsEvaluatingPriority(true);
      try {
        const res = await authFetch('/api/leads/recommend-priority', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            monthlyBill: numBill,
            sanctionLoad: numLoad,
            roofAreaSqFt: Number(roofAreaSqFt) || 0,
            roofType,
            buyingIntent,
            source,
            notes,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data) {
            setRecommendation(data.data);
            // If the sales executive hasn't manually overridden the priority, auto-sync
            if (!hasManualPriorityOverride) {
              setPriority(data.data.recommendedPriority);
            }
          }
        }
      } catch (err) {
        console.warn('Could not fetch backend priority recommendation:', err);
      } finally {
        setIsEvaluatingPriority(false);
      }
    }, 350);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [numBill, numLoad, roofAreaSqFt, roofType, buyingIntent, source, notes, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Mandatory Frontend Validations: Name, Phone (10 digits), and Pincode
    if (!name.trim()) {
      setFormError('Customer / Entity Name is mandatory.');
      return;
    }
    if (phone.length !== 10) {
      setFormError('A valid 10-digit Mobile Number is mandatory.');
      return;
    }
    if (!pincode.trim()) {
      setFormError('Pincode is mandatory.');
      return;
    }
    if (isDuplicate) {
      setFormError(`Duplicate lead: A lead with phone ${phone} already exists.`);
      return;
    }
    if (isSubmitting) return;

    // If survey is requested, confirm qualification
    if (scheduleSurveyNow && !isQualified) {
      alert(`Please complete the required qualification fields before scheduling a site survey:\n• ${qualificationGaps.join('\n• ')}`);
      return;
    }

    setIsSubmitting(true);

    try {
      const selectedEng = surveyEngineers.find(e => e.id === surveyEngineerId) || surveyEngineers[0];
      const selectedRep = salesExecutives.find(e => e.id === assignedToId || e.name === assignedToId);
      const newSurveyId = scheduleSurveyNow && isQualified 
        ? `SRV-2026-${String(surveys.length + 1).padStart(3, '0')}` 
        : undefined;

      // 1. Create Lead with executive's final chosen priority, customerType, systemType, assignment, and metadata
      const created = createLead({
        name: name.trim(),
        phone,
        email: email.trim(),
        city: city.trim(),
        state: state.trim(),
        address: address.trim(),
        pincode: pincode.trim(),
        customerType,
        systemType,
        monthlyBill: numBill,
        sanctionLoad: numLoad,
        roofAreaSqFt: Number(roofAreaSqFt) || 0,
        roofType,
        source,
        priority,
        recommendedPriority: recommendation?.recommendedPriority,
        priorityOverrideReason: hasManualPriorityOverride && priority !== recommendation?.recommendedPriority ? priorityOverrideReason : undefined,
        buyingIntent,
        notes: notes.trim(),
        assignedToId: assignedToId !== 'auto' ? assignedToId : undefined,
        assignedToName: selectedRep ? selectedRep.name : undefined,
        status: newSurveyId ? 'Site Survey Scheduled' : 'New',
        surveyId: newSurveyId,
      });

      // 2. Schedule Site Survey if explicitly enabled & verified
      if (scheduleSurveyNow && isQualified) {
        qualifyLead(created.id, {
          engineerId: selectedEng?.id,
          engineerName: selectedEng?.name,
          scheduledDate: surveyDate,
          scheduledTime: surveyTime,
          notes: surveyNotes.trim(),
          leadData: { ...created, surveyId: newSurveyId, status: 'Site Survey Scheduled' },
        });
      }

      resetForm();
      onClose();
    } catch (err: any) {
      console.error('Failed to create lead:', err);
      setFormError(err.message || 'Failed to create lead');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setName('');
    setPhone('');
    setEmail('');
    setCity('');
    setState('');
    setAddress('');
    setPincode('');
    setCustomerType('Residential');
    setSystemType('On-Grid');
    setFormError(null);
    setMonthlyBill('');
    setSanctionLoad('');
    setRoofAreaSqFt('');
    setRoofType('RCC Flat');
    setSource('Website');
    setBuyingIntent('Immediate (< 15 days)');
    setNotes('');
    setPriority('Medium');
    setRecommendation(null);
    setHasManualPriorityOverride(false);
    setPriorityOverrideReason('');
    setScheduleSurveyNow(false);
    setSurveyNotes('');
    setAssignedToId(isExecutive ? (currentUser?.employeeId || currentUser?.id || 'auto') : 'auto');
  };


  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150 font-sans">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between border-b border-slate-700/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold">New Solar Lead Entry</h2>
              <p className="text-[11px] text-slate-300">Automated lead qualification &amp; intelligent priority sizing</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={resetForm}
              className="flex items-center gap-1 px-2.5 py-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition-colors cursor-pointer"
              title="Clear all form fields and start fresh"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear Form</span>
            </button>
            <button 
              onClick={handleClose}
              type="button"
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs">
          {/* Duplicate Phone Warning */}
          {isDuplicate && existingLead && (
            <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl flex items-start gap-2.5 text-xs text-rose-900 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="font-bold flex items-center justify-between">
                  <span>Duplicate Contact Detected</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 bg-rose-200/60 rounded text-rose-900">
                    {existingLead.id}
                  </span>
                </div>
                <p className="text-[11px] text-rose-800 leading-snug mt-0.5">
                  A solar inquiry already exists for <strong>{existingLead.name}</strong> ({existingLead.phone}). 
                  Current Stage: <span className="font-semibold text-slate-900">{existingLead.status}</span>.
                </p>
              </div>
            </div>
          )}

          {/* Dynamic Solar Sizing Card */}
          {calculatedKw > 0 && (
            <div className="p-3.5 bg-emerald-50/80 border border-emerald-200/80 rounded-xl space-y-2 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Sun className="w-3.5 h-3.5 text-emerald-600" />
                  Preliminary Solar Recommendation
                </span>
                <span className="px-2.5 py-0.5 bg-emerald-600 text-white font-bold rounded-md text-xs shadow-2xs">
                  {calculatedKw} kW Plant
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center pt-1 text-slate-700">
                <div className="bg-white/90 p-2 rounded-lg border border-emerald-100 shadow-2xs">
                  <div className="text-[10px] text-slate-500">Est. Generation</div>
                  <div className="font-bold text-slate-900">{calculatedKw * 120} kWh/mo</div>
                </div>
                <div className="bg-white/90 p-2 rounded-lg border border-emerald-100 shadow-2xs">
                  <div className="text-[10px] text-slate-500">Govt Subsidy</div>
                  <div className="font-bold text-emerald-700">₹{estimatedSubsidy.toLocaleString('en-IN')}</div>
                </div>
                <div className="bg-white/90 p-2 rounded-lg border border-emerald-100 shadow-2xs">
                  <div className="text-[10px] text-slate-500">Net Investment</div>
                  <div className="font-bold text-slate-900">₹{netEstimatedCost.toLocaleString('en-IN')}</div>
                </div>
              </div>
            </div>
          )}

          {/* Form Error Banner */}
          {formError && (
            <div className="p-3 bg-red-50 border border-red-300 rounded-xl flex items-center gap-2 text-xs text-red-800 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span className="font-semibold">{formError}</span>
            </div>
          )}

          {/* Contact Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Full Name / Entity Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Sivaram Krishnan"
                value={name}
                onChange={e => { setName(e.target.value); if (formError) setFormError(null); }}
                className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden placeholder:text-slate-400"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold text-slate-700">
                  Mobile Number *
                </label>
                <span className={`text-[10px] font-mono font-medium ${phone.length === 10 ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                  {phone.length}/10 digits
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-semibold pointer-events-none">+91</span>
                <input
                  type="tel"
                  required
                  placeholder="9845012345"
                  value={phone}
                  onChange={e => { handlePhoneChange(e.target.value); if (formError) setFormError(null); }}
                  className={`w-full text-xs p-2.5 pl-11 bg-white border rounded-lg focus:ring-2 focus:outline-hidden placeholder:text-slate-400 ${
                    isDuplicate 
                      ? 'border-rose-400 focus:ring-rose-400 bg-rose-50/30' 
                      : phone.length === 10
                      ? 'border-emerald-400 focus:ring-emerald-500'
                      : 'border-slate-300 focus:ring-emerald-500'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Customer / Application Type & Solar System Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Customer / Application Type *
              </label>
              <select
                value={customerType}
                onChange={e => setCustomerType(e.target.value as CustomerApplicationType)}
                className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-medium"
              >
                <option value="Home">Home</option>
                <option value="Residential">Residential</option>
                <option value="Commercial">Commercial</option>
                <option value="Industrial">Industrial</option>
                <option value="Water Pump">Water Pump</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Solar System Type *
              </label>
              <select
                value={systemType}
                onChange={e => setSystemType(e.target.value as SolarSystemType)}
                className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-medium"
              >
                <option value="On-Grid">On-Grid</option>
                <option value="Off-Grid">Off-Grid</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                placeholder="sivaram@gmail.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Lead Source
              </label>
              <select
                value={source}
                onChange={e => setSource(e.target.value as LeadSource)}
                className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-medium"
              >
                <option value="Website">Website Inbound</option>
                <option value="WhatsApp">WhatsApp Inbound</option>
                <option value="Referral">Customer Referral</option>
                <option value="Facebook Ads">Facebook / Meta Ads</option>
                <option value="Google Ads">Google Search Ads</option>
                <option value="PM Surya Ghar Portal">PM Surya Ghar Portal</option>
                <option value="Walk-in">Direct Walk-in / Expo</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>Assigned Executive</span>
                {isExecutive && <span className="text-[10px] text-emerald-600 font-semibold">Your Account</span>}
              </label>
              {isExecutive ? (
                <div className="w-full text-xs p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg font-bold text-emerald-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="truncate">{currentUser?.name} (Assigned to You)</span>
                </div>
              ) : (
                <select
                  value={assignedToId}
                  onChange={e => setAssignedToId(e.target.value)}
                  className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-medium text-slate-800"
                >
                  <option value="auto">⚡ Auto-Assign (Lowest Lead Count)</option>
                  {salesExecutives.map(exec => {
                    const activeCount = leads.filter(l => 
                      (l.assignedToId === exec.id || l.assignedToId === exec.employeeId || l.assignedToName?.toLowerCase() === exec.name.toLowerCase()) && 
                      l.status !== 'Lost'
                    ).length;
                    return (
                      <option key={exec.id} value={exec.id}>
                        {exec.name} ({activeCount} active {activeCount === 1 ? 'lead' : 'leads'})
                      </option>
                    );
                  })}
                </select>
              )}
            </div>
          </div>


          {/* Energy & Site Sizing Parameters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Monthly Bill (₹ INR)
              </label>
              <input
                type="number"
                min={0}
                step={500}
                placeholder="e.g. 14500"
                value={monthlyBill === '' ? '' : monthlyBill}
                onChange={e => setMonthlyBill(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Sanctioned Load (kW)
              </label>
              <input
                type="number"
                min={0}
                placeholder="e.g. 15"
                value={sanctionLoad === '' ? '' : sanctionLoad}
                onChange={e => setSanctionLoad(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Roof Area (Sq. Ft.)
              </label>
              <input
                type="number"
                min={0}
                step={50}
                placeholder="e.g. 1500"
                value={roofAreaSqFt === '' ? '' : roofAreaSqFt}
                onChange={e => setRoofAreaSqFt(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Roof Type
              </label>
              <select
                value={roofType}
                onChange={e => setRoofType(e.target.value as any)}
                className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-medium"
              >
                <option value="RCC Flat">RCC Flat Roof</option>
                <option value="Tin Shed">Tin Shed / Metal Sheet</option>
                <option value="Tiled">Clay Tiled / Slanted</option>
                <option value="Elevated Structure">Elevated Super Structure</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Buying Intent / Timeline
              </label>
              <select
                value={buyingIntent}
                onChange={e => setBuyingIntent(e.target.value as any)}
                className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-medium"
              >
                <option value="Immediate (< 15 days)">Immediate (&lt; 15 days)</option>
                <option value="1-2 months">1–2 Months</option>
                <option value="Budgetary / Researching">Budgetary / Researching</option>
                <option value="Future (> 3 months)">Future (&gt; 3 months)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                City / Town
              </label>
              <input
                type="text"
                placeholder="e.g. Coimbatore"
                value={city}
                onChange={e => setCity(e.target.value)}
                className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                State
              </label>
              <input
                type="text"
                placeholder="e.g. Tamil Nadu"
                value={state}
                onChange={e => setState(e.target.value)}
                className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Pincode *
              </label>
              <input
                type="text"
                required
                maxLength={6}
                placeholder="e.g. 641001"
                value={pincode}
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setPincode(val);
                  if (formError) setFormError(null);
                }}
                className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden placeholder:text-slate-400"
              />
            </div>
          </div>


          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Site Address &amp; Landmarks
            </label>
            <input
              type="text"
              placeholder="#42, 2nd Main, Indiranagar, Near BDA Complex"
              value={address}
              onChange={e => setAddress(e.target.value)}
              className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden placeholder:text-slate-400"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Customer Requirements / Notes
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Looking for rooftop solar to reduce commercial tariff, wants DCR modules..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden placeholder:text-slate-400"
            />
          </div>

          {/* ============================================================== */}
          {/* SECTION 1 & 2: BACKEND-DRIVEN LEAD PRIORITY RECOMMENDATION     */}
          {/* ============================================================== */}
          <div className="p-3.5 bg-slate-900 text-white rounded-xl border border-slate-800 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
                  CRM Priority Recommendation
                </span>
              </div>
              {isEvaluatingPriority ? (
                <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold animate-pulse">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Evaluating criteria...</span>
                </div>
              ) : recommendation ? (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  recommendation.recommendedPriority === 'Urgent'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : recommendation.recommendedPriority === 'High'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : recommendation.recommendedPriority === 'Medium'
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                    : 'bg-slate-700 text-slate-300 border border-slate-600'
                }`}>
                  Recommended: {recommendation.recommendedPriority}
                </span>
              ) : null}
            </div>

            {recommendation ? (
              <>
                <p className="text-xs text-slate-200 leading-snug">
                  &ldquo;{recommendation.explanation}&rdquo;
                </p>
                <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-1 text-[10px] text-slate-400">
                  <span>Target Response SLA: <strong className="text-emerald-400">{recommendation.followUpTarget}</strong></span>
                  {hasManualPriorityOverride && (
                    <span className="text-amber-400 font-medium flex items-center gap-1">
                      <span>Manual override active</span>
                    </span>
                  )}
                </div>
              </>
            ) : (
              <p className="text-[11px] text-slate-400">
                Enter monthly electricity bill or load above to generate smart priority recommendation.
              </p>
            )}

            {/* Sales Executive Final Priority Control */}
            <div className="pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-bold text-slate-200 uppercase tracking-wider">
                  Final Priority — Confirm or Change
                </label>
                {hasManualPriorityOverride && recommendation && (
                  <button
                    type="button"
                    onClick={() => {
                      setPriority(recommendation.recommendedPriority);
                      setHasManualPriorityOverride(false);
                      setPriorityOverrideReason('');
                    }}
                    className="text-[10px] text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset to Recommended ({recommendation.recommendedPriority})</span>
                  </button>
                )}
              </div>
              <select
                value={priority}
                onChange={e => {
                  setPriority(e.target.value as Priority);
                  setHasManualPriorityOverride(true);
                }}
                className="w-full text-xs p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden cursor-pointer"
              >
                <option value="Urgent">Urgent (High Capacity 20kW+ / Immediate Intent)</option>
                <option value="High">High (Substantial Bill ₹10k+ / Ready Feasibility)</option>
                <option value="Medium">Medium (Standard PM Surya Ghar Residential)</option>
                <option value="Low">Low (Early Stage / Researching / Future)</option>
              </select>
            </div>

            {/* Optional Override Reason input when executive overrides recommendation */}
            {hasManualPriorityOverride && recommendation && priority !== recommendation.recommendedPriority && (
              <div className="pt-1 animate-in fade-in duration-150">
                <label className="block text-[10px] font-semibold text-amber-300 mb-1">
                  Override Reason (Recorded in audit logs)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Customer requested immediate emergency proposal within 24 hours"
                  value={priorityOverrideReason}
                  onChange={e => setPriorityOverrideReason(e.target.value)}
                  className="w-full text-xs p-2 bg-slate-800/90 border border-amber-500/50 rounded-lg text-slate-200 focus:ring-1 focus:ring-amber-500 placeholder:text-slate-500"
                />
              </div>
            )}
          </div>

          {/* ============================================================== */}
          {/* SECTION 3: REDESIGNED SITE-SURVEY SCHEDULING WORKFLOW         */}
          {/* ============================================================== */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-emerald-600" />
                  <span>Schedule a Site Survey</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Schedule a site visit after confirming that the lead is qualified and ready for a survey.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                <input 
                  type="checkbox" 
                  checked={scheduleSurveyNow} 
                  onChange={e => setScheduleSurveyNow(e.target.checked)} 
                  className="sr-only peer" 
                />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {/* When Survey is enabled, render qualification validation & dispatch settings */}
            {scheduleSurveyNow && (
              <div className="pt-2 border-t border-slate-200 space-y-3 animate-in fade-in duration-150">
                {/* Qualification Status Badge */}
                {isQualified ? (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-lg flex items-center gap-2 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-semibold">
                      Lead Qualification Passed — Customer contact, electricity bill, and address verified for on-site audit.
                    </span>
                  </div>
                ) : (
                  <div className="p-2.5 bg-amber-50 border border-amber-300 text-amber-900 rounded-lg text-xs space-y-1">
                    <div className="font-bold flex items-center gap-1.5 text-amber-800">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Qualification Incomplete — Complete before scheduling:</span>
                    </div>
                    <ul className="list-disc list-inside text-[11px] text-amber-800 pl-1 space-y-0.5">
                      {qualificationGaps.map(gap => (
                        <li key={gap}>{gap}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Survey Dispatch Settings */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                      Assigned Survey Engineer
                    </label>
                    <select
                      value={surveyEngineerId}
                      onChange={e => setSurveyEngineerId(e.target.value)}
                      className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-medium"
                    >
                      {surveyEngineers.map(eng => (
                        <option key={eng.id} value={eng.id}>
                          {eng.name} ({eng.activeLeadsCount || 3} active audits)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                      Proposed Visit Date
                    </label>
                    <input
                      type="date"
                      value={surveyDate}
                      onChange={e => setSurveyDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-emerald-600" />
                      Visit Time Slot
                    </label>
                    <select
                      value={surveyTime}
                      onChange={e => setSurveyTime(e.target.value)}
                      className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-medium"
                    >
                      <option value="10:00 AM - 12:00 PM">10:00 AM – 12:00 PM (Morning Audit)</option>
                      <option value="12:00 PM - 02:00 PM">12:00 PM – 02:00 PM (Midday Solar Azimuth)</option>
                      <option value="02:00 PM - 04:00 PM">02:00 PM – 04:00 PM (Afternoon Audit)</option>
                      <option value="04:00 PM - 06:00 PM">04:00 PM – 06:00 PM (Late Afternoon)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                      Destination Confirmation
                    </label>
                    <div className="p-2 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-700 truncate font-medium">
                      {address ? `${address}${city ? ', ' + city : ''}` : city ? city : 'Address entered above will be confirmed'}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Special Survey Instructions
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Bring laser meter, check for 3-phase LT meter on ground floor"
                    value={surveyNotes}
                    onChange={e => setSurveyNotes(e.target.value)}
                    className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-400"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isDuplicate || isSubmitting || phone.length !== 10 || !name.trim()}
              className={`px-5 py-2.5 text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-1.5 ${
                isDuplicate || isSubmitting || phone.length !== 10 || !name.trim()
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed' 
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer transform hover:scale-[1.01] active:scale-[0.99]'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing Lead &amp; Automations...</span>
                </>
              ) : isDuplicate ? (
                <span>Duplicate Contact — Cannot Add</span>
              ) : (
                <>
                  <span>Save &amp; Trigger Automation</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
