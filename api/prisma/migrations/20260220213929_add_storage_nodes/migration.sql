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
ALTER TABLE `StorageNode` ADD CONSTRAINT `StorageNode_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StorageNode` ADD CONSTRAINT `StorageNode_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `StorageNode`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StorageNode` ADD CONSTRAINT `StorageNode_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
