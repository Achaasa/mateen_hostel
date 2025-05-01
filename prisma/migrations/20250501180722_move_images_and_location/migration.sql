-- STEP 1: Create the HostelImages table
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

-- STEP 2: Migrate existing image data from Hostel to HostelImages
INSERT INTO "HostelImages" ("id", "hostelId", "imageUrl", "imageKey", "createdAt", "updatedAt", "delFlag")
SELECT gen_random_uuid(), "id", "imageUrl", "imageKey", NOW(), NOW(), FALSE
FROM "Hostel"
WHERE "imageUrl" IS NOT NULL AND "imageKey" IS NOT NULL;

-- STEP 3: Add temporary enum column for location
ALTER TABLE "Hostel" ADD COLUMN "location_enum" "Location";

-- STEP 4: Migrate location data manually (map KUMASI => ASHANTI, SUNYANI => BONO)
UPDATE "Hostel" SET "location_enum" = 'ASHANTI' WHERE "location" = 'KUMASI';
UPDATE "Hostel" SET "location_enum" = 'BONO' WHERE "location" = 'SUNYANI';

-- STEP 5: Drop original location, imageUrl, and imageKey columns
ALTER TABLE "Hostel" DROP COLUMN "location";
ALTER TABLE "Hostel" DROP COLUMN "imageUrl";
ALTER TABLE "Hostel" DROP COLUMN "imageKey";

-- STEP 6: Rename location_enum to location (now enum type)
ALTER TABLE "Hostel" RENAME COLUMN "location_enum" TO "location";

-- STEP 7: Add new field to User model
ALTER TABLE "User" ADD COLUMN "changedPassword" BOOLEAN NOT NULL DEFAULT false;

-- STEP 8: Add foreign key constraint to HostelImages
ALTER TABLE "HostelImages"
ADD CONSTRAINT "HostelImages_hostelId_fkey"
FOREIGN KEY ("hostelId") REFERENCES "Hostel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
