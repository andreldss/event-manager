-- CreateTable
CREATE TABLE `storage_node_public_share` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nodeId` INTEGER NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `allowDownload` BOOLEAN NOT NULL DEFAULT true,
    `expiresAt` DATETIME(3) NULL,
    `revokedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `storage_node_public_share_token_key`(`token`),
    INDEX `storage_node_public_share_nodeId_idx`(`nodeId`),
    INDEX `storage_node_public_share_token_idx`(`token`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `storage_node_public_share` ADD CONSTRAINT `fk_storage_public_share_node` FOREIGN KEY (`nodeId`) REFERENCES `StorageNode`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
