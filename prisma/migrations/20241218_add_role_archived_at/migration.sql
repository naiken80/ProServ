-- Add archivedAt soft-delete column for organization roles
ALTER TABLE "Role"
ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3);
