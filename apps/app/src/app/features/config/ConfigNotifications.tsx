import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Card, Input, Textarea } from '@org/ui';
import { toast } from 'sonner';
import { apiSend } from './_api';

export function ConfigNotifications() {
  const { t } = useTranslation();
  const [form, setForm] = useState({ title: '', body: '', link: '', type: 'broadcast' });
  const [busy, setBusy] = useState(false);

  const send = async () => {
    if (!form.title.trim() || !form.body.trim()) {
      toast.error(t('config.notifications.required', 'Title and body are required'));
      return;
    }
    setBusy(true);
    try {
      const r = await apiSend<{ sent: number }>('/notifications/broadcast', 'POST', form);
      toast.success(
        t('config.notifications.sent', 'Broadcast sent to {{n}} users', { n: r.sent }),
      );
      setForm({ title: '', body: '', link: '', type: 'broadcast' });
    } catch {
      toast.error(t('config.notifications.failed', 'Failed to send broadcast'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-foreground">
          {t('config.notifications.title', 'Broadcast notification')}
        </h2>
        <p className="text-foreground/60 mt-1">
          {t(
            'config.notifications.subtitle',
            'Sends an in-app notification + Web Push to every user.',
          )}
        </p>
      </div>
      <Card className="rounded-xl p-6 space-y-3 max-w-2xl">
        <Input
          placeholder={t('config.notifications.titlePlaceholder', 'Title')}
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <Textarea
          rows={4}
          placeholder={t('config.notifications.bodyPlaceholder', 'Body…')}
          value={form.body}
          onChange={(e) => setForm({ ...form, body: e.target.value })}
        />
        <Input
          placeholder={t('config.notifications.linkPlaceholder', 'Link (optional, e.g. /dashboard)')}
          value={form.link}
          onChange={(e) => setForm({ ...form, link: e.target.value })}
        />
        <Button onClick={send} disabled={busy}>
          {busy ? t('common.sending', 'Sending…') : t('config.notifications.send', 'Send broadcast')}
        </Button>
      </Card>
    </div>
  );
}

export default ConfigNotifications;
