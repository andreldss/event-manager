import Dashboard from "@/components/ui/dashboard/dashboard";
import requireAuth from "@/lib/auth";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {

  await requireAuth();

  return (
    <div className="bg-background min-h-screen">
      <Dashboard>
        {children}
      </Dashboard>
    </div>
  );
}