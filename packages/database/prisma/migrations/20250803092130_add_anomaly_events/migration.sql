-- CreateEnum
CREATE TYPE "public"."AnomalyEventStatus" AS ENUM ('UNREVIEWED', 'CONFIRMED_POSITIVE', 'REJECTED_NORMAL');

-- CreateTable
CREATE TABLE "public"."anomaly_event" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "meterId" TEXT NOT NULL,
    "eventTimestamp" TIMESTAMP(3) NOT NULL,
    "detectionRule" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "dataWindow" JSONB NOT NULL,
    "status" "public"."AnomalyEventStatus" NOT NULL DEFAULT 'UNREVIEWED',
    "reviewerId" TEXT,
    "reviewTimestamp" TIMESTAMP(3),
    "justificationNotes" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "anomaly_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."anomaly_label" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "anomaly_label_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."event_label_link" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "labelId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_label_link_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "anomaly_event_eventId_key" ON "public"."anomaly_event"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "anomaly_label_organizationId_name_key" ON "public"."anomaly_label"("organizationId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "event_label_link_eventId_labelId_key" ON "public"."event_label_link"("eventId", "labelId");

-- AddForeignKey
ALTER TABLE "public"."anomaly_event" ADD CONSTRAINT "anomaly_event_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."anomaly_label" ADD CONSTRAINT "anomaly_label_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."event_label_link" ADD CONSTRAINT "event_label_link_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."anomaly_event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."event_label_link" ADD CONSTRAINT "event_label_link_labelId_fkey" FOREIGN KEY ("labelId") REFERENCES "public"."anomaly_label"("id") ON DELETE CASCADE ON UPDATE CASCADE;
