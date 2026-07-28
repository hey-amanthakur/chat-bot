import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RagService } from './ai/services/rag.service';

export const CLIENTS_DATA = 'CLIENTS_DATA';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: CLIENTS_DATA,
      useValue: {},
    },
  ],
  exports: [CLIENTS_DATA],
})
export class ClientsDataModule {}
