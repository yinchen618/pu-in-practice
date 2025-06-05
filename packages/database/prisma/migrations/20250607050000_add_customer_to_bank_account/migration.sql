-- Remove bankAccount column from customer table
ALTER TABLE "customer" DROP COLUMN "bankAccount";

-- Add customerId column to bank_account table
ALTER TABLE "bank_account" ADD COLUMN "customerId" TEXT;

-- Add foreign key constraint
ALTER TABLE "bank_account" ADD CONSTRAINT "bank_account_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customer"("id") ON DELETE CASCADE ON UPDATE CASCADE; 
