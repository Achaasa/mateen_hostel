/*
  Warnings:

  - You are about to drop the column `basePrice` on the `Room` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[email]` on the table `Resident` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email]` on the table `Staff` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `Amenities` table without a default value. This is not possible if the table is not empty.
  - Added the required column `method` to the `Payment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Payment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `balanceOwed` to the `Resident` table without a default value. This is not possible if the table is not empty.
  - Added the required column `gender` to the `Resident` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Resident` table without a default value. This is not possible if the table is not empty.
  - Added the required column `price` to the `Room` table without a default value. This is not possible if the table is not empty.
  - Added the required column `block` to the `Staff` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dateOfBirth` to the `Staff` table without a default value. This is not possible if the table is not empty.
  - Added the required column `email` to the `Staff` table without a default value. This is not possible if the table is not empty.
  - Added the required column `firstName` to the `Staff` table without a default value. This is not possible if the table is not empty.
  - Added the required column `gender` to the `Staff` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ghanaCardNumber` to the `Staff` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastName` to the `Staff` table without a default value. This is not possible if the table is not empty.
  - Added the required column `maritalStatus` to the `Staff` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nationality` to the `Staff` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phoneNumber` to the `Staff` table without a default value. This is not possible if the table is not empty.
  - Added the required column `qualification` to the `Staff` table without a default value. This is not possible if the table is not empty.
  - Added the required column `religion` to the `Staff` table without a default value. This is not possible if the table is not empty.
  - Added the required column `residence` to the `Staff` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Staff` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `role` on the `Staff` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Visitor` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "paymentMethod" AS ENUM ('CASH', 'CARD', 'MOMO');

-- CreateEnum
CREATE TYPE "StaffStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "MaritalStatus" AS ENUM ('SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED');

-- AlterTable
ALTER TABLE "Amenities" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "method" "paymentMethod" NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "date" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Resident" ADD COLUMN     "amountPaid" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "balanceOwed" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "gender" "Gender" NOT NULL,
ADD COLUMN     "roomAssigned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Room" DROP COLUMN "basePrice",
ADD COLUMN     "price" DOUBLE PRECISION NOT NULL;

-- AlterTable
ALTER TABLE "Staff" ADD COLUMN     "block" TEXT NOT NULL,
ADD COLUMN     "dateOfAppointment" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "dateOfBirth" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "email" TEXT NOT NULL,
ADD COLUMN     "firstName" TEXT NOT NULL,
ADD COLUMN     "gender" "Gender" NOT NULL,
ADD COLUMN     "ghanaCardNumber" TEXT NOT NULL,
ADD COLUMN     "lastName" TEXT NOT NULL,
ADD COLUMN     "maritalStatus" "MaritalStatus" NOT NULL,
ADD COLUMN     "middleName" TEXT,
ADD COLUMN     "nationality" TEXT NOT NULL,
ADD COLUMN     "phoneNumber" TEXT NOT NULL,
ADD COLUMN     "qualification" TEXT NOT NULL,
ADD COLUMN     "religion" TEXT NOT NULL,
ADD COLUMN     "residence" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "role",
ADD COLUMN     "role" "StaffRole" NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Visitor" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Resident_email_key" ON "Resident"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Staff_email_key" ON "Staff"("email");
