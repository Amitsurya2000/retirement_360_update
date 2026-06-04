CREATE OR REPLACE VIEW "leads_view" AS
SELECT
  "createdAt"            AS "Date",
  "fullName"             AS "Name",
  "phone"                AS "Phone",
  "companyName"          AS "Company",
  "email"                AS "Email",
  "age"                  AS "Age",
  "maritalStatus"        AS "Marital",
  "corpus"               AS "Corpus",
  "desiredMonthlyIncome" AS "WantsPerMonth",
  "id",
  "planPdfUrl"           AS "PDF_Download_Link"
FROM "UserProfile"
ORDER BY "createdAt" DESC;
