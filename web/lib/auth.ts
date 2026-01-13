import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function requireAuth() {
    const cookieStore = await cookies();

    const cookieHeader = cookieStore
        .getAll()
        .map(c => `${c.name}=${c.value}`)
        .join("; ");

    const res = await fetch(`http://localhost:3001/auth/me`, {
        headers: { Cookie: cookieHeader },
        cache: "no-store",
    });

    if (res.status === 401) redirect("/login");
    if (!res.ok) redirect("/login");

    return res.json();
}