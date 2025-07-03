/*
  Warnings:

  - Added the required column `category` to the `product` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "product" ADD COLUMN "category" TEXT;

-- Set default value for existing records
UPDATE "product" SET "category" = 'Fund' WHERE "category" IS NULL;

-- Make the column required
ALTER TABLE "product" ALTER COLUMN "category" SET NOT NULL;
