/*
  Warnings:

  - Made the column `code` on table `customer` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "customer" ALTER COLUMN "code" SET NOT NULL;
