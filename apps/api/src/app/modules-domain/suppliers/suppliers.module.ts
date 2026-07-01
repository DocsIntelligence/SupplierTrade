import { Module } from '@nestjs/common';
import { PlatformModule } from '../../platform/platform.module';
import { StorageModule } from '../../storage/storage.module';
import { SuppliersService } from './suppliers.service';
import { SuppliersController } from './suppliers.controller';
import { SupplierDocumentsService } from './supplier-documents.service';
import { SupplierDocumentsController } from './supplier-documents.controller';

@Module({
  imports: [PlatformModule, StorageModule],
  controllers: [SuppliersController, SupplierDocumentsController],
  providers: [SuppliersService, SupplierDocumentsService],
  exports: [SuppliersService],
})
export class SuppliersModule {}
