/*
  Warnings:

  - Added the required column `companyRevenue` to the `profit_sharing` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyRevenueOriginal` to the `profit_sharing` table without a default value. This is not possible if the table is not empty.
  - Added the required column `directTradeBookingFee` to the `profit_sharing` table without a default value. This is not possible if the table is not empty.
  - Added the required column `findersRevenueOriginal` to the `profit_sharing` table without a default value. This is not possible if the table is not empty.
  - Added the required column `findersRevenueUSD` to the `profit_sharing` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fxRate` to the `profit_sharing` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rmRevenueOriginal` to the `profit_sharing` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rmRevenueUSD` to the `profit_sharing` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shareable` to the `profit_sharing` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "profit_sharing" ADD COLUMN     "companyProfitSharePercent" DECIMAL(5,2) NOT NULL DEFAULT 50.00,
ADD COLUMN     "companyRevenue" DECIMAL(15,2) NOT NULL,
ADD COLUMN     "companyRevenueOriginal" DECIMAL(15,2) NOT NULL,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN     "directTradeBookingFee" DECIMAL(15,2) NOT NULL,
ADD COLUMN     "finderProfitSharePercent" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
ADD COLUMN     "findersRevenueOriginal" DECIMAL(15,2) NOT NULL,
ADD COLUMN     "findersRevenueUSD" DECIMAL(15,2) NOT NULL,
ADD COLUMN     "fxRate" DECIMAL(10,5) NOT NULL,
ADD COLUMN     "rmProfitSharePercent" DECIMAL(5,2) NOT NULL DEFAULT 50.00,
ADD COLUMN     "rmRevenueOriginal" DECIMAL(15,2) NOT NULL,
ADD COLUMN     "rmRevenueUSD" DECIMAL(15,2) NOT NULL,
ADD COLUMN     "shareable" DECIMAL(15,2) NOT NULL;
