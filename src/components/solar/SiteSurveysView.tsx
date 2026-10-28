import React, { useState, useEffect, useRef } from 'react';
import { 
  Compass, Plus, Search, Filter, Camera, CheckCircle2, 
  MapPin, Phone, ArrowRight, Sun, FileCheck, X, 
  Upload, AlertTriangle, Layers, Calendar, User, Eye, Check,
  ArrowLeft, CheckCircle, Clock, Save, Send, AlertCircle,
  Trash2, RefreshCw, ShieldAlert, FileText, ChevronRight,
  Info, ExternalLink, HelpCircle, Edit3, Lock, Zap, ShieldCheck
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { SiteSurvey, SurveyPhoto, SurveyPhotoCategory, SurveyStatus, BomItem } from '../../types';

interface SiteSurveysViewProps {
  onNavigateToQuotation: (leadId: string) => void;
  onNavigateToBom?: (surveyId?: string) => void;
  onAuditModeChange?: (isAuditing: boolean) => void;
}

// =========================================================================
// LIVE CAMERA MODAL: High-performance viewfinder with flip, grid & fallback
// =========================================================================
interface LiveCameraModalProps {
  isOpen: boolean;
  title: string;
  initialFacingMode?: 'user' | 'environment';
  onCapture: (base64Data: string) => void;
  onClose: () => void;
}

export const LiveCameraModal: React.FC<LiveCameraModalProps> = ({
  isOpen,
  title,
  initialFacingMode = 'environment',
  onCapture,
  onClose,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nativeInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [facingMode, setFacingMode] = useState<'user' | 'environment'>(initialFacingMode);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isStartingCamera, setIsStartingCamera] = useState<boolean>(true);

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  };

  const startCamera = async (facing: 'user' | 'environment') => {
    stopStream();
    setIsStartingCamera(true);
    setCameraError(null);
    setCapturedImage(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Live camera stream is not supported in this browser environment. You can use your device native camera or file selector below.');
      setIsStartingCamera(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(e => console.warn('Play error:', e));
      }
    } catch (err: any) {
      console.warn('getUserMedia error:', err);
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        streamRef.current = fallbackStream;
        if (videoRef.current) {
          videoRef.current.srcObject = fallbackStream;
          await videoRef.current.play().catch(e => console.warn('Play error:', e));
        }
      } catch (fbErr: any) {
        console.warn('Fallback getUserMedia failed:', fbErr);
        setCameraError(
          err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
            ? 'Camera permission denied. Please allow camera access in browser permissions, or use native device camera below.'
            : 'Unable to open camera feed. Please use the device native camera / file selector below.'
        );
      }
    } finally {
      setIsStartingCamera(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setFacingMode(initialFacingMode);
      setCapturedImage(null);
      startCamera(initialFacingMode);
    } else {
      stopStream();
    }
    return () => {
      stopStream();
    };
  }, [isOpen, initialFacingMode]);

  const handleFlipCamera = () => {
    const nextFacing = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextFacing);
    startCamera(nextFacing);
  };

  const handleSnap = () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
    setCapturedImage(dataUrl);
    stopStream();
  };

  const handleRetake = () => {
    setCapturedImage(null);
    startCamera(facingMode);
  };

  const handleConfirm = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      stopStream();
      onClose();
    }
  };

  const handleNativeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const b64 = reader.result as string;
        onCapture(b64);
        stopStream();
        onClose();
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-4 py-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <Camera className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide truncate max-w-[260px] sm:max-w-md">
                {title}
              </h3>
              <span className="text-[10px] text-slate-400">
                {facingMode === 'user' ? 'Front / Selfie Camera' : 'Rear / Environment Camera'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!capturedImage && !cameraError && (
              <button
                type="button"
                onClick={handleFlipCamera}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                title="Switch front / rear camera"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Flip Camera</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                stopStream();
                onClose();
              }}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Viewfinder area */}
        <div className="relative flex-1 bg-black min-h-[320px] sm:min-h-[420px] flex items-center justify-center overflow-hidden">
          {capturedImage ? (
            <div className="relative w-full h-full flex items-center justify-center bg-black">
              <img
                src={capturedImage}
                alt="Captured snapshot"
                className="max-h-[60vh] w-auto object-contain mx-auto"
              />
              <div className="absolute top-3 left-3 px-2.5 py-1 bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 rounded-full text-[10px] font-bold flex items-center gap-1.5 shadow-lg">
                <Check className="w-3.5 h-3.5" />
                <span>Photo Captured Ready</span>
              </div>
            </div>
          ) : cameraError ? (
            <div className="p-6 text-center max-w-md space-y-4">
              <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-white font-bold text-sm">Camera Stream Notice</h4>
                <p className="text-xs text-slate-400">{cameraError}</p>
              </div>
              <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
                <button
                  type="button"
                  onClick={() => nativeInputRef.current?.click()}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-lg"
                >
                  <Camera className="w-4 h-4" />
                  <span>Use Device Camera / Upload</span>
                </button>
                <button
                  type="button"
                  onClick={() => startCamera(facingMode)}
                  className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                playsInline
                autoPlay
                muted
                className={`w-full h-full object-cover max-h-[60vh] ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
              />

              {/* Framing guidelines overlay */}
              <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4">
                <div className="grid grid-cols-3 grid-rows-3 w-full h-full border border-white/20 rounded-xl overflow-hidden">
                  <div className="border-r border-b border-white/10" />
                  <div className="border-r border-b border-white/10" />
                  <div className="border-b border-white/10" />
                  <div className="border-r border-b border-white/10" />
                  <div className="border-r border-b border-white/10" />
                  <div className="border-b border-white/10" />
                  <div className="border-r border-white/10" />
                  <div className="border-r border-white/10" />
                  <div />
                </div>
                <div className="absolute bottom-2 left-0 right-0 text-center">
                  <span className="px-3 py-1 bg-black/60 backdrop-blur-xs text-[10px] text-slate-300 rounded-full font-medium">
                    Frame object inside guide and tap capture
                  </span>
                </div>
              </div>

              {isStartingCamera && (
                <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center">
                  <div className="flex items-center gap-2 text-white text-xs">
                    <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                    <span>Connecting camera feed...</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Controls Footer */}
        <div className="px-4 py-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => nativeInputRef.current?.click()}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
            title="Alternative: Select from device file storage"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="text-[11px] sm:text-xs">Device Files</span>
          </button>

          {capturedImage ? (
            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={handleRetake}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retake</span>
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-lg transition-colors"
              >
                <Check className="w-4 h-4" />
                <span>Accept &amp; Use Photo</span>
              </button>
            </div>
          ) : !cameraError ? (
            <div className="flex-1 flex justify-center">
              <button
                type="button"
                onClick={handleSnap}
                disabled={isStartingCamera}
                className="w-14 h-14 rounded-full border-4 border-white/80 hover:border-white bg-red-600 hover:bg-red-500 active:scale-95 transition-all flex items-center justify-center shadow-xl cursor-pointer disabled:opacity-50"
                title="Snap photo"
              >
                <div className="w-10 h-10 rounded-full bg-white/90" />
              </button>
            </div>
          ) : null}

          {/* Hidden fallback native file / camera input */}
          <input
            ref={nativeInputRef}
            type="file"
            accept="image/*"
            capture={facingMode}
            className="hidden"
            onChange={handleNativeFileChange}
          />
        </div>
      </div>
    </div>
  );
};

// 9 Standard Solar Site Audit Photographic Categories
const PHOTO_CATEGORIES: { key: SurveyPhotoCategory; label: string; mandatory: boolean; hint: string }[] = [
  { key: 'full_rooftop_view', label: '1. Full Rooftop View', mandatory: true, hint: 'Wide angle showing overall roof geometry & sun path' },
  { key: 'mounting_area', label: '2. Mounting Surface & Slab', mandatory: true, hint: 'Close-up of slab quality, surface texture & slope' },
  { key: 'water_tank_obstacles', label: '3. Water Tank & Obstacles', mandatory: false, hint: 'Tanks, mumty room, AC units, vents, and shade sources' },
  { key: 'main_electricity_meter', label: '4. Main Electricity Meter', mandatory: true, hint: 'DISCOM bidirectional meter display & tariff label' },
  { key: 'distribution_board', label: '5. Main LT / AC Distribution Board', mandatory: false, hint: 'Breakers, MCB/MCCB ratings & spare slots' },
  { key: 'earthing_arrangement', label: '6. Earthing Pit Site & Soil', mandatory: false, hint: 'Proposed chemical earthing pit locations & soil type' },
  { key: 'cable_route_inverter', label: '7. Cable Route & Inverter Spot', mandatory: false, hint: 'Wall space for inverter & vertical DC/AC cable run' },
  { key: 'roof_damage_concerns', label: '8. Roof Damage / Crack Concerns', mandatory: false, hint: 'Visible structural cracks, seepage, or dampness' },
  { key: 'additional_evidence', label: '9. Additional Field Evidence', mandatory: false, hint: 'Nearby trees, neighbor building heights, or road access' }
];

export const SiteSurveysView: React.FC<SiteSurveysViewProps> = ({ onNavigateToQuotation, onNavigateToBom, onAuditModeChange }) => {
  const { 
    surveys, 
    leads, 
    currentUser,
    activeRole,
    previewRole,
    saveSurveyDraft, 
    uploadSurveyPhoto, 
    deleteSurveyPhoto, 
    submitSurveyForReview, 
    reviewSurveyAction, 
    rescheduleSurveyAction,
    deleteSiteSurvey,
    createSiteSurvey,
    authFetch 
  } = useCrm();

  const currentRole = currentUser?.role || previewRole || activeRole;
  const isReviewer = currentRole === 'Project Manager' || currentRole === 'Sales Manager' || currentRole === 'Super Admin';

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(() => {
    const hasReview = surveys.some(s => s.status === 'Submitted for Review');
    return isReviewer && hasReview ? 'Submitted for Review' : 'All';
  });
  const [activeViewMode, setActiveViewMode] = useState<'grid' | 'audit'>('grid');
  const [selectedSurveyId, setSelectedSurveyId] = useState<string>(surveys[0]?.id || '');

  // Delete survey modal & state
  const [surveyToDelete, setSurveyToDelete] = useState<SiteSurvey | null>(null);
  const [isDeletingSurvey, setIsDeletingSurvey] = useState<boolean>(false);
  const [deleteSurveyError, setDeleteSurveyError] = useState<string | null>(null);

  // Active Survey loaded dynamically from context to prevent cross-customer data leakage
  const activeSurvey = surveys.find(s => s.id === selectedSurveyId) || surveys[0] || null;

  // Working form state for currently active survey
  const [roofArea, setRoofArea] = useState<number>(0);
  const [shadowFreeArea, setShadowFreeArea] = useState<number>(0);
  const [roofShape, setRoofShape] = useState<string>('Rectangular');
  const [surfaceCondition, setSurfaceCondition] = useState<string>('Good');
  const [measurementStatus, setMeasurementStatus] = useState<string>('Initial Estimate');
  const [roofType, setRoofType] = useState<string>('RCC Flat');
  const [tilt, setTilt] = useState<number>(15);
  const [azimuth, setAzimuth] = useState<number>(180);
  
  // Obstacles
  const [obstaclesWaterTank, setObstaclesWaterTank] = useState(false);
  const [obstaclesMumty, setObstaclesMumty] = useState(false);
  const [obstaclesParapet, setObstaclesParapet] = useState(false);
  const [obstaclesTrees, setObstaclesTrees] = useState(false);
  const [obstaclesOther, setObstaclesOther] = useState('');
  const [accessClearance, setAccessClearance] = useState('');

  // Electrical Inspection
  const [sanctionLoad, setSanctionLoad] = useState<number>(5);
  const [gridPhase, setGridPhase] = useState<string>('Three Phase');
  const [mainMeterStatus, setMainMeterStatus] = useState<string>('Not Assessed');
  const [mainMeterNotes, setMainMeterNotes] = useState('');
  const [dbCondition, setDbCondition] = useState<string>('Not Assessed');
  const [earthingStatus, setEarthingStatus] = useState<string>('Not Assessed');
  const [earthingResistance, setEarthingResistance] = useState<number | ''>('');
  const [distanceToLt, setDistanceToLt] = useState<number>(20);
  const [proposedInverterLoc, setProposedInverterLoc] = useState('');
  const [electricalUpgrades, setElectricalUpgrades] = useState('');

  // Structural & Shading
  const [visibleCracks, setVisibleCracks] = useState(false);
  const [waterproofingStatus, setWaterproofingStatus] = useState<string>('Good');
  const [mountingStructureType, setMountingStructureType] = useState('Standard Elevated');
  const [shadingSources, setShadingSources] = useState('');
  const [shadingArea, setShadingArea] = useState<number>(0);
  const [structuralEngineerReq, setStructuralEngineerReq] = useState(false);

  // Findings & Sizing
  const [feasibilityVerdict, setFeasibilityVerdict] = useState<string>('Feasible');
  const [panelWattage, setPanelWattage] = useState<number>(550);
  const [inverterRec, setInverterRec] = useState('');
  const [cableSpec, setCableSpec] = useState('');
  const [engineerNotes, setEngineerNotes] = useState('');
  const [customFields, setCustomFields] = useState<{ id: string; label: string; value: string }[]>([]);

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditingMode, setIsEditingMode] = useState<boolean>(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  };

  const [checklistModalOpen, setChecklistModalOpen] = useState(false);
  const [checklistErrors, setChecklistErrors] = useState<string[]>([]);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewDecision, setReviewDecision] = useState<'Approved' | 'Changes Required'>('Approved');
  const [reviewComments, setReviewComments] = useState('');
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [previewPhoto, setPreviewPhoto] = useState<SurveyPhoto | null>(null);
  const [uploadingCategory, setUploadingCategory] = useState<SurveyPhotoCategory | null>(null);
  const [uploadError, setUploadError] = useState('');

  // Hidden file inputs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const currentLoadedSurveyIdRef = useRef<string | null>(null);
  const [activeUploadCategory, setActiveUploadCategory] = useState<SurveyPhotoCategory>('full_rooftop_view');

  // Live Camera state
  const [liveCameraOpen, setLiveCameraOpen] = useState(false);
  const [liveCameraTitle, setLiveCameraTitle] = useState('');
  const [liveCameraFacing, setLiveCameraFacing] = useState<'user' | 'environment'>('environment');
  const [liveCameraTarget, setLiveCameraTarget] = useState<
    | { type: 'category'; category: SurveyPhotoCategory }
    | { type: 'customer_photo' }
    | { type: 'doc_front' }
    | { type: 'doc_back' }
    | null
  >(null);

  // Customer Photograph & Identity Proof state
  const customerPhotoInputRef = useRef<HTMLInputElement>(null);
  const docFrontInputRef = useRef<HTMLInputElement>(null);
  const docBackInputRef = useRef<HTMLInputElement>(null);
  const [docType, setDocType] = useState('Aadhaar Card (Masked)');
  const [docIdNumber, setDocIdNumber] = useState('');
  const [customerPhotoBase64, setCustomerPhotoBase64] = useState<string | null>(null);
  const [docFrontBase64, setDocFrontBase64] = useState<string | null>(null);
  const [docBackBase64, setDocBackBase64] = useState<string | null>(null);
  const [docNotes, setDocNotes] = useState('');
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [savedDocMetadata, setSavedDocMetadata] = useState<any>(null);

  // Field BOM Builder state
  const [bomItems, setBomItems] = useState<BomItem[]>([]);
  const [bomStatus, setBomStatus] = useState<string>('Draft');
  const [isSavingBom, setIsSavingBom] = useState(false);

  // Due / Missed scheduled visit status calculation
  // IMPORTANT: User specified this should NEVER apply to Approved/Completed/Submitted surveys
  const getSurveyScheduleDueInfo = (s: SiteSurvey) => {
    if (s.status === 'Approved' || s.status === 'Completed' || s.status === 'Submitted for Review') {
      return null;
    }
    if (!s.scheduledDate) return null;

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    if (s.scheduledDate < todayStr) {
      const sched = new Date(s.scheduledDate);
      const curr = new Date(todayStr);
      const diffTime = Math.abs(curr.getTime() - sched.getTime());
      const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      return {
        isOverdue: true,
        isDueToday: false,
        badgeText: 'DUE (MISSED)',
        badgeClass: 'bg-red-100 text-red-800 border border-red-300 font-bold',
        daysText: `Missed (${diffDays}d ago)`
      };
    } else if (s.scheduledDate === todayStr) {
      return {
        isOverdue: false,
        isDueToday: true,
        badgeText: 'DUE TODAY',
        badgeClass: 'bg-amber-100 text-amber-900 border border-amber-300 font-bold',
        daysText: 'Due today'
      };
    }
    return null;
  };

  // Custom dropdown options persistence & dynamic addition
  const [customDropdownOptions, setCustomDropdownOptions] = useState<Record<string, string[]>>(() => {
    try {
      const saved = localStorage.getItem('solar_custom_dropdown_opts');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [addingOptionTo, setAddingOptionTo] = useState<string | null>(null);
  const [newOptionText, setNewOptionText] = useState<string>('');

  const handleAddCustomOption = (fieldKey: string, setter: (val: any) => void) => {
    const trimmed = newOptionText.trim();
    if (!trimmed) return;

    setCustomDropdownOptions(prev => {
      const existing = prev[fieldKey] || [];
      if (existing.includes(trimmed)) return prev;
      const updated = {
        ...prev,
        [fieldKey]: [...existing, trimmed]
      };
      try {
        localStorage.setItem('solar_custom_dropdown_opts', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    setter(trimmed);
    setAddingOptionTo(null);
    setNewOptionText('');
    showToast(`Added "${trimmed}" to dropdown and selected!`, 'success');
  };

  const renderDropdownAddButton = (fieldKey: string) => {
    if (!isEditingMode) return null;
    return (
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          if (addingOptionTo === fieldKey) {
            setAddingOptionTo(null);
            setNewOptionText('');
          } else {
            setAddingOptionTo(fieldKey);
            setNewOptionText('');
          }
        }}
        className="text-[10px] text-emerald-600 hover:text-emerald-800 font-bold flex items-center gap-0.5 hover:underline cursor-pointer shrink-0"
        title="Add custom option to this dropdown"
      >
        <Plus className="w-3 h-3" />
        <span>Add</span>
      </button>
    );
  };

  const renderAddOptionInput = (fieldKey: string, setter: (val: any) => void) => {
    if (addingOptionTo !== fieldKey) return null;
    return (
      <div className="flex items-center gap-1.5 my-1.5 animate-in fade-in zoom-in-95">
        <input
          type="text"
          autoFocus
          placeholder="New option name..."
          value={newOptionText}
          onChange={e => setNewOptionText(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAddCustomOption(fieldKey, setter);
            } else if (e.key === 'Escape') {
              setAddingOptionTo(null);
              setNewOptionText('');
            }
          }}
          className="flex-1 px-2.5 py-1 bg-white border border-emerald-500 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-xs"
        />
        <button
          type="button"
          onClick={() => handleAddCustomOption(fieldKey, setter)}
          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 shadow-xs"
        >
          Save
        </button>
        <button
          type="button"
          onClick={() => {
            setAddingOptionTo(null);
            setNewOptionText('');
          }}
          className="px-1.5 py-1 text-slate-400 hover:text-slate-600 text-xs cursor-pointer shrink-0"
        >
          Cancel
        </button>
      </div>
    );
  };

  const getDefaultBomItems = (kw: number): BomItem[] => {
    const cap = kw || 5;
    return [
      {
        id: 'BI-1',
        bomId: '',
        category: 'Solar PV Modules',
        itemName: `${cap} kWp Solar Modules (600Wp N-Topcon Bifacial)`,
        technicalSpecification: 'Tier-1 Mono PERC / N-Topcon Bifacial (DCR Compliant)',
        brandMake: 'Waaree / Adani / Vikram',
        quantity: cap,
        unit: 'KWp',
        estimatedUnitCost: 28000,
        estimatedTotalCost: cap * 28000,
        remarks: 'Domestic Content Requirement compliant for subsidy',
      },
      {
        id: 'BI-2',
        bomId: '',
        category: 'Solar Inverters',
        itemName: `${cap}kW Grid-Tied Solar Inverter`,
        technicalSpecification: '3-Phase MPPT Inverter with WiFi Data Logger',
        brandMake: 'Solis / Sungrow',
        quantity: 1,
        unit: 'Nos',
        estimatedUnitCost: 55000,
        estimatedTotalCost: 55000,
        remarks: 'Up to 8-10 Years Manufacturer Warranty',
      },
      {
        id: 'BI-3',
        bomId: '',
        category: 'Mounting Structure',
        itemName: 'Hot-Dip Galvanized (HDG) Structure',
        technicalSpecification: '80 Micron HDG, Class-A GI with SS304 Fasteners',
        brandMake: 'Reputed',
        quantity: 1,
        unit: 'Set',
        estimatedUnitCost: 22000,
        estimatedTotalCost: 22000,
        remarks: 'Wind speed resistant up to 150 km/h',
      },
      {
        id: 'BI-4',
        bomId: '',
        category: 'DCDB / ACDB',
        itemName: 'DCDB & ACDB Distribution Boxes',
        technicalSpecification: '1000V DC 32A MCB with Type-II SPD + 3PN 32A ACDB',
        brandMake: 'Schneider / Reputed',
        quantity: 1,
        unit: 'Set',
        estimatedUnitCost: 14000,
        estimatedTotalCost: 14000,
        remarks: 'IP65 Polycarbonate Enclosure',
      },
      {
        id: 'BI-5',
        bomId: '',
        category: 'Earthing & Lightning',
        itemName: 'Chemical Earthing & ESE Lightning Arrester',
        technicalSpecification: '100 Micron Copper Bonded 19mm x 1m Electrodes + Arrester',
        brandMake: 'Reputed',
        quantity: 3,
        unit: 'Sets',
        estimatedUnitCost: 4000,
        estimatedTotalCost: 12000,
        remarks: '3 Dedicated pits: Inverter, Structure, LA',
      },
      {
        id: 'BI-6',
        bomId: '',
        category: 'Solar Cables',
        itemName: 'DC Solar Cable & AC Armoured Cable',
        technicalSpecification: '4 Sq.mm UV XLPO Cu DC Cable + 3.5C x 6 Sq.mm AC Armoured',
        brandMake: 'Polycab / RR Kabel',
        quantity: 60,
        unit: 'Mtrs',
        estimatedUnitCost: 250,
        estimatedTotalCost: 15000,
        remarks: 'TUV certified dual insulation',
      },
      {
        id: 'BI-7',
        bomId: '',
        category: 'BOS & Accessories',
        itemName: 'Balance of System (BOS) Kit',
        technicalSpecification: '1" PVC Heavy Duty Conduits, Staubli MC4 Sets, Cable Ties & Signages',
        brandMake: 'Staubli / Reputed',
        quantity: 1,
        unit: 'Set',
        estimatedUnitCost: 8000,
        estimatedTotalCost: 8000,
        remarks: 'Standard installation hardware kit',
      },
    ];
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Sync state whenever selectedSurveyId changes (Guarantees Customer Survey Isolation)
  useEffect(() => {
    if (!activeSurvey) {
      currentLoadedSurveyIdRef.current = null;
      return;
    }

    // Only re-initialize form state when switching to a different survey.
    // This prevents wiping out the engineer's currently typed inputs on background context updates.
    if (currentLoadedSurveyIdRef.current !== activeSurvey.id) {
      currentLoadedSurveyIdRef.current = activeSurvey.id;

      setRoofArea(activeSurvey.roofAreaSqFt || 0);
      setShadowFreeArea(activeSurvey.shadowFreeAreaSqFt || 0);
      setRoofShape(activeSurvey.roofDimensionsShape || 'Rectangular');
      setSurfaceCondition(activeSurvey.surfaceCondition || 'Good');
      setMeasurementStatus(activeSurvey.measurementStatus || 'Initial Estimate');
      setRoofType(activeSurvey.roofType || 'RCC Flat');
      setTilt(activeSurvey.tiltAngle || 15);
      setAzimuth(activeSurvey.azimuthAngle || 180);

      setObstaclesWaterTank(Boolean(activeSurvey.obstaclesWaterTank));
      setObstaclesMumty(Boolean(activeSurvey.obstaclesMumty));
      setObstaclesParapet(Boolean(activeSurvey.obstaclesParapet));
      setObstaclesTrees(Boolean(activeSurvey.obstaclesTreesNeighbors));
      setObstaclesOther(activeSurvey.obstaclesOther || '');
      setAccessClearance(activeSurvey.accessPathwaysClearance || '1m walkway required along perimeter');

      setSanctionLoad(activeSurvey.existingSanctionLoadKw || 5);
      setGridPhase(activeSurvey.gridPhase || 'Three Phase');
      setMainMeterStatus(activeSurvey.mainMeterStatus || 'Not Assessed');
      setMainMeterNotes(activeSurvey.mainMeterNotes || '');
      setDbCondition(activeSurvey.dbCondition || 'Not Assessed');
      setEarthingStatus(activeSurvey.earthingStatus || 'Not Assessed');
      setEarthingResistance(activeSurvey.earthingResistanceOhms !== null && activeSurvey.earthingResistanceOhms !== undefined ? activeSurvey.earthingResistanceOhms : '');
      setDistanceToLt(activeSurvey.distanceToLtPanelMeters || 20);
      setProposedInverterLoc(activeSurvey.proposedInverterLocation || '');
      setElectricalUpgrades(activeSurvey.electricalUpgradesNeeded || '');

      setVisibleCracks(Boolean(activeSurvey.visibleCracksDamage));
      setWaterproofingStatus(activeSurvey.waterproofingStatus || 'Good');
      setMountingStructureType(activeSurvey.mountingStructureType || 'Standard Elevated');
      setShadingSources(activeSurvey.shadingSources || '');
      setShadingArea(activeSurvey.shadingAffectedAreaSqFt || 0);
      setStructuralEngineerReq(Boolean(activeSurvey.structuralEngineerApprovalRequired));

      setFeasibilityVerdict(activeSurvey.feasibilityVerdict || 'Feasible');
      setPanelWattage(activeSurvey.proposedPanelWattage || 550);
      setInverterRec(activeSurvey.inverterRecommendation || '');
      setCableSpec(activeSurvey.cableSpecification || '');
      const isAutoPrompt = activeSurvey.notes && (
        activeSurvey.notes.includes('Scheduled site audit') ||
        activeSurvey.notes.includes('Site survey audit scheduled')
      );
      setEngineerNotes(isAutoPrompt ? '' : (activeSurvey.notes || ''));
      setCustomFields(activeSurvey.customFields || []);

      setSaveSuccessMsg('');
      const shouldEdit = activeSurvey ? (activeSurvey.status === 'Scheduled' || activeSurvey.status === 'In Progress' || activeSurvey.status === 'Changes Required') : false;
      setIsEditingMode(shouldEdit);

      // Fetch existing customer documents for this survey
      authFetch(`/api/documents?surveyId=${activeSurvey.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.document) {
            setSavedDocMetadata(data.document);
          } else {
            setSavedDocMetadata(null);
          }
        })
        .catch(() => setSavedDocMetadata(null));

      // Fetch existing BOM for this survey
      authFetch(`/api/boms?surveyId=${activeSurvey.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.bom && data.bom.items?.length > 0) {
            setBomItems(data.bom.items);
            setBomStatus(data.bom.status);
          } else {
            setBomItems(getDefaultBomItems(activeSurvey.recommendedKw || 5));
            setBomStatus('Draft');
          }
        })
        .catch(() => {
          setBomItems(getDefaultBomItems(activeSurvey.recommendedKw || 5));
        });
    }
  }, [selectedSurveyId, surveys]);

  // Dynamic capacity calculation based on verified shadow-free area (Never hardcoded!)
  const sqFtPerPanel = 28;
  const calculatedPanelQty = shadowFreeArea > 0 ? Math.floor(shadowFreeArea / sqFtPerPanel) : 0;
  const calculatedCapacityKw = Number(((calculatedPanelQty * panelWattage) / 1000).toFixed(1));
  const estimatedGenYear = Math.round(calculatedCapacityKw * 1460); // 4 units/kW/day average India solar yield
  const estimatedAnnualSavings = Math.round(estimatedGenYear * 8.2); // ₹8.2/unit blended commercial/residential tariff
  const estimatedCost = Math.round(calculatedCapacityKw * 58000);
  const paybackYears = estimatedAnnualSavings > 0 ? Number((estimatedCost / estimatedAnnualSavings).toFixed(1)) : 4.5;
  const co2Tons = Number((calculatedCapacityKw * 1.2).toFixed(1));

  // Handle switching customer surveys
  const handleOpenAuditView = (surveyId: string) => {
    setSelectedSurveyId(surveyId);
    setActiveViewMode('audit');
    const survey = surveys.find(s => s.id === surveyId);
    const shouldEdit = survey ? (survey.status === 'Scheduled' || survey.status === 'In Progress' || survey.status === 'Changes Required') : false;
    setIsEditingMode(shouldEdit);
    if (onAuditModeChange) onAuditModeChange(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Helper to compile current form fields into a SiteSurvey payload
  const getSurveyFormPayload = (isDraft: boolean = true): Partial<SiteSurvey> => {
    return {
      roofAreaSqFt: Number(roofArea) || 0,
      shadowFreeAreaSqFt: Number(shadowFreeArea) || 0,
      roofDimensionsShape: roofShape,
      surfaceCondition,
      measurementStatus: measurementStatus === 'Initial Estimate' ? 'Engineer Entered' : measurementStatus as any,
      roofType,
      tiltAngle: Number(tilt) || 0,
      azimuthAngle: Number(azimuth) || 0,
      obstaclesWaterTank,
      obstaclesMumty,
      obstaclesParapet,
      obstaclesTreesNeighbors: obstaclesTrees,
      obstaclesOther,
      accessPathwaysClearance: accessClearance,
      existingSanctionLoadKw: Number(sanctionLoad) || 0,
      gridPhase,
      mainMeterStatus,
      mainMeterNotes,
      dbCondition,
      earthingStatus,
      earthingResistanceOhms: earthingResistance !== '' && earthingResistance !== null && earthingResistance !== undefined ? Number(earthingResistance) : null,
      distanceToLtPanelMeters: Number(distanceToLt) || 0,
      proposedInverterLocation: proposedInverterLoc,
      electricalUpgradesNeeded: electricalUpgrades,
      visibleCracksDamage: visibleCracks,
      waterproofingStatus,
      mountingStructureType,
      shadingSources,
      shadingAffectedAreaSqFt: Number(shadingArea) || 0,
      structuralEngineerApprovalRequired: structuralEngineerReq,
      feasibilityVerdict,
      proposedPanelWattage: Number(panelWattage) || 550,
      recommendedKw: calculatedCapacityKw > 0 ? calculatedCapacityKw : (activeSurvey?.recommendedKw || 0),
      panelQuantity: calculatedPanelQty > 0 ? calculatedPanelQty : (activeSurvey?.panelQuantity || 0),
      estimatedGenerationUnitsPerYear: estimatedGenYear,
      estimatedAnnualSavings,
      estimatedCost,
      paybackYears,
      co2ReductionTonsPerYear: co2Tons,
      inverterRecommendation: inverterRec,
      cableSpecification: cableSpec,
      notes: engineerNotes,
      customFields,
      isDraft,
    };
  };

  // Save Draft / Progress
  const handleSaveDraft = async () => {
    if (!activeSurvey) return;
    setIsSaving(true);
    setSaveSuccessMsg('');

    const updates = getSurveyFormPayload(true);
    await saveSurveyDraft(activeSurvey.id, updates);
    setIsSaving(false);
    setIsEditingMode(false);
    setSaveSuccessMsg('Progress saved!');
    showToast('Survey draft progress saved successfully! All measurements recorded.', 'success');
    setTimeout(() => setSaveSuccessMsg(''), 4000);
  };

  // Handle File / Camera selection for honest Geo-Tagging
  const handleTriggerUpload = (category: SurveyPhotoCategory, useCamera: boolean = false) => {
    if (!isEditingMode) {
      showToast('Click "Edit Survey" first to capture or upload evidence photographs.', 'info');
      return;
    }
    setActiveUploadCategory(category);
    setUploadError('');
    if (useCamera && cameraInputRef.current) {
      cameraInputRef.current.click();
    } else if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleProcessFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeSurvey) return;

    setUploadingCategory(activeUploadCategory);
    setUploadError('');

    let latitude: number | null = null;
    let longitude: number | null = null;
    let gpsAccuracy: number | null = null;

    if ('geolocation' in navigator) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 6000,
            maximumAge: 0,
          });
        });
        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
        gpsAccuracy = position.coords.accuracy;
      } catch (geoErr) {
        console.warn('Real GPS not available or permission denied:', geoErr);
      }
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result as string;
      const uploaded = await uploadSurveyPhoto(activeSurvey.id, {
        category: activeUploadCategory,
        fileName: file.name,
        base64Data,
        caption: `Site audit photo for ${activeSurvey.customerName}`,
        latitude,
        longitude,
        gpsAccuracyMeters: gpsAccuracy,
        capturedAt: new Date().toISOString(),
      });

      setUploadingCategory(null);
      if (!uploaded) {
        setUploadError('Failed to upload image. Please try again.');
        showToast('Failed to upload image. Please check format and size.', 'error');
      } else {
        showToast('Photograph uploaded and verified successfully!', 'success');
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    };
    reader.onerror = () => {
      setUploadingCategory(null);
      setUploadError('Failed to read image file.');
      showToast('Failed to read image file.', 'error');
    };
    reader.readAsDataURL(file);
  };

  // Delete photo
  const handleDeletePhoto = async (photoId: string) => {
    if (!activeSurvey) return;
    if (!isEditingMode) {
      showToast('Click "Edit Survey" first to manage photographs.', 'info');
      return;
    }
    if (confirm('Are you sure you want to remove this photograph?')) {
      await deleteSurveyPhoto(activeSurvey.id, photoId);
      if (previewPhoto?.id === photoId) setPreviewPhoto(null);
      showToast('Photograph removed from site audit record.', 'info');
    }
  };

  // Live Camera Trigger & Capture
  const openLiveCamera = (
    title: string,
    facing: 'user' | 'environment',
    target: { type: 'category'; category: SurveyPhotoCategory } | { type: 'customer_photo' } | { type: 'doc_front' } | { type: 'doc_back' }
  ) => {
    if (!isEditingMode) {
      showToast('Click "Edit Survey" first to enable camera capture.', 'info');
      return;
    }
    setLiveCameraTitle(title);
    setLiveCameraFacing(facing);
    setLiveCameraTarget(target);
    setLiveCameraOpen(true);
  };

  const handleLiveCameraCapture = async (base64Data: string) => {
    if (!liveCameraTarget) return;

    if (liveCameraTarget.type === 'customer_photo') {
      setCustomerPhotoBase64(base64Data);
      showToast('Customer photograph captured successfully!', 'success');
      return;
    }
    if (liveCameraTarget.type === 'doc_front') {
      setDocFrontBase64(base64Data);
      showToast('ID Proof (Front) captured successfully!', 'success');
      return;
    }
    if (liveCameraTarget.type === 'doc_back') {
      setDocBackBase64(base64Data);
      showToast('ID Proof (Back / Address) captured successfully!', 'success');
      return;
    }
    if (liveCameraTarget.type === 'category' && activeSurvey) {
      const category = liveCameraTarget.category;
      setUploadingCategory(category);
      showToast(`Uploading live photograph for ${category}...`, 'info');

      // Attempt GPS geotagging
      let latitude: number | undefined;
      let longitude: number | undefined;
      let gpsAccuracy: number | undefined;
      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 6000,
              maximumAge: 30000,
            });
          });
          latitude = position.coords.latitude;
          longitude = position.coords.longitude;
          gpsAccuracy = position.coords.accuracy;
        } catch (geoErr) {
          console.warn('Geolocation capture not available:', geoErr);
        }
      }

      const uploaded = await uploadSurveyPhoto(activeSurvey.id, {
        category,
        fileName: `camera_${category}_${Date.now()}.jpg`,
        base64Data,
        caption: `Live camera audit photo for ${activeSurvey.customerName}`,
        latitude,
        longitude,
        gpsAccuracyMeters: gpsAccuracy,
        capturedAt: new Date().toISOString(),
      });

      setUploadingCategory(null);
      if (!uploaded) {
        setUploadError('Failed to upload image. Please try again.');
        showToast('Failed to upload captured photo.', 'error');
      } else {
        showToast('Live photograph uploaded and geo-verified!', 'success');
      }
    }
  };

  // Pre-Submission Checklist Validation
  const validateChecklist = (): string[] => {
    const errors: string[] = [];
    if (!roofArea || roofArea <= 0) errors.push('Rooftop Measurements: Total roof area must be specified (> 0 sq.ft)');
    if (!shadowFreeArea || shadowFreeArea <= 0) errors.push('Rooftop Measurements: Usable shadow-free area must be specified (> 0 sq.ft)');
    if (shadowFreeArea > roofArea) errors.push('Rooftop Measurements: Usable shadow-free area cannot exceed total roof area');
    if (!calculatedCapacityKw || calculatedCapacityKw <= 0) errors.push('Engineering Findings: Feasible capacity must be calculated');
    
    const currentPhotos = activeSurvey?.photos || [];
    const categories = new Set(currentPhotos.map(p => p.category));
    if (!categories.has('full_rooftop_view')) {
      errors.push('Site Photographs: "1. Full Rooftop View" photograph is mandatory');
    }
    if (!categories.has('main_electricity_meter')) {
      errors.push('Site Photographs: "4. Main Electricity Meter" photograph is mandatory');
    }

    if (mainMeterStatus === 'Not Assessed') {
      errors.push('Electrical Inspection: Main meter status has not been assessed');
    }

    return errors;
  };

  const handleOpenSubmitChecklist = async () => {
    if (!activeSurvey) return;

    // Immediately persist current form state to MySQL so backend is always in sync with user's inputs
    const payload = getSurveyFormPayload(true);
    try {
      await saveSurveyDraft(activeSurvey.id, payload);
    } catch (err) {
      console.warn('Auto-save prior to checklist validation failed:', err);
    }

    const errors = validateChecklist();
    setChecklistErrors(errors);
    setChecklistModalOpen(true);
    if (errors.length > 0) {
      showToast(`${errors.length} checklist item(s) pending. Review checklist opened.`, 'info');
    } else {
      showToast('All technical checks passed! Review checklist opened.', 'info');
    }
  };

  const handleConfirmSubmit = async (bypassWithExceptions: boolean = false) => {
    if (!activeSurvey) return;
    setIsSubmitting(true);
    showToast('Submitting survey audit for technical review...', 'info');

    const payload = getSurveyFormPayload(false);
    // Guarantee latest form inputs are persisted before calling review submission
    await saveSurveyDraft(activeSurvey.id, payload);

    const res = await submitSurveyForReview(activeSurvey.id, engineerNotes, bypassWithExceptions, payload);
    setIsSubmitting(false);
    if (res.success) {
      setChecklistModalOpen(false);
      setIsEditingMode(false);
      setSaveSuccessMsg('Survey successfully submitted for review! Next step: Configure Field BOM in Field BOMs & Materials.');
      showToast(`Survey ${activeSurvey.id} submitted for Project Manager review! You can now configure the Field BOM.`, 'success');
    } else {
      setChecklistErrors(res.checklistErrors || [res.error || 'Submission failed']);
      showToast(res.error || 'Checklist validation incomplete. Please check required items.', 'error');
    }
  };

  // Review & Approval Action
  const handleReviewSurveyDirect = async (decision: 'Approved' | 'Changes Required', comments: string) => {
    if (!activeSurvey) return;
    setIsSubmitting(true);
    showToast(`Submitting technical sign-off: ${decision}...`, 'info');
    const res = await reviewSurveyAction(activeSurvey.id, decision, comments);
    setIsSubmitting(false);
    if (res.success) {
      setReviewModalOpen(false);
      setReviewComments('');
      setIsEditingMode(false);
      if (decision === 'Approved') {
        setSaveSuccessMsg('Survey Audit Approved! Field Engineer can now configure and submit the Field BOM.');
        showToast(`Survey ${activeSurvey.id} Audit Approved! Next step is Field BOM submission.`, 'success');
      } else {
        setSaveSuccessMsg(`Survey marked as ${decision}!`);
        showToast(`Site survey ${activeSurvey.id} signed off: ${decision}!`, 'info');
      }
    } else {
      showToast(res.error || 'Failed to submit review', 'error');
    }
  };

  const handleReviewSurvey = async () => {
    if (!activeSurvey) return;
    if (!reviewComments.trim()) {
      showToast('Please provide review comments / audit remarks.', 'error');
      return;
    }
    await handleReviewSurveyDirect(reviewDecision, reviewComments);
  };

  // Filtered surveys list
  const filteredSurveys = surveys.filter(s => {
    const matchesSearch = 
      s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.engineerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.address.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesStatus = false;
    if (statusFilter === 'All') {
      matchesStatus = true;
    } else if (statusFilter === 'Overdue') {
      const due = getSurveyScheduleDueInfo(s);
      matchesStatus = Boolean(due && (due.isOverdue || due.isDueToday));
    } else {
      matchesStatus = s.status === statusFilter;
    }
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-200">
      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-2.5 px-4 py-3 bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-top-3 duration-200 max-w-md w-[92%] sm:w-auto">
          {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
          {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />}
          {toast.type === 'info' && <Info className="w-5 h-5 text-teal-400 shrink-0" />}
          <span className="text-xs sm:text-sm font-semibold">{toast.message}</span>
        </div>
      )}

      {/* Hidden File Inputs for Standard Upload & Mobile Camera Capture */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleProcessFile} 
        accept="image/png,image/jpeg,image/webp" 
        className="hidden" 
      />
      <input 
        type="file" 
        ref={cameraInputRef} 
        onChange={handleProcessFile} 
        accept="image/*" 
        capture="environment" 
        className="hidden" 
      />

      {/* ========================================================= */}
      {/* VIEW 1: DEDICATED FULL-PAGE ENGINEERING AUDIT WORKSPACE */}
      {/* ========================================================= */}
      {activeViewMode === 'audit' && activeSurvey && (
        <div className="space-y-3 sm:space-y-6">
          {/* Responsive Sticky Header: Full-width fixed at top of workspace with solid background */}
          <div className="sticky -top-2.5 sm:-top-5 lg:-top-6 -mx-2.5 sm:-mx-5 lg:-mx-6 z-30 bg-white border-b border-slate-200 px-3.5 py-2.5 sm:px-6 sm:py-3.5 shadow-xs transition-all space-y-1.5 sm:space-y-0">
            {/* Row 1: Back Button, Survey ID & Status Pill */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
                <button
                  onClick={() => {
                    setActiveViewMode('grid');
                    if (onAuditModeChange) onAuditModeChange(false);
                  }}
                  className="flex items-center gap-1 px-2.5 py-1.5 sm:px-3 sm:py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg sm:rounded-xl transition-colors cursor-pointer text-xs shrink-0"
                  title="Return to site audits list"
                >
                  <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
                  <span className="text-[11px] sm:text-xs">All Audits</span>
                </button>

                <span className="font-mono font-bold text-slate-900 px-2 py-1 bg-slate-100 rounded-lg text-xs shrink-0">
                  {activeSurvey.id}
                </span>

                <span className="font-bold text-slate-800 text-xs truncate max-w-[120px] xs:max-w-[160px] sm:max-w-[200px]">
                  {activeSurvey.customerName}
                </span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {(() => {
                  const dueInfo = getSurveyScheduleDueInfo(activeSurvey);
                  if (!dueInfo) return null;
                  return (
                    <span className={`px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${dueInfo.badgeClass}`}>
                      <AlertTriangle className="w-3 h-3 shrink-0" />
                      <span>{dueInfo.badgeText} ({dueInfo.daysText})</span>
                    </span>
                  );
                })()}

                <span className={`px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wider ${
                  activeSurvey.status === 'Approved' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                  activeSurvey.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                  activeSurvey.status === 'Submitted for Review' ? 'bg-blue-50 text-blue-800 border border-blue-200' :
                  activeSurvey.status === 'Changes Required' ? 'bg-red-50 text-red-800 border border-red-200' :
                  activeSurvey.status === 'In Progress' ? 'bg-indigo-50 text-indigo-800 border border-indigo-200' :
                  'bg-amber-50 text-amber-800 border border-amber-200'
                }`}>
                  ● {activeSurvey.status}
                </span>
              </div>
            </div>

            {/* Row 2: Action Buttons */}
            <div className="flex items-center justify-between sm:justify-end gap-1.5 sm:gap-2 pt-1 sm:pt-0 sm:mt-2 border-t border-slate-100 sm:border-t-0">
              {!isEditingMode ? (
                isReviewer ? (
                  <>
                    <span className="text-[11px] text-slate-500 font-medium mr-auto flex items-center gap-1.5">
                      <FileCheck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span>Role: <strong className="text-indigo-900 font-bold">Project Manager Audit</strong></span>
                    </span>

                    {/* Reviewer Action Bar */}
                    {activeSurvey.status !== 'Approved' && (
                      <>
                        <button
                          onClick={() => {
                            setReviewDecision('Changes Required');
                            setReviewModalOpen(true);
                          }}
                          className="flex items-center justify-center gap-1 px-3 py-1.5 sm:px-3.5 sm:py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg sm:rounded-xl text-xs shadow-xs transition-colors cursor-pointer shrink-0"
                          title="Request corrections from field engineer"
                        >
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span className="text-[11px] sm:text-xs">Request Changes</span>
                        </button>

                        <button
                          onClick={() => handleReviewSurveyDirect('Approved', reviewComments || 'Feasibility verified and approved.')}
                          disabled={isSubmitting}
                          className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg sm:rounded-xl text-xs shadow-xs transition-colors cursor-pointer shrink-0"
                          title="Approve technical site audit and request Field BOM"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          <span className="text-[11px] sm:text-xs">Approve Audit (Request Field BOM)</span>
                        </button>
                      </>
                    )}

                    {/* Once Approved, Configure Field BOM */}
                    {/* Once Approved, Configure Field BOM (Survey Engineer only) or View Quote if Quote exists */}
                    {activeSurvey.status === 'Approved' && (
                      !isReviewer && onNavigateToBom ? (
                        <button
                          onClick={() => onNavigateToBom(activeSurvey.id)}
                          className="flex items-center justify-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg sm:rounded-xl text-xs shadow-xs transition-colors cursor-pointer shrink-0"
                          title="Configure Field BOM Materials"
                        >
                          <Layers className="w-3.5 h-3.5 shrink-0" />
                          <span className="text-[11px] sm:text-xs">Configure Field BOM</span>
                        </button>
                      ) : activeSurvey.quotationId ? (
                        <button
                          onClick={() => activeSurvey.leadId && onNavigateToQuotation(activeSurvey.leadId)}
                          className="flex items-center justify-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg sm:rounded-xl text-xs shadow-xs transition-colors cursor-pointer shrink-0"
                          title={`Open Linked Quotation ${activeSurvey.quotationId}`}
                        >
                          <span className="text-[11px] sm:text-xs">View Quote</span>
                          <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                        </button>
                      ) : (
                        <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-xs font-semibold flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-amber-500" />
                          <span>Audit Approved &bull; Awaiting Field BOM</span>
                        </span>
                      )
                    )}

                    {/* Secondary Admin Edit button */}
                    <button
                      onClick={() => {
                        setIsEditingMode(true);
                        showToast('Admin override: Edit mode activated.', 'info');
                      }}
                      className="flex items-center justify-center gap-1 px-2.5 py-1.5 sm:px-3 sm:py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg sm:rounded-xl text-xs transition-colors cursor-pointer shrink-0"
                      title="Adjust measurements as administrator"
                    >
                      <Edit3 className="w-3.5 h-3.5 shrink-0" />
                      <span className="text-[11px] sm:text-xs">Admin Edit</span>
                    </button>
                  </>
                ) : (
                  <>
                    <span className="text-[11px] text-slate-500 font-medium mr-auto flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Mode: <strong className="text-slate-800">Inspect (Read-Only)</strong></span>
                    </span>

                    {/* Edit Survey Button */}
                    <button
                      onClick={() => {
                        setIsEditingMode(true);
                        showToast('Edit mode activated. Form unlocked.', 'info');
                      }}
                      className="flex items-center justify-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg sm:rounded-xl text-xs shadow-xs transition-colors cursor-pointer shrink-0"
                      title="Unlock form to edit measurements and upload photos"
                    >
                      <Edit3 className="w-3.5 h-3.5 shrink-0" />
                      <span className="text-[11px] sm:text-xs">Edit Survey</span>
                    </button>

                    {/* Once Approved, Configure Field BOM for Survey Engineer or View Quote */}
                    {(activeSurvey.status === 'Approved' || activeSurvey.status === 'Completed') && (
                      !isReviewer && onNavigateToBom ? (
                        <button
                          onClick={() => onNavigateToBom(activeSurvey.id)}
                          className="flex items-center justify-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg sm:rounded-xl text-xs shadow-xs transition-colors cursor-pointer shrink-0"
                          title="Configure Field BOM Materials"
                        >
                          <Layers className="w-3.5 h-3.5 shrink-0" />
                          <span className="text-[11px] sm:text-xs">Configure Field BOM</span>
                        </button>
                      ) : activeSurvey.quotationId ? (
                        <button
                          onClick={() => activeSurvey.leadId && onNavigateToQuotation(activeSurvey.leadId)}
                          className="flex items-center justify-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg sm:rounded-xl text-xs shadow-xs transition-colors cursor-pointer shrink-0"
                          title={`Open Linked Quotation ${activeSurvey.quotationId}`}
                        >
                          <span className="text-[11px] sm:text-xs">View Quote</span>
                          <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                        </button>
                      ) : (
                        <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-xs font-semibold flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-amber-500" />
                          <span>Audit Approved &bull; Awaiting Field BOM</span>
                        </span>
                      )
                    )}
                  </>
                )
              ) : (
                <>
                  <span className="text-amber-800 font-bold text-[10px] sm:text-xs flex items-center gap-1 mr-auto animate-in fade-in truncate max-w-[120px] sm:max-w-none">
                    <Edit3 className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                    <span>Editing Mode Active</span>
                  </span>

                  <button
                    onClick={() => {
                      setIsEditingMode(false);
                      showToast('Edit mode closed. Unsaved changes discarded.', 'info');
                    }}
                    className="px-2.5 py-1.5 sm:px-3 sm:py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg sm:rounded-xl text-xs transition-colors cursor-pointer shrink-0"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={handleSaveDraft}
                    disabled={isSaving}
                    className="flex items-center justify-center gap-1 px-2.5 py-1.5 sm:px-3.5 sm:py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg sm:rounded-xl text-xs transition-colors cursor-pointer shrink-0 shadow-xs"
                    title="Save progress without submitting"
                  >
                    <Save className="w-3.5 h-3.5 shrink-0" />
                    <span className="text-[11px] sm:text-xs">{isSaving ? 'Saving...' : 'Save Draft'}</span>
                  </button>

                  {activeSurvey.status !== 'Approved' && activeSurvey.status !== 'Completed' && (
                    <button
                      onClick={handleOpenSubmitChecklist}
                      className="flex items-center justify-center gap-1 px-3 py-1.5 sm:px-4 sm:py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg sm:rounded-xl text-xs shadow-xs transition-colors cursor-pointer flex-1 sm:flex-none"
                    >
                      <Send className="w-3.5 h-3.5 shrink-0" />
                      <span className="text-[11px] sm:text-xs">Submit for Review</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* MAIN AUDIT CONTAINER: 8 DEDICATED SECTIONS */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-3.5 sm:p-6 md:p-8 max-w-5xl mx-auto space-y-6 sm:space-y-8 text-xs text-slate-700">

            {/* Inspection vs Edit Mode Banner */}
            {!isEditingMode ? (
              isReviewer ? (
                <>
                  {/* Project Manager Decision Cockpit */}
                  {activeSurvey.status !== 'Approved' && (
                    <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs space-y-4 animate-in fade-in">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200">
                            <FileCheck className="w-6 h-6 text-emerald-600" />
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
                                Action Required: Technical Sign-Off
                              </span>
                              <span className="text-slate-500 font-mono text-[11px]">Submitted by {activeSurvey.engineerName}</span>
                            </div>
                            <h3 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 mt-0.5">
                              Project Manager Audit Decision
                            </h3>
                          </div>
                        </div>

                        <div className="text-left sm:text-right shrink-0 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                          <span className="text-[10px] uppercase tracking-wider text-slate-500 block font-bold">Verified Plant Sizing</span>
                          <span className="text-xl sm:text-2xl font-black text-emerald-700 font-mono">{calculatedCapacityKw} kWp</span>
                          <span className="text-[10px] text-slate-500 block">({shadowFreeArea} sq.ft shadow-free area)</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 space-y-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Supervisor Remarks / Technical Instructions (Recorded in Audit Trail):
                          </label>
                          <textarea
                            rows={2}
                            value={reviewComments}
                            onChange={e => setReviewComments(e.target.value)}
                            placeholder="e.g. Verified 23.6kW solar capacity. Shadow profile and DISCOM sanction load checked. Approved for Field BOM preparation."
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
                          />
                        </div>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
                          <div className="text-[11px] text-slate-500 flex items-center gap-2">
                            <span>Evidence: <strong className="text-slate-800">{(activeSurvey.photos || []).length} Photographs</strong></span>
                            <span>•</span>
                            <span>Feasibility: <strong className="text-emerald-700 font-bold">{feasibilityVerdict}</strong></span>
                          </div>

                          <div className="flex items-center gap-2.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setReviewDecision('Changes Required');
                                if (!reviewComments.trim()) {
                                  showToast('Please type your revision remarks above before sending back.', 'error');
                                  return;
                                }
                                handleReviewSurveyDirect('Changes Required', reviewComments);
                              }}
                              disabled={isSubmitting}
                              className="flex-1 sm:flex-none px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                            >
                              <AlertCircle className="w-4 h-4" />
                              <span>Reject / Request Changes</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setReviewDecision('Approved');
                                handleReviewSurveyDirect('Approved', reviewComments || 'Technical feasibility verified and approved.');
                              }}
                              disabled={isSubmitting}
                              className="flex-1 sm:flex-none px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                            >
                              <CheckCircle2 className="w-4 h-4 text-white" />
                              <span>Approve Audit (Request Field BOM)</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Project Manager Approved Banner */}
                  {activeSurvey.status === 'Approved' && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-emerald-900 animate-in fade-in">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                          <CheckCircle2 className="w-5 h-5 shrink-0" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-emerald-900">Technical Site Audit Approved</span>
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-mono text-[10px] font-bold">
                              Sign-Off Recorded
                            </span>
                          </div>
                          <p className="text-[11px] text-emerald-700 mt-0.5">
                            Verified capacity: <strong>{activeSurvey.recommendedKw || calculatedCapacityKw} kWp</strong>. Audit sign-off recorded. Awaiting Field BOM submission from engineer.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-3">
                  {/* Submitted for Review Banner (Survey Engineer Persona) */}
                  {activeSurvey.status === 'Submitted for Review' && (
                    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-blue-900 animate-in fade-in">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                          <Clock className="w-5 h-5 shrink-0" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-blue-950">Site Survey Submitted for PM Audit Review</span>
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-mono text-[10px] font-bold">
                              Under Review
                            </span>
                          </div>
                          <p className="text-[11px] text-blue-700 mt-0.5">
                            Survey findings submitted for Project Manager sign-off. Next step: Configure the Field Bill of Materials (BOM) in <strong>Field BOMs &amp; Materials</strong>.
                          </p>
                        </div>
                      </div>
                      {onNavigateToBom && (
                        <button
                          onClick={() => onNavigateToBom(activeSurvey.id)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shrink-0 shadow-xs cursor-pointer"
                        >
                          <span>Open Field BOM</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}

                  {/* Approved Banner (Survey Engineer Persona) */}
                  {activeSurvey.status === 'Approved' && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-emerald-900 animate-in fade-in">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                          <CheckCircle2 className="w-5 h-5 shrink-0" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-emerald-900">Technical Site Audit Approved by PM</span>
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold">
                              Action Required: Fill Field BOM
                            </span>
                          </div>
                          <p className="text-[11px] text-emerald-700 mt-0.5">
                            Verified capacity: <strong>{activeSurvey.recommendedKw || calculatedCapacityKw} kWp</strong>. Site audit is approved! Proceed to configure and submit the Field BOM so the linked quotation can be created upon BOM sign-off.
                          </p>
                        </div>
                      </div>
                      {onNavigateToBom && (
                        <button
                          onClick={() => onNavigateToBom(activeSurvey.id)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shrink-0 shadow-xs cursor-pointer"
                        >
                          <span>Configure Field BOM →</span>
                          <Layers className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                    <div className="flex items-center gap-2 text-slate-700 font-medium">
                      <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>
                        Viewing audit for <strong>{activeSurvey.customerName}</strong> in <strong>Inspect Mode</strong>. Fields are read-only.
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setIsEditingMode(true);
                        showToast('Edit mode activated. Form unlocked.', 'info');
                      }}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Click to Edit Survey</span>
                    </button>
                  </div>
                </div>
              )
            ) : (
              <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-amber-900">
                <div className="flex items-center gap-2 font-medium">
                  <Edit3 className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    <strong>Editing Mode Active:</strong> Rooftop measurements, electrical parameters, and evidence photo uploads are editable.
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      setIsEditingMode(false);
                      showToast('Edit mode closed.', 'info');
                    }}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold rounded-lg text-xs cursor-pointer"
                  >
                    Done Inspecting
                  </button>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* CONDITIONAL RENDER: EXECUTIVE DOSSIER FOR PROJECT MANAGER */}
            {/* VS RAW INTERACTIVE DATA-ENTRY FORM FOR SURVEY ENGINEERS   */}
            {/* ========================================================= */}
            {isReviewer && !isEditingMode ? (
              <div className="space-y-6 animate-in fade-in">
                {/* 1. Customer & Survey Header Info Card */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono font-bold text-xs bg-slate-900 text-white px-2 py-0.5 rounded">
                          {activeSurvey.id}
                        </span>
                        <span className="text-slate-400">•</span>
                        <span className="text-xs text-slate-500 font-mono">Lead: {activeSurvey.leadId || 'Direct'}</span>
                        <span className="text-slate-400">•</span>
                        <span className="text-xs text-slate-500">Audited by: <strong className="text-slate-900">{activeSurvey.engineerName}</strong></span>
                      </div>
                      <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{activeSurvey.customerName}</h2>
                      <p className="text-xs text-slate-600 mt-1 flex items-center gap-1.5 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{activeSurvey.address || 'Address on record'}</span>
                        <span className="text-slate-300">|</span>
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{activeSurvey.phone}</span>
                      </p>
                    </div>
                    <div className="text-left sm:text-right bg-white p-3 rounded-xl border border-slate-200 shrink-0">
                      <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block">Proposed Capacity</span>
                      <span className="text-2xl font-black text-emerald-700 font-mono block">
                        {calculatedCapacityKw || activeSurvey.recommendedKw} kWp
                      </span>
                      <span className="text-[11px] font-semibold text-slate-600">
                        {calculatedPanelQty} × {panelWattage}W Mono PERC Modules
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Key Metric Tiles */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">Feasible Plant Size</span>
                    <span className="text-lg sm:text-xl font-black text-emerald-950 font-mono block mt-0.5">
                      {calculatedCapacityKw || activeSurvey.recommendedKw} kWp
                    </span>
                    <span className="text-[10px] text-emerald-700 block mt-0.5">Physical rooftop potential</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Shadow-Free Area</span>
                    <span className="text-lg sm:text-xl font-black text-slate-900 font-mono block mt-0.5">
                      {shadowFreeArea || activeSurvey.shadowFreeAreaSqFt} sq.ft
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">of {roofArea || activeSurvey.roofAreaSqFt} sq.ft total area</span>
                  </div>
                  <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-3.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 block">DISCOM Sanction Load</span>
                    <span className="text-lg sm:text-xl font-black text-blue-950 font-mono block mt-0.5">
                      {sanctionLoad || activeSurvey.existingSanctionLoadKw} kW
                    </span>
                    <span className="text-[10px] text-blue-700 block mt-0.5">{gridPhase}</span>
                  </div>
                  <div className="bg-indigo-50/80 border border-indigo-200 rounded-xl p-3.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-800 block">Feasibility Verdict</span>
                    <span className="text-sm sm:text-base font-black text-indigo-950 block mt-1">
                      {feasibilityVerdict}
                    </span>
                    <span className="text-[10px] text-indigo-700 block mt-0.5">Signed off on site</span>
                  </div>
                </div>

                {/* 3. Section 1: Rooftop & Civil Feasibility Summary */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0" />
                      <span>1. Rooftop &amp; Civil Feasibility Summary</span>
                    </h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-100 rounded text-slate-600 font-semibold">
                      Measurement: {measurementStatus}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-semibold block">Total Rooftop Area</span>
                      <span className="font-bold text-slate-900 font-mono">{roofArea || activeSurvey.roofAreaSqFt} sq.ft</span>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-semibold block">Usable Shadow-Free</span>
                      <span className="font-bold text-emerald-700 font-mono">{shadowFreeArea || activeSurvey.shadowFreeAreaSqFt} sq.ft</span>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-semibold block">Roof Type</span>
                      <span className="font-bold text-slate-900">{roofType}</span>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-semibold block">Roof Geometry</span>
                      <span className="font-bold text-slate-900">{roofShape}</span>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-semibold block">Azimuth &amp; Orientation</span>
                      <span className="font-bold text-slate-900 font-mono">{azimuth}° ({azimuth === 180 ? 'True South' : azimuth < 180 ? 'SE' : 'SW'})</span>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-semibold block">Tilt Angle</span>
                      <span className="font-bold text-slate-900 font-mono">{tilt}°</span>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-semibold block">Surface Condition</span>
                      <span className={`inline-block font-bold text-[11px] px-1.5 py-0.5 rounded ${surfaceCondition === 'Good' ? 'text-emerald-800 bg-emerald-50' : 'text-amber-800 bg-amber-50'}`}>
                        {surfaceCondition}
                      </span>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-semibold block">Waterproofing</span>
                      <span className={`inline-block font-bold text-[11px] px-1.5 py-0.5 rounded ${waterproofingStatus === 'Good' ? 'text-emerald-800 bg-emerald-50' : 'text-red-800 bg-red-50'}`}>
                        {waterproofingStatus}
                      </span>
                    </div>
                  </div>
                  
                  {/* Obstacles Pill List */}
                  <div className="pt-2 flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="text-[11px] text-slate-500 font-semibold">Observed Obstacles:</span>
                    {obstaclesWaterTank && <span className="px-2 py-0.5 bg-amber-100 text-amber-900 rounded-md font-semibold text-[11px]">Water Tank</span>}
                    {obstaclesMumty && <span className="px-2 py-0.5 bg-amber-100 text-amber-900 rounded-md font-semibold text-[11px]">Mumty Room</span>}
                    {obstaclesParapet && <span className="px-2 py-0.5 bg-amber-100 text-amber-900 rounded-md font-semibold text-[11px]">Parapet Wall</span>}
                    {obstaclesTrees && <span className="px-2 py-0.5 bg-amber-100 text-amber-900 rounded-md font-semibold text-[11px]">Trees / Neighbors</span>}
                    {!obstaclesWaterTank && !obstaclesMumty && !obstaclesParapet && !obstaclesTrees && (
                      <span className="text-emerald-700 font-bold text-[11px]">Clear Horizon / Zero Major Obstructions</span>
                    )}
                  </div>
                </div>

                {/* 4. Section 2: Electrical System & Meter Inspection */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
                      <span>2. Electrical Infrastructure &amp; Grid Meter Verification</span>
                    </h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-blue-50 text-blue-800 rounded font-bold">
                      DISCOM: {gridPhase}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold block">Main Meter Status</span>
                        <span className="font-bold text-slate-900 text-xs block mt-0.5">{mainMeterStatus}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${mainMeterStatus === 'Pass' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                        {mainMeterStatus}
                      </span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold block">Distribution Board (DB)</span>
                        <span className="font-bold text-slate-900 text-xs block mt-0.5">{dbCondition}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${dbCondition === 'Pass' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                        {dbCondition}
                      </span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold block">Earthing Status</span>
                        <span className="font-bold text-slate-900 font-mono text-xs block mt-0.5">
                          {earthingResistance !== '' ? `${earthingResistance} Ω` : 'Verified'}
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${earthingStatus === 'Pass' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                        {earthingStatus}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-semibold block">Cable Run to LT Meter Panel</span>
                      <span className="font-bold text-slate-900 font-mono mt-0.5 block">{distanceToLt} meters (DC to AC Route)</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-semibold block">Proposed Inverter Location</span>
                      <span className="font-bold text-slate-900 mt-0.5 block">{proposedInverterLoc || 'Shaded outdoor wall near staircase / mumty room'}</span>
                    </div>
                  </div>
                </div>

                {/* 5. Section 3: Proposed Plant Sizing & Equipment BOM */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-teal-600 shrink-0" />
                      <span>3. Recommended Plant Design &amp; Equipment BOM</span>
                    </h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-teal-50 text-teal-800 rounded font-bold">
                      Payback: {paybackYears} Years
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase block">Solar PV Modules</span>
                      <div className="font-bold text-slate-900 text-xs">
                        {calculatedPanelQty} × {panelWattage}W Mono PERC Bifacial Modules
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Total DC Peak: <strong className="text-emerald-700 font-mono">{calculatedCapacityKw} kWp</strong>
                      </div>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase block">Inverter Specification</span>
                      <div className="font-bold text-slate-900 text-xs">
                        {inverterRec || `${calculatedCapacityKw}kW 3-Phase On-Grid String Inverter`}
                      </div>
                      <div className="text-[11px] text-slate-500">Dual MPPT with built-in Wi-Fi / RS485 logging</div>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase block">Cabling &amp; BOS</span>
                      <div className="font-bold text-slate-900 text-xs">{cableSpec}</div>
                      <div className="text-[11px] text-slate-500">TUV / EN certified solar grade DC cu cabling</div>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase block">Mounting Structure</span>
                      <div className="font-bold text-slate-900 text-xs">{mountingStructureType}</div>
                      <div className="text-[11px] text-slate-500">Hot-dip galvanized steel with 150 km/h wind resistance</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1 text-center">
                    <div className="bg-teal-50/60 p-2.5 rounded-xl border border-teal-100">
                      <span className="text-[10px] text-teal-800 font-semibold block">Est. Annual Yield</span>
                      <span className="font-bold text-teal-950 font-mono text-sm block mt-0.5">{estimatedGenYear.toLocaleString('en-IN')} kWh</span>
                    </div>
                    <div className="bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-100">
                      <span className="text-[10px] text-emerald-800 font-semibold block">Est. Annual Savings</span>
                      <span className="font-bold text-emerald-950 font-mono text-sm block mt-0.5">₹{estimatedAnnualSavings.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 col-span-2 sm:col-span-1">
                      <span className="text-[10px] text-slate-500 font-semibold block">Indicative System Cost</span>
                      <span className="font-bold text-slate-900 font-mono text-sm block mt-0.5">₹{estimatedCost.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>

                {/* 6. Section 4: Photographic Audit Gallery */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-600 shrink-0" />
                      <span>4. Field Evidence &amp; Photographic Audit ({(activeSurvey.photos || []).length} Photos)</span>
                    </h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-purple-50 text-purple-800 rounded font-bold">
                      Geo-Verification Active
                    </span>
                  </div>

                  {(activeSurvey.photos || []).length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {(activeSurvey.photos || []).map((photo) => (
                        <div
                          key={photo.id}
                          onClick={() => setPreviewPhoto(photo)}
                          className="relative rounded-xl overflow-hidden border border-slate-200 group bg-slate-900 h-28 cursor-pointer shadow-2xs hover:shadow-md transition-shadow"
                        >
                          <img
                            src={photo.filePath}
                            alt={photo.caption || photo.category}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Eye className="w-5 h-5 text-white" />
                          </div>
                          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-1.5 text-white">
                            <div className="text-[9px] font-bold truncate capitalize">{photo.category.replace(/_/g, ' ')}</div>
                            {photo.geoVerified && (
                              <div className="text-[8px] text-emerald-400 flex items-center gap-0.5">
                                <MapPin className="w-2 h-2" />
                                <span>Geo-tagged</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs">
                      No photographic evidence uploaded yet for this site audit.
                    </div>
                  )}
                </div>

                {/* 7. Section 5: Field Engineer Remarks & Audit History */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-700 shrink-0" />
                    <span>5. Field Engineer Remarks &amp; Audit Trail</span>
                  </h3>
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 leading-relaxed font-medium">
                    &ldquo;{engineerNotes || activeSurvey.notes || 'Automated survey dispatch. Bring drone / shade analyzer and multi-meter.'}&rdquo;
                  </div>

                  {activeSurvey.reviewHistory && activeSurvey.reviewHistory.length > 0 && (
                    <div className="space-y-1.5 pt-2">
                      {activeSurvey.reviewHistory.map((hist) => (
                        <div key={hist.id} className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between text-[11px]">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${hist.action === 'Approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                              {hist.action}
                            </span>
                            <span className="font-semibold text-slate-800">{hist.reviewerName}</span>
                            <span className="text-slate-500">— {hist.comments}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">{new Date(hist.createdAt).toLocaleTimeString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Secondary Edit Switcher for PM */}
                <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-xs">
                  <span className="text-slate-500 font-medium">Need to make adjustments to field measurements directly?</span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingMode(true);
                      showToast('Admin override: Edit mode activated.', 'info');
                    }}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Switch to Edit Mode</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6 sm:space-y-8">
            {/* ========================================================= */}
            {/* 1. CUSTOMER AND SITE DETAILS */}
            {/* ========================================================= */}
            <div className="border-b border-slate-200 pb-5 space-y-3 sm:space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-mono font-bold bg-slate-900 text-white">
                      {activeSurvey.id}
                    </span>
                    <span className="text-slate-400 font-mono">•</span>
                    <span className="text-[11px] text-slate-500 font-mono truncate">
                      Lead Ref: {activeSurvey.leadId || 'Direct'}
                    </span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight truncate">
                    {activeSurvey.customerName}
                  </h1>
                  <p className="text-xs text-slate-600 mt-1 flex items-start gap-1.5 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>{activeSurvey.address || 'Address not recorded'}</span>
                  </p>
                  <p className="text-xs text-slate-600 mt-0.5 flex items-center gap-1.5 font-medium">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Mobile: {activeSurvey.phone}</span>
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-left sm:text-right space-y-1 w-full sm:w-auto">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Assigned Field Engineer
                  </span>
                  <span className="font-bold text-slate-900 text-sm block">
                    {activeSurvey.engineerName}
                  </span>
                  <div className="text-[11px] text-slate-600 flex items-center sm:justify-end gap-1 font-medium">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>Visit Date: {activeSurvey.scheduledDate}</span>
                  </div>
                  {(() => {
                    const dueInfo = getSurveyScheduleDueInfo(activeSurvey);
                    if (!dueInfo) return null;
                    return (
                      <div className={`text-[11px] font-bold flex items-center sm:justify-end gap-1 ${dueInfo.isOverdue ? 'text-red-600' : 'text-amber-700'}`}>
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>{dueInfo.badgeText} ({dueInfo.daysText})</span>
                      </div>
                    );
                  })()}
                  <button
                    onClick={() => {
                      setRescheduleDate(activeSurvey.scheduledDate);
                      setRescheduleModalOpen(true);
                    }}
                    className="text-[11px] text-teal-700 hover:text-teal-800 font-bold underline cursor-pointer mt-1 inline-block"
                  >
                    Reschedule Visit
                  </button>
                </div>
              </div>

              {/* Status Banner */}
              <div className={`p-3 sm:p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 sm:gap-3 ${
                activeSurvey.status === 'Approved' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' :
                activeSurvey.status === 'Submitted for Review' ? 'bg-blue-50 border-blue-200 text-blue-900' :
                activeSurvey.status === 'Changes Required' ? 'bg-red-50 border-red-200 text-red-900' :
                'bg-slate-50 border-slate-200 text-slate-800'
              }`}>
                <div className="space-y-0.5">
                  <div className="font-bold text-xs flex items-center gap-1.5">
                    {activeSurvey.status === 'Approved' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> :
                     activeSurvey.status === 'Changes Required' ? <AlertCircle className="w-4 h-4 text-red-600 shrink-0" /> :
                     <Info className="w-4 h-4 text-slate-500 shrink-0" />}
                    <span>Audit Status: {activeSurvey.status}</span>
                  </div>
                  <div className="text-[11px] opacity-80">
                    {activeSurvey.status === 'Approved' ? 'Engineering findings signed off. Verified capacity unlocked for quotation generation.' :
                     activeSurvey.status === 'Submitted for Review' ? `Submitted on ${activeSurvey.submittedAt ? new Date(activeSurvey.submittedAt).toLocaleDateString() : 'recently'}. Pending Project Manager sign-off.` :
                     activeSurvey.status === 'Changes Required' ? `Reviewer remarks: "${activeSurvey.reviewComments || 'Corrections requested'}"` :
                     'Survey in progress. Measurements can be saved as draft across multi-day visits.'}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={`px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-bold uppercase tracking-wider ${
                    measurementStatus === 'Verified' ? 'bg-emerald-600 text-white' :
                    measurementStatus === 'Engineer Entered' ? 'bg-indigo-600 text-white' :
                    'bg-amber-100 text-amber-900 border border-amber-300'
                  }`}>
                    {measurementStatus}
                  </span>
                </div>
              </div>
            </div>

            {/* ========================================================= */}
            {/* 2. ROOFTOP ENGINEERING MEASUREMENTS */}
            {/* ========================================================= */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
                    <span>2. Rooftop Engineering Measurements</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Physical rooftop dimensions, usable shadow-free area, azimuth, tilt, and obstacles.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2">
                  <div className="flex items-center gap-1.5 justify-between sm:justify-start">
                    <label className="text-[11px] font-bold text-slate-500 shrink-0">Measurement Status:</label>
                    {renderDropdownAddButton('measurementStatus')}
                  </div>
                  {renderAddOptionInput('measurementStatus', setMeasurementStatus)}
                  <select
                    disabled={!isEditingMode}
                    value={measurementStatus}
                    onChange={e => setMeasurementStatus(e.target.value)}
                    className="p-1.5 bg-slate-50 disabled:bg-slate-100 disabled:text-slate-600 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 w-full sm:w-auto disabled:cursor-not-allowed"
                  >
                    <option value="Initial Estimate">Initial Estimate (Unverified)</option>
                    <option value="Engineer Entered">Engineer Entered</option>
                    <option value="Verified">Verified on Site</option>
                    <option value="Requires Correction">Requires Correction</option>
                    {(customDropdownOptions['measurementStatus'] || []).map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                    {measurementStatus && !['Initial Estimate', 'Engineer Entered', 'Verified', 'Requires Correction', ...(customDropdownOptions['measurementStatus'] || [])].includes(measurementStatus) && (
                      <option value={measurementStatus}>{measurementStatus}</option>
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Total Roof Area (Sq. Ft.) *
                  </label>
                  <input
                    type="number"
                    disabled={!isEditingMode}
                    value={roofArea || ''}
                    onChange={e => setRoofArea(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 disabled:bg-slate-100 disabled:text-slate-600 disabled:cursor-not-allowed border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 font-mono"
                    placeholder="e.g. 1500"
                  />
                  {measurementStatus === 'Initial Estimate' && (
                    <span className="text-[10px] text-amber-700 font-semibold block mt-1">
                      ⚠️ Lead estimate — confirm with laser meter
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Usable Shadow-Free Area (Sq. Ft.) *
                  </label>
                  <input
                    type="number"
                    disabled={!isEditingMode}
                    value={shadowFreeArea || ''}
                    onChange={e => setShadowFreeArea(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 disabled:bg-slate-100 disabled:text-slate-600 disabled:cursor-not-allowed border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 font-mono"
                    placeholder="e.g. 1275"
                  />
                  <span className="text-[10px] text-slate-500 block mt-1">
                    Excludes perimeter border &amp; obstacle shadows
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-slate-700">
                      Roof Geometry &amp; Shape
                    </label>
                    {renderDropdownAddButton('roofShape')}
                  </div>
                  {renderAddOptionInput('roofShape', setRoofShape)}
                  <select
                    disabled={!isEditingMode}
                    value={roofShape}
                    onChange={e => setRoofShape(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 disabled:bg-slate-100 disabled:text-slate-600 disabled:cursor-not-allowed border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Rectangular">Rectangular / Square</option>
                    <option value="L-Shaped">L-Shaped</option>
                    <option value="Irregular Multi-Plane">Irregular Multi-Plane</option>
                    <option value="Sloped / Pitched">Sloped / Pitched</option>
                    {(customDropdownOptions['roofShape'] || []).map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                    {roofShape && !['Rectangular', 'L-Shaped', 'Irregular Multi-Plane', 'Sloped / Pitched', ...(customDropdownOptions['roofShape'] || [])].includes(roofShape) && (
                      <option value={roofShape}>{roofShape}</option>
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-slate-700">Roof Type</label>
                    {renderDropdownAddButton('roofType')}
                  </div>
                  {renderAddOptionInput('roofType', setRoofType)}
                  <select
                    disabled={!isEditingMode}
                    value={roofType}
                    onChange={e => setRoofType(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 disabled:bg-slate-100 disabled:text-slate-600 disabled:cursor-not-allowed border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="RCC Flat">RCC Flat Slab</option>
                    <option value="Tin Shed">Metal / Tin Shed</option>
                    <option value="Tiled">Tiled Roof</option>
                    <option value="Elevated Structure">Elevated Structure</option>
                    {(customDropdownOptions['roofType'] || []).map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                    {roofType && !['RCC Flat', 'Tin Shed', 'Tiled', 'Elevated Structure', ...(customDropdownOptions['roofType'] || [])].includes(roofType) && (
                      <option value={roofType}>{roofType}</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Azimuth (°)</label>
                  <input
                    type="number"
                    disabled={!isEditingMode}
                    min={0}
                    max={360}
                    value={azimuth}
                    onChange={e => setAzimuth(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 disabled:bg-slate-100 disabled:text-slate-600 disabled:cursor-not-allowed border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                  <span className="text-[10px] text-emerald-700 font-semibold block mt-1 truncate">
                    {azimuth}° ({azimuth === 180 ? 'South' : azimuth < 180 ? 'SE' : 'SW'})
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Tilt (°)</label>
                  <input
                    type="number"
                    disabled={!isEditingMode}
                    min={5}
                    max={45}
                    value={tilt}
                    onChange={e => setTilt(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 disabled:bg-slate-100 disabled:text-slate-600 disabled:cursor-not-allowed border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                  <span className="text-[10px] text-emerald-700 font-semibold block mt-1 truncate">
                    Optimal: 12°-15°
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-slate-700">Surface</label>
                    {renderDropdownAddButton('surfaceCondition')}
                  </div>
                  {renderAddOptionInput('surfaceCondition', setSurfaceCondition)}
                  <select
                    disabled={!isEditingMode}
                    value={surfaceCondition}
                    onChange={e => setSurfaceCondition(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 disabled:bg-slate-100 disabled:text-slate-600 disabled:cursor-not-allowed border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Rough / Uneven">Rough</option>
                    <option value="Needs Waterproofing">Seepage</option>
                    {(customDropdownOptions['surfaceCondition'] || []).map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                    {surfaceCondition && !['Good', 'Fair', 'Rough / Uneven', 'Needs Waterproofing', ...(customDropdownOptions['surfaceCondition'] || [])].includes(surfaceCondition) && (
                      <option value={surfaceCondition}>{surfaceCondition}</option>
                    )}
                  </select>
                </div>
              </div>

              {/* Obstacle Checklist */}
              <div className="bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-200 space-y-2">
                <span className="text-[11px] font-bold text-slate-800 block">
                  Observed Rooftop Obstacles:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                  <label className={`p-2.5 rounded-lg border flex items-center gap-2 cursor-pointer transition-colors ${obstaclesWaterTank ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold' : 'bg-white border-slate-200 text-slate-600'}`}>
                    <input type="checkbox" checked={obstaclesWaterTank} onChange={e => setObstaclesWaterTank(e.target.checked)} className="rounded text-emerald-600" />
                    <span className="text-xs">Water Tank</span>
                  </label>

                  <label className={`p-2.5 rounded-lg border flex items-center gap-2 cursor-pointer transition-colors ${obstaclesMumty ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold' : 'bg-white border-slate-200 text-slate-600'}`}>
                    <input type="checkbox" checked={obstaclesMumty} onChange={e => setObstaclesMumty(e.target.checked)} className="rounded text-emerald-600" />
                    <span className="text-xs">Mumty Room</span>
                  </label>

                  <label className={`p-2.5 rounded-lg border flex items-center gap-2 cursor-pointer transition-colors ${obstaclesParapet ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold' : 'bg-white border-slate-200 text-slate-600'}`}>
                    <input type="checkbox" checked={obstaclesParapet} onChange={e => setObstaclesParapet(e.target.checked)} className="rounded text-emerald-600" />
                    <span className="text-xs">Parapet Wall</span>
                  </label>

                  <label className={`p-2.5 rounded-lg border flex items-center gap-2 cursor-pointer transition-colors ${obstaclesTrees ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold' : 'bg-white border-slate-200 text-slate-600'}`}>
                    <input type="checkbox" checked={obstaclesTrees} onChange={e => setObstaclesTrees(e.target.checked)} className="rounded text-emerald-600" />
                    <span className="text-xs">Trees / Wall</span>
                  </label>
                </div>
              </div>
            </div>

            {/* ========================================================= */}
            {/* 3. ELECTRICAL INSPECTION */}
            {/* ========================================================= */}
            <div className="space-y-4 border-t border-slate-200 pt-5 sm:pt-6">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                  <span>3. Electrical Inspection</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Main meter, sanctioned load, AC/DC distribution boards, earthing pits, and cable route.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Sanctioned Load (kW) *</label>
                  <input
                    type="number"
                    disabled={!isEditingMode}
                    value={sanctionLoad}
                    onChange={e => setSanctionLoad(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 disabled:bg-slate-100 disabled:text-slate-600 disabled:cursor-not-allowed border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                  <span className="text-[10px] text-slate-500 block mt-1">DISCOM Sanctioned Power</span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-slate-700">Grid Connection Phase</label>
                    {renderDropdownAddButton('gridPhase')}
                  </div>
                  {renderAddOptionInput('gridPhase', setGridPhase)}
                  <select
                    disabled={!isEditingMode}
                    value={gridPhase}
                    onChange={e => setGridPhase(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 disabled:bg-slate-100 disabled:text-slate-600 disabled:cursor-not-allowed border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Three Phase">Three Phase (3φ - 415V)</option>
                    <option value="Single Phase">Single Phase (1φ - 230V)</option>
                    {(customDropdownOptions['gridPhase'] || []).map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                    {gridPhase && !['Three Phase', 'Single Phase', ...(customDropdownOptions['gridPhase'] || [])].includes(gridPhase) && (
                      <option value={gridPhase}>{gridPhase}</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Cable Run to LT Meter (Meters)</label>
                  <input
                    type="number"
                    disabled={!isEditingMode}
                    value={distanceToLt}
                    onChange={e => setDistanceToLt(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 disabled:bg-slate-100 disabled:text-slate-600 disabled:cursor-not-allowed border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-slate-700">Main Meter Status</label>
                    {renderDropdownAddButton('mainMeterStatus')}
                  </div>
                  {renderAddOptionInput('mainMeterStatus', setMainMeterStatus)}
                  <select
                    disabled={!isEditingMode}
                    value={mainMeterStatus}
                    onChange={e => setMainMeterStatus(e.target.value)}
                    className={`w-full p-2.5 rounded-xl text-xs font-semibold border disabled:opacity-80 disabled:cursor-not-allowed ${
                      mainMeterStatus === 'Pass' ? 'bg-emerald-50 border-emerald-300 text-emerald-900' :
                      mainMeterStatus === 'Needs Attention' ? 'bg-red-50 border-red-300 text-red-900' :
                      'bg-slate-50 border-slate-300 text-slate-700'
                    }`}
                  >
                    <option value="Not Assessed">Not Assessed</option>
                    <option value="Pass">Pass (Bi-Directional Compatible)</option>
                    <option value="Needs Attention">Needs Attention / DISCOM Upgrade Required</option>
                    {(customDropdownOptions['mainMeterStatus'] || []).map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                    {mainMeterStatus && !['Not Assessed', 'Pass', 'Needs Attention', ...(customDropdownOptions['mainMeterStatus'] || [])].includes(mainMeterStatus) && (
                      <option value={mainMeterStatus}>{mainMeterStatus}</option>
                    )}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-slate-700">Distribution Board (DB) Condition</label>
                    {renderDropdownAddButton('dbCondition')}
                  </div>
                  {renderAddOptionInput('dbCondition', setDbCondition)}
                  <select
                    disabled={!isEditingMode}
                    value={dbCondition}
                    onChange={e => setDbCondition(e.target.value)}
                    className={`w-full p-2.5 rounded-xl text-xs font-semibold border disabled:opacity-80 disabled:cursor-not-allowed ${
                      dbCondition === 'Pass' ? 'bg-emerald-50 border-emerald-300 text-emerald-900' :
                      dbCondition === 'Needs Attention' ? 'bg-red-50 border-red-300 text-red-900' :
                      'bg-slate-50 border-slate-300 text-slate-700'
                    }`}
                  >
                    <option value="Not Assessed">Not Assessed</option>
                    <option value="Pass">Pass (Adequate Busbar &amp; Breakers)</option>
                    <option value="Needs Attention">Needs Attention / Sub-panel Required</option>
                    {(customDropdownOptions['dbCondition'] || []).map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                    {dbCondition && !['Not Assessed', 'Pass', 'Needs Attention', ...(customDropdownOptions['dbCondition'] || [])].includes(dbCondition) && (
                      <option value={dbCondition}>{dbCondition}</option>
                    )}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-slate-700">Earthing Pit &amp; Resistance</label>
                    {renderDropdownAddButton('earthingStatus')}
                  </div>
                  {renderAddOptionInput('earthingStatus', setEarthingStatus)}
                  <div className="flex gap-2">
                    <select
                      disabled={!isEditingMode}
                      value={earthingStatus}
                      onChange={e => setEarthingStatus(e.target.value)}
                      className="p-2.5 bg-slate-50 disabled:bg-slate-100 disabled:text-slate-600 disabled:cursor-not-allowed border border-slate-300 rounded-xl text-xs font-semibold flex-1"
                    >
                      <option value="Not Assessed">Not Assessed</option>
                      <option value="Pass">Pass</option>
                      <option value="Needs Attention">New Pits Required</option>
                      {(customDropdownOptions['earthingStatus'] || []).map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                      {earthingStatus && !['Not Assessed', 'Pass', 'Needs Attention', ...(customDropdownOptions['earthingStatus'] || [])].includes(earthingStatus) && (
                        <option value={earthingStatus}>{earthingStatus}</option>
                      )}
                    </select>
                    <input
                      type="number"
                      disabled={!isEditingMode}
                      placeholder="Ohms"
                      value={earthingResistance}
                      onChange={e => setEarthingResistance(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-20 p-2.5 bg-slate-50 disabled:bg-slate-100 disabled:text-slate-600 disabled:cursor-not-allowed border border-slate-300 rounded-xl text-xs font-mono font-semibold"
                      title="Target < 5 Ohms"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Proposed Inverter Location &amp; Route Notes</label>
                <input
                  type="text"
                  disabled={!isEditingMode}
                  value={proposedInverterLoc}
                  onChange={e => setProposedInverterLoc(e.target.value)}
                  placeholder="e.g. Under mumty room shade, adjacent to staircase wall (weather-protected)"
                  className="w-full p-2.5 bg-slate-50 disabled:bg-slate-100 disabled:text-slate-600 disabled:cursor-not-allowed border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* ========================================================= */}
            {/* 4. STRUCTURAL AND SHADING ASSESSMENT */}
            {/* ========================================================= */}
            <div className="space-y-4 border-t border-slate-200 pt-5 sm:pt-6">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-600 shrink-0" />
                  <span>4. Structural &amp; Shading Assessment</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Roof integrity, waterproofing status, mounting frame selection, and shadow profiles.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-slate-700">Waterproofing Status</label>
                    {renderDropdownAddButton('waterproofingStatus')}
                  </div>
                  {renderAddOptionInput('waterproofingStatus', setWaterproofingStatus)}
                  <select
                    disabled={!isEditingMode}
                    value={waterproofingStatus}
                    onChange={e => setWaterproofingStatus(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 disabled:bg-slate-100 disabled:text-slate-600 disabled:cursor-not-allowed border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Good">Good (No Seepage)</option>
                    <option value="Needs Repair">Needs Repair Before Solar Installation</option>
                    <option value="Critical">Critical Damage / Water Stagnation</option>
                    {(customDropdownOptions['waterproofingStatus'] || []).map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                    {waterproofingStatus && !['Good', 'Needs Repair', 'Critical', ...(customDropdownOptions['waterproofingStatus'] || [])].includes(waterproofingStatus) && (
                      <option value={waterproofingStatus}>{waterproofingStatus}</option>
                    )}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-slate-700">Mounting Structure Selection</label>
                    {renderDropdownAddButton('mountingStructureType')}
                  </div>
                  {renderAddOptionInput('mountingStructureType', setMountingStructureType)}
                  <select
                    disabled={!isEditingMode}
                    value={mountingStructureType}
                    onChange={e => setMountingStructureType(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 disabled:bg-slate-100 disabled:text-slate-600 disabled:cursor-not-allowed border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Standard Elevated">Standard Elevated Hot-Dip GI (1.5m Clearance)</option>
                    <option value="Super Elevated">Super Elevated Gazebo Structure (2.5m Walkable)</option>
                    <option value="Ballast Non-Penetrating">Ballast Non-Penetrating (Concrete Blocks)</option>
                    <option value="Tin Shed Clamp">Tin Shed Short Rail Clamps</option>
                    {(customDropdownOptions['mountingStructureType'] || []).map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                    {mountingStructureType && !['Standard Elevated', 'Super Elevated', 'Ballast Non-Penetrating', 'Tin Shed Clamp', ...(customDropdownOptions['mountingStructureType'] || [])].includes(mountingStructureType) && (
                      <option value={mountingStructureType}>{mountingStructureType}</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Shading Affected Area (Sq. Ft.)</label>
                  <input
                    type="number"
                    disabled={!isEditingMode}
                    value={shadingArea}
                    onChange={e => setShadingArea(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 disabled:bg-slate-100 disabled:text-slate-600 disabled:cursor-not-allowed border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 font-mono"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4">
                <label className={`p-3 rounded-xl border flex items-center gap-3 transition-colors ${!isEditingMode ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'} ${visibleCracks ? 'bg-red-50 border-red-300 text-red-900 font-bold' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                  <input 
                    type="checkbox" 
                    disabled={!isEditingMode}
                    checked={visibleCracks} 
                    onChange={e => setVisibleCracks(e.target.checked)} 
                    className="rounded text-red-600 shrink-0 disabled:cursor-not-allowed" 
                  />
                  <div>
                    <span className="block text-xs">Visible Surface Cracks / Dampness</span>
                    <span className="text-[10px] text-slate-500 font-normal">Check if structural patching is needed</span>
                  </div>
                </label>

                <label className={`p-3 rounded-xl border flex items-center gap-3 transition-colors ${!isEditingMode ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'} ${structuralEngineerReq ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                  <input 
                    type="checkbox" 
                    disabled={!isEditingMode}
                    checked={structuralEngineerReq} 
                    onChange={e => setStructuralEngineerReq(e.target.checked)} 
                    className="rounded text-amber-600 shrink-0 disabled:cursor-not-allowed" 
                  />
                  <div>
                    <span className="block text-xs">Structural Engineer Sign-off</span>
                    <span className="text-[10px] text-slate-500 font-normal">Required for super-elevated structures</span>
                  </div>
                </label>
              </div>
            </div>

            {/* ========================================================= */}
            {/* 5. GEO-TAGGED SITE PHOTOGRAPHS (REAL UPLOADS & ISOLATION) */}
            {/* ========================================================= */}
            <div className="space-y-4 border-t border-slate-200 pt-5 sm:pt-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-600 shrink-0" />
                    <span>5. Site Photographs ({activeSurvey.photos?.length || 0} Uploaded)</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Real field evidence stored with real-time GPS metadata.
                  </p>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                    <Check className="w-3 h-3" />
                    <span>Geo-verification enabled</span>
                  </span>
                </div>
              </div>

              {uploadError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* 9 Photographic Category Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {PHOTO_CATEGORIES.map(cat => {
                  const categoryPhotos = (activeSurvey.photos || []).filter(p => p.category === cat.key);
                  const isUploading = uploadingCategory === cat.key;

                  return (
                    <div 
                      key={cat.key}
                      className="bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-3.5 flex flex-col justify-between space-y-2.5 sm:space-y-3"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-slate-900 text-xs truncate" title={cat.label}>
                            {cat.label}
                          </span>
                          {cat.mandatory && (
                            <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-[9px] font-bold shrink-0">
                              Required
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                          {cat.hint}
                        </p>
                      </div>

                      {/* Display Photos in this category */}
                      {categoryPhotos.length > 0 ? (
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            {categoryPhotos.map(photo => (
                              <div 
                                key={photo.id}
                                className="relative rounded-lg overflow-hidden border border-slate-200 group bg-slate-900 h-20 cursor-pointer"
                                onClick={() => setPreviewPhoto(photo)}
                              >
                                <img 
                                  src={photo.filePath} 
                                  alt={photo.caption || cat.label} 
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                  <Eye className="w-4 h-4 text-white" />
                                  {isEditingMode && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeletePhoto(photo.id);
                                      }}
                                      className="p-1 bg-red-600 hover:bg-red-700 text-white rounded cursor-pointer"
                                      title="Delete photo"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                                {photo.geoVerified && (
                                  <div className="absolute bottom-1 left-1 px-1 py-0.2 bg-emerald-900/80 text-white rounded text-[8px] font-mono font-bold flex items-center gap-0.5">
                                    <MapPin className="w-2 h-2 text-emerald-400" />
                                    <span>Geo-tagged</span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                          
                          <div className="flex items-center justify-between pt-1 text-[10px]">
                            <span className="text-slate-500">{categoryPhotos.length} photo(s)</span>
                            {isEditingMode ? (
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => openLiveCamera(cat.label, 'environment', { type: 'category', category: cat.key })}
                                  disabled={isUploading}
                                  className="text-slate-700 font-bold hover:underline cursor-pointer flex items-center gap-1"
                                >
                                  <Camera className="w-3 h-3" />
                                  <span>+ Camera</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleTriggerUpload(cat.key, false)}
                                  disabled={isUploading}
                                  className="text-teal-700 font-bold hover:underline cursor-pointer flex items-center gap-1"
                                >
                                  <Upload className="w-3 h-3" />
                                  <span>+ Upload</span>
                                </button>
                              </div>
                            ) : (
                              <span className="text-slate-400 font-medium">Locked in Inspect Mode</span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="border border-dashed border-slate-300 rounded-lg p-3 text-center bg-white space-y-2">
                          <span className="text-[10px] text-slate-400 block">
                            No photograph uploaded
                          </span>
                          {isEditingMode ? (
                            <div className="flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => openLiveCamera(cat.label, 'environment', { type: 'category', category: cat.key })}
                                disabled={isUploading}
                                className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[10px] flex items-center justify-center gap-1 cursor-pointer transition-colors"
                              >
                                <Camera className="w-3 h-3" />
                                <span>Camera</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleTriggerUpload(cat.key, false)}
                                disabled={isUploading}
                                className="flex-1 py-1.5 px-2 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold rounded-lg text-[10px] flex items-center justify-center gap-1 cursor-pointer transition-colors"
                              >
                                <Upload className="w-3 h-3" />
                                <span>Upload</span>
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-medium block">
                              Click &quot;Edit Survey&quot; above to upload
                            </span>
                          )}
                        </div>
                      )}

                      {isUploading && (
                        <div className="text-[10px] text-teal-700 font-bold flex items-center justify-center gap-1">
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          <span>Uploading &amp; checking GPS...</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ========================================================= */}
            {/* 6. ENGINEER FINDINGS & VERIFIED SOLAR RECOMMENDATION */}
            {/* ========================================================= */}
            <div className="space-y-4 border-t border-slate-200 pt-5 sm:pt-6">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-teal-600 shrink-0" />
                  <span>6. Findings &amp; Technical Feasibility Recommendation</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Calculated from verified shadow-free area ({shadowFreeArea} sq.ft) &amp; sanctioned load ({sanctionLoad} kW).
                </p>
              </div>

              {/* Site Feasibility Assessment */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3.5 sm:p-4 rounded-xl border border-slate-200">
                <div>
                  <div className="flex items-center gap-2">
                    <label className="block text-[11px] font-bold text-slate-800">
                      Site Feasibility Verdict
                    </label>
                    {renderDropdownAddButton('feasibilityVerdict')}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Lead engineer's assessment on overall solar feasibility and structural readiness.
                  </p>
                  {renderAddOptionInput('feasibilityVerdict', setFeasibilityVerdict)}
                </div>
                <select
                  value={feasibilityVerdict}
                  disabled={!isEditingMode}
                  onChange={e => setFeasibilityVerdict(e.target.value)}
                  className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 w-full sm:w-auto disabled:opacity-75 disabled:cursor-not-allowed focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Feasible">Feasible (Full Solar Potential)</option>
                  <option value="Feasible with Conditions">Feasible with Conditions</option>
                  <option value="Not Feasible">Not Feasible (Severe Obstacles)</option>
                  {(customDropdownOptions['feasibilityVerdict'] || []).map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                  {feasibilityVerdict && !['Feasible', 'Feasible with Conditions', 'Not Feasible', ...(customDropdownOptions['feasibilityVerdict'] || [])].includes(feasibilityVerdict) && (
                    <option value={feasibilityVerdict}>{feasibilityVerdict}</option>
                  )}
                </select>
              </div>

              {/* Equipment Specifications */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Inverter Specification</label>
                  <input
                    type="text"
                    value={inverterRec}
                    disabled={!isEditingMode}
                    readOnly={!isEditingMode}
                    onChange={e => setInverterRec(e.target.value)}
                    placeholder="e.g. Sungrow 5kW On-Grid String Inverter"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 disabled:opacity-75 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Cabling &amp; BOS Specification</label>
                  <input
                    type="text"
                    value={cableSpec}
                    disabled={!isEditingMode}
                    readOnly={!isEditingMode}
                    onChange={e => setCableSpec(e.target.value)}
                    placeholder="e.g. 1 x 4 sq.mm Solar DC Cu, 4C x 16 sq.mm AC Al XLPE"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 disabled:opacity-75 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Lead Engineer Remarks &amp; Site Observations
                </label>
                <textarea
                  rows={3}
                  value={engineerNotes}
                  disabled={!isEditingMode}
                  readOnly={!isEditingMode}
                  onChange={e => setEngineerNotes(e.target.value)}
                  placeholder="Record shadow profile timings, inverter mounting notes, DISCOM meter observation, and any special safety precautions..."
                  className="w-full p-2.5 sm:p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 disabled:opacity-75 disabled:cursor-not-allowed"
                />
              </div>

              {/* Custom Site Fields */}
              <div className="bg-slate-50/90 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                      <Plus className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Custom Site Fields &amp; Extra Observations</span>
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Add any extra site parameters, measurements, or site-specific notes that may not be in standard fields.
                    </p>
                  </div>
                  {isEditingMode && (
                    <button
                      type="button"
                      onClick={() => {
                        setCustomFields(prev => [
                          ...prev,
                          { id: `cf-${Date.now()}`, label: '', value: '' }
                        ]);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Add Custom Field</span>
                    </button>
                  )}
                </div>

                {customFields.length === 0 ? (
                  <div className="text-center py-4 border border-dashed border-slate-300 rounded-xl text-slate-400 text-xs">
                    No custom fields added yet. {isEditingMode ? 'Click "+ Add Custom Field" above to add extra observations or customer-specific variables.' : 'Unlock edit mode to add extra site variables.'}
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {customFields.map((cf, idx) => (
                      <div key={cf.id} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
                        <input
                          type="text"
                          value={cf.label}
                          disabled={!isEditingMode}
                          placeholder="Field Name (e.g. DG Capacity, Parapet Height, Terrace Key, Water Point)"
                          onChange={e => {
                            const updated = [...customFields];
                            updated[idx].label = e.target.value;
                            setCustomFields(updated);
                          }}
                          className="flex-1 p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-emerald-500 disabled:opacity-75"
                        />
                        <input
                          type="text"
                          value={cf.value}
                          disabled={!isEditingMode}
                          placeholder="Field Value (e.g. 25 kVA Kirloskar, 3.5 ft RCC, Available on site)"
                          onChange={e => {
                            const updated = [...customFields];
                            updated[idx].value = e.target.value;
                            setCustomFields(updated);
                          }}
                          className="flex-1 p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-emerald-500 disabled:opacity-75"
                        />
                        {isEditingMode && (
                          <button
                            type="button"
                            onClick={() => {
                              setCustomFields(prev => prev.filter((_, i) => i !== idx));
                            }}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer shrink-0 self-end sm:self-center"
                            title="Remove Field"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

              {/* ========================================================= */}
              {/* 7. CUSTOMER PHOTOGRAPH & IDENTITY PROOF UPLOAD */}
              {/* ========================================================= */}
              <div className="space-y-4 border-t border-slate-200 pt-5 sm:pt-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
                      <span>7. Customer Photograph &amp; Identity Document Upload</span>
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Required for DISCOM net metering &amp; government subsidy verification. Stored securely in protected storage.
                    </p>
                  </div>

                  {savedDocMetadata && (
                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-[10px] font-bold inline-flex items-center gap-1.5 self-start sm:self-auto">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>ID Stored Securely ({savedDocMetadata.document_type || 'Aadhaar'})</span>
                    </span>
                  )}
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[11px] font-bold text-slate-700">
                          Document Type
                        </label>
                        {renderDropdownAddButton('docType')}
                      </div>
                      {renderAddOptionInput('docType', setDocType)}
                      <select
                        disabled={!isEditingMode}
                        value={docType}
                        onChange={e => setDocType(e.target.value)}
                        className="w-full p-2.5 bg-white disabled:bg-slate-100 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="Aadhaar Card (Masked)">Aadhaar Card (Masked Last 4 Digits)</option>
                        <option value="Voter ID">Voter ID Card</option>
                        <option value="PAN Card">PAN Card</option>
                        <option value="Driving Licence">Driving Licence</option>
                        <option value="Passport">Passport</option>
                        {(customDropdownOptions['docType'] || []).map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                        {docType && !['Aadhaar Card (Masked)', 'Voter ID', 'PAN Card', 'Driving Licence', 'Passport', ...(customDropdownOptions['docType'] || [])].includes(docType) && (
                          <option value={docType}>{docType}</option>
                        )}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Document Number (Last 4 Digits or Number)
                      </label>
                      <input
                        type="text"
                        disabled={!isEditingMode}
                        value={docIdNumber}
                        onChange={e => setDocIdNumber(e.target.value)}
                        placeholder="e.g. XXXX-XXXX-4589"
                        className="w-full p-2.5 bg-white disabled:bg-slate-100 border border-slate-300 rounded-xl text-xs font-mono font-medium focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  {/* 3 Upload / Capture Boxes */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Customer Photo */}
                    <div className="bg-white p-3 rounded-xl border border-slate-200 text-center space-y-2">
                      <span className="block text-[11px] font-bold text-slate-800">1. Customer Photo</span>
                      <div className="h-28 rounded-lg bg-slate-100 border border-dashed border-slate-300 flex items-center justify-center overflow-hidden">
                        {customerPhotoBase64 ? (
                          <img src={customerPhotoBase64} alt="Customer" className="h-full w-full object-cover" />
                        ) : (
                          <User className="w-8 h-8 text-slate-300" />
                        )}
                      </div>
                      {isEditingMode && (
                        <div className="flex items-center gap-1.5 justify-center">
                          <button
                            type="button"
                            onClick={() => openLiveCamera('Capture Customer Photo', 'user', { type: 'customer_photo' })}
                            className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-lg text-[10px] flex items-center gap-1 cursor-pointer"
                          >
                            <Camera className="w-3 h-3" />
                            <span>Take Photo</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => customerPhotoInputRef.current?.click()}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-[10px] flex items-center gap-1 cursor-pointer"
                          >
                            <Upload className="w-3 h-3" />
                            <span>Upload</span>
                          </button>
                        </div>
                      )}
                      <input
                        ref={customerPhotoInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async e => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const b64 = await readFileAsBase64(file);
                            setCustomerPhotoBase64(b64);
                          }
                        }}
                      />
                    </div>

                    {/* ID Front */}
                    <div className="bg-white p-3 rounded-xl border border-slate-200 text-center space-y-2">
                      <span className="block text-[11px] font-bold text-slate-800">2. ID Proof (Front)</span>
                      <div className="h-28 rounded-lg bg-slate-100 border border-dashed border-slate-300 flex items-center justify-center overflow-hidden">
                        {docFrontBase64 ? (
                          <img src={docFrontBase64} alt="ID Front" className="h-full w-full object-cover" />
                        ) : (
                          <FileText className="w-8 h-8 text-slate-300" />
                        )}
                      </div>
                      {isEditingMode && (
                        <div className="flex items-center gap-1.5 justify-center">
                          <button
                            type="button"
                            onClick={() => openLiveCamera('Capture ID Proof (Front)', 'environment', { type: 'doc_front' })}
                            className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-lg text-[10px] flex items-center gap-1 cursor-pointer"
                          >
                            <Camera className="w-3 h-3" />
                            <span>Camera</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => docFrontInputRef.current?.click()}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-[10px] flex items-center gap-1 cursor-pointer"
                          >
                            <Upload className="w-3 h-3" />
                            <span>Upload</span>
                          </button>
                        </div>
                      )}
                      <input
                        ref={docFrontInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async e => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const b64 = await readFileAsBase64(file);
                            setDocFrontBase64(b64);
                          }
                        }}
                      />
                    </div>

                    {/* ID Back */}
                    <div className="bg-white p-3 rounded-xl border border-slate-200 text-center space-y-2">
                      <span className="block text-[11px] font-bold text-slate-800">3. ID Proof (Back / Address)</span>
                      <div className="h-28 rounded-lg bg-slate-100 border border-dashed border-slate-300 flex items-center justify-center overflow-hidden">
                        {docBackBase64 ? (
                          <img src={docBackBase64} alt="ID Back" className="h-full w-full object-cover" />
                        ) : (
                          <FileText className="w-8 h-8 text-slate-300" />
                        )}
                      </div>
                      {isEditingMode && (
                        <div className="flex items-center gap-1.5 justify-center">
                          <button
                            type="button"
                            onClick={() => openLiveCamera('Capture ID Proof (Back / Address)', 'environment', { type: 'doc_back' })}
                            className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-lg text-[10px] flex items-center gap-1 cursor-pointer"
                          >
                            <Camera className="w-3 h-3" />
                            <span>Camera</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => docBackInputRef.current?.click()}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-[10px] flex items-center gap-1 cursor-pointer"
                          >
                            <Upload className="w-3 h-3" />
                            <span>Upload</span>
                          </button>
                        </div>
                      )}
                      <input
                        ref={docBackInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async e => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const b64 = await readFileAsBase64(file);
                            setDocBackBase64(b64);
                          }
                        }}
                      />
                    </div>
                  </div>

                  {isEditingMode && (
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-[10px] text-slate-400">
                        * Uploads are saved strictly to protected directory and access is limited to Project Manager &amp; Super Admin.
                      </span>
                      <button
                        type="button"
                        disabled={isUploadingDoc || (!customerPhotoBase64 && !docFrontBase64)}
                        onClick={async () => {
                          if (!activeSurvey) return;
                          try {
                            setIsUploadingDoc(true);
                            const res = await authFetch('/api/documents', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                surveyId: activeSurvey.id,
                                customerId: activeSurvey.leadId,
                                documentType: docType,
                                idNumber: docIdNumber,
                                customerPhotoBase64,
                                docFrontBase64,
                                docBackBase64,
                                notes: docNotes,
                              }),
                            });
                            const data = await res.json();
                            setIsUploadingDoc(false);
                            if (data.success) {
                              setSavedDocMetadata(data.document);
                              showToast('Customer photo & identity documents securely saved!', 'success');
                            } else {
                              showToast(data.error || 'Upload failed', 'error');
                            }
                          } catch (err: any) {
                            setIsUploadingDoc(false);
                            showToast(err.message, 'error');
                          }
                        }}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>{isUploadingDoc ? 'Saving Document...' : 'Save Customer Document'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>


              </div>
            )}
            {/* ========================================================= */}
            {/* 7. AUDIT & REVIEW HISTORY TRAIL */}
            {/* ========================================================= */}
            {activeSurvey.reviewHistory && activeSurvey.reviewHistory.length > 0 && (
              <div className="space-y-3 border-t border-slate-200 pt-5 sm:pt-6">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-slate-600 shrink-0" />
                  <span>7. Audit Submission &amp; Review History</span>
                </h3>

                <div className="space-y-2">
                  {activeSurvey.reviewHistory.map(hist => (
                    <div 
                      key={hist.id}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-start justify-between gap-1 text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            hist.action === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                            hist.action === 'Changes Required' ? 'bg-red-100 text-red-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {hist.action}
                          </span>
                          <span className="font-bold text-slate-800">{hist.reviewerName || 'Field Engineer'}</span>
                        </div>
                        <p className="text-slate-600 text-[11px] mt-1">{hist.comments || 'No remarks recorded'}</p>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">
                        {new Date(hist.createdAt).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="border-t border-slate-200 pt-5 sm:pt-6 flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-[11px] text-slate-500 font-medium">
                Survey ID: <strong className="font-mono text-slate-800">{activeSurvey.id}</strong> • Assigned: <strong>{activeSurvey.engineerName}</strong>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                {isReviewer ? (
                  !isEditingMode ? (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                      {(activeSurvey.status === 'Submitted for Review' || activeSurvey.status === 'Changes Required') && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setReviewDecision('Changes Required');
                              if (!reviewComments.trim()) {
                                showToast('Please type your revision remarks above before sending back.', 'error');
                                return;
                              }
                              handleReviewSurveyDirect('Changes Required', reviewComments);
                            }}
                            disabled={isSubmitting}
                            className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <AlertCircle className="w-4 h-4" />
                            <span>Reject / Request Changes</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setReviewDecision('Approved');
                              handleReviewSurveyDirect('Approved', reviewComments || 'Technical feasibility verified and approved.');
                            }}
                            disabled={isSubmitting}
                            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Approve Audit (Request Field BOM)</span>
                          </button>
                        </>
                      )}

                      {(activeSurvey.status === 'Approved' || activeSurvey.status === 'Completed') && (
                        !isReviewer && onNavigateToBom ? (
                          <button
                            type="button"
                            onClick={() => onNavigateToBom(activeSurvey.id)}
                            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                            title="Open Field BOM to configure materials"
                          >
                            <Layers className="w-4 h-4" />
                            <span>Configure Field BOM →</span>
                          </button>
                        ) : activeSurvey.quotationId ? (
                          <button
                            type="button"
                            onClick={() => activeSurvey.leadId && onNavigateToQuotation(activeSurvey.leadId)}
                            className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                            title={`Open Linked Quotation ${activeSurvey.quotationId}`}
                          >
                            <span>Open Quotation Draft</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        ) : null
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingMode(true);
                          showToast('Admin override: Edit mode unlocked.', 'info');
                        }}
                        className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer"
                        title="Admin override to adjust measurements"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Override Data</span>
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingMode(false);
                          showToast('Editing cancelled. Inspect mode restored.', 'info');
                        }}
                        className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer text-center text-xs"
                      >
                        Cancel Override
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveDraft}
                        disabled={isSaving}
                        className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-colors cursor-pointer text-center text-xs shadow-xs"
                      >
                        {isSaving ? 'Saving...' : 'Save Override'}
                      </button>
                    </>
                  )
                ) : (
                  !isEditingMode ? (
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingMode(true);
                        showToast('Edit mode unlocked. You can now modify survey data.', 'info');
                      }}
                      className="flex-1 sm:flex-none px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span>Edit Survey Details</span>
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingMode(false);
                          showToast('Editing cancelled. Inspect mode restored.', 'info');
                        }}
                        className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer text-center text-xs"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveDraft}
                        disabled={isSaving}
                        className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-colors cursor-pointer text-center text-xs shadow-xs"
                      >
                        {isSaving ? 'Saving...' : 'Save Draft'}
                      </button>
                      {activeSurvey.status !== 'Approved' && activeSurvey.status !== 'Completed' && (
                        <button
                          type="button"
                          onClick={handleOpenSubmitChecklist}
                          className="flex-1 sm:flex-none px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 text-center text-xs"
                        >
                          <Send className="w-4 h-4" />
                          <span>Submit for Review</span>
                        </button>
                      )}
                    </>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* VIEW 2: MASTER GRID / TABLE OF ALL SURVEYS */}
      {/* ========================================================= */}
      {activeViewMode === 'grid' && (
        <div className="space-y-4 sm:space-y-6">
          {/* Role-Specific Master Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  isReviewer ? 'bg-indigo-100 text-indigo-800' : 'bg-teal-100 text-teal-800'
                }`}>
                  {isReviewer ? 'Project Management Technical Sign-Off' : 'Field Engineering Auditing'}
                </span>
                <span className="text-slate-400">•</span>
                <span className="text-xs text-slate-500 font-semibold">{currentUser?.name || 'Authorized Engineer'}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {isReviewer ? 'Technical Survey Reviews & Sign-Off' : 'Assigned Site Surveys'}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {isReviewer 
                  ? 'Audit field measurements, verify shadow-free capacity, and sign off site audits to unlock quotation generation.'
                  : 'Conduct on-site audits, record shadow-free measurements, and upload geo-verified photographic evidence.'}
              </p>
            </div>

            {isReviewer && surveys.some(s => s.status === 'Submitted for Review') && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl px-3.5 py-2 flex items-center gap-2.5 shrink-0">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
                <span className="text-xs font-bold text-blue-900">
                  {surveys.filter(s => s.status === 'Submitted for Review').length} Audit(s) Awaiting Your Review
                </span>
              </div>
            )}
          </div>

          {/* Top Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
            <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider block">Total Audits</span>
              <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono tracking-tight">{surveys.length}</div>
              <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 block truncate">Customer Sites</span>
            </div>

            <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider block">Pending Visits</span>
              <div className="text-xl sm:text-2xl font-black text-amber-700 font-mono tracking-tight">
                {surveys.filter(s => s.status === 'Scheduled' || s.status === 'In Progress').length}
              </div>
              <span className="text-[10px] sm:text-[11px] font-semibold text-amber-600 block truncate">Field Trips Scheduled</span>
            </div>

            <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider block">Ready for Review</span>
              <div className="text-xl sm:text-2xl font-black text-blue-700 font-mono tracking-tight">
                {surveys.filter(s => s.status === 'Submitted for Review').length}
              </div>
              <span className="text-[10px] sm:text-[11px] font-semibold text-blue-600 block truncate">Awaiting PM Sign-Off</span>
            </div>

            <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider block">Approved</span>
              <div className="text-xl sm:text-2xl font-black text-emerald-700 font-mono tracking-tight">
                {surveys.filter(s => s.status === 'Approved' || s.status === 'Completed').length}
              </div>
              <span className="text-[10px] sm:text-[11px] font-semibold text-emerald-600 block truncate">Quotation Unlocked</span>
            </div>
          </div>

          {/* Master Container Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {/* Filter Bar with Quick Status Tabs */}
            <div className="p-3 sm:p-4 border-b border-slate-100 space-y-3">
              {/* Quick Status Navigation Pills */}
              {(() => {
                const overdueSurveys = surveys.filter(s => {
                  const due = getSurveyScheduleDueInfo(s);
                  return Boolean(due && (due.isOverdue || due.isDueToday));
                });

                return (
                  <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-xl overflow-x-auto scrollbar-none">
                    <button
                      onClick={() => setStatusFilter('All')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                        statusFilter === 'All'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      All Audits ({surveys.length})
                    </button>
                    {overdueSurveys.length > 0 && (
                      <button
                        onClick={() => setStatusFilter('Overdue')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                          statusFilter === 'Overdue'
                            ? 'bg-red-600 text-white shadow-xs'
                            : 'text-red-700 bg-red-50 hover:bg-red-100 border border-red-200'
                        }`}
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Due / Missed ({overdueSurveys.length})</span>
                      </button>
                    )}
                    <button
                      onClick={() => setStatusFilter('Submitted for Review')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                        statusFilter === 'Submitted for Review'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span>Pending Review</span>
                      {surveys.filter(s => s.status === 'Submitted for Review').length > 0 && (
                        <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                          statusFilter === 'Submitted for Review' ? 'bg-white text-blue-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {surveys.filter(s => s.status === 'Submitted for Review').length}
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => setStatusFilter('Approved')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                        statusFilter === 'Approved'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Approved ({surveys.filter(s => s.status === 'Approved' || s.status === 'Completed').length})
                    </button>
                    <button
                      onClick={() => setStatusFilter('Scheduled')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                        statusFilter === 'Scheduled'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Scheduled Visits ({surveys.filter(s => s.status === 'Scheduled' || s.status === 'In Progress').length})
                    </button>
                  </div>
                );
              })()}

              {/* Search Bar and Dropdown Filter */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 text-xs">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search survey ID, customer name, engineer..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="w-full sm:w-auto px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Overdue">⚠️ Due / Missed Visits</option>
                    <option value="Submitted for Review">Submitted for Review</option>
                    <option value="Approved">Approved</option>
                    <option value="Scheduled">Scheduled</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Changes Required">Changes Required</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Mobile Card View (< md) */}
            <div className="md:hidden divide-y divide-slate-100">
              {filteredSurveys.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No site surveys match your search filter.
                </div>
              ) : (
                filteredSurveys.map(s => {
                  const photoCount = s.photos?.length || 0;
                  const dueInfo = getSurveyScheduleDueInfo(s);
                  return (
                    <div 
                      key={s.id}
                      onClick={() => handleOpenAuditView(s.id)}
                      className="p-3.5 space-y-2.5 hover:bg-slate-50/80 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono font-bold text-slate-900 text-xs px-2 py-0.5 bg-slate-100 rounded">
                            {s.id}
                          </span>
                          <span className="font-bold text-slate-900 text-xs truncate">
                            {s.customerName}
                          </span>
                        </div>

                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider shrink-0 ${
                          dueInfo ? dueInfo.badgeClass :
                          s.status === 'Approved' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                          s.status === 'Completed' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                          s.status === 'Submitted for Review' ? 'bg-blue-50 text-blue-800 border border-blue-200' :
                          s.status === 'Changes Required' ? 'bg-red-50 text-red-800 border border-red-200' :
                          s.status === 'In Progress' ? 'bg-indigo-50 text-indigo-800 border border-indigo-200' :
                          'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}>
                          {dueInfo ? dueInfo.badgeText : s.status}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-500 truncate" title={s.address}>
                        <MapPin className="w-3 h-3 inline mr-1 text-slate-400" />
                        {s.address}
                      </div>

                      <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2 rounded-lg text-center text-[10px]">
                        <div>
                          <span className="text-slate-400 block">Roof Area</span>
                          <span className="font-bold text-slate-800">{s.roofAreaSqFt || 0} sq.ft</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Shadow-Free</span>
                          <span className="font-bold text-emerald-700">{s.shadowFreeAreaSqFt || 0} sq.ft</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Feasible</span>
                          <span className="font-bold text-slate-900">{s.recommendedKw || 0} kW</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <div className="text-[10px] text-slate-500 flex items-center gap-1.5 flex-wrap">
                          <span className="flex items-center gap-1 font-medium text-slate-700">
                            <User className="w-3 h-3 text-slate-400" />
                            {s.engineerName}
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {s.scheduledDate}
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                            <Clock className="w-3 h-3 text-emerald-600" />
                            {s.scheduledTime || '10:00 AM - 12:00 PM'}
                          </span>
                          {dueInfo?.isOverdue && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span className="flex items-center gap-0.5 text-red-600 font-bold">
                                <AlertTriangle className="w-3 h-3 text-red-500 shrink-0" />
                                {dueInfo.daysText}
                              </span>
                            </>
                          )}
                          {dueInfo?.isDueToday && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span className="flex items-center gap-0.5 text-amber-700 font-bold">
                                <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                                Due Today
                              </span>
                            </>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                          {isReviewer && s.status === 'Submitted for Review' ? (
                            <button
                              onClick={() => handleOpenAuditView(s.id)}
                              className="flex items-center gap-1 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                            >
                              <FileCheck className="w-3.5 h-3.5" />
                              <span>Review &amp; Sign-Off</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleOpenAuditView(s.id)}
                              className={`px-2.5 py-1 text-white rounded-lg text-xs font-bold cursor-pointer ${
                                s.status === 'Scheduled' || s.status === 'In Progress'
                                  ? (isReviewer ? 'bg-slate-700 hover:bg-slate-800' : 'bg-emerald-600 hover:bg-emerald-700')
                                  : 'bg-slate-900 hover:bg-slate-800'
                              }`}
                            >
                              {s.status === 'Scheduled' || s.status === 'In Progress'
                                ? (isReviewer ? 'Conduct / Inspect' : 'Conduct Survey')
                                : 'Inspect'}
                            </button>
                          )}
                          {s.status === 'Approved' && (
                            s.quotationId ? (
                              <button
                                onClick={() => onNavigateToQuotation(s.leadId)}
                                className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-xs"
                                title={`View approved commercial quotation (${s.quotationId})`}
                              >
                                <FileText className="w-3.5 h-3.5" />
                                <span>View Quote</span>
                              </button>
                            ) : (
                              <span
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-xs font-semibold"
                                title="BOM is pending / awaiting PM approval before quotation generation"
                              >
                                <Clock className="w-3.5 h-3.5 text-amber-500" />
                                <span>BOM Pending</span>
                              </span>
                            )
                          )}
                          <button
                            onClick={() => {
                              if (s.status === 'Approved') {
                                setSurveyToDelete(s);
                                setDeleteSurveyError(null);
                              }
                            }}
                            disabled={s.status !== 'Approved'}
                            className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
                              s.status === 'Approved'
                                ? 'text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 cursor-pointer'
                                : 'text-slate-300 border border-slate-200 bg-slate-50 cursor-not-allowed opacity-40'
                            }`}
                            title={
                              s.status === 'Approved'
                                ? `Delete Approved Survey ${s.id}`
                                : `Delete is locked. Survey can only be deleted once it reaches 'Approved' state.`
                            }
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Desktop Table View (>= md) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Survey ID</th>
                    <th className="py-3 px-4">Customer &amp; Site</th>
                    <th className="py-3 px-4 text-right">Roof Area</th>
                    <th className="py-3 px-4 text-right">Shadow-Free</th>
                    <th className="py-3 px-4 text-center">Feasible kW</th>
                    <th className="py-3 px-4 text-center">Photos</th>
                    <th className="py-3 px-4">Assigned Engineer</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredSurveys.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        No site surveys found matching your search.
                      </td>
                    </tr>
                  ) : (
                    filteredSurveys.map(s => {
                      const photoCount = s.photos?.length || 0;
                      const dueInfo = getSurveyScheduleDueInfo(s);
                      return (
                        <tr 
                          key={s.id} 
                          onClick={() => handleOpenAuditView(s.id)}
                          className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                        >
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-900 group-hover:text-emerald-700">
                            {s.id}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900">{s.customerName}</div>
                            <div className="text-[11px] text-slate-400 truncate max-w-[200px]" title={s.address}>
                              {s.address}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-800">
                            {s.roofAreaSqFt ? `${s.roofAreaSqFt} sq.ft` : '-'}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700">
                            {s.shadowFreeAreaSqFt ? `${s.shadowFreeAreaSqFt} sq.ft` : '-'}
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-900">
                            {s.recommendedKw ? `${s.recommendedKw} kW` : '-'}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                              photoCount >= 2 ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-500'
                            }`}>
                              <Camera className="w-3 h-3" />
                              <span>{photoCount}</span>
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-700">
                            <div className="font-semibold text-slate-900">{s.engineerName}</div>
                            <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-400 inline shrink-0" />
                              <span>{s.scheduledDate}</span>
                            </div>
                            <div className="text-[10px] font-semibold text-emerald-700 mt-0.5 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-emerald-600 inline shrink-0" />
                              <span>{s.scheduledTime || '10:00 AM - 12:00 PM'}</span>
                            </div>
                            {dueInfo?.isOverdue && (
                              <div className="text-[10px] font-bold text-red-600 mt-0.5 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 text-red-500 inline shrink-0" />
                                <span>{dueInfo.daysText}</span>
                              </div>
                            )}
                            {dueInfo?.isDueToday && (
                              <div className="text-[10px] font-bold text-amber-700 mt-0.5 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-amber-600 inline shrink-0" />
                                <span>Due Today</span>
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                              dueInfo ? dueInfo.badgeClass :
                              s.status === 'Approved' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                              s.status === 'Completed' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                              s.status === 'Submitted for Review' ? 'bg-blue-50 text-blue-800 border border-blue-200' :
                              s.status === 'Changes Required' ? 'bg-red-50 text-red-800 border border-red-200' :
                              s.status === 'In Progress' ? 'bg-indigo-50 text-indigo-800 border border-indigo-200' :
                              'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}>
                              {dueInfo ? dueInfo.badgeText : s.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              {isReviewer && s.status !== 'Approved' ? (
                                <button
                                  onClick={() => handleOpenAuditView(s.id)}
                                  className="flex items-center gap-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
                                  title="Review field audit findings and sign-off"
                                >
                                  <FileCheck className="w-3.5 h-3.5" />
                                  <span>Review &amp; Sign-Off</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleOpenAuditView(s.id)}
                                  className={`px-2.5 py-1 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                                    s.status === 'Scheduled' || s.status === 'In Progress' || s.status === 'Changes Required'
                                      ? (isReviewer ? 'bg-slate-700 hover:bg-slate-800' : 'bg-emerald-600 hover:bg-emerald-700')
                                      : 'bg-slate-900 hover:bg-slate-800'
                                  }`}
                                >
                                  {s.status === 'Scheduled' || s.status === 'In Progress' 
                                    ? (isReviewer ? 'Inspect' : 'Conduct Survey') 
                                    : 'Inspect'}
                                </button>
                              )}

                              {s.status === 'Approved' && (
                                s.quotationId ? (
                                  <button
                                    onClick={() => onNavigateToQuotation(s.leadId)}
                                    className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
                                    title={`View approved quotation (${s.quotationId})`}
                                  >
                                    <FileText className="w-3.5 h-3.5" />
                                    <span>View Quote</span>
                                  </button>
                                ) : (
                                  <span
                                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-xs font-semibold"
                                    title="BOM is pending / awaiting PM approval before quotation generation"
                                  >
                                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                                    <span>BOM Pending</span>
                                  </span>
                                )
                              )}

                              <button
                                onClick={() => {
                                  if (s.status === 'Approved') {
                                    setSurveyToDelete(s);
                                    setDeleteSurveyError(null);
                                  }
                                }}
                                disabled={s.status !== 'Approved'}
                                className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
                                  s.status === 'Approved'
                                    ? 'text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 cursor-pointer'
                                    : 'text-slate-300 border border-slate-200 bg-slate-50 cursor-not-allowed opacity-40'
                                }`}
                                title={
                                  s.status === 'Approved'
                                    ? `Delete Approved Survey ${s.id}`
                                    : `Delete is locked. Survey can only be deleted once it reaches 'Approved' state.`
                                }
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* PHOTO PREVIEW MODAL WITH GEO-METADATA */}
      {/* ========================================================= */}
      {previewPhoto && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-3 sm:p-4"
          onClick={() => setPreviewPhoto(null)}
        >
          <div 
            className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl space-y-3 sm:space-y-4 p-4 sm:p-5 max-h-[92vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="min-w-0">
                <h4 className="font-bold text-slate-900 text-sm truncate">
                  {PHOTO_CATEGORIES.find(c => c.key === previewPhoto.category)?.label || previewPhoto.category}
                </h4>
                <span className="text-[10px] sm:text-[11px] text-slate-400 font-mono block">
                  ID: {previewPhoto.id} • {new Date(previewPhoto.uploadedAt).toLocaleString()}
                </span>
              </div>
              <button 
                onClick={() => setPreviewPhoto(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="rounded-xl overflow-hidden bg-slate-950 max-h-[50vh] sm:max-h-[55vh] flex items-center justify-center">
              <img 
                src={previewPhoto.filePath} 
                alt="Audit evidence" 
                className="max-h-[50vh] sm:max-h-[55vh] w-auto object-contain"
              />
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="font-bold text-slate-700 block">Geolocation Status:</span>
                {previewPhoto.geoVerified && previewPhoto.latitude && previewPhoto.longitude ? (
                  <span className="text-emerald-700 font-mono font-bold flex items-center gap-1 mt-0.5 text-[11px]">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span>Geo-Verified: {previewPhoto.latitude.toFixed(6)}°N, {previewPhoto.longitude.toFixed(6)}°E</span>
                  </span>
                ) : (
                  <span className="text-slate-500 font-semibold block mt-0.5 text-[11px]">
                    Location not available (Device GPS was unavailable or permission denied)
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDeletePhoto(previewPhoto.id)}
                  className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* PRE-SUBMISSION COMPLETION CHECKLIST MODAL */}
      {/* ========================================================= */}
      {checklistModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2 min-w-0">
                <FileCheck className="w-5 h-5 text-teal-600 shrink-0" />
                <h3 className="font-bold text-slate-900 text-sm sm:text-base truncate">Survey Completion Checklist</h3>
              </div>
              <button onClick={() => setChecklistModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 shrink-0">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Validating required technical measurements and mandatory photographic evidence for <strong>{activeSurvey?.customerName}</strong> ({activeSurvey?.id}).
            </p>

            {checklistErrors.length > 0 ? (
              <div className="p-3 sm:p-4 bg-red-50 border border-red-200 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-red-800 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>The following items must be completed:</span>
                </div>
                <ul className="list-disc list-inside text-xs text-red-700 space-y-1">
                  {checklistErrors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="p-3 sm:p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1.5 text-emerald-900">
                <div className="flex items-center gap-2 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>All mandatory engineering measurements and photographs are verified!</span>
                </div>
                <p className="text-[11px] text-emerald-800">
                  Ready to submit for Project Manager technical review.
                </p>
              </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setChecklistModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs text-center"
              >
                Cancel / Edit Form
              </button>

              {checklistErrors.length > 0 ? (
                <button
                  type="button"
                  onClick={() => handleConfirmSubmit(true)}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs text-center"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit with Exceptions'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleConfirmSubmit(false)}
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs text-center"
                >
                  {isSubmitting ? 'Submitting...' : 'Confirm Submission'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* REVIEW & APPROVAL MODAL (SUPERVISOR / PM) */}
      {/* ========================================================= */}
      {reviewModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">Review &amp; Sign-Off Site Audit</h3>
              <button onClick={() => setReviewModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Review Decision</label>
                <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                  <label className={`p-2.5 sm:p-3 rounded-xl border flex items-center gap-2 cursor-pointer font-bold ${
                    reviewDecision === 'Approved' ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}>
                    <input 
                      type="radio" 
                      name="decision" 
                      value="Approved" 
                      checked={reviewDecision === 'Approved'} 
                      onChange={() => setReviewDecision('Approved')} 
                      className="text-emerald-600"
                    />
                    <span className="text-xs">Approve Audit</span>
                  </label>

                  <label className={`p-2.5 sm:p-3 rounded-xl border flex items-center gap-2 cursor-pointer font-bold ${
                    reviewDecision === 'Changes Required' ? 'bg-red-50 border-red-300 text-red-900' : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}>
                    <input 
                      type="radio" 
                      name="decision" 
                      value="Changes Required" 
                      checked={reviewDecision === 'Changes Required'} 
                      onChange={() => setReviewDecision('Changes Required')} 
                      className="text-red-600"
                    />
                    <span className="text-xs">Request Changes</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Reviewer Remarks / Feedback *</label>
                <textarea
                  rows={3}
                  value={reviewComments}
                  onChange={e => setReviewComments(e.target.value)}
                  placeholder={reviewDecision === 'Approved' ? 'e.g. Sizing verified. Rooftop shadow profile clear. Proceed to quotation.' : 'Explain what measurements or photos need to be corrected by the field engineer...'}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setReviewModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs text-center"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleReviewSurvey}
                disabled={isSubmitting}
                className={`px-5 py-2 text-white font-bold rounded-xl text-xs shadow-xs text-center ${
                  reviewDecision === 'Approved' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {isSubmitting ? 'Recording...' : `Confirm ${reviewDecision}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* RESCHEDULE MODAL */}
      {/* ========================================================= */}
      {rescheduleModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-4 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="font-bold text-slate-900 text-sm">Reschedule Site Survey</h3>
              <button onClick={() => setRescheduleModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">New Planned Visit Date</label>
                <input
                  type="date"
                  value={rescheduleDate}
                  onChange={e => setRescheduleDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setRescheduleModalOpen(false)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (activeSurvey && rescheduleDate) {
                    await rescheduleSurveyAction(activeSurvey.id, rescheduleDate);
                    setRescheduleModalOpen(false);
                  }
                }}
                className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg text-xs"
              >
                Save Date
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* DELETE SURVEY MODAL (Enabled only for Approved surveys)   */}
      {/* ========================================================= */}
      {surveyToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5 text-red-600">
                <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Delete Approved Site Survey</h3>
                  <p className="text-[11px] text-slate-400 font-mono">{surveyToDelete.id}</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setSurveyToDelete(null);
                  setDeleteSurveyError(null);
                }} 
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
              <p>
                Are you sure you want to delete the site survey record for{' '}
                <span className="font-bold text-slate-900">{surveyToDelete.customerName}</span>?
              </p>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-[11px] space-y-1">
                <div className="font-semibold flex items-center gap-1.5 text-amber-900">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Approved Survey Cleanup</span>
                </div>
                <p>
                  This will permanently delete the rooftop measurements, shadow analyses, 
                  and photographic inspection evidence recorded for this audit.
                </p>
              </div>
            </div>

            {deleteSurveyError && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{deleteSurveyError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setSurveyToDelete(null);
                  setDeleteSurveyError(null);
                }}
                disabled={isDeletingSurvey}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  setIsDeletingSurvey(true);
                  setDeleteSurveyError(null);
                  const res = await deleteSiteSurvey(surveyToDelete.id);
                  setIsDeletingSurvey(false);
                  if (res.success) {
                    setSurveyToDelete(null);
                  } else {
                    setDeleteSurveyError(res.error || 'Failed to delete survey');
                  }
                }}
                disabled={isDeletingSurvey}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeletingSurvey ? 'Deleting...' : 'Delete Survey'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Camera Viewfinder Modal */}
      <LiveCameraModal
        isOpen={liveCameraOpen}
        title={liveCameraTitle}
        initialFacingMode={liveCameraFacing}
        onCapture={handleLiveCameraCapture}
        onClose={() => setLiveCameraOpen(false)}
      />

    </div>
  );
};
