/*
  Warnings:

  - You are about to drop the column `user_id` on the `profil_company` table. All the data in the column will be lost.
  - Added the required column `merchant_id` to the `profil_company` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `profil_company` DROP FOREIGN KEY `profil_company_user_id_fkey`;

-- DropIndex
DROP INDEX `profil_company_user_id_fkey` ON `profil_company`;

-- AlterTable
ALTER TABLE `location` ADD COLUMN `merchant_id` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `profil_company` DROP COLUMN `user_id`,
    ADD COLUMN `merchant_id` VARCHAR(191) NOT NULL;

-- AddForeignKey
ALTER TABLE `location` ADD CONSTRAINT `location_merchant_id_fkey` FOREIGN KEY (`merchant_id`) REFERENCES `merchant`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `profil_company` ADD CONSTRAINT `profil_company_merchant_id_fkey` FOREIGN KEY (`merchant_id`) REFERENCES `merchant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
