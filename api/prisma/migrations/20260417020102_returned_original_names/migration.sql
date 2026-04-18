/*
  Warnings:

  - You are about to drop the `client` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `collection` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `event` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `event_payment_month` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `participant` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `storage_node` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `audit_log` DROP FOREIGN KEY `fk_audit_log_actor_user`;

-- DropForeignKey
ALTER TABLE `collection` DROP FOREIGN KEY `collection_participantId_fkey`;

-- DropForeignKey
ALTER TABLE `event` DROP FOREIGN KEY `event_clientId_fkey`;

-- DropForeignKey
ALTER TABLE `event_checklist` DROP FOREIGN KEY `event_checklist_eventId_fkey`;

-- DropForeignKey
ALTER TABLE `event_group` DROP FOREIGN KEY `event_group_eventId_fkey`;

-- DropForeignKey
ALTER TABLE `event_payment_month` DROP FOREIGN KEY `event_payment_month_eventId_fkey`;

-- DropForeignKey
ALTER TABLE `financial_transaction` DROP FOREIGN KEY `financial_transaction_eventId_fkey`;

-- DropForeignKey
ALTER TABLE `participant` DROP FOREIGN KEY `participant_eventId_fkey`;

-- DropForeignKey
ALTER TABLE `participant` DROP FOREIGN KEY `participant_groupId_fkey`;

-- DropForeignKey
ALTER TABLE `storage_node` DROP FOREIGN KEY `fk_storage_node_created_by`;

-- DropForeignKey
ALTER TABLE `storage_node` DROP FOREIGN KEY `fk_storage_node_event`;

-- DropForeignKey
ALTER TABLE `storage_node` DROP FOREIGN KEY `fk_storage_node_parent`;

-- DropForeignKey
ALTER TABLE `storage_node_public_share` DROP FOREIGN KEY `fk_storage_public_share_node`;

-- DropForeignKey
ALTER TABLE `user_permission` DROP FOREIGN KEY `fk_user_permission_user`;

-- DropIndex
DROP INDEX `event_checklist_eventId_fkey` ON `event_checklist`;

-- DropIndex
DROP INDEX `event_group_eventId_fkey` ON `event_group`;

-- DropTable
DROP TABLE `client`;

-- DropTable
DROP TABLE `collection`;

-- DropTable
DROP TABLE `event`;

-- DropTable
DROP TABLE `event_payment_month`;

-- DropTable
DROP TABLE `participant`;

-- DropTable
DROP TABLE `storage_node`;

-- DropTable
DROP TABLE `user`;

-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `isAdmin` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Client` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `notes` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Event` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `location` VARCHAR(191) NOT NULL,
    `notes` VARCHAR(191) NULL,
    `clientId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `collection_participant` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `eventId` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `groupId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `collection_participant_eventId_idx`(`eventId`),
    INDEX `collection_participant_eventId_groupId_idx`(`eventId`, `groupId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Collection` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `participantId` INTEGER NOT NULL,
    `referenceMonth` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Collection_referenceMonth_idx`(`referenceMonth`),
    INDEX `Collection_participantId_idx`(`participantId`),
    UNIQUE INDEX `Collection_participantId_referenceMonth_key`(`participantId`, `referenceMonth`),
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

-- CreateTable
CREATE TABLE `StorageNode` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `eventId` INTEGER NOT NULL,
    `parentId` INTEGER NULL,
    `type` ENUM('folder', 'file') NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `mimeType` VARCHAR(128) NULL,
    `size` INTEGER NULL,
    `storageKey` VARCHAR(191) NULL,
    `thumbKey` VARCHAR(191) NULL,
    `createdById` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `StorageNode_eventId_parentId_createdAt_idx`(`eventId`, `parentId`, `createdAt`),
    INDEX `StorageNode_eventId_parentId_name_idx`(`eventId`, `parentId`, `name`),
    INDEX `StorageNode_eventId_type_idx`(`eventId`, `type`),
    UNIQUE INDEX `StorageNode_eventId_parentId_name_key`(`eventId`, `parentId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Event` ADD CONSTRAINT `Event_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `collection_participant` ADD CONSTRAINT `collection_participant_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `collection_participant` ADD CONSTRAINT `collection_participant_groupId_fkey` FOREIGN KEY (`groupId`) REFERENCES `event_group`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Collection` ADD CONSTRAINT `Collection_participantId_fkey` FOREIGN KEY (`participantId`) REFERENCES `collection_participant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `financial_transaction` ADD CONSTRAINT `financial_transaction_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `event_payment_months` ADD CONSTRAINT `event_payment_months_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `event_checklist` ADD CONSTRAINT `event_checklist_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `event_group` ADD CONSTRAINT `event_group_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StorageNode` ADD CONSTRAINT `fk_storage_node_event` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StorageNode` ADD CONSTRAINT `fk_storage_node_parent` FOREIGN KEY (`parentId`) REFERENCES `StorageNode`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StorageNode` ADD CONSTRAINT `fk_storage_node_created_by` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_permission` ADD CONSTRAINT `fk_user_permission_user` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `storage_node_public_share` ADD CONSTRAINT `fk_storage_public_share_node` FOREIGN KEY (`nodeId`) REFERENCES `StorageNode`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_log` ADD CONSTRAINT `fk_audit_log_actor_user` FOREIGN KEY (`actorUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
