import { PartialType } from '@nestjs/mapped-types';
import { CreateStorageDto } from './create-storage.dto.js';

export class UpdateStorageDto extends PartialType(CreateStorageDto) { }
