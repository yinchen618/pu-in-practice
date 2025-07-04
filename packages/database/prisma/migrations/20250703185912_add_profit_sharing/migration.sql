/*
  Warnings:

  - A unique constraint covering the columns `[organizationId,code]` on the table `customer` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `product` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "product_organizationId_code_key";

-- AlterTable
ALTER TABLE "customer" ADD COLUMN     "code" TEXT;

-- CreateTable
CREATE TABLE "profit_sharing" (
    "id" TEXT NOT NULL,
    "revenueType" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "productCode" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "bankAccountId" TEXT NOT NULL,
    "bankRetro" DECIMAL(15,2) NOT NULL,
    "companyRevenue" DECIMAL(15,2) NOT NULL,
    "rmRevenue" DECIMAL(15,2) NOT NULL,
    "findersRevenue" DECIMAL(15,2) NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profit_sharing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "customer_organizationId_code_key" ON "customer"("organizationId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "product_code_key" ON "product"("code");

-- AddForeignKey
ALTER TABLE "profit_sharing" ADD CONSTRAINT "profit_sharing_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profit_sharing" ADD CONSTRAINT "profit_sharing_productCode_fkey" FOREIGN KEY ("productCode") REFERENCES "product"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profit_sharing" ADD CONSTRAINT "profit_sharing_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profit_sharing" ADD CONSTRAINT "profit_sharing_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "bank_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
