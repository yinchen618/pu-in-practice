-- AlterTable
ALTER TABLE "expense" ADD COLUMN     "rmId" TEXT;

-- AddForeignKey
ALTER TABLE "expense" ADD CONSTRAINT "expense_rmId_fkey" FOREIGN KEY ("rmId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
