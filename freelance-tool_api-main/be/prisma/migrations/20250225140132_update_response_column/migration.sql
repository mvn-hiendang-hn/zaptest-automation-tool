/*
  Warnings:

  - Made the column `response` on table `request` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `request` MODIFY `response` JSON NOT NULL;
