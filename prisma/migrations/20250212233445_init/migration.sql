/*
  Warnings:

  - The values [KUMASI,ACCRA,SUNYANI] on the enum `Location` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Location_new" AS ENUM ('AHAFO', 'ASHANTI', 'BONO', 'BONO_EAST', 'CENTRAL', 'EASTERN', 'GREATER_ACCRA', 'NORTH_EAST', 'NORTHERN', 'OTI', 'SAVANNAH', 'UPPER_EAST', 'UPPER_WEST', 'VOLTA', 'WESTERN', 'WESTERN_NORTH');
ALTER TYPE "Location" RENAME TO "Location_old";
ALTER TYPE "Location_new" RENAME TO "Location";
DROP TYPE "Location_old";
COMMIT;
