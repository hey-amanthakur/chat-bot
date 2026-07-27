import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('clients')
  @Throttle('default', { limit: 30, ttl: 60000 })
  async getClients() {
    return this.adminService.getClients();
  }

  @Post('clients')
  @Throttle('default', { limit: 10, ttl: 3600000 })
  async createClient(@Body() createClientDto: CreateClientDto) {
    return this.adminService.createClient(createClientDto);
  }

  @Put('clients/:id')
  @Throttle('default', { limit: 10, ttl: 3600000 })
  async updateClient(@Param('id') id: string, @Body() updateClientDto: UpdateClientDto) {
    return this.adminService.updateClient(id, updateClientDto);
  }
}
