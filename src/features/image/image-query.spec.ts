import { DataSource } from 'typeorm';
import { Test } from '@nestjs/testing';

describe('TypeORM Query Counting', () => {
  let dataSource: DataSource;
  let queryCount = 0;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [],
    }).compile();

    dataSource = moduleRef.get<DataSource>(DataSource);

    // Listen to all queries executed
    dataSource.driver.connection.on('query', () => {
      queryCount++;
    });
  });

  beforeEach(() => {
    queryCount = 0; // Reset the count before each test
  });

  it('should execute expected number of queries', async () => {
    // Perform the database operation
    await dataSource.getRepository(SomeEntity).find();

    console.log(`Executed SQL Queries: ${queryCount}`);
    expect(queryCount).toBeGreaterThan(0); // Replace with expected count
  });

  afterAll(async () => {
    await dataSource.destroy();
  });
});