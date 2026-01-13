'use client'
import { Cog, LayoutDashboard, PartyPopper } from "lucide-react";
import SidebarItem from "./side-bar-item";
import Sidebar from "./side-bar";
import { usePathname } from "next/navigation";

export default function Dashboard({ children }: { children: React.ReactNode }) {

    const pathname = usePathname();

    return (
        <div className="flex">
            <Sidebar>
                <SidebarItem icon={<LayoutDashboard size={20} />} label={"Dashboard"} active={pathname === "/dashboard"} alert={false} />
                <SidebarItem icon={<PartyPopper size={20} />} label={"Eventos"} active={pathname.startsWith("/dashboard/events")} alert={false} />
                <SidebarItem icon={<Cog size={20} />} label={"Configurações"} active={pathname.startsWith("/dashboard/configuracoes")} alert={false} />
            </Sidebar>
            <main className="">{children}</main>
        </div>

    )
}