export default function SidebarItem({icon, label, active, alert}: {icon: React.ReactNode, label: string, active: boolean, alert: boolean}) {
    return (
        <li className="relative flex text-black gap-1 items-center py-2 px-3 my-1 font-medium rounded-md cursor-pointer hover:bg-background hover:text-white active:opacity-100 transition-colors">
            {icon}<span>{label}</span>
        </li>
    );
}