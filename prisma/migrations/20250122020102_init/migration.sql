/*
  Warnings:

  - Added the required column `imageKey` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `imageUrl` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Hostel" ADD COLUMN     "isVerifeid" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "imageKey" TEXT NOT NULL,
ADD COLUMN     "imageUrl" TEXT NOT NULL;
