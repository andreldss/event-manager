import { Injectable } from '@nestjs/common';
import { CreateStorageDto } from './dto/create-storage.dto.js';
import { UpdateStorageDto } from './dto/update-storage.dto.js';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class StorageService {

  constructor(private readonly prisma: PrismaService) { }

  create(createStorageDto: CreateStorageDto) {
    return 'This action adds a new storage';
  }

  findAll() {
    return `This action returns all storage`;
  }

  findOne(id: number) {
    return `This action returns a #${id} storage`;
  }

  update(id: number, updateStorageDto: UpdateStorageDto) {
    return `This action updates a #${id} storage`;
  }

  remove(id: number) {
    return `This action removes a #${id} storage`;
  }
}
