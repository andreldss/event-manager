-- DropForeignKey
ALTER TABLE `storagenode` DROP FOREIGN KEY `StorageNode_createdById_fkey`;

-- DropForeignKey
ALTER TABLE `storagenode` DROP FOREIGN KEY `StorageNode_eventId_fkey`;

-- DropForeignKey
ALTER TABLE `storagenode` DROP FOREIGN KEY `StorageNode_parentId_fkey`;

-- DropForeignKey
ALTER TABLE `user_permission` DROP FOREIGN KEY `user_permission_userId_fkey`;

-- AddForeignKey
ALTER TABLE `StorageNode` ADD CONSTRAINT `fk_storage_node_event` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StorageNode` ADD CONSTRAINT `fk_storage_node_parent` FOREIGN KEY (`parentId`) REFERENCES `StorageNode`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StorageNode` ADD CONSTRAINT `fk_storage_node_created_by` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_permission` ADD CONSTRAINT `fk_user_permission_user` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
