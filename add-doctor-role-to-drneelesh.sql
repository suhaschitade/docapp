-- Add Doctor role to drneeleshreddy user
-- This will allow him to appear in the doctor dropdown while keeping his Admin role

-- First, let's check the current user and role data
SELECT 'Current Users:' as info;
SELECT Id, UserName, Email, FirstName, LastName FROM "AspNetUsers" WHERE UserName LIKE '%drneelesh%' OR Email LIKE '%drneelesh%';

SELECT 'Current Roles:' as info;
SELECT Id, Name FROM "AspNetRoles";

SELECT 'Current User Roles for drneeleshreddy:' as info;
SELECT 
    u.UserName, 
    u.Email, 
    u.FirstName, 
    u.LastName,
    r.Name as RoleName
FROM "AspNetUsers" u
JOIN "AspNetUserRoles" ur ON u.Id = ur.UserId
JOIN "AspNetRoles" r ON ur.RoleId = r.Id
WHERE u.UserName LIKE '%drneelesh%' OR u.Email LIKE '%drneelesh%';

-- Add Doctor role to drneeleshreddy if not already assigned
INSERT INTO "AspNetUserRoles" (UserId, RoleId)
SELECT 
    u.Id as UserId,
    r.Id as RoleId
FROM "AspNetUsers" u, "AspNetRoles" r
WHERE (u.UserName LIKE '%drneelesh%' OR u.Email LIKE '%drneelesh%')
  AND r.Name = 'Doctor'
  AND NOT EXISTS (
    SELECT 1 FROM "AspNetUserRoles" ur2 
    WHERE ur2.UserId = u.Id AND ur2.RoleId = r.Id
  );

-- Verify the role was added
SELECT 'Updated User Roles for drneeleshreddy:' as info;
SELECT 
    u.UserName, 
    u.Email, 
    u.FirstName, 
    u.LastName,
    r.Name as RoleName
FROM "AspNetUsers" u
JOIN "AspNetUserRoles" ur ON u.Id = ur.UserId
JOIN "AspNetRoles" r ON ur.RoleId = r.Id
WHERE u.UserName LIKE '%drneelesh%' OR u.Email LIKE '%drneelesh%'
ORDER BY r.Name;