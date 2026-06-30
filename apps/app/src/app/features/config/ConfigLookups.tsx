import { useTranslation } from 'react-i18next';
import { Card } from '@org/ui';
import { AdminLookups } from '../admin/AdminLookups';

export function ConfigLookups() {
  const { t } = useTranslation();
  return (
    <Card className="rounded-xl p-6">
      <h2 className="text-xl font-semibold text-foreground mb-4">
        {t('config.lookups.title', 'Lookups')}
      </h2>
      <AdminLookups />
    </Card>
  );
}

export default ConfigLookups;
