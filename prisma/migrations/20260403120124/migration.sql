-- CreateTable
CREATE TABLE `job` (
    `id` VARCHAR(191) NOT NULL,
    `job_title` VARCHAR(191) NOT NULL,
    `job_role` VARCHAR(191) NOT NULL,
    `until_at` DATETIME(3) NOT NULL,
    `description` LONGTEXT NOT NULL,
    `description_sections` JSON NULL,
    `requirement` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `salary_min` INTEGER NOT NULL,
    `salary_max` INTEGER NOT NULL,
    `type_job` ENUM('TEAM_MEMBER', 'REFFERAL') NOT NULL DEFAULT 'TEAM_MEMBER',
    `arrangement` ENUM('ONSITE', 'HYBRID', 'REMOTE') NOT NULL,
    `commitment` ENUM('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'FREELANCE') NOT NULL,
    `is_have_domicile` BOOLEAN NOT NULL DEFAULT false,
    `is_draft` BOOLEAN NOT NULL DEFAULT true,
    `show_salary` BOOLEAN NOT NULL DEFAULT false,
    `is_published` BOOLEAN NOT NULL DEFAULT false,
    `step` INTEGER NOT NULL DEFAULT 0,
    `user_id` VARCHAR(191) NULL,
    `merchant_id` VARCHAR(191) NULL,
    `location_id` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `location` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `maps_url` VARCHAR(191) NOT NULL,
    `type` ENUM('HEAD_OFFICE', 'BRANCH_OFFICE') NOT NULL DEFAULT 'HEAD_OFFICE',
    `address` VARCHAR(191) NOT NULL,
    `district` VARCHAR(191) NOT NULL,
    `province` VARCHAR(191) NOT NULL,
    `country` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `merchant_id` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `role` ENUM('SUPER_ADMIN', 'ADMIN', 'CANDIDATE') NOT NULL DEFAULT 'CANDIDATE',
    `phone` VARCHAR(191) NULL,
    `curiculum_vitae_url` VARCHAR(191) NULL,
    `address` VARCHAR(191) NULL,
    `no_identity` VARCHAR(191) NULL,
    `no_identity_url` VARCHAR(191) NULL,
    `gender` VARCHAR(191) NULL,
    `date_of_birth` DATETIME(3) NULL,
    `photo_url` VARCHAR(191) NULL,
    `portfolio_url` VARCHAR(191) NULL,
    `no_unique` VARCHAR(191) NULL,
    `member_card_url` VARCHAR(191) NULL,
    `team_member_card_url` VARCHAR(191) NULL,
    `job_id` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `user_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `merchant` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `password_reset_token` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `tokenHash` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `password_reset_token_tokenHash_key`(`tokenHash`),
    INDEX `password_reset_token_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `applicant` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `job_id` VARCHAR(191) NOT NULL,
    `merchant_id` VARCHAR(191) NULL,
    `stage` ENUM('NEW_APPLICANT', 'SCREENING', 'INTERVIEW', 'OFFERING', 'HIRED', 'REJECTED', 'WAITING') NULL DEFAULT 'SCREENING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `screeningSubmittedAt` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `history_candidate` (
    `id` VARCHAR(191) NOT NULL,
    `applicant_id` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `stage` ENUM('NEW_APPLICANT', 'SCREENING', 'INTERVIEW', 'OFFERING', 'HIRED', 'REJECTED', 'WAITING') NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `profil_company` (
    `id` VARCHAR(191) NOT NULL,
    `company_name` VARCHAR(191) NOT NULL,
    `merchant_id` VARCHAR(191) NOT NULL,
    `description` LONGTEXT NOT NULL,
    `website_url` VARCHAR(191) NULL,
    `instagram_url` VARCHAR(191) NULL,
    `facebook_url` VARCHAR(191) NULL,
    `linkedin_url` VARCHAR(191) NULL,
    `twitter_url` VARCHAR(191) NULL,
    `logo_url` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `job` ADD CONSTRAINT `job_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `job` ADD CONSTRAINT `job_merchant_id_fkey` FOREIGN KEY (`merchant_id`) REFERENCES `merchant`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `job` ADD CONSTRAINT `job_location_id_fkey` FOREIGN KEY (`location_id`) REFERENCES `location`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `location` ADD CONSTRAINT `location_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `location` ADD CONSTRAINT `location_merchant_id_fkey` FOREIGN KEY (`merchant_id`) REFERENCES `merchant`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user` ADD CONSTRAINT `user_job_id_fkey` FOREIGN KEY (`job_id`) REFERENCES `job`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `password_reset_token` ADD CONSTRAINT `password_reset_token_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `applicant` ADD CONSTRAINT `applicant_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `applicant` ADD CONSTRAINT `applicant_job_id_fkey` FOREIGN KEY (`job_id`) REFERENCES `job`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `applicant` ADD CONSTRAINT `applicant_merchant_id_fkey` FOREIGN KEY (`merchant_id`) REFERENCES `merchant`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `history_candidate` ADD CONSTRAINT `history_candidate_applicant_id_fkey` FOREIGN KEY (`applicant_id`) REFERENCES `applicant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `profil_company` ADD CONSTRAINT `profil_company_merchant_id_fkey` FOREIGN KEY (`merchant_id`) REFERENCES `merchant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
