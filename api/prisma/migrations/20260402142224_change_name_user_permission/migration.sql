/*
  Warnings:

  - You are about to drop the `userpermission` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `userpermission` DROP FOREIGN KEY `UserPermission_userId_fkey`;

-- DropTable
DROP TABLE `userpermission`;

-- CreateTable
CREATE TABLE `user_permission` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `financialAccess` ENUM('none', 'view', 'manage') NOT NULL DEFAULT 'none',
    `recordsAccess` ENUM('none', 'view', 'manage') NOT NULL DEFAULT 'none',
    `attachmentsAccess` ENUM('none', 'view', 'manage') NOT NULL DEFAULT 'none',
    `collectionsAccess` ENUM('none', 'view', 'manage') NOT NULL DEFAULT 'none',
    `eventsAccess` ENUM('none', 'view', 'manage') NOT NULL DEFAULT 'none',
    `usersAccess` ENUM('none', 'view', 'manage') NOT NULL DEFAULT 'none',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `user_permission_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `user_permission` ADD CONSTRAINT `user_permission_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
