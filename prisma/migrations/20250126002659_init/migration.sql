/*
  Warnings:

  - The values [HOSTEL_ADMIN,ROOM_ADMIN,RESIDENT,VISITOR] on the enum `StaffRole` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `name` on the `Staff` table. All the data in the column will be lost.
  - Changed the type of `religion` on the `Staff` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "StaffQulification" AS ENUM ('BECE', 'WASCE', 'TVET', 'BSC');

-- CreateEnum
CREATE TYPE "Religion" AS ENUM ('CHRISTIAN', 'MUSLIM', 'TRADITIONALIST');

-- AlterEnum
BEGIN;
CREATE TYPE "StaffRole_new" AS ENUM ('HOSTEL_MANAGER', 'WARDEN', 'CHIEF_WADEN');
ALTER TABLE "Staff" ALTER COLUMN "role" TYPE "StaffRole_new" USING ("role"::text::"StaffRole_new");
ALTER TYPE "StaffRole" RENAME TO "StaffRole_old";
ALTER TYPE "StaffRole_new" RENAME TO "StaffRole";
DROP TYPE "StaffRole_old";
COMMIT;

-- AlterTable
ALTER TABLE "Staff" DROP COLUMN "name",
DROP COLUMN "religion",
ADD COLUMN     "religion" "Religion" NOT NULL;
