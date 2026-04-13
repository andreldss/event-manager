ALTER TABLE `storage_node_public_share`
    ADD COLUMN `allowUpload` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `allowCreateFolders` BOOLEAN NOT NULL DEFAULT false;
