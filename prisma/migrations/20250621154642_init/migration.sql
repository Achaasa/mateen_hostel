-- CreateEnum
CREATE TYPE "StaffType" AS ENUM ('ADMIN', 'OTHERS');

-- AlterTable
ALTER TABLE "Staff" ADD COLUMN     "type" "StaffType" NOT NULL DEFAULT 'OTHERS';
