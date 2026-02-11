/*
  Warnings:

  - You are about to drop the `financialcategory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `financialtransaction` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `financialtransaction` DROP FOREIGN KEY `FinancialTransaction_categoryId_fkey`;

-- DropForeignKey
ALTER TABLE `financialtransaction` DROP FOREIGN KEY `FinancialTransaction_eventId_fkey`;

-- DropTable
DROP TABLE `financialcategory`;

-- DropTable
DROP TABLE `financialtransaction`;

-- CreateTable
CREATE TABLE `financial_category` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `financial_category_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `financial_transaction` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `eventId` INTEGER NOT NULL,
    `type` ENUM('income', 'expense') NOT NULL,
    `status` ENUM('planned', 'settled') NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `categoryId` INTEGER NULL,
    `paidAt` DATETIME(3) NULL,
    `sourceType` ENUM('manual', 'collection') NOT NULL DEFAULT 'manual',
    `sourceId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `financial_transaction_eventId_idx`(`eventId`),
    INDEX `financial_transaction_categoryId_idx`(`categoryId`),
    INDEX `financial_transaction_type_idx`(`type`),
    INDEX `financial_transaction_status_idx`(`status`),
    UNIQUE INDEX `financial_transaction_sourceType_sourceId_key`(`sourceType`, `sourceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `event_payment_months` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `eventId` INTEGER NOT NULL,
    `month` VARCHAR(7) NOT NULL,

    INDEX `event_payment_months_eventId_idx`(`eventId`),
    INDEX `event_payment_months_month_idx`(`month`),
    UNIQUE INDEX `event_payment_months_eventId_month_key`(`eventId`, `month`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `financial_transaction` ADD CONSTRAINT `financial_transaction_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `financial_category`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `financial_transaction` ADD CONSTRAINT `financial_transaction_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `event_payment_months` ADD CONSTRAINT `event_payment_months_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
