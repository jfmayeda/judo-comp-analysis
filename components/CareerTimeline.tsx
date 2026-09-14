import { CareerTimelineEvent } from '@/lib/types';
import { formatBeltName } from '@/lib/belt-utils';

type CareerTimelineProps = {
  events: CareerTimelineEvent[];
};

export default function CareerTimeline({ events }: CareerTimelineProps) {
  if (events.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
        Career Timeline
      </h4>
      <div className="relative">
        <div className="flex items-start gap-4 overflow-x-auto pb-4">
          {events.map((event, index) => (
            <div key={index} className="flex flex-col items-center min-w-[100px]">
              <div className="relative">
                <div className="w-4 h-4 bg-blue-600 rounded-full border-4 border-white shadow-md"></div>
                {index < events.length - 1 && (
                  <div className="absolute top-2 left-4 w-[100px] h-0.5 bg-blue-300"></div>
                )}
              </div>
              <div className="mt-3 text-center">
                <p className="text-xs font-semibold text-gray-900">
                  {new Date(event.date).getFullYear()}
                </p>
                <p className="text-xs text-gray-600 mt-1 max-w-[100px]">
                  {event.type === 'judo_start' ? (
                    'Started Judo'
                  ) : event.toBelt ? (
                    <span className="whitespace-nowrap">{formatBeltName(event.toBelt)}</span>
                  ) : (
                    event.label
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
