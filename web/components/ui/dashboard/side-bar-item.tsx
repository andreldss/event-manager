import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SidebarItem({ icon, label, href, alert }: { icon: React.ReactNode, label: string, href: string, alert: boolean }) {
    const pathname = usePathname();
    
    const isRootDashboard = href === "/dashboard";
    const active = isRootDashboard ? pathname === href : pathname === href || pathname.startsWith(href + "/");

    return (
        <Link href={href}>
            <li className={`relative flex text-black gap-3 items-center py-2 px-3 my-1 font-medium rounded-md cursor-pointer hover:bg-background hover:text-white active:opacity-100 transition-colors ${active ? `bg-background text-white` : ``}`}>
                {icon}<span>{label}</span>
            </li>
        </Link>
    );
}