-- AlterTable
ALTER TABLE "HistoricalResident" ADD COLUMN     "hostelId" TEXT;

-- AddForeignKey
ALTER TABLE "HistoricalResident" ADD CONSTRAINT "HistoricalResident_hostelId_fkey" FOREIGN KEY ("hostelId") REFERENCES "Hostel"("id") ON DELETE SET NULL ON UPDATE CASCADE;
