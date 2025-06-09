-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "VisitorStatus" AS ENUM ('ACTIVE', 'CHECKED_OUT');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "Location" AS ENUM ('AHAFO', 'ASHANTI', 'BONO', 'BONO_EAST', 'CENTRAL', 'EASTERN', 'GREATER_ACCRA', 'NORTH_EAST', 'NORTHERN', 'OTI', 'SAVANNAH', 'UPPER_EAST', 'UPPER_WEST', 'VOLTA', 'WESTERN', 'WESTERN_NORTH');

-- CreateEnum
CREATE TYPE "Religion" AS ENUM ('CHRISTIAN', 'MUSLIM', 'TRADITIONALIST');

-- CreateEnum
CREATE TYPE "RoomStatus" AS ENUM ('AVAILABLE', 'OCCUPIED', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "RoomType" AS ENUM ('SINGLE', 'DOUBLE', 'SUITE', 'QUAD');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "paymentMethod" AS ENUM ('CASH', 'CARD', 'BANK', 'MOMO', 'USSD', 'QR_CODE', 'VISA', 'MASTER_CARD', 'ONLINE');

-- CreateEnum
CREATE TYPE "StaffStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "MaritalStatus" AS ENUM ('SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED');

-- CreateEnum
CREATE TYPE "RoomGender" AS ENUM ('MALE', 'FEMALE', 'MIX');

-- CreateEnum
CREATE TYPE "HostelState" AS ENUM ('PUBLISHED', 'UNPUBLISHED');

-- CreateTable
CREATE TABLE "Hostel" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "address" TEXT NOT NULL,
    "manager" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "ghCard" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "delFlag" BOOLEAN NOT NULL DEFAULT false,
    "state" "HostelState" NOT NULL DEFAULT 'UNPUBLISHED',
    "location" "Location" NOT NULL,
    "logoKey" TEXT,
    "logoUrl" TEXT,

    CONSTRAINT "Hostel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Room" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "block" TEXT,
    "floor" TEXT,
    "maxCap" INTEGER NOT NULL,
    "hostelId" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL,
    "type" "RoomType" NOT NULL,
    "status" "RoomStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "delFlag" BOOLEAN NOT NULL DEFAULT false,
    "gender" "RoomGender" NOT NULL,
    "currentResidentCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Staff" (
    "id" TEXT NOT NULL,
    "hostelId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "middleName" TEXT,
    "lastName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "nationality" TEXT NOT NULL,
    "gender" "Gender" NOT NULL,
    "maritalStatus" "MaritalStatus" NOT NULL,
    "ghanaCardNumber" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "religion" "Religion" NOT NULL,
    "email" TEXT NOT NULL,
    "residence" TEXT NOT NULL,
    "block" TEXT NOT NULL,
    "dateOfAppointment" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "passportUrl" TEXT NOT NULL,
    "passportKey" TEXT NOT NULL,
    "delFlag" BOOLEAN NOT NULL DEFAULT false,
    "role" TEXT NOT NULL,
    "qualification" TEXT NOT NULL,

    CONSTRAINT "Staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Amenities" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "hostelId" TEXT NOT NULL,

    CONSTRAINT "Amenities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Resident" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "course" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emergencyContactName" TEXT NOT NULL,
    "emergencyContactPhone" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "roomId" TEXT,
    "gender" "Gender" NOT NULL,
    "roomAssigned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "amountPaid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "balanceOwed" DOUBLE PRECISION,
    "roomPrice" DOUBLE PRECISION,
    "delFlag" BOOLEAN NOT NULL DEFAULT false,
    "calendarYearId" TEXT NOT NULL,
    "hostelId" TEXT,

    CONSTRAINT "Resident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "residentId" TEXT,
    "status" TEXT,
    "roomId" TEXT,
    "reference" TEXT NOT NULL,
    "method" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "delFlag" BOOLEAN NOT NULL DEFAULT false,
    "calendarYearId" TEXT NOT NULL,
    "historicalResidentId" TEXT,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Visitor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "residentId" TEXT NOT NULL,
    "timeIn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "timeOut" TIMESTAMP(3),
    "status" "VisitorStatus" NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Visitor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "imageKey" TEXT NOT NULL,
    "delFlag" BOOLEAN NOT NULL DEFAULT false,
    "hostelId" TEXT,
    "changedPassword" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoomImage" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "imageKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "delFlag" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "RoomImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendarYear" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
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
    "hostelId" TEXT,
    "residentCourse" TEXT NOT NULL,
    "residentEmail" TEXT NOT NULL,
    "residentName" TEXT NOT NULL,
    "residentPhone" TEXT NOT NULL,

    CONSTRAINT "HistoricalResident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HostelImages" (
    "id" TEXT NOT NULL,
    "hostelId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "imageKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "delFlag" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "HostelImages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_RoomAmenities" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Staff_email_key" ON "Staff"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Resident_email_key" ON "Resident"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_reference_key" ON "Payment"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "CalendarYear_name_key" ON "CalendarYear"("name");

-- CreateIndex
CREATE UNIQUE INDEX "_RoomAmenities_AB_unique" ON "_RoomAmenities"("A", "B");

-- CreateIndex
CREATE INDEX "_RoomAmenities_B_index" ON "_RoomAmenities"("B");

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_hostelId_fkey" FOREIGN KEY ("hostelId") REFERENCES "Hostel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_hostelId_fkey" FOREIGN KEY ("hostelId") REFERENCES "Hostel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Amenities" ADD CONSTRAINT "Amenities_hostelId_fkey" FOREIGN KEY ("hostelId") REFERENCES "Hostel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resident" ADD CONSTRAINT "Resident_calendarYearId_fkey" FOREIGN KEY ("calendarYearId") REFERENCES "CalendarYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resident" ADD CONSTRAINT "Resident_hostelId_fkey" FOREIGN KEY ("hostelId") REFERENCES "Hostel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resident" ADD CONSTRAINT "Resident_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_calendarYearId_fkey" FOREIGN KEY ("calendarYearId") REFERENCES "CalendarYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_historicalResidentId_fkey" FOREIGN KEY ("historicalResidentId") REFERENCES "HistoricalResident"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visitor" ADD CONSTRAINT "Visitor_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_hostelId_fkey" FOREIGN KEY ("hostelId") REFERENCES "Hostel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomImage" ADD CONSTRAINT "RoomImage_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarYear" ADD CONSTRAINT "CalendarYear_hostelId_fkey" FOREIGN KEY ("hostelId") REFERENCES "Hostel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoricalResident" ADD CONSTRAINT "HistoricalResident_calendarYearId_fkey" FOREIGN KEY ("calendarYearId") REFERENCES "CalendarYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoricalResident" ADD CONSTRAINT "HistoricalResident_hostelId_fkey" FOREIGN KEY ("hostelId") REFERENCES "Hostel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoricalResident" ADD CONSTRAINT "HistoricalResident_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostelImages" ADD CONSTRAINT "HostelImages_hostelId_fkey" FOREIGN KEY ("hostelId") REFERENCES "Hostel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RoomAmenities" ADD CONSTRAINT "_RoomAmenities_A_fkey" FOREIGN KEY ("A") REFERENCES "Amenities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RoomAmenities" ADD CONSTRAINT "_RoomAmenities_B_fkey" FOREIGN KEY ("B") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;
