import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('check', () => {
    it('should return status ok', () => {
      const result = controller.check();
      expect(result.status).toBe('ok');
    });

    it('should return service name', () => {
      const result = controller.check();
      expect(result.service).toBe('api-gateway');
    });

    it('should return a valid ISO timestamp', () => {
      const result = controller.check();
      expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp);
    });
  });
});
