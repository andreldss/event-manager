import LogsPage from "@/components/dashboard/logs/logs-page";
import requireAuth from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AuditLogsRoute() {
  const user = await requireAuth();

  if (!user?.isAdmin) {
    redirect("/dashboard");
  }

  return <LogsPage />;
}
