import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { DatabaseService } from '../src/app/database/database.service';
import { LookupModule } from '../src/app/lookup/lookup.module';

/**
 * Example E2E test pattern for this codebase.
 *
 * - Boots a NestJS test app with ONLY the module under test + its DI deps.
 * - Uses `supertest` to drive real HTTP through the controller stack.
 * - `DatabaseService` is mocked here for hermetic CI runs. In a real e2e suite
 *   you'd point it at a transient SQLite (`DATABASE_URL=file::memory:?cache=shared`)
 *   and run `prisma migrate deploy` in a `beforeAll`.
 *
 * Run a single project's tests with:  pnpm nx run @org/api:test
 */
describe('LookupController (e2e)', () => {
  let app: INestApplication;

  const dbMock = {
    lookupGroup: {
      findMany: jest.fn().mockResolvedValue([
        { id: 'g1', key: 'countries', name: 'Countries', values: [] },
      ]),
      findUnique: jest.fn(),
    },
    lookupValue: { findMany: jest.fn() },
  };

  beforeAll(async () => {
    const mod = await Test.createTestingModule({
      imports: [LookupModule],
    })
      .overrideProvider(DatabaseService)
      .useValue(dbMock)
      .compile();

    app = mod.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /lookups returns public groups', async () => {
    const res = await request(app.getHttpServer()).get('/lookups').expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].key).toBe('countries');
  });

  it('GET /lookups/:key returns 404 when missing', async () => {
    dbMock.lookupGroup.findUnique.mockResolvedValueOnce(null);
    await request(app.getHttpServer()).get('/lookups/unknown').expect(404);
  });
});
