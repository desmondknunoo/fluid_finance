-- Let the open editor update editions in place and delete them. Reads and inserts were
-- granted by the earlier migrations; without these two, PUT and DELETE fail closed.
grant update, delete on public.fuel_reports to service_role;
