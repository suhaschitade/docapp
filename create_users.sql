-- SQL Script to Create Role-wise Users for Patient Management System
-- Note: Password for all users will be "Password@123" 
-- This uses the same password hash format as the admin user

-- Insert Doctor Users
INSERT INTO "AspNetUsers" (
    "Id", "UserName", "NormalizedUserName", "Email", "NormalizedEmail",
    "EmailConfirmed", "PasswordHash", "SecurityStamp", "ConcurrencyStamp",
    "PhoneNumber", "PhoneNumberConfirmed", "TwoFactorEnabled", "LockoutEnabled",
    "AccessFailedCount", "FirstName", "LastName", "IsActive"
) VALUES 
(
    'a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6', 
    'doctor1@clinic.com',
    'DOCTOR1@CLINIC.COM',
    'doctor1@clinic.com',
    'DOCTOR1@CLINIC.COM',
    true,
    'AQAAAAIAAYagAAAAEA/e0iiYpSVDHNbveRAtrTlSYYQ1nhJdMlUBomjBbmQJZjXZWkEkPJpkOu+/GGcFQA==',
    'DOCTOR1SECURITYSTAMP123456789012',
    'b1c2d3e4-f5g6-h7i8-j9k0-l1m2n3o4p5q6',
    '+91-9876543201',
    true,
    false,
    true,
    0,
    'Dr. Sarah',
    'Johnson',
    true
),
(
    'c2d3e4f5-g6h7-i8j9-k0l1-m2n3o4p5q6r7',
    'doctor2@clinic.com',
    'DOCTOR2@CLINIC.COM', 
    'doctor2@clinic.com',
    'DOCTOR2@CLINIC.COM',
    true,
    'AQAAAAIAAYagAAAAEA/e0iiYpSVDHNbveRAtrTlSYYQ1nhJdMlUBomjBbmQJZjXZWkEkPJpkOu+/GGcFQA==',
    'DOCTOR2SECURITYSTAMP123456789012',
    'd3e4f5g6-h7i8-j9k0-l1m2-n3o4p5q6r7s8',
    '+91-9876543202',
    true,
    false,
    true,
    0,
    'Dr. Michael',
    'Chen',
    true
);

-- Insert Nurse Users
INSERT INTO "AspNetUsers" (
    "Id", "UserName", "NormalizedUserName", "Email", "NormalizedEmail",
    "EmailConfirmed", "PasswordHash", "SecurityStamp", "ConcurrencyStamp",
    "PhoneNumber", "PhoneNumberConfirmed", "TwoFactorEnabled", "LockoutEnabled",
    "AccessFailedCount", "FirstName", "LastName", "IsActive"
) VALUES 
(
    'e4f5g6h7-i8j9-k0l1-m2n3-o4p5q6r7s8t9',
    'nurse1@clinic.com',
    'NURSE1@CLINIC.COM',
    'nurse1@clinic.com', 
    'NURSE1@CLINIC.COM',
    true,
    'AQAAAAIAAYagAAAAEA/e0iiYpSVDHNbveRAtrTlSYYQ1nhJdMlUBomjBbmQJZjXZWkEkPJpkOu+/GGcFQA==',
    'NURSE1SECURITYSTAMP1234567890123',
    'f5g6h7i8-j9k0-l1m2-n3o4-p5q6r7s8t9u0',
    '+91-9876543203',
    true,
    false,
    true,
    0,
    'Emily',
    'Rodriguez',
    true
),
(
    'g6h7i8j9-k0l1-m2n3-o4p5-q6r7s8t9u0v1',
    'nurse2@clinic.com',
    'NURSE2@CLINIC.COM',
    'nurse2@clinic.com',
    'NURSE2@CLINIC.COM',
    true,
    'AQAAAAIAAYagAAAAEA/e0iiYpSVDHNbveRAtrTlSYYQ1nhJdMlUBomjBbmQJZjXZWkEkPJpkOu+/GGcFQA==',
    'NURSE2SECURITYSTAMP1234567890123',
    'h7i8j9k0-l1m2-n3o4-p5q6-r7s8t9u0v1w2',
    '+91-9876543204',
    true,
    false,
    true,
    0,
    'Maria',
    'Santos',
    true
);

-- Insert Staff Users  
INSERT INTO "AspNetUsers" (
    "Id", "UserName", "NormalizedUserName", "Email", "NormalizedEmail",
    "EmailConfirmed", "PasswordHash", "SecurityStamp", "ConcurrencyStamp",
    "PhoneNumber", "PhoneNumberConfirmed", "TwoFactorEnabled", "LockoutEnabled",
    "AccessFailedCount", "FirstName", "LastName", "IsActive"
) VALUES 
(
    'i8j9k0l1-m2n3-o4p5-q6r7-s8t9u0v1w2x3',
    'staff1@clinic.com',
    'STAFF1@CLINIC.COM',
    'staff1@clinic.com',
    'STAFF1@CLINIC.COM',
    true,
    'AQAAAAIAAYagAAAAEA/e0iiYpSVDHNbveRAtrTlSYYQ1nhJdMlUBomjBbmQJZjXZWkEkPJpkOu+/GGcFQA==',
    'STAFF1SECURITYSTAMP12345678901234',
    'j9k0l1m2-n3o4-p5q6-r7s8-t9u0v1w2x3y4',
    '+91-9876543205',
    true,
    false,
    true,
    0,
    'James',
    'Wilson',
    true
),
(
    'k0l1m2n3-o4p5-q6r7-s8t9-u0v1w2x3y4z5',
    'staff2@clinic.com', 
    'STAFF2@CLINIC.COM',
    'staff2@clinic.com',
    'STAFF2@CLINIC.COM',
    true,
    'AQAAAAIAAYagAAAAEA/e0iiYpSVDHNbveRAtrTlSYYQ1nhJdMlUBomjBbmQJZjXZWkEkPJpkOu+/GGcFQA==',
    'STAFF2SECURITYSTAMP12345678901234',
    'l1m2n3o4-p5q6-r7s8-t9u0-v1w2x3y4z5a6',
    '+91-9876543206',
    true,
    false,
    true,
    0,
    'Lisa',
    'Brown',
    true
);

-- Now assign roles to users
-- Get role IDs first (you may need to adjust these based on actual role IDs)
-- Let's get the current role IDs and then insert role assignments

-- Doctor Role Assignments
INSERT INTO "AspNetUserRoles" ("UserId", "RoleId") VALUES
('a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6', (SELECT "Id" FROM "AspNetRoles" WHERE "Name" = 'Doctor')),
('c2d3e4f5-g6h7-i8j9-k0l1-m2n3o4p5q6r7', (SELECT "Id" FROM "AspNetRoles" WHERE "Name" = 'Doctor'));

-- Nurse Role Assignments  
INSERT INTO "AspNetUserRoles" ("UserId", "RoleId") VALUES
('e4f5g6h7-i8j9-k0l1-m2n3-o4p5q6r7s8t9', (SELECT "Id" FROM "AspNetRoles" WHERE "Name" = 'Nurse')),
('g6h7i8j9-k0l1-m2n3-o4p5-q6r7s8t9u0v1', (SELECT "Id" FROM "AspNetRoles" WHERE "Name" = 'Nurse'));

-- Staff Role Assignments
INSERT INTO "AspNetUserRoles" ("UserId", "RoleId") VALUES
('i8j9k0l1-m2n3-o4p5-q6r7-s8t9u0v1w2x3', (SELECT "Id" FROM "AspNetRoles" WHERE "Name" = 'Staff')),
('k0l1m2n3-o4p5-q6r7-s8t9-u0v1w2x3y4z5', (SELECT "Id" FROM "AspNetRoles" WHERE "Name" = 'Staff'));

-- Verify the insertions
SELECT 'Users created successfully!' AS status;
SELECT COUNT(*) AS total_users FROM "AspNetUsers";
SELECT r."Name" as role_name, COUNT(ur."UserId") as user_count 
FROM "AspNetRoles" r
LEFT JOIN "AspNetUserRoles" ur ON r."Id" = ur."RoleId" 
GROUP BY r."Name"
ORDER BY r."Name";
