-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_residentId_fkey";

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "historicalResidentId" TEXT,
ALTER COLUMN "residentId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_historicalResidentId_fkey" FOREIGN KEY ("historicalResidentId") REFERENCES "HistoricalResident"("id") ON DELETE SET NULL ON UPDATE CASCADE;
