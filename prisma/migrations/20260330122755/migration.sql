/*
  Warnings:

  - You are about to drop the column `mbti_test_id` on the `applicant` table. All the data in the column will be lost.
  - You are about to drop the column `screeningBaseId` on the `applicant` table. All the data in the column will be lost.
  - You are about to drop the `answer_question_screening` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `answer_selected_option` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `applicant_employee_setup` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `attachment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `card_template` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `consultant` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `contract` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `contract_template` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `conversation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `employee_setup` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `employee_setup_answer` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `employee_setup_question` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `evaluator` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `evaluator_assignment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `evaluator_review` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `matriks_answer` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `matriks_base_question` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `matriks_column` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `matriks_question_option` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `mbti_test` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `message` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `message_read` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `note_interview` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `offering_contract` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `participant` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `position` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `procedure_document` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `question_base_screening` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `question_matriks` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `question_option` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `question_screening` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `referral_link` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `schedule_day` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `schedule_evaluator` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `schedule_hired` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `schedule_interview` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `schedule_time` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `team_member_card_template` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_interest_tag` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `answer_question_screening` DROP FOREIGN KEY `answer_question_screening_applicantId_fkey`;

-- DropForeignKey
ALTER TABLE `answer_question_screening` DROP FOREIGN KEY `answer_question_screening_questionId_fkey`;

-- DropForeignKey
ALTER TABLE `answer_selected_option` DROP FOREIGN KEY `answer_selected_option_answerId_fkey`;

-- DropForeignKey
ALTER TABLE `answer_selected_option` DROP FOREIGN KEY `answer_selected_option_optionId_fkey`;

-- DropForeignKey
ALTER TABLE `applicant` DROP FOREIGN KEY `applicant_mbti_test_id_fkey`;

-- DropForeignKey
ALTER TABLE `applicant` DROP FOREIGN KEY `applicant_screeningBaseId_fkey`;

-- DropForeignKey
ALTER TABLE `applicant_employee_setup` DROP FOREIGN KEY `applicant_employee_setup_applicantId_fkey`;

-- DropForeignKey
ALTER TABLE `applicant_employee_setup` DROP FOREIGN KEY `applicant_employee_setup_employeeSetupId_fkey`;

-- DropForeignKey
ALTER TABLE `attachment` DROP FOREIGN KEY `attachment_messageId_fkey`;

-- DropForeignKey
ALTER TABLE `contract` DROP FOREIGN KEY `contract_templateId_fkey`;

-- DropForeignKey
ALTER TABLE `conversation` DROP FOREIGN KEY `conversation_applicantId_fkey`;

-- DropForeignKey
ALTER TABLE `employee_setup_answer` DROP FOREIGN KEY `employee_setup_answer_employeeSetupQuestionId_fkey`;

-- DropForeignKey
ALTER TABLE `employee_setup_question` DROP FOREIGN KEY `employee_setup_question_employeeSetupId_fkey`;

-- DropForeignKey
ALTER TABLE `evaluator_assignment` DROP FOREIGN KEY `evaluator_assignment_applicant_id_fkey`;

-- DropForeignKey
ALTER TABLE `evaluator_assignment` DROP FOREIGN KEY `evaluator_assignment_base_matriks_id_fkey`;

-- DropForeignKey
ALTER TABLE `evaluator_assignment` DROP FOREIGN KEY `evaluator_assignment_evaluatorId_fkey`;

-- DropForeignKey
ALTER TABLE `evaluator_review` DROP FOREIGN KEY `evaluator_review_assignmentId_fkey`;

-- DropForeignKey
ALTER TABLE `evaluator_review` DROP FOREIGN KEY `evaluator_review_questionId_fkey`;

-- DropForeignKey
ALTER TABLE `matriks_answer` DROP FOREIGN KEY `matriks_answer_applicantId_fkey`;

-- DropForeignKey
ALTER TABLE `matriks_answer` DROP FOREIGN KEY `matriks_answer_questionId_fkey`;

-- DropForeignKey
ALTER TABLE `matriks_column` DROP FOREIGN KEY `matriks_column_baseId_fkey`;

-- DropForeignKey
ALTER TABLE `matriks_question_option` DROP FOREIGN KEY `matriks_question_option_questionId_fkey`;

-- DropForeignKey
ALTER TABLE `message` DROP FOREIGN KEY `message_conversationId_fkey`;

-- DropForeignKey
ALTER TABLE `message` DROP FOREIGN KEY `message_senderId_fkey`;

-- DropForeignKey
ALTER TABLE `message` DROP FOREIGN KEY `message_userId_fkey`;

-- DropForeignKey
ALTER TABLE `message_read` DROP FOREIGN KEY `message_read_messageId_fkey`;

-- DropForeignKey
ALTER TABLE `message_read` DROP FOREIGN KEY `message_read_userId_fkey`;

-- DropForeignKey
ALTER TABLE `note_interview` DROP FOREIGN KEY `note_interview_applicant_id_fkey`;

-- DropForeignKey
ALTER TABLE `offering_contract` DROP FOREIGN KEY `offering_contract_applicant_id_fkey`;

-- DropForeignKey
ALTER TABLE `participant` DROP FOREIGN KEY `participant_conversationId_fkey`;

-- DropForeignKey
ALTER TABLE `participant` DROP FOREIGN KEY `participant_userId_fkey`;

-- DropForeignKey
ALTER TABLE `question_matriks` DROP FOREIGN KEY `question_matriks_baseId_fkey`;

-- DropForeignKey
ALTER TABLE `question_option` DROP FOREIGN KEY `question_option_questionId_fkey`;

-- DropForeignKey
ALTER TABLE `question_screening` DROP FOREIGN KEY `question_screening_baseId_fkey`;

-- DropForeignKey
ALTER TABLE `referral_link` DROP FOREIGN KEY `referral_link_job_id_fkey`;

-- DropForeignKey
ALTER TABLE `schedule_day` DROP FOREIGN KEY `schedule_day_schedule_id_fkey`;

-- DropForeignKey
ALTER TABLE `schedule_evaluator` DROP FOREIGN KEY `schedule_evaluator_evaluator_id_fkey`;

-- DropForeignKey
ALTER TABLE `schedule_hired` DROP FOREIGN KEY `schedule_hired_applicant_id_fkey`;

-- DropForeignKey
ALTER TABLE `schedule_hired` DROP FOREIGN KEY `schedule_hired_location_id_fkey`;

-- DropForeignKey
ALTER TABLE `schedule_interview` DROP FOREIGN KEY `schedule_interview_applicant_id_fkey`;

-- DropForeignKey
ALTER TABLE `schedule_interview` DROP FOREIGN KEY `schedule_interview_schedule_id_fkey`;

-- DropForeignKey
ALTER TABLE `schedule_time` DROP FOREIGN KEY `schedule_time_day_id_fkey`;

-- DropForeignKey
ALTER TABLE `user_interest_tag` DROP FOREIGN KEY `user_interest_tag_user_id_fkey`;

-- DropIndex
DROP INDEX `applicant_mbti_test_id_key` ON `applicant`;

-- DropIndex
DROP INDEX `applicant_screeningBaseId_fkey` ON `applicant`;

-- AlterTable
ALTER TABLE `applicant` DROP COLUMN `mbti_test_id`,
    DROP COLUMN `screeningBaseId`;

-- DropTable
DROP TABLE `answer_question_screening`;

-- DropTable
DROP TABLE `answer_selected_option`;

-- DropTable
DROP TABLE `applicant_employee_setup`;

-- DropTable
DROP TABLE `attachment`;

-- DropTable
DROP TABLE `card_template`;

-- DropTable
DROP TABLE `consultant`;

-- DropTable
DROP TABLE `contract`;

-- DropTable
DROP TABLE `contract_template`;

-- DropTable
DROP TABLE `conversation`;

-- DropTable
DROP TABLE `employee_setup`;

-- DropTable
DROP TABLE `employee_setup_answer`;

-- DropTable
DROP TABLE `employee_setup_question`;

-- DropTable
DROP TABLE `evaluator`;

-- DropTable
DROP TABLE `evaluator_assignment`;

-- DropTable
DROP TABLE `evaluator_review`;

-- DropTable
DROP TABLE `matriks_answer`;

-- DropTable
DROP TABLE `matriks_base_question`;

-- DropTable
DROP TABLE `matriks_column`;

-- DropTable
DROP TABLE `matriks_question_option`;

-- DropTable
DROP TABLE `mbti_test`;

-- DropTable
DROP TABLE `message`;

-- DropTable
DROP TABLE `message_read`;

-- DropTable
DROP TABLE `note_interview`;

-- DropTable
DROP TABLE `offering_contract`;

-- DropTable
DROP TABLE `participant`;

-- DropTable
DROP TABLE `position`;

-- DropTable
DROP TABLE `procedure_document`;

-- DropTable
DROP TABLE `question_base_screening`;

-- DropTable
DROP TABLE `question_matriks`;

-- DropTable
DROP TABLE `question_option`;

-- DropTable
DROP TABLE `question_screening`;

-- DropTable
DROP TABLE `referral_link`;

-- DropTable
DROP TABLE `schedule_day`;

-- DropTable
DROP TABLE `schedule_evaluator`;

-- DropTable
DROP TABLE `schedule_hired`;

-- DropTable
DROP TABLE `schedule_interview`;

-- DropTable
DROP TABLE `schedule_time`;

-- DropTable
DROP TABLE `team_member_card_template`;

-- DropTable
DROP TABLE `user_interest_tag`;
