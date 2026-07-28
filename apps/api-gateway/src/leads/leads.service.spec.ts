import { Test, TestingModule } from '@nestjs/testing';
import { LeadsService } from './leads.service';
import * as fs from 'fs';
import * as path from 'path';

jest.mock('fs');

describe('LeadsService', () => {
  let service: LeadsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.mkdirSync as jest.Mock).mockReturnValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [LeadsService],
    }).compile();

    service = module.get<LeadsService>(LeadsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createLead', () => {
    it('should create and save a lead', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      (fs.writeFileSync as jest.Mock).mockReturnValue(undefined);

      const lead = await service.createLead({
        clientId: 'client1',
        name: 'John Doe',
        email: 'john@example.com',
        reason: 'Interested in services',
        conversationId: 'conv1',
      });

      expect(lead.clientId).toBe('client1');
      expect(lead.name).toBe('John Doe');
      expect(lead.email).toBe('john@example.com');
      expect(lead.id).toContain('lead-');
      expect(lead.createdAt).toBeDefined();
      expect(fs.writeFileSync).toHaveBeenCalled();
    });

    it('should append to existing leads file', async () => {
      const existingLeads = [{ id: 'lead-1', clientId: 'client1' }];
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(existingLeads));
      (fs.writeFileSync as jest.Mock).mockReturnValue(undefined);

      await service.createLead({
        clientId: 'client1',
        name: 'Jane Doe',
        reason: 'Question',
        conversationId: 'conv2',
      });

      const writeCall = (fs.writeFileSync as jest.Mock).mock.calls[0];
      const savedLeads = JSON.parse(writeCall[1]);
      expect(savedLeads).toHaveLength(2);
      expect(savedLeads[0].id).toBe('lead-1');
      expect(savedLeads[1].name).toBe('Jane Doe');
    });

    it('should generate unique lead IDs', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      (fs.writeFileSync as jest.Mock).mockReturnValue(undefined);

      const lead1 = await service.createLead({
        clientId: 'c1', name: 'A', reason: 'r', conversationId: 'conv1',
      });
      const lead2 = await service.createLead({
        clientId: 'c1', name: 'B', reason: 'r', conversationId: 'conv2',
      });

      expect(lead1.id).not.toBe(lead2.id);
    });

    it('should handle optional email and phone', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      (fs.writeFileSync as jest.Mock).mockReturnValue(undefined);

      const lead = await service.createLead({
        clientId: 'c1',
        name: 'No Contact',
        reason: 'r',
        conversationId: 'conv1',
      });

      expect(lead.email).toBeUndefined();
      expect(lead.phone).toBeUndefined();
    });
  });

  describe('getLeads', () => {
    it('should return leads for a client', async () => {
      const leads = [
        { id: 'lead-1', clientId: 'client1', name: 'John' },
        { id: 'lead-2', clientId: 'client1', name: 'Jane' },
      ];
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(leads));

      const result = await service.getLeads('client1');
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('John');
    });

    it('should return empty array when no leads file exists', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const result = await service.getLeads('no-leads-client');
      expect(result).toEqual([]);
    });
  });
});
