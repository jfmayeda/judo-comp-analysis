import { CareerTimelineEvent } from '@/lib/types';
import { formatBeltName } from '@/lib/belt-utils';

/** Vertical belt/start timeline; no fixed-width connectors, wraps on any width. */
export default function CareerTimeline({ events }: { events: CareerTimelineEvent[] }) {
  if (events.length === 0) return null;
  return (
    <ol className="timeline" aria-label="Career timeline">
      {events.map((event, index) => (
        <li key={`${event.date}-${index}`} className="timeline-item">
          <span className="timeline-date">
            {new Date(event.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}
          </span>
          <span className="font-semibold text-strong">
            {event.type === 'judo_start' ? 'Started judo' : event.toBelt ? `Promoted to ${formatBeltName(event.toBelt)}` : event.label}
          </span>
        </li>
      ))}
    </ol>
  );
}
