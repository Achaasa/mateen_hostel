/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `price` to the `Amenities` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ghCard` to the `Hostel` table without a default value. This is not possible if the table is not empty.
  - Added the required column `course` to the `Resident` table without a default value. This is not possible if the table is not empty.
  - Added the required column `emergencyContactName` to the `Resident` table without a default value. This is not possible if the table is not empty.
  - Added the required column `emergencyContactPhone` to the `Resident` table without a default value. This is not possible if the table is not empty.
  - Added the required column `relationship` to the `Resident` table without a default value. This is not possible if the table is not empty.
  - Added the required column `studentId` to the `Resident` table without a default value. This is not possible if the table is not empty.
  - Added the required column `basePrice` to the `Room` table without a default value. This is not possible if the table is not empty.
  - Added the required column `block` to the `Room` table without a default value. This is not possible if the table is not empty.
  - Added the required column `description` to the `Room` table without a default value. This is not possible if the table is not empty.
  - Added the required column `floor` to the `Room` table without a default value. This is not possible if the table is not empty.
  - Added the required column `maxCap` to the `Room` table without a default value. This is not possible if the table is not empty.
  - Added the required column `status` to the `Room` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `type` on the `Room` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "RoomStatus" AS ENUM ('AVAILABLE', 'OCCUPIED', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "RoomType" AS ENUM ('SINGLE', 'DOUBLE', 'SUITE', 'QUAD');

-- AlterTable
ALTER TABLE "Amenities" ADD COLUMN     "price" DOUBLE PRECISION NOT NULL;

-- AlterTable
ALTER TABLE "Hostel" ADD COLUMN     "ghCard" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Resident" ADD COLUMN     "course" TEXT NOT NULL,
ADD COLUMN     "emergencyContactName" TEXT NOT NULL,
ADD COLUMN     "emergencyContactPhone" TEXT NOT NULL,
ADD COLUMN     "relationship" TEXT NOT NULL,
ADD COLUMN     "studentId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Room" ADD COLUMN     "basePrice" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "block" TEXT NOT NULL,
ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "floor" TEXT NOT NULL,
ADD COLUMN     "maxCap" INTEGER NOT NULL,
ADD COLUMN     "status" "RoomStatus" NOT NULL,
DROP COLUMN "type",
ADD COLUMN     "type" "RoomType" NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
