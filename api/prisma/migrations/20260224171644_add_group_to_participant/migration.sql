-- AlterTable
ALTER TABLE `collection_participant` ADD COLUMN `groupId` INTEGER NULL;

-- CreateIndex
CREATE INDEX `collection_participant_eventId_groupId_idx` ON `collection_participant`(`eventId`, `groupId`);

-- AddForeignKey
ALTER TABLE `collection_participant` ADD CONSTRAINT `collection_participant_groupId_fkey` FOREIGN KEY (`groupId`) REFERENCES `event_group`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
