-- CreateTable
CREATE TABLE "ammeter" (
    "id" VARCHAR NOT NULL,
    "electricMeterNumber" VARCHAR NOT NULL,
    "electricMeterName" VARCHAR NOT NULL,
    "deviceNumber" VARCHAR NOT NULL,
    "factory" VARCHAR,
    "device" VARCHAR,
    "voltage" DOUBLE PRECISION,
    "currents" DOUBLE PRECISION,
    "power" DOUBLE PRECISION,
    "battery" DOUBLE PRECISION,
    "switchState" INTEGER,
    "networkState" INTEGER,
    "lastUpdated" TIMESTAMP(6),
    "organizationId" VARCHAR,
    "createdAt" TIMESTAMP(6),
    "updatedAt" TIMESTAMP(6),

    CONSTRAINT "ammeter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ammeter_log" (
    "id" VARCHAR NOT NULL,
    "deviceNumber" VARCHAR NOT NULL,
    "action" VARCHAR NOT NULL,
    "factory" VARCHAR,
    "device" VARCHAR,
    "voltage" DOUBLE PRECISION,
    "currents" DOUBLE PRECISION,
    "power" DOUBLE PRECISION,
    "battery" DOUBLE PRECISION,
    "switchState" INTEGER,
    "networkState" INTEGER,
    "lastUpdated" TIMESTAMP(6),
    "requestData" TEXT,
    "responseData" TEXT,
    "statusCode" INTEGER,
    "success" BOOLEAN NOT NULL,
    "errorMessage" TEXT,
    "responseTime" INTEGER,
    "ipAddress" VARCHAR,
    "userAgent" VARCHAR,
    "userId" VARCHAR,
    "organizationId" VARCHAR,
    "createdAt" TIMESTAMP(6),

    CONSTRAINT "ammeter_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "borrow_god" (
    "id" TEXT NOT NULL,
    "godNameId" TEXT NOT NULL,
    "applyName" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "typeId" TEXT NOT NULL DEFAULT '1',
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "borrow_god_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buddhist" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cellphone" TEXT,
    "phone" TEXT,
    "templeNowText" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "buddhist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "family" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "mobile" TEXT,
    "email" TEXT,
    "note" TEXT,
    "postalCode" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "family_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "family_member" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "relation" TEXT,
    "birthday" TIMESTAMP(3),
    "lunarDate" TEXT,
    "gender" TEXT,
    "note" TEXT,
    "mainPerson" TEXT NOT NULL DEFAULT '-1',
    "mailThis" TEXT NOT NULL DEFAULT '-1',
    "isLive" TEXT NOT NULL DEFAULT '1',
    "postcode" TEXT,
    "addr" TEXT,
    "familyId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "family_member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "god_name" (
    "id" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "price" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "order" INTEGER NOT NULL DEFAULT 0,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "god_name_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "member_class" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 0,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "member_class_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mgyear" (
    "id" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "mgyear" TEXT NOT NULL,
    "year" TEXT NOT NULL,
    "nowUse" TEXT NOT NULL DEFAULT '0',
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mgyear_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service1" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 0,
    "nowUse" TEXT NOT NULL DEFAULT '-1',
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service1_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service2" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 0,
    "nowUse" TEXT NOT NULL DEFAULT '-1',
    "service1Id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service2_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "servicing1" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "ordernum" TEXT NOT NULL,
    "year" TEXT NOT NULL,
    "applyDate" TIMESTAMP(3) NOT NULL,
    "applyText" TEXT NOT NULL,
    "cellphone" TEXT,
    "addr" TEXT,
    "printType1Id" TEXT,
    "service1Id" TEXT NOT NULL,
    "service2Id" TEXT,
    "serial" TEXT,
    "accReceivable" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "accReceived" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "accPending" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "payStatus" TEXT,
    "payMethod" TEXT,
    "payCurrency" TEXT NOT NULL DEFAULT 'TWD',
    "receiptNum" TEXT,
    "booksNum" TEXT,
    "payee" TEXT,
    "advisePeople" TEXT,
    "ps" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "servicing1_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "servicing2" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "servicing1Id" TEXT NOT NULL,
    "ordernum" TEXT NOT NULL,
    "year" TEXT NOT NULL,
    "service1Id" TEXT NOT NULL,
    "service2Id" TEXT,
    "serial" TEXT,
    "praytypeId" TEXT,
    "printType1Id" TEXT,
    "printType2Id" TEXT,
    "livename" TEXT,
    "people1" JSONB,
    "passname" TEXT,
    "passname1" TEXT,
    "passname2" TEXT,
    "passname3" TEXT,
    "passname4" TEXT,
    "people0" JSONB,
    "name" TEXT,
    "sexualId" TEXT,
    "sexualText" TEXT,
    "liveYear" INTEGER,
    "boxNum" TEXT,
    "rowTotal" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "bornYear" TEXT,
    "bornMonth" TEXT,
    "bornDay" TEXT,
    "bornTime" TEXT,
    "addr" TEXT,
    "ps" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "servicing2_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "temple" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "description" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "temple_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ammeter_deviceNumber_key" ON "ammeter"("deviceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "mgyear_organizationId_mgyear_key" ON "mgyear"("organizationId", "mgyear");

-- CreateIndex
CREATE UNIQUE INDEX "mgyear_organizationId_year_key" ON "mgyear"("organizationId", "year");

-- CreateIndex
CREATE UNIQUE INDEX "servicing1_organizationId_ordernum_year_key" ON "servicing1"("organizationId", "ordernum", "year");

-- Note: ammeter and ammeter_log tables do not have foreign key constraints in the actual database

-- AddForeignKey
ALTER TABLE "borrow_god" ADD CONSTRAINT "borrow_god_godNameId_fkey" FOREIGN KEY ("godNameId") REFERENCES "god_name"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "borrow_god" ADD CONSTRAINT "borrow_god_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buddhist" ADD CONSTRAINT "buddhist_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "family" ADD CONSTRAINT "family_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "family_member" ADD CONSTRAINT "family_member_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "family_member" ADD CONSTRAINT "family_member_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "god_name" ADD CONSTRAINT "god_name_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_class" ADD CONSTRAINT "member_class_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mgyear" ADD CONSTRAINT "mgyear_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service1" ADD CONSTRAINT "service1_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service2" ADD CONSTRAINT "service2_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service2" ADD CONSTRAINT "service2_service1Id_fkey" FOREIGN KEY ("service1Id") REFERENCES "service1"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "servicing1" ADD CONSTRAINT "servicing1_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "servicing1" ADD CONSTRAINT "servicing1_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "servicing1" ADD CONSTRAINT "servicing1_service1Id_fkey" FOREIGN KEY ("service1Id") REFERENCES "service1"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "servicing1" ADD CONSTRAINT "servicing1_service2Id_fkey" FOREIGN KEY ("service2Id") REFERENCES "service2"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "servicing2" ADD CONSTRAINT "servicing2_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "servicing2" ADD CONSTRAINT "servicing2_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "servicing2" ADD CONSTRAINT "servicing2_service1Id_fkey" FOREIGN KEY ("service1Id") REFERENCES "service1"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "servicing2" ADD CONSTRAINT "servicing2_service2Id_fkey" FOREIGN KEY ("service2Id") REFERENCES "service2"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "servicing2" ADD CONSTRAINT "servicing2_servicing1Id_fkey" FOREIGN KEY ("servicing1Id") REFERENCES "servicing1"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "temple" ADD CONSTRAINT "temple_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
