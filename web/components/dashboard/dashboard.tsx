"use client";

import {
  Banknote,
  ChevronLeft,
  FilePenLine,
  FolderClosed,
  LayoutDashboard,
  PartyPopper,
} from "lucide-react";
import SidebarItem from "./side-bar-item";
import Sidebar from "./side-bar";
import { usePathname, useRouter } from "next/navigation";
import { hasAccess } from "@/lib/has-access";
import { useAuth } from "@/hooks/use-auth";

export default function Dashboard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading } = useAuth();

  const segments = pathname.split("/").filter(Boolean);
  const showBackButton = segments.length >= 3 && segments[0] === "dashboard";

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-700" />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar>
        <SidebarItem
          icon={<LayoutDashboard size={20} />}
          label={"Dashboard"}
          href={"/dashboard"}
          alert={false}
        />

        {hasAccess(user, "eventsAccess", "view") && (
          <SidebarItem
            icon={<PartyPopper size={20} />}
            label={"Eventos"}
            href={"/dashboard/events"}
            alert={false}
          />
        )}

        {hasAccess(user, "financialAccess", "view") && (
          <SidebarItem
            icon={<Banknote size={20} />}
            label={"Financeiro"}
            href={"/dashboard/financial"}
            alert={false}
          />
        )}

        {hasAccess(user, "attachmentsAccess", "view") && (
          <SidebarItem
            icon={<FolderClosed size={20} />}
            label={"Anexos"}
            href={"/dashboard/storage"}
            alert={false}
          />
        )}

        {hasAccess(user, "recordsAccess", "view") && (
          <SidebarItem
            icon={<FilePenLine size={20} />}
            label={"Cadastros"}
            href={"/dashboard/records"}
            alert={false}
          />
        )}
      </Sidebar>

      <main className="flex-1 p-4 pr-8 min-w-0 overflow-hidden">
        <div className="bg-white rounded-xl h-full p-6 shadow-sm flex flex-col min-h-0 overflow-hidden">
          <div className="h-10 flex items-center mb-2 shrink-0">
            {showBackButton ? (
              <button
                onClick={() => router.back()}
                className="text-background hover:opacity-90 transition cursor-pointer"
              >
                <ChevronLeft />
              </button>
            ) : (
              <div className="w-6 h-6" />
            )}
          </div>

          <div className="flex-1 min-h-0 overflow-auto">{children}</div>
        </div>
      </main>
    </div>
  );
}
