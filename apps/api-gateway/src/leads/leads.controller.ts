import { Controller, Post, Body, Get, Param } from '@nestjs/common';
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

  @Get(':clientId')
  async getLeads(@Param('clientId') clientId: string) {
    return this.leadsService.getLeads(clientId);
  }
}
