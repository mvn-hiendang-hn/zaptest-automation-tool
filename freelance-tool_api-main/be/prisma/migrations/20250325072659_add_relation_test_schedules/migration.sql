/*
  Warnings:

  - You are about to drop the `request` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `request` DROP FOREIGN KEY `Request_userId_fkey`;

-- DropTable
DROP TABLE `request`;

-- CreateTable
CREATE TABLE `test_schedules` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `collection_id` VARCHAR(191) NULL,
    `active` BOOLEAN NOT NULL DEFAULT false,
    `frequency` VARCHAR(191) NOT NULL,
    `selected_days` JSON NOT NULL,
    `timer_type` VARCHAR(191) NOT NULL,
    `minute_interval` INTEGER NOT NULL,
    `hour_interval` INTEGER NULL,
    `day_time` VARCHAR(191) NULL,
    `week_day` VARCHAR(191) NULL,
    `week_time` VARCHAR(191) NULL,
    `send_email` BOOLEAN NOT NULL,
    `recipient_email` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `test_schedules_collection_id_key`(`collection_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `api_tests` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `method` VARCHAR(191) NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `headers` JSON NOT NULL,
    `body` VARCHAR(191) NULL,
    `response` JSON NOT NULL,
    `status_code` INTEGER NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `collection_id` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `api_collections` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `collection_runs` (
    `id` VARCHAR(191) NOT NULL,
    `collection_id` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `total_tests` INTEGER NOT NULL,
    `success_count` INTEGER NOT NULL,
    `failure_count` INTEGER NOT NULL,
    `total_duration` INTEGER NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `test_schedules_id` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `completed_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `test_results` (
    `id` VARCHAR(191) NOT NULL,
    `test_id` VARCHAR(191) NOT NULL,
    `collection_run_id` VARCHAR(191) NOT NULL,
    `status_code` INTEGER NOT NULL,
    `duration` INTEGER NOT NULL,
    `error` VARCHAR(191) NULL,
    `response` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `test_schedules` ADD CONSTRAINT `test_schedules_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `test_schedules` ADD CONSTRAINT `test_schedules_collection_id_fkey` FOREIGN KEY (`collection_id`) REFERENCES `api_collections`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `api_tests` ADD CONSTRAINT `api_tests_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `api_tests` ADD CONSTRAINT `api_tests_collection_id_fkey` FOREIGN KEY (`collection_id`) REFERENCES `api_collections`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `api_collections` ADD CONSTRAINT `api_collections_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `collection_runs` ADD CONSTRAINT `collection_runs_test_schedules_id_fkey` FOREIGN KEY (`test_schedules_id`) REFERENCES `test_schedules`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `collection_runs` ADD CONSTRAINT `collection_runs_collection_id_fkey` FOREIGN KEY (`collection_id`) REFERENCES `api_collections`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `test_results` ADD CONSTRAINT `test_results_test_id_fkey` FOREIGN KEY (`test_id`) REFERENCES `api_tests`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `test_results` ADD CONSTRAINT `test_results_collection_run_id_fkey` FOREIGN KEY (`collection_run_id`) REFERENCES `collection_runs`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
