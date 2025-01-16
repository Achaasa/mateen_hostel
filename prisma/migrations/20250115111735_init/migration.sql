/*
  Warnings:

  - The primary key for the `_RoomAmenities` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[A,B]` on the table `_RoomAmenities` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "_RoomAmenities" DROP CONSTRAINT "_RoomAmenities_AB_pkey";

-- CreateIndex
CREATE UNIQUE INDEX "_RoomAmenities_AB_unique" ON "_RoomAmenities"("A", "B");
