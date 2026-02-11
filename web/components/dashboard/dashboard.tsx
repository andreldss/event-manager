'use client'

import { ChevronLeft, FilePenLine, LayoutDashboard, PartyPopper } from "lucide-react";
import SidebarItem from "./side-bar-item";
import Sidebar from "./side-bar";
import { usePathname, useRouter } from "next/navigation";

export default function Dashboard({ children }: { children: React.ReactNode }) {

    const pathname = usePathname();
    const router = useRouter();

    const segments = pathname.split("/").filter(Boolean);
    const showBackButton = segments.length >= 3 && segments[0] === "dashboard";

    return (
        <div className="flex h-screen w-full overflow-hidden">
            <Sidebar>
                <SidebarItem icon={<LayoutDashboard size={20} />} label={"Dashboard"} href={"/dashboard"} alert={false} />
                <SidebarItem icon={<PartyPopper size={20} />} label={"Eventos"} href={"/dashboard/events"} alert={false} />
                <SidebarItem icon={<FilePenLine size={20} />} label={"Cadastros"} href={"/dashboard/records"} alert={false} />
            </Sidebar>

            <main className="flex-1 p-4 pr-8 min-w-0 overflow-hidden">
                <div className="bg-white rounded-xl h-full p-6 shadow-sm flex flex-col min-h-0 overflow-hidden">

                    <div className="h-10 flex items-center mb-2 shrink-0">
                        {showBackButton ? (
                            <button onClick={() => router.back()} className="text-background hover:opacity-90 transition cursor-pointer">
                                <ChevronLeft />
                            </button>
                        ) : (
                            <div className="w-6 h-6" />
                        )}
                    </div>

                    <div className="flex-1 min-h-0 overflow-auto">
                        {children}
                    </div>

                </div>
            </main>
        </div>
    )
}
