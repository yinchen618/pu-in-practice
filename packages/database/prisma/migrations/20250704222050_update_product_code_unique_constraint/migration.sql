/*
  Warnings:

  - A unique constraint covering the columns `[organizationId,code]` on the table `product` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "product_code_key";

-- CreateIndex
CREATE UNIQUE INDEX "product_organizationId_code_key" ON "product"("organizationId", "code");
