import { randomBytes, createHash } from 'crypto';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../database/database.service';
import { MailService } from '../mail/mail.service';
import { OrgService } from '../org/org.service';

const TOKEN_BYTES = 32;
const TTL_DAYS = 7;

@Injectable()
export class InvitationsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly mail: MailService,
    private readonly orgs: OrgService,
    private readonly config: ConfigService,
  ) {}

  private hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  async invite(
    orgId: string,
    inviterId: string,
    email: string,
    role = 'member',
  ) {
    await this.orgs.assertPrivileged(orgId, inviterId);

    const org = await this.db.organization.findUnique({ where: { id: orgId } });
    if (!org) throw new NotFoundException('Organization not found');

    const existing = await this.db.membership.findFirst({
      where: { orgId, user: { email } },
    });
    if (existing) throw new ConflictException('User is already a member');

    const pending = await this.db.invitation.findFirst({
      where: { orgId, email, acceptedAt: null, expiresAt: { gt: new Date() } },
    });
    if (pending) throw new ConflictException('An invitation is already pending');

    const raw = randomBytes(TOKEN_BYTES).toString('base64url');
    const tokenHash = this.hash(raw);
    const expiresAt = new Date(Date.now() + TTL_DAYS * 24 * 3600 * 1000);

    const invite = await this.db.invitation.create({
      data: { orgId, email, role, tokenHash, invitedById: inviterId, expiresAt },
    });

    const inviter = await this.db.user.findUnique({ where: { id: inviterId } });
    const frontend = this.config.get<string>('FRONTEND_URL') ?? '';
    const acceptUrl = `${frontend}/invitations/${raw}`;
    await this.mail.enqueue({
      to: email,
      subject: `You're invited to ${org.name}`,
      template: 'invitation',
      templateData: {
        inviterName: inviter?.name ?? 'A teammate',
        orgName: org.name,
        role,
        acceptUrl,
      },
    });

    return { invitation: invite, ok: true as const };
  }

  list(orgId: string) {
    return this.db.invitation.findMany({
      where: { orgId, acceptedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async revoke(orgId: string, id: string, actorId: string) {
    await this.orgs.assertPrivileged(orgId, actorId);
    return this.db.invitation.delete({ where: { id } });
  }

  async accept(rawToken: string, userId: string) {
    const tokenHash = this.hash(rawToken);
    const invite = await this.db.invitation.findUnique({ where: { tokenHash } });
    if (!invite) throw new NotFoundException('Invitation not found');
    if (invite.acceptedAt) throw new BadRequestException('Already accepted');
    if (invite.expiresAt < new Date()) {
      throw new BadRequestException('Invitation has expired');
    }

    const user = await this.db.user.findUnique({ where: { id: userId } });
    if (!user || user.email !== invite.email) {
      throw new BadRequestException(
        'Accept the invitation while signed in as the invited email',
      );
    }

    return this.db.$transaction([
      this.db.membership.upsert({
        where: { userId_orgId: { userId, orgId: invite.orgId } },
        create: { userId, orgId: invite.orgId, role: invite.role },
        update: { role: invite.role },
      }),
      this.db.invitation.update({
        where: { id: invite.id },
        data: { acceptedAt: new Date() },
      }),
    ]);
  }
}
