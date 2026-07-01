import { Module } from '@nestjs/common';
import { JsonSchemaService } from './json-schema.service';

@Module({
  providers: [JsonSchemaService],
  exports: [JsonSchemaService],
})
export class SchemaModule {}
