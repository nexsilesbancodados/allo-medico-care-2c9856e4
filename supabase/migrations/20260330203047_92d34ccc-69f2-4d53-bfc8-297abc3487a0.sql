
CREATE OR REPLACE FUNCTION public.fn_set_return_deadline()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' AND NEW.return_deadline IS NULL THEN
    NEW.return_deadline := now() + interval '60 days';
  END IF;
  RETURN NEW;
END;
$function$;
