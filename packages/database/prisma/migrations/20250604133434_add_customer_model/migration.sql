-- CreateTable
CREATE TABLE "customer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "bankAccount" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "rm1Id" TEXT,
    "rm2Id" TEXT,
    "finder1Id" TEXT,
    "finder2Id" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "customer_organizationId_email_key" ON "customer"("organizationId", "email");

-- AddForeignKey
ALTER TABLE "customer" ADD CONSTRAINT "customer_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer" ADD CONSTRAINT "customer_rm1Id_fkey" FOREIGN KEY ("rm1Id") REFERENCES "relationship_manager"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer" ADD CONSTRAINT "customer_rm2Id_fkey" FOREIGN KEY ("rm2Id") REFERENCES "relationship_manager"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer" ADD CONSTRAINT "customer_finder1Id_fkey" FOREIGN KEY ("finder1Id") REFERENCES "relationship_manager"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer" ADD CONSTRAINT "customer_finder2Id_fkey" FOREIGN KEY ("finder2Id") REFERENCES "relationship_manager"("id") ON DELETE SET NULL ON UPDATE CASCADE;
