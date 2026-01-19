'use client'
import { ChevronLeft, Cog, FilePenLine, LayoutDashboard, PartyPopper } from "lucide-react";
import SidebarItem from "./side-bar-item";
import Sidebar from "./side-bar";
import { usePathname, useRouter } from "next/navigation";

export default function Dashboard({ children }: { children: React.ReactNode }) {

    const pathname = usePathname();
    const router = useRouter();

    const segments = pathname.split("/").filter(Boolean);
    const showBackButton = segments.length >= 3 && segments[0] === "dashboard";

    return (
        <div className="flex min-h-screen w-full">
            <Sidebar>
                <SidebarItem icon={<LayoutDashboard size={20} />} label={"Dashboard"} href={"/dashboard"} alert={false} />
                <SidebarItem icon={<PartyPopper size={20} />} label={"Eventos"} href={"/dashboard/events"} alert={false} />
                <SidebarItem icon={<FilePenLine size={20} />} label={"Cadastros"} href={"/dashboard/records"} alert={false} />
            </Sidebar>
            <main className="flex-1 p-4 pr-8">
                <div className="bg-white rounded-xl h-full justify-center p-6 shadow-sm">
                    {showBackButton && (
                        <button onClick={() => router.back()} className="top-6 left-6text-background hover:opacity-90 transition cursor-pointer">
                            <ChevronLeft />
                        </button>
                    )}
                    {children}
                </div>
            </main>
        </div>

    )
}