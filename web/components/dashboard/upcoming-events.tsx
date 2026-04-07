import Link from "next/link";

type UpcomingEvent = {
  id: number;
  name: string;
  date: string | null;
  clientName: string | null;
  location: string | null;
};

type UpcomingEventsCardProps = {
  canViewEvents: boolean;
  events: UpcomingEvent[];
  formatDate: (date: string | null | undefined) => string;
};

export default function UpcomingEventsCard({
  canViewEvents,
  events,
  formatDate,
}: UpcomingEventsCardProps) {
  return (
    <div className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-5">
      <div className="mb-4 shrink-0">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
          Agenda
        </p>
        <h2 className="mt-1 text-base font-semibold text-slate-900">
          Próximos eventos
        </h2>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {!canViewEvents ? (
          <p className="text-sm text-slate-400">—</p>
        ) : events.length === 0 ? (
          <p className="text-sm text-slate-500">
            Nenhum evento próximo encontrado.
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {events.map((event) => (
              <Link
                key={event.id}
                href={`/dashboard/events/${event.id}`}
                className="block py-3 transition first:pt-0 last:pb-0 hover:opacity-80"
              >
                <p className="text-sm font-semibold text-slate-900">
                  {event.name}
                </p>

                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500">
                  {event.clientName && <span>{event.clientName}</span>}

                  {event.clientName && event.date && (
                    <span className="text-slate-300">·</span>
                  )}

                  {event.date && <span>{formatDate(event.date)}</span>}

                  {event.location && (
                    <>
                      <span className="text-slate-300">·</span>
                      <span>{event.location}</span>
                    </>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
