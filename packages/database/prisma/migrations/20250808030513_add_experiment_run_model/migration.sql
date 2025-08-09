-- CreateEnum
CREATE TYPE "ExperimentRunStatus" AS ENUM ('CONFIGURING', 'LABELING', 'COMPLETED');

-- AlterTable
ALTER TABLE "anomaly_event" ADD COLUMN     "experimentRunId" TEXT;

-- CreateTable
CREATE TABLE "experiment_run" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "filteringParameters" JSONB,
    "status" "ExperimentRunStatus" NOT NULL DEFAULT 'CONFIGURING',
    "candidateCount" INTEGER,
    "positiveLabelCount" INTEGER,
    "negativeLabelCount" INTEGER,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "experiment_run_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trained_model" (
    "id" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "modelType" TEXT NOT NULL,
    "modelPath" TEXT NOT NULL,
    "precision" DOUBLE PRECISION NOT NULL,
    "recall" DOUBLE PRECISION NOT NULL,
    "f1Score" DOUBLE PRECISION NOT NULL,
    "trainingDataSummary" JSONB NOT NULL,
    "organizationId" TEXT NOT NULL,
    "experimentRunId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trained_model_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "trained_model_modelName_key" ON "trained_model"("modelName");

-- CreateIndex
CREATE UNIQUE INDEX "trained_model_experimentRunId_key" ON "trained_model"("experimentRunId");

-- AddForeignKey
ALTER TABLE "experiment_run" ADD CONSTRAINT "experiment_run_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anomaly_event" ADD CONSTRAINT "anomaly_event_experimentRunId_fkey" FOREIGN KEY ("experimentRunId") REFERENCES "experiment_run"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trained_model" ADD CONSTRAINT "trained_model_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trained_model" ADD CONSTRAINT "trained_model_experimentRunId_fkey" FOREIGN KEY ("experimentRunId") REFERENCES "experiment_run"("id") ON DELETE SET NULL ON UPDATE CASCADE;
