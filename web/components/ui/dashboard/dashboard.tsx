'use client'
import { Cog, LayoutDashboard, PartyPopper } from "lucide-react";
import SidebarItem from "./side-bar-item";
import Sidebar from "./side-bar";

export default function Dashboard({ children }: { children: React.ReactNode }) {

    return (
        <div className="flex min-h-screen w-full">
            <Sidebar>
                <SidebarItem icon={<LayoutDashboard size={20} />} label={"Dashboard"} href={"/dashboard"} alert={false} />
                <SidebarItem icon={<PartyPopper size={20} />} label={"Eventos"} href={"/dashboard/events"} alert={false} />
                <SidebarItem icon={<Cog size={20} />} label={"Configurações"} href={"/dashboard/configuracoes"} alert={false} />
            </Sidebar>
            <main className="flex-1 p-4 pr-8">
                <div className="bg-white rounded-xl h-full justify-center p-6 shadow-sm">
                    {children}
                </div>
            </main>
        </div>

    )
}