/*
  Warnings:

  - You are about to drop the `Merchant` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `applicant` DROP FOREIGN KEY `applicant_merchant_id_fkey`;

-- DropForeignKey
ALTER TABLE `job` DROP FOREIGN KEY `job_merchant_id_fkey`;

-- DropIndex
DROP INDEX `applicant_merchant_id_fkey` ON `applicant`;

-- DropIndex
DROP INDEX `job_merchant_id_fkey` ON `job`;

-- DropTable
DROP TABLE `Merchant`;

-- CreateTable
CREATE TABLE `merchant` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `job` ADD CONSTRAINT `job_merchant_id_fkey` FOREIGN KEY (`merchant_id`) REFERENCES `merchant`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `applicant` ADD CONSTRAINT `applicant_merchant_id_fkey` FOREIGN KEY (`merchant_id`) REFERENCES `merchant`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
