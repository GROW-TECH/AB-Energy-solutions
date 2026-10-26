import { pool } from '../db.js';

export async function runSurveyRedesignMigration() {
  console.log('Running survey redesign migration...');

  // 1. Add missing columns to site_surveys
  const columnsToAdd = [
    'ADD COLUMN IF NOT EXISTS roof_dimensions_shape VARCHAR(100) NULL DEFAULT "Rectangular"',
    'ADD COLUMN IF NOT EXISTS surface_condition VARCHAR(100) NULL DEFAULT "Good"',
    'ADD COLUMN IF NOT EXISTS measurement_status VARCHAR(50) NULL DEFAULT "Initial Estimate"',
    'ADD COLUMN IF NOT EXISTS obstacles_water_tank TINYINT(1) NULL DEFAULT 0',
    'ADD COLUMN IF NOT EXISTS obstacles_mumty TINYINT(1) NULL DEFAULT 0',
    'ADD COLUMN IF NOT EXISTS obstacles_parapet TINYINT(1) NULL DEFAULT 0',
    'ADD COLUMN IF NOT EXISTS obstacles_trees_neighbors TINYINT(1) NULL DEFAULT 0',
    'ADD COLUMN IF NOT EXISTS obstacles_other VARCHAR(255) NULL',
    'ADD COLUMN IF NOT EXISTS access_pathways_clearance VARCHAR(255) NULL DEFAULT "1m walkway required along perimeter"',
    'ADD COLUMN IF NOT EXISTS main_meter_status VARCHAR(50) NULL DEFAULT "Not Assessed"',
    'ADD COLUMN IF NOT EXISTS main_meter_notes TEXT NULL',
    'ADD COLUMN IF NOT EXISTS db_condition VARCHAR(50) NULL DEFAULT "Not Assessed"',
    'ADD COLUMN IF NOT EXISTS earthing_status VARCHAR(50) NULL DEFAULT "Not Assessed"',
    'ADD COLUMN IF NOT EXISTS earthing_resistance_ohms DECIMAL(5,2) NULL',
    'ADD COLUMN IF NOT EXISTS proposed_inverter_location VARCHAR(150) NULL',
    'ADD COLUMN IF NOT EXISTS electrical_constraints TEXT NULL',
    'ADD COLUMN IF NOT EXISTS electrical_upgrades_needed TEXT NULL',
    'ADD COLUMN IF NOT EXISTS structural_concerns TEXT NULL',
    'ADD COLUMN IF NOT EXISTS visible_cracks_damage TINYINT(1) NULL DEFAULT 0',
    'ADD COLUMN IF NOT EXISTS waterproofing_status VARCHAR(50) NULL DEFAULT "Good"',
    'ADD COLUMN IF NOT EXISTS mounting_structure_type VARCHAR(100) NULL DEFAULT "Standard Elevated"',
    'ADD COLUMN IF NOT EXISTS shading_sources TEXT NULL',
    'ADD COLUMN IF NOT EXISTS shading_affected_area_sqft DECIMAL(10,2) NULL DEFAULT 0',
    'ADD COLUMN IF NOT EXISTS structural_engineer_approval_required TINYINT(1) NULL DEFAULT 0',
    'ADD COLUMN IF NOT EXISTS feasibility_verdict VARCHAR(50) NULL DEFAULT "Feasible"',
    'ADD COLUMN IF NOT EXISTS proposed_panel_wattage INT(11) NULL DEFAULT 550',
    'ADD COLUMN IF NOT EXISTS inverter_recommendation VARCHAR(150) NULL',
    'ADD COLUMN IF NOT EXISTS cable_specification VARCHAR(150) NULL DEFAULT "1 x 4 sq.mm Solar DC Cu, 4C x 16 sq.mm AC Al XLPE"',
    'ADD COLUMN IF NOT EXISTS unresolved_technical_issues TEXT NULL',
    'ADD COLUMN IF NOT EXISTS engineer_recommendations TEXT NULL',
    'ADD COLUMN IF NOT EXISTS submitted_at VARCHAR(50) NULL',
    'ADD COLUMN IF NOT EXISTS submitted_by_id VARCHAR(50) NULL',
    'ADD COLUMN IF NOT EXISTS reviewed_at VARCHAR(50) NULL',
    'ADD COLUMN IF NOT EXISTS reviewed_by_id VARCHAR(50) NULL',
    'ADD COLUMN IF NOT EXISTS reviewer_name VARCHAR(150) NULL',
    'ADD COLUMN IF NOT EXISTS review_decision VARCHAR(50) NULL',
    'ADD COLUMN IF NOT EXISTS review_comments TEXT NULL',
    'ADD COLUMN IF NOT EXISTS is_draft TINYINT(1) NULL DEFAULT 0'
  ];

  for (const colDef of columnsToAdd) {
    try {
      await pool.query(`ALTER TABLE site_surveys ${colDef}`);
    } catch (e: any) {
      console.warn(`Column alter warning (${colDef}):`, e.message);
    }
  }

  // 2. Create survey_photos table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS survey_photos (
      id VARCHAR(50) PRIMARY KEY,
      survey_id VARCHAR(50) NOT NULL,
      category VARCHAR(100) NOT NULL,
      file_name VARCHAR(255) NOT NULL,
      file_path VARCHAR(500) NOT NULL,
      file_size INT(11) NULL DEFAULT 0,
      mime_type VARCHAR(100) NULL DEFAULT 'image/jpeg',
      caption VARCHAR(255) NULL,
      uploader_id VARCHAR(50) NULL,
      uploader_name VARCHAR(150) NULL,
      captured_at VARCHAR(50) NULL,
      uploaded_at VARCHAR(50) NOT NULL,
      latitude DECIMAL(10,7) NULL,
      longitude DECIMAL(10,7) NULL,
      gps_accuracy_meters DECIMAL(8,2) NULL,
      geo_verified TINYINT(1) DEFAULT 0,
      verification_status VARCHAR(50) DEFAULT 'Uploaded',
      verification_notes TEXT NULL,
      INDEX idx_survey_photos_survey_id (survey_id),
      INDEX idx_survey_photos_category (category)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 3. Create survey_review_history table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS survey_review_history (
      id VARCHAR(50) PRIMARY KEY,
      survey_id VARCHAR(50) NOT NULL,
      reviewer_id VARCHAR(50) NULL,
      reviewer_name VARCHAR(150) NULL,
      action VARCHAR(50) NOT NULL,
      comments TEXT NULL,
      created_at VARCHAR(50) NOT NULL,
      INDEX idx_survey_history_survey_id (survey_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  console.log('Survey redesign migration completed successfully!');
}

if (process.argv[1]?.includes('survey-redesign')) {
  runSurveyRedesignMigration().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
  });
}
