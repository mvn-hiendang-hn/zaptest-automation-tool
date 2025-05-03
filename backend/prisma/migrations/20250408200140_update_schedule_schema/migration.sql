/*
  Warnings:

  - You are about to drop the column `active` on the `schedule` table. All the data in the column will be lost.
  - You are about to drop the column `dayTime` on the `schedule` table. All the data in the column will be lost.
  - You are about to drop the column `frequency` on the `schedule` table. All the data in the column will be lost.
  - You are about to drop the column `hourInterval` on the `schedule` table. All the data in the column will be lost.
  - You are about to drop the column `minuteInterval` on the `schedule` table. All the data in the column will be lost.
  - You are about to drop the column `recipientEmail` on the `schedule` table. All the data in the column will be lost.
  - You are about to drop the column `selectedDays` on the `schedule` table. All the data in the column will be lost.
  - You are about to drop the column `sendEmail` on the `schedule` table. All the data in the column will be lost.
  - You are about to drop the column `timerType` on the `schedule` table. All the data in the column will be lost.
  - You are about to drop the column `weekDay` on the `schedule` table. All the data in the column will be lost.
  - You are about to drop the column `weekTime` on the `schedule` table. All the data in the column will be lost.
  - Added the required column `cronExpression` to the `Schedule` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `schedule` DROP COLUMN `active`,
    DROP COLUMN `dayTime`,
    DROP COLUMN `frequency`,
    DROP COLUMN `hourInterval`,
    DROP COLUMN `minuteInterval`,
    DROP COLUMN `recipientEmail`,
    DROP COLUMN `selectedDays`,
    DROP COLUMN `sendEmail`,
    DROP COLUMN `timerType`,
    DROP COLUMN `weekDay`,
    DROP COLUMN `weekTime`,
    ADD COLUMN `cronExpression` VARCHAR(191) NOT NULL,
    ADD COLUMN `isActive` BOOLEAN NOT NULL DEFAULT true;
