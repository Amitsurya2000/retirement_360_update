-- Lock the leads table so it can't be read via the public anon key.
-- Prisma connects as the table owner (superuser), which bypasses RLS,
-- so the app keeps working — only the public Data API is blocked.
ALTER TABLE "UserProfile" ENABLE ROW LEVEL SECURITY;

-- Make the view respect the underlying table's security too.
ALTER VIEW "leads_view" SET (security_invoker = on);
