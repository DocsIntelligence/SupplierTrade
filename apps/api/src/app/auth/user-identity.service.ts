import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class UserIdentityService {
  constructor(private readonly db: DatabaseService) {}

  async listForUser(userId: string) {
    return this.db.userIdentity.findMany({
      where: { userId },
      select: { id: true, provider: true, email: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async unlinkForUser(userId: string, identityId: string) {
    const identity = await this.db.userIdentity.findFirst({
      where: { id: identityId, userId },
    });
    if (!identity) throw new NotFoundException('Identity not found');

    // Check user still has another way to sign in
    const [otherCount, secrets] = await Promise.all([
      this.db.userIdentity.count({
        where: { userId, NOT: { id: identityId } },
      }),
      this.db.secrets.findUnique({
        where: { userId },
        select: { password: true },
      }),
    ]);

    if (!secrets?.password && otherCount === 0) {
      throw new BadRequestException(
        'Cannot unlink last auth method. Set a password first.',
      );
    }

    await this.db.userIdentity.delete({ where: { id: identityId } });
    return { message: 'Provider disconnected' };
  }
}
