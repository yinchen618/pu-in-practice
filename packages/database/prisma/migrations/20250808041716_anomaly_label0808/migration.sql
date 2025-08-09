/*
  Warnings:

  - You are about to drop the column `organizationId` on the `anomaly_event` table. All the data in the column will be lost.
  - You are about to drop the column `organizationId` on the `anomaly_label` table. All the data in the column will be lost.
  - You are about to drop the column `organizationId` on the `experiment_run` table. All the data in the column will be lost.
  - You are about to drop the column `organizationId` on the `trained_model` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name]` on the table `anomaly_label` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "anomaly_event" DROP CONSTRAINT "anomaly_event_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "anomaly_label" DROP CONSTRAINT "anomaly_label_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "experiment_run" DROP CONSTRAINT "experiment_run_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "trained_model" DROP CONSTRAINT "trained_model_organizationId_fkey";

-- DropIndex
DROP INDEX "anomaly_label_organizationId_name_key";

-- AlterTable
ALTER TABLE "anomaly_event" DROP COLUMN "organizationId";

-- AlterTable
ALTER TABLE "anomaly_label" DROP COLUMN "organizationId";

-- AlterTable
ALTER TABLE "experiment_run" DROP COLUMN "organizationId";

-- AlterTable
ALTER TABLE "trained_model" DROP COLUMN "organizationId";

-- CreateIndex
CREATE UNIQUE INDEX "anomaly_label_name_key" ON "anomaly_label"("name");
