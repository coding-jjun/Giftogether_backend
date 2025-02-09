import { Funding } from './funding.entity';
import { FundTheme } from 'src/enums/fund-theme.enum';
import { truncateTime } from 'src/util/truncate-tiime';

describe('Funding Entity', () => {
  let funding: Funding;

  beforeEach(() => {
    funding = new Funding(
      { userId: 1 } as any, // Mock User
      'Test Funding',
      'This is a test funding',
      1000,
      new Date(),
      FundTheme.Birthday,
      '123 Test Road',
      'Apt 456',
      '12345',
      'John Doe',
      '123-456-7890',
    );
  });

  describe('isClosed', () => {
    it('should return true if the funding is closed', () => {
      const pastDate = new Date('1000-01-01');
      funding.endAt = truncateTime(pastDate);

      expect(funding.isClosed()).toBe(true);
    });

    it('should return false if the funding is ongoing', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      funding.endAt = truncateTime(futureDate);

      expect(funding.isClosed()).toBe(false);
    });
  });
});
