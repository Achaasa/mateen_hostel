-- DropForeignKey
ALTER TABLE "Resident" DROP CONSTRAINT "Resident_roomId_fkey";

-- DropForeignKey
ALTER TABLE "Room" DROP CONSTRAINT "Room_hostelId_fkey";

-- DropForeignKey
ALTER TABLE "Staff" DROP CONSTRAINT "Staff_hostelId_fkey";

-- DropForeignKey
ALTER TABLE "Visitor" DROP CONSTRAINT "Visitor_residentId_fkey";

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_hostelId_fkey" FOREIGN KEY ("hostelId") REFERENCES "Hostel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_hostelId_fkey" FOREIGN KEY ("hostelId") REFERENCES "Hostel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resident" ADD CONSTRAINT "Resident_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visitor" ADD CONSTRAINT "Visitor_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident"("id") ON DELETE CASCADE ON UPDATE CASCADE;
