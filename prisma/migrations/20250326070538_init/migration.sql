/*
  Warnings:

  - Added the required column `residentCourse` to the `HistoricalResident` table without a default value. This is not possible if the table is not empty.
  - Added the required column `residentEmail` to the `HistoricalResident` table without a default value. This is not possible if the table is not empty.
  - Added the required column `residentName` to the `HistoricalResident` table without a default value. This is not possible if the table is not empty.
  - Added the required column `residentPhone` to the `HistoricalResident` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "HistoricalResident" ADD COLUMN     "residentCourse" TEXT NOT NULL,
ADD COLUMN     "residentEmail" TEXT NOT NULL,
ADD COLUMN     "residentName" TEXT NOT NULL,
ADD COLUMN     "residentPhone" TEXT NOT NULL;
