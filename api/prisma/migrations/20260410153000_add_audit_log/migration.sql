CREATE TABLE `audit_log` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `module` VARCHAR(64) NOT NULL,
    `action` VARCHAR(64) NOT NULL,
    `entityType` VARCHAR(64) NULL,
    `entityId` INTEGER NULL,
    `actorType` ENUM('user', 'public_share', 'system') NOT NULL DEFAULT 'user',
    `actorUserId` INTEGER NULL,
    `publicShareId` INTEGER NULL,
    `eventId` INTEGER NULL,
    `ip` VARCHAR(64) NULL,
    `userAgent` VARCHAR(255) NULL,
    `beforeData` JSON NULL,
    `afterData` JSON NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `audit_log_module_action_idx`(`module`, `action`),
    INDEX `audit_log_entityType_entityId_idx`(`entityType`, `entityId`),
    INDEX `audit_log_actorUserId_idx`(`actorUserId`),
    INDEX `audit_log_publicShareId_idx`(`publicShareId`),
    INDEX `audit_log_eventId_idx`(`eventId`),
    INDEX `audit_log_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `audit_log`
    ADD CONSTRAINT `fk_audit_log_actor_user`
    FOREIGN KEY (`actorUserId`) REFERENCES `User`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;
