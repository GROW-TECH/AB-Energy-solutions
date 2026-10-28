// server.ts
import express from "express";
import { createServer as createViteServer } from "vite";
import dotenv3 from "dotenv";
import path7 from "path";
import { fileURLToPath } from "url";
import fs6 from "fs";

// server/routes/index.ts
import { Router as Router19 } from "express";

// server/db.ts
import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();
var pool = mysql.createPool({
  host: process.env.DB_HOST || "xiadot.com",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "ab_energy_solutions",
  password: process.env.DB_PASSWORD || "ab_energy_solutions",
  database: process.env.DB_NAME || "ab_energy_solutions",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// server/controllers/surveys.controller.ts
import fs from "fs";
import path from "path";
function formatPhoto(p) {
  return {
    id: p.id,
    surveyId: p.survey_id,
    category: p.category,
    fileName: p.file_name,
    filePath: p.file_path,
    fileSize: p.file_size ? Number(p.file_size) : 0,
    mimeType: p.mime_type || "image/jpeg",
    caption: p.caption || "",
    uploaderId: p.uploader_id || "",
    uploaderName: p.uploader_name || "",
    capturedAt: p.captured_at || null,
    uploadedAt: p.uploaded_at,
    latitude: p.latitude !== null && p.latitude !== void 0 ? Number(p.latitude) : null,
    longitude: p.longitude !== null && p.longitude !== void 0 ? Number(p.longitude) : null,
    gpsAccuracyMeters: p.gps_accuracy_meters !== null && p.gps_accuracy_meters !== void 0 ? Number(p.gps_accuracy_meters) : null,
    geoVerified: Boolean(p.geo_verified),
    verificationStatus: p.verification_status || "Uploaded",
    verificationNotes: p.verification_notes || ""
  };
}
function formatSurvey(s, photos = [], history = []) {
  return {
    id: s.id,
    leadId: s.lead_id,
    leadName: s.lead_name,
    customerName: s.customer_name,
    phone: s.phone,
    address: s.address,
    scheduledDate: s.scheduled_date,
    scheduledTime: s.scheduled_time || "10:00 AM - 12:00 PM",
    engineerId: s.engineer_id,
    engineerName: s.engineer_name,
    status: s.status,
    roofAreaSqFt: Number(s.roof_area_sqft) || 0,
    shadowFreeAreaSqFt: Number(s.shadow_free_area_sqft) || 0,
    roofType: s.roof_type || "RCC Flat",
    azimuthAngle: Number(s.azimuth_angle) || 180,
    tiltAngle: Number(s.tilt_angle) || 15,
    existingSanctionLoadKw: Number(s.existing_sanction_load_kw) || 0,
    gridPhase: s.grid_phase || "Three Phase",
    distanceToLtPanelMeters: Number(s.distance_to_lt_panel_meters) || 0,
    recommendedKw: Number(s.recommended_kw) || 0,
    panelQuantity: Number(s.panel_quantity) || 0,
    estimatedGenerationUnitsPerYear: Number(s.estimated_generation_units_per_year) || 0,
    estimatedAnnualSavings: Number(s.estimated_annual_savings) || 0,
    estimatedCost: Number(s.estimated_cost) || 0,
    paybackYears: Number(s.payback_years) || 4.5,
    co2ReductionTonsPerYear: Number(s.co2_reduction_tons_per_year) || 0,
    photosUploaded: typeof s.photos_uploaded === "string" ? JSON.parse(s.photos_uploaded) : s.photos_uploaded || [],
    billPhotoUploaded: Boolean(s.bill_photo_uploaded),
    notes: s.notes || "",
    completedAt: s.completed_at,
    // Rooftop Engineering & Measurement status
    roofDimensionsShape: s.roof_dimensions_shape || "Rectangular",
    surfaceCondition: s.surface_condition || "Good",
    measurementStatus: s.measurement_status || "Initial Estimate",
    obstaclesWaterTank: Boolean(s.obstacles_water_tank),
    obstaclesMumty: Boolean(s.obstacles_mumty),
    obstaclesParapet: Boolean(s.obstacles_parapet),
    obstaclesTreesNeighbors: Boolean(s.obstacles_trees_neighbors),
    obstaclesOther: s.obstacles_other || "",
    accessPathwaysClearance: s.access_pathways_clearance || "1m walkway required along perimeter",
    // Electrical Inspection
    mainMeterStatus: s.main_meter_status || "Not Assessed",
    mainMeterNotes: s.main_meter_notes || "",
    dbCondition: s.db_condition || "Not Assessed",
    earthingStatus: s.earthing_status || "Not Assessed",
    earthingResistanceOhms: s.earthing_resistance_ohms !== null && s.earthing_resistance_ohms !== void 0 ? Number(s.earthing_resistance_ohms) : null,
    proposedInverterLocation: s.proposed_inverter_location || "",
    electricalConstraints: s.electrical_constraints || "",
    electricalUpgradesNeeded: s.electrical_upgrades_needed || "",
    // Structural & Shading Assessment
    structuralConcerns: s.structural_concerns || "",
    visibleCracksDamage: Boolean(s.visible_cracks_damage),
    waterproofingStatus: s.waterproofing_status || "Good",
    mountingStructureType: s.mounting_structure_type || "Standard Elevated",
    shadingSources: s.shading_sources || "",
    shadingAffectedAreaSqFt: Number(s.shading_affected_area_sqft) || 0,
    structuralEngineerApprovalRequired: Boolean(s.structural_engineer_approval_required),
    // Engineering Findings & Feasibility
    feasibilityVerdict: s.feasibility_verdict || "Feasible",
    proposedPanelWattage: Number(s.proposed_panel_wattage) || 550,
    inverterRecommendation: s.inverter_recommendation || "",
    cableSpecification: s.cable_specification || "1 x 4 sq.mm Solar DC Cu, 4C x 16 sq.mm AC Al XLPE",
    unresolvedTechnicalIssues: s.unresolved_technical_issues || "",
    engineerRecommendations: s.engineer_recommendations || "",
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
    customFields: typeof s.custom_fields === "string" ? JSON.parse(s.custom_fields) : s.custom_fields || [],
    // Attached photos and audit review history
    photos: photos.map(formatPhoto),
    reviewHistory: history.map((h) => ({
      id: h.id,
      surveyId: h.survey_id,
      reviewerId: h.reviewer_id,
      reviewerName: h.reviewer_name,
      action: h.action,
      comments: h.comments,
      createdAt: h.created_at
    }))
  };
}
async function generateUniqueSurveyId() {
  const year = (/* @__PURE__ */ new Date()).getFullYear();
  const prefix = `SRV-${year}-`;
  const [rows] = await pool.query(
    "SELECT id FROM site_surveys WHERE id LIKE ? ORDER BY id DESC LIMIT 1",
    [`${prefix}%`]
  );
  let nextNum = 1;
  if (rows && rows.length > 0 && rows[0].id) {
    const parts = rows[0].id.split("-");
    if (parts.length >= 3) {
      const lastSeq = parseInt(parts[2], 10);
      if (!isNaN(lastSeq)) {
        nextNum = lastSeq + 1;
      }
    }
  }
  return `${prefix}${String(nextNum).padStart(3, "0")}`;
}
var getSurveys = async (req, res) => {
  try {
    const user2 = req.user;
    let query = "SELECT * FROM site_surveys";
    const params = [];
    if (user2 && user2.role === "Customer") {
      query += " WHERE lead_id IN (SELECT id FROM leads WHERE email = ? OR phone = ?) OR customer_name = ?";
      params.push(user2.email || "", user2.phone || "", user2.name || "");
    }
    query += " ORDER BY scheduled_date DESC";
    const [surveys] = await pool.query(query, params);
    const [allPhotos] = await pool.query("SELECT * FROM survey_photos ORDER BY uploaded_at ASC");
    const photosBySurvey = {};
    for (const p of allPhotos) {
      if (!photosBySurvey[p.survey_id]) photosBySurvey[p.survey_id] = [];
      photosBySurvey[p.survey_id].push(p);
    }
    const formatted = surveys.map((s) => formatSurvey(s, photosBySurvey[s.id] || []));
    res.json({ success: true, surveys: formatted });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
var getSurveyById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query("SELECT * FROM site_surveys WHERE id = ?", [id]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, error: "Survey not found" });
    }
    const [photos] = await pool.query("SELECT * FROM survey_photos WHERE survey_id = ? ORDER BY uploaded_at ASC", [id]);
    const [history] = await pool.query("SELECT * FROM survey_review_history WHERE survey_id = ? ORDER BY created_at ASC", [id]);
    const formatted = formatSurvey(rows[0], photos, history);
    res.json({ success: true, survey: formatted });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
var createSurvey = async (req, res) => {
  try {
    const s = req.body;
    const leadId = s.leadId;
    if (leadId) {
      const [existing] = await pool.query(
        "SELECT * FROM site_surveys WHERE lead_id = ? LIMIT 1",
        [leadId]
      );
      if (existing && existing.length > 0) {
        const [photos] = await pool.query("SELECT * FROM survey_photos WHERE survey_id = ?", [existing[0].id]);
        return res.json({
          success: true,
          reopened: true,
          message: "Existing survey reopened",
          survey: formatSurvey(existing[0], photos)
        });
      }
    }
    let surveyId = s.id;
    if (!surveyId || surveyId.startsWith("TEMP-") || surveyId.length < 5) {
      surveyId = await generateUniqueSurveyId();
    } else {
      const [idCheck] = await pool.query("SELECT id FROM site_surveys WHERE id = ?", [surveyId]);
      if (idCheck && idCheck.length > 0) {
        surveyId = await generateUniqueSurveyId();
      }
    }
    const scheduledDate = s.scheduledDate || (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const scheduledTime = s.scheduledTime || "10:00 AM - 12:00 PM";
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
        surveyId,
        s.leadId || null,
        s.leadName || s.customerName,
        s.customerName,
        s.phone,
        s.address,
        scheduledDate,
        scheduledTime,
        s.engineerId || null,
        s.engineerName || "Vikram Mehta",
        s.status || "Scheduled",
        s.roofAreaSqFt || 0,
        s.shadowFreeAreaSqFt || 0,
        s.roofType || "RCC Flat",
        s.azimuthAngle || 180,
        s.tiltAngle || 15,
        s.existingSanctionLoadKw || 0,
        s.gridPhase || "Three Phase",
        s.distanceToLtPanelMeters || 20,
        s.recommendedKw || 0,
        s.panelQuantity || 0,
        s.estimatedGenerationUnitsPerYear || 0,
        s.estimatedAnnualSavings || 0,
        s.estimatedCost || 0,
        s.paybackYears || 4.5,
        s.co2ReductionTonsPerYear || 0,
        JSON.stringify(s.photosUploaded || []),
        s.billPhotoUploaded ? 1 : 0,
        s.notes || "",
        s.completedAt || null,
        s.roofDimensionsShape || "Rectangular",
        s.surfaceCondition || "Good",
        s.measurementStatus || "Initial Estimate",
        s.obstaclesWaterTank ? 1 : 0,
        s.obstaclesMumty ? 1 : 0,
        s.obstaclesParapet ? 1 : 0,
        s.obstaclesTreesNeighbors ? 1 : 0,
        s.obstaclesOther || null,
        s.accessPathwaysClearance || "1m walkway required along perimeter",
        s.mainMeterStatus || "Not Assessed",
        s.mainMeterNotes || null,
        s.dbCondition || "Not Assessed",
        s.earthingStatus || "Not Assessed",
        s.earthingResistanceOhms !== void 0 ? s.earthingResistanceOhms : null,
        s.proposedInverterLocation || null,
        s.electricalConstraints || null,
        s.electricalUpgradesNeeded || null,
        s.structuralConcerns || null,
        s.visibleCracksDamage ? 1 : 0,
        s.waterproofingStatus || "Good",
        s.mountingStructureType || "Standard Elevated",
        s.shadingSources || null,
        s.shadingAffectedAreaSqFt || 0,
        s.structuralEngineerApprovalRequired ? 1 : 0,
        s.feasibilityVerdict || "Feasible",
        s.proposedPanelWattage || 550,
        s.inverterRecommendation || null,
        s.cableSpecification || "1 x 4 sq.mm Solar DC Cu, 4C x 16 sq.mm AC Al XLPE",
        s.unresolvedTechnicalIssues || null,
        s.engineerRecommendations || null,
        s.isDraft ? 1 : 0
      ]
    );
    if (leadId) {
      await pool.query(
        "UPDATE leads SET survey_id = ?, status = 'Site Survey Scheduled' WHERE id = ?",
        [surveyId, leadId]
      );
    }
    const [created] = await pool.query("SELECT * FROM site_surveys WHERE id = ?", [surveyId]);
    res.json({ success: true, survey: formatSurvey(created[0]) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
var updateSurvey = async (req, res) => {
  try {
    const { id } = req.params;
    const s = req.body;
    const [existing] = await pool.query("SELECT * FROM site_surveys WHERE id = ?", [id]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({ success: false, error: "Survey not found" });
    }
    const current = existing[0];
    const updateMap = {
      roof_area_sqft: s.roofAreaSqFt !== void 0 ? s.roofAreaSqFt : current.roof_area_sqft,
      shadow_free_area_sqft: s.shadowFreeAreaSqFt !== void 0 ? s.shadowFreeAreaSqFt : current.shadow_free_area_sqft,
      roof_type: s.roofType !== void 0 ? s.roofType : current.roof_type,
      azimuth_angle: s.azimuthAngle !== void 0 ? s.azimuthAngle : current.azimuth_angle,
      tilt_angle: s.tiltAngle !== void 0 ? s.tiltAngle : current.tilt_angle,
      existing_sanction_load_kw: s.existingSanctionLoadKw !== void 0 ? s.existingSanctionLoadKw : current.existing_sanction_load_kw,
      grid_phase: s.gridPhase !== void 0 ? s.gridPhase : current.grid_phase,
      distance_to_lt_panel_meters: s.distanceToLtPanelMeters !== void 0 ? s.distanceToLtPanelMeters : current.distance_to_lt_panel_meters,
      recommended_kw: s.recommendedKw !== void 0 ? s.recommendedKw : current.recommended_kw,
      panel_quantity: s.panelQuantity !== void 0 ? s.panelQuantity : current.panel_quantity,
      estimated_generation_units_per_year: s.estimatedGenerationUnitsPerYear !== void 0 ? s.estimatedGenerationUnitsPerYear : current.estimated_generation_units_per_year,
      estimated_annual_savings: s.estimatedAnnualSavings !== void 0 ? s.estimatedAnnualSavings : current.estimated_annual_savings,
      estimated_cost: s.estimatedCost !== void 0 ? s.estimatedCost : current.estimated_cost,
      payback_years: s.paybackYears !== void 0 ? s.paybackYears : current.payback_years,
      co2_reduction_tons_per_year: s.co2ReductionTonsPerYear !== void 0 ? s.co2ReductionTonsPerYear : current.co2_reduction_tons_per_year,
      notes: s.notes !== void 0 ? s.notes : current.notes,
      roof_dimensions_shape: s.roofDimensionsShape !== void 0 ? s.roofDimensionsShape : current.roof_dimensions_shape,
      surface_condition: s.surfaceCondition !== void 0 ? s.surfaceCondition : current.surface_condition,
      measurement_status: s.measurementStatus !== void 0 ? s.measurementStatus : current.measurementStatus || "Engineer Entered",
      obstacles_water_tank: s.obstaclesWaterTank !== void 0 ? s.obstaclesWaterTank ? 1 : 0 : current.obstacles_water_tank,
      obstacles_mumty: s.obstaclesMumty !== void 0 ? s.obstaclesMumty ? 1 : 0 : current.obstacles_mumty,
      obstacles_parapet: s.obstaclesParapet !== void 0 ? s.obstaclesParapet ? 1 : 0 : current.obstacles_parapet,
      obstacles_trees_neighbors: s.obstaclesTreesNeighbors !== void 0 ? s.obstaclesTreesNeighbors ? 1 : 0 : current.obstacles_trees_neighbors,
      obstacles_other: s.obstaclesOther !== void 0 ? s.obstaclesOther : current.obstacles_other,
      access_pathways_clearance: s.accessPathwaysClearance !== void 0 ? s.accessPathwaysClearance : current.access_pathways_clearance,
      main_meter_status: s.mainMeterStatus !== void 0 ? s.mainMeterStatus : current.main_meter_status,
      main_meter_notes: s.mainMeterNotes !== void 0 ? s.mainMeterNotes : current.main_meter_notes,
      db_condition: s.dbCondition !== void 0 ? s.dbCondition : current.db_condition,
      earthing_status: s.earthingStatus !== void 0 ? s.earthingStatus : current.earthing_status,
      earthing_resistance_ohms: s.earthingResistanceOhms !== void 0 ? s.earthingResistanceOhms : current.earthing_resistance_ohms,
      proposed_inverter_location: s.proposedInverterLocation !== void 0 ? s.proposedInverterLocation : current.proposed_inverter_location,
      electrical_constraints: s.electricalConstraints !== void 0 ? s.electricalConstraints : current.electrical_constraints,
      electrical_upgrades_needed: s.electricalUpgradesNeeded !== void 0 ? s.electricalUpgradesNeeded : current.electrical_upgrades_needed,
      structural_concerns: s.structuralConcerns !== void 0 ? s.structuralConcerns : current.structural_concerns,
      visible_cracks_damage: s.visibleCracksDamage !== void 0 ? s.visibleCracksDamage ? 1 : 0 : current.visible_cracks_damage,
      waterproofing_status: s.waterproofingStatus !== void 0 ? s.waterproofingStatus : current.waterproofing_status,
      mounting_structure_type: s.mountingStructureType !== void 0 ? s.mountingStructureType : current.mounting_structure_type,
      shading_sources: s.shadingSources !== void 0 ? s.shadingSources : current.shading_sources,
      shading_affected_area_sqft: s.shadingAffectedAreaSqFt !== void 0 ? s.shadingAffectedAreaSqFt : current.shading_affected_area_sqft,
      structural_engineer_approval_required: s.structuralEngineerApprovalRequired !== void 0 ? s.structuralEngineerApprovalRequired ? 1 : 0 : current.structural_engineer_approval_required,
      feasibility_verdict: s.feasibilityVerdict !== void 0 ? s.feasibilityVerdict : current.feasibility_verdict,
      proposed_panel_wattage: s.proposedPanelWattage !== void 0 ? s.proposedPanelWattage : current.proposed_panel_wattage,
      inverter_recommendation: s.inverterRecommendation !== void 0 ? s.inverterRecommendation : current.inverter_recommendation,
      cable_specification: s.cableSpecification !== void 0 ? s.cableSpecification : current.cable_specification,
      unresolved_technical_issues: s.unresolvedTechnicalIssues !== void 0 ? s.unresolvedTechnicalIssues : current.unresolved_technical_issues,
      engineer_recommendations: s.engineerRecommendations !== void 0 ? s.engineerRecommendations : current.engineer_recommendations,
      custom_fields: s.customFields !== void 0 ? typeof s.customFields === "string" ? s.customFields : JSON.stringify(s.customFields) : current.custom_fields,
      is_draft: s.isDraft !== void 0 ? s.isDraft ? 1 : 0 : 1
    };
    if (s.status !== void 0) {
      updateMap.status = s.status;
    } else if (current.status === "Scheduled") {
      updateMap.status = "In Progress";
    }
    if (s.completedAt !== void 0) {
      updateMap.completed_at = s.completedAt;
    }
    const setClauses = [];
    const values = [];
    for (const [key, val] of Object.entries(updateMap)) {
      setClauses.push(`${key} = ?`);
      values.push(val);
    }
    values.push(id);
    await pool.query(`UPDATE site_surveys SET ${setClauses.join(", ")} WHERE id = ?`, values);
    const [updated] = await pool.query("SELECT * FROM site_surveys WHERE id = ?", [id]);
    const [photos] = await pool.query("SELECT * FROM survey_photos WHERE survey_id = ? ORDER BY uploaded_at ASC", [id]);
    const [history] = await pool.query("SELECT * FROM survey_review_history WHERE survey_id = ? ORDER BY created_at ASC", [id]);
    res.json({ success: true, survey: formatSurvey(updated[0], photos, history) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
var uploadSurveyPhoto = async (req, res) => {
  try {
    const { id: surveyId } = req.params;
    const user2 = req.user;
    const [surveys] = await pool.query("SELECT * FROM site_surveys WHERE id = ?", [surveyId]);
    if (!surveys || surveys.length === 0) {
      return res.status(404).json({ success: false, error: "Survey not found" });
    }
    const {
      category,
      fileName,
      mimeType = "image/jpeg",
      base64Data,
      caption = "",
      latitude = null,
      longitude = null,
      gpsAccuracyMeters = null,
      capturedAt = null
    } = req.body;
    if (!category) {
      return res.status(400).json({ success: false, error: "Photo category is required" });
    }
    const photoId = `PH-${Date.now()}-${Math.floor(Math.random() * 1e4)}`;
    const uploadDir = path.join(process.cwd(), "uploads", "surveys", surveyId);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    let filePath = "";
    let fileSize = 0;
    if (base64Data) {
      const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      let buffer;
      let ext = "jpg";
      if (matches && matches.length === 3) {
        buffer = Buffer.from(matches[2], "base64");
        if (matches[1].includes("png")) ext = "png";
        if (matches[1].includes("webp")) ext = "webp";
      } else {
        buffer = Buffer.from(base64Data, "base64");
      }
      const safeFileName = `${photoId}.${ext}`;
      const fullDiskPath = path.join(uploadDir, safeFileName);
      fs.writeFileSync(fullDiskPath, buffer);
      filePath = `/uploads/surveys/${surveyId}/${safeFileName}`;
      fileSize = buffer.length;
    } else if (req.file) {
      filePath = `/uploads/surveys/${surveyId}/${req.file.filename}`;
      fileSize = req.file.size;
    } else {
      return res.status(400).json({ success: false, error: "No image file or base64 data provided" });
    }
    const hasValidGps = latitude !== null && longitude !== null && !isNaN(Number(latitude)) && !isNaN(Number(longitude));
    const geoVerified = hasValidGps ? 1 : 0;
    const verificationStatus = "Uploaded";
    const uploadedAt = (/* @__PURE__ */ new Date()).toISOString();
    await pool.query(
      `INSERT INTO survey_photos (
        id, survey_id, category, file_name, file_path, file_size, mime_type, 
        caption, uploader_id, uploader_name, captured_at, uploaded_at, 
        latitude, longitude, gps_accuracy_meters, geo_verified, verification_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        photoId,
        surveyId,
        category,
        fileName || `${category}.jpg`,
        filePath,
        fileSize,
        mimeType,
        caption,
        user2?.id || "EMP-03",
        user2?.name || "Rahul Sharma",
        capturedAt,
        uploadedAt,
        hasValidGps ? Number(latitude) : null,
        hasValidGps ? Number(longitude) : null,
        gpsAccuracyMeters ? Number(gpsAccuracyMeters) : null,
        geoVerified,
        verificationStatus
      ]
    );
    const [newPhoto] = await pool.query("SELECT * FROM survey_photos WHERE id = ?", [photoId]);
    res.json({ success: true, photo: formatPhoto(newPhoto[0]) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
var deleteSurveyPhoto = async (req, res) => {
  try {
    const { id: surveyId, photoId } = req.params;
    const [photos] = await pool.query(
      "SELECT * FROM survey_photos WHERE id = ? AND survey_id = ?",
      [photoId, surveyId]
    );
    if (!photos || photos.length === 0) {
      return res.json({ success: true, message: "Photo already removed", photoId });
    }
    const photo = photos[0];
    const fullPath = path.join(process.cwd(), photo.file_path);
    if (fs.existsSync(fullPath)) {
      try {
        fs.unlinkSync(fullPath);
      } catch (e) {
        console.warn("Failed to delete file from disk:", e.message);
      }
    }
    await pool.query("DELETE FROM survey_photos WHERE id = ?", [photoId]);
    res.json({ success: true, message: "Photo deleted successfully", photoId });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
var submitSurveyForReview = async (req, res) => {
  try {
    const { id } = req.params;
    const user2 = req.user;
    const { comments, bypassWithExceptions, updates } = req.body;
    const [rows] = await pool.query("SELECT * FROM site_surveys WHERE id = ?", [id]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, error: "Survey not found" });
    }
    const current = rows[0];
    if (updates && typeof updates === "object") {
      const s = updates;
      const updateMap = {
        roof_area_sqft: s.roofAreaSqFt !== void 0 ? s.roofAreaSqFt : current.roof_area_sqft,
        shadow_free_area_sqft: s.shadowFreeAreaSqFt !== void 0 ? s.shadowFreeAreaSqFt : current.shadow_free_area_sqft,
        roof_type: s.roofType !== void 0 ? s.roofType : current.roof_type,
        azimuth_angle: s.azimuthAngle !== void 0 ? s.azimuthAngle : current.azimuth_angle,
        tilt_angle: s.tiltAngle !== void 0 ? s.tiltAngle : current.tilt_angle,
        existing_sanction_load_kw: s.existingSanctionLoadKw !== void 0 ? s.existingSanctionLoadKw : current.existing_sanction_load_kw,
        grid_phase: s.gridPhase !== void 0 ? s.gridPhase : current.grid_phase,
        distance_to_lt_panel_meters: s.distanceToLtPanelMeters !== void 0 ? s.distanceToLtPanelMeters : current.distance_to_lt_panel_meters,
        recommended_kw: s.recommendedKw !== void 0 ? s.recommendedKw : current.recommended_kw,
        panel_quantity: s.panelQuantity !== void 0 ? s.panelQuantity : current.panel_quantity,
        estimated_generation_units_per_year: s.estimatedGenerationUnitsPerYear !== void 0 ? s.estimatedGenerationUnitsPerYear : current.estimated_generation_units_per_year,
        estimated_annual_savings: s.estimatedAnnualSavings !== void 0 ? s.estimatedAnnualSavings : current.estimated_annual_savings,
        estimated_cost: s.estimatedCost !== void 0 ? s.estimatedCost : current.estimated_cost,
        payback_years: s.paybackYears !== void 0 ? s.paybackYears : current.payback_years,
        co2_reduction_tons_per_year: s.co2ReductionTonsPerYear !== void 0 ? s.co2ReductionTonsPerYear : current.co2_reduction_tons_per_year,
        notes: s.notes !== void 0 ? s.notes : current.notes,
        roof_dimensions_shape: s.roofDimensionsShape !== void 0 ? s.roofDimensionsShape : current.roof_dimensions_shape,
        surface_condition: s.surfaceCondition !== void 0 ? s.surfaceCondition : current.surface_condition,
        measurement_status: s.measurementStatus !== void 0 ? s.measurementStatus : current.measurement_status,
        obstacles_water_tank: s.obstaclesWaterTank !== void 0 ? s.obstaclesWaterTank ? 1 : 0 : current.obstacles_water_tank,
        obstacles_mumty: s.obstaclesMumty !== void 0 ? s.obstaclesMumty ? 1 : 0 : current.obstacles_mumty,
        obstacles_parapet: s.obstaclesParapet !== void 0 ? s.obstaclesParapet ? 1 : 0 : current.obstacles_parapet,
        obstacles_trees_neighbors: s.obstaclesTreesNeighbors !== void 0 ? s.obstaclesTreesNeighbors ? 1 : 0 : current.obstacles_trees_neighbors,
        obstacles_other: s.obstaclesOther !== void 0 ? s.obstaclesOther : current.obstacles_other,
        access_pathways_clearance: s.accessPathwaysClearance !== void 0 ? s.accessPathwaysClearance : current.access_pathways_clearance,
        main_meter_status: s.mainMeterStatus !== void 0 ? s.mainMeterStatus : current.main_meter_status,
        main_meter_notes: s.mainMeterNotes !== void 0 ? s.mainMeterNotes : current.main_meter_notes,
        db_condition: s.dbCondition !== void 0 ? s.dbCondition : current.db_condition,
        earthing_status: s.earthingStatus !== void 0 ? s.earthingStatus : current.earthing_status,
        earthing_resistance_ohms: s.earthingResistanceOhms !== void 0 ? s.earthingResistanceOhms : current.earthing_resistance_ohms,
        proposed_inverter_location: s.proposedInverterLocation !== void 0 ? s.proposedInverterLocation : current.proposed_inverter_location,
        electrical_constraints: s.electricalConstraints !== void 0 ? s.electricalConstraints : current.electrical_constraints,
        electrical_upgrades_needed: s.electricalUpgradesNeeded !== void 0 ? s.electricalUpgradesNeeded : current.electrical_upgrades_needed,
        structural_concerns: s.structuralConcerns !== void 0 ? s.structuralConcerns : current.structural_concerns,
        visible_cracks_damage: s.visibleCracksDamage !== void 0 ? s.visibleCracksDamage ? 1 : 0 : current.visible_cracks_damage,
        waterproofing_status: s.waterproofingStatus !== void 0 ? s.waterproofingStatus : current.waterproofing_status,
        mounting_structure_type: s.mountingStructureType !== void 0 ? s.mountingStructureType : current.mounting_structure_type,
        shading_sources: s.shadingSources !== void 0 ? s.shadingSources : current.shading_sources,
        shading_affected_area_sqft: s.shadingAffectedAreaSqFt !== void 0 ? s.shadingAffectedAreaSqFt : current.shading_affected_area_sqft,
        structural_engineer_approval_required: s.structuralEngineerApprovalRequired !== void 0 ? s.structuralEngineerApprovalRequired ? 1 : 0 : current.structural_engineer_approval_required,
        feasibility_verdict: s.feasibilityVerdict !== void 0 ? s.feasibilityVerdict : current.feasibility_verdict,
        proposed_panel_wattage: s.proposedPanelWattage !== void 0 ? s.proposedPanelWattage : current.proposed_panel_wattage,
        inverter_recommendation: s.inverterRecommendation !== void 0 ? s.inverterRecommendation : current.inverter_recommendation,
        cable_specification: s.cableSpecification !== void 0 ? s.cableSpecification : current.cable_specification,
        unresolved_technical_issues: s.unresolvedTechnicalIssues !== void 0 ? s.unresolvedTechnicalIssues : current.unresolved_technical_issues,
        engineer_recommendations: s.engineerRecommendations !== void 0 ? s.engineerRecommendations : current.engineer_recommendations,
        custom_fields: s.customFields !== void 0 ? typeof s.customFields === "string" ? s.customFields : JSON.stringify(s.customFields) : current.custom_fields
      };
      const setClauses = [];
      const values = [];
      for (const [key, val] of Object.entries(updateMap)) {
        setClauses.push(`${key} = ?`);
        values.push(val);
      }
      values.push(id);
      await pool.query(`UPDATE site_surveys SET ${setClauses.join(", ")} WHERE id = ?`, values);
    }
    const [freshRows] = await pool.query("SELECT * FROM site_surveys WHERE id = ?", [id]);
    const survey = freshRows[0];
    const errors = [];
    if (!survey.roof_area_sqft || Number(survey.roof_area_sqft) <= 0) {
      errors.push("Total roof area must be greater than 0 sq.ft");
    }
    if (!survey.shadow_free_area_sqft || Number(survey.shadow_free_area_sqft) <= 0) {
      errors.push("Usable shadow-free area must be greater than 0 sq.ft");
    }
    if (!survey.recommended_kw || Number(survey.recommended_kw) <= 0) {
      errors.push("Recommended system capacity must be calculated and greater than 0 kW");
    }
    const [photos] = await pool.query("SELECT category FROM survey_photos WHERE survey_id = ?", [id]);
    const categories = new Set(photos.map((p) => p.category));
    if (!categories.has("full_rooftop_view") && !categories.has("mounting_area")) {
      errors.push("Mandatory photograph missing: Full Rooftop View or Mounting Area");
    }
    if (errors.length > 0 && !bypassWithExceptions) {
      return res.status(400).json({
        success: false,
        error: "Survey completion checklist failed",
        checklistErrors: errors
      });
    }
    const submittedAt = (/* @__PURE__ */ new Date()).toISOString();
    await pool.query(
      `UPDATE site_surveys 
       SET status = 'Submitted for Review', 
           submitted_at = ?, 
           submitted_by_id = ?, 
           is_draft = 0 
       WHERE id = ?`,
      [submittedAt, user2?.id || "EMP-03", id]
    );
    const historyId = `HIST-${Date.now()}`;
    await pool.query(
      `INSERT INTO survey_review_history (id, survey_id, reviewer_id, reviewer_name, action, comments, created_at)
       VALUES (?, ?, ?, ?, 'Submitted', ?, ?)`,
      [historyId, id, user2?.id || null, user2?.name || "Engineer", comments || req.body.comments || "Survey technical audit submitted for review", submittedAt]
    );
    const [updated] = await pool.query("SELECT * FROM site_surveys WHERE id = ?", [id]);
    const [surveyPhotos] = await pool.query("SELECT * FROM survey_photos WHERE survey_id = ?", [id]);
    const [history] = await pool.query("SELECT * FROM survey_review_history WHERE survey_id = ? ORDER BY created_at ASC", [id]);
    res.json({ success: true, message: "Survey successfully submitted for review", survey: formatSurvey(updated[0], surveyPhotos, history) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
var reviewSurvey = async (req, res) => {
  try {
    const { id } = req.params;
    const user2 = req.user;
    const { decision, comments } = req.body;
    if (!decision || decision !== "Approved" && decision !== "Changes Required") {
      return res.status(400).json({ success: false, error: 'Valid decision ("Approved" or "Changes Required") is required' });
    }
    const [rows] = await pool.query("SELECT * FROM site_surveys WHERE id = ?", [id]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, error: "Survey not found" });
    }
    const survey = rows[0];
    const reviewedAt = (/* @__PURE__ */ new Date()).toISOString();
    const newStatus = decision === "Approved" ? "Approved" : "Changes Required";
    await pool.query(
      `UPDATE site_surveys 
       SET status = ?, 
           reviewed_at = ?, 
           reviewed_by_id = ?, 
           reviewer_name = ?, 
           review_decision = ?, 
           review_comments = ?
       WHERE id = ?`,
      [newStatus, reviewedAt, user2?.id || "EMP-01", user2?.name || "Reviewer", decision, comments || "", id]
    );
    const historyId = `HIST-${Date.now()}`;
    await pool.query(
      `INSERT INTO survey_review_history (id, survey_id, reviewer_id, reviewer_name, action, comments, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [historyId, id, user2?.id || null, user2?.name || "Reviewer", decision, comments || "", reviewedAt]
    );
    if (decision === "Approved") {
      if (survey.lead_id) {
        await pool.query(
          "UPDATE leads SET status = 'Survey Completed' WHERE id = ?",
          [survey.lead_id]
        );
      }
    }
    const [updated] = await pool.query("SELECT * FROM site_surveys WHERE id = ?", [id]);
    const [surveyPhotos] = await pool.query("SELECT * FROM survey_photos WHERE survey_id = ?", [id]);
    const [history] = await pool.query("SELECT * FROM survey_review_history WHERE survey_id = ? ORDER BY created_at ASC", [id]);
    res.json({
      success: true,
      message: `Survey marked as ${decision}. Ready for Field BOM material configuration.`,
      survey: formatSurvey(updated[0], surveyPhotos, history)
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
var rescheduleSurvey = async (req, res) => {
  try {
    const { id } = req.params;
    const { scheduledDate, scheduledTime, engineerId, engineerName, notes } = req.body;
    if (!scheduledDate) {
      return res.status(400).json({ success: false, error: "New scheduled date is required" });
    }
    const [rows] = await pool.query("SELECT * FROM site_surveys WHERE id = ?", [id]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, error: "Survey not found" });
    }
    const fields = ["scheduled_date = ?"];
    const values = [scheduledDate];
    if (scheduledTime) {
      fields.push("scheduled_time = ?");
      values.push(scheduledTime);
    }
    if (engineerId) {
      fields.push("engineer_id = ?");
      values.push(engineerId);
    }
    if (engineerName) {
      fields.push("engineer_name = ?");
      values.push(engineerName);
    }
    if (notes) {
      fields.push("notes = ?");
      values.push(notes);
    }
    values.push(id);
    await pool.query(`UPDATE site_surveys SET ${fields.join(", ")} WHERE id = ?`, values);
    const [updated] = await pool.query("SELECT * FROM site_surveys WHERE id = ?", [id]);
    res.json({ success: true, message: "Survey rescheduled", survey: formatSurvey(updated[0]) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
var deleteSurvey = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query("SELECT * FROM site_surveys WHERE id = ?", [id]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, error: "Survey not found" });
    }
    const survey = rows[0];
    if (survey.status !== "Approved") {
      return res.status(400).json({
        success: false,
        error: `Survey ${id} cannot be deleted because it is '${survey.status}'. Surveys can only be deleted once they reach the 'Approved' state.`
      });
    }
    try {
      const [photos] = await pool.query("SELECT * FROM survey_photos WHERE survey_id = ?", [id]);
      if (photos && photos.length > 0) {
        for (const p of photos) {
          if (p.file_path) {
            const absPath = path.resolve(process.cwd(), p.file_path);
            if (fs.existsSync(absPath)) {
              try {
                fs.unlinkSync(absPath);
              } catch (e) {
              }
            }
          }
        }
        await pool.query("DELETE FROM survey_photos WHERE survey_id = ?", [id]);
      }
    } catch (e) {
      console.warn("Photos cleanup error:", e);
    }
    try {
      await pool.query("DELETE FROM survey_review_history WHERE survey_id = ?", [id]);
    } catch (e) {
      console.warn("Review history cleanup error:", e);
    }
    try {
      await pool.query("UPDATE project_boms SET survey_id = NULL WHERE survey_id = ?", [id]);
    } catch (e) {
    }
    await pool.query("DELETE FROM site_surveys WHERE id = ?", [id]);
    try {
      await pool.query("UPDATE leads SET survey_id = NULL WHERE survey_id = ?", [id]);
    } catch (e) {
    }
    res.json({ success: true, message: `Survey ${id} successfully deleted.` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// server/controllers/bootstrap.controller.ts
var getBootstrapData = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Authentication required to access CRM bootstrap data.",
        code: "AUTH_REQUIRED"
      });
    }
    const { role, customerId } = req.user;
    if (role === "Customer") {
      const activeCustId = customerId || "CUST-2026-001";
      const [customers2] = await pool.query(
        "SELECT id, name, email, phone, alternate_phone, address, city, state, pincode, consumer_number_discom, discom_name, gstin, total_system_kw, total_order_value, paid_amount, balance_amount, status, created_at FROM customers WHERE id = ?",
        [activeCustId]
      );
      const [projects2] = await pool.query(
        "SELECT * FROM projects WHERE customer_id = ? ORDER BY created_at DESC",
        [activeCustId]
      );
      const [invoices2] = await pool.query(
        "SELECT * FROM invoices WHERE customer_id = ? ORDER BY issue_date DESC",
        [activeCustId]
      );
      const [payments2] = await pool.query(
        "SELECT * FROM payments WHERE customer_id = ? ORDER BY payment_date DESC",
        [activeCustId]
      );
      const [warranties2] = await pool.query(
        "SELECT * FROM warranties WHERE customer_id = ?",
        [activeCustId]
      );
      const [amcs2] = await pool.query(
        "SELECT * FROM amc_contracts WHERE customer_id = ?",
        [activeCustId]
      );
      const [tickets2] = await pool.query(
        "SELECT * FROM service_tickets WHERE customer_id = ? ORDER BY created_at DESC",
        [activeCustId]
      );
      const [products2] = await pool.query(
        'SELECT id, sku, name, category, brand, specifications, unit, 0 as current_stock, 0 as reserved_stock, 0 as available_stock, 0 as min_threshold, 0 as unit_cost, "" as supplier_name FROM inventory_products ORDER BY category, name'
      );
      return res.json({
        success: true,
        data: {
          employees: [],
          leads: [],
          customers: customers2.map((c) => formatCustomer(c)),
          surveys: [],
          quotations: [],
          projects: projects2.map((p) => formatProject(p)),
          products: products2.map((pr) => formatProduct(pr)),
          invoices: invoices2.map((i) => formatInvoice(i)),
          payments: payments2.map((py) => formatPayment(py)),
          warranties: warranties2.map((w) => formatWarranty(w)),
          amcs: amcs2.map((a) => formatAmc(a)),
          tickets: tickets2.map((t) => formatTicket(t)),
          followUps: [],
          suppliers: [],
          expenses: [],
          automationRules: []
        }
      });
    }
    const [employees] = await pool.query(
      "SELECT id, name, email, phone, role, department, avatar, active_leads_count, completed_projects_count, location FROM employees"
    );
    const [leads] = await pool.query("SELECT * FROM leads ORDER BY created_at DESC");
    const [customers] = await pool.query(
      "SELECT id, name, email, phone, alternate_phone, address, city, state, pincode, consumer_number_discom, discom_name, gstin, converted_from_lead_id, total_system_kw, total_order_value, paid_amount, balance_amount, status, created_at FROM customers ORDER BY created_at DESC"
    );
    const [surveys] = await pool.query("SELECT * FROM site_surveys ORDER BY scheduled_date DESC");
    const [surveyPhotos] = await pool.query("SELECT * FROM survey_photos ORDER BY uploaded_at ASC");
    const [surveyHistory] = await pool.query("SELECT * FROM survey_review_history ORDER BY created_at ASC");
    const photosBySurvey = {};
    for (const p of surveyPhotos) {
      if (!photosBySurvey[p.survey_id]) photosBySurvey[p.survey_id] = [];
      photosBySurvey[p.survey_id].push(p);
    }
    const historyBySurvey = {};
    for (const h of surveyHistory) {
      if (!historyBySurvey[h.survey_id]) historyBySurvey[h.survey_id] = [];
      historyBySurvey[h.survey_id].push(h);
    }
    const [quotations] = await pool.query("SELECT * FROM quotations ORDER BY created_at DESC");
    const [projects] = await pool.query("SELECT * FROM projects ORDER BY created_at DESC");
    const [products] = await pool.query("SELECT * FROM inventory_products ORDER BY category, name");
    const [invoices] = await pool.query("SELECT * FROM invoices ORDER BY issue_date DESC");
    const [payments] = await pool.query("SELECT * FROM payments ORDER BY payment_date DESC");
    const [warranties] = await pool.query("SELECT * FROM warranties");
    const [amcs] = await pool.query("SELECT * FROM amc_contracts");
    const [tickets] = await pool.query("SELECT * FROM service_tickets ORDER BY created_at DESC");
    const [followUps] = await pool.query("SELECT * FROM follow_ups ORDER BY due_date ASC");
    const [suppliers] = await pool.query("SELECT * FROM suppliers");
    const [expenses] = await pool.query("SELECT * FROM expenses ORDER BY date DESC");
    const [custUsers] = await pool.query(
      "SELECT customer_id, username FROM user_accounts WHERE role = 'Customer' AND customer_id IS NOT NULL AND is_active = TRUE"
    );
    const custUserMap = {};
    for (const u of custUsers || []) {
      if (u.customer_id) custUserMap[u.customer_id] = u.username;
    }
    res.json({
      success: true,
      data: {
        employees: employees.map((e) => ({
          id: e.id,
          name: e.name,
          email: e.email,
          phone: e.phone,
          role: e.role,
          department: e.department,
          avatar: e.avatar,
          activeLeadsCount: e.active_leads_count,
          completedProjectsCount: e.completed_projects_count,
          location: e.location
        })),
        leads: leads.map((l) => ({
          id: l.id,
          name: l.name,
          email: l.email,
          phone: l.phone,
          city: l.city,
          state: l.state,
          address: l.address,
          pincode: l.pincode,
          source: l.source,
          status: l.status,
          priority: l.priority,
          assignedToId: l.assigned_to_id,
          assignedToName: l.assigned_to_name,
          monthlyBill: Number(l.monthly_bill) || 0,
          sanctionLoad: Number(l.sanction_load) || 0,
          roofAreaSqFt: Number(l.roof_area_sqft) || 0,
          roofType: l.roof_type,
          customerType: l.customer_type || "Residential",
          systemType: l.system_type || "On-Grid",
          recommendedKw: Number(l.recommended_kw) || 0,
          estimatedBudget: Number(l.estimated_budget) || 0,
          notes: l.notes || "",
          createdAt: l.created_at,
          updatedAt: l.updated_at,
          lastContactedAt: l.last_contacted_at
        })),
        customers: customers.map((c) => formatCustomer(c, role, custUserMap[c.id])),
        surveys: surveys.map((s) => formatSurvey(s, photosBySurvey[s.id] || [], historyBySurvey[s.id] || [])),
        quotations: quotations.map((q) => ({
          id: q.id,
          quotationNumber: q.quotation_number,
          leadId: q.lead_id,
          leadName: q.lead_name,
          customerPhone: q.customer_phone,
          customerAddress: q.customer_address,
          systemCapacityKw: Number(q.system_capacity_kw) || 0,
          currentVersion: Number(q.current_version) || 1,
          versions: typeof q.versions === "string" ? JSON.parse(q.versions) : q.versions || [],
          status: q.status,
          sentDate: q.sent_date,
          validUntil: q.valid_until,
          salespersonId: q.salesperson_id,
          salespersonName: q.salesperson_name,
          totalAmount: role === "Installation Team" ? 0 : Number(q.total_amount) || 0,
          proposalType: q.proposal_type || "Final_Technical",
          packageTier: q.package_tier || "Standard",
          approvalStatus: q.approval_status || "Approved",
          discountAmount: Number(q.discount_amount) || 0,
          discountApprovedBy: q.discount_approved_by,
          subsidyAmount: Number(q.subsidy_amount) || 0,
          taxableAmount: Number(q.taxable_amount) || 0,
          gstRate: Number(q.gst_rate) || 13.8,
          gstAmount: Number(q.gst_amount) || 0,
          pdfUrl: q.pdf_url,
          convertedToProjectId: q.converted_to_project_id,
          surveyId: q.survey_id,
          createdAt: q.created_at
        })),
        projects: projects.map((p) => formatProject(p, role)),
        products: products.map((pr) => formatProduct(pr, role)),
        invoices: role === "Installation Team" ? [] : invoices.map((i) => formatInvoice(i)),
        payments: role === "Installation Team" ? [] : payments.map((py) => formatPayment(py)),
        warranties: warranties.map((w) => formatWarranty(w)),
        amcs: amcs.map((a) => formatAmc(a)),
        tickets: tickets.map((t) => formatTicket(t)),
        followUps: followUps.map((f) => ({
          id: f.id,
          leadId: f.lead_id,
          leadName: f.lead_name,
          customerId: f.customer_id,
          customerName: f.customer_name,
          quotationId: f.quotation_id,
          title: f.title,
          dueDate: f.due_date,
          dueTime: f.due_time,
          type: f.type,
          status: f.status,
          priority: f.priority,
          assignedToId: f.assigned_to_id,
          assignedToName: f.assigned_to_name,
          notes: f.notes || "",
          completedAt: f.completed_at
        })),
        suppliers: suppliers.map((su) => ({
          id: su.id,
          name: su.name,
          contactPerson: su.contact_person,
          email: su.email,
          phone: su.phone,
          category: su.category,
          city: su.city,
          address: su.address,
          gstin: su.gstin,
          paymentTerms: su.payment_terms,
          rating: Number(su.rating) || 4.5
        })),
        expenses: role === "Installation Team" ? [] : expenses.map((ex) => ({
          id: ex.id,
          projectId: ex.project_id,
          category: ex.category,
          title: ex.title,
          totalAmount: Number(ex.total_amount) || 0,
          paymentMode: ex.payment_mode,
          receiptUrl: ex.receipt_url,
          recordedBy: ex.recorded_by,
          date: ex.date,
          notes: ex.notes || ""
        })),
        automationRules: []
      }
    });
  } catch (error) {
    console.error("Bootstrap error:", error);
    res.status(500).json({ success: false, error: "Failed to load bootstrap data." });
  }
};
function formatCustomer(c, role, portalUsername) {
  const isInstallation = role === "Installation Team";
  return {
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone,
    alternatePhone: c.alternate_phone,
    address: c.address,
    city: c.city,
    state: c.state,
    pincode: c.pincode,
    consumerNumberDiscom: c.consumer_number_discom,
    discomName: c.discom_name,
    gstin: c.gstin,
    convertedFromLeadId: c.converted_from_lead_id,
    totalSystemKw: Number(c.total_system_kw) || 0,
    totalOrderValue: isInstallation ? 0 : Number(c.total_order_value) || 0,
    paidAmount: isInstallation ? 0 : Number(c.paid_amount) || 0,
    balanceAmount: isInstallation ? 0 : Number(c.balance_amount) || 0,
    status: c.status,
    createdAt: c.created_at,
    portalUsername: portalUsername || c.portal_username || null
  };
}
function formatProject(p, role) {
  const isInstallation = role === "Installation Team";
  return {
    id: p.id,
    customerId: p.customer_id,
    customerName: p.customer_name,
    customerPhone: p.customer_phone,
    customerAddress: p.customer_address,
    quotationId: p.quotation_id,
    capacityKw: Number(p.capacity_kw) || 0,
    totalAmount: isInstallation ? 0 : Number(p.total_amount) || 0,
    stage: p.stage,
    startDate: p.start_date,
    targetCompletionDate: p.target_completion_date,
    projectManagerId: p.project_manager_id,
    projectManagerName: p.project_manager_name,
    installationLeadId: p.installation_lead_id,
    installationLeadName: p.installation_lead_name,
    checklist: typeof p.checklist === "string" ? JSON.parse(p.checklist) : p.checklist || {},
    tasks: typeof p.tasks === "string" ? JSON.parse(p.tasks) : p.tasks || [],
    inventoryReserved: Boolean(p.inventory_reserved),
    materialShortageFlag: Boolean(p.material_shortage_flag),
    shortageDetails: p.shortage_details,
    commissioningDate: p.commissioning_date,
    netMeterInstalledDate: p.net_meter_installed_date,
    warrantyActivated: Boolean(p.warranty_activated),
    amcInitiated: Boolean(p.amc_initiated),
    discomSanctionNumber: p.discom_sanction_number,
    notes: p.notes || ""
  };
}
function formatProduct(pr, role) {
  const isInstallation = role === "Installation Team";
  return {
    id: pr.id,
    sku: pr.sku,
    name: pr.name,
    category: pr.category,
    brand: pr.brand,
    specifications: pr.specifications,
    unit: pr.unit,
    currentStock: Number(pr.current_stock) || 0,
    reservedStock: Number(pr.reserved_stock) || 0,
    availableStock: Number(pr.available_stock) || 0,
    minThreshold: Number(pr.min_threshold) || 0,
    unitCost: isInstallation ? 0 : Number(pr.unit_cost) || 0,
    supplierName: pr.supplier_name
  };
}
function formatInvoice(i) {
  return {
    id: i.id,
    invoiceNumber: i.invoice_number,
    projectId: i.project_id,
    customerId: i.customer_id,
    customerName: i.customer_name,
    customerPhone: i.customer_phone,
    customerGstin: i.customer_gstin,
    issueDate: i.issue_date,
    dueDate: i.due_date,
    items: typeof i.items === "string" ? JSON.parse(i.items) : i.items || [],
    subtotal: Number(i.subtotal) || 0,
    cgst: Number(i.cgst) || 0,
    sgst: Number(i.sgst) || 0,
    igst: Number(i.igst) || 0,
    totalAmount: Number(i.total_amount) || 0,
    paidAmount: Number(i.paid_amount) || 0,
    balanceDue: Number(i.balance_due) || 0,
    status: i.status
  };
}
function formatPayment(py) {
  return {
    id: py.id,
    paymentNumber: py.payment_number,
    invoiceId: py.invoice_id,
    projectId: py.project_id,
    customerId: py.customer_id,
    customerName: py.customer_name,
    amount: Number(py.amount) || 0,
    paymentDate: py.payment_date,
    paymentMode: py.payment_mode,
    transactionReference: py.transaction_reference,
    bankName: py.bank_name,
    status: py.status,
    recordedBy: py.recorded_by
  };
}
function formatWarranty(w) {
  return {
    id: w.id,
    projectId: w.project_id,
    customerId: w.customer_id,
    customerName: w.customer_name,
    equipmentType: w.equipment_type,
    makeModel: w.make_model,
    serialNumber: w.serial_number,
    warrantyPeriodYears: Number(w.warranty_period_years) || 10,
    startDate: w.start_date,
    endDate: w.end_date,
    daysRemaining: Number(w.days_remaining) || 0,
    status: w.status
  };
}
function formatAmc(a) {
  return {
    id: a.id,
    customerId: a.customer_id,
    customerName: a.customer_name,
    customerPhone: a.customer_phone,
    customerAddress: a.customer_address,
    projectId: a.project_id,
    capacityKw: Number(a.capacity_kw) || 0,
    planName: a.plan_name,
    annualPrice: Number(a.annual_price) || 0,
    visitsPerYear: Number(a.visits_per_year) || 4,
    completedVisits: Number(a.completed_visits) || 0,
    startDate: a.start_date,
    endDate: a.end_date,
    status: a.status,
    nextScheduledVisit: a.next_scheduled_visit
  };
}
function formatTicket(t) {
  return {
    id: t.id,
    ticketNumber: t.ticket_number,
    customerId: t.customer_id,
    customerName: t.customer_name,
    customerPhone: t.phone,
    customerAddress: t.customer_address,
    projectId: t.project_id,
    issueCategory: t.issue_category,
    severity: t.severity,
    status: t.status,
    technicianId: t.technician_id,
    technicianName: t.technician_name,
    description: t.description,
    createdAt: t.created_at,
    scheduledDate: t.scheduled_date,
    resolvedAt: t.resolved_at,
    resolutionNotes: t.resolution_notes,
    customerFeedbackScore: Number(t.customer_feedback_score) || 5
  };
}

// server/routes/auth.routes.ts
import { Router } from "express";

// server/utils/security.ts
import crypto from "crypto";
import dotenv2 from "dotenv";
dotenv2.config();
var JWT_SECRET = process.env.JWT_SECRET || "ab_energy_solutions_default_dev_secret_2026_solar_crm";
function hashPassword(password, providedSalt) {
  const salt = providedSalt || crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return {
    hash: derivedKey.toString("hex"),
    salt
  };
}
function verifyPassword(password, storedHash, storedSalt) {
  try {
    const derivedKey = crypto.scryptSync(password, storedSalt, 64);
    const hashBuffer = Buffer.from(storedHash, "hex");
    const derivedBuffer = derivedKey;
    if (hashBuffer.length !== derivedBuffer.length) {
      return false;
    }
    return crypto.timingSafeEqual(hashBuffer, derivedBuffer);
  } catch (err) {
    return false;
  }
}
function base64UrlEncode(str) {
  return Buffer.from(str).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}
function base64UrlDecode(str) {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  return Buffer.from(base64, "base64").toString("utf8");
}
function signJwt(payload, expiresInSeconds = 86400) {
  const header = {
    alg: "HS256",
    typ: "JWT"
  };
  const now = Math.floor(Date.now() / 1e3);
  const fullPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds
  };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
  const signatureInput = `${encodedHeader}.${encodedPayload}`;
  const hmac = crypto.createHmac("sha256", JWT_SECRET);
  hmac.update(signatureInput);
  const encodedSignature = base64UrlEncode(hmac.digest("binary"));
  return `${signatureInput}.${encodedSignature}`;
}
function verifyJwt(token) {
  try {
    if (!token || typeof token !== "string") return null;
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    const signatureInput = `${encodedHeader}.${encodedPayload}`;
    const hmac = crypto.createHmac("sha256", JWT_SECRET);
    hmac.update(signatureInput);
    const expectedSignature = base64UrlEncode(hmac.digest("binary"));
    const signatureBuffer = Buffer.from(encodedSignature);
    const expectedBuffer = Buffer.from(expectedSignature);
    if (signatureBuffer.length !== expectedBuffer.length) {
      return null;
    }
    if (!crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
      return null;
    }
    const payloadJson = base64UrlDecode(encodedPayload);
    const payload = JSON.parse(payloadJson);
    const now = Math.floor(Date.now() / 1e3);
    if (payload.exp && payload.exp < now) {
      return null;
    }
    return payload;
  } catch (err) {
    return null;
  }
}

// server/controllers/auth.controller.ts
var loginRateLimitMap = /* @__PURE__ */ new Map();
var MAX_ATTEMPTS = 10;
var WINDOW_MS = 5 * 60 * 1e3;
var login = async (req, res) => {
  try {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const identifier = (req.body.username || req.body.email || req.body.identifier || "").trim();
    const password = req.body.password || "";
    const now = Date.now();
    const limitRecord = loginRateLimitMap.get(ip);
    if (limitRecord) {
      if (now - limitRecord.lastAttemptTime < WINDOW_MS) {
        if (limitRecord.attempts >= MAX_ATTEMPTS) {
          return res.status(429).json({
            success: false,
            error: "Too many failed login attempts. Please wait 5 minutes before trying again.",
            code: "RATE_LIMIT_EXCEEDED"
          });
        }
      } else {
        loginRateLimitMap.delete(ip);
      }
    }
    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        error: "Please provide both username/email and password."
      });
    }
    const [rows] = await pool.query(
      `SELECT id, username, email, password_hash, password_salt, role, employee_id, customer_id, name, is_active 
       FROM user_accounts 
       WHERE (username = ? OR email = ?) AND is_active = TRUE
       LIMIT 1`,
      [identifier, identifier]
    );
    let user2 = rows && rows.length > 0 ? rows[0] : null;
    if (!user2) {
      const [empRows] = await pool.query(
        `SELECT id, username, email, password_hash, password_salt, role, name 
         FROM employees 
         WHERE (username = ? OR email = ?) AND password_hash IS NOT NULL
         LIMIT 1`,
        [identifier, identifier]
      );
      if (empRows && empRows.length > 0) {
        user2 = {
          ...empRows[0],
          employee_id: empRows[0].id,
          customer_id: null,
          is_active: true
        };
      }
    }
    if (!user2) {
      const [custRows] = await pool.query(
        `SELECT id, username, email, password_hash, password_salt, name 
         FROM customers 
         WHERE (username = ? OR email = ?) AND password_hash IS NOT NULL
         LIMIT 1`,
        [identifier, identifier]
      );
      if (custRows && custRows.length > 0) {
        user2 = {
          ...custRows[0],
          role: "Customer",
          employee_id: null,
          customer_id: custRows[0].id,
          is_active: true
        };
      }
    }
    if (!user2 || !user2.password_hash || !user2.password_salt) {
      const currentAttempts = limitRecord ? limitRecord.attempts + 1 : 1;
      loginRateLimitMap.set(ip, { attempts: currentAttempts, lastAttemptTime: now });
      return res.status(401).json({
        success: false,
        error: "Invalid credentials. Please verify your username and password."
      });
    }
    const isValid = verifyPassword(password, user2.password_hash, user2.password_salt);
    if (!isValid) {
      const currentAttempts = limitRecord ? limitRecord.attempts + 1 : 1;
      loginRateLimitMap.set(ip, { attempts: currentAttempts, lastAttemptTime: now });
      return res.status(401).json({
        success: false,
        error: "Invalid credentials. Please verify your username and password."
      });
    }
    loginRateLimitMap.delete(ip);
    const tokenPayload = {
      userId: user2.id,
      username: user2.username,
      email: user2.email,
      name: user2.name,
      role: user2.role,
      employeeId: user2.employee_id,
      customerId: user2.customer_id
    };
    const token = signJwt(tokenPayload, 86400);
    res.json({
      success: true,
      token,
      user: tokenPayload,
      message: "Login successful."
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, error: "Internal server error during authentication." });
  }
};
var getMe = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Unauthenticated." });
    }
    res.json({
      success: true,
      user: req.user
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
var logout = async (_req, res) => {
  res.json({
    success: true,
    message: "Logged out successfully."
  });
};

// server/middleware/auth.ts
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  let token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token && typeof req.query.token === "string") {
    token = req.query.token;
  }
  if (!token) {
    return res.status(401).json({
      success: false,
      error: "Authentication required. Please provide a valid session token.",
      code: "AUTH_REQUIRED"
    });
  }
  const payload = verifyJwt(token);
  if (!payload) {
    return res.status(401).json({
      success: false,
      error: "Invalid or expired session token. Please log in again.",
      code: "TOKEN_INVALID_OR_EXPIRED"
    });
  }
  req.user = payload;
  next();
}
function optionalAuth(req, _res, next) {
  const authHeader = req.headers["authorization"];
  let token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token && typeof req.query.token === "string") {
    token = req.query.token;
  }
  if (token) {
    const payload = verifyJwt(token);
    if (payload) {
      req.user = payload;
    }
  }
  next();
}
function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Authentication required before permission evaluation.",
        code: "UNAUTHENTICATED"
      });
    }
    const userRole = req.user.role;
    const isSuperAdmin = userRole === "Super Admin";
    const isPermitted = isSuperAdmin || allowedRoles.includes(userRole);
    if (!isPermitted) {
      return res.status(403).json({
        success: false,
        error: `Access Denied: Role '${userRole}' does not possess permissions for this operation. Permitted roles: ${allowedRoles.join(", ")}.`,
        code: "FORBIDDEN_ROLE"
      });
    }
    next();
  };
}
function requireCustomerOwnership(entityCustomerIdExtractor) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Authentication required." });
    }
    if (req.user.role !== "Customer") {
      return next();
    }
    const requestedCustomerId = entityCustomerIdExtractor ? entityCustomerIdExtractor(req) : req.params.customerId || req.params.id || req.query.customerId || req.body.customerId;
    if (requestedCustomerId && requestedCustomerId !== req.user.customerId) {
      return res.status(403).json({
        success: false,
        error: "Access Denied: You are not authorized to access another customer's solar plant records.",
        code: "CUSTOMER_ISOLATION_VIOLATION"
      });
    }
    next();
  };
}

// server/routes/auth.routes.ts
var authRouter = Router();
authRouter.post("/login", login);
authRouter.get("/me", authenticateToken, getMe);
authRouter.post("/logout", logout);

// server/routes/leads.routes.ts
import { Router as Router2 } from "express";

// server/controllers/leads.controller.ts
var recommendLeadPriority = async (req, res) => {
  try {
    const { monthlyBill, sanctionLoad, roofAreaSqFt, buyingIntent, source, notes } = req.body;
    const bill = Number(monthlyBill) || 0;
    const load = Number(sanctionLoad) || 0;
    const roof = Number(roofAreaSqFt) || 0;
    const notesLower = (notes || "").toLowerCase();
    const intentLower = (buyingIntent || "").toLowerCase();
    const estKwFromBill = bill > 0 ? Math.round(bill / (8 * 120)) : 0;
    const estKw = Math.max(estKwFromBill, load);
    let recommendedPriority = "Medium";
    let explanation = "";
    let followUpTarget = "";
    let score = 60;
    if (bill >= 25e3 || load >= 20 || estKw >= 20 || notesLower.includes("urgent") || notesLower.includes("immediate quote") || notesLower.includes("factory") || notesLower.includes("hospital") || notesLower.includes("asap")) {
      recommendedPriority = "Urgent";
      explanation = `High-capacity installation (${estKw >= 20 ? estKw + " kW Commercial/Industrial scale" : "high energy bill \u20B9" + bill.toLocaleString("en-IN")}) requiring immediate executive attention.`;
      followUpTarget = "Urgent callback within 2 hours";
      score = 95;
    } else if (bill >= 1e4 && bill < 25e3 || load >= 10 && load < 20 || estKw >= 10 && estKw < 20 || intentLower.includes("immediate") && bill >= 8e3 || source === "Referral" || notesLower.includes("ready")) {
      recommendedPriority = "High";
      explanation = `Substantial energy consumption (\u20B9${bill.toLocaleString("en-IN")}/mo, ~${estKw} kW) with strong conversion probability.`;
      followUpTarget = "Same-day contact within 4 hours";
      score = 80;
    } else if (bill > 0 && bill < 3e3 && load < 3 || intentLower.includes("future") || intentLower.includes("budgetary") || notesLower.includes("under construction") || notesLower.includes("budget only") || notesLower.includes("next year")) {
      recommendedPriority = "Low";
      explanation = "Early-stage informational inquiry, lower consumption tier, or site under construction (timeline > 3 months).";
      followUpTarget = "Educational nurture & follow-up within 5 days";
      score = 30;
    } else {
      recommendedPriority = "Medium";
      const displayKw = Math.max(3, estKw || 3);
      explanation = `Standard residential rooftop system (~${displayKw} kW) eligible for PM Surya Ghar central government subsidy.`;
      followUpTarget = "Standard discovery call within 24\u201348 hours";
      score = 60;
    }
    return res.json({
      success: true,
      data: {
        recommendedPriority,
        explanation,
        followUpTarget,
        estimatedKw: estKw,
        score
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
var createLead = async (req, res) => {
  try {
    const l = req.body;
    if (!l.name || !l.name.trim()) {
      return res.status(400).json({ success: false, error: "Customer Name is mandatory" });
    }
    const cleanPhone = (l.phone || "").replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length !== 10) {
      return res.status(400).json({ success: false, error: "A valid 10-digit Mobile Number is mandatory" });
    }
    if (!l.pincode || !l.pincode.toString().trim()) {
      return res.status(400).json({ success: false, error: "Pincode is mandatory" });
    }
    if (cleanPhone.length >= 10) {
      const [existing] = await pool.query(
        'SELECT id, name, phone FROM leads WHERE REPLACE(REPLACE(REPLACE(phone, "-", ""), " ", ""), "+91", "") LIKE ? LIMIT 1',
        [`%${cleanPhone.slice(-10)}`]
      );
      if (existing && existing.length > 0) {
        return res.status(409).json({
          success: false,
          error: `Duplicate lead: A lead with phone ${l.phone} already exists (${existing[0].name} - ${existing[0].id})`,
          existingLead: existing[0]
        });
      }
    }
    let finalId = l.id || `LD-2026-${Date.now().toString().slice(-4)}`;
    const [existingId] = await pool.query("SELECT id FROM leads WHERE id = ? LIMIT 1", [finalId]);
    if (existingId && existingId.length > 0) {
      const [allIds] = await pool.query("SELECT id FROM leads WHERE id LIKE 'LD-2026-%'");
      let maxNum = 28;
      for (const row of allIds) {
        const match = row.id.match(/LD-2026-(\d+)/);
        if (match) {
          const n = parseInt(match[1], 10);
          if (n > maxNum) maxNum = n;
        }
      }
      finalId = `LD-2026-${String(maxNum + 1).padStart(3, "0")}`;
      l.id = finalId;
    }
    const customerType = l.customerType || l.customer_type || "Residential";
    const systemType = l.systemType || l.system_type || "On-Grid";
    let finalAssignedId = l.assignedToId;
    let finalAssignedName = l.assignedToName;
    if (!finalAssignedId || finalAssignedId === "auto" || !finalAssignedName) {
      try {
        const [execs] = await pool.query(`
          SELECT u.id, u.name, COUNT(l.id) as lead_count
          FROM user_accounts u
          LEFT JOIN leads l ON (l.assigned_to_id = u.id OR l.assigned_to_name = u.name) AND l.status != 'Lost'
          WHERE u.role = 'Sales Executive' AND u.is_active = 1
          GROUP BY u.id, u.name
          ORDER BY lead_count ASC, u.id ASC
          LIMIT 1
        `);
        if (execs && execs.length > 0) {
          finalAssignedId = execs[0].id;
          finalAssignedName = execs[0].name;
        } else {
          finalAssignedId = "EMP-06";
          finalAssignedName = "Vikram Mehta";
        }
      } catch {
        finalAssignedId = "EMP-06";
        finalAssignedName = "Vikram Mehta";
      }
    }
    l.assignedToId = finalAssignedId;
    l.assignedToName = finalAssignedName;
    await pool.query(
      `INSERT INTO leads (id, name, email, phone, city, state, address, pincode, source, status, priority, recommended_priority, priority_override_reason, buying_intent, assigned_to_id, assigned_to_name, monthly_bill, sanction_load, roof_area_sqft, roof_type, recommended_kw, estimated_budget, notes, customer_type, system_type, created_at, updated_at, last_contacted_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        l.id,
        l.name.trim(),
        l.email || null,
        cleanPhone,
        l.city || "",
        l.state || "",
        l.address || "",
        l.pincode.toString().trim(),
        l.source || "Website",
        l.status || "New",
        l.priority || "Medium",
        l.recommendedPriority || null,
        l.priorityOverrideReason || null,
        l.buyingIntent || null,
        finalAssignedId,
        finalAssignedName,
        l.monthlyBill || 0,
        l.sanctionLoad || 0,
        l.roofAreaSqFt || 0,
        l.roofType || null,
        l.recommendedKw || 0,
        l.estimatedBudget || 0,
        l.notes || "",
        customerType,
        systemType,
        l.createdAt || (/* @__PURE__ */ new Date()).toISOString(),
        l.updatedAt || (/* @__PURE__ */ new Date()).toISOString(),
        l.lastContactedAt || null
      ]
    );
    l.customerType = customerType;
    l.systemType = systemType;
    res.json({ success: true, lead: l });
  } catch (err) {
    console.error("Error creating lead:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};
var updateLead = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const fields = [];
    const values = [];
    if (updates.name !== void 0) {
      if (!updates.name.trim()) return res.status(400).json({ success: false, error: "Customer Name cannot be empty" });
      fields.push("name = ?");
      values.push(updates.name.trim());
    }
    if (updates.phone !== void 0) {
      const clean = updates.phone.replace(/\D/g, "");
      if (clean.length !== 10) return res.status(400).json({ success: false, error: "Mobile number must be 10 digits" });
      fields.push("phone = ?");
      values.push(clean);
    }
    if (updates.pincode !== void 0) {
      if (!updates.pincode.toString().trim()) return res.status(400).json({ success: false, error: "Pincode cannot be empty" });
      fields.push("pincode = ?");
      values.push(updates.pincode.toString().trim());
    }
    if (updates.status !== void 0) {
      fields.push("status = ?");
      values.push(updates.status);
    }
    if (updates.priority !== void 0) {
      fields.push("priority = ?");
      values.push(updates.priority);
    }
    if (updates.recommendedPriority !== void 0) {
      fields.push("recommended_priority = ?");
      values.push(updates.recommendedPriority);
    }
    if (updates.priorityOverrideReason !== void 0) {
      fields.push("priority_override_reason = ?");
      values.push(updates.priorityOverrideReason);
    }
    if (updates.customerType !== void 0 || updates.customer_type !== void 0) {
      fields.push("customer_type = ?");
      values.push(updates.customerType || updates.customer_type);
    }
    if (updates.systemType !== void 0 || updates.system_type !== void 0) {
      fields.push("system_type = ?");
      values.push(updates.systemType || updates.system_type);
    }
    if (updates.notes !== void 0) {
      fields.push("notes = ?");
      values.push(updates.notes);
    }
    if (updates.updatedAt !== void 0) {
      fields.push("updated_at = ?");
      values.push(updates.updatedAt);
    }
    if (updates.assignedToId !== void 0) {
      fields.push("assigned_to_id = ?");
      values.push(updates.assignedToId);
    }
    if (updates.assignedToName !== void 0) {
      fields.push("assigned_to_name = ?");
      values.push(updates.assignedToName);
    }
    if (fields.length > 0) {
      values.push(id);
      await pool.query(`UPDATE leads SET ${fields.join(", ")} WHERE id = ?`, values);
    }
    res.json({ success: true, id, updates });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
var deleteLead = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM leads WHERE id = ?", [id]);
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// server/routes/leads.routes.ts
var leadsRouter = Router2();
leadsRouter.get("/", authenticateToken, requireRole(["Sales Executive", "Sales Manager"]), async (_req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM leads ORDER BY created_at DESC");
    res.json({ success: true, leads: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
leadsRouter.post("/recommend-priority", authenticateToken, requireRole(["Sales Executive", "Sales Manager"]), recommendLeadPriority);
leadsRouter.post("/", authenticateToken, requireRole(["Sales Executive", "Sales Manager"]), createLead);
leadsRouter.put("/:id", authenticateToken, requireRole(["Sales Executive", "Sales Manager", "Survey Engineer", "Project Manager"]), updateLead);
leadsRouter.delete("/:id", authenticateToken, requireRole(["Sales Manager"]), deleteLead);

// server/routes/surveys.routes.ts
import { Router as Router3 } from "express";
var surveysRouter = Router3();
surveysRouter.get("/", authenticateToken, getSurveys);
surveysRouter.get("/:id", authenticateToken, getSurveyById);
surveysRouter.post("/", authenticateToken, requireRole(["Survey Engineer", "Sales Executive", "Sales Manager", "Project Manager", "Super Admin"]), createSurvey);
surveysRouter.put("/:id", authenticateToken, requireRole(["Survey Engineer", "Project Manager", "Super Admin"]), updateSurvey);
surveysRouter.put("/:id/draft", authenticateToken, requireRole(["Survey Engineer", "Project Manager", "Super Admin"]), updateSurvey);
surveysRouter.post("/:id/photos", authenticateToken, requireRole(["Survey Engineer", "Project Manager", "Super Admin"]), uploadSurveyPhoto);
surveysRouter.delete("/:id/photos/:photoId", authenticateToken, requireRole(["Survey Engineer", "Project Manager", "Super Admin"]), deleteSurveyPhoto);
surveysRouter.post("/:id/submit", authenticateToken, requireRole(["Survey Engineer", "Super Admin"]), submitSurveyForReview);
surveysRouter.post("/:id/review", authenticateToken, requireRole(["Project Manager", "Sales Manager", "Super Admin"]), reviewSurvey);
surveysRouter.post("/:id/reschedule", authenticateToken, requireRole(["Survey Engineer", "Project Manager", "Sales Manager", "Super Admin"]), rescheduleSurvey);
surveysRouter.delete("/:id", authenticateToken, requireRole(["Survey Engineer", "Project Manager", "Sales Manager", "Super Admin"]), deleteSurvey);

// server/routes/quotations.routes.ts
import { Router as Router4 } from "express";

// server/controllers/quotations.controller.ts
import path3 from "path";

// src/utils/quotationEngine.ts
var QUOTATION_CONFIG = {
  // Discount threshold requiring manager approval
  DISCOUNT_APPROVAL_THRESHOLD_INR: 15e3,
  MAX_DISCOUNT_PERCENT: 15,
  // max 15% discount allowed
  // Default Company Location (Karnataka / Tamil Nadu)
  DEFAULT_SUPPLIER_STATE: "Karnataka",
  DEFAULT_SUPPLIER_GSTIN: "29AABCS1429B1Z8",
  // Client-Configured Statutory Defaults:
  // - Solar Panels & Inverters: 5% GST
  // - Structure, Cables/BOS, Installation Services: 18% GST
  DEFAULT_GST_RATES: {
    PANELS: 5,
    INVERTER: 5,
    STRUCTURE: 18,
    BOS: 18,
    INSTALLATION: 18
  },
  // Standard HSN / SAC Codes
  DEFAULT_HSN_CODES: {
    PANELS: "8541",
    INVERTER: "8504",
    STRUCTURE: "7308",
    BOS: "8544",
    INSTALLATION: "9954"
  },
  // Legacy composite rate for backward compatibility
  COMPOSITE_GST_RATE: 13.8,
  // 70% goods @ 12% + 30% services @ 18%
  // Solar irradiance & financial defaults
  SPECIFIC_YIELD_KWH_PER_KWP: 1450,
  DEFAULT_TARIFF_INR: 8.2,
  // PM Surya Ghar Muft Bijli Yojana Central Subsidy Slabs (Residential Only)
  RESIDENTIAL_SUBSIDY: {
    SLAB_1KW_MAX: 3e4,
    SLAB_2KW_MAX: 6e4,
    SLAB_3KW_AND_ABOVE_MAX: 78e3
  }
};
function convertNumberToWords(amount) {
  const rounded = Math.round(Number(amount) || 0);
  if (rounded === 0) return "Rupees Zero Only";
  const units = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen"
  ];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  function convertHundreds(n) {
    let str = "";
    if (n >= 100) {
      str += units[Math.floor(n / 100)] + " Hundred ";
      n %= 100;
    }
    if (n >= 20) {
      str += tens[Math.floor(n / 10)] + (n % 10 ? " " + units[n % 10] : "");
    } else if (n > 0) {
      str += units[n];
    }
    return str.trim();
  }
  let words = "";
  let crore = Math.floor(rounded / 1e7);
  let remCrore = rounded % 1e7;
  let lakh = Math.floor(remCrore / 1e5);
  let remLakh = remCrore % 1e5;
  let thousand = Math.floor(remLakh / 1e3);
  let remThousand = remLakh % 1e3;
  if (crore > 0) words += convertHundreds(crore) + " Crore ";
  if (lakh > 0) words += convertHundreds(lakh) + " Lakh ";
  if (thousand > 0) words += convertHundreds(thousand) + " Thousand ";
  if (remThousand > 0) words += convertHundreds(remThousand);
  return `Rupees ${words.trim()} Only`;
}
function resolveTaxType(input) {
  if (input.taxType) return input.taxType;
  const supplier = (input.supplierState || QUOTATION_CONFIG.DEFAULT_SUPPLIER_STATE).toLowerCase().trim();
  const address = (input.customerAddress || "").toLowerCase();
  const customerState = (input.customerState || "").toLowerCase().trim();
  if (customerState && customerState !== supplier) {
    return "IGST";
  }
  if (supplier === "karnataka") {
    if (address.includes("tamil nadu") || address.includes("kerala") || address.includes("andhra") || address.includes("telangana") || address.includes("delhi")) {
      return "IGST";
    }
  } else if (supplier === "tamil nadu") {
    if (address.includes("karnataka") || address.includes("bengaluru") || address.includes("bangalore") || address.includes("kerala")) {
      return "IGST";
    }
  }
  return "CGST_SGST";
}
function calculateQuotation(input) {
  const capacityKw = Math.max(0.5, Number(input.systemCapacityKw) || 5);
  const tier = input.packageTier || "Premium Bifacial";
  const category = input.customerCategory || (capacityKw > 20 ? "Commercial" : "Residential");
  const roof = input.roofType || "RCC Flat";
  const tariff = input.customTariffPerKwh || QUOTATION_CONFIG.DEFAULT_TARIFF_INR;
  const isApproved = Boolean(input.isSurveyApproved);
  const taxMode = input.taxMode || "ITEMIZED";
  const taxType = resolveTaxType(input);
  let moduleWattageW = 550;
  let moduleBrand = "Waaree 550W Mono PERC Half-Cut Bifacial (ALMM Approved)";
  let modulePrice = 11500;
  if (tier === "Premium Bifacial") {
    moduleWattageW = 575;
    moduleBrand = "Jinko 575W Tiger Neo N-Type TOPCon Bifacial Module";
    modulePrice = 12800;
  } else if (tier === "Commercial Heavy Duty") {
    moduleWattageW = 550;
    moduleBrand = "Waaree 550W High-Efficiency Bifacial Mono PERC";
    modulePrice = 11200;
  }
  const panelCount = Math.ceil(capacityKw * 1e3 / moduleWattageW);
  const actualCapacityKwp = Number((panelCount * moduleWattageW / 1e3).toFixed(2));
  const panelTotal = panelCount * modulePrice;
  let inverterDesc = "";
  let inverterPrice = 0;
  let inverterBrand = "";
  if (capacityKw <= 3) {
    inverterDesc = "3 kW Single-Phase Grid-Tied Inverter with Dual MPPT and Cloud WiFi";
    inverterBrand = "Sungrow / Growatt 3K-1P";
    inverterPrice = 32e3;
  } else if (capacityKw <= 5) {
    inverterDesc = "5 kW Single/Three-Phase Dual-MPPT Inverter with WiFi & IP65";
    inverterBrand = "Sungrow SG5.0RT / Growatt";
    inverterPrice = 38500;
  } else if (capacityKw <= 10) {
    inverterDesc = "10 kW Three-Phase 415V Grid Inverter with Dual MPPT & DC Switch";
    inverterBrand = "Sungrow SG10RT 3-Phase";
    inverterPrice = 68e3;
  } else if (capacityKw <= 25) {
    inverterDesc = `${capacityKw} kW Three-Phase Dual-MPPT Commercial Inverter with Cloud Monitoring`;
    inverterBrand = "Sungrow SG20RT / Growatt 25K";
    inverterPrice = 115e3;
  } else {
    inverterDesc = `${capacityKw} kW Commercial Multi-MPPT High Yield Solar Inverter`;
    inverterBrand = "Growatt MAX / Sungrow Commercial";
    inverterPrice = Math.round(capacityKw * 4300);
  }
  let structureRatePerKw = 2500;
  let structureDesc = "Hot Dip Galvanized (HDG) 80-micron elevated structure (15\xB0 Tilt)";
  if (roof === "Metal Sheet") {
    structureRatePerKw = 1900;
    structureDesc = "Anodized Aluminum AL6005-T5 Mini-Rail structure with EPDM rubber gaskets";
  } else if (tier === "Premium Bifacial") {
    structureRatePerKw = 2800;
    structureDesc = "Heavy Duty 80-micron HDG elevated mounting structure with SS304 fasteners";
  }
  const structureTotal = Math.round(capacityKw * structureRatePerKw);
  const bosRatePerKw = tier === "Premium Bifacial" ? 4800 : 4500;
  const bosTotal = Math.round(capacityKw * bosRatePerKw);
  const bosDesc = "ACDB & DCDB with Type-II SPDs, Polycab Solar DC/AC Cables, Chemical Earthing Pits & ESE Lightning Arrester";
  const installRatePerKw = tier === "Premium Bifacial" ? 4200 : 4e3;
  const installTotal = Math.round(capacityKw * installRatePerKw);
  const installDesc = "Complete civil mounting, cable routing in conduits, safety labeling, DISCOM net-metering liaison and synchronization";
  let rawItems = [];
  if (input.customItems && input.customItems.length > 0) {
    rawItems = input.customItems.map((ci, idx) => {
      const catLower = (ci.category || ci.description || "").toLowerCase();
      const isFivePercent = catLower.includes("solar") || catLower.includes("panel") || catLower.includes("inverter") || catLower.includes("module");
      const defaultGst = isFivePercent ? 5 : 18;
      const gstRate = ci.gstRate !== void 0 ? ci.gstRate : defaultGst;
      const hsn = ci.hsnSacCode || (isFivePercent ? "8541" : catLower.includes("cable") || catLower.includes("wire") ? "8544" : "7308");
      const qty = Number(ci.quantity) || 1;
      const rate = Number(ci.unitPrice !== void 0 ? ci.unitPrice : ci.estimated_unit_cost) || 0;
      const gross = Math.round(qty * rate);
      const spec = ci.specification || ci.technical_specification || "";
      const make = ci.make || ci.brand_make || "";
      const makeModel = ci.makeModel || `${make} ${spec}`.trim() || "Standard";
      return {
        id: ci.id || `QI-${idx + 1}`,
        category: ci.category || "General",
        description: ci.description || ci.item_name || ci.category,
        specification: spec,
        make,
        makeModel,
        hsnSacCode: hsn,
        quantity: qty,
        unit: ci.unit || "Nos",
        unitPrice: rate,
        grossAmount: gross,
        defaultGstRate: gstRate,
        warrantyPeriod: ci.warrantyPeriod || (isFivePercent ? "10-Yr Replacement / 25-Yr Performance" : "5-Yr Comprehensive Warranty")
      };
    });
  } else {
    rawItems = [
      {
        id: "QI-1",
        category: "Panels",
        description: `${panelCount} \xD7 ${moduleBrand}`,
        specification: `${moduleWattageW}W Mono PERC Bifacial`,
        make: moduleBrand.split(" ")[0] || "Waaree",
        makeModel: moduleBrand,
        hsnSacCode: QUOTATION_CONFIG.DEFAULT_HSN_CODES.PANELS,
        quantity: panelCount,
        unit: "Nos",
        unitPrice: modulePrice,
        grossAmount: panelTotal,
        defaultGstRate: QUOTATION_CONFIG.DEFAULT_GST_RATES.PANELS,
        // 5%
        warrantyPeriod: "12-Yr Product / 25-Yr Linear Performance"
      },
      {
        id: "QI-2",
        category: "Inverter",
        description: inverterDesc,
        specification: `${capacityKw} kW Grid-Tied Inverter`,
        make: inverterBrand.split(" ")[0] || "Sungrow",
        makeModel: inverterBrand,
        hsnSacCode: QUOTATION_CONFIG.DEFAULT_HSN_CODES.INVERTER,
        quantity: 1,
        unit: "Unit",
        unitPrice: inverterPrice,
        grossAmount: inverterPrice,
        defaultGstRate: QUOTATION_CONFIG.DEFAULT_GST_RATES.INVERTER,
        // 5%
        warrantyPeriod: "10-Yr Replacement Warranty"
      },
      {
        id: "QI-3",
        category: "Structure",
        description: structureDesc,
        specification: "Pre-Galvanized / Mini Rail",
        make: "Reputed",
        makeModel: "AB Solar HDG Custom Fabricated",
        hsnSacCode: QUOTATION_CONFIG.DEFAULT_HSN_CODES.STRUCTURE,
        quantity: capacityKw,
        unit: "kW",
        unitPrice: structureRatePerKw,
        grossAmount: structureTotal,
        defaultGstRate: QUOTATION_CONFIG.DEFAULT_GST_RATES.STRUCTURE,
        // 18%
        warrantyPeriod: "10-Yr Anti-Corrosion Warranty"
      },
      {
        id: "QI-4",
        category: "Protection & BOS",
        description: bosDesc,
        specification: "63A DCDB & ACDB with SPDs",
        make: "Schneider / L&T / Polycab",
        makeModel: "Schneider / L&T / Polycab",
        hsnSacCode: QUOTATION_CONFIG.DEFAULT_HSN_CODES.BOS,
        quantity: 1,
        unit: "Set",
        unitPrice: bosTotal,
        grossAmount: bosTotal,
        defaultGstRate: QUOTATION_CONFIG.DEFAULT_GST_RATES.BOS,
        // 18%
        warrantyPeriod: "5-Yr Comprehensive Warranty"
      },
      {
        id: "QI-5",
        category: "Installation & Commissioning",
        description: installDesc,
        specification: "Civil mounting & liaison",
        make: "AB Energy Solutions",
        makeModel: "AB Energy Solutions Certified EPC Crew",
        hsnSacCode: QUOTATION_CONFIG.DEFAULT_HSN_CODES.INSTALLATION,
        quantity: 1,
        unit: "Turnkey",
        unitPrice: installTotal,
        grossAmount: installTotal,
        defaultGstRate: QUOTATION_CONFIG.DEFAULT_GST_RATES.INSTALLATION,
        // 18%
        warrantyPeriod: "5-Yr Comprehensive Workmanship & O&M"
      }
    ];
  }
  const subtotal = rawItems.reduce((sum, item) => sum + item.grossAmount, 0);
  let rawDiscount = Math.max(0, Number(input.discountAmount) || 0);
  const maxAllowedDiscount = Math.round(subtotal * (QUOTATION_CONFIG.MAX_DISCOUNT_PERCENT / 100));
  if (rawDiscount > maxAllowedDiscount) {
    rawDiscount = maxAllowedDiscount;
  }
  const requiresApproval = rawDiscount > QUOTATION_CONFIG.DISCOUNT_APPROVAL_THRESHOLD_INR;
  const approvalStatus = requiresApproval ? "Pending_Approval" : "Approved";
  const taxableAmount = Math.max(0, subtotal - rawDiscount);
  let allocatedDiscountTotal = 0;
  const items = rawItems.map((raw, idx) => {
    let lineDiscount = 0;
    if (subtotal > 0 && rawDiscount > 0) {
      if (idx === rawItems.length - 1) {
        lineDiscount = rawDiscount - allocatedDiscountTotal;
      } else {
        lineDiscount = Math.round(raw.grossAmount / subtotal * rawDiscount);
        allocatedDiscountTotal += lineDiscount;
      }
    }
    const lineTaxable = Math.max(0, raw.grossAmount - lineDiscount);
    const gstRate = taxMode === "COMPOSITE" ? QUOTATION_CONFIG.COMPOSITE_GST_RATE : raw.defaultGstRate;
    const lineTax = Math.round(lineTaxable * (gstRate / 100));
    let cgstRate = 0;
    let sgstRate = 0;
    let igstRate = 0;
    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;
    if (taxType === "IGST") {
      igstRate = gstRate;
      igstAmount = lineTax;
    } else {
      cgstRate = Number((gstRate / 2).toFixed(2));
      sgstRate = Number((gstRate / 2).toFixed(2));
      cgstAmount = Math.round(lineTax / 2);
      sgstAmount = lineTax - cgstAmount;
    }
    return {
      id: raw.id,
      category: raw.category,
      description: raw.description,
      specification: raw.specification,
      make: raw.make,
      makeModel: raw.makeModel,
      hsnSacCode: raw.hsnSacCode,
      quantity: raw.quantity,
      unit: raw.unit,
      unitPrice: raw.unitPrice,
      grossAmount: raw.grossAmount,
      discountAmount: lineDiscount,
      taxableAmount: lineTaxable,
      gstRate,
      taxType,
      cgstRate,
      sgstRate,
      igstRate,
      cgstAmount,
      sgstAmount,
      igstAmount,
      taxAmount: lineTax,
      totalPrice: lineTaxable + lineTax,
      warrantyPeriod: raw.warrantyPeriod
    };
  });
  const totalCgstAmount = items.reduce((sum, item) => sum + item.cgstAmount, 0);
  const totalSgstAmount = items.reduce((sum, item) => sum + item.sgstAmount, 0);
  const totalIgstAmount = items.reduce((sum, item) => sum + item.igstAmount, 0);
  const totalGstAmount = totalCgstAmount + totalSgstAmount + totalIgstAmount;
  const finalContractAmount = taxableAmount + totalGstAmount;
  const effectiveGstRate = taxableAmount > 0 ? Number((totalGstAmount / taxableAmount * 100).toFixed(2)) : 0;
  const amountInWords = convertNumberToWords(finalContractAmount);
  let subsidyEligible = false;
  let subsidyAmount = 0;
  let subsidyNotes = "";
  if (category === "Residential") {
    subsidyEligible = true;
    if (capacityKw <= 1) {
      subsidyAmount = QUOTATION_CONFIG.RESIDENTIAL_SUBSIDY.SLAB_1KW_MAX;
      subsidyNotes = "PM Surya Ghar: \u20B930,000 for 1 kW residential rooftop";
    } else if (capacityKw <= 2) {
      subsidyAmount = QUOTATION_CONFIG.RESIDENTIAL_SUBSIDY.SLAB_2KW_MAX;
      subsidyNotes = "PM Surya Ghar: \u20B960,000 for 2 kW residential rooftop";
    } else {
      subsidyAmount = QUOTATION_CONFIG.RESIDENTIAL_SUBSIDY.SLAB_3KW_AND_ABOVE_MAX;
      subsidyNotes = "PM Surya Ghar: \u20B978,000 maximum capped central subsidy for \u2265 3 kW";
    }
  } else {
    subsidyEligible = false;
    subsidyAmount = 0;
    subsidyNotes = "Commercial / Industrial / Institutional installations are not eligible for PM Surya Ghar residential central subsidy.";
  }
  const indicativeNetCustomerCost = Math.max(0, finalContractAmount - subsidyAmount);
  const annualGenerationKwh = Math.round(actualCapacityKwp * QUOTATION_CONFIG.SPECIFIC_YIELD_KWH_PER_KWP);
  const annualSavingsInr = Math.round(annualGenerationKwh * tariff);
  const lifetimeSavings25Yr = Math.round(annualSavingsInr * 25);
  const simplePaybackYears = annualSavingsInr > 0 ? Number((indicativeNetCustomerCost / annualSavingsInr).toFixed(1)) : 0;
  const advanceAmount = Math.round(finalContractAmount * 0.4);
  const dispatchAmount = Math.round(finalContractAmount * 0.5);
  const handoverAmount = finalContractAmount - advanceAmount - dispatchAmount;
  return {
    proposalType: isApproved ? "Final_Technical" : "Preliminary",
    packageTier: tier,
    systemCapacityKw: capacityKw,
    actualCapacityKwp,
    panelCount,
    moduleWattageW,
    inverterDescription: inverterDesc,
    items,
    subtotal,
    discountAmount: rawDiscount,
    requiresApproval,
    approvalStatus,
    taxableAmount,
    taxMode,
    taxType,
    gstRate: effectiveGstRate,
    cgstAmount: totalCgstAmount,
    sgstAmount: totalSgstAmount,
    igstAmount: totalIgstAmount,
    gstAmount: totalGstAmount,
    finalContractAmount,
    amountInWords,
    subsidyEligible,
    subsidyAmount,
    subsidyNotes,
    indicativeNetCustomerCost,
    annualGenerationKwh,
    annualSavingsInr,
    lifetimeSavings25Yr,
    simplePaybackYears,
    tariffAssumedPerKwh: tariff,
    milestones: {
      advanceBooking: {
        percentage: 40,
        amount: advanceAmount,
        description: "40% Advance on project booking and detailed engineering approval"
      },
      materialDispatch: {
        percentage: 50,
        amount: dispatchAmount,
        description: "50% on material dispatch and arrival at installation site"
      },
      finalHandover: {
        percentage: 10,
        amount: handoverAmount,
        description: "10% upon DISCOM net-metering synchronization and commissioning handover"
      }
    },
    terms: [
      "40% Advance on project booking and detailed engineering approval.",
      "50% upon material dispatch against warehouse delivery challan.",
      "10% upon successful DISCOM net-metering synchronization and commissioning sign-off.",
      "Quotation valid for 14 calendar days from date of issuance.",
      "Central subsidy under PM Surya Ghar is credited directly by the Government to the customer bank account post DISCOM inspection via DBT.",
      "Standard 25-Year linear performance warranty on Tier-1 ALMM solar panels."
    ],
    warranties: {
      panels: "12-Year Product Workmanship / 25-Year 80% Linear Power Output",
      inverter: "10-Year Comprehensive Replacement Warranty",
      structure: "10-Year Corrosion-Free Galvanization Warranty",
      workmanship: "5-Year Comprehensive EPC Workmanship & Operations & Maintenance"
    }
  };
}

// server/services/pdf-generator.ts
import PDFDocument from "pdfkit";
import fs2 from "fs";
import path2 from "path";
async function generateProposalPdf(data) {
  const proposalsDir = path2.join(process.cwd(), "uploads", "proposals");
  if (!fs2.existsSync(proposalsDir)) {
    fs2.mkdirSync(proposalsDir, { recursive: true });
  }
  const sanitizedQuoteNo = data.quotationNumber.replace(/[^a-zA-Z0-9_-]/g, "_");
  const fileName = `Quotation_${sanitizedQuoteNo}.pdf`;
  const filePath = path2.join(proposalsDir, fileName);
  const fileUrl = `/uploads/proposals/${fileName}`;
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margin: 40,
        bufferPages: true,
        info: {
          Title: `AB Energy Solutions - Quotation ${data.quotationNumber}`,
          Author: "AB Energy Solutions",
          Subject: `${data.systemCapacityKw} kW Grid-Connected Rooftop Solar Power System`
        }
      });
      const writeStream = fs2.createWriteStream(filePath);
      doc.pipe(writeStream);
      const logoPath = path2.join(process.cwd(), "public", "logo.png");
      const coverPhotoPath = path2.join(process.cwd(), "public", "solar-roof-cover.jpg");
      const hasLogo = fs2.existsSync(logoPath);
      const hasCoverPhoto = fs2.existsSync(coverPhotoPath);
      const headingNavy = "#0F172A";
      const bodyDark = "#1E293B";
      const textMuted = "#475569";
      const greenAccent = "#059669";
      const greenLight = "#ECFDF5";
      const borderSlate = "#CBD5E1";
      const bgLight = "#F8FAFC";
      const drawHeaderBanner = (pageTitle) => {
        if (hasLogo) {
          doc.save();
          doc.opacity(0.035);
          doc.image(logoPath, 127, 260, { width: 340 });
          doc.restore();
        }
        doc.font("Helvetica-Bold").fontSize(9).fillColor(headingNavy).text("AB ENERGY SOLUTIONS", 40, 26);
        doc.font("Helvetica").fontSize(7.5).fillColor(textMuted).text("Turnkey Solar EPC & Engineering", 40, 37);
        doc.font("Helvetica-Bold").fontSize(8).fillColor(greenAccent).text(`Quotation: ${data.quotationNumber}`, 200, 26, { width: 195, align: "center" });
        if (pageTitle) {
          doc.font("Helvetica-Oblique").fontSize(7).fillColor(textMuted).text(pageTitle, 200, 37, { width: 195, align: "center" });
        }
        doc.font("Helvetica-Bold").fontSize(8.5).fillColor(headingNavy).text("GST: 33FSQPA3244H1ZU", 40, 26, { align: "right", width: 515 });
        doc.font("Helvetica").fontSize(7.5).fillColor(textMuted).text("CIN/MSME Registered", 40, 37, { align: "right", width: 515 });
        doc.moveTo(40, 48).lineTo(555, 48).lineWidth(0.5).strokeColor("#E2E8F0").stroke();
      };
      const drawFooter = (pageNum, totalPages) => {
        doc.moveTo(40, 785).lineTo(555, 785).lineWidth(0.5).strokeColor("#E2E8F0").stroke();
        doc.font("Helvetica").fontSize(8).fillColor(textMuted).text(`AB Energy Solutions  \u2022  Turnkey Solar EPC & Engineering  \u2022  Page ${pageNum} of ${totalPages}`, 40, 792, { align: "center", width: 515 });
      };
      if (hasLogo) {
        doc.image(logoPath, 40, 28, { width: 125, height: 70, fit: [125, 70] });
      } else {
        doc.font("Helvetica-Bold").fontSize(16).fillColor(headingNavy).text("AB ENERGY SOLUTIONS", 40, 35);
      }
      doc.font("Helvetica-Bold").fontSize(10).fillColor(headingNavy).text("GST: 33FSQPA3244H1ZU", 40, 35, { align: "right", width: 515 });
      doc.font("Helvetica").fontSize(8.5).fillColor(textMuted).text("Solar EPC \u2022 Electrical Infrastructure \u2022 O&M", 40, 49, { align: "right", width: 515 });
      doc.font("Helvetica-Bold").fontSize(8).fillColor(greenAccent).text("TNEB C-Licence Certified Enterprise", 40, 62, { align: "right", width: 515 });
      doc.moveTo(40, 105).lineTo(555, 105).lineWidth(0.75).strokeColor("#E2E8F0").stroke();
      doc.font("Helvetica-Bold").fontSize(15).fillColor(headingNavy).text(`Quotation for ${data.systemCapacityKw} kW Grid-Connected Rooftop Solar Power System`, 40, 118, { align: "center", width: 515 });
      doc.font("Helvetica").fontSize(9).fillColor(greenAccent).text("Turnkey Engineering, Procurement, Installation & Commissioning Proposal", 40, 137, { align: "center", width: 515 });
      const formattedDate = new Date(data.createdAt || Date.now()).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      });
      doc.font("Helvetica-Bold").fontSize(9).fillColor(headingNavy).text(`Quotation No.: ${data.quotationNumber}`, 45, 154);
      doc.font("Helvetica").fontSize(8.5).fillColor(textMuted).text(`Package Tier: ${data.packageTier || "Premium Tier-1"}`, 210, 154, { width: 175, align: "center" });
      doc.font("Helvetica-Bold").fontSize(9).fillColor(headingNavy).text(`Date: ${formattedDate}`, 40, 154, { align: "right", width: 515 });
      if (hasCoverPhoto) {
        doc.image(coverPhotoPath, 40, 172, { width: 515, height: 265, fit: [515, 265], align: "center" });
      } else {
        doc.rect(40, 172, 515, 265).fillAndStroke(bgLight, borderSlate);
        doc.font("Helvetica-Bold").fontSize(14).fillColor("#64748B").text("Grid-Connected Solar Rooftop EPC System", 40, 290, { align: "center", width: 515 });
      }
      const custBoxY = 452;
      doc.rect(40, custBoxY, 515, 112).fillAndStroke(bgLight, borderSlate);
      doc.rect(40, custBoxY, 515, 24).fillAndStroke("#F1F5F9", borderSlate);
      doc.font("Helvetica-Bold").fontSize(9.5).fillColor(headingNavy).text("CUSTOMER DETAILS", 55, custBoxY + 7);
      doc.font("Helvetica").fontSize(8.5).fillColor(bodyDark);
      doc.text(`Client Name: `, 55, custBoxY + 32, { continued: true }).font("Helvetica-Bold").text(data.leadName);
      doc.font("Helvetica").text(`Service Number: `, 55, custBoxY + 50, { continued: true }).font("Helvetica-Bold").text(`045310081264 / ${data.systemCapacityKw}KWp`);
      doc.font("Helvetica").text(`Quoted Capacity: `, 55, custBoxY + 68, { continued: true }).font("Helvetica-Bold").text(`${data.systemCapacityKw} kW On-Grid Solar`);
      doc.font("Helvetica").text(`Proposal Type: `, 55, custBoxY + 86, { continued: true }).font("Helvetica-Bold").text(`${data.proposalType || "Grid-Tied Commercial/Residential"}`);
      doc.font("Helvetica").text(`Phone: `, 300, custBoxY + 32, { continued: true }).font("Helvetica-Bold").text(data.customerPhone || "N/A");
      doc.font("Helvetica").text(`Site Address: `, 300, custBoxY + 50);
      doc.font("Helvetica-Bold").text(data.customerAddress || "West Rajapalayam, P.N palayam, TN", 300, custBoxY + 62, { width: 240 });
      const metricY = 580;
      const metricW = 165;
      const metrics = [
        { label: "Plant Capacity", val: `${data.systemCapacityKw} kW On-Grid` },
        { label: "Estimated Annual Yield", val: `~${Math.round(data.annualGenerationKwh || data.systemCapacityKw * 1500).toLocaleString("en-IN")} Units` },
        { label: "Module Performance", val: "25-30 Years Tier-1" }
      ];
      metrics.forEach((m, idx) => {
        const mX = 40 + idx * 175;
        doc.rect(mX, metricY, metricW, 46).fillAndStroke("#FFFFFF", borderSlate);
        doc.font("Helvetica").fontSize(7.5).fillColor(textMuted).text(m.label, mX + 8, metricY + 8);
        doc.font("Helvetica-Bold").fontSize(10).fillColor(greenAccent).text(m.val, mX + 8, metricY + 24);
      });
      doc.addPage();
      drawHeaderBanner("Corporate Profile & Executive Letter");
      let p2Y = 60;
      doc.font("Helvetica-Bold").fontSize(10).fillColor(headingNavy).text(`Subject: Proposal for Supply, Installation, Testing & Commissioning of ${data.systemCapacityKw} kW Grid-Connected Rooftop Solar Power System`, 40, p2Y, { width: 515, lineGap: 3 });
      p2Y += 32;
      doc.font("Helvetica").fontSize(9).fillColor(bodyDark).text("Dear Sir,", 40, p2Y);
      p2Y += 16;
      doc.font("Helvetica").fontSize(9).fillColor(bodyDark).text(
        `Thank you for giving us the opportunity to submit our quotation for your ${data.systemCapacityKw} kW Solar Rooftop Project. We are pleased to offer our professional turnkey services as detailed below.

The quotation includes the complete supply, installation, testing, and commissioning of a Grid-Connected Solar Rooftop System.`,
        40,
        p2Y,
        { width: 515, lineGap: 3.5 }
      );
      p2Y += 56;
      doc.font("Helvetica-Bold").fontSize(11).fillColor(headingNavy).text("ABOUT AB ENERGY SOLUTION", 40, p2Y);
      p2Y += 20;
      doc.font("Helvetica").fontSize(9).fillColor("#334155").text(
        "AB Energy Solution is a trusted Solar EPC & Electrical Engineering Company specializing in Project Management Consultancy (PMC), Owner's Engineer Services, Solar EPC, Installation, Testing & Commissioning (I&C), HT/LT Electrical Works, and Solar Material Supply.\n\nWith 12+ years of industry experience, we have successfully completed 50+ Solar & Electrical Projects across Residential, Commercial, Industrial, and Agricultural sectors. Our team includes TNEB C Licence Certified Engineers and experienced professionals dedicated to delivering projects with the highest standards of Quality, Safety, and On-Time Delivery.\n\nWe provide complete end-to-end solar solutions, from Site Survey, Design, Engineering, Procurement, Installation, Testing & Commissioning to Net Metering, CEIG Documentation, and Annual Maintenance (O&M).",
        40,
        p2Y,
        { width: 515, lineGap: 4, align: "justify" }
      );
      p2Y += 160;
      doc.rect(40, p2Y, 515, 68).fillAndStroke(bgLight, borderSlate);
      doc.font("Helvetica-Bold").fontSize(9).fillColor(headingNavy).text("Quality & Compliance Assurance", 55, p2Y + 12);
      doc.font("Helvetica").fontSize(8.5).fillColor(textMuted).text(
        "All engineering designs, structural fabrications, module installations, and electrical grid synchronizations are performed strictly complying with MNRE standards, CEA technical regulations, DISCOM grid codes, and TANGEDCO net-metering protocols.",
        55,
        p2Y + 28,
        { width: 485, lineGap: 2.5 }
      );
      doc.addPage();
      drawHeaderBanner("Services, Advantages & Corporate Vision");
      let p3Y = 60;
      doc.font("Helvetica-Bold").fontSize(11).fillColor(headingNavy).text("OUR SERVICES", 40, p3Y);
      p3Y += 20;
      const servicesCol1 = [
        "Solar Rooftop EPC Projects",
        "Ground Mounted Solar Power Plants",
        "Project Management Consultancy (PMC)",
        "Owner's Engineer Services",
        "Installation, Testing & Commissioning (I&C)",
        "Solar Water Pump Systems"
      ];
      const servicesCol2 = [
        "HT & LT Electrical Works",
        "Transmission Line & Pole Yard Works",
        "Net Metering & CEIG Approval Support",
        "Operation & Maintenance (O&M)",
        "Solar Material Supply"
      ];
      let sY1 = p3Y;
      servicesCol1.forEach((srv) => {
        doc.font("Helvetica-Bold").fontSize(8.5).fillColor(greenAccent).text("\u2022", 48, sY1);
        doc.font("Helvetica").fontSize(8.5).fillColor(bodyDark).text(`  ${srv}`, 58, sY1);
        sY1 += 18;
      });
      let sY2 = p3Y;
      servicesCol2.forEach((srv) => {
        doc.font("Helvetica-Bold").fontSize(8.5).fillColor(greenAccent).text("\u2022", 300, sY2);
        doc.font("Helvetica").fontSize(8.5).fillColor(bodyDark).text(`  ${srv}`, 310, sY2);
        sY2 += 18;
      });
      p3Y = Math.max(sY1, sY2) + 24;
      doc.font("Helvetica-Bold").fontSize(11).fillColor(headingNavy).text("WHY CHOOSE AB ENERGY SOLUTION?", 40, p3Y);
      p3Y += 20;
      const whyCol1 = [
        "12+ Years of Industry Experience",
        "50+ Successfully Completed Projects",
        "TNEB C Licence Certified Engineers",
        "Quality Workmanship & Safety Standards"
      ];
      const whyCol2 = [
        "Professional Project Management",
        "On-Time Project Delivery",
        "Transparent Communication",
        "Reliable After-Sales Support"
      ];
      let wY1 = p3Y;
      whyCol1.forEach((item) => {
        doc.font("Helvetica-Bold").fontSize(9).fillColor(greenAccent).text("\u2714", 48, wY1);
        doc.font("Helvetica").fontSize(8.5).fillColor(bodyDark).text(`   ${item}`, 62, wY1);
        wY1 += 18;
      });
      let wY2 = p3Y;
      whyCol2.forEach((item) => {
        doc.font("Helvetica-Bold").fontSize(9).fillColor(greenAccent).text("\u2714", 300, wY2);
        doc.font("Helvetica").fontSize(8.5).fillColor(bodyDark).text(`   ${item}`, 314, wY2);
        wY2 += 18;
      });
      p3Y = Math.max(wY1, wY2) + 28;
      doc.rect(40, p3Y, 515, 80).fillAndStroke(bgLight, borderSlate);
      doc.font("Helvetica-Bold").fontSize(9.5).fillColor(headingNavy).text("Our Commitment", 55, p3Y + 14);
      doc.font("Helvetica").fontSize(8.5).fillColor(bodyDark).text("Quality  \u2022  Safety  \u2022  Innovation  \u2022  Integrity  \u2022  Customer Satisfaction", 55, p3Y + 28);
      doc.font("Helvetica-Bold").fontSize(9.5).fillColor(headingNavy).text("Our Vision", 55, p3Y + 46);
      doc.font("Helvetica-Oblique").fontSize(8).fillColor(textMuted).text(
        '"To deliver sustainable, reliable, and high-quality solar energy solutions that create long-term value for our customers and contribute to a greener future."',
        55,
        p3Y + 60,
        { width: 485 }
      );
      doc.addPage();
      drawHeaderBanner("Technical Scope of Work & Bill of Materials");
      let p4Y = 60;
      doc.font("Helvetica-Bold").fontSize(11).fillColor(headingNavy).text("Scope of Work", 40, p4Y);
      p4Y += 16;
      doc.font("Helvetica").fontSize(8.5).fillColor(bodyDark).text("We will execute the complete following turnkey EPC activities:", 40, p4Y);
      p4Y += 15;
      const scopeCol1 = ["Site Survey", "Engineering Support", "Supply of Material"];
      const scopeCol2 = ["Complete Installation", "Testing & Commissioning", "Service Support"];
      let scY1 = p4Y;
      scopeCol1.forEach((sc) => {
        doc.font("Helvetica-Bold").fontSize(8).fillColor(greenAccent).text("\u2022", 48, scY1);
        doc.font("Helvetica").fontSize(8.5).fillColor(bodyDark).text(`   ${sc}`, 58, scY1);
        scY1 += 14;
      });
      let scY2 = p4Y;
      scopeCol2.forEach((sc) => {
        doc.font("Helvetica-Bold").fontSize(8).fillColor(greenAccent).text("\u2022", 300, scY2);
        doc.font("Helvetica").fontSize(8.5).fillColor(bodyDark).text(`   ${sc}`, 310, scY2);
        scY2 += 14;
      });
      p4Y = Math.max(scY1, scY2) + 20;
      doc.font("Helvetica-Bold").fontSize(11).fillColor(headingNavy).text("Bill Of Materials", 40, p4Y);
      p4Y += 16;
      const colX = [40, 75, 185, 360, 455, 500];
      const colW = [35, 110, 175, 95, 45, 55];
      const tableW = 515;
      const drawBOMTableHeader = (y, isContinued = false) => {
        doc.rect(40, y, tableW, 20).fillAndStroke("#0F172A", "#0F172A");
        doc.font("Helvetica-Bold").fontSize(7.5).fillColor("#FFFFFF");
        doc.text("S.NO", colX[0], y + 6, { width: colW[0], align: "center" });
        doc.text(isContinued ? "MATERIALS (Contd.)" : "MATERIALS", colX[1], y + 6, { width: colW[1], align: "left" });
        doc.text("SPECIFICATION", colX[2], y + 6, { width: colW[2], align: "left" });
        doc.text("MAKE", colX[3], y + 6, { width: colW[3], align: "left" });
        doc.text("UNITS", colX[4], y + 6, { width: colW[4], align: "center" });
        doc.text("QUANTITY", colX[5], y + 6, { width: colW[5], align: "center" });
      };
      drawBOMTableHeader(p4Y);
      p4Y += 20;
      const bomItems = data.items && data.items.length > 0 ? data.items : [];
      bomItems.forEach((item, idx) => {
        const materialName = item.category || item.description || "Solar Component";
        const spec = item.specification || item.description || item.makeModel || "Standard";
        const make = item.make || item.makeModel?.split(" ")[0] || "Reputed Tier-1";
        const unit = item.unit || "Nos";
        const qty = item.quantity || 1;
        const rowHeight = 19;
        if (p4Y + rowHeight > 730) {
          doc.addPage();
          drawHeaderBanner("Bill of Materials (Continued)");
          p4Y = 60;
          drawBOMTableHeader(p4Y, true);
          p4Y += 20;
        }
        const rowBg = idx % 2 === 0 ? "#FFFFFF" : "#F8FAFC";
        doc.rect(40, p4Y, tableW, rowHeight).fillAndStroke(rowBg, "#CBD5E1");
        doc.font("Helvetica").fontSize(7.5).fillColor(bodyDark);
        doc.text(String(idx + 1), colX[0], p4Y + 5, { width: colW[0], align: "center" });
        doc.font("Helvetica-Bold").text(materialName, colX[1], p4Y + 5, { width: colW[1], ellipsis: true });
        doc.font("Helvetica").text(spec, colX[2], p4Y + 5, { width: colW[2], ellipsis: true });
        doc.text(make, colX[3], p4Y + 5, { width: colW[3], ellipsis: true });
        doc.text(unit, colX[4], p4Y + 5, { width: colW[4], align: "center" });
        doc.font("Helvetica-Bold").text(String(qty), colX[5], p4Y + 5, { width: colW[5], align: "center" });
        p4Y += rowHeight;
      });
      p4Y += 12;
      if (p4Y + 36 > 730) {
        doc.addPage();
        drawHeaderBanner("Technical Compliance");
        p4Y = 60;
      }
      doc.rect(40, p4Y, tableW, 28).fillAndStroke("#FEF3C7", "#F59E0B");
      doc.font("Helvetica-Bold").fontSize(7.5).fillColor("#92400E").text("Note: As this project is proposed under the Government Subsidy Scheme, all supplied solar modules must comply with the Domestic Content Requirement (DCR) guidelines.", 48, p4Y + 9, { width: 495 });
      doc.addPage();
      drawHeaderBanner("Client Scope, Features, Warranty & Commercials");
      let p5Y = 60;
      doc.font("Helvetica-Bold").fontSize(11).fillColor(headingNavy).text("Client Scope", 40, p5Y);
      p5Y += 16;
      const clientScopeCol1 = [
        "Provide a shadow-free installation area.",
        "Minor civil works, if required.",
        "Statutory charges for Bi-Directional Net Meter."
      ];
      const clientScopeCol2 = [
        "Non-statutory charges related to Net Metering.",
        "Additional charges for elevated structures (if applicable).",
        "SIM card for the Wi-Fi monitoring dongle / APFC."
      ];
      let csY1 = p5Y;
      clientScopeCol1.forEach((cs) => {
        doc.font("Helvetica-Bold").fontSize(8.5).fillColor(greenAccent).text("\u27A2", 48, csY1);
        doc.font("Helvetica").fontSize(8.5).fillColor(bodyDark).text(`   ${cs}`, 58, csY1);
        csY1 += 15;
      });
      let csY2 = p5Y;
      clientScopeCol2.forEach((cs) => {
        doc.font("Helvetica-Bold").fontSize(8.5).fillColor(greenAccent).text("\u27A2", 300, csY2);
        doc.font("Helvetica").fontSize(8.5).fillColor(bodyDark).text(`   ${cs}`, 310, csY2);
        csY2 += 15;
      });
      p5Y = Math.max(csY1, csY2) + 20;
      doc.font("Helvetica-Bold").fontSize(11).fillColor(headingNavy).text("Features and Warranty", 40, p5Y);
      p5Y += 16;
      const dailyKwh = Math.round(data.systemCapacityKw * 5);
      const featCol1 = [
        "Tier-1 High-Efficiency Solar Modules",
        "Inverter Warranty: Up to 8 Years",
        "Solar Module Product Warranty: 12 Years",
        "Solar Module Performance Warranty: Up to 30 Years"
      ];
      const featCol2 = [
        "Workmanship Warranty: 1 Year",
        `Estimated Energy Generation: ~${dailyKwh} kWh/day`,
        "Non DCR / DCR Solar Panels as applicable",
        "Compliant with MNRE and DISCOM Standards"
      ];
      let ftY1 = p5Y;
      featCol1.forEach((ft) => {
        doc.font("Helvetica-Bold").fontSize(8.5).fillColor(greenAccent).text("-", 48, ftY1);
        doc.font("Helvetica").fontSize(8.5).fillColor(bodyDark).text(`   ${ft}`, 58, ftY1);
        ftY1 += 15;
      });
      let ftY2 = p5Y;
      featCol2.forEach((ft) => {
        doc.font("Helvetica-Bold").fontSize(8.5).fillColor(greenAccent).text("-", 300, ftY2);
        doc.font("Helvetica").fontSize(8.5).fillColor(bodyDark).text(`   ${ft}`, 310, ftY2);
        ftY2 += 15;
      });
      p5Y = Math.max(ftY1, ftY2) + 24;
      doc.font("Helvetica-Bold").fontSize(11).fillColor(headingNavy).text("System Capacity & Pricing", 40, p5Y);
      p5Y += 16;
      const priceW = 515;
      const hasSubsidy = data.subsidyEligible && data.subsidyAmount > 0;
      doc.rect(40, p5Y, priceW, 22).fillAndStroke("#0F172A", "#0F172A");
      doc.font("Helvetica-Bold").fontSize(8).fillColor("#FFFFFF");
      doc.text("System Capacity", 45, p5Y + 6, { width: 145, align: "center" });
      doc.text("Domestic Price (Including GST)", 195, p5Y + 6, { width: 165, align: "center" });
      doc.text(hasSubsidy ? "Govt Subsidy / Net Cost" : "Estimated ROI", 365, p5Y + 6, { width: 185, align: "center" });
      p5Y += 22;
      const finalPriceStr = `\u20B9${Math.round(data.finalContractAmount).toLocaleString("en-IN")}/-`;
      doc.rect(40, p5Y, priceW, 36).fillAndStroke("#FFFFFF", "#CBD5E1");
      doc.font("Helvetica-Bold").fontSize(9).fillColor(bodyDark);
      doc.text(`${data.systemCapacityKw}KW On-grid Solar System`, 45, p5Y + 13, { width: 145, align: "center" });
      doc.font("Helvetica-Bold").fontSize(12).fillColor(headingNavy);
      doc.text(finalPriceStr, 195, p5Y + 11, { width: 165, align: "center" });
      if (hasSubsidy) {
        const netCost = data.indicativeNetCustomerCost || data.finalContractAmount - data.subsidyAmount;
        doc.font("Helvetica-Bold").fontSize(8).fillColor(greenAccent).text(`Subsidy: \u20B9${Math.round(data.subsidyAmount).toLocaleString("en-IN")}`, 365, p5Y + 7, { width: 185, align: "center" });
        doc.font("Helvetica-Bold").fontSize(9.5).fillColor(headingNavy).text(`Net Cost: \u20B9${Math.round(netCost).toLocaleString("en-IN")}/-`, 365, p5Y + 20, { width: 185, align: "center" });
      } else {
        doc.font("Helvetica-Bold").fontSize(9.5).fillColor(headingNavy).text("3.5 - 4.0 Years", 365, p5Y + 12, { width: 185, align: "center" });
      }
      p5Y += 46;
      doc.font("Helvetica-Bold").fontSize(11).fillColor(headingNavy).text("Payment Terms", 40, p5Y);
      p5Y += 16;
      doc.rect(40, p5Y, priceW, 38).fillAndStroke(bgLight, borderSlate);
      doc.font("Helvetica-Bold").fontSize(9).fillColor(headingNavy).text("\u2022   90% Advance Payment with Purchase Order / Agreement", 55, p5Y + 9);
      doc.font("Helvetica-Bold").fontSize(9).fillColor(headingNavy).text("\u2022   10% After Successful Commissioning & Grid Synchronization", 55, p5Y + 23);
      doc.addPage();
      drawHeaderBanner("Terms & Conditions & Official Authorization");
      let p6Y = 60;
      doc.font("Helvetica-Bold").fontSize(11).fillColor(headingNavy).text("Terms & Conditions", 40, p6Y);
      p6Y += 18;
      const termsList = [
        "Quotation Validity: 7 Days from issue date.",
        "GST is included in the above quoted price.",
        "Additional civil work will be charged extra 800/kW.",
        "Net Meter approval is subject to TANGEDCO / DISCOM regulations.",
        "Delivery is subject to material readiness and site access.",
        "Any additional civil or electrical work outside the quoted scope will be charged extra.",
        "Elevated above 4 Feet mounting structures will be charged extra 2500 per kW.",
        "Force majeure conditions and DISCOM grid outages are excluded."
      ];
      termsList.forEach((tm) => {
        doc.font("Helvetica-Bold").fontSize(8.5).fillColor(greenAccent).text("\u2022", 48, p6Y);
        doc.font("Helvetica").fontSize(8.5).fillColor(bodyDark).text(`   ${tm}`, 58, p6Y);
        p6Y += 16;
      });
      p6Y += 18;
      doc.rect(40, p6Y, 515, 36).fillAndStroke(greenLight, "#A7F3D0");
      doc.font("Helvetica-Bold").fontSize(8.5).fillColor("#065F46").text(
        "Thank you for your valuable opportunity. We look forward to delivering a reliable solar solution and building a long-term partnership with you.",
        55,
        p6Y + 11,
        { width: 485, align: "center" }
      );
      p6Y += 52;
      doc.font("Helvetica-Bold").fontSize(11).fillColor(headingNavy).text("Contact Details", 40, p6Y);
      p6Y += 16;
      const cardHeight = 96;
      doc.rect(40, p6Y, 515, cardHeight).fillAndStroke("#0F172A", "#1E293B");
      doc.font("Helvetica-Bold").fontSize(13).fillColor("#FFFFFF").text("A Boopathi BE.,", 55, p6Y + 14);
      doc.font("Helvetica-Bold").fontSize(8.5).fillColor("#34D399").text("CEO & Managing Director  \u2022  AB ENERGY SOLUTIONS", 55, p6Y + 31);
      doc.font("Helvetica").fontSize(8).fillColor("#CBD5E1").text("Phone: +91 95664 99678   |   Email: abenergysolutiontn@gmail.com", 55, p6Y + 47);
      doc.font("Helvetica").fontSize(8).fillColor("#CBD5E1").text("1/359, Maruthi Nagar, Chinnakavandanur, Namakkal, TN - 636202", 55, p6Y + 60);
      doc.font("Helvetica-Bold").fontSize(7.5).fillColor("#34D399").text("12+ Years Solar Experience   \u2022   TNEB C-Licence Certified Enterprise", 55, p6Y + 74);
      doc.rect(380, p6Y + 12, 160, 72).fillAndStroke("#FFFFFF", "#CBD5E1");
      doc.font("Helvetica-Bold").fontSize(8).fillColor(headingNavy).text("For AB ENERGY SOLUTIONS", 380, p6Y + 18, { width: 160, align: "center" });
      doc.moveTo(395, p6Y + 60).lineTo(525, p6Y + 60).lineWidth(0.5).strokeColor("#94A3B8").stroke();
      doc.font("Helvetica").fontSize(7.5).fillColor("#64748B").text("Authorized Signatory", 380, p6Y + 65, { width: 160, align: "center" });
      const range = doc.bufferedPageRange();
      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        drawFooter(i + 1, range.count);
      }
      doc.end();
      writeStream.on("finish", () => {
        resolve({ filePath, fileUrl });
      });
      writeStream.on("error", (err) => {
        reject(err);
      });
    } catch (err) {
      reject(err);
    }
  });
}

// server/controllers/quotations.controller.ts
function formatQuotation(q) {
  if (!q) return null;
  return {
    ...q,
    quotationNumber: q.quotation_number,
    leadId: q.lead_id,
    leadName: q.lead_name,
    customerPhone: q.customer_phone,
    customerAddress: q.customer_address,
    systemCapacityKw: Number(q.system_capacity_kw) || 0,
    currentVersion: Number(q.current_version) || 1,
    versions: typeof q.versions === "string" ? JSON.parse(q.versions) : q.versions || [],
    status: q.status,
    sentDate: q.sent_date,
    validUntil: q.valid_until,
    salespersonId: q.salesperson_id,
    salespersonName: q.salesperson_name,
    totalAmount: Number(q.total_amount) || 0,
    proposalType: q.proposal_type || "Final_Technical",
    packageTier: q.package_tier || "Standard",
    approvalStatus: q.approval_status || "Approved",
    discountAmount: Number(q.discount_amount) || 0,
    discountApprovedBy: q.discount_approved_by,
    subsidyAmount: Number(q.subsidy_amount) || 0,
    taxableAmount: Number(q.taxable_amount) || 0,
    gstRate: Number(q.gst_rate) || 0,
    gstAmount: Number(q.gst_amount) || 0,
    taxMode: q.tax_mode || "ITEMIZED",
    totalCgst: Number(q.total_cgst) || 0,
    totalSgst: Number(q.total_sgst) || 0,
    totalIgst: Number(q.total_igst) || 0,
    amountInWords: q.amount_in_words || "",
    surveyId: q.survey_id,
    pdfUrl: q.pdf_url,
    convertedToProjectId: q.converted_to_project_id,
    createdAt: q.created_at
  };
}
var calculateQuotationPreview = async (req, res) => {
  try {
    const input = req.body;
    const calc = calculateQuotation(input);
    return res.json({ success: true, calculation: calc });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
var getQuotations = async (req, res) => {
  try {
    const user2 = req.user;
    let query = "SELECT * FROM quotations ORDER BY created_at DESC";
    let params = [];
    if (user2?.role === "Customer") {
      const custId = user2.customerId || "";
      query = `SELECT q.* FROM quotations q 
               LEFT JOIN customers c ON (c.converted_from_lead_id = q.lead_id OR c.phone = q.customer_phone)
               WHERE c.id = ? OR q.customer_phone = ?
               ORDER BY q.created_at DESC`;
      params = [custId, user2?.phone || ""];
    }
    const [rows] = await pool.query(query, params);
    const parsed = rows.map((q) => formatQuotation(q));
    res.json({ success: true, quotations: parsed });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
var getQuotationById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query("SELECT * FROM quotations WHERE id = ? LIMIT 1", [id]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, error: "Quotation not found" });
    }
    res.json({ success: true, quotation: formatQuotation(rows[0]) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
async function createQuotationDraftInternal(connOrPool, options) {
  const { surveyId, leadId, user: user2, packageTier = "Premium Bifacial", discountAmount = 0, customItems } = options;
  const [existingBySurvey] = await connOrPool.query(
    'SELECT * FROM quotations WHERE survey_id = ? AND status != "Declined" ORDER BY created_at DESC LIMIT 1',
    [surveyId]
  );
  if (existingBySurvey && existingBySurvey.length > 0) {
    return { quotation: formatQuotation(existingBySurvey[0]), created: false };
  }
  if (leadId) {
    const [existingByLead] = await connOrPool.query(
      'SELECT * FROM quotations WHERE lead_id = ? AND status != "Declined" ORDER BY created_at DESC LIMIT 1',
      [leadId]
    );
    if (existingByLead && existingByLead.length > 0) {
      if (!existingByLead[0].survey_id) {
        await connOrPool.query("UPDATE quotations SET survey_id = ? WHERE id = ?", [surveyId, existingByLead[0].id]);
        existingByLead[0].survey_id = surveyId;
      }
      return { quotation: formatQuotation(existingByLead[0]), created: false };
    }
  }
  const [surveys] = await connOrPool.query("SELECT * FROM site_surveys WHERE id = ? LIMIT 1", [surveyId]);
  if (!surveys || surveys.length === 0) {
    throw new Error(`Site survey ${surveyId} not found`);
  }
  const survey = surveys[0];
  let lead = null;
  const effectiveLeadId = leadId || survey.lead_id;
  if (effectiveLeadId) {
    const [leads] = await connOrPool.query("SELECT * FROM leads WHERE id = ? LIMIT 1", [effectiveLeadId]);
    if (leads && leads.length > 0) {
      lead = leads[0];
    }
  }
  const capacityKw = Number(survey.recommended_kw) || Number(lead?.recommended_kw) || 5;
  const roofType = survey.roof_type || lead?.roof_type || "RCC Flat";
  const customerName = survey.customer_name || lead?.name || "Solar Customer";
  const customerPhone = survey.phone || lead?.phone || "";
  const customerAddress = survey.address || lead?.address || lead?.city || "Bengaluru, Karnataka";
  const customerCategory = lead?.monthly_bill && Number(lead.monthly_bill) > 25e3 ? "Commercial" : "Residential";
  const calc = calculateQuotation({
    leadId: effectiveLeadId,
    leadName: customerName,
    customerPhone,
    customerAddress,
    customerCategory,
    systemCapacityKw: capacityKw,
    packageTier,
    discountAmount,
    surveyId,
    isSurveyApproved: true,
    roofType,
    customItems
  });
  const [allIds] = await connOrPool.query("SELECT id FROM quotations WHERE id LIKE 'QT-2026-%'");
  let maxNum = 20;
  for (const row of allIds) {
    const match = row.id.match(/QT-2026-(\d+)/);
    if (match) {
      const n = parseInt(match[1], 10);
      if (n > maxNum) maxNum = n;
    }
  }
  const finalId = `QT-2026-${String(maxNum + 1).padStart(5, "0")}`;
  const versionNumber = `${finalId}-V1`;
  const v1 = {
    version: 1,
    quotationNumber: versionNumber,
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    items: calc.items,
    subtotal: calc.subtotal,
    subsidyDeduction: calc.subsidyAmount,
    discount: calc.discountAmount,
    taxableAmount: calc.taxableAmount,
    gstRate: calc.gstRate,
    gstAmount: calc.gstAmount,
    cgstAmount: calc.cgstAmount,
    sgstAmount: calc.sgstAmount,
    igstAmount: calc.igstAmount,
    taxType: calc.taxType,
    netTotal: calc.finalContractAmount,
    amountInWords: calc.amountInWords,
    terms: calc.terms,
    notes: `Techno-Commercial Proposal based on approved Technical Site Survey ${surveyId}.`
  };
  const validUntil = new Date(Date.now() + 864e5 * 14).toISOString().split("T")[0];
  const salespersonId = lead?.assigned_to_id || user2?.employeeId || "EMP-265286";
  const salespersonName = lead?.assigned_to_name || (user2?.role === "Sales Executive" ? user2?.name : "Suresh Kumar");
  await connOrPool.query(
    `INSERT INTO quotations (
      id, quotation_number, lead_id, lead_name, customer_phone, customer_address, 
      system_capacity_kw, current_version, versions, status, sent_date, valid_until, 
      salesperson_id, salesperson_name, total_amount, proposal_type, package_tier, 
      subtotal, discount_amount, subsidy_amount, taxable_amount, gst_rate, gst_amount, 
      net_total, approval_status, survey_id, tax_mode, total_cgst, total_sgst, total_igst, 
      amount_in_words, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      finalId,
      versionNumber,
      effectiveLeadId || null,
      customerName,
      customerPhone,
      customerAddress,
      calc.systemCapacityKw,
      1,
      JSON.stringify([v1]),
      "Draft",
      null,
      validUntil,
      salespersonId,
      salespersonName,
      calc.finalContractAmount,
      "Final_Technical",
      calc.packageTier,
      calc.subtotal,
      calc.discountAmount,
      calc.subsidyAmount,
      calc.taxableAmount,
      calc.gstRate,
      calc.gstAmount,
      calc.finalContractAmount,
      calc.approvalStatus,
      surveyId,
      calc.taxMode,
      calc.cgstAmount,
      calc.sgstAmount,
      calc.igstAmount,
      calc.amountInWords,
      (/* @__PURE__ */ new Date()).toISOString()
    ]
  );
  await connOrPool.query("UPDATE site_surveys SET quotation_id = ? WHERE id = ?", [finalId, surveyId]);
  let pdfUrl = `/uploads/proposals/Quotation_${versionNumber.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`;
  try {
    const pdfData = {
      quotationNumber: versionNumber,
      versionNumber: 1,
      createdAt: v1.createdAt,
      validUntil,
      leadName: customerName,
      customerPhone,
      customerAddress,
      systemCapacityKw: calc.systemCapacityKw,
      actualCapacityKwp: calc.actualCapacityKwp,
      packageTier: calc.packageTier,
      proposalType: "Final_Technical",
      salespersonName,
      taxMode: calc.taxMode,
      taxType: calc.taxType,
      items: calc.items,
      subtotal: calc.subtotal,
      discountAmount: calc.discountAmount,
      taxableAmount: calc.taxableAmount,
      gstRate: calc.gstRate,
      cgstAmount: calc.cgstAmount,
      sgstAmount: calc.sgstAmount,
      igstAmount: calc.igstAmount,
      gstAmount: calc.gstAmount,
      finalContractAmount: calc.finalContractAmount,
      amountInWords: calc.amountInWords,
      subsidyEligible: calc.subsidyEligible,
      subsidyAmount: calc.subsidyAmount,
      indicativeNetCustomerCost: calc.indicativeNetCustomerCost,
      annualGenerationKwh: calc.annualGenerationKwh,
      annualSavingsInr: calc.annualSavingsInr,
      lifetimeSavings25Yr: calc.lifetimeSavings25Yr,
      simplePaybackYears: calc.simplePaybackYears,
      terms: calc.terms
    };
    const resPdf = await generateProposalPdf(pdfData);
    pdfUrl = resPdf.fileUrl;
    await connOrPool.query("UPDATE quotations SET pdf_url = ? WHERE id = ?", [pdfUrl, finalId]);
  } catch (pdfErr) {
    console.warn("PDF generation in background:", pdfErr);
  }
  const [createdRows] = await connOrPool.query("SELECT * FROM quotations WHERE id = ? LIMIT 1", [finalId]);
  return { quotation: formatQuotation(createdRows[0]), created: true };
}
var createQuotation = async (req, res) => {
  try {
    const body = req.body;
    const user2 = req.user;
    if (body.surveyId) {
      const result = await createQuotationDraftInternal(pool, {
        surveyId: body.surveyId,
        leadId: body.leadId,
        user: user2,
        packageTier: body.packageTier,
        discountAmount: body.discountAmount,
        customItems: body.customItems
      });
      return res.json({ success: true, quotation: result.quotation, alreadyExisted: !result.created });
    }
    let isSurveyApproved = false;
    let surveyRef = body.surveyId;
    if (body.leadId) {
      const [surveys] = await pool.query(
        "SELECT id, status, recommended_kw FROM site_surveys WHERE lead_id = ? ORDER BY created_at DESC LIMIT 1",
        [body.leadId]
      );
      if (surveys && surveys.length > 0) {
        if (surveys[0].status === "Approved" || surveys[0].status === "Completed") {
          isSurveyApproved = true;
          surveyRef = surveys[0].id;
        }
      }
    }
    const calc = calculateQuotation({
      leadId: body.leadId,
      leadName: body.leadName,
      customerPhone: body.customerPhone,
      customerAddress: body.customerAddress,
      customerCategory: body.customerCategory,
      systemCapacityKw: body.systemCapacityKw || 5,
      packageTier: body.packageTier || "Premium Bifacial",
      discountAmount: body.discountAmount || 0,
      surveyId: surveyRef,
      isSurveyApproved,
      roofType: body.roofType,
      customItems: body.customItems,
      taxMode: body.taxMode,
      taxType: body.taxType
    });
    const [allIds] = await pool.query("SELECT id FROM quotations WHERE id LIKE 'QT-2026-%'");
    let maxNum = 20;
    for (const row of allIds) {
      const match = row.id.match(/QT-2026-(\d+)/);
      if (match) {
        const n = parseInt(match[1], 10);
        if (n > maxNum) maxNum = n;
      }
    }
    const finalId = `QT-2026-${String(maxNum + 1).padStart(5, "0")}`;
    const versionNumber = `${finalId}-V1`;
    const v1 = {
      version: 1,
      quotationNumber: versionNumber,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      items: calc.items,
      subtotal: calc.subtotal,
      subsidyDeduction: calc.subsidyAmount,
      discount: calc.discountAmount,
      taxableAmount: calc.taxableAmount,
      gstRate: calc.gstRate,
      gstAmount: calc.gstAmount,
      cgstAmount: calc.cgstAmount,
      sgstAmount: calc.sgstAmount,
      igstAmount: calc.igstAmount,
      taxType: calc.taxType,
      netTotal: calc.finalContractAmount,
      amountInWords: calc.amountInWords,
      terms: calc.terms,
      notes: isSurveyApproved ? `Techno-Commercial Proposal based on approved Technical Site Survey ${surveyRef}.` : `Preliminary indicative solar estimate. Final capacity subject to on-site roof audit.`
    };
    const validUntil = new Date(Date.now() + 864e5 * 14).toISOString().split("T")[0];
    const salespersonId = body.salespersonId || user2?.employeeId || "EMP-06";
    const salespersonName = body.salespersonName || user2?.name || "Vikram Mehta (Sales)";
    await pool.query(
      `INSERT INTO quotations (
        id, quotation_number, lead_id, lead_name, customer_phone, customer_address, 
        system_capacity_kw, current_version, versions, status, sent_date, valid_until, 
        salesperson_id, salesperson_name, total_amount, proposal_type, package_tier, 
        subtotal, discount_amount, subsidy_amount, taxable_amount, gst_rate, gst_amount, 
        net_total, approval_status, survey_id, tax_mode, total_cgst, total_sgst, total_igst,
        amount_in_words, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        finalId,
        versionNumber,
        body.leadId || null,
        body.leadName || "Solar Client",
        body.customerPhone || "",
        body.customerAddress || "",
        calc.systemCapacityKw,
        1,
        JSON.stringify([v1]),
        "Draft",
        null,
        validUntil,
        salespersonId,
        salespersonName,
        calc.finalContractAmount,
        calc.proposalType,
        calc.packageTier,
        calc.subtotal,
        calc.discountAmount,
        calc.subsidyAmount,
        calc.taxableAmount,
        calc.gstRate,
        calc.gstAmount,
        calc.finalContractAmount,
        calc.approvalStatus,
        surveyRef || null,
        calc.taxMode,
        calc.cgstAmount,
        calc.sgstAmount,
        calc.igstAmount,
        calc.amountInWords,
        (/* @__PURE__ */ new Date()).toISOString()
      ]
    );
    if (body.leadId) {
      await pool.query("UPDATE leads SET quotation_id = ? WHERE id = ?", [finalId, body.leadId]);
    }
    if (surveyRef) {
      await pool.query("UPDATE site_surveys SET quotation_id = ? WHERE id = ?", [finalId, surveyRef]);
    }
    let pdfUrl = `/uploads/proposals/Quotation_${versionNumber.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`;
    try {
      const pdfData = {
        quotationNumber: versionNumber,
        versionNumber: 1,
        createdAt: v1.createdAt,
        validUntil,
        leadName: body.leadName || "Solar Client",
        customerPhone: body.customerPhone || "",
        customerAddress: body.customerAddress || "Bengaluru, Karnataka",
        systemCapacityKw: calc.systemCapacityKw,
        actualCapacityKwp: calc.actualCapacityKwp,
        packageTier: calc.packageTier,
        proposalType: calc.proposalType,
        salespersonName,
        taxMode: calc.taxMode,
        taxType: calc.taxType,
        items: calc.items,
        subtotal: calc.subtotal,
        discountAmount: calc.discountAmount,
        taxableAmount: calc.taxableAmount,
        gstRate: calc.gstRate,
        cgstAmount: calc.cgstAmount,
        sgstAmount: calc.sgstAmount,
        igstAmount: calc.igstAmount,
        gstAmount: calc.gstAmount,
        finalContractAmount: calc.finalContractAmount,
        amountInWords: calc.amountInWords,
        subsidyEligible: calc.subsidyEligible,
        subsidyAmount: calc.subsidyAmount,
        indicativeNetCustomerCost: calc.indicativeNetCustomerCost,
        annualGenerationKwh: calc.annualGenerationKwh,
        annualSavingsInr: calc.annualSavingsInr,
        lifetimeSavings25Yr: calc.lifetimeSavings25Yr,
        simplePaybackYears: calc.simplePaybackYears,
        terms: calc.terms
      };
      const resPdf = await generateProposalPdf(pdfData);
      pdfUrl = resPdf.fileUrl;
      await pool.query("UPDATE quotations SET pdf_url = ? WHERE id = ?", [pdfUrl, finalId]);
    } catch (pdfErr) {
      console.warn("Note: Background PDF generation queued:", pdfErr);
    }
    const [createdRows] = await pool.query("SELECT * FROM quotations WHERE id = ? LIMIT 1", [finalId]);
    res.json({ success: true, quotation: formatQuotation(createdRows[0]) });
  } catch (err) {
    console.error("Error creating quotation:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};
var createQuotationRevision = async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;
    const user2 = req.user;
    const [rows] = await pool.query("SELECT * FROM quotations WHERE id = ? LIMIT 1", [id]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, error: "Quotation not found" });
    }
    const existing = rows[0];
    const versions = typeof existing.versions === "string" ? JSON.parse(existing.versions) : existing.versions || [];
    const nextVerNum = (existing.current_version || versions.length) + 1;
    const nextVerCode = `${id}-V${nextVerNum}`;
    const calc = calculateQuotation({
      leadId: existing.lead_id,
      leadName: existing.lead_name,
      customerPhone: existing.customer_phone,
      customerAddress: existing.customer_address,
      systemCapacityKw: body.systemCapacityKw || existing.system_capacity_kw,
      packageTier: body.packageTier || existing.package_tier || "Premium Bifacial",
      discountAmount: body.discountAmount !== void 0 ? body.discountAmount : existing.discount_amount,
      surveyId: existing.survey_id,
      isSurveyApproved: existing.proposal_type === "Final_Technical",
      customItems: body.customItems,
      taxMode: body.taxMode || existing.tax_mode,
      taxType: body.taxType
    });
    const newVersion = {
      version: nextVerNum,
      quotationNumber: nextVerCode,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      items: calc.items,
      subtotal: calc.subtotal,
      subsidyDeduction: calc.subsidyAmount,
      discount: calc.discountAmount,
      taxableAmount: calc.taxableAmount,
      gstRate: calc.gstRate,
      gstAmount: calc.gstAmount,
      cgstAmount: calc.cgstAmount,
      sgstAmount: calc.sgstAmount,
      igstAmount: calc.igstAmount,
      taxType: calc.taxType,
      netTotal: calc.finalContractAmount,
      amountInWords: calc.amountInWords,
      terms: calc.terms,
      notes: body.notes || `Revision V${nextVerNum} created by ${user2?.name || "Sales Rep"}.`
    };
    versions.push(newVersion);
    let pdfUrl = existing.pdf_url;
    try {
      const pdfData = {
        quotationNumber: nextVerCode,
        versionNumber: nextVerNum,
        createdAt: newVersion.createdAt,
        validUntil: existing.valid_until,
        leadName: existing.lead_name,
        customerPhone: existing.customer_phone,
        customerAddress: existing.customer_address,
        systemCapacityKw: calc.systemCapacityKw,
        actualCapacityKwp: calc.actualCapacityKwp,
        packageTier: calc.packageTier,
        proposalType: calc.proposalType,
        salespersonName: user2?.name || existing.salesperson_name,
        taxMode: calc.taxMode,
        taxType: calc.taxType,
        items: calc.items,
        subtotal: calc.subtotal,
        discountAmount: calc.discountAmount,
        taxableAmount: calc.taxableAmount,
        gstRate: calc.gstRate,
        cgstAmount: calc.cgstAmount,
        sgstAmount: calc.sgstAmount,
        igstAmount: calc.igstAmount,
        gstAmount: calc.gstAmount,
        finalContractAmount: calc.finalContractAmount,
        amountInWords: calc.amountInWords,
        subsidyEligible: calc.subsidyEligible,
        subsidyAmount: calc.subsidyAmount,
        indicativeNetCustomerCost: calc.indicativeNetCustomerCost,
        annualGenerationKwh: calc.annualGenerationKwh,
        annualSavingsInr: calc.annualSavingsInr,
        lifetimeSavings25Yr: calc.lifetimeSavings25Yr,
        simplePaybackYears: calc.simplePaybackYears,
        terms: calc.terms
      };
      const resPdf = await generateProposalPdf(pdfData);
      pdfUrl = resPdf.fileUrl;
    } catch (e) {
      console.warn("PDF revision generation error:", e);
    }
    await pool.query(
      `UPDATE quotations SET 
        quotation_number = ?, current_version = ?, versions = ?, total_amount = ?,
        system_capacity_kw = ?, package_tier = ?, subtotal = ?, discount_amount = ?,
        subsidy_amount = ?, taxable_amount = ?, gst_rate = ?, gst_amount = ?, net_total = ?,
        approval_status = ?, tax_mode = ?, total_cgst = ?, total_sgst = ?, total_igst = ?,
        amount_in_words = ?, pdf_url = ?
       WHERE id = ?`,
      [
        nextVerCode,
        nextVerNum,
        JSON.stringify(versions),
        calc.finalContractAmount,
        calc.systemCapacityKw,
        calc.packageTier,
        calc.subtotal,
        calc.discountAmount,
        calc.subsidyAmount,
        calc.taxableAmount,
        calc.gstRate,
        calc.gstAmount,
        calc.finalContractAmount,
        calc.approvalStatus,
        calc.taxMode,
        calc.cgstAmount,
        calc.sgstAmount,
        calc.igstAmount,
        calc.amountInWords,
        pdfUrl,
        id
      ]
    );
    res.json({ success: true, quotationNumber: nextVerCode, version: newVersion, pdfUrl });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
var approveQuotationDiscount = async (req, res) => {
  try {
    const { id } = req.params;
    const user2 = req.user;
    if (user2?.role !== "Sales Manager" && user2?.role !== "Super Admin") {
      return res.status(403).json({
        success: false,
        error: "Only Sales Manager or Super Admin can approve commercial discounts."
      });
    }
    await pool.query(
      'UPDATE quotations SET approval_status = "Approved", discount_approved_by = ? WHERE id = ?',
      [user2.name, id]
    );
    res.json({ success: true, message: `Quotation ${id} approved by ${user2.name}` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
var updateQuotation = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const allowed = ["status", "notes", "validUntil", "sentDate", "packageTier", "versions", "totalAmount", "approvalStatus"];
    const fields = [];
    const values = [];
    if (updates.status !== void 0) {
      fields.push("status = ?");
      values.push(updates.status);
    }
    if (updates.sentDate !== void 0) {
      fields.push("sent_date = ?");
      values.push(updates.sentDate);
    }
    if (updates.validUntil !== void 0) {
      fields.push("valid_until = ?");
      values.push(updates.validUntil);
    }
    if (updates.packageTier !== void 0) {
      fields.push("package_tier = ?");
      values.push(updates.packageTier);
    }
    if (updates.notes !== void 0) {
      const [curr] = await pool.query("SELECT versions FROM quotations WHERE id = ? LIMIT 1", [id]);
      if (curr && curr.length > 0) {
        const v = typeof curr[0].versions === "string" ? JSON.parse(curr[0].versions) : curr[0].versions;
        if (v && v.length > 0) {
          v[v.length - 1].notes = updates.notes;
          fields.push("versions = ?");
          values.push(JSON.stringify(v));
        }
      }
    }
    if (updates.approvalStatus !== void 0) {
      fields.push("approval_status = ?");
      values.push(updates.approvalStatus);
    }
    if (updates.status === "Sent" && (user?.role === "Sales Manager" || user?.role === "Super Admin")) {
      fields.push("approval_status = ?");
      values.push("Approved");
      fields.push("discount_approved_by = ?");
      values.push(user?.name || "Sales Manager");
    }
    if (fields.length > 0) {
      values.push(id);
      await pool.query(`UPDATE quotations SET ${fields.join(", ")} WHERE id = ?`, values);
    }
    res.json({ success: true, id, updates });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
var editQuotation = async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;
    const user2 = req.user;
    const [rows] = await pool.query("SELECT * FROM quotations WHERE id = ? LIMIT 1", [id]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, error: "Quotation not found" });
    }
    const existing = rows[0];
    const systemCapacityKw = body.systemCapacityKw || existing.system_capacity_kw;
    const packageTier = body.packageTier || existing.package_tier || "Premium Bifacial";
    const discountAmount = body.discountAmount !== void 0 ? Number(body.discountAmount) : Number(existing.discount_amount);
    const customItems = body.customItems;
    const calc = calculateQuotation({
      leadId: existing.lead_id,
      leadName: existing.lead_name,
      customerPhone: existing.customer_phone,
      customerAddress: existing.customer_address,
      customerCategory: existing.customer_category,
      systemCapacityKw,
      packageTier,
      discountAmount,
      surveyId: existing.survey_id,
      isSurveyApproved: existing.proposal_type === "Final_Technical",
      customItems,
      taxMode: body.taxMode || existing.tax_mode,
      taxType: body.taxType
    });
    let versions = typeof existing.versions === "string" ? JSON.parse(existing.versions) : existing.versions || [];
    if (!versions || versions.length === 0) {
      versions = [{
        version: 1,
        quotationNumber: existing.quotation_number,
        createdAt: existing.created_at || (/* @__PURE__ */ new Date()).toISOString(),
        items: calc.items,
        subtotal: calc.subtotal,
        subsidyDeduction: calc.subsidyAmount,
        discount: calc.discountAmount,
        taxableAmount: calc.taxableAmount,
        gstRate: calc.gstRate,
        gstAmount: calc.gstAmount,
        cgstAmount: calc.cgstAmount,
        sgstAmount: calc.sgstAmount,
        igstAmount: calc.igstAmount,
        taxType: calc.taxType,
        netTotal: calc.finalContractAmount,
        amountInWords: calc.amountInWords,
        terms: calc.terms,
        notes: body.notes || "Updated quotation draft with custom BOM."
      }];
    } else {
      const lastIdx = versions.length - 1;
      versions[lastIdx] = {
        ...versions[lastIdx],
        items: calc.items,
        subtotal: calc.subtotal,
        subsidyDeduction: calc.subsidyAmount,
        discount: calc.discountAmount,
        taxableAmount: calc.taxableAmount,
        gstRate: calc.gstRate,
        gstAmount: calc.gstAmount,
        cgstAmount: calc.cgstAmount,
        sgstAmount: calc.sgstAmount,
        igstAmount: calc.igstAmount,
        taxType: calc.taxType,
        netTotal: calc.finalContractAmount,
        amountInWords: calc.amountInWords,
        terms: calc.terms,
        notes: body.notes || versions[lastIdx].notes
      };
    }
    let pdfUrl = existing.pdf_url;
    try {
      const pdfData = {
        quotationNumber: existing.quotation_number,
        versionNumber: existing.current_version || 1,
        createdAt: existing.created_at,
        validUntil: existing.valid_until,
        leadName: existing.lead_name,
        customerPhone: existing.customer_phone,
        customerAddress: existing.customer_address,
        systemCapacityKw: calc.systemCapacityKw,
        actualCapacityKwp: calc.actualCapacityKwp,
        packageTier: calc.packageTier,
        proposalType: calc.proposalType,
        salespersonName: existing.salesperson_name || user2?.name || "Vikram Mehta (Sales)",
        taxMode: calc.taxMode,
        taxType: calc.taxType,
        items: calc.items,
        subtotal: calc.subtotal,
        discountAmount: calc.discountAmount,
        taxableAmount: calc.taxableAmount,
        gstRate: calc.gstRate,
        cgstAmount: calc.cgstAmount,
        sgstAmount: calc.sgstAmount,
        igstAmount: calc.igstAmount,
        gstAmount: calc.gstAmount,
        finalContractAmount: calc.finalContractAmount,
        amountInWords: calc.amountInWords,
        subsidyEligible: calc.subsidyEligible,
        subsidyAmount: calc.subsidyAmount,
        indicativeNetCustomerCost: calc.indicativeNetCustomerCost,
        annualGenerationKwh: calc.annualGenerationKwh,
        annualSavingsInr: calc.annualSavingsInr,
        lifetimeSavings25Yr: calc.lifetimeSavings25Yr,
        simplePaybackYears: calc.simplePaybackYears,
        terms: calc.terms
      };
      const resPdf = await generateProposalPdf(pdfData);
      pdfUrl = resPdf.fileUrl;
    } catch (e) {
      console.warn("PDF regeneration error:", e);
    }
    const isManager = user2?.role === "Sales Manager" || user2?.role === "Super Admin";
    const finalApproval = body.approvalStatus || (isManager ? "Approved" : calc.approvalStatus);
    const approvedBy = isManager ? user2?.name || "Sales Manager" : existing.discount_approved_by;
    await pool.query(
      `UPDATE quotations SET
        system_capacity_kw = ?, package_tier = ?, discount_amount = ?,
        subtotal = ?, taxable_amount = ?, gst_rate = ?, gst_amount = ?,
        total_amount = ?, net_total = ?, total_cgst = ?, total_sgst = ?,
        total_igst = ?, amount_in_words = ?, approval_status = ?, discount_approved_by = ?,
        versions = ?, pdf_url = ?
       WHERE id = ?`,
      [
        calc.systemCapacityKw,
        calc.packageTier,
        calc.discountAmount,
        calc.subtotal,
        calc.taxableAmount,
        calc.gstRate,
        calc.gstAmount,
        calc.finalContractAmount,
        calc.finalContractAmount,
        calc.cgstAmount,
        calc.sgstAmount,
        calc.igstAmount,
        calc.amountInWords,
        finalApproval,
        approvedBy,
        JSON.stringify(versions),
        pdfUrl,
        id
      ]
    );
    const [updated] = await pool.query("SELECT * FROM quotations WHERE id = ? LIMIT 1", [id]);
    res.json({ success: true, quotation: formatQuotation(updated[0]) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
var recordCustomerAcceptance = async (req, res) => {
  try {
    const { id } = req.params;
    const { acceptanceNotes, clientPoNumber } = req.body;
    const user2 = req.user;
    const [rows] = await pool.query("SELECT * FROM quotations WHERE id = ? LIMIT 1", [id]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, error: "Quotation not found" });
    }
    const quote = rows[0];
    if (quote.approval_status === "Pending_Approval") {
      return res.status(400).json({
        success: false,
        error: "Cannot record customer acceptance: Quotation discount is pending Sales Manager approval."
      });
    }
    await pool.query(
      `UPDATE quotations SET 
        status = 'Customer_Accepted',
        notes = CONCAT(COALESCE(notes, ''), ?),
        sent_date = COALESCE(sent_date, NOW())
       WHERE id = ?`,
      [`
[Customer Accepted: ${(/* @__PURE__ */ new Date()).toLocaleDateString("en-IN")}] Recorded by ${user2?.name || "Sales"}. PO: ${clientPoNumber || "N/A"}. ${acceptanceNotes || ""}`, id]
    );
    const [updated] = await pool.query("SELECT * FROM quotations WHERE id = ? LIMIT 1", [id]);
    res.json({ success: true, quotation: formatQuotation(updated[0]) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
var acceptQuotation = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { id } = req.params;
    const user2 = req.user;
    if (user2 && user2.role !== "Project Manager" && user2.role !== "Super Admin") {
      conn.release();
      return res.status(403).json({
        success: false,
        error: "Access denied: Only Project Managers and Super Admins are authorized to convert accepted quotations into live EPC projects."
      });
    }
    const [rows] = await conn.query("SELECT * FROM quotations WHERE id = ? LIMIT 1", [id]);
    if (!rows || rows.length === 0) {
      conn.release();
      return res.status(404).json({ success: false, error: "Quotation not found" });
    }
    const quote = rows[0];
    if (quote.approval_status === "Pending_Approval") {
      conn.release();
      return res.status(400).json({
        success: false,
        error: "Cannot accept quotation: Discount exceeds authorized threshold and is pending manager approval."
      });
    }
    if (quote.converted_to_project_id) {
      const [existingProject] = await conn.query(
        "SELECT * FROM projects WHERE id = ? LIMIT 1",
        [quote.converted_to_project_id]
      );
      conn.release();
      if (existingProject && existingProject.length > 0) {
        return res.json({
          success: true,
          message: "Quotation was already accepted and converted to project.",
          alreadyConverted: true,
          projectId: quote.converted_to_project_id,
          project: existingProject[0]
        });
      }
    }
    await conn.beginTransaction();
    const quoteTotal = Number(quote.total_amount) || 0;
    const capacityKw = Number(quote.system_capacity_kw) || 5;
    const advanceAmount = Math.round(quoteTotal * 0.9);
    let customerId = "";
    let customerName = quote.lead_name;
    let customerPhone = quote.customer_phone;
    let customerAddress = quote.customer_address;
    const [existingCust] = await conn.query(
      "SELECT id, name, phone, address FROM customers WHERE converted_from_lead_id = ? OR phone = ? LIMIT 1",
      [quote.lead_id, quote.customer_phone]
    );
    if (existingCust && existingCust.length > 0) {
      customerId = existingCust[0].id;
      customerName = existingCust[0].name;
    } else {
      const [allCusts] = await conn.query("SELECT id FROM customers WHERE id LIKE 'CUST-2026-%'");
      let maxCustNum = 20;
      for (const c of allCusts) {
        const match = c.id.match(/CUST-2026-(\d+)/);
        if (match) {
          const n = parseInt(match[1], 10);
          if (n > maxCustNum) maxCustNum = n;
        }
      }
      customerId = `CUST-2026-${String(maxCustNum + 1).padStart(3, "0")}`;
      await conn.query(
        `INSERT INTO customers (
          id, name, email, phone, address, city, state, pincode, 
          consumer_number_discom, discom_name, converted_from_lead_id, 
          total_system_kw, total_order_value, paid_amount, balance_amount, 
          status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          customerId,
          customerName,
          `${customerName.toLowerCase().replace(/\s+/g, ".")}@example.com`,
          customerPhone,
          customerAddress || "Site Address",
          "Bengaluru",
          "Karnataka",
          "560001",
          `DISCOM-${Math.floor(1e6 + Math.random() * 9e6)}`,
          "BESCOM",
          quote.lead_id,
          capacityKw,
          quoteTotal,
          0,
          quoteTotal,
          "Under Installation",
          (/* @__PURE__ */ new Date()).toISOString()
        ]
      );
    }
    const [allProjs] = await conn.query("SELECT id FROM projects WHERE id LIKE 'PROJECT-2026-%' OR id LIKE 'PRJ-2026-%'");
    let maxProjNum = 20;
    for (const p of allProjs) {
      const match = p.id.match(/(?:PROJECT|PRJ)-2026-(\d+)/);
      if (match) {
        const n = parseInt(match[1], 10);
        if (n > maxProjNum) maxProjNum = n;
      }
    }
    const projectId = `PROJECT-2026-${String(maxProjNum + 1).padStart(3, "0")}`;
    const targetDate = new Date(Date.now() + 864e5 * 25).toISOString().split("T")[0];
    const initialTasks = [
      { id: `PT-${Date.now()}-1`, title: "DISCOM Net-metering application & sanction", stage: "Documentation", isCompleted: false, assignedRole: "Project Manager", assignedToName: "Karthik Raja", dueDate: new Date(Date.now() + 864e5 * 3).toISOString().split("T")[0] },
      { id: `PT-${Date.now()}-2`, title: "Warehouse material packing and dispatch check", stage: "Material Ready", isCompleted: false, assignedRole: "Project Manager", assignedToName: "Karthik Raja", dueDate: new Date(Date.now() + 864e5 * 5).toISOString().split("T")[0] },
      { id: `PT-${Date.now()}-3`, title: "HDG structure foundation & anchor bolting", stage: "Installation Scheduled", isCompleted: false, assignedRole: "Installation Team", assignedToName: "Muthu Vel", dueDate: new Date(Date.now() + 864e5 * 8).toISOString().split("T")[0] },
      { id: `PT-${Date.now()}-4`, title: "Module mounting & DC string conduit wiring", stage: "Installation In Progress", isCompleted: false, assignedRole: "Installation Team", assignedToName: "Muthu Vel", dueDate: new Date(Date.now() + 864e5 * 12).toISOString().split("T")[0] }
    ];
    const initialChecklist = {
      structureFastening: false,
      moduleClampingTorque: false,
      inverterWallMounting: false,
      dcWiringConduit: false,
      acWiringArmoured: false,
      chemicalEarthingPits: false,
      lightningArrester: false,
      dcdbProtectionFuses: false,
      acdbMccbIsolator: false,
      remoteMonitoringConfigured: false,
      vocAndIscTesting: false,
      safetySignagesAffixed: false,
      photosUploaded: []
    };
    await conn.query(
      `INSERT INTO projects (
        id, customer_id, customer_name, customer_phone, customer_address, 
        quotation_id, capacity_kw, total_amount, stage, start_date, 
        target_completion_date, project_manager_id, project_manager_name, 
        installation_lead_id, installation_lead_name, checklist, tasks, 
        inventory_reserved, discom_sanction_number, notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        projectId,
        customerId,
        customerName,
        customerPhone,
        customerAddress,
        quote.id,
        capacityKw,
        quoteTotal,
        "Booking",
        (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
        targetDate,
        "EMP-04",
        "Karthik Raja",
        "EMP-05",
        "Muthu Vel",
        JSON.stringify(initialChecklist),
        JSON.stringify(initialTasks),
        1,
        `BESCOM/SANCTION/${Date.now().toString().slice(-4)}`,
        `Converted deal from Quotation ${quote.quotation_number}. 40% Advance invoice issued (Unpaid).`,
        (/* @__PURE__ */ new Date()).toISOString()
      ]
    );
    const [allInvs] = await conn.query("SELECT id FROM invoices WHERE id LIKE 'INV-2026-%'");
    let maxInvNum = 20;
    for (const inv of allInvs) {
      const match = inv.id.match(/INV-2026-(\d+)/);
      if (match) {
        const n = parseInt(match[1], 10);
        if (n > maxInvNum) maxInvNum = n;
      }
    }
    const invoiceId = `INV-2026-${String(maxInvNum + 1).padStart(3, "0")}`;
    const invoiceNumber = `INV-2026-00${String(maxInvNum + 1).padStart(3, "0")}`;
    const subtotalInv = Math.round(advanceAmount / 1.138);
    const gstInv = advanceAmount - subtotalInv;
    const invoiceItems = [
      {
        description: `90% Milestone Advance for ${capacityKw} kW Solar EPC Plant (Booking & Procurement)`,
        hsnCode: "995465",
        quantity: 1,
        rate: subtotalInv,
        amount: subtotalInv
      }
    ];
    await conn.query(
      `INSERT INTO invoices (
        id, invoice_number, project_id, customer_id, customer_name, customer_phone, 
        issue_date, due_date, items, subtotal, cgst, sgst, igst, total_amount, 
        paid_amount, balance_due, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        invoiceId,
        invoiceNumber,
        projectId,
        customerId,
        customerName,
        customerPhone,
        (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
        new Date(Date.now() + 864e5 * 7).toISOString().split("T")[0],
        JSON.stringify(invoiceItems),
        subtotalInv,
        Math.round(gstInv / 2),
        Math.round(gstInv / 2),
        0,
        advanceAmount,
        0,
        advanceAmount,
        "Unpaid"
      ]
    );
    await conn.query(
      'UPDATE quotations SET status = "Converted_To_Project", converted_to_project_id = ? WHERE id = ?',
      [projectId, id]
    );
    if (quote.lead_id) {
      await conn.query('UPDATE leads SET status = "Won" WHERE id = ?', [quote.lead_id]);
    }
    await conn.commit();
    conn.release();
    const [projRows] = await pool.query("SELECT * FROM projects WHERE id = ? LIMIT 1", [projectId]);
    res.json({
      success: true,
      message: `Quotation accepted! Converted to Project ${projectId} and Advance Invoice ${invoiceNumber} created.`,
      projectId,
      project: projRows[0],
      invoiceId
    });
  } catch (err) {
    await conn.rollback();
    conn.release();
    console.error("Accept quotation transaction error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};
var downloadProposalPdf = async (req, res) => {
  try {
    const { id } = req.params;
    const user2 = req.user;
    const [rows] = await pool.query("SELECT * FROM quotations WHERE id = ? LIMIT 1", [id]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, error: "Quotation not found" });
    }
    const q = rows[0];
    if (user2?.role === "Customer" && user2?.phone !== q.customer_phone) {
      return res.status(403).json({ success: false, error: "Unauthorized to download this quotation." });
    }
    const versions = typeof q.versions === "string" ? JSON.parse(q.versions) : q.versions || [];
    const activeVer = versions.find((v) => v.version === q.current_version) || versions[versions.length - 1] || {};
    const calc = calculateQuotation({
      systemCapacityKw: Number(q.system_capacity_kw) || 5,
      packageTier: q.package_tier || "Premium Bifacial",
      discountAmount: Number(q.discount_amount) || 0,
      isSurveyApproved: q.proposal_type === "Final_Technical",
      taxMode: q.tax_mode,
      customerAddress: q.customer_address
    });
    const pdfData = {
      quotationNumber: q.quotation_number || `${q.id}-V1`,
      versionNumber: q.current_version || 1,
      createdAt: q.created_at,
      validUntil: q.valid_until || new Date(Date.now() + 864e5 * 14).toISOString().split("T")[0],
      leadName: q.lead_name,
      customerPhone: q.customer_phone,
      customerAddress: q.customer_address || "Bengaluru, Karnataka",
      systemCapacityKw: Number(q.system_capacity_kw) || 5,
      actualCapacityKwp: calc.actualCapacityKwp,
      packageTier: q.package_tier || "Premium Bifacial",
      proposalType: q.proposal_type || "Final_Technical",
      salespersonName: q.salesperson_name || "Vikram Mehta (Sales)",
      taxMode: q.tax_mode || calc.taxMode,
      taxType: activeVer.taxType || calc.taxType,
      items: activeVer.items || calc.items,
      subtotal: Number(q.subtotal) || calc.subtotal,
      discountAmount: Number(q.discount_amount) || 0,
      taxableAmount: Number(q.taxable_amount) || calc.taxableAmount,
      gstRate: Number(q.gst_rate) || calc.gstRate,
      cgstAmount: Number(q.total_cgst) || calc.cgstAmount,
      sgstAmount: Number(q.total_sgst) || calc.sgstAmount,
      igstAmount: Number(q.total_igst) || calc.igstAmount,
      gstAmount: Number(q.gst_amount) || calc.gstAmount,
      finalContractAmount: Number(q.total_amount) || calc.finalContractAmount,
      amountInWords: q.amount_in_words || calc.amountInWords,
      subsidyEligible: calc.subsidyEligible,
      subsidyAmount: Number(q.subsidy_amount) || calc.subsidyAmount,
      indicativeNetCustomerCost: calc.indicativeNetCustomerCost,
      annualGenerationKwh: calc.annualGenerationKwh,
      annualSavingsInr: calc.annualSavingsInr,
      lifetimeSavings25Yr: calc.lifetimeSavings25Yr,
      simplePaybackYears: calc.simplePaybackYears,
      terms: activeVer.terms || calc.terms
    };
    const { filePath, fileUrl } = await generateProposalPdf(pdfData);
    await pool.query("UPDATE quotations SET pdf_url = ? WHERE id = ?", [fileUrl, id]);
    const isDownload = req.query.download === "true";
    const filename = `AB_Energy_Proposal_${pdfData.quotationNumber.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    if (isDownload) {
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    } else {
      res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
    }
    return res.sendFile(path3.resolve(filePath));
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// server/routes/quotations.routes.ts
var quotationsRouter = Router4();
quotationsRouter.post(
  "/calculate",
  authenticateToken,
  requireRole(["Sales Executive", "Sales Manager", "Survey Engineer", "Project Manager", "Super Admin"]),
  calculateQuotationPreview
);
quotationsRouter.get("/", authenticateToken, getQuotations);
quotationsRouter.get("/:id", authenticateToken, getQuotationById);
quotationsRouter.post(
  "/",
  authenticateToken,
  requireRole(["Sales Executive", "Sales Manager", "Project Manager", "Super Admin"]),
  createQuotation
);
quotationsRouter.post(
  "/:id/revisions",
  authenticateToken,
  requireRole(["Sales Executive", "Sales Manager", "Super Admin"]),
  createQuotationRevision
);
quotationsRouter.put(
  "/:id/approve",
  authenticateToken,
  requireRole(["Sales Manager", "Super Admin"]),
  approveQuotationDiscount
);
quotationsRouter.put(
  "/:id/edit",
  authenticateToken,
  requireRole(["Sales Executive", "Sales Manager", "Super Admin"]),
  editQuotation
);
quotationsRouter.put(
  "/:id/customer-accept",
  authenticateToken,
  requireRole(["Sales Executive", "Sales Manager", "Super Admin", "Customer"]),
  recordCustomerAcceptance
);
quotationsRouter.put(
  "/:id",
  authenticateToken,
  requireRole(["Sales Executive", "Sales Manager", "Survey Engineer", "Project Manager", "Super Admin"]),
  updateQuotation
);
quotationsRouter.post(
  "/:id/accept",
  authenticateToken,
  requireRole(["Project Manager", "Super Admin"]),
  acceptQuotation
);
quotationsRouter.get("/:id/pdf", optionalAuth, downloadProposalPdf);

// server/routes/customers.routes.ts
import { Router as Router5 } from "express";

// server/controllers/customers.controller.ts
var createCustomer = async (req, res) => {
  try {
    const c = req.body;
    await pool.query(
      `INSERT INTO customers (id, name, email, phone, alternate_phone, address, city, state, pincode, consumer_number_discom, discom_name, gstin, converted_from_lead_id, total_system_kw, total_order_value, paid_amount, balance_amount, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        c.id,
        c.name,
        c.email || "",
        c.phone,
        c.alternatePhone || null,
        c.address,
        c.city || "Bengaluru",
        c.state || "Karnataka",
        c.pincode || "560001",
        c.consumerNumberDiscom || null,
        c.discomName || "BESCOM",
        c.gstin || null,
        c.convertedFromLeadId || null,
        c.totalSystemKw || 0,
        c.totalOrderValue || 0,
        c.paidAmount || 0,
        c.balanceAmount || 0,
        c.status || "Active",
        c.createdAt || (/* @__PURE__ */ new Date()).toISOString()
      ]
    );
    res.json({ success: true, customer: c });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
var updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const fields = [];
    const values = [];
    if (updates.paidAmount !== void 0) {
      fields.push("paid_amount = ?");
      values.push(updates.paidAmount);
    }
    if (updates.balanceAmount !== void 0) {
      fields.push("balance_amount = ?");
      values.push(updates.balanceAmount);
    }
    if (updates.status !== void 0) {
      fields.push("status = ?");
      values.push(updates.status);
    }
    if (updates.address !== void 0) {
      fields.push("address = ?");
      values.push(updates.address);
    }
    if (updates.phone !== void 0) {
      fields.push("phone = ?");
      values.push(updates.phone);
    }
    if (updates.email !== void 0) {
      fields.push("email = ?");
      values.push(updates.email);
    }
    if (fields.length > 0) {
      values.push(id);
      await pool.query(`UPDATE customers SET ${fields.join(", ")} WHERE id = ?`, values);
    }
    res.json({ success: true, id, updates });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
var createOrUpdateCustomerPortalAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, error: "Please provide both username and password." });
    }
    const [custRows] = await pool.query("SELECT id, name, email, phone FROM customers WHERE id = ?", [id]);
    if (!custRows || custRows.length === 0) {
      return res.status(404).json({ success: false, error: "Customer not found." });
    }
    const customer = custRows[0];
    const cleanUsername = username.trim().toLowerCase();
    const [existingUsers] = await pool.query(
      "SELECT id, customer_id FROM user_accounts WHERE username = ? LIMIT 1",
      [cleanUsername]
    );
    if (existingUsers && existingUsers.length > 0 && existingUsers[0].customer_id !== id) {
      return res.status(400).json({ success: false, error: `Username "${cleanUsername}" is already in use.` });
    }
    const { hash, salt } = hashPassword(password);
    const [userByCust] = await pool.query(
      'SELECT id FROM user_accounts WHERE customer_id = ? AND role = "Customer" LIMIT 1',
      [id]
    );
    let userId;
    if (userByCust && userByCust.length > 0) {
      userId = userByCust[0].id;
      await pool.query(
        `UPDATE user_accounts 
         SET username = ?, password_hash = ?, password_salt = ?, is_active = TRUE, name = ?, email = ?
         WHERE id = ?`,
        [cleanUsername, hash, salt, customer.name, customer.email || `${cleanUsername}@customer.abenergy.in`, userId]
      );
    } else {
      userId = `USR-CUST-${Date.now().toString().slice(-6)}`;
      await pool.query(
        `INSERT INTO user_accounts (id, username, email, password_hash, password_salt, role, employee_id, customer_id, name, is_active)
         VALUES (?, ?, ?, ?, ?, 'Customer', NULL, ?, ?, TRUE)`,
        [userId, cleanUsername, customer.email || `${cleanUsername}@customer.abenergy.in`, hash, salt, id, customer.name]
      );
    }
    res.json({
      success: true,
      message: "Customer portal access configured successfully.",
      portalAccount: {
        customerId: id,
        username: cleanUsername,
        customerName: customer.name
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
var getCustomerPortalAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      'SELECT username, is_active, created_at FROM user_accounts WHERE customer_id = ? AND role = "Customer" LIMIT 1',
      [id]
    );
    if (rows && rows.length > 0) {
      res.json({
        success: true,
        hasAccount: true,
        username: rows[0].username,
        isActive: Boolean(rows[0].is_active),
        createdAt: rows[0].created_at
      });
    } else {
      res.json({
        success: true,
        hasAccount: false,
        username: null
      });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// server/routes/customers.routes.ts
var customersRouter = Router5();
customersRouter.post("/", authenticateToken, requireRole(["Sales Manager", "Sales Executive", "Project Manager", "Accounts"]), createCustomer);
customersRouter.post("/:id/portal-account", authenticateToken, requireRole(["Sales Manager", "Sales Executive", "Project Manager", "Accounts"]), createOrUpdateCustomerPortalAccount);
customersRouter.get("/:id/portal-account", authenticateToken, getCustomerPortalAccount);
customersRouter.put("/:id", authenticateToken, requireCustomerOwnership(), updateCustomer);

// server/routes/projects.routes.ts
import { Router as Router6 } from "express";

// server/controllers/notifications.controller.ts
async function createNotification(params) {
  try {
    const id = `NOTIF-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const role = params.recipientRole || "All";
    await pool.query(
      `INSERT INTO notifications (id, recipient_role, target_role, title, message, type, link, is_read, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, NOW())`,
      [
        id,
        role,
        role,
        params.title,
        params.message,
        params.type || "info",
        params.link || null
      ]
    );
  } catch (err) {
    console.error("Error creating notification:", err.message);
  }
}
async function getNotifications(req, res) {
  try {
    const userRole = req.user?.role || "All";
    const [rows] = await pool.query(
      `SELECT * FROM notifications 
       WHERE (recipient_role IN ('All', ?) OR target_role IN ('All', ?)) 
       ORDER BY created_at DESC LIMIT 60`,
      [userRole, userRole]
    );
    res.json({ success: true, notifications: rows });
  } catch (err) {
    console.error("Error fetching notifications:", err);
    res.status(500).json({ success: false, error: err.message });
  }
}
async function markNotificationRead(req, res) {
  try {
    const { id } = req.params;
    await pool.query("UPDATE notifications SET is_read = 1 WHERE id = ?", [id]);
    res.json({ success: true });
  } catch (err) {
    console.error("Error marking notification as read:", err);
    res.status(500).json({ success: false, error: err.message });
  }
}

// server/controllers/projects.controller.ts
var createProject = async (req, res) => {
  try {
    const p = req.body;
    await pool.query(
      `INSERT INTO projects (id, customer_id, customer_name, customer_phone, customer_address, quotation_id, capacity_kw, total_amount, stage, start_date, target_completion_date, project_manager_id, project_manager_name, installation_lead_id, installation_lead_name, checklist, tasks, inventory_reserved, material_shortage_flag, shortage_details, commissioning_date, net_meter_installed_date, warranty_activated, amc_initiated, discom_sanction_number, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        p.id,
        p.customerId,
        p.customerName,
        p.customerPhone || "",
        p.customerAddress || "",
        p.quotationId,
        p.capacityKw || 0,
        p.totalAmount || 0,
        p.stage,
        p.startDate,
        p.targetCompletionDate,
        p.projectManagerId,
        p.projectManagerName,
        p.installationLeadId,
        p.installationLeadName,
        JSON.stringify(p.checklist || {}),
        JSON.stringify(p.tasks || []),
        p.inventoryReserved ? 1 : 0,
        p.materialShortageFlag ? 1 : 0,
        p.shortageDetails || null,
        p.commissioningDate || null,
        p.netMeterInstalledDate || null,
        p.warrantyActivated ? 1 : 0,
        p.amcInitiated ? 1 : 0,
        p.discomSanctionNumber || null,
        p.notes || ""
      ]
    );
    res.json({ success: true, project: p });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
var updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const fields = [];
    const values = [];
    if (updates.stage !== void 0) {
      fields.push("stage = ?");
      values.push(updates.stage);
    }
    if (updates.checklist !== void 0) {
      fields.push("checklist = ?");
      values.push(JSON.stringify(updates.checklist));
    }
    if (updates.tasks !== void 0) {
      fields.push("tasks = ?");
      values.push(JSON.stringify(updates.tasks));
    }
    if (updates.commissioningDate !== void 0) {
      fields.push("commissioning_date = ?");
      values.push(updates.commissioningDate);
    }
    if (updates.netMeterInstalledDate !== void 0) {
      fields.push("net_meter_installed_date = ?");
      values.push(updates.netMeterInstalledDate);
    }
    if (updates.siteReadinessConfirmed !== void 0) {
      fields.push("site_readiness_confirmed = ?");
      values.push(updates.siteReadinessConfirmed ? 1 : 0);
    }
    if (updates.siteReadinessNotes !== void 0) {
      fields.push("site_readiness_notes = ?");
      values.push(updates.siteReadinessNotes);
    }
    if (updates.scheduledInstallationDate !== void 0) {
      fields.push("scheduled_installation_date = ?");
      values.push(updates.scheduledInstallationDate);
    }
    if (fields.length > 0) {
      values.push(id);
      await pool.query(`UPDATE projects SET ${fields.join(", ")} WHERE id = ?`, values);
    }
    res.json({ success: true, id, updates });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
var confirmSiteReadiness = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      scheduledInstallationDate,
      siteReadinessNotes,
      shadowFreeConfirmed,
      civilIntegrityConfirmed,
      electricalClearanceConfirmed
    } = req.body;
    const [rows] = await pool.query("SELECT * FROM projects WHERE id = ?", [id]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, error: "Project not found" });
    }
    const project = rows[0];
    const notesSummary = [
      siteReadinessNotes || "",
      shadowFreeConfirmed ? "\u2713 Shadow-free roof clearance verified" : "",
      civilIntegrityConfirmed ? "\u2713 Civil structure integrity & anchor points approved" : "",
      electricalClearanceConfirmed ? "\u2713 LT panel & electrical tie-in clearance verified" : ""
    ].filter(Boolean).join(" | ");
    await pool.query(
      `UPDATE projects 
       SET site_readiness_confirmed = 1,
           site_readiness_date = NOW(),
           site_readiness_notes = ?,
           scheduled_installation_date = ?,
           stage = 'Installation Scheduled'
       WHERE id = ?`,
      [notesSummary, scheduledInstallationDate || null, id]
    );
    await createNotification({
      recipientRole: "Installation Team",
      title: `Site Readiness Approved (${id})`,
      message: `Project Manager confirmed site readiness for Project ${id} (${project.customer_name}). Installation scheduled for ${scheduledInstallationDate || "Immediately"}. Installation team may now start physical works.`,
      type: "success"
    });
    res.json({
      success: true,
      message: "Site readiness confirmed by Project Manager. Installation team cleared to begin execution.",
      project: {
        id,
        siteReadinessConfirmed: true,
        scheduledInstallationDate,
        stage: "Installation Scheduled"
      }
    });
  } catch (err) {
    console.error("Error confirming site readiness:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// server/routes/projects.routes.ts
var projectsRouter = Router6();
projectsRouter.post("/", authenticateToken, requireRole(["Project Manager", "Super Admin"]), createProject);
projectsRouter.put("/:id", authenticateToken, requireRole(["Project Manager", "Installation Team", "Super Admin"]), updateProject);
projectsRouter.post("/:id/confirm-readiness", authenticateToken, requireRole(["Project Manager", "Super Admin"]), confirmSiteReadiness);

// server/routes/finance.routes.ts
import { Router as Router7 } from "express";

// server/controllers/finance.controller.ts
var createInvoice = async (req, res) => {
  try {
    const inv = req.body;
    const invId = inv.id || `INV-${Date.now()}`;
    const issueDate = inv.issueDate || (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const dueDate = inv.dueDate || issueDate;
    const items = JSON.stringify(inv.items || []);
    await pool.query(
      `INSERT INTO invoices (id, invoice_number, project_id, customer_id, customer_name, customer_phone, customer_gstin, issue_date, due_date, items, subtotal, cgst, sgst, igst, total_amount, paid_amount, balance_due, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        invId,
        inv.invoiceNumber || `INV-${Date.now().toString().slice(-6)}`,
        inv.projectId || null,
        inv.customerId || null,
        inv.customerName || "Customer",
        inv.customerPhone || "",
        inv.customerGstin || null,
        issueDate,
        dueDate,
        items,
        inv.subtotal || 0,
        inv.cgst || 0,
        inv.sgst || 0,
        inv.igst || 0,
        inv.totalAmount || inv.amount || 0,
        inv.paidAmount || 0,
        inv.balanceDue || inv.totalAmount || 0,
        inv.status || "Draft"
      ]
    );
    res.status(201).json({ success: true, invoice: { ...inv, id: invId } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
var updateInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const fields = [];
    const values = [];
    if (updates.paidAmount !== void 0) {
      fields.push("paid_amount = ?");
      values.push(updates.paidAmount);
    }
    if (updates.balanceDue !== void 0) {
      fields.push("balance_due = ?");
      values.push(updates.balanceDue);
    }
    if (updates.status !== void 0) {
      fields.push("status = ?");
      values.push(updates.status);
    }
    if (fields.length > 0) {
      values.push(id);
      await pool.query(`UPDATE invoices SET ${fields.join(", ")} WHERE id = ?`, values);
    }
    res.json({ success: true, id, updates });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
var createPayment = async (req, res) => {
  try {
    const pay = req.body;
    const payId = pay.id || `PAY-${Date.now()}`;
    const paymentDate = pay.paymentDate || (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const transRef = pay.transactionReference || pay.transactionRef || `TXN-${Date.now().toString().slice(-6)}`;
    const recordedBy = pay.recordedBy || req.user?.name || "Accounts Team";
    await pool.query(
      `INSERT INTO payments (id, payment_number, invoice_id, project_id, customer_id, customer_name, amount, payment_date, payment_mode, transaction_reference, bank_name, status, recorded_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        payId,
        pay.paymentNumber || `PAY-${Date.now().toString().slice(-6)}`,
        pay.invoiceId || null,
        pay.projectId || null,
        pay.customerId || null,
        pay.customerName || "Customer",
        pay.amount || 0,
        paymentDate,
        pay.paymentMode || "NEFT",
        transRef,
        pay.bankName || null,
        pay.status || "Success",
        recordedBy
      ]
    );
    res.status(201).json({ success: true, payment: { ...pay, id: payId } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// server/routes/finance.routes.ts
var financeRouter = Router7();
financeRouter.get("/invoices", authenticateToken, requireRole(["Accounts"]), async (_req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM invoices ORDER BY issue_date DESC");
    res.json({ success: true, invoices: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
financeRouter.post("/invoices", authenticateToken, requireRole(["Accounts"]), createInvoice);
financeRouter.put("/invoices/:id", authenticateToken, requireRole(["Accounts"]), updateInvoice);
financeRouter.get("/payments", authenticateToken, requireRole(["Accounts"]), async (_req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM payments ORDER BY payment_date DESC");
    res.json({ success: true, payments: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
financeRouter.post("/payments", authenticateToken, requireRole(["Accounts"]), createPayment);

// server/routes/service.routes.ts
import { Router as Router8 } from "express";

// server/controllers/service.controller.ts
var createWarranty = async (req, res) => {
  try {
    const w = req.body;
    await pool.query(
      `INSERT INTO warranties (id, project_id, customer_id, customer_name, equipment_type, make_model, serial_number, warranty_period_years, start_date, end_date, days_remaining, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        w.id,
        w.projectId,
        w.customerId,
        w.customerName,
        w.equipmentType,
        w.makeModel,
        w.serialNumber,
        w.warrantyPeriodYears || 10,
        w.startDate,
        w.endDate,
        w.daysRemaining || 9125,
        w.status || "Active"
      ]
    );
    res.json({ success: true, warranty: w });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
var updateWarranty = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const fields = [];
    const values = [];
    if (updates.status !== void 0) {
      fields.push("status = ?");
      values.push(updates.status);
    }
    if (updates.daysRemaining !== void 0) {
      fields.push("days_remaining = ?");
      values.push(updates.daysRemaining);
    }
    if (fields.length > 0) {
      values.push(id);
      await pool.query(`UPDATE warranties SET ${fields.join(", ")} WHERE id = ?`, values);
    }
    res.json({ success: true, id, updates });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
var createServiceTicket = async (req, res) => {
  try {
    const t = req.body;
    await pool.query(
      `INSERT INTO service_tickets (id, ticket_number, customer_id, customer_name, phone, customer_address, project_id, issue_category, severity, status, technician_id, technician_name, description, created_at, scheduled_date, resolved_at, resolution_notes, customer_feedback_score)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [t.id, t.ticketNumber, t.customerId, t.customerName, t.customerPhone, t.customerAddress, t.projectId || null, t.issueCategory, t.severity, t.status, t.technicianId || null, t.technicianName || null, t.description, t.createdAt, t.scheduledDate || null, t.resolvedAt || null, t.resolutionNotes || null, t.customerFeedbackScore || 5]
    );
    res.json({ success: true, ticket: t });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
var updateServiceTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const fields = [];
    const values = [];
    if (updates.status !== void 0) {
      fields.push("status = ?");
      values.push(updates.status);
    }
    if (updates.resolvedAt !== void 0) {
      fields.push("resolved_at = ?");
      values.push(updates.resolvedAt);
    }
    if (updates.resolutionNotes !== void 0) {
      fields.push("resolution_notes = ?");
      values.push(updates.resolutionNotes);
    }
    if (fields.length > 0) {
      values.push(id);
      await pool.query(`UPDATE service_tickets SET ${fields.join(", ")} WHERE id = ?`, values);
    }
    res.json({ success: true, id, updates });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// server/routes/service.routes.ts
var serviceRouter = Router8();
serviceRouter.post("/warranties", authenticateToken, requireRole(["Service Team", "Project Manager"]), createWarranty);
serviceRouter.put("/warranties/:id", authenticateToken, requireRole(["Service Team"]), updateWarranty);
serviceRouter.post("/service-tickets", authenticateToken, requireCustomerOwnership((req) => req.body.customerId), createServiceTicket);
serviceRouter.put("/service-tickets/:id", authenticateToken, requireRole(["Service Team"]), updateServiceTicket);

// server/routes/inventory.routes.ts
import { Router as Router9 } from "express";

// server/controllers/inventory.controller.ts
var reserveInventory = async (req, res) => {
  try {
    const { category, quantity, sku, productId } = req.body;
    const qty = Number(quantity) || 0;
    if (qty > 0) {
      if (productId || sku) {
        await pool.query(
          `UPDATE inventory_products 
           SET reserved_stock = reserved_stock + ?, available_stock = GREATEST(0, available_stock - ?)
           WHERE id = ? OR sku = ? LIMIT 1`,
          [qty, qty, productId || "", sku || ""]
        );
      } else if (category) {
        await pool.query(
          `UPDATE inventory_products 
           SET reserved_stock = reserved_stock + ?, available_stock = GREATEST(0, available_stock - ?)
           WHERE category = ? LIMIT 1`,
          [qty, qty, category]
        );
      }
    }
    res.json({ success: true, category, sku, productId, quantity: qty });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// server/routes/inventory.routes.ts
var inventoryRouter = Router9();
inventoryRouter.post("/reserve", authenticateToken, requireRole(["Project Manager", "Installation Team"]), reserveInventory);

// server/routes/users.routes.ts
import { Router as Router10 } from "express";

// server/controllers/users.controller.ts
var getUsers = async (req, res) => {
  try {
    const currentUser = req.user;
    if (!currentUser) {
      return res.status(401).json({ success: false, error: "Authentication required" });
    }
    let query = `
      SELECT u.id, u.username, u.email, u.role, u.name, u.is_active, u.created_at,
             e.department, e.phone, e.location, e.active_leads_count, e.completed_projects_count
      FROM user_accounts u
      LEFT JOIN employees e ON (u.employee_id = e.id OR u.username = e.username)
    `;
    const params = [];
    if (currentUser.role === "Sales Manager") {
      query += ` WHERE u.role = 'Sales Executive'`;
    } else if (currentUser.role === "Project Manager") {
      query += ` WHERE u.role = 'Installation Team'`;
    } else if (currentUser.role !== "Super Admin") {
      query += ` WHERE 1 = 0`;
    }
    query += ` ORDER BY u.created_at DESC`;
    const [rows] = await pool.query(query, params);
    const formattedUsers = rows.map((r) => ({
      id: r.id,
      username: r.username,
      email: r.email,
      phone: r.phone || "",
      name: r.name,
      role: r.role,
      department: r.department || "",
      location: r.location || "",
      isActive: Boolean(r.is_active),
      createdAt: r.created_at,
      activeLeadsCount: r.active_leads_count || 0,
      completedProjectsCount: r.completed_projects_count || 0
    }));
    res.json({
      success: true,
      data: formattedUsers,
      users: formattedUsers
    });
  } catch (error) {
    console.error("getUsers error:", error);
    res.status(500).json({ success: false, error: "Failed to retrieve users" });
  }
};
var createUser = async (req, res) => {
  try {
    const currentUser = req.user;
    if (!currentUser) {
      return res.status(401).json({ success: false, error: "Authentication required" });
    }
    const { username, password, name, email, phone, role, department, location } = req.body;
    if (!username || !password || !name || !role) {
      return res.status(400).json({ success: false, error: "Username, password, full name, and role are required" });
    }
    if (currentUser.role === "Sales Manager" && role !== "Sales Executive") {
      return res.status(403).json({ success: false, error: "Sales Managers may only create Sales Executive accounts" });
    }
    if (currentUser.role === "Project Manager" && role !== "Installation Team") {
      return res.status(403).json({ success: false, error: "Project Managers may only create Installation Team accounts" });
    }
    if (currentUser.role !== "Super Admin" && currentUser.role !== "Sales Manager" && currentUser.role !== "Project Manager") {
      return res.status(403).json({ success: false, error: "Unauthorized to create user accounts" });
    }
    const [existing] = await pool.query(
      'SELECT id FROM user_accounts WHERE username = ? OR (email = ? AND email != "") LIMIT 1',
      [username.trim(), (email || "").trim()]
    );
    if (existing && existing.length > 0) {
      return res.status(409).json({ success: false, error: "Username or email already in use" });
    }
    const { hash, salt } = hashPassword(password);
    const userId = `USR-${Date.now().toString().slice(-6)}`;
    const empId = `EMP-${Date.now().toString().slice(-4)}`;
    await pool.query(
      `INSERT INTO user_accounts (id, username, email, password_hash, password_salt, role, employee_id, customer_id, name, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?, TRUE)`,
      [userId, username.trim(), (email || "").trim(), hash, salt, role, empId, name.trim()]
    );
    if (role !== "Customer") {
      await pool.query(
        `INSERT INTO employees (id, name, email, phone, role, department, location, active_leads_count, completed_projects_count, username)
         VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, ?)
         ON DUPLICATE KEY UPDATE name = VALUES(name), role = VALUES(role), department = VALUES(department), location = VALUES(location)`,
        [empId, name.trim(), (email || `${username.trim()}@abenergy.in`).trim(), phone || "+91 98000-00000", role, department || "Solar Operations", location || "Bengaluru", username.trim()]
      );
    }
    res.status(201).json({
      success: true,
      message: `User ${username} created successfully with role ${role}`,
      user: {
        id: userId,
        username,
        name,
        role,
        department: department || "Solar Operations",
        isActive: true
      }
    });
  } catch (error) {
    console.error("createUser error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to create user" });
  }
};
var updateUser = async (req, res) => {
  try {
    const currentUser = req.user;
    if (!currentUser) {
      return res.status(401).json({ success: false, error: "Authentication required" });
    }
    const { id } = req.params;
    const { name, email, phone, role, department, location, password } = req.body;
    const [existing] = await pool.query("SELECT * FROM user_accounts WHERE id = ? LIMIT 1", [id]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({ success: false, error: "User account not found" });
    }
    const target = existing[0];
    if (currentUser.role === "Sales Manager" && target.role !== "Sales Executive") {
      return res.status(403).json({ success: false, error: "Sales Manager can only update Sales Executive accounts" });
    }
    if (currentUser.role === "Project Manager" && target.role !== "Installation Team") {
      return res.status(403).json({ success: false, error: "Project Manager can only update Installation Team accounts" });
    }
    if (currentUser.role !== "Super Admin" && currentUser.role !== "Sales Manager" && currentUser.role !== "Project Manager") {
      return res.status(403).json({ success: false, error: "Unauthorized to modify user accounts" });
    }
    let updatedRole = target.role;
    if (role && role !== target.role) {
      if (currentUser.role !== "Super Admin") {
        return res.status(403).json({ success: false, error: "Only Super Admin can change account roles" });
      }
      updatedRole = role;
    }
    if (password && password.trim().length >= 6) {
      const { hash, salt } = hashPassword(password);
      await pool.query(
        `UPDATE user_accounts 
         SET name = COALESCE(?, name), email = COALESCE(?, email), role = ?, password_hash = ?, password_salt = ?
         WHERE id = ?`,
        [name, email, updatedRole, hash, salt, id]
      );
    } else {
      await pool.query(
        `UPDATE user_accounts 
         SET name = COALESCE(?, name), email = COALESCE(?, email), role = ?
         WHERE id = ?`,
        [name, email, updatedRole, id]
      );
    }
    if (target.employee_id || target.username) {
      await pool.query(
        `UPDATE employees 
         SET name = COALESCE(?, name), email = COALESCE(?, email), phone = COALESCE(?, phone), role = ?, department = COALESCE(?, department), location = COALESCE(?, location)
         WHERE id = ? OR username = ?`,
        [name, email, phone, updatedRole, department, location, target.employee_id, target.username]
      );
    }
    res.json({
      success: true,
      message: "User account updated successfully"
    });
  } catch (error) {
    console.error("updateUser error:", error);
    res.status(500).json({ success: false, error: "Failed to update user" });
  }
};
var toggleUserStatus = async (req, res) => {
  try {
    const currentUser = req.user;
    if (!currentUser) {
      return res.status(401).json({ success: false, error: "Authentication required" });
    }
    const { id } = req.params;
    const [existing] = await pool.query("SELECT * FROM user_accounts WHERE id = ? LIMIT 1", [id]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({ success: false, error: "User account not found" });
    }
    const target = existing[0];
    if (currentUser.role === "Sales Manager" && target.role !== "Sales Executive") {
      return res.status(403).json({ success: false, error: "Permission denied" });
    }
    if (currentUser.role === "Project Manager" && target.role !== "Installation Team") {
      return res.status(403).json({ success: false, error: "Permission denied" });
    }
    if (currentUser.role !== "Super Admin" && currentUser.role !== "Sales Manager" && currentUser.role !== "Project Manager") {
      return res.status(403).json({ success: false, error: "Permission denied" });
    }
    if (target.id === currentUser.userId || target.username === currentUser.username) {
      return res.status(400).json({ success: false, error: "Cannot deactivate your own active session account" });
    }
    const newStatus = !target.is_active;
    await pool.query("UPDATE user_accounts SET is_active = ? WHERE id = ?", [newStatus, id]);
    res.json({
      success: true,
      message: `User account ${newStatus ? "activated" : "deactivated"} successfully`,
      isActive: newStatus
    });
  } catch (error) {
    console.error("toggleUserStatus error:", error);
    res.status(500).json({ success: false, error: "Failed to toggle account status" });
  }
};
var importUsers = async (req, res) => {
  try {
    const currentUser = req.user;
    if (!currentUser) {
      return res.status(401).json({ success: false, error: "Authentication required" });
    }
    const { users } = req.body;
    if (!Array.isArray(users) || users.length === 0) {
      return res.status(400).json({ success: false, error: "No users provided for import" });
    }
    const imported = [];
    const skipped = [];
    const errors = [];
    for (const u of users) {
      const name = (u.Name || u.name || "").trim();
      const username = (u.Username || u.username || "").trim();
      const password = (u.Password || u.password || "").trim();
      let role = (u.Role || u.role || "").trim();
      const email = (u.Email || u.email || `${username}@abenergy.in`).trim();
      const phone = (u.Phone || u.phone || "+91 98000-00000").trim();
      const department = (u.Department || u.department || "").trim();
      const location = (u.Location || u.location || "Bengaluru").trim();
      if (!name || !username || !password) {
        errors.push(`Row for ${name || username || "unknown"} missing mandatory Name, Username, or Password`);
        continue;
      }
      if (currentUser.role === "Sales Manager") {
        role = "Sales Executive";
      } else if (currentUser.role === "Project Manager") {
        role = "Installation Team";
      } else if (!role) {
        role = "Sales Executive";
      }
      const [existing] = await pool.query(
        'SELECT id FROM user_accounts WHERE username = ? OR (email = ? AND email != "") LIMIT 1',
        [username, email]
      );
      if (existing && existing.length > 0) {
        skipped.push(username);
        continue;
      }
      const { hash, salt } = hashPassword(password);
      const userId = `USR-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 90 + 10)}`;
      const empId = `EMP-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 90 + 10)}`;
      await pool.query(
        `INSERT INTO user_accounts (id, username, email, password_hash, password_salt, role, employee_id, customer_id, name, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?, TRUE)`,
        [userId, username, email, hash, salt, role, empId, name]
      );
      if (role !== "Customer") {
        await pool.query(
          `INSERT INTO employees (id, name, email, phone, role, department, location, active_leads_count, completed_projects_count, username)
           VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, ?)
           ON DUPLICATE KEY UPDATE name = VALUES(name), role = VALUES(role), department = VALUES(department), location = VALUES(location)`,
          [empId, name, email, phone, role, department || "Solar Operations", location, username]
        );
      }
      imported.push(username);
    }
    res.json({
      success: true,
      message: `Import complete: ${imported.length} imported, ${skipped.length} existing skipped, ${errors.length} errors`,
      count: imported.length,
      imported,
      skipped,
      errors
    });
  } catch (error) {
    console.error("importUsers error:", error);
    res.status(500).json({ success: false, error: error.message || "Bulk import failed" });
  }
};

// server/routes/users.routes.ts
var usersRouter = Router10();
usersRouter.use(authenticateToken);
usersRouter.get("/", getUsers);
usersRouter.post("/", createUser);
usersRouter.post("/import", importUsers);
usersRouter.put("/:id", updateUser);
usersRouter.post("/:id/toggle-status", toggleUserStatus);

// server/routes/audit.routes.ts
import { Router as Router11 } from "express";

// server/controllers/audit.controller.ts
var getAuditLogs = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 10));
    const offset = (page - 1) * limit;
    const search = (req.query.search || "").trim();
    const category = (req.query.category || "all").trim();
    const status = (req.query.status || "all").trim();
    const startDate = req.query.startDate || "";
    const endDate = req.query.endDate || "";
    let whereClauses = [];
    let params = [];
    if (search) {
      whereClauses.push("(action LIKE ? OR user_name LIKE ? OR details LIKE ? OR target_entity_id LIKE ? OR ip_address LIKE ?)");
      const s = `%${search}%`;
      params.push(s, s, s, s, s);
    }
    if (category && category !== "all") {
      whereClauses.push("category = ?");
      params.push(category);
    }
    if (status && status !== "all") {
      whereClauses.push("status = ?");
      params.push(status);
    }
    if (startDate) {
      whereClauses.push("created_at >= ?");
      params.push(`${startDate} 00:00:00`);
    }
    if (endDate) {
      whereClauses.push("created_at <= ?");
      params.push(`${endDate} 23:59:59`);
    }
    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";
    const [countRows] = await pool.query(
      `SELECT COUNT(*) as total FROM audit_logs ${whereSql}`,
      params
    );
    const total = countRows[0]?.total || 0;
    const totalPages = Math.ceil(total / limit) || 1;
    const [rows] = await pool.query(
      `SELECT id, user_id, user_name, user_role, action, category, details, target_entity_id, target_entity_type, ip_address, status, metadata, created_at 
       FROM audit_logs 
       ${whereSql} 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    const logs = rows.map((r) => ({
      id: r.id,
      userId: r.user_id,
      userName: r.user_name,
      userRole: r.user_role,
      action: r.action,
      category: r.category,
      details: r.details,
      targetEntityId: r.target_entity_id,
      targetEntityType: r.target_entity_type,
      ipAddress: r.ip_address,
      status: r.status,
      metadata: r.metadata ? typeof r.metadata === "string" ? JSON.parse(r.metadata) : r.metadata : null,
      createdAt: r.created_at
    }));
    res.json({
      success: true,
      data: logs,
      pagination: {
        total,
        page,
        limit,
        totalPages
      }
    });
  } catch (err) {
    console.error("Error fetching audit logs:", err);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve audit logs from database",
      details: err?.message
    });
  }
};
var createAuditLog = async (req, res) => {
  try {
    const { action, category, details, targetEntityId, targetEntityType, status, metadata } = req.body;
    const user2 = req.user;
    const id = `AUD-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const ipAddress = req.ip || req.socket.remoteAddress || "127.0.0.1";
    await pool.query(
      `INSERT INTO audit_logs (id, user_id, user_name, user_role, action, category, details, target_entity_id, target_entity_type, ip_address, status, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        user2?.userId || user2?.id || "SYSTEM",
        user2?.name || "System User",
        user2?.role || "Super Admin",
        action || "SYSTEM_ACTION",
        category || "Security",
        details || "",
        targetEntityId || null,
        targetEntityType || null,
        ipAddress,
        status || "Success",
        metadata ? typeof metadata === "string" ? metadata : JSON.stringify(metadata) : null
      ]
    );
    res.status(201).json({
      success: true,
      data: { id }
    });
  } catch (err) {
    console.error("Error creating audit log:", err);
    res.status(500).json({
      success: false,
      error: "Failed to record audit log"
    });
  }
};

// server/routes/audit.routes.ts
var auditRouter = Router11();
auditRouter.get("/", authenticateToken, getAuditLogs);
auditRouter.post("/", authenticateToken, createAuditLog);

// server/routes/documents.routes.ts
import { Router as Router12 } from "express";

// server/controllers/documents.controller.ts
import path4 from "path";
import fs3 from "fs";
var SECURE_DOCS_DIR = path4.resolve(process.cwd(), "storage", "secure_documents");
function ensureSecureDir() {
  if (!fs3.existsSync(SECURE_DOCS_DIR)) {
    fs3.mkdirSync(SECURE_DOCS_DIR, { recursive: true });
  }
}
function saveBase64File(base64Data, prefix) {
  ensureSecureDir();
  const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  let buffer;
  let ext = "jpg";
  if (matches && matches.length === 3) {
    buffer = Buffer.from(matches[2], "base64");
    if (matches[1].includes("png")) ext = "png";
    else if (matches[1].includes("webp")) ext = "webp";
    else if (matches[1].includes("pdf")) ext = "pdf";
  } else {
    buffer = Buffer.from(base64Data, "base64");
  }
  const safeFileName = `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const fullDiskPath = path4.join(SECURE_DOCS_DIR, safeFileName);
  fs3.writeFileSync(fullDiskPath, buffer);
  return { fileName: safeFileName, filePath: fullDiskPath };
}
var uploadCustomerDocument = async (req, res) => {
  try {
    const user2 = req.user;
    const {
      customerId = null,
      projectId = null,
      surveyId = null,
      documentType = "Aadhaar Card",
      idNumber = "",
      customerPhotoBase64 = null,
      docFrontBase64 = null,
      docBackBase64 = null,
      notes = ""
    } = req.body;
    if (!surveyId && !projectId && !customerId) {
      return res.status(400).json({ success: false, error: "A surveyId, projectId, or customerId is required." });
    }
    const docId = `DOC-${Date.now().toString().slice(-6)}`;
    let customerPhotoPath = null;
    let docFrontPath = null;
    let docBackPath = null;
    if (customerPhotoBase64) {
      const saved = saveBase64File(customerPhotoBase64, `cust_photo_${docId}`);
      customerPhotoPath = saved.fileName;
    }
    if (docFrontBase64) {
      const saved = saveBase64File(docFrontBase64, `doc_front_${docId}`);
      docFrontPath = saved.fileName;
    }
    if (docBackBase64) {
      const saved = saveBase64File(docBackBase64, `doc_back_${docId}`);
      docBackPath = saved.fileName;
    }
    const uploadedAt = (/* @__PURE__ */ new Date()).toISOString();
    await pool.query(
      `INSERT INTO customer_documents 
        (id, customer_id, project_id, survey_id, document_type, id_number, customer_photo_path, doc_front_path, doc_back_path, notes, uploaded_by_id, uploaded_by_name, uploaded_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        docId,
        customerId,
        projectId,
        surveyId,
        documentType,
        idNumber,
        customerPhotoPath,
        docFrontPath,
        docBackPath,
        notes,
        user2?.userId || null,
        user2?.name || user2?.username || "Survey Engineer",
        uploadedAt
      ]
    );
    res.json({
      success: true,
      document: {
        id: docId,
        customerId,
        projectId,
        surveyId,
        documentType,
        idNumber,
        hasCustomerPhoto: Boolean(customerPhotoPath),
        hasDocFront: Boolean(docFrontPath),
        hasDocBack: Boolean(docBackPath),
        notes,
        uploadedAt
      }
    });
  } catch (err) {
    console.error("Customer document upload error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};
var getDocumentBySurveyOrProject = async (req, res) => {
  try {
    const { surveyId, projectId } = req.query;
    let query = "SELECT id, customer_id, project_id, survey_id, document_type, id_number, (customer_photo_path IS NOT NULL) AS has_customer_photo, (doc_front_path IS NOT NULL) AS has_doc_front, (doc_back_path IS NOT NULL) AS has_doc_back, notes, uploaded_by_name, uploaded_at FROM customer_documents WHERE 1=1";
    const params = [];
    if (surveyId) {
      query += " AND survey_id = ?";
      params.push(surveyId);
    }
    if (projectId) {
      query += " AND project_id = ?";
      params.push(projectId);
    }
    query += " ORDER BY uploaded_at DESC LIMIT 1";
    const [rows] = await pool.query(query, params);
    if (!rows || rows.length === 0) {
      return res.json({ success: true, document: null });
    }
    res.json({ success: true, document: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
var streamSecureDocumentFile = async (req, res) => {
  try {
    const { id, fileType } = req.params;
    const [rows] = await pool.query("SELECT * FROM customer_documents WHERE id = ?", [id]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, error: "Document record not found" });
    }
    const doc = rows[0];
    let fileName = null;
    if (fileType === "photo") fileName = doc.customer_photo_path;
    else if (fileType === "front") fileName = doc.doc_front_path;
    else if (fileType === "back") fileName = doc.doc_back_path;
    if (!fileName) {
      return res.status(404).json({ success: false, error: `File for type '${fileType}' not present in this record.` });
    }
    const fullDiskPath = path4.join(SECURE_DOCS_DIR, fileName);
    if (!fs3.existsSync(fullDiskPath)) {
      return res.status(404).json({ success: false, error: "File not found on storage server." });
    }
    let contentType = "image/jpeg";
    if (fileName.endsWith(".png")) contentType = "image/png";
    else if (fileName.endsWith(".webp")) contentType = "image/webp";
    else if (fileName.endsWith(".pdf")) contentType = "application/pdf";
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "private, no-cache, no-store, must-revalidate");
    const readStream = fs3.createReadStream(fullDiskPath);
    readStream.pipe(res);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// server/routes/documents.routes.ts
var documentsRouter = Router12();
documentsRouter.post(
  "/",
  authenticateToken,
  requireRole(["Survey Engineer", "Project Manager", "Super Admin"]),
  uploadCustomerDocument
);
documentsRouter.get(
  "/",
  authenticateToken,
  getDocumentBySurveyOrProject
);
documentsRouter.get(
  "/:id/file/:fileType",
  authenticateToken,
  requireRole(["Project Manager", "Super Admin"]),
  streamSecureDocumentFile
);

// server/routes/bom.routes.ts
import { Router as Router13 } from "express";

// server/controllers/bom.controller.ts
var getBom = async (req, res) => {
  try {
    const { projectId, surveyId } = req.query;
    if (!projectId && !surveyId) {
      return res.status(400).json({ success: false, error: "projectId or surveyId is required" });
    }
    let query = "SELECT * FROM project_boms WHERE 1=1";
    const params = [];
    if (projectId) {
      query += " AND project_id = ?";
      params.push(projectId);
    }
    if (surveyId) {
      query += " AND survey_id = ?";
      params.push(surveyId);
    }
    query += " ORDER BY version DESC LIMIT 1";
    const [boms] = await pool.query(query, params);
    if (!boms || boms.length === 0) {
      return res.json({ success: true, bom: null });
    }
    const bom = boms[0];
    const [items] = await pool.query("SELECT * FROM bom_items WHERE bom_id = ? ORDER BY id ASC", [bom.id]);
    res.json({
      success: true,
      bom: {
        id: bom.id,
        projectId: bom.project_id,
        surveyId: bom.survey_id,
        version: bom.version,
        isEdited: Boolean(bom.is_edited) || Number(bom.version) > 1,
        status: bom.status,
        preparedById: bom.prepared_by_id,
        preparedByName: bom.prepared_by_name,
        approvedById: bom.approved_by_id,
        approvedByName: bom.approved_by_name,
        totalEstimatedCost: Number(bom.total_estimated_cost) || 0,
        revisionComments: bom.revision_comments || "",
        createdAt: bom.created_at,
        updatedAt: bom.updated_at,
        items: (items || []).map((it) => ({
          id: it.id,
          bomId: it.bom_id,
          productId: it.product_id,
          category: it.category,
          itemName: it.item_name,
          technicalSpecification: it.technical_specification,
          brandMake: it.brand_make || "",
          quantity: Number(it.quantity) || 1,
          unit: it.unit || "Nos",
          estimatedUnitCost: Number(it.estimated_unit_cost) || 0,
          estimatedTotalCost: Number(it.estimated_total_cost) || 0,
          remarks: it.remarks || "",
          photoUrl: it.photo_url || ""
        }))
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
var saveBom = async (req, res) => {
  try {
    const user2 = req.user;
    const {
      id,
      projectId = null,
      surveyId = null,
      items = [],
      status = "Draft",
      revisionComments = ""
    } = req.body;
    const totalEstimatedCost = items.reduce(
      (sum, it) => sum + (Number(it.estimatedTotalCost) || (Number(it.quantity) || 1) * (Number(it.estimatedUnitCost) || 0)),
      0
    );
    const now = (/* @__PURE__ */ new Date()).toISOString();
    let bomId = id;
    if (!bomId) {
      let findQuery = "SELECT id, version FROM project_boms WHERE 1=1";
      const findParams = [];
      if (surveyId) {
        findQuery += " AND survey_id = ?";
        findParams.push(surveyId);
      } else if (projectId) {
        findQuery += " AND project_id = ?";
        findParams.push(projectId);
      }
      findQuery += " ORDER BY version DESC LIMIT 1";
      const [existing] = await pool.query(findQuery, findParams);
      if (existing && existing.length > 0) {
        bomId = existing[0].id;
      } else {
        bomId = `BOM-${Date.now().toString().slice(-6)}`;
      }
    }
    const [existingBom] = await pool.query("SELECT * FROM project_boms WHERE id = ?", [bomId]);
    if (!existingBom || existingBom.length === 0) {
      await pool.query(
        `INSERT INTO project_boms 
          (id, project_id, survey_id, version, status, is_edited, prepared_by_id, prepared_by_name, total_estimated_cost, revision_comments, created_at, updated_at)
         VALUES (?, ?, ?, 1, ?, 0, ?, ?, ?, ?, ?, ?)`,
        [
          bomId,
          projectId,
          surveyId,
          status,
          user2?.userId || user2?.id || null,
          user2?.name || user2?.username || "Survey Engineer",
          totalEstimatedCost,
          revisionComments,
          now,
          now
        ]
      );
    } else {
      const prev = existingBom[0];
      const newVersion = (Number(prev.version) || 1) + 1;
      await pool.query(
        `UPDATE project_boms 
         SET status = ?, version = ?, is_edited = 1, total_estimated_cost = ?, revision_comments = ?, updated_at = ?
         WHERE id = ?`,
        [status, newVersion, totalEstimatedCost, revisionComments, now, bomId]
      );
    }
    await pool.query("DELETE FROM bom_items WHERE bom_id = ?", [bomId]);
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const itemId = it.id || `BI-${Date.now().toString().slice(-5)}-${i + 1}`;
      const lineTotal = Number(it.estimatedTotalCost) || (Number(it.quantity) || 1) * (Number(it.estimatedUnitCost) || 0);
      await pool.query(
        `INSERT INTO bom_items 
          (id, bom_id, product_id, category, item_name, technical_specification, brand_make, quantity, unit, estimated_unit_cost, estimated_total_cost, remarks, photo_url)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          itemId,
          bomId,
          it.productId || null,
          it.category || "General",
          it.itemName || "Custom Item",
          it.technicalSpecification || "",
          it.brandMake || "",
          Number(it.quantity) || 1,
          it.unit || "Nos",
          Number(it.estimatedUnitCost) || 0,
          lineTotal,
          it.remarks || "",
          it.photoUrl || null
        ]
      );
    }
    if (surveyId) {
      try {
        await pool.query('UPDATE site_surveys SET notes = CONCAT(IFNULL(notes, ""), " [BOM: ", ?, "]") WHERE id = ?', [bomId, surveyId]);
      } catch (_) {
      }
    }
    if (projectId) {
      try {
        await pool.query("UPDATE projects SET bom_id = ? WHERE id = ?", [bomId, projectId]);
      } catch (_) {
      }
    }
    res.json({
      success: true,
      bomId,
      status,
      totalEstimatedCost,
      itemsCount: items.length
    });
  } catch (err) {
    console.error("Error saving BOM:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};
var submitBomForReview = async (req, res) => {
  try {
    const { id } = req.params;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await pool.query(
      `UPDATE project_boms SET status = 'Submitted', updated_at = ? WHERE id = ?`,
      [now, id]
    );
    res.json({ success: true, id, status: "Submitted" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
var reviewBom = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, comments = "" } = req.body;
    const user2 = req.user;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    if (action === "Approve") {
      await pool.query(
        `UPDATE project_boms 
         SET status = 'Approved', approved_by_id = ?, approved_by_name = ?, revision_comments = ?, updated_at = ?
         WHERE id = ?`,
        [user2?.userId || null, user2?.name || "Project Manager", comments, now, id]
      );
      let createdQuotation = null;
      try {
        const [bomRows] = await pool.query("SELECT * FROM project_boms WHERE id = ?", [id]);
        if (bomRows && bomRows.length > 0 && bomRows[0].survey_id) {
          const bom = bomRows[0];
          const [itemsRows] = await pool.query("SELECT * FROM bom_items WHERE bom_id = ? ORDER BY id ASC", [id]);
          const mappedItems = itemsRows.map((it) => ({
            id: it.id,
            category: it.category || "General",
            description: it.item_name || it.category,
            specification: it.technical_specification || "",
            make: it.brand_make || "",
            makeModel: `${it.brand_make || ""} ${it.technical_specification || ""}`.trim(),
            quantity: Number(it.quantity) || 1,
            unit: it.unit || "Nos",
            unitPrice: Number(it.estimated_unit_cost) || 0
          }));
          const resDraft = await createQuotationDraftInternal(pool, {
            surveyId: bom.survey_id,
            user: user2,
            customItems: mappedItems.length > 0 ? mappedItems : void 0
          });
          createdQuotation = resDraft.quotation;
          await pool.query(
            "UPDATE site_surveys SET status = 'Approved' WHERE id = ?",
            [bom.survey_id]
          );
          const [surveyRows] = await pool.query("SELECT lead_id FROM site_surveys WHERE id = ?", [bom.survey_id]);
          if (surveyRows && surveyRows.length > 0 && surveyRows[0].lead_id) {
            await pool.query(
              "UPDATE leads SET status = 'Quotation Sent' WHERE id = ?",
              [surveyRows[0].lead_id]
            );
          }
        }
      } catch (qErr) {
        console.error("Auto quotation generation upon PM BOM approval notice:", qErr.message);
      }
      return res.json({ success: true, id, status: "Approved", quotation: createdQuotation });
    } else if (action === "Request Changes") {
      await pool.query(
        `UPDATE project_boms 
         SET status = 'Changes Requested', revision_comments = ?, updated_at = ?
         WHERE id = ?`,
        [comments, now, id]
      );
      return res.json({ success: true, id, status: "Changes Requested" });
    } else {
      return res.status(400).json({ success: false, error: 'Invalid action. Must be "Approve" or "Request Changes".' });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
var getAllBoms = async (req, res) => {
  try {
    const [boms] = await pool.query(`
      SELECT b.*, 
             s.customer_name as survey_customer_name, s.phone as survey_phone, s.recommended_kw as survey_kw, s.lead_id, s.status as survey_status, s.roof_type,
             p.customer_name as project_customer_name, p.capacity_kw as project_kw,
             (SELECT COUNT(*) FROM bom_items bi WHERE bi.bom_id COLLATE utf8mb4_unicode_ci = b.id COLLATE utf8mb4_unicode_ci) as items_count
      FROM project_boms b
      LEFT JOIN site_surveys s ON b.survey_id COLLATE utf8mb4_unicode_ci = s.id COLLATE utf8mb4_unicode_ci
      LEFT JOIN projects p ON b.project_id COLLATE utf8mb4_unicode_ci = p.id COLLATE utf8mb4_unicode_ci
      ORDER BY b.updated_at DESC
    `);
    res.json({
      success: true,
      boms: (boms || []).map((b) => ({
        id: b.id,
        projectId: b.project_id,
        surveyId: b.survey_id,
        leadId: b.lead_id,
        customerName: b.survey_customer_name || b.project_customer_name || "Customer",
        phone: b.survey_phone || "",
        capacityKw: Number(b.survey_kw || b.project_kw || 0),
        roofType: b.roof_type || "RCC Flat",
        version: b.version,
        isEdited: Boolean(b.is_edited) || Number(b.version) > 1,
        status: b.status,
        preparedById: b.prepared_by_id,
        preparedByName: b.prepared_by_name,
        approvedById: b.approved_by_id,
        approvedByName: b.approved_by_name,
        totalEstimatedCost: Number(b.total_estimated_cost) || 0,
        revisionComments: b.revision_comments || "",
        itemsCount: Number(b.items_count) || 0,
        createdAt: b.created_at,
        updatedAt: b.updated_at
      }))
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// server/routes/bom.routes.ts
var bomRouter = Router13();
bomRouter.get("/all", authenticateToken, getAllBoms);
bomRouter.get("/", authenticateToken, getBom);
bomRouter.post(
  "/",
  authenticateToken,
  requireRole(["Survey Engineer", "Project Manager", "Super Admin"]),
  saveBom
);
bomRouter.post(
  "/:id/submit",
  authenticateToken,
  requireRole(["Survey Engineer", "Super Admin"]),
  submitBomForReview
);
bomRouter.post(
  "/:id/review",
  authenticateToken,
  requireRole(["Project Manager", "Super Admin"]),
  reviewBom
);

// server/routes/procurement.routes.ts
import { Router as Router14 } from "express";

// server/controllers/procurement.controller.ts
import crypto2 from "crypto";

// server/services/grn-pdf-generator.ts
import PDFDocument2 from "pdfkit";
import fs4 from "fs";
import path5 from "path";
async function generateGrnPdf(data) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument2({
        size: "A4",
        margin: 36,
        info: {
          Title: `GRN-${data.grnNumber}`,
          Author: "AB Energy Solutions",
          Subject: "Material Delivery Receipt & Goods Receipt Note"
        }
      });
      const fileName = `grn_${data.grnNumber.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`;
      const publicDir = path5.resolve(process.cwd(), "public", "documents");
      if (!fs4.existsSync(publicDir)) {
        fs4.mkdirSync(publicDir, { recursive: true });
      }
      const filePath = path5.join(publicDir, fileName);
      const writeStream = fs4.createWriteStream(filePath);
      doc.pipe(writeStream);
      const PAGE_W = 595.28;
      const PAGE_H = 841.89;
      const MARGIN = 36;
      const CONTENT_W = PAGE_W - MARGIN * 2;
      const PRIMARY = "#059669";
      const DARK = "#0f172a";
      const MUTED = "#475569";
      const LIGHT_BG = "#f8fafc";
      const BORDER = "#cbd5e1";
      doc.rect(0, 0, PAGE_W, 6).fill(PRIMARY);
      let y = 24;
      doc.font("Helvetica-Bold").fontSize(16).fillColor(PRIMARY).text("AB ENERGY SOLUTIONS", MARGIN, y);
      y += 18;
      doc.font("Helvetica").fontSize(8).fillColor(MUTED).text("Turnkey Rooftop Solar EPC \u2022 MNRE Approved Channel Partner \u2022 ISO 9001:2015", MARGIN, y);
      y += 12;
      doc.text("Regd. Office: 124, 2nd Cross, Industrial Suburb, Yeshwanthpur, Bengaluru - 560022 | Support: +91 98450 12345", MARGIN, y);
      y += 18;
      doc.rect(MARGIN, y, CONTENT_W, 28).fill("#ecfdf5");
      doc.rect(MARGIN, y, CONTENT_W, 28).stroke(PRIMARY);
      doc.font("Helvetica-Bold").fontSize(11).fillColor("#065f46").text("GOODS RECEIPT NOTE & SITE MATERIAL HANDOVER CHALLAN", MARGIN, y + 8, { align: "center", width: CONTENT_W });
      y += 36;
      const colW = (CONTENT_W - 12) / 2;
      doc.rect(MARGIN, y, colW, 88).fill(LIGHT_BG);
      doc.rect(MARGIN, y, colW, 88).stroke(BORDER);
      doc.font("Helvetica-Bold").fontSize(8.5).fillColor(DARK).text("RECEIPT & DISPATCH DETAILS", MARGIN + 8, y + 8);
      let leftY = y + 22;
      doc.font("Helvetica-Bold").fontSize(7.5).fillColor(MUTED).text("GRN Number: ", MARGIN + 8, leftY);
      doc.font("Helvetica-Bold").fillColor(PRIMARY).text(data.grnNumber, MARGIN + 75, leftY);
      leftY += 13;
      doc.font("Helvetica").fillColor(MUTED).text("PO Number: ", MARGIN + 8, leftY);
      doc.font("Helvetica-Bold").fillColor(DARK).text(data.poNumber, MARGIN + 75, leftY);
      leftY += 13;
      if (data.quotationNumber) {
        doc.font("Helvetica").fillColor(MUTED).text("Quotation Ref: ", MARGIN + 8, leftY);
        doc.font("Helvetica-Bold").fillColor(DARK).text(data.quotationNumber, MARGIN + 75, leftY);
        leftY += 13;
      }
      doc.font("Helvetica").fillColor(MUTED).text("Supplier Name: ", MARGIN + 8, leftY);
      doc.font("Helvetica").fillColor(DARK).text(data.supplierName || "Authorized Vendor", MARGIN + 75, leftY);
      leftY += 13;
      doc.font("Helvetica").fillColor(MUTED).text("Delivery DC / Inv: ", MARGIN + 8, leftY);
      doc.font("Helvetica").fillColor(DARK).text(`${data.deliveryChallanNo || "N/A"} / ${data.supplierInvoiceNo || "N/A"}`, MARGIN + 75, leftY);
      const rightX = MARGIN + colW + 12;
      doc.rect(rightX, y, colW, 88).fill(LIGHT_BG);
      doc.rect(rightX, y, colW, 88).stroke(BORDER);
      doc.font("Helvetica-Bold").fontSize(8.5).fillColor(DARK).text("DELIVERY SITE & CUSTOMER INFO", rightX + 8, y + 8);
      let rightY = y + 22;
      doc.font("Helvetica-Bold").fontSize(7.5).fillColor(MUTED).text("Customer: ", rightX + 8, rightY);
      doc.font("Helvetica-Bold").fillColor(DARK).text(data.customerName || "Solar Client", rightX + 70, rightY);
      rightY += 13;
      doc.font("Helvetica").fillColor(MUTED).text("Phone: ", rightX + 8, rightY);
      doc.font("Helvetica").fillColor(DARK).text(data.customerPhone || "N/A", rightX + 70, rightY);
      rightY += 13;
      doc.font("Helvetica").fillColor(MUTED).text("Delivery Date: ", rightX + 8, rightY);
      doc.font("Helvetica-Bold").fillColor(DARK).text(data.receivedDate || (/* @__PURE__ */ new Date()).toISOString().split("T")[0], rightX + 70, rightY);
      rightY += 13;
      doc.font("Helvetica").fillColor(MUTED).text("Site Warehouse: ", rightX + 8, rightY);
      doc.font("Helvetica").fillColor(DARK).text(data.deliveryWarehouse || "On-Site Staging Location", rightX + 70, rightY);
      rightY += 13;
      doc.font("Helvetica").fillColor(MUTED).text("Site Address: ", rightX + 8, rightY);
      doc.font("Helvetica").fillColor(DARK).text(data.customerAddress ? data.customerAddress.substring(0, 35) : "Client Installation Site", rightX + 70, rightY);
      y += 98;
      doc.font("Helvetica-Bold").fontSize(9).fillColor(DARK).text("VERIFIED MATERIALS & LINE ITEM INSPECTION", MARGIN, y);
      y += 14;
      const colDefs = [
        { label: "S.No", w: 26, align: "center" },
        { label: "Item Description & Specs", w: 185, align: "left" },
        { label: "Category", w: 85, align: "left" },
        { label: "Ord Qty", w: 42, align: "right" },
        { label: "Rcv Qty", w: 42, align: "right" },
        { label: "Acc Qty", w: 42, align: "right" },
        { label: "Short / Rej", w: 50, align: "right" },
        { label: "Unit", w: 30, align: "center" }
      ];
      doc.rect(MARGIN, y, CONTENT_W, 20).fill("#1e293b");
      let hX = MARGIN;
      doc.font("Helvetica-Bold").fontSize(7.5).fillColor("#ffffff");
      colDefs.forEach((col) => {
        const textX = col.align === "right" ? hX : col.align === "center" ? hX : hX + 4;
        doc.text(col.label, textX, y + 6, { width: col.w, align: col.align });
        hX += col.w;
      });
      y += 20;
      let hasShortages = false;
      let totalShortQty = 0;
      data.items.forEach((it, idx) => {
        const rowH = 18;
        const bg = idx % 2 === 0 ? "#ffffff" : "#f8fafc";
        doc.rect(MARGIN, y, CONTENT_W, rowH).fill(bg);
        doc.rect(MARGIN, y, CONTENT_W, rowH).stroke("#e2e8f0");
        const ord = Number(it.orderedQuantity) || 0;
        const rcv = Number(it.receivedQuantity) || 0;
        const acc = Number(it.acceptedQuantity !== void 0 ? it.acceptedQuantity : rcv);
        const rej = Number(it.rejectedQuantity || 0) + Math.max(0, ord - acc);
        if (rej > 0) {
          hasShortages = true;
          totalShortQty += rej;
        }
        let rX = MARGIN;
        doc.font("Helvetica").fontSize(7.5).fillColor(DARK);
        doc.text(String(idx + 1), rX, y + 5, { width: colDefs[0].w, align: "center" });
        rX += colDefs[0].w;
        doc.font("Helvetica-Bold").text(it.itemName || "Material Item", rX + 4, y + 5, { width: colDefs[1].w - 8, align: "left", lineBreak: false });
        rX += colDefs[1].w;
        doc.font("Helvetica").fillColor(MUTED).text(it.category || "Solar BOS", rX + 4, y + 5, { width: colDefs[2].w - 8, align: "left", lineBreak: false });
        rX += colDefs[2].w;
        doc.fillColor(DARK).text(String(ord), rX, y + 5, { width: colDefs[3].w, align: "right" });
        rX += colDefs[3].w;
        doc.fillColor(DARK).text(String(rcv), rX, y + 5, { width: colDefs[4].w, align: "right" });
        rX += colDefs[4].w;
        doc.font("Helvetica-Bold").fillColor(PRIMARY).text(String(acc), rX, y + 5, { width: colDefs[5].w, align: "right" });
        rX += colDefs[5].w;
        if (rej > 0) {
          doc.font("Helvetica-Bold").fillColor("#dc2626").text(String(rej), rX, y + 5, { width: colDefs[6].w, align: "right" });
        } else {
          doc.font("Helvetica").fillColor(MUTED).text("-", rX, y + 5, { width: colDefs[6].w, align: "right" });
        }
        rX += colDefs[6].w;
        doc.font("Helvetica").fillColor(MUTED).text(it.unit || "Nos", rX, y + 5, { width: colDefs[7].w, align: "center" });
        y += rowH;
      });
      y += 8;
      const verdictBg = hasShortages ? "#fef2f2" : "#ecfdf5";
      const verdictBorder = hasShortages ? "#f87171" : "#6ee7b7";
      const verdictText = hasShortages ? `\u26A0\uFE0F MATERIAL DISCREPANCY RECORDED: Shortage / Rejection of ${totalShortQty} units noted. Re-order / indemnity in process.` : `\u2713 100% COMPLETE & SOUND CONDITION: All equipment received, inspected, and verified with zero discrepancy.`;
      doc.rect(MARGIN, y, CONTENT_W, 24).fill(verdictBg);
      doc.rect(MARGIN, y, CONTENT_W, 24).stroke(verdictBorder);
      doc.font("Helvetica-Bold").fontSize(7.5).fillColor(hasShortages ? "#991b1b" : "#065f46").text(verdictText, MARGIN + 8, y + 7, { width: CONTENT_W - 16 });
      y += 32;
      doc.rect(MARGIN, y, CONTENT_W, 175).fill("#fbfcfd");
      doc.rect(MARGIN, y, CONTENT_W, 175).stroke(BORDER);
      doc.rect(MARGIN, y, CONTENT_W, 20).fill("#f1f5f9");
      doc.font("Helvetica-Bold").fontSize(8.5).fillColor(DARK).text("CUSTOMER ELECTRONIC SIGNATURE & SITE HANDOVER ACKNOWLEDGMENT", MARGIN + 8, y + 5);
      y += 26;
      doc.font("Helvetica").fontSize(7).fillColor(MUTED).text("Declaration: I/We hereby acknowledge physical receipt of the turnkey solar power plant equipment, modules, inverters, and BOS accessories listed above at our site in sound, un-damaged condition, subject to the discrepancy inspection recorded herein.", MARGIN + 8, y, { width: CONTENT_W - 16, lineGap: 1.5 });
      y += 24;
      const sigColW = (CONTENT_W - 24) / 2;
      const custBoxX = MARGIN + 8;
      doc.rect(custBoxX, y, sigColW, 115).stroke("#e2e8f0");
      doc.font("Helvetica-Bold").fontSize(7.5).fillColor(DARK).text("CUSTOMER / AUTHORIZED SIGNATORY", custBoxX + 6, y + 6);
      if (data.isPendingSignature) {
        doc.rect(custBoxX + 6, y + 20, sigColW - 12, 42).fillAndStroke("#fffbeb", "#fde68a");
        doc.font("Helvetica-Bold").fontSize(8).fillColor("#b45309").text("[PENDING CUSTOMER E-SIGNATURE]", custBoxX + 8, y + 26, { align: "center", width: sigColW - 16 });
        doc.font("Helvetica").fontSize(6.5).fillColor("#92400e").text("Awaiting customer review & mobile e-signature via secure signing link.", custBoxX + 8, y + 38, { align: "center", width: sigColW - 16 });
      } else if (data.customerSignatureData && data.customerSignatureData.startsWith("data:image")) {
        try {
          const base64Data = data.customerSignatureData.replace(/^data:image\/\w+;base64,/, "");
          const imgBuffer = Buffer.from(base64Data, "base64");
          doc.image(imgBuffer, custBoxX + 8, y + 18, { fit: [sigColW - 16, 45], align: "center" });
        } catch (imgErr) {
          doc.font("Helvetica-Oblique").fontSize(7.5).fillColor(MUTED).text("[Electronic Signature Attached]", custBoxX + 8, y + 35);
        }
      } else {
        doc.font("Helvetica-Oblique").fontSize(7.5).fillColor(MUTED).text("[Electronic Signature Completed]", custBoxX + 8, y + 35);
      }
      const sigMetaY = y + 68;
      doc.font("Helvetica-Bold").fontSize(7).fillColor(DARK).text(`Name: ${data.customerSignatureName || data.customerName}`, custBoxX + 6, sigMetaY);
      doc.font("Helvetica").fillColor(MUTED).text(`Mobile: ${data.customerSignaturePhone || data.customerPhone || "Verified"}`, custBoxX + 6, sigMetaY + 10);
      doc.text(`Timestamp: ${data.customerSignatureDate || (data.isPendingSignature ? "Pending Customer Action" : (/* @__PURE__ */ new Date()).toLocaleString("en-IN"))}`, custBoxX + 6, sigMetaY + 20);
      if (data.isPendingSignature) {
        doc.font("Helvetica-Bold").fillColor("#b45309").text("\u23F3 Pending Customer Signing Action", custBoxX + 6, sigMetaY + 31);
      } else {
        const auditInfo = data.signingIp ? `\u2713 Verified E-Signature \u2022 IP: ${data.signingIp}` : "\u2713 Verified Electronic Signature Record";
        doc.font("Helvetica-Bold").fillColor(PRIMARY).text(auditInfo, custBoxX + 6, sigMetaY + 31);
      }
      const compBoxX = custBoxX + sigColW + 8;
      doc.rect(compBoxX, y, sigColW, 115).stroke("#e2e8f0");
      doc.font("Helvetica-Bold").fontSize(7.5).fillColor(DARK).text("FOR AB ENERGY SOLUTIONS (STORE / SITE LOGISTICS)", compBoxX + 6, y + 6);
      doc.circle(compBoxX + sigColW / 2, y + 42, 22).stroke(PRIMARY);
      doc.font("Helvetica-Bold").fontSize(6).fillColor(PRIMARY).text("AB ENERGY SOLUTIONS", compBoxX + 10, y + 34, { width: sigColW - 20, align: "center" }).text("LOGISTICS VERIFIED", compBoxX + 10, y + 43, { width: sigColW - 20, align: "center" });
      doc.font("Helvetica-Bold").fontSize(7).fillColor(DARK).text(`Store Officer: ${data.verifiedBy || "Store In-Charge"}`, compBoxX + 6, sigMetaY);
      doc.font("Helvetica").fillColor(MUTED).text("Designation: Materials Logistics & QA Executive", compBoxX + 6, sigMetaY + 10);
      doc.text(`Verification Date: ${data.receivedDate || (/* @__PURE__ */ new Date()).toISOString().split("T")[0]}`, compBoxX + 6, sigMetaY + 20);
      doc.font("Helvetica-Bold").fillColor(DARK).text("Official System Generated & Certified GRN", compBoxX + 6, sigMetaY + 31);
      doc.font("Helvetica").fontSize(6).fillColor(MUTED).text("Disclaimer: This workflow records an authenticated electronic signature for site material handover under the Information Technology Act. It is not a certificate-based digital signature.", MARGIN, PAGE_H - 38, { align: "center", width: CONTENT_W });
      const footerY = PAGE_H - 24;
      doc.rect(0, footerY - 4, PAGE_W, 28).fill("#0f172a");
      doc.font("Helvetica").fontSize(6.5).fillColor("#94a3b8").text(`AB Energy Solutions ERP Document Ref: GRN-${data.grnNumber} \u2022 Generated on ${(/* @__PURE__ */ new Date()).toLocaleString("en-IN")} \u2022 Turnkey Solar EPC Project Management`, MARGIN, footerY + 4, { align: "center", width: CONTENT_W });
      doc.end();
      writeStream.on("finish", () => {
        resolve({
          filePath,
          fileUrl: `/documents/${fileName}`
        });
      });
      writeStream.on("error", (err) => {
        reject(err);
      });
    } catch (err) {
      reject(err);
    }
  });
}

// server/controllers/procurement.controller.ts
async function getPurchaseOrders(req, res) {
  try {
    const { projectId, quotationId, status } = req.query;
    let sql = "SELECT * FROM purchase_orders";
    const params = [];
    const conditions = [];
    if (projectId) {
      conditions.push("project_id = ?");
      params.push(projectId);
    }
    if (quotationId) {
      conditions.push("quotation_id = ?");
      params.push(quotationId);
    }
    if (status && status !== "all") {
      conditions.push("status = ?");
      params.push(status);
    }
    if (conditions.length > 0) {
      sql += " WHERE " + conditions.join(" AND ");
    }
    sql += " ORDER BY created_at DESC";
    const [orders] = await pool.query(sql, params);
    if (!orders || orders.length === 0) {
      res.json({ success: true, purchaseOrders: [] });
      return;
    }
    const poIds = orders.map((p) => p.id);
    const [[allItems], [allGrns]] = await Promise.all([
      pool.query("SELECT * FROM purchase_order_items WHERE po_id IN (?)", [poIds]),
      pool.query("SELECT * FROM goods_receipt_notes WHERE po_id IN (?) ORDER BY created_at DESC", [poIds])
    ]);
    const itemsMap = {};
    for (const it of allItems || []) {
      if (!itemsMap[it.po_id]) itemsMap[it.po_id] = [];
      itemsMap[it.po_id].push({
        id: it.id,
        sku: it.sku,
        name: it.item_name,
        category: it.category,
        quantity: Number(it.quantity),
        unit: it.unit,
        unitPrice: Number(it.unit_price),
        totalAmount: Number(it.total_amount),
        receivedQuantity: Number(it.received_quantity || 0)
      });
    }
    const grnsMap = {};
    for (const g of allGrns || []) {
      if (!grnsMap[g.po_id]) grnsMap[g.po_id] = [];
      grnsMap[g.po_id].push(g);
    }
    for (const po of orders) {
      po.items = itemsMap[po.id] || [];
      po.grns = grnsMap[po.id] || [];
    }
    res.json({ success: true, purchaseOrders: orders });
  } catch (error) {
    console.error("Error in getPurchaseOrders:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}
async function createPurchaseOrder(req, res) {
  try {
    const {
      projectId,
      quotationId,
      quotationNumber,
      customerName,
      customerPhone,
      bomId,
      supplierId,
      supplierName,
      deliveryWarehouse,
      expectedDeliveryDate,
      items,
      notes
    } = req.body;
    if (!supplierName || !items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ success: false, error: "Supplier and at least one item are required" });
      return;
    }
    if (projectId) {
      const [pRows] = await pool.query("SELECT stage FROM projects WHERE id = ?", [projectId]);
      if (pRows && pRows.length > 0 && pRows[0].stage === "Completed") {
        res.status(400).json({
          success: false,
          error: `Cannot issue Purchase Order: Project ${projectId} is already Completed and procurement is closed.`
        });
        return;
      }
    }
    if (quotationId) {
      const [qRows] = await pool.query(
        "SELECT q.status, q.converted_to_project_id, p.stage as project_stage FROM quotations q LEFT JOIN projects p ON p.id = q.converted_to_project_id WHERE q.id = ?",
        [quotationId]
      );
      if (qRows && qRows.length > 0 && (qRows[0].project_stage === "Completed" || qRows[0].status === "Completed")) {
        res.status(400).json({
          success: false,
          error: "Cannot issue Purchase Order: The linked project has already reached Completed stage and procurement is finalized."
        });
        return;
      }
    }
    const id = `PO-${Date.now().toString().slice(-6)}`;
    const poNumber = `PO-${(/* @__PURE__ */ new Date()).getFullYear()}-${Math.floor(1e3 + Math.random() * 9e3)}`;
    let subtotal = 0;
    for (const item of items) {
      const qty = Number(item.quantity) || 1;
      const rate = Number(item.unitPrice) || 0;
      subtotal += qty * rate;
    }
    const taxAmount = Math.round(subtotal * 0.18);
    const grandTotal = subtotal + taxAmount;
    await pool.query(
      `INSERT INTO purchase_orders 
        (id, po_number, project_id, quotation_id, bom_id, supplier_id, supplier_name, customer_name, customer_phone, delivery_warehouse, expected_delivery_date, status, subtotal, tax_amount, grand_total, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Issued', ?, ?, ?, ?)`,
      [
        id,
        poNumber,
        projectId || null,
        quotationId || null,
        bomId || null,
        supplierId || null,
        supplierName,
        customerName || null,
        customerPhone || null,
        deliveryWarehouse || "Central Warehouse",
        expectedDeliveryDate || null,
        subtotal,
        taxAmount,
        grandTotal,
        notes || ""
      ]
    );
    for (const item of items) {
      const itemId = `POI-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const qty = Number(item.quantity) || 1;
      const rate = Number(item.unitPrice) || 0;
      const itemTotal = qty * rate;
      await pool.query(
        `INSERT INTO purchase_order_items
          (id, po_id, sku, item_name, category, quantity, unit, unit_price, total_amount, received_quantity)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
        [
          itemId,
          id,
          item.sku || "SOL-ITEM",
          item.name || item.itemName || "Material Item",
          item.category || "General BOS",
          qty,
          item.unit || "Nos",
          rate,
          itemTotal
        ]
      );
    }
    if (projectId) {
      await pool.query(
        "UPDATE projects SET material_readiness_status = 'Procurement In Progress' WHERE id = ? AND (material_readiness_status = 'Pending Indent' OR material_readiness_status IS NULL)",
        [projectId]
      );
    }
    const clientLabel = customerName || (quotationNumber ? `Quote ${quotationNumber}` : projectId || "Project");
    await createNotification({
      recipientRole: "Project Manager",
      title: `Purchase Order Issued (${poNumber})`,
      message: `Purchase Order ${poNumber} for \u20B9${grandTotal.toLocaleString("en-IN")} issued to ${supplierName} for ${clientLabel}. Delivery expected: ${expectedDeliveryDate || "Within 5 days"}.`,
      type: "info"
    });
    await createNotification({
      recipientRole: "Installation Team",
      title: `Materials Ordered (${poNumber})`,
      message: `Procurement initiated for ${clientLabel}. PO ${poNumber} placed with ${supplierName}.`,
      type: "info"
    });
    res.json({
      success: true,
      purchaseOrder: {
        id,
        poNumber,
        grandTotal,
        status: "Issued"
      }
    });
  } catch (error) {
    console.error("Error creating purchase order:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}
async function createGoodsReceiptNote(req, res) {
  try {
    const {
      poId,
      quotationId,
      deliveryChallanNumber,
      supplierInvoiceNumber,
      receivedDate,
      receivedBy,
      deliveryWarehouse,
      items,
      notes,
      signingMethod = "remote",
      // 'remote' (default) or 'in_person'
      customerSignatureData,
      customerSignatureName,
      customerSignaturePhone
    } = req.body;
    if (!poId || !items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ success: false, error: "PO ID and items are required" });
      return;
    }
    const [poRows] = await pool.query("SELECT * FROM purchase_orders WHERE id = ?", [poId]);
    if (!poRows || poRows.length === 0) {
      res.status(404).json({ success: false, error: "Purchase Order not found" });
      return;
    }
    const po = poRows[0];
    const linkedQuotationId = quotationId || po.quotation_id;
    let customerName = po.customer_name || "Valued Customer";
    let customerPhone = po.customer_phone || "";
    let customerAddress = po.delivery_location || "";
    let quoteNum = "";
    if (linkedQuotationId) {
      const [qRows] = await pool.query("SELECT * FROM quotations WHERE id = ?", [linkedQuotationId]);
      if (qRows && qRows.length > 0) {
        customerName = qRows[0].lead_name || customerName;
        customerPhone = qRows[0].customer_phone || customerPhone;
        customerAddress = qRows[0].customer_address || customerAddress;
        quoteNum = qRows[0].quotation_number || "";
      }
    }
    const grnId = `GRN-${Date.now().toString().slice(-6)}`;
    const grnNumber = `GRN-${(/* @__PURE__ */ new Date()).getFullYear()}-${Math.floor(1e3 + Math.random() * 9e3)}`;
    let hasShortage = false;
    let totalDiscrepancies = 0;
    const processedItems = [];
    for (const item of items) {
      const orderedQty = Number(item.orderedQuantity || item.quantity) || 0;
      const receivedQty = Number(item.receivedQuantity) || 0;
      const acceptedQty = Number(item.acceptedQuantity !== void 0 ? item.acceptedQuantity : receivedQty);
      const rejectedQty = Number(item.rejectedQuantity || 0) + Math.max(0, orderedQty - acceptedQty);
      if (rejectedQty > 0 || acceptedQty < orderedQty) {
        hasShortage = true;
        totalDiscrepancies += rejectedQty;
      }
      processedItems.push({
        id: item.id || item.poiId,
        itemName: item.name || item.itemName || "Material Item",
        category: item.category || "Solar BOS",
        orderedQuantity: orderedQty,
        receivedQuantity: receivedQty,
        acceptedQuantity: acceptedQty,
        rejectedQuantity: rejectedQty,
        unit: item.unit || "Nos",
        remarks: item.remarks || ""
      });
    }
    const isRemote = signingMethod === "remote" || !customerSignatureData;
    const signingToken = isRemote ? crypto2.randomBytes(24).toString("hex") : null;
    const signingExpiresAt = isRemote ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1e3) : null;
    const grnStatus = isRemote ? "Pending_Signature" : hasShortage ? "Partial Shortage" : "Approved";
    const linkStatus = isRemote ? "Pending" : "Signed";
    const host = req.get("host") || "localhost:3000";
    const protocol = req.protocol || "http";
    const signingUrl = signingToken ? `${protocol}://${host}/sign-grn/${signingToken}` : "";
    let signedPdfUrl = "";
    try {
      const pdfResult = await generateGrnPdf({
        grnNumber,
        poNumber: po.po_number,
        quotationNumber: quoteNum,
        receivedDate: receivedDate || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
        deliveryWarehouse: deliveryWarehouse || po.delivery_warehouse || "Site Delivery",
        deliveryChallanNo: deliveryChallanNumber || "",
        supplierInvoiceNo: supplierInvoiceNumber || "",
        supplierName: po.supplier_name || "Authorized Supplier",
        customerName: customerSignatureName || customerName,
        customerPhone: customerSignaturePhone || customerPhone,
        customerAddress,
        verifiedBy: receivedBy || req.user?.name || "Store Officer",
        notes: notes || "",
        items: processedItems,
        customerSignatureData: !isRemote ? customerSignatureData : void 0,
        customerSignatureName: customerSignatureName || customerName,
        customerSignaturePhone: customerSignaturePhone || customerPhone,
        customerSignatureDate: !isRemote ? (/* @__PURE__ */ new Date()).toLocaleString("en-IN") : void 0,
        isPendingSignature: isRemote,
        documentVersion: 1
      });
      signedPdfUrl = pdfResult.fileUrl;
    } catch (pdfErr) {
      console.error("Error generating GRN PDF:", pdfErr);
      signedPdfUrl = `/documents/grn_${grnNumber}.pdf`;
    }
    const receivedByName = receivedBy || req.user?.name || "Store Officer";
    const deliveryLocation = deliveryWarehouse || po.delivery_warehouse || "Site Delivery";
    const challanNum = deliveryChallanNumber || grnNumber;
    await pool.query(
      `INSERT INTO goods_receipt_notes
        (id, grn_number, po_id, quotation_id, project_id, delivery_challan_no, challan_number, supplier_invoice_no, delivery_warehouse, delivery_location, received_date, verified_by, received_by_name, customer_signature_name, customer_signature_phone, customer_signature_data, customer_signature_date, signed_pdf_url, status, notes, signing_token, signing_link_status, signing_expires_at, declaration_consent, document_version, resend_count, signed_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ${!isRemote ? "NOW()" : "NULL"}, ?, ?, ?, ?, ?, ?, ${!isRemote ? 1 : 0}, 1, 0, ${!isRemote ? "NOW()" : "NULL"}, NOW())`,
      [
        grnId,
        grnNumber,
        poId,
        linkedQuotationId || null,
        po.project_id || null,
        deliveryChallanNumber || "",
        challanNum,
        supplierInvoiceNumber || "",
        deliveryLocation,
        deliveryLocation,
        receivedDate || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
        receivedByName,
        receivedByName,
        customerSignatureName || customerName,
        customerSignaturePhone || customerPhone,
        !isRemote ? customerSignatureData : null,
        signedPdfUrl,
        grnStatus,
        notes || "",
        signingToken,
        linkStatus,
        signingExpiresAt
      ]
    );
    for (const item of processedItems) {
      const grnItemId = `GRI-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      await pool.query(
        `INSERT INTO grn_items
          (id, grn_id, item_name, category, ordered_qty, ordered_quantity, received_qty, received_quantity, accepted_qty, accepted_quantity, rejected_qty, rejected_quantity, damaged_qty, unit, remarks)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          grnItemId,
          grnId,
          item.itemName,
          item.category,
          item.orderedQuantity,
          item.orderedQuantity,
          item.receivedQuantity,
          item.receivedQuantity,
          item.acceptedQuantity,
          item.acceptedQuantity,
          item.rejectedQuantity,
          item.rejectedQuantity,
          item.rejectedQuantity,
          item.unit,
          item.remarks
        ]
      );
      if (item.id) {
        await pool.query(
          "UPDATE purchase_order_items SET received_quantity = received_quantity + ? WHERE id = ?",
          [item.acceptedQuantity, item.id]
        );
      }
    }
    if (!isRemote) {
      const newPoStatus = hasShortage ? "Partial Delivered" : "Delivered";
      await pool.query(
        "UPDATE purchase_orders SET status = ?, grn_number = ?, delivery_challan_url = ? WHERE id = ?",
        [newPoStatus, grnNumber, signedPdfUrl, poId]
      );
      if (po.project_id) {
        const newReadiness = hasShortage ? "Partial Shortage" : "Materials Delivered & Signed";
        await pool.query(
          "UPDATE projects SET material_readiness_status = ?, grn_id = ?, signed_grn_pdf_url = ? WHERE id = ?",
          [newReadiness, grnId, signedPdfUrl, po.project_id]
        );
      }
      await createNotification({
        recipientRole: "Project Manager",
        title: `Material Delivery & Customer Signature Recorded (${grnNumber})`,
        message: `Material delivery for PO ${po.po_number} confirmed with immediate customer electronic signature.`,
        type: hasShortage ? "warning" : "success",
        link: signedPdfUrl
      });
    } else {
      await pool.query(
        "UPDATE purchase_orders SET grn_number = ?, delivery_challan_url = ? WHERE id = ?",
        [grnNumber, signedPdfUrl, poId]
      );
      await createNotification({
        recipientRole: "Purchase Team",
        title: `Customer E-Signature Link Ready (${grnNumber})`,
        message: `GRN ${grnNumber} generated for PO ${po.po_number}. Secure customer signing link created and ready to share via WhatsApp or Email.`,
        type: "info",
        link: signingUrl
      });
    }
    res.json({
      success: true,
      grn: {
        id: grnId,
        grnNumber,
        poNumber: po.po_number,
        status: grnStatus,
        signingLinkStatus: linkStatus,
        signingToken,
        signingUrl,
        signingExpiresAt,
        signedPdfUrl,
        previewPdfUrl: signedPdfUrl,
        hasShortage,
        customerName: customerSignatureName || customerName,
        customerPhone: customerSignaturePhone || customerPhone,
        materialReadiness: isRemote ? "Pending Customer Signature" : hasShortage ? "Partial Shortage" : "Materials Delivered & Signed"
      },
      signingUrl,
      signingToken
    });
  } catch (error) {
    console.error("Error in createGoodsReceiptNote:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}
async function getPendingIndents(req, res) {
  try {
    const [quotations] = await pool.query(`
      SELECT q.id as quotation_id, q.quotation_number, q.lead_name as customer_name,
             q.customer_phone, q.customer_address, q.system_capacity_kw, q.total_amount,
             q.status as quotation_status, q.survey_id, q.converted_to_project_id,
             q.versions,
             p.stage as project_stage
      FROM quotations q
      LEFT JOIN projects p ON p.id = q.converted_to_project_id
      WHERE (q.procurement_archived IS NULL OR q.procurement_archived = 0)
        AND (q.status IN ('Customer_Accepted', 'Accepted') 
         OR (q.status = 'Converted_To_Project' AND q.converted_to_project_id IS NOT NULL))
      ORDER BY q.created_at DESC
    `);
    if (!quotations || quotations.length === 0) {
      res.json({ success: true, indents: [] });
      return;
    }
    const quotationIds = quotations.map((q) => q.quotation_id);
    const projectIds = quotations.map((q) => q.converted_to_project_id).filter(Boolean);
    const surveyIds = quotations.map((q) => q.survey_id).filter(Boolean);
    const queryPromises = [
      projectIds.length > 0 ? pool.query("SELECT * FROM purchase_orders WHERE quotation_id IN (?) OR project_id IN (?)", [quotationIds, projectIds]) : pool.query("SELECT * FROM purchase_orders WHERE quotation_id IN (?)", [quotationIds]),
      projectIds.length > 0 ? pool.query("SELECT * FROM goods_receipt_notes WHERE quotation_id IN (?) OR project_id IN (?)", [quotationIds, projectIds]) : pool.query("SELECT * FROM goods_receipt_notes WHERE quotation_id IN (?)", [quotationIds])
    ];
    if (surveyIds.length > 0) {
      queryPromises.push(pool.query("SELECT * FROM project_boms WHERE survey_id IN (?) AND status = 'Approved' ORDER BY id DESC", [surveyIds]));
    } else {
      queryPromises.push(Promise.resolve([[]]));
    }
    const [[allPos], [allGrns], [allBoms]] = await Promise.all(queryPromises);
    const bomIds = (allBoms || []).map((b) => b.id);
    let allBomItems = [];
    if (bomIds.length > 0) {
      const [items] = await pool.query("SELECT * FROM bom_items WHERE bom_id IN (?)", [bomIds]);
      allBomItems = items || [];
    }
    const bomsBySurveyId = {};
    for (const b of allBoms || []) {
      if (!bomsBySurveyId[b.survey_id]) {
        bomsBySurveyId[b.survey_id] = b;
      }
    }
    const itemsByBomId = {};
    for (const it of allBomItems) {
      if (!itemsByBomId[it.bom_id]) itemsByBomId[it.bom_id] = [];
      itemsByBomId[it.bom_id].push(it);
    }
    const posByQuote = {};
    for (const p of allPos || []) {
      if (p.quotation_id) {
        if (!posByQuote[p.quotation_id]) posByQuote[p.quotation_id] = [];
        posByQuote[p.quotation_id].push(p);
      }
      if (p.project_id) {
        if (!posByQuote[p.project_id]) posByQuote[p.project_id] = [];
        posByQuote[p.project_id].push(p);
      }
    }
    const grnsByQuote = {};
    for (const g of allGrns || []) {
      if (g.quotation_id) {
        if (!grnsByQuote[g.quotation_id]) grnsByQuote[g.quotation_id] = [];
        grnsByQuote[g.quotation_id].push(g);
      }
      if (g.project_id) {
        if (!grnsByQuote[g.project_id]) grnsByQuote[g.project_id] = [];
        grnsByQuote[g.project_id].push(g);
      }
    }
    const indents = [];
    for (const q of quotations) {
      const posMap = /* @__PURE__ */ new Map();
      (posByQuote[q.quotation_id] || []).forEach((p) => posMap.set(p.id, p));
      if (q.converted_to_project_id) {
        (posByQuote[q.converted_to_project_id] || []).forEach((p) => posMap.set(p.id, p));
      }
      const pos = Array.from(posMap.values());
      const grnsMap = /* @__PURE__ */ new Map();
      (grnsByQuote[q.quotation_id] || []).forEach((g) => grnsMap.set(g.id, g));
      if (q.converted_to_project_id) {
        (grnsByQuote[q.converted_to_project_id] || []).forEach((g) => grnsMap.set(g.id, g));
      }
      const grns = Array.from(grnsMap.values());
      const hasSignedGrn = grns.some((g) => g.customer_signature_data || g.customer_signature_name);
      const isDelivered = pos.some((p) => p.status === "Delivered");
      const isPartial = pos.some((p) => p.status === "Partial Delivered") || grns.some((g) => g.status === "Partial Shortage");
      const isIssued = pos.length > 0;
      const isProjectCompleted = q.project_stage === "Completed";
      let procurementStatus = "Pending Indent";
      if (isProjectCompleted) {
        procurementStatus = "Project Completed (Procurement Closed)";
      } else if (hasSignedGrn && isDelivered && !isPartial) {
        procurementStatus = "Materials Delivered & Signed";
      } else if (isPartial) {
        procurementStatus = "Partial Shortage";
      } else if (isIssued) {
        procurementStatus = "PO Issued / In-Transit";
      }
      let items = [];
      let bomId = null;
      if (q.survey_id && bomsBySurveyId[q.survey_id]) {
        bomId = bomsBySurveyId[q.survey_id].id;
        items = itemsByBomId[bomId] || [];
      }
      if (items.length === 0 && q.versions) {
        try {
          const vData = typeof q.versions === "string" ? JSON.parse(q.versions) : q.versions;
          const activeVer = Array.isArray(vData) ? vData[vData.length - 1] : vData;
          if (activeVer && activeVer.items && Array.isArray(activeVer.items)) {
            items = activeVer.items.map((it) => ({
              id: it.id || `QI-${Math.random().toString(36).substr(2, 6)}`,
              item_name: it.description || it.name,
              category: it.category || "Solar BOS",
              quantity: it.quantity,
              unit: it.unit || "Nos",
              estimated_unit_cost: it.unitPrice || 1e3
            }));
          }
        } catch (e) {
          console.error("Error parsing quote items:", e);
        }
      }
      indents.push({
        indent_id: `IND-${q.quotation_id}`,
        quotation_id: q.quotation_id,
        quotation_number: q.quotation_number,
        customer_name: q.customer_name,
        customer_phone: q.customer_phone,
        customer_address: q.customer_address,
        system_size_kw: q.system_capacity_kw,
        total_amount: q.total_amount,
        bom_id: bomId,
        procurement_status: procurementStatus,
        quotation_status: q.quotation_status,
        converted_to_project_id: q.converted_to_project_id,
        project_stage: q.project_stage || null,
        is_completed: isProjectCompleted,
        has_signed_grn: hasSignedGrn,
        signed_grn: grns[0] || null,
        purchase_orders: pos,
        goods_receipt_notes: grns,
        items
      });
    }
    res.json({ success: true, indents });
  } catch (error) {
    console.error("Error fetching pending indents:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}
async function deletePurchaseOrder(req, res) {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM purchase_order_items WHERE po_id = ?", [id]);
    await pool.query("DELETE FROM goods_receipt_notes WHERE po_id = ?", [id]);
    await pool.query("DELETE FROM purchase_orders WHERE id = ?", [id]);
    res.json({ success: true, message: `Purchase order ${id} deleted successfully.` });
  } catch (error) {
    console.error("Error in deletePurchaseOrder:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}
async function deleteIndent(req, res) {
  try {
    const { id } = req.params;
    const cleanId = id.replace(/^IND-/, "");
    await pool.query("UPDATE quotations SET procurement_archived = 1 WHERE id = ?", [cleanId]);
    res.json({ success: true, message: `Indent ${id} removed.` });
  } catch (error) {
    console.error("Error in deleteIndent:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}
async function clearClosedIndents(req, res) {
  try {
    await pool.query(`
      UPDATE quotations q
      LEFT JOIN projects p ON p.id = q.converted_to_project_id
      SET q.procurement_archived = 1
      WHERE p.stage = 'Completed' OR q.status = 'Converted_To_Project'
    `);
    res.json({ success: true, message: "All closed procurement indents cleared." });
  } catch (error) {
    console.error("Error in clearClosedIndents:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}
async function convertToEpcProject(req, res) {
  const conn = await pool.getConnection();
  try {
    const { quotationId, projectManagerName, installationLeadName } = req.body;
    if (!quotationId) {
      conn.release();
      res.status(400).json({ success: false, error: "Quotation ID is required" });
      return;
    }
    const [qRows] = await conn.query("SELECT * FROM quotations WHERE id = ?", [quotationId]);
    if (!qRows || qRows.length === 0) {
      conn.release();
      res.status(404).json({ success: false, error: "Quotation not found" });
      return;
    }
    const quote = qRows[0];
    if (quote.converted_to_project_id) {
      const [existingProject] = await conn.query("SELECT * FROM projects WHERE id = ?", [quote.converted_to_project_id]);
      conn.release();
      if (existingProject && existingProject.length > 0) {
        return res.json({
          success: true,
          message: "Project already converted",
          alreadyConverted: true,
          project: existingProject[0]
        });
      }
    }
    const [grnRows] = await conn.query(
      `SELECT g.*, p.id as po_id FROM goods_receipt_notes g
       LEFT JOIN purchase_orders p ON g.po_id = p.id
       WHERE (g.quotation_id = ? OR p.quotation_id = ?) 
         AND (g.customer_signature_data IS NOT NULL OR g.customer_signature_name IS NOT NULL)
       ORDER BY g.created_at DESC LIMIT 1`,
      [quotationId, quotationId]
    );
    if (!grnRows || grnRows.length === 0) {
      conn.release();
      return res.status(400).json({
        success: false,
        error: "Cannot convert to EPC project: Required material receipt and customer digital signature conditions are not satisfied. Please ensure the Purchase Team records material arrival at site and captures the customer signature first."
      });
    }
    const grn = grnRows[0];
    const poId = grn.po_id || grn.poId || null;
    await conn.beginTransaction();
    const quoteTotal = Number(quote.total_amount) || 0;
    const capacityKw = Number(quote.system_capacity_kw) || 5;
    let customerId = "";
    let customerName = quote.lead_name;
    let customerPhone = quote.customer_phone;
    let customerAddress = quote.customer_address;
    const [existingCust] = await conn.query(
      "SELECT id, name, phone, address FROM customers WHERE converted_from_lead_id = ? OR phone = ? LIMIT 1",
      [quote.lead_id, quote.customer_phone]
    );
    if (existingCust && existingCust.length > 0) {
      customerId = existingCust[0].id;
      customerName = existingCust[0].name;
    } else {
      const [allCusts] = await conn.query("SELECT id FROM customers WHERE id LIKE 'CUST-2026-%'");
      let maxCustNum = 25;
      for (const c of allCusts) {
        const match = c.id.match(/CUST-2026-(\d+)/);
        if (match) {
          const n = parseInt(match[1], 10);
          if (n > maxCustNum) maxCustNum = n;
        }
      }
      customerId = `CUST-2026-${String(maxCustNum + 1).padStart(3, "0")}`;
      await conn.query(
        `INSERT INTO customers (
          id, name, email, phone, address, city, state, pincode, 
          consumer_number_discom, discom_name, converted_from_lead_id, 
          total_system_kw, total_order_value, paid_amount, balance_amount, 
          status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          customerId,
          customerName,
          `${customerName.toLowerCase().replace(/\s+/g, ".")}@example.com`,
          customerPhone,
          customerAddress || "Site Address",
          "Bengaluru",
          "Karnataka",
          "560001",
          `DISCOM-${Math.floor(1e6 + Math.random() * 9e6)}`,
          "BESCOM",
          quote.lead_id,
          capacityKw,
          quoteTotal,
          0,
          quoteTotal,
          "Under Installation"
        ]
      );
    }
    const [allProjs] = await conn.query("SELECT id FROM projects WHERE id LIKE 'PROJECT-2026-%' OR id LIKE 'PRJ-2026-%'");
    let maxProjNum = 25;
    for (const p of allProjs) {
      const match = p.id.match(/(?:PROJECT|PRJ)-2026-(\d+)/);
      if (match) {
        const n = parseInt(match[1], 10);
        if (n > maxProjNum) maxProjNum = n;
      }
    }
    const projectId = `PROJECT-2026-${String(maxProjNum + 1).padStart(3, "0")}`;
    const targetDate = new Date(Date.now() + 864e5 * 20).toISOString().split("T")[0];
    const initialTasks = [
      { id: `PT-${Date.now()}-1`, title: "DISCOM Net-metering application & sanction", stage: "Documentation", isCompleted: false, assignedRole: "Project Manager", assignedToName: projectManagerName || "Karthik Raja", dueDate: new Date(Date.now() + 864e5 * 3).toISOString().split("T")[0] },
      { id: `PT-${Date.now()}-2`, title: "Verify site physical readiness & electrical clearance", stage: "Site Readiness", isCompleted: false, assignedRole: "Project Manager", assignedToName: projectManagerName || "Karthik Raja", dueDate: new Date(Date.now() + 864e5 * 4).toISOString().split("T")[0] },
      { id: `PT-${Date.now()}-3`, title: "HDG structure foundation & anchor bolting", stage: "Installation Scheduled", isCompleted: false, assignedRole: "Installation Team", assignedToName: installationLeadName || "Muthu Vel", dueDate: new Date(Date.now() + 864e5 * 7).toISOString().split("T")[0] },
      { id: `PT-${Date.now()}-4`, title: "Module mounting & DC string conduit wiring", stage: "Installation In Progress", isCompleted: false, assignedRole: "Installation Team", assignedToName: installationLeadName || "Muthu Vel", dueDate: new Date(Date.now() + 864e5 * 10).toISOString().split("T")[0] }
    ];
    const initialChecklist = {
      structureFastening: false,
      moduleClampingTorque: false,
      inverterWallMounting: false,
      dcWiringConduit: false,
      acWiringArmoured: false,
      chemicalEarthingPits: false,
      lightningArrester: false,
      dcdbProtectionFuses: false,
      acdbMccbIsolator: false,
      remoteMonitoringConfigured: false,
      vocAndIscTesting: false,
      safetySignagesAffixed: false,
      photosUploaded: []
    };
    const materialStatus = grn.status === "Partial Shortage" ? "Partial Shortage" : "Materials Delivered & Signed";
    await conn.query(
      `INSERT INTO projects (
        id, customer_id, customer_name, customer_phone, customer_address, 
        quotation_id, capacity_kw, total_amount, stage, start_date, 
        target_completion_date, project_manager_id, project_manager_name, 
        installation_lead_id, installation_lead_name, checklist, tasks, 
        inventory_reserved, material_readiness_status, grn_id, signed_grn_pdf_url, po_id,
        site_readiness_confirmed, discom_sanction_number, notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Awaiting Site Readiness', ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, 0, ?, ?, NOW())`,
      [
        projectId,
        customerId,
        customerName,
        customerPhone,
        customerAddress,
        quote.id,
        capacityKw,
        quoteTotal,
        (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
        targetDate,
        "EMP-04",
        projectManagerName || "Karthik Raja",
        "EMP-05",
        installationLeadName || "Muthu Vel",
        JSON.stringify(initialChecklist),
        JSON.stringify(initialTasks),
        materialStatus,
        grn.id,
        grn.signed_pdf_url || null,
        poId,
        `BESCOM/SANCTION/${Date.now().toString().slice(-4)}`,
        `Converted EPC Project from Quotation ${quote.quotation_number}. Materials verified & customer signature captured under GRN ${grn.grn_number}.`
      ]
    );
    await conn.query(
      "UPDATE quotations SET status = 'Converted_To_Project', converted_to_project_id = ? WHERE id = ?",
      [projectId, quotationId]
    );
    if (grn.id) {
      await conn.query("UPDATE goods_receipt_notes SET project_id = ? WHERE id = ?", [projectId, grn.id]);
    }
    if (poId) {
      await conn.query("UPDATE purchase_orders SET project_id = ? WHERE id = ?", [projectId, poId]);
    }
    await conn.commit();
    conn.release();
    await createNotification({
      recipientRole: "Project Manager",
      title: `EPC Project Converted (${projectId})`,
      message: `Quotation ${quote.quotation_number} (${customerName}) successfully converted to EPC Project ${projectId}. Materials delivered and signed. Please inspect and confirm site readiness before installation starts.`,
      type: "info",
      link: grn.signed_pdf_url
    });
    await createNotification({
      recipientRole: "Installation Team",
      title: `New EPC Project Assigned (${projectId})`,
      message: `Project ${projectId} (${customerName}) created. Site materials delivered under GRN ${grn.grn_number}. Installation execution is locked awaiting PM site readiness confirmation.`,
      type: "info",
      link: grn.signed_pdf_url
    });
    res.json({
      success: true,
      projectId,
      message: "EPC Project converted successfully with full material receipt and customer signature audit trail.",
      project: {
        id: projectId,
        customerName,
        capacityKw,
        totalAmount: quoteTotal,
        stage: "Awaiting Site Readiness",
        materialReadinessStatus: materialStatus,
        signedGrnPdfUrl: grn.signed_pdf_url
      }
    });
  } catch (err) {
    await conn.rollback();
    conn.release();
    console.error("Error in convertToEpcProject:", err);
    res.status(500).json({ success: false, error: err.message });
  }
}
async function getPublicSigningGrn(req, res) {
  try {
    const { token } = req.params;
    if (!token) {
      res.status(400).json({ success: false, error: "Token is required" });
      return;
    }
    const [grnRows] = await pool.query(
      `SELECT g.*, p.po_number, p.supplier_name, p.delivery_warehouse as po_delivery_location
       FROM goods_receipt_notes g
       LEFT JOIN purchase_orders p ON g.po_id = p.id
       WHERE g.signing_token = ?`,
      [token]
    );
    if (!grnRows || grnRows.length === 0) {
      res.status(404).json({ success: false, error: "Signing link not found or invalid" });
      return;
    }
    const grn = grnRows[0];
    if (grn.signing_link_status === "Cancelled") {
      res.json({
        success: true,
        status: "Cancelled",
        error: "This signing link has been revoked by AB Energy Solutions. Please contact the purchase team.",
        grnNumber: grn.grn_number
      });
      return;
    }
    if (grn.signing_expires_at && new Date(grn.signing_expires_at) < /* @__PURE__ */ new Date() && grn.signing_link_status === "Pending") {
      await pool.query("UPDATE goods_receipt_notes SET signing_link_status = ? WHERE id = ?", ["Expired", grn.id]);
      res.json({
        success: true,
        status: "Expired",
        error: "This signing link has expired. Please request a new signing link from AB Energy Solutions.",
        grnNumber: grn.grn_number,
        expiresAt: grn.signing_expires_at
      });
      return;
    }
    if (grn.signing_link_status === "Signed") {
      res.json({
        success: true,
        status: "Signed",
        grn: {
          id: grn.id,
          grnNumber: grn.grn_number,
          poNumber: grn.po_number,
          customerName: grn.customer_signature_name,
          customerPhone: grn.customer_signature_phone,
          signedPdfUrl: grn.signed_pdf_url,
          signedAt: grn.signed_at || grn.customer_signature_date,
          verifiedBy: grn.verified_by
        }
      });
      return;
    }
    const [itemRows] = await pool.query(
      "SELECT * FROM grn_items WHERE grn_id = ? ORDER BY id ASC",
      [grn.id]
    );
    res.json({
      success: true,
      status: "Pending",
      grn: {
        id: grn.id,
        grnNumber: grn.grn_number,
        poNumber: grn.po_number,
        quotationNumber: grn.quotation_id,
        receivedDate: grn.received_date,
        deliveryWarehouse: grn.delivery_warehouse,
        deliveryChallanNo: grn.delivery_challan_no,
        supplierInvoiceNo: grn.supplier_invoice_no,
        supplierName: grn.supplier_name || "Authorized Vendor",
        customerName: grn.customer_signature_name,
        customerPhone: grn.customer_signature_phone,
        customerAddress: grn.delivery_location || grn.po_delivery_location || "Customer Installation Site",
        verifiedBy: grn.verified_by,
        notes: grn.notes,
        previewPdfUrl: grn.signed_pdf_url,
        documentVersion: grn.document_version || 1,
        expiresAt: grn.signing_expires_at,
        items: (itemRows || []).map((it) => ({
          id: it.id,
          itemName: it.item_name,
          category: it.category,
          orderedQuantity: Number(it.ordered_quantity || it.ordered_qty || 0),
          receivedQuantity: Number(it.received_quantity || it.received_qty || 0),
          acceptedQuantity: Number(it.accepted_quantity || it.accepted_qty || 0),
          rejectedQuantity: Number(it.rejected_quantity || it.rejected_qty || 0),
          unit: it.unit || "Nos",
          remarks: it.remarks || ""
        }))
      }
    });
  } catch (error) {
    console.error("Error in getPublicSigningGrn:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}
async function submitPublicCustomerSignature(req, res) {
  try {
    const { token } = req.params;
    const { customerName, customerSignature, declarationConsent } = req.body;
    if (!token) {
      res.status(400).json({ success: false, error: "Signing token is required" });
      return;
    }
    if (!customerSignature || !customerSignature.startsWith("data:image")) {
      res.status(400).json({ success: false, error: "Valid signature image is required" });
      return;
    }
    if (!declarationConsent) {
      res.status(400).json({ success: false, error: "You must consent to the material receipt declaration" });
      return;
    }
    const [grnRows] = await pool.query(
      `SELECT g.*, p.po_number, p.supplier_name, p.delivery_warehouse as po_delivery_location, p.project_id as po_project_id
       FROM goods_receipt_notes g
       LEFT JOIN purchase_orders p ON g.po_id = p.id
       WHERE g.signing_token = ?`,
      [token]
    );
    if (!grnRows || grnRows.length === 0) {
      res.status(404).json({ success: false, error: "Signing link not found or invalid" });
      return;
    }
    const grn = grnRows[0];
    if (grn.signing_link_status === "Signed") {
      res.status(400).json({
        success: false,
        error: "This Goods Receipt Note has already been electronically signed and cannot be signed again.",
        signedPdfUrl: grn.signed_pdf_url
      });
      return;
    }
    if (grn.signing_link_status === "Cancelled") {
      res.status(400).json({ success: false, error: "This signing link has been revoked." });
      return;
    }
    if (grn.signing_expires_at && new Date(grn.signing_expires_at) < /* @__PURE__ */ new Date()) {
      await pool.query("UPDATE goods_receipt_notes SET signing_link_status = ? WHERE id = ?", ["Expired", grn.id]);
      res.status(400).json({ success: false, error: "This signing link has expired. Please request a new link." });
      return;
    }
    const forwarded = req.headers["x-forwarded-for"];
    const ip = typeof forwarded === "string" ? forwarded.split(",")[0].trim() : req.socket.remoteAddress || "127.0.0.1";
    const userAgent = (req.headers["user-agent"] || "Mobile Browser").substring(0, 500);
    const signerName = (customerName || grn.customer_signature_name || "Customer").trim();
    const signedTimestamp = (/* @__PURE__ */ new Date()).toLocaleString("en-IN");
    const [itemRows] = await pool.query(
      "SELECT * FROM grn_items WHERE grn_id = ? ORDER BY id ASC",
      [grn.id]
    );
    const processedItems = (itemRows || []).map((it) => ({
      itemName: it.item_name,
      category: it.category,
      orderedQuantity: Number(it.ordered_quantity || it.ordered_qty || 0),
      receivedQuantity: Number(it.received_quantity || it.received_qty || 0),
      acceptedQuantity: Number(it.accepted_quantity || it.accepted_qty || 0),
      rejectedQuantity: Number(it.rejected_quantity || it.rejected_qty || 0),
      unit: it.unit || "Nos",
      remarks: it.remarks || ""
    }));
    let finalSignedPdfUrl = "";
    try {
      const pdfResult = await generateGrnPdf({
        grnNumber: grn.grn_number,
        poNumber: grn.po_number,
        quotationNumber: grn.quotation_id,
        receivedDate: grn.received_date,
        deliveryWarehouse: grn.delivery_warehouse,
        deliveryChallanNo: grn.delivery_challan_no,
        supplierInvoiceNo: grn.supplier_invoice_no,
        supplierName: grn.supplier_name || "Authorized Supplier",
        customerName: signerName,
        customerPhone: grn.customer_signature_phone,
        customerAddress: grn.delivery_location || grn.po_delivery_location,
        verifiedBy: grn.verified_by,
        notes: grn.notes,
        items: processedItems,
        customerSignatureData: customerSignature,
        customerSignatureName: signerName,
        customerSignaturePhone: grn.customer_signature_phone,
        customerSignatureDate: signedTimestamp,
        signingIp: ip,
        documentVersion: grn.document_version || 1,
        isPendingSignature: false
      });
      finalSignedPdfUrl = pdfResult.fileUrl;
    } catch (pdfErr) {
      console.error("Error generating final signed GRN PDF:", pdfErr);
      finalSignedPdfUrl = grn.signed_pdf_url || `/documents/grn_${grn.grn_number}.pdf`;
    }
    await pool.query(
      `UPDATE goods_receipt_notes SET
         customer_signature_data = ?,
         customer_signature_name = ?,
         customer_signature_date = NOW(),
         signed_at = NOW(),
         signed_pdf_url = ?,
         status = 'Signed',
         signing_link_status = 'Signed',
         signing_ip = ?,
         signing_user_agent = ?,
         declaration_consent = 1
       WHERE id = ?`,
      [customerSignature, signerName, finalSignedPdfUrl, ip, userAgent, grn.id]
    );
    if (grn.po_id) {
      await pool.query(
        "UPDATE purchase_orders SET status = ?, delivery_challan_url = ? WHERE id = ?",
        ["Delivered", finalSignedPdfUrl, grn.po_id]
      );
    }
    const targetProjectId = grn.project_id || grn.po_project_id;
    if (targetProjectId) {
      await pool.query(
        "UPDATE projects SET material_readiness_status = ?, grn_id = ?, signed_grn_pdf_url = ? WHERE id = ?",
        ["Materials Delivered & Signed", grn.id, finalSignedPdfUrl, targetProjectId]
      );
    }
    await createNotification({
      recipientRole: "Purchase Team",
      title: `GRN Signed by Customer (${grn.grn_number})`,
      message: `Customer ${signerName} has electronically signed the Goods Receipt Note for PO ${grn.po_number}. Site delivery confirmed.`,
      type: "success",
      link: finalSignedPdfUrl
    });
    await createNotification({
      recipientRole: "Project Manager",
      title: `Site Materials Received & Signed (${grn.grn_number})`,
      message: `Customer ${signerName} has completed electronic signing for site materials (${grn.grn_number}). Material readiness verified.`,
      type: "success",
      link: finalSignedPdfUrl
    });
    res.json({
      success: true,
      grnNumber: grn.grn_number,
      signedPdfUrl: finalSignedPdfUrl,
      signedAt: signedTimestamp,
      signerName,
      message: "Goods Receipt Note has been electronically signed successfully."
    });
  } catch (error) {
    console.error("Error in submitPublicCustomerSignature:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}
async function getGoodsReceiptNotes(req, res) {
  try {
    const { poId, quotationId, status } = req.query;
    let sql = `
      SELECT g.*, p.po_number, p.supplier_name, p.delivery_warehouse as po_delivery_location
      FROM goods_receipt_notes g
      LEFT JOIN purchase_orders p ON g.po_id = p.id
    `;
    const conditions = [];
    const params = [];
    if (poId) {
      conditions.push("g.po_id = ?");
      params.push(poId);
    }
    if (quotationId) {
      conditions.push("g.quotation_id = ?");
      params.push(quotationId);
    }
    if (status) {
      conditions.push("g.signing_link_status = ?");
      params.push(status);
    }
    if (conditions.length > 0) {
      sql += " WHERE " + conditions.join(" AND ");
    }
    sql += " ORDER BY g.created_at DESC";
    const [rows] = await pool.query(sql, params);
    const host = req.get("host") || "localhost:3000";
    const protocol = req.protocol || "http";
    const grns = rows.map((r) => ({
      ...r,
      signing_url: r.signing_token ? `${protocol}://${host}/sign-grn/${r.signing_token}` : null,
      is_expired: r.signing_expires_at && new Date(r.signing_expires_at) < /* @__PURE__ */ new Date() && r.signing_link_status === "Pending"
    }));
    res.json({ success: true, grns });
  } catch (error) {
    console.error("Error in getGoodsReceiptNotes:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}
async function resendSigningLink(req, res) {
  try {
    const { id } = req.params;
    const [rows] = await pool.query("SELECT * FROM goods_receipt_notes WHERE id = ?", [id]);
    if (!rows || rows.length === 0) {
      res.status(404).json({ success: false, error: "GRN not found" });
      return;
    }
    const grn = rows[0];
    if (grn.signing_link_status === "Signed") {
      res.status(400).json({ success: false, error: "Cannot resend: GRN has already been signed by the customer." });
      return;
    }
    const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1e3);
    const newToken = crypto2.randomBytes(24).toString("hex");
    await pool.query(
      `UPDATE goods_receipt_notes SET
         signing_token = ?,
         signing_link_status = 'Pending',
         signing_expires_at = ?,
         resend_count = resend_count + 1
       WHERE id = ?`,
      [newToken, newExpiresAt, id]
    );
    const host = req.get("host") || "localhost:3000";
    const protocol = req.protocol || "http";
    const signingUrl = `${protocol}://${host}/sign-grn/${newToken}`;
    res.json({
      success: true,
      signingUrl,
      signingToken: newToken,
      expiresAt: newExpiresAt,
      message: "Signing link has been refreshed and extended by 7 days."
    });
  } catch (error) {
    console.error("Error in resendSigningLink:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}
async function revokeSigningLink(req, res) {
  try {
    const { id } = req.params;
    const [rows] = await pool.query("SELECT * FROM goods_receipt_notes WHERE id = ?", [id]);
    if (!rows || rows.length === 0) {
      res.status(404).json({ success: false, error: "GRN not found" });
      return;
    }
    const grn = rows[0];
    if (grn.signing_link_status === "Signed") {
      res.status(400).json({ success: false, error: "Cannot revoke: GRN has already been signed." });
      return;
    }
    const userName = req.user?.name || "Authorized Staff";
    await pool.query(
      `UPDATE goods_receipt_notes SET
         signing_link_status = 'Cancelled',
         status = 'Cancelled',
         revoked_at = NOW(),
         revoked_by = ?
       WHERE id = ?`,
      [userName, id]
    );
    res.json({
      success: true,
      message: "Signing link has been revoked. Customer will no longer be able to sign using this link."
    });
  } catch (error) {
    console.error("Error in revokeSigningLink:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}

// server/routes/procurement.routes.ts
var router = Router14();
router.get("/sign-grn/:token", getPublicSigningGrn);
router.post("/sign-grn/:token", submitPublicCustomerSignature);
router.get("/orders", authenticateToken, getPurchaseOrders);
router.post("/orders", authenticateToken, requireRole(["Purchase Team", "Project Manager", "Super Admin"]), createPurchaseOrder);
router.delete("/orders/:id", authenticateToken, requireRole(["Purchase Team", "Project Manager", "Super Admin", "Sales Manager"]), deletePurchaseOrder);
router.get("/grns", authenticateToken, getGoodsReceiptNotes);
router.post("/grn", authenticateToken, requireRole(["Purchase Team", "Project Manager", "Super Admin"]), createGoodsReceiptNote);
router.post("/grn/:id/resend-link", authenticateToken, requireRole(["Purchase Team", "Project Manager", "Super Admin"]), resendSigningLink);
router.post("/grn/:id/revoke-link", authenticateToken, requireRole(["Purchase Team", "Project Manager", "Super Admin"]), revokeSigningLink);
router.get("/pending-indents", authenticateToken, getPendingIndents);
router.get("/indents", authenticateToken, getPendingIndents);
router.delete("/indents-closed/all", authenticateToken, requireRole(["Purchase Team", "Project Manager", "Super Admin", "Sales Manager"]), clearClosedIndents);
router.delete("/indents/:id", authenticateToken, requireRole(["Purchase Team", "Project Manager", "Super Admin", "Sales Manager"]), deleteIndent);
router.post("/convert-to-project", authenticateToken, requireRole(["Purchase Team", "Project Manager", "Super Admin"]), convertToEpcProject);
var procurement_routes_default = router;

// server/routes/installation.routes.ts
import { Router as Router15 } from "express";

// server/controllers/installation.controller.ts
async function recordAttendance(req, res) {
  try {
    const {
      projectId,
      leadId,
      date,
      presentTeamMembers,
      siteLeadName,
      latitude,
      longitude,
      checkInTime,
      notes
    } = req.body;
    if (!projectId || !siteLeadName) {
      res.status(400).json({ success: false, error: "Project ID and Site Lead Name are required" });
      return;
    }
    const id = `ATT-${Date.now().toString().slice(-6)}`;
    const attendanceDate = date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const time = checkInTime || (/* @__PURE__ */ new Date()).toTimeString().split(" ")[0];
    const membersArray = Array.isArray(presentTeamMembers) ? presentTeamMembers.map((m) => typeof m === "string" ? m.trim() : String(m)).filter(Boolean) : presentTeamMembers ? [String(presentTeamMembers).trim()] : [siteLeadName];
    if (membersArray.length === 0) {
      membersArray.push(siteLeadName);
    }
    await pool.query(
      `INSERT INTO installation_attendance
        (id, project_id, lead_id, date, team_lead_name, site_lead_name, technicians_present, present_team_members, latitude, gps_lat, longitude, gps_lng, check_in_time, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        projectId,
        leadId || null,
        attendanceDate,
        siteLeadName,
        siteLeadName,
        JSON.stringify(membersArray),
        JSON.stringify(membersArray),
        latitude || null,
        latitude || null,
        longitude || null,
        longitude || null,
        time,
        "Present",
        notes || ""
      ]
    );
    try {
      const [pRows] = await pool.query("SELECT customer_name, id FROM projects WHERE id = ?", [projectId]);
      const customerLabel = pRows?.[0]?.customer_name ? `${pRows[0].customer_name} (${projectId})` : projectId;
      const memberCount = membersArray.length;
      const crewLabel = memberCount === 1 ? `Solo check-in (${siteLeadName})` : `${siteLeadName} & ${memberCount - 1} crew member(s)`;
      const gpsLabel = latitude && longitude ? ` [GPS: ${Number(latitude).toFixed(4)}, ${Number(longitude).toFixed(4)}]` : "";
      await createNotification({
        recipientRole: "Project Manager",
        title: "Installation Crew Checked In on Site",
        message: `${crewLabel} arrived at ${customerLabel} and checked in at ${time}${gpsLabel}.`,
        type: "success",
        link: "/projects"
      });
    } catch (notifErr) {
      console.error("Error dispatching PM attendance notification:", notifErr.message);
    }
    res.json({
      success: true,
      attendance: {
        id,
        projectId,
        date: attendanceDate,
        siteLeadName,
        presentTeamMembers: membersArray,
        latitude: latitude || null,
        longitude: longitude || null,
        checkInTime: time
      }
    });
  } catch (error) {
    console.error("Error recording installation attendance:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}
async function getProjectAttendance(req, res) {
  try {
    const { projectId } = req.params;
    const [rows] = await pool.query(
      "SELECT * FROM installation_attendance WHERE project_id = ? ORDER BY date DESC, check_in_time DESC",
      [projectId]
    );
    const attendance = rows.map((r) => {
      let members = [];
      if (r.present_team_members) {
        if (typeof r.present_team_members === "string") {
          try {
            const parsed = JSON.parse(r.present_team_members);
            members = Array.isArray(parsed) ? parsed : [parsed];
          } catch {
            members = r.present_team_members.split(",").map((s) => s.trim()).filter(Boolean);
          }
        } else if (Array.isArray(r.present_team_members)) {
          members = r.present_team_members;
        }
      } else if (r.technicians_present) {
        members = r.technicians_present.split(",").map((s) => s.trim()).filter(Boolean);
      } else {
        members = [r.site_lead_name || r.team_lead_name || "Site Crew"];
      }
      return {
        id: r.id,
        projectId: r.project_id,
        date: r.date,
        siteLeadName: r.site_lead_name || r.team_lead_name,
        checkInTime: r.check_in_time,
        latitude: r.latitude || r.gps_lat,
        longitude: r.longitude || r.gps_lng,
        presentTeamMembers: members,
        notes: r.notes,
        createdAt: r.created_at
      };
    });
    res.json({ success: true, attendance });
  } catch (error) {
    console.error("Error fetching attendance:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}
async function logProgress(req, res) {
  try {
    const {
      projectId,
      milestone,
      status,
      percentageCompleted,
      loggedBy,
      notes
    } = req.body;
    if (!projectId || !milestone) {
      res.status(400).json({ success: false, error: "Project ID and milestone name are required" });
      return;
    }
    const id = `PRG-${Date.now().toString().slice(-6)}`;
    const pct = Number(percentageCompleted) || 0;
    await pool.query(
      `INSERT INTO installation_progress_logs
        (id, project_id, milestone, status, percentage_completed, logged_by, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        projectId,
        milestone,
        status || "Completed",
        pct,
        loggedBy || req.user?.name || "Installation Lead",
        notes || ""
      ]
    );
    if (pct === 100 && milestone.toLowerCase().includes("commission")) {
      await pool.query(
        "UPDATE projects SET stage = 'Commissioning', commissioning_date = CURDATE() WHERE id = ?",
        [projectId]
      );
    }
    res.json({
      success: true,
      progressLog: {
        id,
        projectId,
        milestone,
        status: status || "Completed",
        percentageCompleted: pct
      }
    });
  } catch (error) {
    console.error("Error logging installation progress:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}
async function getProjectCommandCentre(req, res) {
  try {
    const { projectId } = req.params;
    const [projectRows] = await pool.query("SELECT * FROM projects WHERE id = ?", [projectId]);
    if (!projectRows || projectRows.length === 0) {
      res.status(404).json({ success: false, error: "Project not found" });
      return;
    }
    const project = projectRows[0];
    let survey = null;
    if (project.quotation_id) {
      const [qRows] = await pool.query("SELECT survey_id FROM quotations WHERE id = ?", [project.quotation_id]);
      if (qRows.length > 0 && qRows[0].survey_id) {
        const [sRows] = await pool.query("SELECT * FROM site_surveys WHERE id = ?", [qRows[0].survey_id]);
        if (sRows.length > 0) survey = sRows[0];
      }
    }
    let customerDoc = null;
    try {
      const [docRows] = await pool.query(
        "SELECT * FROM customer_documents WHERE customer_id = ? OR project_id = ? LIMIT 1",
        [project.customer_id, projectId]
      );
      if (docRows.length > 0) {
        const d = docRows[0];
        customerDoc = {
          id: d.id,
          customerId: d.customer_id,
          documentType: d.document_type || "ID Proof",
          idNumberMasked: d.id_number ? `${d.id_number.slice(0, 4)}XXXX${d.id_number.slice(-4)}` : "Verified",
          isVerified: true,
          createdAt: d.uploaded_at || d.created_at || (/* @__PURE__ */ new Date()).toISOString()
        };
      }
    } catch (docErr) {
      console.error("Error fetching customer doc in CC:", docErr);
    }
    let bom = null;
    let bomItems = [];
    if (project.bom_id) {
      try {
        const [bRows] = await pool.query("SELECT * FROM project_boms WHERE id = ?", [project.bom_id]);
        if (bRows.length > 0) {
          bom = bRows[0];
          const [iRows] = await pool.query("SELECT * FROM bom_items WHERE bom_id = ?", [bom.id]);
          bomItems = iRows;
        }
      } catch (bomErr) {
        console.error("Error fetching BOM in CC:", bomErr);
      }
    }
    let poRows = [];
    let grnRows = [];
    try {
      const [pos] = await pool.query("SELECT * FROM purchase_orders WHERE project_id = ?", [projectId]);
      poRows = pos || [];
      const [grns] = await pool.query("SELECT * FROM goods_receipt_notes WHERE project_id = ?", [projectId]);
      grnRows = grns || [];
    } catch (pErr) {
      console.error("Error fetching PO/GRN in CC:", pErr);
    }
    let attendance = [];
    let progressRows = [];
    try {
      const [attRows] = await pool.query(
        "SELECT * FROM installation_attendance WHERE project_id = ? ORDER BY date DESC, check_in_time DESC",
        [projectId]
      );
      attendance = (attRows || []).map((r) => {
        let members = [];
        if (r.present_team_members) {
          if (typeof r.present_team_members === "string") {
            try {
              const parsed = JSON.parse(r.present_team_members);
              members = Array.isArray(parsed) ? parsed : [parsed];
            } catch {
              members = r.present_team_members.split(",").map((s) => s.trim()).filter(Boolean);
            }
          } else if (Array.isArray(r.present_team_members)) {
            members = r.present_team_members;
          }
        } else if (r.technicians_present) {
          members = r.technicians_present.split(",").map((s) => s.trim()).filter(Boolean);
        } else {
          members = [r.site_lead_name || r.team_lead_name || "Site Crew"];
        }
        return {
          id: r.id,
          projectId: r.project_id,
          date: r.date,
          siteLeadName: r.site_lead_name || r.team_lead_name || "Site Lead",
          check_in_time: r.check_in_time || "09:00",
          latitude: r.latitude || r.gps_lat,
          longitude: r.longitude || r.gps_lng,
          presentTeamMembers: members,
          notes: r.notes
        };
      });
      const [progs] = await pool.query(
        "SELECT * FROM installation_progress_logs WHERE project_id = ? ORDER BY created_at DESC",
        [projectId]
      );
      progressRows = progs || [];
    } catch (attErr) {
      console.error("Error fetching attendance in CC:", attErr);
    }
    res.json({
      success: true,
      commandCentre: {
        project,
        survey,
        customerDoc,
        bom,
        bomItems,
        purchaseOrders: poRows,
        goodsReceiptNotes: grnRows,
        attendance,
        progressLogs: progressRows,
        materialReadiness: project.material_readiness_status || "Pending Indent"
      }
    });
  } catch (error) {
    console.error("Error fetching Project Command Centre:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}

// server/routes/installation.routes.ts
var router2 = Router15();
router2.post("/attendance", authenticateToken, recordAttendance);
router2.get("/attendance/:projectId", authenticateToken, getProjectAttendance);
router2.post("/progress", authenticateToken, logProgress);
router2.get("/command-centre/:projectId", authenticateToken, getProjectCommandCentre);
var installation_routes_default = router2;

// server/routes/notifications.routes.ts
import { Router as Router16 } from "express";
var notificationsRouter = Router16();
notificationsRouter.get("/", authenticateToken, getNotifications);
notificationsRouter.put("/:id/read", authenticateToken, markNotificationRead);

// server/routes/telephony.routes.ts
import { Router as Router17 } from "express";

// server/controllers/telephony.controller.ts
function normalizePhone(phone) {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 10 ? digits.slice(-10) : digits;
}
var syncCallLog = async (req, res) => {
  try {
    const {
      employee_id,
      employee_phone,
      customer_phone,
      customer_name,
      call_type,
      call_status,
      duration_seconds,
      call_time,
      sim_slot,
      notes,
      disposition
    } = req.body;
    if (!customer_phone || !call_type) {
      return res.status(400).json({
        success: false,
        message: "customer_phone and call_type (INCOMING, OUTGOING, MISSED, REJECTED) are required."
      });
    }
    const normCustomerPhone = normalizePhone(customer_phone);
    const normEmployeePhone = normalizePhone(employee_phone || "");
    let resolvedEmpId = employee_id || null;
    let resolvedEmpName = null;
    let resolvedEmpPhone = employee_phone || null;
    if (normEmployeePhone) {
      const [empRows] = await pool.query(
        `SELECT id, name, phone FROM employees WHERE REPLACE(REPLACE(REPLACE(phone, ' ', ''), '-', ''), '+', '') LIKE ? LIMIT 1`,
        [`%${normEmployeePhone}`]
      );
      if (empRows && empRows.length > 0) {
        resolvedEmpId = empRows[0].id;
        resolvedEmpName = empRows[0].name;
        resolvedEmpPhone = empRows[0].phone;
      }
    } else if (resolvedEmpId) {
      const [empRows] = await pool.query(
        `SELECT id, name, phone FROM employees WHERE id = ? LIMIT 1`,
        [resolvedEmpId]
      );
      if (empRows && empRows.length > 0) {
        resolvedEmpName = empRows[0].name;
        resolvedEmpPhone = empRows[0].phone;
      }
    }
    if (!resolvedEmpName && req.user) {
      resolvedEmpId = req.user.id || resolvedEmpId;
      resolvedEmpName = req.user.name || req.user.username;
    }
    let resolvedLeadId = null;
    let resolvedCustName = customer_name || null;
    if (normCustomerPhone) {
      const [leadRows] = await pool.query(
        `SELECT id, name FROM leads WHERE REPLACE(REPLACE(REPLACE(phone, ' ', ''), '-', ''), '+', '') LIKE ? LIMIT 1`,
        [`%${normCustomerPhone}`]
      );
      if (leadRows && leadRows.length > 0) {
        resolvedLeadId = leadRows[0].id;
        resolvedCustName = leadRows[0].name;
      } else {
        const [custRows] = await pool.query(
          `SELECT id, name FROM customers WHERE REPLACE(REPLACE(REPLACE(phone, ' ', ''), '-', ''), '+', '') LIKE ? LIMIT 1`,
          [`%${normCustomerPhone}`]
        );
        if (custRows && custRows.length > 0) {
          resolvedCustName = custRows[0].name;
        }
      }
    }
    const formattedCallTime = call_time ? new Date(call_time) : /* @__PURE__ */ new Date();
    const callId = `CALL-${Date.now()}-${Math.floor(Math.random() * 1e3)}`;
    const isMissed = call_type === "MISSED" || call_status === "MISSED";
    const isResolved = !isMissed;
    await pool.query(
      `INSERT INTO call_logs (
        id, employee_id, employee_name, employee_phone,
        customer_phone, customer_name, lead_id,
        call_type, call_status, duration_seconds,
        call_time, sim_slot, disposition, notes, is_resolved
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        duration_seconds = VALUES(duration_seconds),
        call_status = VALUES(call_status),
        disposition = COALESCE(VALUES(disposition), disposition),
        notes = COALESCE(VALUES(notes), notes)`,
      [
        callId,
        resolvedEmpId,
        resolvedEmpName || "Sales Staff",
        resolvedEmpPhone || employee_phone || "Device SIM",
        customer_phone,
        resolvedCustName || "Unknown Caller",
        resolvedLeadId,
        call_type,
        call_status || (isMissed ? "MISSED" : "ANSWERED"),
        Number(duration_seconds) || 0,
        formattedCallTime,
        Number(sim_slot) || 1,
        disposition || null,
        notes || null,
        isResolved
      ]
    );
    return res.status(201).json({
      success: true,
      message: "Call log synced successfully",
      call_id: callId,
      matched_lead: resolvedLeadId ? { id: resolvedLeadId, name: resolvedCustName } : null,
      is_missed: isMissed
    });
  } catch (error) {
    console.error("Error syncing call log:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to sync call log",
      error: error.message
    });
  }
};
var getCallLogs = async (req, res) => {
  try {
    const user2 = req.user;
    const {
      type,
      status,
      unresolved_only,
      employee_id,
      search,
      start_date,
      end_date,
      limit = 50,
      offset = 0
    } = req.query;
    const userRole = (user2?.role || "").toLowerCase().replace(/[\s_-]+/g, "");
    const isManager = Boolean(
      !user2 || userRole === "admin" || userRole === "salesmanager" || userRole === "superadmin" || userRole === "management" || userRole === "managingdirector" || userRole === "ceo" || userRole === "manager" || user2.role === "Sales Manager" || user2.role === "Super Admin"
    );
    const baseConditions = ["1=1"];
    const baseParams = [];
    if (!isManager && user2) {
      const empId = user2.employeeId || user2.id || user2.userId;
      const empPhone = user2.phone || "";
      baseConditions.push("(employee_id = ? OR employee_id = ? OR employee_phone = ?)");
      baseParams.push(empId, user2.id, empPhone);
    } else if (employee_id) {
      baseConditions.push("employee_id = ?");
      baseParams.push(employee_id);
    }
    const queryConditions = [...baseConditions];
    const queryParams = [...baseParams];
    if (type) {
      queryConditions.push("call_type = ?");
      queryParams.push(type);
    }
    if (status) {
      queryConditions.push("call_status = ?");
      queryParams.push(status);
    }
    if (unresolved_only === "true") {
      queryConditions.push('call_type = "MISSED" AND is_resolved = FALSE');
    }
    if (search) {
      queryConditions.push("(customer_phone LIKE ? OR customer_name LIKE ? OR employee_name LIKE ? OR notes LIKE ?)");
      const searchParam = `%${search}%`;
      queryParams.push(searchParam, searchParam, searchParam, searchParam);
    }
    if (start_date) {
      queryConditions.push("call_time >= ?");
      queryParams.push(start_date);
    }
    if (end_date) {
      queryConditions.push("call_time <= ?");
      queryParams.push(end_date);
    }
    const whereClause = queryConditions.join(" AND ");
    const [calls] = await pool.query(
      `SELECT * FROM call_logs 
       WHERE ${whereClause} 
       ORDER BY call_time DESC 
       LIMIT ? OFFSET ?`,
      [...queryParams, Number(limit), Number(offset)]
    );
    const baseWhereClause = baseConditions.join(" AND ");
    const [summaryRows] = await pool.query(
      `SELECT 
         COUNT(*) as total_calls_today,
         COALESCE(SUM(CASE WHEN call_type = 'OUTGOING' THEN 1 ELSE 0 END), 0) as outgoing_count,
         COALESCE(SUM(CASE WHEN call_type = 'INCOMING' AND call_status = 'ANSWERED' THEN 1 ELSE 0 END), 0) as incoming_count,
         COALESCE(SUM(CASE WHEN call_type = 'MISSED' THEN 1 ELSE 0 END), 0) as missed_count,
         COALESCE(SUM(CASE WHEN call_type = 'MISSED' AND is_resolved = FALSE THEN 1 ELSE 0 END), 0) as unresolved_missed_count,
         COALESCE(SUM(duration_seconds), 0) as total_talk_time_seconds
       FROM call_logs 
       WHERE ${baseWhereClause} AND (DATE(call_time) = CURDATE() OR call_time >= DATE_SUB(NOW(), INTERVAL 24 HOUR))`,
      baseParams
    );
    let teamBreakdown = [];
    if (isManager) {
      const [teamRows] = await pool.query(
        `SELECT 
           COALESCE(employee_id, 'UNKNOWN') as employee_id,
           COALESCE(employee_name, 'Unassigned') as employee_name,
           COUNT(*) as total_calls,
           COALESCE(SUM(CASE WHEN call_type = 'OUTGOING' THEN 1 ELSE 0 END), 0) as outgoing_calls,
           COALESCE(SUM(CASE WHEN call_type = 'MISSED' AND is_resolved = FALSE THEN 1 ELSE 0 END), 0) as pending_missed,
           COALESCE(SUM(duration_seconds), 0) as talk_time_seconds
         FROM call_logs
         WHERE (DATE(call_time) = CURDATE() OR call_time >= DATE_SUB(NOW(), INTERVAL 24 HOUR))
         GROUP BY employee_id, employee_name
         ORDER BY total_calls DESC`
      );
      teamBreakdown = teamRows;
    }
    return res.json({
      success: true,
      calls,
      metrics: summaryRows[0] || {
        total_calls_today: 0,
        outgoing_count: 0,
        incoming_count: 0,
        missed_count: 0,
        unresolved_missed_count: 0,
        total_talk_time_seconds: 0
      },
      team_breakdown: teamBreakdown,
      is_manager_view: isManager
    });
  } catch (error) {
    console.error("Error fetching call logs:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch call logs",
      error: error.message
    });
  }
};
var resolveMissedCall = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const user2 = req.user;
    const resolvedBy = user2 ? user2.name || user2.username : "Sales Staff";
    const [result] = await pool.query(
      `UPDATE call_logs 
       SET is_resolved = TRUE, 
           resolved_at = NOW(), 
           resolved_by = ?, 
           notes = COALESCE(?, notes)
       WHERE id = ?`,
      [resolvedBy, notes || "Callback completed by sales staff", id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Call record not found" });
    }
    return res.json({
      success: true,
      message: "Missed call marked as resolved"
    });
  } catch (error) {
    console.error("Error resolving missed call:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to resolve missed call",
      error: error.message
    });
  }
};
var updateCallDisposition = async (req, res) => {
  try {
    const { id } = req.params;
    const { disposition, notes } = req.body;
    const [result] = await pool.query(
      `UPDATE call_logs 
       SET disposition = ?, notes = ?
       WHERE id = ?`,
      [disposition, notes, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Call record not found" });
    }
    return res.json({
      success: true,
      message: "Call disposition updated successfully"
    });
  } catch (error) {
    console.error("Error updating call disposition:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update call disposition",
      error: error.message
    });
  }
};
var deleteCallLog = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query(
      `DELETE FROM call_logs WHERE id = ?`,
      [id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Call record not found" });
    }
    return res.json({
      success: true,
      message: "Call record deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting call log:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete call log",
      error: error.message
    });
  }
};

// server/routes/telephony.routes.ts
var telephonyRouter = Router17();
telephonyRouter.post("/sync-call", syncCallLog);
telephonyRouter.get("/calls", authenticateToken, getCallLogs);
telephonyRouter.post("/resolve-missed/:id", authenticateToken, resolveMissedCall);
telephonyRouter.patch("/calls/:id/disposition", authenticateToken, updateCallDisposition);
telephonyRouter.delete("/calls/:id", authenticateToken, deleteCallLog);

// server/routes/subsidies.routes.ts
import { Router as Router18 } from "express";
import fs5 from "fs";
import path6 from "path";
var subsidiesRouter = Router18();
var initialSubsidies = [
  {
    id: "SUB-2026-001",
    project_id: "PROJECT-2026-023",
    project_number: "PRJ-2026-023",
    customer_name: "Vikrant Deshpande",
    customer_phone: "+91 98450 12345",
    customer_email: "vikrant.deshpande@example.com",
    customer_type: "residential",
    is_eligible: true,
    site_address: "142, Anna Nagar West, Namakkal, Tamil Nadu - 637001",
    discom_name: "TANGEDCO",
    discom_section_office: "Namakkal Town AEE Office",
    consumer_number: "04-122-005-981",
    sanctioned_load_kw: 25,
    system_capacity_kw: 20,
    subsidy_applicable_amount: 78e3,
    // Capped at 78,000 max for domestic
    dcr_modules_used: true,
    panel_make_and_model: "Tata Power Solar 545W Mono PERC (DCR)",
    inverter_make_and_model: "Sungrow 20kW On-Grid Inverter",
    portal_application_no: "PMS-TN-2026-98124",
    application_submission_date: "2026-09-15",
    current_stage: 5,
    current_stage_name: "DISCOM Joint Inspection Scheduled",
    stage_status: "in_progress",
    days_in_current_stage: 4,
    is_delayed: false,
    tfr_number: "TFR/NKL/2026/8421",
    tfr_approval_date: "2026-09-28",
    vendor_selected_date: "2026-10-02",
    wcr_submission_date: "2026-10-18",
    joint_inspection_date: "2026-10-29",
    inspecting_officer_name: "Er. S. Selvakumar, AEE/TANGEDCO",
    inspecting_officer_phone: "+91 94433 12456",
    documents: {
      electricity_bill: true,
      aadhaar_card: true,
      cancelled_cheque: true,
      roof_photo_geotagged: true,
      dcr_certificate: true,
      tfr_letter: true,
      wcr_copy: true,
      net_meter_test_report: false,
      commissioning_cert: false
    },
    notes: "Structure and inverter installed with DCR modules. TANGEDCO AEE scheduled inspection for Thursday 11 AM.",
    last_updated: "2026-10-25"
  },
  {
    id: "SUB-2026-002",
    project_id: "PROJECT-2026-021",
    project_number: "PRJ-2026-021",
    customer_name: "K. Balasubramaniam",
    customer_phone: "+91 94432 87654",
    customer_email: "bala.kumar@example.com",
    customer_type: "residential",
    is_eligible: true,
    site_address: "88, Gandhi Road, Paramathi Velur, Namakkal - 637207",
    discom_name: "TANGEDCO",
    discom_section_office: "Paramathi Distribution Section",
    consumer_number: "04-188-012-340",
    sanctioned_load_kw: 5,
    system_capacity_kw: 3.3,
    subsidy_applicable_amount: 78e3,
    dcr_modules_used: true,
    panel_make_and_model: "Waaree 550W Bi-facial DCR",
    inverter_make_and_model: "Growatt 3.3kW Single Phase",
    portal_application_no: "PMS-TN-2026-77319",
    application_submission_date: "2026-08-10",
    current_stage: 7,
    current_stage_name: "DBT Subsidy Disbursed to Bank",
    stage_status: "completed",
    days_in_current_stage: 0,
    is_delayed: false,
    tfr_number: "TFR/PMV/2026/3310",
    tfr_approval_date: "2026-08-22",
    vendor_selected_date: "2026-08-25",
    wcr_submission_date: "2026-09-08",
    joint_inspection_date: "2026-09-14",
    inspecting_officer_name: "Er. R. Murugesan",
    inspecting_officer_phone: "+91 94430 98123",
    net_meter_number: "L&T-GEN-98214-2026",
    net_meter_install_date: "2026-09-16",
    commissioning_certificate_date: "2026-09-18",
    dbt_disbursal_amount: 78e3,
    dbt_bank_utr: "PMAY20261008009214SBI",
    dbt_credit_date: "2026-10-08",
    documents: {
      electricity_bill: true,
      aadhaar_card: true,
      cancelled_cheque: true,
      roof_photo_geotagged: true,
      dcr_certificate: true,
      tfr_letter: true,
      wcr_copy: true,
      net_meter_test_report: true,
      commissioning_cert: true
    },
    notes: "Subsidy of \u20B978,000 credited to customer State Bank of India account. Project fully closed.",
    last_updated: "2026-10-08"
  },
  {
    id: "SUB-2026-003",
    project_id: "PROJECT-2026-024",
    project_number: "PRJ-2026-024",
    customer_name: "S. Jayachandran",
    customer_phone: "+91 97890 55432",
    customer_email: "jayachandran.s@example.com",
    customer_type: "residential",
    is_eligible: true,
    site_address: "12, Periyar Street, Rasipuram, Namakkal - 637408",
    discom_name: "TANGEDCO",
    discom_section_office: "Rasipuram East AEE",
    consumer_number: "04-099-001-442",
    sanctioned_load_kw: 6,
    system_capacity_kw: 5,
    subsidy_applicable_amount: 78e3,
    dcr_modules_used: true,
    panel_make_and_model: "Adani Solar 540W Mono DCR",
    inverter_make_and_model: "Solis 5kW Dual MPPT",
    portal_application_no: "PMS-TN-2026-102941",
    application_submission_date: "2026-10-05",
    current_stage: 2,
    current_stage_name: "DISCOM Feasibility (TFR) Pending",
    stage_status: "in_progress",
    days_in_current_stage: 22,
    is_delayed: true,
    // Over 15 days threshold!
    documents: {
      electricity_bill: true,
      aadhaar_card: true,
      cancelled_cheque: true,
      roof_photo_geotagged: true,
      dcr_certificate: false,
      tfr_letter: false,
      wcr_copy: false,
      net_meter_test_report: false,
      commissioning_cert: false
    },
    notes: "ALERT: TFR pending for 22 days at Rasipuram section office due to transformer load inspection delay. Need urgent follow-up.",
    last_updated: "2026-10-26"
  },
  {
    id: "SUB-2026-004",
    project_id: "PROJECT-2026-025",
    project_number: "PRJ-2026-025",
    customer_name: "R. Kaliappan Poultry Farm",
    customer_phone: "+91 98427 66110",
    customer_type: "commercial",
    is_eligible: false,
    ineligibility_reason: "Commercial / Industrial connection (HT/LT Tariff IIIB). Central PM Surya Ghar subsidy applies strictly to Domestic (Tariff IA) connections.",
    site_address: "SF No. 240, Mohanur Road, Valayappatti, Namakkal - 637020",
    discom_name: "TANGEDCO",
    discom_section_office: "Mohanur Rural",
    consumer_number: "04-045-008-112",
    sanctioned_load_kw: 60,
    system_capacity_kw: 50,
    subsidy_applicable_amount: 0,
    dcr_modules_used: false,
    panel_make_and_model: "Jinko Solar 580W TOPCon (Non-DCR Tier 1)",
    inverter_make_and_model: "Sungrow 50kW Commercial",
    portal_application_no: "N/A (Commercial Solar Project)",
    application_submission_date: "2026-10-12",
    current_stage: 0,
    current_stage_name: "Not Eligible (Commercial Project)",
    stage_status: "completed",
    days_in_current_stage: 0,
    is_delayed: false,
    documents: {
      electricity_bill: true,
      aadhaar_card: false,
      cancelled_cheque: false,
      roof_photo_geotagged: true,
      dcr_certificate: false,
      tfr_letter: true,
      wcr_copy: false,
      net_meter_test_report: false,
      commissioning_cert: false
    },
    notes: "Zero government subsidy applicable. Customer claimed 40% Accelerated Depreciation tax deduction under Section 32 of Income Tax Act.",
    last_updated: "2026-10-20"
  }
];
var DATA_FILE = path6.resolve(process.cwd(), "data", "subsidies.json");
function loadSubsidies() {
  try {
    if (fs5.existsSync(DATA_FILE)) {
      const raw = fs5.readFileSync(DATA_FILE, "utf-8");
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn("Error reading subsidies.json, using fallback initial data:", err);
  }
  return initialSubsidies;
}
function saveSubsidies(records) {
  try {
    const dir = path6.dirname(DATA_FILE);
    if (!fs5.existsSync(dir)) fs5.mkdirSync(dir, { recursive: true });
    fs5.writeFileSync(DATA_FILE, JSON.stringify(records, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing subsidies.json:", err);
  }
}
subsidiesRouter.get("/", (_req, res) => {
  const data = loadSubsidies();
  const activeEligible = data.filter((d) => d.is_eligible);
  const totalPipelineSubsidy = activeEligible.reduce((acc, curr) => acc + (curr.subsidy_applicable_amount || 0), 0);
  const totalDisbursed = data.filter((d) => d.current_stage === 7).reduce((acc, curr) => acc + (curr.dbt_disbursal_amount || curr.subsidy_applicable_amount || 0), 0);
  const pendingTfrCount = data.filter((d) => d.current_stage === 2 && d.is_eligible).length;
  const pendingMeterCount = data.filter((d) => (d.current_stage === 5 || d.current_stage === 6) && d.is_eligible).length;
  const delayedCount = data.filter((d) => d.is_delayed && d.is_eligible).length;
  return res.json({
    success: true,
    subsidies: data,
    summary: {
      total_records: data.length,
      eligible_records: activeEligible.length,
      total_pipeline_subsidy: totalPipelineSubsidy,
      total_disbursed_subsidy: totalDisbursed,
      pending_tfr_count: pendingTfrCount,
      pending_net_meter_count: pendingMeterCount,
      delayed_bottlenecks_count: delayedCount
    }
  });
});
subsidiesRouter.get("/project/:projectId", (req, res) => {
  const { projectId } = req.params;
  const data = loadSubsidies();
  const record = data.find((d) => d.project_id === projectId || d.id === projectId);
  if (!record) {
    return res.status(404).json({ success: false, message: "Subsidy record not found for this project" });
  }
  return res.json({ success: true, subsidy: record });
});
subsidiesRouter.put("/:id", (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const data = loadSubsidies();
  const index = data.findIndex((d) => d.id === id || d.project_id === id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: "Subsidy record not found" });
  }
  const updatedRecord = {
    ...data[index],
    ...updates,
    last_updated: (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
  };
  data[index] = updatedRecord;
  saveSubsidies(data);
  return res.json({
    success: true,
    message: "Subsidy record updated successfully",
    subsidy: updatedRecord
  });
});
subsidiesRouter.post("/", (req, res) => {
  const payload = req.body;
  const data = loadSubsidies();
  const capacityKw = Number(payload.system_capacity_kw) || 3;
  const isResidential = payload.customer_type === "residential";
  let subsidyAmount = 0;
  if (isResidential) {
    if (capacityKw <= 1) subsidyAmount = 3e4;
    else if (capacityKw <= 2) subsidyAmount = 6e4;
    else subsidyAmount = 78e3;
  }
  const newRecord = {
    id: `SUB-${(/* @__PURE__ */ new Date()).getFullYear()}-${String(data.length + 1).padStart(3, "0")}`,
    project_id: payload.project_id || `PROJECT-${Date.now()}`,
    project_number: payload.project_number || "PRJ-NEW",
    customer_name: payload.customer_name || "Customer Name",
    customer_phone: payload.customer_phone || "",
    customer_email: payload.customer_email || "",
    customer_type: payload.customer_type || "residential",
    is_eligible: isResidential,
    ineligibility_reason: isResidential ? void 0 : "Commercial/Industrial tariff not eligible for central residential subsidy.",
    site_address: payload.site_address || "",
    discom_name: payload.discom_name || "TANGEDCO",
    discom_section_office: payload.discom_section_office || "",
    consumer_number: payload.consumer_number || "",
    sanctioned_load_kw: Number(payload.sanctioned_load_kw) || capacityKw,
    system_capacity_kw: capacityKw,
    subsidy_applicable_amount: subsidyAmount,
    dcr_modules_used: payload.dcr_modules_used ?? true,
    panel_make_and_model: payload.panel_make_and_model || "",
    inverter_make_and_model: payload.inverter_make_and_model || "",
    portal_application_no: payload.portal_application_no || `PMS-TN-${(/* @__PURE__ */ new Date()).getFullYear()}-${Math.floor(1e4 + Math.random() * 9e4)}`,
    application_submission_date: payload.application_submission_date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    current_stage: isResidential ? 1 : 0,
    current_stage_name: isResidential ? "National Portal Registration Submitted" : "Not Eligible (Commercial)",
    stage_status: "in_progress",
    days_in_current_stage: 1,
    is_delayed: false,
    documents: payload.documents || {
      electricity_bill: true,
      aadhaar_card: true,
      cancelled_cheque: false,
      roof_photo_geotagged: false,
      dcr_certificate: false,
      tfr_letter: false,
      wcr_copy: false,
      net_meter_test_report: false,
      commissioning_cert: false
    },
    notes: payload.notes || "Application created.",
    last_updated: (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
  };
  data.unshift(newRecord);
  saveSubsidies(data);
  return res.status(201).json({
    success: true,
    message: "Subsidy tracking record created successfully",
    subsidy: newRecord
  });
});

// server/routes/index.ts
var apiRouter = Router19();
apiRouter.use("/auth", authRouter);
apiRouter.get("/bootstrap", authenticateToken, getBootstrapData);
apiRouter.use("/leads", leadsRouter);
apiRouter.use("/surveys", surveysRouter);
apiRouter.use("/site-surveys", surveysRouter);
apiRouter.use("/quotations", quotationsRouter);
apiRouter.use("/customers", customersRouter);
apiRouter.use("/projects", projectsRouter);
apiRouter.use("/", financeRouter);
apiRouter.use("/", serviceRouter);
apiRouter.use("/inventory", inventoryRouter);
apiRouter.use("/users", usersRouter);
apiRouter.use("/audit-logs", auditRouter);
apiRouter.use("/documents", documentsRouter);
apiRouter.use("/boms", bomRouter);
apiRouter.use("/procurement", procurement_routes_default);
apiRouter.use("/installation", installation_routes_default);
apiRouter.use("/notifications", notificationsRouter);
apiRouter.use("/telephony", telephonyRouter);
apiRouter.use("/subsidies", subsidiesRouter);

// server.ts
dotenv3.config();
var __filename = fileURLToPath(import.meta.url);
var __dirname = path7.dirname(__filename);
var uploadsDir = path7.join(process.cwd(), "uploads", "surveys");
if (!fs6.existsSync(uploadsDir)) {
  fs6.mkdirSync(uploadsDir, { recursive: true });
}
var app = express();
var PORT = process.env.PORT || 3e3;
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(["/uploads", "*/uploads"], express.static(path7.join(process.cwd(), "uploads")));
app.use(["/documents", "*/documents"], express.static(path7.join(process.cwd(), "public", "documents")));
app.use(["/api", "*/api"], apiRouter);
async function startServer() {
  const distPath = fs6.existsSync(path7.resolve(__dirname, "dist", "index.html")) ? path7.resolve(__dirname, "dist") : path7.resolve(process.cwd(), "dist");
  const isProd = process.env.NODE_ENV === "production";
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    console.log(`Serving static production build from ${distPath}`);
    app.use(express.static(distPath));
    app.use("/assets", express.static(path7.resolve(distPath, "assets")));
    app.use("*/assets", express.static(path7.resolve(distPath, "assets")));
    app.get(["/logo.png", "*/logo.png"], (_req, res) => {
      res.sendFile(path7.resolve(distPath, "logo.png"));
    });
    app.get(["/logo.jpg", "*/logo.jpg"], (_req, res) => {
      res.sendFile(path7.resolve(distPath, "logo.jpg"));
    });
    app.get(["/favicon.ico", "*/favicon.ico"], (_req, res) => {
      res.sendFile(path7.resolve(distPath, "logo.png"));
    });
    app.get("*", (_req, res) => {
      res.sendFile(path7.resolve(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AB Energy Solutions CRM server running at http://0.0.0.0:${PORT}`);
  });
}
startServer();
