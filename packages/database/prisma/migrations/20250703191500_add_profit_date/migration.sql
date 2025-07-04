/*
  Warnings:

  - You are about to drop the column `bankRetro` on the `profit_sharing` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `profit_sharing` table. All the data in the column will be lost.
  - You are about to drop the column `companyRevenue` on the `profit_sharing` table. All the data in the column will be lost.
  - You are about to drop the column `customerName` on the `profit_sharing` table. All the data in the column will be lost.
  - You are about to drop the column `findersRevenue` on the `profit_sharing` table. All the data in the column will be lost.
  - You are about to drop the column `productCode` on the `profit_sharing` table. All the data in the column will be lost.
  - You are about to drop the column `productName` on the `profit_sharing` table. All the data in the column will be lost.
  - You are about to drop the column `revenueType` on the `profit_sharing` table. All the data in the column will be lost.
  - You are about to drop the column `rmRevenue` on the `profit_sharing` table. All the data in the column will be lost.
  - Added the required column `amount` to the `profit_sharing` table without a default value. This is not possible if the table is not empty.
  - Added the required column `productId` to the `profit_sharing` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "profit_sharing" DROP CONSTRAINT "profit_sharing_bankAccountId_fkey";

-- DropForeignKey
ALTER TABLE "profit_sharing" DROP CONSTRAINT "profit_sharing_productCode_fkey";

-- AlterTable
ALTER TABLE "profit_sharing" DROP COLUMN "bankRetro",
DROP COLUMN "category",
DROP COLUMN "companyRevenue",
DROP COLUMN "customerName",
DROP COLUMN "findersRevenue",
DROP COLUMN "productCode",
DROP COLUMN "productName",
DROP COLUMN "revenueType",
DROP COLUMN "rmRevenue",
ADD COLUMN     "amount" DECIMAL(15,2) NOT NULL,
ADD COLUMN     "productId" TEXT NOT NULL,
ADD COLUMN     "profitDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "bankAccountId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "profit_sharing" ADD CONSTRAINT "profit_sharing_productId_fkey" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profit_sharing" ADD CONSTRAINT "profit_sharing_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "bank_account"("id") ON DELETE SET NULL ON UPDATE CASCADE;
