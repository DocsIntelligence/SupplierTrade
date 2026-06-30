import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export interface CreateOrgInput {
  name: string;
  slug?: string;
}

export interface UpdateMemberRoleInput {
  role: string;
}

const PRIVILEGED = new Set(['owner', 'admin']);

@Injectable()
export class OrgService {
  constructor(private readonly db: DatabaseService) {}

  // ─── orgs ──────────────────────────────────────────────────────

  async create(creatorId: string, input: CreateOrgInput) {
    const slug = (input.slug ?? input.name).toLowerCase().replace(/[^a-z0-9]+/g, '-');
    if (!slug) throw new BadRequestException('A name or slug is required');

    return this.db.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: { name: input.name, slug },
      });
      await tx.membership.create({
        data: { userId: creatorId, orgId: org.id, role: 'owner' },
      });
      return org;
    });
  }

  listMine(userId: string) {
    return this.db.organization.findMany({
      where: { memberships: { some: { userId } } },
      include: {
        memberships: { where: { userId }, select: { role: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getBySlug(slug: string) {
    const org = await this.db.organization.findUnique({ where: { slug } });
    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }

  // ─── members ───────────────────────────────────────────────────

  async listMembers(orgId: string) {
    return this.db.membership.findMany({
      where: { orgId },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async updateMemberRole(
    orgId: string,
    targetUserId: string,
    actorId: string,
    role: string,
  ) {
    await this.assertPrivileged(orgId, actorId);
    const target = await this.db.membership.findUnique({
      where: { userId_orgId: { userId: targetUserId, orgId } },
    });
    if (!target) throw new NotFoundException('Member not found');
    if (target.role === 'owner' && role !== 'owner') {
      const ownerCount = await this.db.membership.count({
        where: { orgId, role: 'owner' },
      });
      if (ownerCount <= 1) {
        throw new BadRequestException('Cannot demote the only owner');
      }
    }
    return this.db.membership.update({
      where: { userId_orgId: { userId: targetUserId, orgId } },
      data: { role },
    });
  }

  async removeMember(orgId: string, targetUserId: string, actorId: string) {
    await this.assertPrivileged(orgId, actorId);
    const target = await this.db.membership.findUnique({
      where: { userId_orgId: { userId: targetUserId, orgId } },
    });
    if (!target) throw new NotFoundException('Member not found');
    if (target.role === 'owner') {
      const ownerCount = await this.db.membership.count({
        where: { orgId, role: 'owner' },
      });
      if (ownerCount <= 1) {
        throw new BadRequestException('Cannot remove the only owner');
      }
    }
    return this.db.membership.delete({
      where: { userId_orgId: { userId: targetUserId, orgId } },
    });
  }

  // ─── helpers ───────────────────────────────────────────────────

  async assertMember(orgId: string, userId: string) {
    const m = await this.db.membership.findUnique({
      where: { userId_orgId: { userId, orgId } },
    });
    if (!m) throw new ForbiddenException('Not a member of this organization');
    return m;
  }

  async assertPrivileged(orgId: string, userId: string) {
    const m = await this.assertMember(orgId, userId);
    if (!PRIVILEGED.has(m.role)) {
      throw new ForbiddenException('Insufficient role for this organization');
    }
    return m;
  }
}
