/*
  Warnings:

  - You are about to drop the column `industry` on the `profil_company` table. All the data in the column will be lost.
  - You are about to drop the column `total_employee` on the `profil_company` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `profil_company` DROP COLUMN `industry`,
    DROP COLUMN `total_employee`;
