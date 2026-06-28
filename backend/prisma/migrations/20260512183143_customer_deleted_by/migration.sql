-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "deletedById" INTEGER;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
