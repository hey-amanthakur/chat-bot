import { Injectable } from '@nestjs/common';

@Injectable()
export class LeadsService {
  async createLead(data: any) {
    return { id: 'lead-id', ...data, createdAt: new Date() };
  }
}
