-- Patient Data Management System - Initial Data Setup
-- This script runs after schema.sql to populate initial data

-- Connect to the database
\c patient_management_db;

-- Insert some sample data for development/testing
-- Note: ASP.NET Identity tables (AspNetUsers, AspNetRoles, etc.) 
-- will be populated by Entity Framework when the API starts

-- Sample user profiles (these will be linked to AspNetUsers after EF creates them)
-- These are placeholder entries that will be updated by the application
INSERT INTO user_profiles (user_id, first_name, last_name, phone, department, specialization) VALUES
('placeholder-admin-id', 'Admin', 'User', '+91-9876543210', 'Administration', 'System Administrator'),
('placeholder-doctor-id', 'Dr. Sarah', 'Johnson', '+91-9876543211', 'Oncology', 'Medical Oncologist'),
('placeholder-nurse-id', 'Nurse', 'Mary', '+91-9876543212', 'Nursing', 'Oncology Nurse');

-- Sample patients for development
INSERT INTO patients (
    patient_id, first_name, last_name, date_of_birth, gender, mobile_number, email,
    address, city, state, primary_cancer_site, cancer_stage, diagnosis_date,
    treatment_pathway, current_status, assigned_doctor_id, registration_date,
    next_followup_date, created_by
) VALUES
('PT001', 'John', 'Doe', '1965-03-15', 'M', '+91-9876543301', 'john.doe@email.com',
 '123 Main Street, Apartment 4B', 'Mumbai', 'Maharashtra', 'lung', 'IIIA', '2024-01-15',
 'curative', 'active', 'placeholder-doctor-id', '2024-01-15', '2024-08-15', 'placeholder-admin-id'),

('PT002', 'Jane', 'Smith', '1972-07-22', 'F', '+91-9876543302', 'jane.smith@email.com',
 '456 Oak Avenue, Block C', 'Delhi', 'Delhi', 'breast', 'IIA', '2024-02-01',
 'curative', 'active', 'placeholder-doctor-id', '2024-02-01', '2024-08-01', 'placeholder-admin-id'),

('PT003', 'Robert', 'Wilson', '1958-11-08', 'M', '+91-9876543303', 'robert.wilson@email.com',
 '789 Pine Road, House 12', 'Bangalore', 'Karnataka', 'prostate', 'IV', '2024-01-20',
 'palliative', 'active', 'placeholder-doctor-id', '2024-01-20', '2024-07-30', 'placeholder-admin-id'),

('PT004', 'Maria', 'Garcia', '1980-05-14', 'F', '+91-9876543304', 'maria.garcia@email.com',
 '321 Cedar Lane, Flat 8A', 'Chennai', 'Tamil Nadu', 'cervical', 'IB', '2024-03-01',
 'curative', 'active', 'placeholder-doctor-id', '2024-03-01', '2024-08-10', 'placeholder-admin-id'),

('PT005', 'David', 'Brown', '1945-12-03', 'M', '+91-9876543305', 'david.brown@email.com',
 '654 Birch Street, Unit 5', 'Kolkata', 'West Bengal', 'colon', 'IIIB', '2024-02-15',
 'curative', 'defaulter', 'placeholder-doctor-id', '2024-02-15', '2024-07-15', 'placeholder-admin-id');

-- Sample appointments
INSERT INTO appointments (
    patient_id, doctor_id, appointment_date, appointment_time, appointment_type,
    status, notes, created_at
) VALUES
-- Recent appointments
((SELECT id FROM patients WHERE patient_id = 'PT001'), 'placeholder-doctor-id', 
 '2024-07-20', '10:00:00', 'follow-up', 'completed', 'Regular checkup completed', CURRENT_TIMESTAMP),

((SELECT id FROM patients WHERE patient_id = 'PT002'), 'placeholder-doctor-id', 
 '2024-07-22', '11:30:00', 'follow-up', 'completed', 'Treatment response good', CURRENT_TIMESTAMP),

-- Upcoming appointments
((SELECT id FROM patients WHERE patient_id = 'PT001'), 'placeholder-doctor-id', 
 '2024-08-15', '10:00:00', 'follow-up', 'scheduled', 'Next chemotherapy cycle', CURRENT_TIMESTAMP),

((SELECT id FROM patients WHERE patient_id = 'PT002'), 'placeholder-doctor-id', 
 '2024-08-01', '11:30:00', 'follow-up', 'scheduled', 'Post-surgery checkup', CURRENT_TIMESTAMP),

-- Missed appointment
((SELECT id FROM patients WHERE patient_id = 'PT005'), 'placeholder-doctor-id', 
 '2024-07-15', '14:00:00', 'follow-up', 'missed', 'Patient did not show up', CURRENT_TIMESTAMP);

-- Sample treatments
INSERT INTO treatments (
    patient_id, treatment_type, treatment_name, start_date, status, created_by
) VALUES
((SELECT id FROM patients WHERE patient_id = 'PT001'), 'chemotherapy', 'Carboplatin + Paclitaxel', 
 '2024-02-01', 'active', 'placeholder-doctor-id'),

((SELECT id FROM patients WHERE patient_id = 'PT002'), 'surgery', 'Lumpectomy', 
 '2024-03-15', 'completed', 'placeholder-doctor-id'),

((SELECT id FROM patients WHERE patient_id = 'PT002'), 'chemotherapy', 'AC-T Protocol', 
 '2024-04-01', 'active', 'placeholder-doctor-id'),

((SELECT id FROM patients WHERE patient_id = 'PT003'), 'radiation', 'Palliative Radiotherapy', 
 '2024-02-15', 'active', 'placeholder-doctor-id');

-- Sample investigations
INSERT INTO investigations (
    patient_id, investigation_type, investigation_name, ordered_date, status, 
    priority, ordered_by
) VALUES
((SELECT id FROM patients WHERE patient_id = 'PT001'), 'blood_test', 'Complete Blood Count', 
 '2024-07-15', 'pending', 'routine', 'placeholder-doctor-id'),

((SELECT id FROM patients WHERE patient_id = 'PT001'), 'imaging', 'CT Chest', 
 '2024-07-20', 'completed', 'routine', 'placeholder-doctor-id'),

((SELECT id FROM patients WHERE patient_id = 'PT002'), 'blood_test', 'Tumor Markers', 
 '2024-07-18', 'completed', 'routine', 'placeholder-doctor-id'),

((SELECT id FROM patients WHERE patient_id = 'PT003'), 'imaging', 'Bone Scan', 
 '2024-07-25', 'pending', 'urgent', 'placeholder-doctor-id');

-- Sample notifications for missed appointments and due follow-ups
INSERT INTO notifications (
    patient_id, user_id, notification_type, title, message, priority, sent_via
) VALUES
((SELECT id FROM patients WHERE patient_id = 'PT005'), 'placeholder-doctor-id',
 'missed_appointment', 'Missed Appointment Alert', 
 'Patient David Brown (PT005) missed appointment on 2024-07-15. Please follow up.',
 'high', 'web'),

((SELECT id FROM patients WHERE patient_id = 'PT001'), 'placeholder-doctor-id',
 'followup_due', 'Follow-up Due', 
 'Patient John Doe (PT001) has follow-up appointment due on 2024-08-15.',
 'medium', 'web'),

((SELECT id FROM patients WHERE patient_id = 'PT003'), 'placeholder-doctor-id',
 'investigation_due', 'Investigation Pending', 
 'Patient Robert Wilson (PT003) has pending Bone Scan investigation.',
 'high', 'web');

-- Create some indexes for better performance (if not already created)
CREATE INDEX IF NOT EXISTS idx_patients_mobile ON patients(mobile_number);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date ON appointments(doctor_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_treatments_patient_status ON treatments(patient_id, status);
CREATE INDEX IF NOT EXISTS idx_investigations_ordered_date ON investigations(ordered_date);

-- Update sequences (if using serial instead of UUID)
-- This ensures that any future inserts don't conflict with our sample data

-- Create a function to update the update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updating the updated_at timestamp
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_treatments_updated_at BEFORE UPDATE ON treatments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_investigations_updated_at BEFORE UPDATE ON investigations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert initial analytics report types
INSERT INTO analytics_reports (
    report_type, report_name, generated_by, parameters, report_data, generated_at
) VALUES
('monthly', 'July 2024 Patient Summary', 'placeholder-admin-id',
 '{"month": "2024-07", "include_demographics": true, "include_treatments": true}',
 '{"total_patients": 5, "new_patients": 5, "active_treatments": 4, "missed_appointments": 1}',
 CURRENT_TIMESTAMP);

-- Print completion message
SELECT 'Database initialization completed successfully!' as status;
SELECT 'Sample data inserted:' as info;
SELECT '- 5 sample patients' as patients;
SELECT '- 5 appointments (including 1 missed)' as appointments;
SELECT '- 4 treatment records' as treatments;
SELECT '- 4 investigation records' as investigations;
SELECT '- 3 notifications' as notifications;
