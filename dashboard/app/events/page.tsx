import { api } from '@/lib/api';
import EventsTable from '@/components/EventsTable';

export default async function EventsPage() {
  const events = await api.events();

  const errorCount = events.filter((e) => e.level === 'ERROR').length;
  const warnCount = events.filter((e) => e.level === 'WARN').length;

  return (
    <>
      <div style={{ marginBottom: '1.25rem' }}>
        <h1 style={{ fontSize: 18, fontWeight: 500, marginBottom: 4 }}>События</h1>
        <p style={{ fontSize: 13, color: 'var(--muted)' }}>
          Все события VPN-агента &mdash; {events.length} записей,&nbsp;
          <span style={{ color: 'var(--error-text)' }}>{errorCount} ошибок</span>,&nbsp;
          <span style={{ color: 'var(--warn-text)' }}>{warnCount} предупреждений</span>
        </p>
      </div>
      <EventsTable events={events} />
    </>
  );
}
