-- Patient Data Management System - PostgreSQL 16 Schema
-- Using ASP.NET Identity Framework for user management

-- Database already created by Docker environment
-- Connect to the database
\c patient_management_db;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE cancer_site_type AS ENUM (
    'lung', 'breast', 'kidney', 'colon', 'prostate', 'cervical', 
    'ovarian', 'liver', 'stomach', 'pancreatic', 'brain', 'blood', 'other'
);

CREATE TYPE treatment_pathway_type AS ENUM ('curative', 'palliative');
CREATE TYPE patient_status_type AS ENUM ('active', 'completed', 'defaulter', 'lost_to_followup', 'deceased');
CREATE TYPE appointment_status_type AS ENUM ('scheduled', 'completed', 'missed', 'cancelled', 'rescheduled');
CREATE TYPE risk_level_type AS ENUM ('low', 'medium', 'high', 'critical');

-- ASP.NET Identity Tables (will be created automatically by Entity Framework)
-- AspNetUsers, AspNetRoles, AspNetUserRoles, etc. will be generated

-- Extended user profile table (links to AspNetUsers)
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL UNIQUE, -- Links to AspNetUsers.Id
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    department VARCHAR(100),
    specialization VARCHAR(100),
    license_number VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Patients table - core patient information
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id VARCHAR(20) UNIQUE NOT NULL, -- Hospital patient ID
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender CHAR(1) CHECK (gender IN ('M', 'F', 'O')),
    mobile_number VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'India',
    emergency_contact_name VARCHAR(200),
    emergency_contact_phone VARCHAR(20),
    
    -- Cancer specific information
    primary_cancer_site cancer_site_type NOT NULL,
    cancer_stage VARCHAR(10),
    histology VARCHAR(200),
    diagnosis_date DATE,
    treatment_pathway treatment_pathway_type DEFAULT 'curative',
    
    -- Status and risk
    current_status patient_status_type DEFAULT 'active',
    risk_level risk_level_type DEFAULT 'medium',
    
    -- Tracking
    assigned_doctor_id TEXT, -- Links to AspNetUsers.Id
    registration_date DATE DEFAULT CURRENT_DATE,
    last_visit_date DATE,
    next_followup_date DATE,
    
    -- Metadata
    created_by TEXT, -- Links to AspNetUsers.Id
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Appointments table
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id TEXT, -- Links to AspNetUsers.Id
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    appointment_type VARCHAR(50) DEFAULT 'follow-up',
    status appointment_status_type DEFAULT 'scheduled',
    notes TEXT,
    consultation_notes TEXT,
    next_appointment_date DATE,
    
    -- Missed appointment tracking
    missed_date DATE,
    missed_reason TEXT,
    followup_attempted BOOLEAN DEFAULT false,
    followup_date DATE,
    followup_method VARCHAR(50), -- phone, email, sms
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Treatment records
CREATE TABLE treatments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    treatment_type VARCHAR(100) NOT NULL, -- chemotherapy, surgery, radiation
    treatment_name VARCHAR(200),
    start_date DATE,
    end_date DATE,
    dosage VARCHAR(100),
    frequency VARCHAR(100),
    status VARCHAR(50) DEFAULT 'active',
    side_effects TEXT,
    response VARCHAR(100),
    
    created_by TEXT, -- Links to AspNetUsers.Id
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Investigations/Lab results
CREATE TABLE investigations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    investigation_type VARCHAR(100) NOT NULL,
    investigation_name VARCHAR(200) NOT NULL,
    ordered_date DATE NOT NULL,
    result_date DATE,
    result_value VARCHAR(500),
    normal_range VARCHAR(200),
    status VARCHAR(50) DEFAULT 'pending', -- pending, completed, cancelled
    priority VARCHAR(20) DEFAULT 'routine', -- routine, urgent, stat
    ordered_by TEXT, -- Links to AspNetUsers.Id
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Notifications/Alerts
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    user_id TEXT, -- Links to AspNetUsers.Id (recipient)
    notification_type VARCHAR(50) NOT NULL, -- missed_appointment, followup_due, investigation_due
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium',
    is_read BOOLEAN DEFAULT false,
    sent_via VARCHAR(50), -- web, email, sms, push
    
    scheduled_for TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Analytics/Reports tracking
CREATE TABLE analytics_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_type VARCHAR(50) NOT NULL, -- weekly, monthly, yearly, custom
    report_name VARCHAR(200) NOT NULL,
    generated_by TEXT, -- Links to AspNetUsers.Id
    parameters JSONB,
    report_data JSONB,
    file_path VARCHAR(500),
    
    start_date DATE,
    end_date DATE,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Audit trail
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL, -- INSERT, UPDATE, DELETE
    old_values JSONB,
    new_values JSONB,
    changed_by TEXT, -- Links to AspNetUsers.Id
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ip_address INET
);

-- Indexes for performance
CREATE INDEX idx_patients_cancer_site ON patients(primary_cancer_site);
CREATE INDEX idx_patients_status ON patients(current_status);
CREATE INDEX idx_patients_doctor ON patients(assigned_doctor_id);
CREATE INDEX idx_patients_next_followup ON patients(next_followup_date);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);

-- Functions for auto-updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for auto-updating timestamps
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_treatments_updated_at BEFORE UPDATE ON treatments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_investigations_updated_at BEFORE UPDATE ON investigations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Views for common queries (will need to join with AspNetUsers for user info)
CREATE VIEW active_patients_view AS
SELECT 
    p.id,
    p.patient_id,
    p.first_name || ' ' || p.last_name as full_name,
    p.primary_cancer_site,
    p.current_status,
    p.risk_level,
    p.next_followup_date,
    up.first_name || ' ' || up.last_name as assigned_doctor,
    CASE 
        WHEN p.next_followup_date < CURRENT_DATE THEN 'overdue'
        WHEN p.next_followup_date = CURRENT_DATE THEN 'due_today'
        ELSE 'scheduled'
    END as followup_status
FROM patients p
LEFT JOIN user_profiles up ON p.assigned_doctor_id = up.user_id
WHERE p.current_status = 'active';

CREATE VIEW missed_appointments_view AS
SELECT 
    a.id,
    p.patient_id,
    p.first_name || ' ' || p.last_name as patient_name,
    p.mobile_number,
    p.primary_cancer_site,
    a.appointment_date,
    a.appointment_time,
    a.missed_date,
    a.followup_attempted,
    up.first_name || ' ' || up.last_name as doctor_name
FROM appointments a
JOIN patients p ON a.patient_id = p.id
LEFT JOIN user_profiles up ON a.doctor_id = up.user_id
WHERE a.status = 'missed' AND a.followup_attempted = false;
