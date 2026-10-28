import { Request, Response } from 'express';
import { pool } from '../db.js';
import fs from 'fs';
import path from 'path';
import { createQuotationDraftInternal } from './quotations.controller.js';

// Helper to format photo object
export function formatPhoto(p: any) {
  return {
    id: p.id,
    surveyId: p.survey_id,
    category: p.category,
    fileName: p.file_name,
    filePath: p.file_path,
    fileSize: p.file_size ? Number(p.file_size) : 0,
    mimeType: p.mime_type || 'image/jpeg',
    caption: p.caption || '',
    uploaderId: p.uploader_id || '',
    uploaderName: p.uploader_name || '',
    capturedAt: p.captured_at || null,
    uploadedAt: p.uploaded_at,
    latitude: p.latitude !== null && p.latitude !== undefined ? Number(p.latitude) : null,
    longitude: p.longitude !== null && p.longitude !== undefined ? Number(p.longitude) : null,
    gpsAccuracyMeters: p.gps_accuracy_meters !== null && p.gps_accuracy_meters !== undefined ? Number(p.gps_accuracy_meters) : null,
    geoVerified: Boolean(p.geo_verified),
    verificationStatus: p.verification_status || 'Uploaded',
    verificationNotes: p.verification_notes || '',
  };
}

// Helper to format survey object
export function formatSurvey(s: any, photos: any[] = [], history: any[] = []) {
  return {
    id: s.id,
    leadId: s.lead_id,
    leadName: s.lead_name,
    customerName: s.customer_name,
    phone: s.phone,
    address: s.address,
    scheduledDate: s.scheduled_date,
    scheduledTime: s.scheduled_time || '10:00 AM - 12:00 PM',
    engineerId: s.engineer_id,
    engineerName: s.engineer_name,
    status: s.status,
    roofAreaSqFt: Number(s.roof_area_sqft) || 0,
    shadowFreeAreaSqFt: Number(s.shadow_free_area_sqft) || 0,
    roofType: s.roof_type || 'RCC Flat',
    azimuthAngle: Number(s.azimuth_angle) || 180,
    tiltAngle: Number(s.tilt_angle) || 15,
    existingSanctionLoadKw: Number(s.existing_sanction_load_kw) || 0,
    gridPhase: s.grid_phase || 'Three Phase',
    distanceToLtPanelMeters: Number(s.distance_to_lt_panel_meters) || 0,
    recommendedKw: Number(s.recommended_kw) || 0,
    panelQuantity: Number(s.panel_quantity) || 0,
    estimatedGenerationUnitsPerYear: Number(s.estimated_generation_units_per_year) || 0,
    estimatedAnnualSavings: Number(s.estimated_annual_savings) || 0,
    estimatedCost: Number(s.estimated_cost) || 0,
    paybackYears: Number(s.payback_years) || 4.5,
    co2ReductionTonsPerYear: Number(s.co2_reduction_tons_per_year) || 0,
    photosUploaded: typeof s.photos_uploaded === 'string' ? JSON.parse(s.photos_uploaded) : (s.photos_uploaded || []),
    billPhotoUploaded: Boolean(s.bill_photo_uploaded),
    notes: s.notes || '',
    completedAt: s.completed_at,

    // Rooftop Engineering & Measurement status
    roofDimensionsShape: s.roof_dimensions_shape || 'Rectangular',
    surfaceCondition: s.surface_condition || 'Good',
    measurementStatus: s.measurement_status || 'Initial Estimate',
    obstaclesWaterTank: Boolean(s.obstacles_water_tank),
    obstaclesMumty: Boolean(s.obstacles_mumty),
    obstaclesParapet: Boolean(s.obstacles_parapet),
    obstaclesTreesNeighbors: Boolean(s.obstacles_trees_neighbors),
    obstaclesOther: s.obstacles_other || '',
    accessPathwaysClearance: s.access_pathways_clearance || '1m walkway required along perimeter',

    // Electrical Inspection
    mainMeterStatus: s.main_meter_status || 'Not Assessed',
    mainMeterNotes: s.main_meter_notes || '',
    dbCondition: s.db_condition || 'Not Assessed',
    earthingStatus: s.earthing_status || 'Not Assessed',
    earthingResistanceOhms: s.earthing_resistance_ohms !== null && s.earthing_resistance_ohms !== undefined ? Number(s.earthing_resistance_ohms) : null,
    proposedInverterLocation: s.proposed_inverter_location || '',
    electricalConstraints: s.electrical_constraints || '',
    electricalUpgradesNeeded: s.electrical_upgrades_needed || '',

    // Structural & Shading Assessment
    structuralConcerns: s.structural_concerns || '',
    visibleCracksDamage: Boolean(s.visible_cracks_damage),
    waterproofingStatus: s.waterproofing_status || 'Good',
    mountingStructureType: s.mounting_structure_type || 'Standard Elevated',
    shadingSources: s.shading_sources || '',
    shadingAffectedAreaSqFt: Number(s.shading_affected_area_sqft) || 0,
    structuralEngineerApprovalRequired: Boolean(s.structural_engineer_approval_required),

    // Engineering Findings & Feasibility
    feasibilityVerdict: s.feasibility_verdict || 'Feasible',
    proposedPanelWattage: Number(s.proposed_panel_wattage) || 550,
    inverterRecommendation: s.inverter_recommendation || '',
    cableSpecification: s.cable_specification || '1 x 4 sq.mm Solar DC Cu, 4C x 16 sq.mm AC Al XLPE',
    unresolvedTechnicalIssues: s.unresolved_technical_issues || '',
    engineerRecommendations: s.engineer_recommendations || '',

    // Review & Workflow
    submittedAt: s.submitted_at || null,
    submittedById: s.submitted_by_id || null,
    reviewedAt: s.reviewed_at || null,
    reviewedById: s.reviewed_by_id || null,
    reviewerName: s.reviewer_name || null,
    reviewDecision: s.review_decision || null,
    reviewComments: s.review_comments || null,
    quotationId: s.quotation_id || null,
    isDraft: Boolean(s.is_draft),

    // Custom Fields added by Survey Engineer
    customFields: typeof s.custom_fields === 'string' ? JSON.parse(s.custom_fields) : (s.custom_fields || []),

    // Attached photos and audit review history
    photos: photos.map(formatPhoto),
    reviewHistory: history.map((h: any) => ({
      id: h.id,
      surveyId: h.survey_id,
      reviewerId: h.reviewer_id,
      reviewerName: h.reviewer_name,
      action: h.action,
      comments: h.comments,
      createdAt: h.created_at,
    })),
  };
}

// Generate unique, collision-proof Survey ID
export async function generateUniqueSurveyId(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `SRV-${year}-`;
  const [rows]: any = await pool.query(
    'SELECT id FROM site_surveys WHERE id LIKE ? ORDER BY id DESC LIMIT 1',
    [`${prefix}%`]
  );

  let nextNum = 1;
  if (rows && rows.length > 0 && rows[0].id) {
    const parts = rows[0].id.split('-');
    if (parts.length >= 3) {
      const lastSeq = parseInt(parts[2], 10);
      if (!isNaN(lastSeq)) {
        nextNum = lastSeq + 1;
      }
    }
  }
  return `${prefix}${String(nextNum).padStart(3, '0')}`;
}

// 1. Get all surveys
export const getSurveys = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    let query = 'SELECT * FROM site_surveys';
    const params: any[] = [];

    // Customer Isolation
    if (user && user.role === 'Customer') {
      query += ' WHERE lead_id IN (SELECT id FROM leads WHERE email = ? OR phone = ?) OR customer_name = ?';
      params.push(user.email || '', user.phone || '', user.name || '');
    }

    query += ' ORDER BY scheduled_date DESC';
    const [surveys]: any = await pool.query(query, params);

    // Fetch all photos for these surveys
    const [allPhotos]: any = await pool.query('SELECT * FROM survey_photos ORDER BY uploaded_at ASC');
    const photosBySurvey: Record<string, any[]> = {};
    for (const p of allPhotos) {
      if (!photosBySurvey[p.survey_id]) photosBySurvey[p.survey_id] = [];
      photosBySurvey[p.survey_id].push(p);
    }

    const formatted = surveys.map((s: any) => formatSurvey(s, photosBySurvey[s.id] || []));
    res.json({ success: true, surveys: formatted });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// 2. Get single survey by ID
export const getSurveyById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const [rows]: any = await pool.query('SELECT * FROM site_surveys WHERE id = ?', [id]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Survey not found' });
    }

    const [photos]: any = await pool.query('SELECT * FROM survey_photos WHERE survey_id = ? ORDER BY uploaded_at ASC', [id]);
    const [history]: any = await pool.query('SELECT * FROM survey_review_history WHERE survey_id = ? ORDER BY created_at ASC', [id]);

    const formatted = formatSurvey(rows[0], photos, history);
    res.json({ success: true, survey: formatted });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// 3. Create survey (Atomic ID generation & duplicate protection)
export const createSurvey = async (req: Request, res: Response) => {
  try {
    const s = req.body;
    const leadId = s.leadId;

    // Check if a survey already exists for this lead
    if (leadId) {
      const [existing]: any = await pool.query(
        'SELECT * FROM site_surveys WHERE lead_id = ? LIMIT 1',
        [leadId]
      );
      if (existing && existing.length > 0) {
        // Return existing survey to prevent duplicate jobs
        const [photos]: any = await pool.query('SELECT * FROM survey_photos WHERE survey_id = ?', [existing[0].id]);
        return res.json({ 
          success: true, 
          reopened: true, 
          message: 'Existing survey reopened', 
          survey: formatSurvey(existing[0], photos) 
        });
      }
    }

    // Generate atomic server-side unique Survey ID if not provided or to ensure uniqueness
    let surveyId = s.id;
    if (!surveyId || surveyId.startsWith('TEMP-') || surveyId.length < 5) {
      surveyId = await generateUniqueSurveyId();
    } else {
      // Verify ID does not already exist
      const [idCheck]: any = await pool.query('SELECT id FROM site_surveys WHERE id = ?', [surveyId]);
      if (idCheck && idCheck.length > 0) {
        surveyId = await generateUniqueSurveyId();
      }
    }

    const scheduledDate = s.scheduledDate || new Date().toISOString().split('T')[0];
    const scheduledTime = s.scheduledTime || '10:00 AM - 12:00 PM';

    await pool.query(
      `INSERT INTO site_surveys (
        id, lead_id, lead_name, customer_name, phone, address, scheduled_date, scheduled_time,
        engineer_id, engineer_name, status, roof_area_sqft, shadow_free_area_sqft, 
        roof_type, azimuth_angle, tilt_angle, existing_sanction_load_kw, grid_phase, 
        distance_to_lt_panel_meters, recommended_kw, panel_quantity, 
        estimated_generation_units_per_year, estimated_annual_savings, estimated_cost, 
        payback_years, co2_reduction_tons_per_year, photos_uploaded, bill_photo_uploaded, 
        notes, completed_at,
        roof_dimensions_shape, surface_condition, measurement_status, obstacles_water_tank,
        obstacles_mumty, obstacles_parapet, obstacles_trees_neighbors, obstacles_other,
        access_pathways_clearance, main_meter_status, main_meter_notes, db_condition,
        earthing_status, earthing_resistance_ohms, proposed_inverter_location,
        electrical_constraints, electrical_upgrades_needed, structural_concerns,
        visible_cracks_damage, waterproofing_status, mounting_structure_type,
        shading_sources, shading_affected_area_sqft, structural_engineer_approval_required,
        feasibility_verdict, proposed_panel_wattage, inverter_recommendation,
        cable_specification, unresolved_technical_issues, engineer_recommendations,
        is_draft
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, 
        ?, ?, ?, ?, ?, 
        ?, ?, ?, ?, ?, 
        ?, ?, ?, 
        ?, ?, ?, 
        ?, ?, ?, ?, 
        ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?,
        ?
      )`,
      [
        surveyId, s.leadId || null, s.leadName || s.customerName, s.customerName, s.phone, s.address, scheduledDate, scheduledTime,
        s.engineerId || null, s.engineerName || 'Vikram Mehta', s.status || 'Scheduled', s.roofAreaSqFt || 0, s.shadowFreeAreaSqFt || 0,
        s.roofType || 'RCC Flat', s.azimuthAngle || 180, s.tiltAngle || 15, s.existingSanctionLoadKw || 0, s.gridPhase || 'Three Phase',
        s.distanceToLtPanelMeters || 20, s.recommendedKw || 0, s.panelQuantity || 0,
        s.estimatedGenerationUnitsPerYear || 0, s.estimatedAnnualSavings || 0, s.estimatedCost || 0,
        s.paybackYears || 4.5, s.co2ReductionTonsPerYear || 0, JSON.stringify(s.photosUploaded || []), s.billPhotoUploaded ? 1 : 0,
        s.notes || '', s.completedAt || null,
        s.roofDimensionsShape || 'Rectangular', s.surfaceCondition || 'Good', s.measurementStatus || 'Initial Estimate',
        s.obstaclesWaterTank ? 1 : 0, s.obstaclesMumty ? 1 : 0, s.obstaclesParapet ? 1 : 0, s.obstaclesTreesNeighbors ? 1 : 0,
        s.obstaclesOther || null, s.accessPathwaysClearance || '1m walkway required along perimeter',
        s.mainMeterStatus || 'Not Assessed', s.mainMeterNotes || null, s.dbCondition || 'Not Assessed',
        s.earthingStatus || 'Not Assessed', s.earthingResistanceOhms !== undefined ? s.earthingResistanceOhms : null,
        s.proposedInverterLocation || null, s.electricalConstraints || null, s.electricalUpgradesNeeded || null,
        s.structuralConcerns || null, s.visibleCracksDamage ? 1 : 0, s.waterproofingStatus || 'Good',
        s.mountingStructureType || 'Standard Elevated', s.shadingSources || null, s.shadingAffectedAreaSqFt || 0,
        s.structuralEngineerApprovalRequired ? 1 : 0, s.feasibilityVerdict || 'Feasible', s.proposedPanelWattage || 550,
        s.inverterRecommendation || null, s.cableSpecification || '1 x 4 sq.mm Solar DC Cu, 4C x 16 sq.mm AC Al XLPE',
        s.unresolvedTechnicalIssues || null, s.engineerRecommendations || null,
        s.isDraft ? 1 : 0
      ]
    );

    // Update lead with survey_id and status
    if (leadId) {
      await pool.query(
        "UPDATE leads SET survey_id = ?, status = 'Site Survey Scheduled' WHERE id = ?",
        [surveyId, leadId]
      );
    }

    const [created]: any = await pool.query('SELECT * FROM site_surveys WHERE id = ?', [surveyId]);
    res.json({ success: true, survey: formatSurvey(created[0]) });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// 4. Update Survey (Draft or Partial Progress Save)
export const updateSurvey = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const s = req.body;

    const [existing]: any = await pool.query('SELECT * FROM site_surveys WHERE id = ?', [id]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({ success: false, error: 'Survey not found' });
    }

    const current = existing[0];

    // Build update dynamically
    const updateMap: Record<string, any> = {
      roof_area_sqft: s.roofAreaSqFt !== undefined ? s.roofAreaSqFt : current.roof_area_sqft,
      shadow_free_area_sqft: s.shadowFreeAreaSqFt !== undefined ? s.shadowFreeAreaSqFt : current.shadow_free_area_sqft,
      roof_type: s.roofType !== undefined ? s.roofType : current.roof_type,
      azimuth_angle: s.azimuthAngle !== undefined ? s.azimuthAngle : current.azimuth_angle,
      tilt_angle: s.tiltAngle !== undefined ? s.tiltAngle : current.tilt_angle,
      existing_sanction_load_kw: s.existingSanctionLoadKw !== undefined ? s.existingSanctionLoadKw : current.existing_sanction_load_kw,
      grid_phase: s.gridPhase !== undefined ? s.gridPhase : current.grid_phase,
      distance_to_lt_panel_meters: s.distanceToLtPanelMeters !== undefined ? s.distanceToLtPanelMeters : current.distance_to_lt_panel_meters,
      recommended_kw: s.recommendedKw !== undefined ? s.recommendedKw : current.recommended_kw,
      panel_quantity: s.panelQuantity !== undefined ? s.panelQuantity : current.panel_quantity,
      estimated_generation_units_per_year: s.estimatedGenerationUnitsPerYear !== undefined ? s.estimatedGenerationUnitsPerYear : current.estimated_generation_units_per_year,
      estimated_annual_savings: s.estimatedAnnualSavings !== undefined ? s.estimatedAnnualSavings : current.estimated_annual_savings,
      estimated_cost: s.estimatedCost !== undefined ? s.estimatedCost : current.estimated_cost,
      payback_years: s.paybackYears !== undefined ? s.paybackYears : current.payback_years,
      co2_reduction_tons_per_year: s.co2ReductionTonsPerYear !== undefined ? s.co2ReductionTonsPerYear : current.co2_reduction_tons_per_year,
      notes: s.notes !== undefined ? s.notes : current.notes,
      
      roof_dimensions_shape: s.roofDimensionsShape !== undefined ? s.roofDimensionsShape : current.roof_dimensions_shape,
      surface_condition: s.surfaceCondition !== undefined ? s.surfaceCondition : current.surface_condition,
      measurement_status: s.measurementStatus !== undefined ? s.measurementStatus : (current.measurementStatus || 'Engineer Entered'),
      obstacles_water_tank: s.obstaclesWaterTank !== undefined ? (s.obstaclesWaterTank ? 1 : 0) : current.obstacles_water_tank,
      obstacles_mumty: s.obstaclesMumty !== undefined ? (s.obstaclesMumty ? 1 : 0) : current.obstacles_mumty,
      obstacles_parapet: s.obstaclesParapet !== undefined ? (s.obstaclesParapet ? 1 : 0) : current.obstacles_parapet,
      obstacles_trees_neighbors: s.obstaclesTreesNeighbors !== undefined ? (s.obstaclesTreesNeighbors ? 1 : 0) : current.obstacles_trees_neighbors,
      obstacles_other: s.obstaclesOther !== undefined ? s.obstaclesOther : current.obstacles_other,
      access_pathways_clearance: s.accessPathwaysClearance !== undefined ? s.accessPathwaysClearance : current.access_pathways_clearance,
      
      main_meter_status: s.mainMeterStatus !== undefined ? s.mainMeterStatus : current.main_meter_status,
      main_meter_notes: s.mainMeterNotes !== undefined ? s.mainMeterNotes : current.main_meter_notes,
      db_condition: s.dbCondition !== undefined ? s.dbCondition : current.db_condition,
      earthing_status: s.earthingStatus !== undefined ? s.earthingStatus : current.earthing_status,
      earthing_resistance_ohms: s.earthingResistanceOhms !== undefined ? s.earthingResistanceOhms : current.earthing_resistance_ohms,
      proposed_inverter_location: s.proposedInverterLocation !== undefined ? s.proposedInverterLocation : current.proposed_inverter_location,
      electrical_constraints: s.electricalConstraints !== undefined ? s.electricalConstraints : current.electrical_constraints,
      electrical_upgrades_needed: s.electricalUpgradesNeeded !== undefined ? s.electricalUpgradesNeeded : current.electrical_upgrades_needed,
      
      structural_concerns: s.structuralConcerns !== undefined ? s.structuralConcerns : current.structural_concerns,
      visible_cracks_damage: s.visibleCracksDamage !== undefined ? (s.visibleCracksDamage ? 1 : 0) : current.visible_cracks_damage,
      waterproofing_status: s.waterproofingStatus !== undefined ? s.waterproofingStatus : current.waterproofing_status,
      mounting_structure_type: s.mountingStructureType !== undefined ? s.mountingStructureType : current.mounting_structure_type,
      shading_sources: s.shadingSources !== undefined ? s.shadingSources : current.shading_sources,
      shading_affected_area_sqft: s.shadingAffectedAreaSqFt !== undefined ? s.shadingAffectedAreaSqFt : current.shading_affected_area_sqft,
      structural_engineer_approval_required: s.structuralEngineerApprovalRequired !== undefined ? (s.structuralEngineerApprovalRequired ? 1 : 0) : current.structural_engineer_approval_required,
      
      feasibility_verdict: s.feasibilityVerdict !== undefined ? s.feasibilityVerdict : current.feasibility_verdict,
      proposed_panel_wattage: s.proposedPanelWattage !== undefined ? s.proposedPanelWattage : current.proposed_panel_wattage,
      inverter_recommendation: s.inverterRecommendation !== undefined ? s.inverterRecommendation : current.inverter_recommendation,
      cable_specification: s.cableSpecification !== undefined ? s.cableSpecification : current.cable_specification,
      unresolved_technical_issues: s.unresolvedTechnicalIssues !== undefined ? s.unresolvedTechnicalIssues : current.unresolved_technical_issues,
      engineer_recommendations: s.engineerRecommendations !== undefined ? s.engineerRecommendations : current.engineer_recommendations,
      custom_fields: s.customFields !== undefined ? (typeof s.customFields === 'string' ? s.customFields : JSON.stringify(s.customFields)) : current.custom_fields,
      
      is_draft: s.isDraft !== undefined ? (s.isDraft ? 1 : 0) : 1,
    };

    if (s.status !== undefined) {
      updateMap.status = s.status;
    } else if (current.status === 'Scheduled') {
      updateMap.status = 'In Progress';
    }

    if (s.completedAt !== undefined) {
      updateMap.completed_at = s.completedAt;
    }

    const setClauses: string[] = [];
    const values: any[] = [];
    for (const [key, val] of Object.entries(updateMap)) {
      setClauses.push(`${key} = ?`);
      values.push(val);
    }
    values.push(id);

    await pool.query(`UPDATE site_surveys SET ${setClauses.join(', ')} WHERE id = ?`, values);

    // Fetch updated
    const [updated]: any = await pool.query('SELECT * FROM site_surveys WHERE id = ?', [id]);
    const [photos]: any = await pool.query('SELECT * FROM survey_photos WHERE survey_id = ? ORDER BY uploaded_at ASC', [id]);
    const [history]: any = await pool.query('SELECT * FROM survey_review_history WHERE survey_id = ? ORDER BY created_at ASC', [id]);

    res.json({ success: true, survey: formatSurvey(updated[0], photos, history) });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// 5. Upload Photo (supports real disk storage and GPS metadata)
export const uploadSurveyPhoto = async (req: Request, res: Response) => {
  try {
    const { id: surveyId } = req.params;
    const user = (req as any).user;

    // Verify survey exists
    const [surveys]: any = await pool.query('SELECT * FROM site_surveys WHERE id = ?', [surveyId]);
    if (!surveys || surveys.length === 0) {
      return res.status(404).json({ success: false, error: 'Survey not found' });
    }

    const {
      category,
      fileName,
      mimeType = 'image/jpeg',
      base64Data,
      caption = '',
      latitude = null,
      longitude = null,
      gpsAccuracyMeters = null,
      capturedAt = null
    } = req.body;

    if (!category) {
      return res.status(400).json({ success: false, error: 'Photo category is required' });
    }

    const photoId = `PH-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const uploadDir = path.join(process.cwd(), 'uploads', 'surveys', surveyId);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    let filePath = '';
    let fileSize = 0;

    if (base64Data) {
      // Decode base64
      const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      let buffer: Buffer;
      let ext = 'jpg';
      if (matches && matches.length === 3) {
        buffer = Buffer.from(matches[2], 'base64');
        if (matches[1].includes('png')) ext = 'png';
        if (matches[1].includes('webp')) ext = 'webp';
      } else {
        buffer = Buffer.from(base64Data, 'base64');
      }

      const safeFileName = `${photoId}.${ext}`;
      const fullDiskPath = path.join(uploadDir, safeFileName);
      fs.writeFileSync(fullDiskPath, buffer);
      filePath = `/uploads/surveys/${surveyId}/${safeFileName}`;
      fileSize = buffer.length;
    } else if ((req as any).file) {
      filePath = `/uploads/surveys/${surveyId}/${(req as any).file.filename}`;
      fileSize = (req as any).file.size;
    } else {
      return res.status(400).json({ success: false, error: 'No image file or base64 data provided' });
    }

    // Honest geo-verification logic
    const hasValidGps = latitude !== null && longitude !== null && !isNaN(Number(latitude)) && !isNaN(Number(longitude));
    const geoVerified = hasValidGps ? 1 : 0;
    const verificationStatus = 'Uploaded'; // Never auto-verified as per requirement 6

    const uploadedAt = new Date().toISOString();

    await pool.query(
      `INSERT INTO survey_photos (
        id, survey_id, category, file_name, file_path, file_size, mime_type, 
        caption, uploader_id, uploader_name, captured_at, uploaded_at, 
        latitude, longitude, gps_accuracy_meters, geo_verified, verification_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        photoId, surveyId, category, fileName || `${category}.jpg`, filePath, fileSize, mimeType,
        caption, user?.id || 'EMP-03', user?.name || 'Rahul Sharma', capturedAt, uploadedAt,
        hasValidGps ? Number(latitude) : null,
        hasValidGps ? Number(longitude) : null,
        gpsAccuracyMeters ? Number(gpsAccuracyMeters) : null,
        geoVerified, verificationStatus
      ]
    );

    const [newPhoto]: any = await pool.query('SELECT * FROM survey_photos WHERE id = ?', [photoId]);
    res.json({ success: true, photo: formatPhoto(newPhoto[0]) });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// 6. Delete Photo
export const deleteSurveyPhoto = async (req: Request, res: Response) => {
  try {
    const { id: surveyId, photoId } = req.params;

    const [photos]: any = await pool.query(
      'SELECT * FROM survey_photos WHERE id = ? AND survey_id = ?',
      [photoId, surveyId]
    );

    if (!photos || photos.length === 0) {
      return res.json({ success: true, message: 'Photo already removed', photoId });
    }

    const photo = photos[0];
    const fullPath = path.join(process.cwd(), photo.file_path);
    if (fs.existsSync(fullPath)) {
      try {
        fs.unlinkSync(fullPath);
      } catch (e: any) {
        console.warn('Failed to delete file from disk:', e.message);
      }
    }

    await pool.query('DELETE FROM survey_photos WHERE id = ?', [photoId]);
    res.json({ success: true, message: 'Photo deleted successfully', photoId });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// 7. Submit Survey for Review (Validates checklist)
export const submitSurveyForReview = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    const { comments, bypassWithExceptions, updates } = req.body;

    const [rows]: any = await pool.query('SELECT * FROM site_surveys WHERE id = ?', [id]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Survey not found' });
    }

    const current = rows[0];

    // If incoming updates were provided, persist them first so validation runs against latest state
    if (updates && typeof updates === 'object') {
      const s = updates;
      const updateMap: Record<string, any> = {
        roof_area_sqft: s.roofAreaSqFt !== undefined ? s.roofAreaSqFt : current.roof_area_sqft,
        shadow_free_area_sqft: s.shadowFreeAreaSqFt !== undefined ? s.shadowFreeAreaSqFt : current.shadow_free_area_sqft,
        roof_type: s.roofType !== undefined ? s.roofType : current.roof_type,
        azimuth_angle: s.azimuthAngle !== undefined ? s.azimuthAngle : current.azimuth_angle,
        tilt_angle: s.tiltAngle !== undefined ? s.tiltAngle : current.tilt_angle,
        existing_sanction_load_kw: s.existingSanctionLoadKw !== undefined ? s.existingSanctionLoadKw : current.existing_sanction_load_kw,
        grid_phase: s.gridPhase !== undefined ? s.gridPhase : current.grid_phase,
        distance_to_lt_panel_meters: s.distanceToLtPanelMeters !== undefined ? s.distanceToLtPanelMeters : current.distance_to_lt_panel_meters,
        recommended_kw: s.recommendedKw !== undefined ? s.recommendedKw : current.recommended_kw,
        panel_quantity: s.panelQuantity !== undefined ? s.panelQuantity : current.panel_quantity,
        estimated_generation_units_per_year: s.estimatedGenerationUnitsPerYear !== undefined ? s.estimatedGenerationUnitsPerYear : current.estimated_generation_units_per_year,
        estimated_annual_savings: s.estimatedAnnualSavings !== undefined ? s.estimatedAnnualSavings : current.estimated_annual_savings,
        estimated_cost: s.estimatedCost !== undefined ? s.estimatedCost : current.estimated_cost,
        payback_years: s.paybackYears !== undefined ? s.paybackYears : current.payback_years,
        co2_reduction_tons_per_year: s.co2ReductionTonsPerYear !== undefined ? s.co2ReductionTonsPerYear : current.co2_reduction_tons_per_year,
        notes: s.notes !== undefined ? s.notes : current.notes,
        
        roof_dimensions_shape: s.roofDimensionsShape !== undefined ? s.roofDimensionsShape : current.roof_dimensions_shape,
        surface_condition: s.surfaceCondition !== undefined ? s.surfaceCondition : current.surface_condition,
        measurement_status: s.measurementStatus !== undefined ? s.measurementStatus : current.measurement_status,
        obstacles_water_tank: s.obstaclesWaterTank !== undefined ? (s.obstaclesWaterTank ? 1 : 0) : current.obstacles_water_tank,
        obstacles_mumty: s.obstaclesMumty !== undefined ? (s.obstaclesMumty ? 1 : 0) : current.obstacles_mumty,
        obstacles_parapet: s.obstaclesParapet !== undefined ? (s.obstaclesParapet ? 1 : 0) : current.obstacles_parapet,
        obstacles_trees_neighbors: s.obstaclesTreesNeighbors !== undefined ? (s.obstaclesTreesNeighbors ? 1 : 0) : current.obstacles_trees_neighbors,
        obstacles_other: s.obstaclesOther !== undefined ? s.obstaclesOther : current.obstacles_other,
        access_pathways_clearance: s.accessPathwaysClearance !== undefined ? s.accessPathwaysClearance : current.access_pathways_clearance,
        
        main_meter_status: s.mainMeterStatus !== undefined ? s.mainMeterStatus : current.main_meter_status,
        main_meter_notes: s.mainMeterNotes !== undefined ? s.mainMeterNotes : current.main_meter_notes,
        db_condition: s.dbCondition !== undefined ? s.dbCondition : current.db_condition,
        earthing_status: s.earthingStatus !== undefined ? s.earthingStatus : current.earthing_status,
        earthing_resistance_ohms: s.earthingResistanceOhms !== undefined ? s.earthingResistanceOhms : current.earthing_resistance_ohms,
        proposed_inverter_location: s.proposedInverterLocation !== undefined ? s.proposedInverterLocation : current.proposed_inverter_location,
        electrical_constraints: s.electricalConstraints !== undefined ? s.electricalConstraints : current.electrical_constraints,
        electrical_upgrades_needed: s.electricalUpgradesNeeded !== undefined ? s.electricalUpgradesNeeded : current.electrical_upgrades_needed,
        
        structural_concerns: s.structuralConcerns !== undefined ? s.structuralConcerns : current.structural_concerns,
        visible_cracks_damage: s.visibleCracksDamage !== undefined ? (s.visibleCracksDamage ? 1 : 0) : current.visible_cracks_damage,
        waterproofing_status: s.waterproofingStatus !== undefined ? s.waterproofingStatus : current.waterproofing_status,
        mounting_structure_type: s.mountingStructureType !== undefined ? s.mountingStructureType : current.mounting_structure_type,
        shading_sources: s.shadingSources !== undefined ? s.shadingSources : current.shading_sources,
        shading_affected_area_sqft: s.shadingAffectedAreaSqFt !== undefined ? s.shadingAffectedAreaSqFt : current.shading_affected_area_sqft,
        structural_engineer_approval_required: s.structuralEngineerApprovalRequired !== undefined ? (s.structuralEngineerApprovalRequired ? 1 : 0) : current.structural_engineer_approval_required,
        
        feasibility_verdict: s.feasibilityVerdict !== undefined ? s.feasibilityVerdict : current.feasibility_verdict,
        proposed_panel_wattage: s.proposedPanelWattage !== undefined ? s.proposedPanelWattage : current.proposed_panel_wattage,
        inverter_recommendation: s.inverterRecommendation !== undefined ? s.inverterRecommendation : current.inverter_recommendation,
        cable_specification: s.cableSpecification !== undefined ? s.cableSpecification : current.cable_specification,
        unresolved_technical_issues: s.unresolvedTechnicalIssues !== undefined ? s.unresolvedTechnicalIssues : current.unresolved_technical_issues,
        engineer_recommendations: s.engineerRecommendations !== undefined ? s.engineerRecommendations : current.engineer_recommendations,
        custom_fields: s.customFields !== undefined ? (typeof s.customFields === 'string' ? s.customFields : JSON.stringify(s.customFields)) : current.custom_fields,
      };

      const setClauses: string[] = [];
      const values: any[] = [];
      for (const [key, val] of Object.entries(updateMap)) {
        setClauses.push(`${key} = ?`);
        values.push(val);
      }
      values.push(id);
      await pool.query(`UPDATE site_surveys SET ${setClauses.join(', ')} WHERE id = ?`, values);
    }

    const [freshRows]: any = await pool.query('SELECT * FROM site_surveys WHERE id = ?', [id]);
    const survey = freshRows[0];

    // Completion Checklist Validation
    const errors: string[] = [];
    if (!survey.roof_area_sqft || Number(survey.roof_area_sqft) <= 0) {
      errors.push('Total roof area must be greater than 0 sq.ft');
    }
    if (!survey.shadow_free_area_sqft || Number(survey.shadow_free_area_sqft) <= 0) {
      errors.push('Usable shadow-free area must be greater than 0 sq.ft');
    }
    if (!survey.recommended_kw || Number(survey.recommended_kw) <= 0) {
      errors.push('Recommended system capacity must be calculated and greater than 0 kW');
    }

    // Check mandatory photos: full rooftop view and meter
    const [photos]: any = await pool.query('SELECT category FROM survey_photos WHERE survey_id = ?', [id]);
    const categories = new Set(photos.map((p: any) => p.category));
    if (!categories.has('full_rooftop_view') && !categories.has('mounting_area')) {
      errors.push('Mandatory photograph missing: Full Rooftop View or Mounting Area');
    }

    if (errors.length > 0 && !bypassWithExceptions) {
      return res.status(400).json({ 
        success: false, 
        error: 'Survey completion checklist failed', 
        checklistErrors: errors 
      });
    }

    const submittedAt = new Date().toISOString();
    await pool.query(
      `UPDATE site_surveys 
       SET status = 'Submitted for Review', 
           submitted_at = ?, 
           submitted_by_id = ?, 
           is_draft = 0 
       WHERE id = ?`,
      [submittedAt, user?.id || 'EMP-03', id]
    );

    // Record review history
    const historyId = `HIST-${Date.now()}`;
    await pool.query(
      `INSERT INTO survey_review_history (id, survey_id, reviewer_id, reviewer_name, action, comments, created_at)
       VALUES (?, ?, ?, ?, 'Submitted', ?, ?)`,
      [historyId, id, user?.id || null, user?.name || 'Engineer', comments || req.body.comments || 'Survey technical audit submitted for review', submittedAt]
    );

    const [updated]: any = await pool.query('SELECT * FROM site_surveys WHERE id = ?', [id]);
    const [surveyPhotos]: any = await pool.query('SELECT * FROM survey_photos WHERE survey_id = ?', [id]);
    const [history]: any = await pool.query('SELECT * FROM survey_review_history WHERE survey_id = ? ORDER BY created_at ASC', [id]);

    res.json({ success: true, message: 'Survey successfully submitted for review', survey: formatSurvey(updated[0], surveyPhotos, history) });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// 8. Review Survey (Approve or Request Changes)
export const reviewSurvey = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    const { decision, comments } = req.body;

    if (!decision || (decision !== 'Approved' && decision !== 'Changes Required')) {
      return res.status(400).json({ success: false, error: 'Valid decision ("Approved" or "Changes Required") is required' });
    }

    const [rows]: any = await pool.query('SELECT * FROM site_surveys WHERE id = ?', [id]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Survey not found' });
    }

    const survey = rows[0];
    const reviewedAt = new Date().toISOString();
    const newStatus = decision === 'Approved' ? 'Approved' : 'Changes Required';

    await pool.query(
      `UPDATE site_surveys 
       SET status = ?, 
           reviewed_at = ?, 
           reviewed_by_id = ?, 
           reviewer_name = ?, 
           review_decision = ?, 
           review_comments = ?
       WHERE id = ?`,
      [newStatus, reviewedAt, user?.id || 'EMP-01', user?.name || 'Reviewer', decision, comments || '', id]
    );

    // Record review history
    const historyId = `HIST-${Date.now()}`;
    await pool.query(
      `INSERT INTO survey_review_history (id, survey_id, reviewer_id, reviewer_name, action, comments, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [historyId, id, user?.id || null, user?.name || 'Reviewer', decision, comments || '', reviewedAt]
    );

    // If approved, update lead status so Survey Engineer can configure Field BOM
    if (decision === 'Approved') {
      if (survey.lead_id) {
        await pool.query(
          "UPDATE leads SET status = 'Survey Completed' WHERE id = ?",
          [survey.lead_id]
        );
      }
    }

    const [updated]: any = await pool.query('SELECT * FROM site_surveys WHERE id = ?', [id]);
    const [surveyPhotos]: any = await pool.query('SELECT * FROM survey_photos WHERE survey_id = ?', [id]);
    const [history]: any = await pool.query('SELECT * FROM survey_review_history WHERE survey_id = ? ORDER BY created_at ASC', [id]);

    res.json({
      success: true,
      message: `Survey marked as ${decision}. Ready for Field BOM material configuration.`,
      survey: formatSurvey(updated[0], surveyPhotos, history),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// 9. Reschedule Survey
export const rescheduleSurvey = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { scheduledDate, scheduledTime, engineerId, engineerName, notes } = req.body;

    if (!scheduledDate) {
      return res.status(400).json({ success: false, error: 'New scheduled date is required' });
    }

    const [rows]: any = await pool.query('SELECT * FROM site_surveys WHERE id = ?', [id]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Survey not found' });
    }

    const fields: string[] = ['scheduled_date = ?'];
    const values: any[] = [scheduledDate];

    if (scheduledTime) {
      fields.push('scheduled_time = ?');
      values.push(scheduledTime);
    }
    if (engineerId) {
      fields.push('engineer_id = ?');
      values.push(engineerId);
    }
    if (engineerName) {
      fields.push('engineer_name = ?');
      values.push(engineerName);
    }
    if (notes) {
      fields.push('notes = ?');
      values.push(notes);
    }

    values.push(id);
    await pool.query(`UPDATE site_surveys SET ${fields.join(', ')} WHERE id = ?`, values);

    const [updated]: any = await pool.query('SELECT * FROM site_surveys WHERE id = ?', [id]);
    res.json({ success: true, message: 'Survey rescheduled', survey: formatSurvey(updated[0]) });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// 10. Delete Survey (Allowed only when survey is in Approved state)
export const deleteSurvey = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const [rows]: any = await pool.query('SELECT * FROM site_surveys WHERE id = ?', [id]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Survey not found' });
    }

    const survey = rows[0];

    // Enforce business rule: survey can only be deleted once it has been Approved
    if (survey.status !== 'Approved') {
      return res.status(400).json({ 
        success: false, 
        error: `Survey ${id} cannot be deleted because it is '${survey.status}'. Surveys can only be deleted once they reach the 'Approved' state.` 
      });
    }

    // Clean up survey photos from filesystem & DB
    try {
      const [photos]: any = await pool.query('SELECT * FROM survey_photos WHERE survey_id = ?', [id]);
      if (photos && photos.length > 0) {
        for (const p of photos) {
          if (p.file_path) {
            const absPath = path.resolve(process.cwd(), p.file_path);
            if (fs.existsSync(absPath)) {
              try { fs.unlinkSync(absPath); } catch (e) { /* ignore cleanup error */ }
            }
          }
        }
        await pool.query('DELETE FROM survey_photos WHERE survey_id = ?', [id]);
      }
    } catch (e) {
      console.warn('Photos cleanup error:', e);
    }

    // Clean up review history from survey_review_history
    try {
      await pool.query('DELETE FROM survey_review_history WHERE survey_id = ?', [id]);
    } catch (e) {
      console.warn('Review history cleanup error:', e);
    }

    // Unlink project BOMs if any
    try {
      await pool.query('UPDATE project_boms SET survey_id = NULL WHERE survey_id = ?', [id]);
    } catch (e) {
      // ignore
    }

    // Delete survey
    await pool.query('DELETE FROM site_surveys WHERE id = ?', [id]);

    // Unlink lead reference if any
    try {
      await pool.query("UPDATE leads SET survey_id = NULL WHERE survey_id = ?", [id]);
    } catch (e) {
      // ignore
    }

    res.json({ success: true, message: `Survey ${id} successfully deleted.` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

