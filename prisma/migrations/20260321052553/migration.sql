-- AlterTable
ALTER TABLE `applicant` ADD COLUMN `merchant_id` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `job` ADD COLUMN `merchant_id` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `Merchant` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `job` ADD CONSTRAINT `job_merchant_id_fkey` FOREIGN KEY (`merchant_id`) REFERENCES `Merchant`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `applicant` ADD CONSTRAINT `applicant_merchant_id_fkey` FOREIGN KEY (`merchant_id`) REFERENCES `Merchant`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
