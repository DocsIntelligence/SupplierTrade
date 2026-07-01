import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { DomainsService } from '../../platform/domains/domains.service';
import { QcScorerRegistry } from '../../platform/registries/qc-scorer.registry';
import { QcJobStatus } from '@org/utils';

/**
 * Config-driven quality control. The domain's `qc_profile` names the scorer
 * (resolved from QcScorerRegistry) and the inspection criteria; the scorer
 * grades the measured values (DOMAIN-ARCHITECTURE.md §5).
 */
@Injectable()
export class QcService {
  constructor(
    private readonly db: DatabaseService,
    private readonly domains: DomainsService,
    private readonly registry: QcScorerRegistry,
  ) {}

  async score(listingId: string, criteria: Record<string, number>) {
    const listing = await this.db.listing.findUnique({
      where: { id: listingId },
    });
    if (!listing) throw new NotFoundException(`Listing ${listingId} not found`);

    const domain = await this.domains.getConfig(listing.domainKey);
    const profile = domain.qc_profile;
    if (!profile) {
      throw new NotFoundException(
        `Domain "${domain.key}" has no qc_profile configured`,
      );
    }

    const scorer = this.registry.resolve(profile.scorer);
    const result = scorer.score({ criteria, profile });

    return this.db.qcJob.create({
      data: {
        domainKey: listing.domainKey,
        listingId,
        scorer: profile.scorer,
        criteriaResultsJson: result.details as object,
        grade: result.grade,
        status: result.passed ? QcJobStatus.SCORED : QcJobStatus.FAILED,
      },
    });
  }

  list(domainKey: string) {
    return this.db.qcJob.findMany({
      where: { domainKey },
      orderBy: { createdAt: 'desc' },
    });
  }
}
