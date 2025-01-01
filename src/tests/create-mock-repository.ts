import { Repository, SelectQueryBuilder } from 'typeorm';
import { createMock } from './create-mock';
import { EntityClassOrSchema } from '@nestjs/typeorm/dist/interfaces/entity-class-or-schema.type';
import { Provider } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';

type MockRepository<T> = jest.Mocked<T> & {
  createQueryBuilder: jest.Mocked<SelectQueryBuilder<T>>;
};

function createMockSelectQueryBuilder<T>(): jest.Mocked<SelectQueryBuilder<T>> {
  return {
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orWhere: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    setParameter: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]), // Example of mocked result
    getOne: jest.fn().mockResolvedValue(null),
    execute: jest.fn().mockResolvedValue({}),
    // Include other methods as needed
  } as unknown as jest.Mocked<SelectQueryBuilder<T>>;
}

/**
 * 아래 함수는 Repository<Entity>를 모킹하기 위해
 * 사용됩니다. 즉, 단위테스트를 위해 실제 RDS에 데이터를 저장하는
 * 것이 아닌, MockRepository에 호출만 합니다.
 *
 * 만약 실제로 데이터를 넣고 그 결과를 재가공해야 할 필요가 있다면
 * 아래 두가지 방법 중 하나를 사용할 수 있습니다:
 *
 * 1. TypeOrmModule을 `imports:`에 추가한다. 테스트 DB에 직접
 *    데이터를 CRUD한다. (src/tests/data-source-options.ts 참조)
 * 2. 사용하고자 하는 메서드만 따로 구현한 MockRepository를 구현,
 *    `useValue:` 자리에 따로 작성한다.
 */
export function createMockRepository<T>(
  cls: new (...args: any[]) => T,
): MockRepository<T> {
  const mock = createMock(cls) as MockRepository<T>;
  mock.createQueryBuilder = jest.fn(createMockSelectQueryBuilder) as any;

  return mock;
}

export const createMockProvider = (entity: EntityClassOrSchema): Provider => ({
  provide: getRepositoryToken(entity),
  useValue: createMockRepository(Repository<typeof entity>),
});
