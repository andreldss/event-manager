'use client';

type Props = {
    label: string;
    active: boolean;
    onClick: () => void;
};

export default function Tab({ label, active, onClick }: Props) {
    return (
        <button onClick={onClick} className={[ 'px-4 py-2 rounded-xl text-sm font-medium transition', active ? 'bg-background text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200' ].join(' ')}
>
            {label}
        </button>
    );
}
