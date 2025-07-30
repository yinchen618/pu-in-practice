-- AlterTable
ALTER TABLE "profit_sharing" ADD COLUMN     "companyFeePercent" DECIMAL(5,2),
ADD COLUMN     "companyRevenuePercent" DECIMAL(5,2),
ADD COLUMN     "finder1FeePercent" DECIMAL(5,2),
ADD COLUMN     "finder1RevenuePercent" DECIMAL(5,2),
ADD COLUMN     "finder2FeePercent" DECIMAL(5,2),
ADD COLUMN     "finder2RevenuePercent" DECIMAL(5,2),
ADD COLUMN     "rm1FeePercent" DECIMAL(5,2),
ADD COLUMN     "rm1RevenuePercent" DECIMAL(5,2),
ADD COLUMN     "rm2FeePercent" DECIMAL(5,2),
ADD COLUMN     "rm2RevenuePercent" DECIMAL(5,2);
