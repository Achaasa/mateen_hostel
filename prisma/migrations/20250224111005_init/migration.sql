/*
  Warnings:

  - Changed the type of `role` on the `Staff` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `qualification` on the `Staff` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Staff" DROP COLUMN "role",
ADD COLUMN     "role" TEXT NOT NULL,
DROP COLUMN "qualification",
ADD COLUMN     "qualification" TEXT NOT NULL;

-- DropEnum
DROP TYPE "StaffQualification";

-- DropEnum
DROP TYPE "StaffRole";
