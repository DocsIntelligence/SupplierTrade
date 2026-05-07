import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class LookupService {
  constructor(private readonly db: DatabaseService) {}

  /** Get all public lookup groups with their values */
  async getAllPublic() {
    return this.db.lookupGroup.findMany({
      where: { isPublic: true },
      include: {
        values: {
          where: { isActive: true },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  /** Get a single lookup group by key */
  async getByKey(key: string) {
    const group = await this.db.lookupGroup.findUnique({
      where: { key },
      include: {
        values: {
          where: { isActive: true },
          orderBy: { order: 'asc' },
        },
      },
    });
    if (!group) throw new NotFoundException(`Lookup group "${key}" not found`);
    return group;
  }

  /** Admin: get all groups (including non-public) */
  async getAll() {
    return this.db.lookupGroup.findMany({
      include: { values: { orderBy: { order: 'asc' } } },
      orderBy: { name: 'asc' },
    });
  }

  /** Admin: create a new lookup group */
  async createGroup(data: {
    key: string;
    name: string;
    description?: string;
    isPublic?: boolean;
  }) {
    return this.db.lookupGroup.create({ data });
  }

  /** Admin: add a value to a group */
  async addValue(
    groupId: string,
    data: { label: string; value: string; order?: number },
  ) {
    return this.db.lookupValue.create({
      data: { ...data, groupId },
    });
  }

  /** Admin: update a value */
  async updateValue(
    id: string,
    data: {
      label?: string;
      value?: string;
      order?: number;
      isActive?: boolean;
    },
  ) {
    return this.db.lookupValue.update({ where: { id }, data });
  }

  /** Admin: delete a value */
  async deleteValue(id: string) {
    await this.db.lookupValue.delete({ where: { id } });
    return { message: 'Value deleted' };
  }
}
