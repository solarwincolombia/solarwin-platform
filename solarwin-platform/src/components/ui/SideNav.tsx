"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  icon: string;
  label: string;
}

export default function SideNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <aside className="w-56 bg-white border-r border-slate-100 min-h-[calc(100vh-56px)] py-6 flex-shrink-0">
      {items.map(item => {
        const active = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link key={item.href} href={item.href}
            className={`flex items-center gap-3 px-6 py-2.5 text-sm transition border-l-[3px] ${
              active
                ? "border-[#FFC107] bg-blue-50 text-[#1A2A3A] font-semibold"
                : "border-transparent text-slate-500 hover:text-[#1A2A3A] hover:bg-slate-50"
            }`}>
            <span className="text-lg">{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </aside>
  );
}
