import Sidebar from "@/components/ui/side-bar";
import SidebarItem from "@/components/ui/side-bar-item";
import { Cog, LayoutDashboard } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-background min-h-screen">
      <div className="flex">
        <Sidebar>
            <SidebarItem icon={<LayoutDashboard size={20} />} label={"Dashboard"} active={false} alert={false}  />
            <SidebarItem icon={<Cog size={20} />} label={"Configurações"} active={false} alert={false}  />
        </Sidebar>
        <main className="">{children}</main>
      </div>
    </div>
  );
}