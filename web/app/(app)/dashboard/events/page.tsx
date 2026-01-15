import Link from "next/link";

export default function EventsDashboard() {
    return (
        <div className="flex">
            <Link href="/dashboard/events/create" className='w-[132px] py-2 px-4 bg-background hover:opacity-80 active:opacity-100 text-white font-semibold rounded-lg shadow cursor-pointer mb-2'>
                Criar Evento
            </Link>

        </div>
    )
}