'use client';

type Props = {
    label: string;
    value: string;
};

export default function InfoPill({ label, value }: Props) {
    return (
        <div className="bg-white rounded-2xl border shadow-sm p-4">
            <p className="text-xs text-gray-500">{label}</p>
            <p className="text-sm font-semibold text-gray-900 mt-1">{value}</p>
        </div>
    );
}
