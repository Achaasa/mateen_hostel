/*
  Warnings:

  - Added the required column `calendarYearId` to the `Payment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `calendarYearId` to the `Resident` table without a default value. This is not possible if the table is not empty.
  - Added the required column `gender` to the `Room` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `qualification` on the `Staff` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "StaffQualification" AS ENUM ('BECE', 'WASCE', 'TVET', 'BSC');

-- CreateEnum
CREATE TYPE "RoomGender" AS ENUM ('MALE', 'FEMALE', 'MIX');

-- CreateEnum
CREATE TYPE "HostelState" AS ENUM ('PUBLISHED', 'UNPUBLISHED');

-- AlterTable
ALTER TABLE "Hostel" ADD COLUMN     "state" "HostelState" NOT NULL DEFAULT 'UNPUBLISHED';

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "calendarYearId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Resident" ADD COLUMN     "calendarYearId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Room" ADD COLUMN     "gender" "RoomGender" NOT NULL;

-- AlterTable
ALTER TABLE "Staff" DROP COLUMN "qualification",
ADD COLUMN     "qualification" "StaffQualification" NOT NULL;

-- DropEnum
DROP TYPE "StaffQulification";

-- CreateTable
CREATE TABLE "CalendarYear" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "hostelId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarYear_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistoricalResident" (
    "id" TEXT NOT NULL,
    "residentId" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "calendarYearId" TEXT NOT NULL,
    "amountPaid" DOUBLE PRECISION NOT NULL,
    "roomPrice" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HistoricalResident_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CalendarYear_name_key" ON "CalendarYear"("name");

-- AddForeignKey
ALTER TABLE "Resident" ADD CONSTRAINT "Resident_calendarYearId_fkey" FOREIGN KEY ("calendarYearId") REFERENCES "CalendarYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_calendarYearId_fkey" FOREIGN KEY ("calendarYearId") REFERENCES "CalendarYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarYear" ADD CONSTRAINT "CalendarYear_hostelId_fkey" FOREIGN KEY ("hostelId") REFERENCES "Hostel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoricalResident" ADD CONSTRAINT "HistoricalResident_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoricalResident" ADD CONSTRAINT "HistoricalResident_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoricalResident" ADD CONSTRAINT "HistoricalResident_calendarYearId_fkey" FOREIGN KEY ("calendarYearId") REFERENCES "CalendarYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
