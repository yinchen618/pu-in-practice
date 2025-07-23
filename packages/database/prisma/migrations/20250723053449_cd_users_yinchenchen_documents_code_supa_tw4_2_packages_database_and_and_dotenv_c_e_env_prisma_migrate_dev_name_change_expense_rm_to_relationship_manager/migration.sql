-- DropForeignKey
ALTER TABLE "expense" DROP CONSTRAINT "expense_rmId_fkey";

-- AddForeignKey
ALTER TABLE "expense" ADD CONSTRAINT "expense_rmId_fkey" FOREIGN KEY ("rmId") REFERENCES "relationship_manager"("id") ON DELETE SET NULL ON UPDATE CASCADE;
