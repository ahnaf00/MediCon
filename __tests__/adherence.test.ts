import { prescriptionsService } from '../src/services/api/prescriptionsService';

describe('prescriptionsService', () => {
  describe('calculateAdherenceThreshold', () => {
    it('returns GOOD when percentage is >= 80%', () => {
      expect(prescriptionsService.calculateAdherenceThreshold(8, 10)).toBe('GOOD');
      expect(prescriptionsService.calculateAdherenceThreshold(10, 10)).toBe('GOOD');
    });

    it('returns FAIR when percentage is between 50% and 79%', () => {
      expect(prescriptionsService.calculateAdherenceThreshold(5, 10)).toBe('FAIR');
      expect(prescriptionsService.calculateAdherenceThreshold(7, 10)).toBe('FAIR');
    });

    it('returns POOR when percentage is < 50%', () => {
      expect(prescriptionsService.calculateAdherenceThreshold(4, 10)).toBe('POOR');
      expect(prescriptionsService.calculateAdherenceThreshold(0, 10)).toBe('POOR');
    });

    it('returns GOOD when total is 0 to avoid division by zero errors', () => {
      expect(prescriptionsService.calculateAdherenceThreshold(0, 0)).toBe('GOOD');
    });
  });
});
