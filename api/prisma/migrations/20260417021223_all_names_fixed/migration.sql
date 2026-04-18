/*
  Warnings:

  - You are about to drop the `Client` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Collection` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Event` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `StorageNode` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `Collection` DROP FOREIGN KEY `Collection_participantId_fkey`;

-- DropForeignKey
ALTER TABLE `Event` DROP FOREIGN KEY `Event_clientId_fkey`;

-- DropForeignKey
ALTER TABLE `StorageNode` DROP FOREIGN KEY `fk_storage_node_created_by`;

-- DropForeignKey
ALTER TABLE `StorageNode` DROP FOREIGN KEY `fk_storage_node_event`;

-- DropForeignKey
ALTER TABLE `StorageNode` DROP FOREIGN KEY `fk_storage_node_parent`;

-- DropForeignKey
ALTER TABLE `audit_log` DROP FOREIGN KEY `fk_audit_log_actor_user`;

-- DropForeignKey
ALTER TABLE `collection_participant` DROP FOREIGN KEY `collection_participant_eventId_fkey`;

-- DropForeignKey
ALTER TABLE `event_checklist` DROP FOREIGN KEY `event_checklist_eventId_fkey`;

-- DropForeignKey
ALTER TABLE `event_group` DROP FOREIGN KEY `event_group_eventId_fkey`;

-- DropForeignKey
ALTER TABLE `event_payment_months` DROP FOREIGN KEY `event_payment_months_eventId_fkey`;

-- DropForeignKey
ALTER TABLE `financial_transaction` DROP FOREIGN KEY `financial_transaction_eventId_fkey`;

-- DropForeignKey
ALTER TABLE `storage_node_public_share` DROP FOREIGN KEY `fk_storage_public_share_node`;

-- DropForeignKey
ALTER TABLE `user_permission` DROP FOREIGN KEY `fk_user_permission_user`;

-- DropIndex
DROP INDEX `event_checklist_eventId_fkey` ON `event_checklist`;

-- DropIndex
DROP INDEX `event_group_eventId_fkey` ON `event_group`;

-- DropTable
DROP TABLE `Client`;

-- DropTable
DROP TABLE `Collection`;

-- DropTable
DROP TABLE `Event`;

-- DropTable
DROP TABLE `StorageNode`;

-- DropTable
DROP TABLE `User`;

-- CreateTable
CREATE TABLE `user` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `isAdmin` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `user_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `client` (
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
CREATE TABLE `event` (
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
CREATE TABLE `collection` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `participantId` INTEGER NOT NULL,
    `referenceMonth` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `collection_referenceMonth_idx`(`referenceMonth`),
    INDEX `collection_participantId_idx`(`participantId`),
    UNIQUE INDEX `collection_participantId_referenceMonth_key`(`participantId`, `referenceMonth`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `storage_node` (
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

    INDEX `storage_node_eventId_parentId_createdAt_idx`(`eventId`, `parentId`, `createdAt`),
    INDEX `storage_node_eventId_parentId_name_idx`(`eventId`, `parentId`, `name`),
    INDEX `storage_node_eventId_type_idx`(`eventId`, `type`),
    UNIQUE INDEX `storage_node_eventId_parentId_name_key`(`eventId`, `parentId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `event` ADD CONSTRAINT `event_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `client`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `collection_participant` ADD CONSTRAINT `collection_participant_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `collection` ADD CONSTRAINT `collection_participantId_fkey` FOREIGN KEY (`participantId`) REFERENCES `collection_participant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `financial_transaction` ADD CONSTRAINT `financial_transaction_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `event_payment_months` ADD CONSTRAINT `event_payment_months_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `event_checklist` ADD CONSTRAINT `event_checklist_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `event_group` ADD CONSTRAINT `event_group_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `storage_node` ADD CONSTRAINT `fk_storage_node_event` FOREIGN KEY (`eventId`) REFERENCES `event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `storage_node` ADD CONSTRAINT `fk_storage_node_parent` FOREIGN KEY (`parentId`) REFERENCES `storage_node`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `storage_node` ADD CONSTRAINT `fk_storage_node_created_by` FOREIGN KEY (`createdById`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_permission` ADD CONSTRAINT `fk_user_permission_user` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `storage_node_public_share` ADD CONSTRAINT `fk_storage_public_share_node` FOREIGN KEY (`nodeId`) REFERENCES `storage_node`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_log` ADD CONSTRAINT `fk_audit_log_actor_user` FOREIGN KEY (`actorUserId`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
