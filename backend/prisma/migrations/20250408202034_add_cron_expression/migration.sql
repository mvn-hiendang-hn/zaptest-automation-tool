/*
  Warnings:

  - You are about to drop the column `isActive` on the `schedule` table. All the data in the column will be lost.
  - You are about to drop the column `nextRun` on the `schedule` table. All the data in the column will be lost.
  - Added the required column `frequency` to the `Schedule` table without a default value. This is not possible if the table is not empty.
  - Added the required column `timerType` to the `Schedule` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `schedule` DROP COLUMN `isActive`,
    DROP COLUMN `nextRun`,
    ADD COLUMN `active` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `dayTime` VARCHAR(191) NULL,
    ADD COLUMN `frequency` VARCHAR(191) NOT NULL,
    ADD COLUMN `hourInterval` INTEGER NULL,
    ADD COLUMN `minuteInterval` INTEGER NULL,
    ADD COLUMN `recipientEmail` VARCHAR(191) NULL,
    ADD COLUMN `selectedDays` JSON NOT NULL,
    ADD COLUMN `sendEmail` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `timerType` VARCHAR(191) NOT NULL,
    ADD COLUMN `weekDay` VARCHAR(191) NULL,
    ADD COLUMN `weekTime` VARCHAR(191) NULL,
    MODIFY `cronExpression` VARCHAR(191) NULL DEFAULT '';
