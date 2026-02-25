UPDATE public.exam_requests 
SET file_urls = '["/images/sample-xray.jpg"]'::jsonb
WHERE id = '2ff9e262-9695-4e51-988c-6c397438bbe0';