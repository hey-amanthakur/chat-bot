import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { OpenRouterService } from './services/openrouter.service';
import { RagService } from './services/rag.service';
import { LeadDetectorService } from './services/lead-detector.service';

@Module({
  imports: [HttpModule],
  providers: [OpenRouterService, RagService, LeadDetectorService],
  exports: [OpenRouterService, RagService, LeadDetectorService],
})
export class AiModule {}
