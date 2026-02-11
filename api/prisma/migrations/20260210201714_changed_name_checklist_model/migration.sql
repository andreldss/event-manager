/*
  Warnings:

  - You are about to drop the `eventchecklist` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `eventchecklist` DROP FOREIGN KEY `EventChecklist_eventId_fkey`;

-- DropTable
DROP TABLE `eventchecklist`;

-- CreateTable
CREATE TABLE `event_checklist` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `eventId` INTEGER NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `done` BOOLEAN NOT NULL DEFAULT false,
    `text` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `event_checklist` ADD CONSTRAINT `event_checklist_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
