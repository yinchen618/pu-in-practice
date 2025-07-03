-- AlterTable
ALTER TABLE "product" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active',
ALTER COLUMN "currency" SET DEFAULT 'USD';
