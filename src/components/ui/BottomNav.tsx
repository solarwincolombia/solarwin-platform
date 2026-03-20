"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  icon: string;
  label: string;
}

export default function BottomNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  // Show max 5 items on bottom bar
  const visible = items.slice(0, 5);

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#1A2A3A] border-t border-slate-700 flex items-stretch">
      {visible.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition ${
              active ? "text-[#FFC107]" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <span className="text-xl leading-none">{item.icon}</span>
            <span className="text-[10px] font-medium leading-tight truncate max-w-[56px] text-center">
              {item.label}
            </span>
            {active && (
              <span className="absolute bottom-0 w-8 h-0.5 bg-[#FFC107] rounded-t-full" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
