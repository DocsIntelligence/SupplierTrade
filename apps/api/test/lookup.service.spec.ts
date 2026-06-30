import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../src/app/database/database.service';
import { LookupService } from '../src/app/lookup/lookup.service';

/**
 * Example UNIT test pattern for this codebase.
 *
 * - Pure-function style: mock `DatabaseService` with jest fakes.
 * - One `it()` per behavior; assert observable output (return value or thrown error).
 * - No real database. For DB-touching tests see `lookup.e2e-spec.ts`.
 */
describe('LookupService (unit)', () => {
  const dbMock = {
    lookupGroup: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  let service: LookupService;

  beforeEach(async () => {
    jest.resetAllMocks();
    const mod = await Test.createTestingModule({
      providers: [
        LookupService,
        { provide: DatabaseService, useValue: dbMock },
      ],
    }).compile();
    service = mod.get(LookupService);
  });

  describe('getAllPublic', () => {
    it('returns only public, active groups sorted by name', async () => {
      dbMock.lookupGroup.findMany.mockResolvedValue([
        { id: '1', key: 'a', name: 'A', values: [] },
      ]);
      const out = await service.getAllPublic();
      expect(out).toHaveLength(1);
      expect(dbMock.lookupGroup.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isPublic: true },
          orderBy: { name: 'asc' },
        }),
      );
    });
  });

  describe('getByKey', () => {
    it('returns the group when found', async () => {
      dbMock.lookupGroup.findUnique.mockResolvedValue({
        id: '1',
        key: 'countries',
        name: 'Countries',
        values: [],
      });
      const out = await service.getByKey('countries');
      expect(out.key).toBe('countries');
    });

    it('throws NotFoundException when the key is unknown', async () => {
      dbMock.lookupGroup.findUnique.mockResolvedValue(null);
      await expect(service.getByKey('nope')).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
