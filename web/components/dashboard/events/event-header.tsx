'use client';

type Event = {
    id: string;
    name: string;
    status: string;
    clientName: string | null;
    date: string | null;
    location: string | null;
    type: 'simple' | 'collective';
};

type Props = {
    event: Event;
};

function formatDate(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR');
}

export default function EventHeader({ event }: Props) {
    return (
        <div className="flex flex-col gap-1">

            <h1 className="font-bold text-[28px] leading-tight">
                {event.name}
            </h1>

            <p className="text-sm text-gray-600">
                {event.clientName ?? '-'}
            </p>

            <div className="flex gap-4 text-sm text-gray-700 mt-1">
                <span>Data: {formatDate(event.date ?? '-')}</span>
                <span> - </span>
                <span>Localização: {event.location ?? '-'}</span>
            </div>

        </div>
    );
}
