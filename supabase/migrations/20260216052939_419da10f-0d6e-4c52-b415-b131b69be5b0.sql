-- Confirm admin email so login works
UPDATE auth.users 
SET email_confirmed_at = now(), 
    updated_at = now()
WHERE email = 'plenasaudebv@gmail.com';