"use client";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Props {
  userName: string;
  role: "broker" | "installer" | "admin";
}

export default function TopBar({ userName, role }: Props) {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  const roleLabel = { broker: "Broker", installer: "Instalador", admin: "Admin" }[role];

  return (
    <div className="bg-[#1A2A3A] px-8 h-14 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <span className="text-xl font-extrabold">
          <span className="text-[#FFC107]">SOLAR</span>
          <span className="text-white">WIN</span>
        </span>
        <span className="text-slate-500 text-sm">/ Red de Aliados</span>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-slate-400 text-sm hidden md:block">{userName}</span>
        <div className="w-8 h-8 rounded-full bg-[#FFC107] flex items-center justify-center text-[#1A2A3A] font-bold text-sm">
          {userName[0]?.toUpperCase()}
        </div>
        <span className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded-full">{roleLabel}</span>
        <button onClick={handleLogout}
          className="border border-slate-600 text-slate-400 hover:text-white text-xs px-3 py-1.5 rounded-lg transition">
          Salir
        </button>
      </div>
    </div>
  );
}
