import { EntityClassOrSchema } from '@nestjs/typeorm/dist/interfaces/entity-class-or-schema.type';
import { readFileSync } from 'fs';
import { DataSourceOptions } from 'typeorm';

/**
 * TypeOrmModule을 `imports:`에 추가할 때 사용할 수 있는 옵션입니다. 예시:
 *
 * ```
 * imports: [
 *   TypeOrmModule.forRoot({ ...dataSourceOptions, entities: [...entities] }),
 *   TypeOrmModule.forFeature(entities),
 * ],
 * ```
 */
export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT) || 5432,
  password: process.env.DB_TEST_PASSWORD,
  username: process.env.DB_TEST_USERNAME,
  database: process.env.DB_TEST_DATABASE,
  synchronize: true,
  logging: false,
  dropSchema: true,
  ssl: {
    ca: readFileSync('global-bundle.pem'),
  },
  extra: {
    ssl: {
      rejectUnauthorized: false,
    },
  },
};

export function createDataSourceOptions(
  entities: EntityClassOrSchema[],
): DataSourceOptions {
  return { ...dataSourceOptions, entities };
}
