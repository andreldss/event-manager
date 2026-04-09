import { Module } from '@nestjs/common';
import { StorageController } from './storage.controller.js';
import { StorageService } from './storage.service.js';
import { StoragePublicController } from './public-share/public-share.controller.js';
import { StoragePublicService } from './public-share/public-share.service.js';

@Module({
  controllers: [StorageController, StoragePublicController],
  providers: [StorageService, StoragePublicService],
  exports: [StorageService],
})
export class StorageModule {}
