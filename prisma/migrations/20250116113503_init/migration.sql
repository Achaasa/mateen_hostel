-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "paymentMethod" ADD VALUE 'BANK';
ALTER TYPE "paymentMethod" ADD VALUE 'USSD';
ALTER TYPE "paymentMethod" ADD VALUE 'QR_CODE';
ALTER TYPE "paymentMethod" ADD VALUE 'VISA';
ALTER TYPE "paymentMethod" ADD VALUE 'MASTER_CARD';
ALTER TYPE "paymentMethod" ADD VALUE 'ONLINE';
