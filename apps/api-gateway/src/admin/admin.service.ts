import { Injectable } from '@nestjs/common';

@Injectable()
export class AdminService {
  async getClients() {
    return { clients: [] };
  }

  async createClient(data: any) {
    return { id: 'new-client-id', ...data };
  }

  async updateClient(id: string, data: any) {
    return { id, ...data };
  }
}
