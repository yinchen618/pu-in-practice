/*
  Warnings:

  - You are about to drop the column `category` on the `product` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `product` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `product` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `product` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "product" DROP COLUMN "category",
DROP COLUMN "description",
DROP COLUMN "price",
DROP COLUMN "status",
ADD COLUMN     "distributionType" TEXT NOT NULL DEFAULT 'MONTHLY';
