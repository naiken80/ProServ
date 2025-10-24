ALTER TABLE "Project"
  ADD COLUMN "baselineRateCardId" TEXT;

ALTER TABLE "Project"
  ADD CONSTRAINT "Project_baselineRateCardId_fkey"
  FOREIGN KEY ("baselineRateCardId") REFERENCES "RateCard"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
