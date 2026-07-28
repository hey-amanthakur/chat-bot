import { Controller, Post, Body } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { LeadsService } from './leads.service';
import { LeadDto } from './dto/lead.dto';

@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post()
  @Throttle({ leads: { limit: 10, ttl: 60000 } })
  async createLead(@Body() leadDto: LeadDto) {
    return this.leadsService.createLead(leadDto);
  }
}
