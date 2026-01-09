'use client';

import { apiFetch } from "@/lib/api";
import { DoorOpen } from "lucide-react";
import { useRouter } from 'next/navigation'

export default function Sidebar({children}: {children: React.ReactNode}) {
    const router = useRouter()
    
    async function Logout() {
        try {
            await apiFetch('/auth/logout', 'POST');
            router.push('/');
        } catch (err) {
            console.error('Falha no logout.');
        } 
    }
    return (
        <aside className="h-screen p-4 rounded-xl">
            <nav className="h-full w-full flex flex-col bg-white mr-10 shadow-sm rounded-xl">
                <div className="p-4 pb-3 mb-3 flex justify-between items-center border-b">
                    <h1 className="text-lg font-bold">event-manager</h1>
                </div>

                <ul className="flex-1 px-3">{children}</ul>

                <div onClick={Logout} className="flex items-center border-t rounded-b-xl justify-center p-3 cursor-pointer bg-white text-red-800 font-bold hover:bg-red-800 hover:text-white active:opacity-80 transition-colors gap-2">
                    <DoorOpen />Sair 
                </div>
            </nav>
        </aside>
    );
}