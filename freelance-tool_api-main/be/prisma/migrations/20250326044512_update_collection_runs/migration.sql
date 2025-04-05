/*
  Warnings:

  - You are about to alter the column `week_day` on the `test_schedules` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.

*/
-- DropForeignKey
ALTER TABLE `collection_runs` DROP FOREIGN KEY `collection_runs_test_schedules_id_fkey`;

-- DropIndex
DROP INDEX `collection_runs_test_schedules_id_fkey` ON `collection_runs`;

-- AlterTable
ALTER TABLE `collection_runs` MODIFY `test_schedules_id` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `test_schedules` MODIFY `week_day` INTEGER NULL;

-- AlterTable
ALTER TABLE `user` ADD COLUMN `token` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `collection_runs` ADD CONSTRAINT `collection_runs_test_schedules_id_fkey` FOREIGN KEY (`test_schedules_id`) REFERENCES `test_schedules`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
