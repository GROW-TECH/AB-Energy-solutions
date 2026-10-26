-- AB Energy Solutions Solar CRM & Business OS
-- Complete MySQL Database Schema

CREATE TABLE IF NOT EXISTS employees (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  phone VARCHAR(50),
  role VARCHAR(50) NOT NULL,
  department VARCHAR(100),
  avatar TEXT,
  active_leads_count INT DEFAULT 0,
  completed_projects_count INT DEFAULT 0,
  location VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS leads (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(150),
  phone VARCHAR(50) NOT NULL,
  city VARCHAR(100),
  state VARCHAR(100),
  address TEXT,
  pincode VARCHAR(20),
  source VARCHAR(50),
  status VARCHAR(50) NOT NULL DEFAULT 'New',
  priority VARCHAR(50) DEFAULT 'Medium',
  assigned_to_id VARCHAR(50),
  assigned_to_name VARCHAR(150),
  monthly_bill DECIMAL(12,2) DEFAULT 0,
  sanction_load DECIMAL(8,2) DEFAULT 0,
  roof_area_sqft DECIMAL(10,2) DEFAULT 0,
  roof_type VARCHAR(100),
  recommended_kw DECIMAL(8,2) DEFAULT 0,
  estimated_budget DECIMAL(12,2) DEFAULT 0,
  notes TEXT,
  customer_type VARCHAR(50) DEFAULT 'Residential',
  system_type VARCHAR(50) DEFAULT 'On-Grid',
  created_at VARCHAR(50),
  updated_at VARCHAR(50),
  last_contacted_at VARCHAR(50)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS customers (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(150),
  phone VARCHAR(50) NOT NULL,
  alternate_phone VARCHAR(50),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(20),
  consumer_number_discom VARCHAR(100),
  discom_name VARCHAR(100),
  gstin VARCHAR(50),
  converted_from_lead_id VARCHAR(50),
  total_system_kw DECIMAL(8,2) DEFAULT 0,
  total_order_value DECIMAL(12,2) DEFAULT 0,
  paid_amount DECIMAL(12,2) DEFAULT 0,
  balance_amount DECIMAL(12,2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'Active',
  created_at VARCHAR(50)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS site_surveys (
  id VARCHAR(50) PRIMARY KEY,
  lead_id VARCHAR(50),
  lead_name VARCHAR(150),
  customer_name VARCHAR(150),
  phone VARCHAR(50),
  address TEXT,
  scheduled_date VARCHAR(50),
  engineer_id VARCHAR(50),
  engineer_name VARCHAR(150),
  status VARCHAR(50) DEFAULT 'Scheduled',
  roof_area_sqft DECIMAL(10,2) DEFAULT 0,
  shadow_free_area_sqft DECIMAL(10,2) DEFAULT 0,
  roof_type VARCHAR(100),
  azimuth_angle DECIMAL(6,2) DEFAULT 180,
  tilt_angle DECIMAL(6,2) DEFAULT 15,
  existing_sanction_load_kw DECIMAL(8,2) DEFAULT 0,
  grid_phase VARCHAR(50),
  distance_to_lt_panel_meters DECIMAL(8,2) DEFAULT 0,
  recommended_kw DECIMAL(8,2) DEFAULT 0,
  panel_quantity INT DEFAULT 0,
  estimated_generation_units_per_year DECIMAL(10,2) DEFAULT 0,
  estimated_annual_savings DECIMAL(12,2) DEFAULT 0,
  estimated_cost DECIMAL(12,2) DEFAULT 0,
  payback_years DECIMAL(4,1) DEFAULT 0,
  co2_reduction_tons_per_year DECIMAL(6,2) DEFAULT 0,
  photos_uploaded JSON,
  bill_photo_uploaded BOOLEAN DEFAULT FALSE,
  notes TEXT,
  completed_at VARCHAR(50)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS quotations (
  id VARCHAR(50) PRIMARY KEY,
  quotation_number VARCHAR(100) NOT NULL,
  lead_id VARCHAR(50),
  lead_name VARCHAR(150),
  customer_phone VARCHAR(50),
  customer_address TEXT,
  system_capacity_kw DECIMAL(8,2) DEFAULT 0,
  current_version INT DEFAULT 1,
  versions JSON,
  status VARCHAR(50) DEFAULT 'Draft',
  sent_date VARCHAR(50),
  valid_until VARCHAR(50),
  salesperson_id VARCHAR(50),
  salesperson_name VARCHAR(150),
  total_amount DECIMAL(12,2) DEFAULT 0,
  created_at VARCHAR(50)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS projects (
  id VARCHAR(50) PRIMARY KEY,
  project_code VARCHAR(100) NOT NULL,
  customer_id VARCHAR(50),
  customer_name VARCHAR(150),
  phone VARCHAR(50),
  address TEXT,
  system_capacity_kw DECIMAL(8,2) DEFAULT 0,
  panel_count INT DEFAULT 0,
  inverter_type VARCHAR(100),
  total_cost DECIMAL(12,2) DEFAULT 0,
  advance_paid DECIMAL(12,2) DEFAULT 0,
  balance_due DECIMAL(12,2) DEFAULT 0,
  stage VARCHAR(50) DEFAULT 'Booking',
  start_date VARCHAR(50),
  target_completion_date VARCHAR(50),
  assigned_manager_id VARCHAR(50),
  assigned_manager_name VARCHAR(150),
  installation_team_name VARCHAR(150),
  net_metering_discom VARCHAR(100),
  consumer_number VARCHAR(100),
  checklist JSON,
  tasks JSON,
  created_at VARCHAR(50)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS inventory_products (
  id VARCHAR(50) PRIMARY KEY,
  sku VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  category VARCHAR(100) NOT NULL,
  brand VARCHAR(100),
  model VARCHAR(100),
  wattage VARCHAR(50),
  capacity VARCHAR(50),
  unit_cost DECIMAL(12,2) DEFAULT 0,
  selling_price DECIMAL(12,2) DEFAULT 0,
  stock_quantity INT DEFAULT 0,
  minimum_reorder_level INT DEFAULT 0,
  reorder_quantity INT DEFAULT 0,
  unit VARCHAR(50),
  location VARCHAR(100),
  status VARCHAR(50) DEFAULT 'In Stock',
  warranty_years INT DEFAULT 10
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS invoices (
  id VARCHAR(50) PRIMARY KEY,
  invoice_number VARCHAR(100) NOT NULL UNIQUE,
  customer_id VARCHAR(50),
  customer_name VARCHAR(150),
  project_id VARCHAR(50),
  milestone_name VARCHAR(150),
  amount DECIMAL(12,2) DEFAULT 0,
  gst_rate DECIMAL(5,2) DEFAULT 18.00,
  gst_amount DECIMAL(12,2) DEFAULT 0,
  total_amount DECIMAL(12,2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'Pending',
  issued_date VARCHAR(50),
  due_date VARCHAR(50),
  paid_date VARCHAR(50),
  payment_method VARCHAR(50)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS payments (
  id VARCHAR(50) PRIMARY KEY,
  payment_number VARCHAR(100) NOT NULL UNIQUE,
  invoice_id VARCHAR(50),
  customer_id VARCHAR(50),
  customer_name VARCHAR(150),
  project_id VARCHAR(50),
  amount DECIMAL(12,2) DEFAULT 0,
  payment_date VARCHAR(50),
  payment_mode VARCHAR(50),
  transaction_reference VARCHAR(100),
  status VARCHAR(50) DEFAULT 'Verified',
  notes TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS expenses (
  id VARCHAR(50) PRIMARY KEY,
  project_id VARCHAR(50),
  category VARCHAR(100),
  title VARCHAR(200) NOT NULL,
  total_amount DECIMAL(12,2) DEFAULT 0,
  payment_mode VARCHAR(50),
  receipt_url TEXT,
  recorded_by VARCHAR(100),
  date VARCHAR(50),
  notes TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS suppliers (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  contact_person VARCHAR(150),
  email VARCHAR(150),
  phone VARCHAR(50),
  category VARCHAR(100),
  city VARCHAR(100),
  address TEXT,
  gstin VARCHAR(50),
  payment_terms VARCHAR(100),
  rating DECIMAL(3,1) DEFAULT 4.5
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS purchase_orders (
  id VARCHAR(50) PRIMARY KEY,
  po_number VARCHAR(100) NOT NULL UNIQUE,
  supplier_id VARCHAR(50),
  supplier_name VARCHAR(150),
  order_date VARCHAR(50),
  expected_delivery_date VARCHAR(50),
  status VARCHAR(50) DEFAULT 'Pending',
  items JSON,
  total_amount DECIMAL(12,2) DEFAULT 0,
  notes TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS warranties (
  id VARCHAR(50) PRIMARY KEY,
  certificate_number VARCHAR(100) NOT NULL UNIQUE,
  customer_id VARCHAR(50),
  customer_name VARCHAR(150),
  project_id VARCHAR(50),
  component_type VARCHAR(100),
  brand_model VARCHAR(150),
  serial_number VARCHAR(100),
  warranty_period_years INT DEFAULT 10,
  start_date VARCHAR(50),
  end_date VARCHAR(50),
  status VARCHAR(50) DEFAULT 'Active',
  document_url TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS amc_contracts (
  id VARCHAR(50) PRIMARY KEY,
  contract_number VARCHAR(100) NOT NULL UNIQUE,
  customer_id VARCHAR(50),
  customer_name VARCHAR(150),
  project_id VARCHAR(50),
  plan_name VARCHAR(100),
  annual_cost DECIMAL(12,2) DEFAULT 0,
  start_date VARCHAR(50),
  end_date VARCHAR(50),
  visits_per_year INT DEFAULT 4,
  visits_completed INT DEFAULT 0,
  status VARCHAR(50) DEFAULT 'Active',
  notes TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS service_tickets (
  id VARCHAR(50) PRIMARY KEY,
  ticket_number VARCHAR(100) NOT NULL UNIQUE,
  customer_id VARCHAR(50),
  customer_name VARCHAR(150),
  phone VARCHAR(50),
  project_id VARCHAR(50),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  priority VARCHAR(50) DEFAULT 'Medium',
  status VARCHAR(50) DEFAULT 'Open',
  assigned_to_id VARCHAR(50),
  assigned_to_name VARCHAR(150),
  created_at VARCHAR(50),
  resolved_at VARCHAR(50),
  resolution_notes TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS follow_ups (
  id VARCHAR(50) PRIMARY KEY,
  lead_id VARCHAR(50),
  lead_name VARCHAR(150),
  customer_id VARCHAR(50),
  customer_name VARCHAR(150),
  quotation_id VARCHAR(50),
  title VARCHAR(200) NOT NULL,
  due_date VARCHAR(50) NOT NULL,
  due_time VARCHAR(50),
  type VARCHAR(50),
  status VARCHAR(50) DEFAULT 'Pending',
  priority VARCHAR(50) DEFAULT 'Medium',
  assigned_to_id VARCHAR(50),
  assigned_to_name VARCHAR(150),
  notes TEXT,
  completed_at VARCHAR(50)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS automation_rules (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  trigger_event VARCHAR(100),
  condition_expression TEXT,
  action_type VARCHAR(100),
  action_payload JSON,
  is_active BOOLEAN DEFAULT TRUE,
  execution_count INT DEFAULT 0,
  last_executed_at VARCHAR(50)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS automation_logs (
  id VARCHAR(50) PRIMARY KEY,
  rule_id VARCHAR(50),
  rule_name VARCHAR(200),
  event_triggered VARCHAR(100),
  status VARCHAR(50),
  message TEXT,
  executed_at VARCHAR(50),
  payload JSON
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS project_boms (
  id VARCHAR(50) PRIMARY KEY,
  project_id VARCHAR(50),
  survey_id VARCHAR(50),
  version INT NOT NULL DEFAULT 1,
  status VARCHAR(50) NOT NULL DEFAULT 'Draft',
  prepared_by_id VARCHAR(50),
  prepared_by_name VARCHAR(150),
  approved_by_id VARCHAR(50),
  approved_by_name VARCHAR(150),
  total_estimated_cost DECIMAL(12,2) DEFAULT 0,
  revision_comments TEXT,
  created_at VARCHAR(50) NOT NULL,
  updated_at VARCHAR(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS bom_items (
  id VARCHAR(50) PRIMARY KEY,
  bom_id VARCHAR(50) NOT NULL,
  product_id VARCHAR(50),
  category VARCHAR(100) NOT NULL,
  item_name VARCHAR(200) NOT NULL,
  technical_specification TEXT NOT NULL,
  brand_make VARCHAR(100),
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit VARCHAR(50) NOT NULL DEFAULT 'Nos',
  estimated_unit_cost DECIMAL(12,2) DEFAULT 0,
  estimated_total_cost DECIMAL(12,2) DEFAULT 0,
  remarks TEXT,
  photo_url VARCHAR(500)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS customer_documents (
  id VARCHAR(50) PRIMARY KEY,
  customer_id VARCHAR(50),
  project_id VARCHAR(50),
  survey_id VARCHAR(50),
  document_type VARCHAR(100) NOT NULL DEFAULT 'Aadhaar Card',
  id_number VARCHAR(100),
  customer_photo_path VARCHAR(500),
  doc_front_path VARCHAR(500),
  doc_back_path VARCHAR(500),
  notes TEXT,
  uploaded_by_id VARCHAR(50),
  uploaded_by_name VARCHAR(150),
  uploaded_at VARCHAR(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS goods_receipt_notes (
  id VARCHAR(50) PRIMARY KEY,
  po_id VARCHAR(50) NOT NULL,
  project_id VARCHAR(50),
  supplier_id VARCHAR(50),
  challan_number VARCHAR(100) NOT NULL,
  challan_date VARCHAR(50),
  received_date VARCHAR(50) NOT NULL,
  delivery_location VARCHAR(150),
  challan_document_path VARCHAR(500),
  has_discrepancy TINYINT(1) DEFAULT 0,
  discrepancy_summary TEXT,
  received_by_id VARCHAR(50),
  received_by_name VARCHAR(150),
  created_at VARCHAR(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS grn_items (
  id VARCHAR(50) PRIMARY KEY,
  grn_id VARCHAR(50) NOT NULL,
  bom_item_id VARCHAR(50),
  item_name VARCHAR(200) NOT NULL,
  ordered_qty DECIMAL(10,2) NOT NULL DEFAULT 0,
  received_qty DECIMAL(10,2) NOT NULL DEFAULT 0,
  accepted_qty DECIMAL(10,2) NOT NULL DEFAULT 0,
  damaged_qty DECIMAL(10,2) DEFAULT 0,
  rejected_qty DECIMAL(10,2) DEFAULT 0,
  damage_photo_path VARCHAR(500),
  remarks TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS installation_attendance (
  id VARCHAR(50) PRIMARY KEY,
  project_id VARCHAR(50) NOT NULL,
  date VARCHAR(50) NOT NULL,
  team_lead_id VARCHAR(50),
  team_lead_name VARCHAR(150),
  technicians_present JSON,
  check_in_time VARCHAR(50) NOT NULL,
  gps_lat DECIMAL(10,7),
  gps_lng DECIMAL(10,7),
  status VARCHAR(50) DEFAULT 'On_Site',
  notes TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS installation_progress_logs (
  id VARCHAR(50) PRIMARY KEY,
  project_id VARCHAR(50) NOT NULL,
  reported_date VARCHAR(50) NOT NULL,
  stage_reached VARCHAR(100) NOT NULL,
  progress_percent INT DEFAULT 0,
  is_blocked TINYINT(1) DEFAULT 0,
  blocker_reason TEXT,
  materials_ready_confirmed TINYINT(1) DEFAULT 0,
  photos JSON,
  reported_by_id VARCHAR(50),
  created_at VARCHAR(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

