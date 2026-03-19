import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TopBar from "@/components/ui/TopBar";
import SideNav from "@/components/ui/SideNav";

const NAV_ITEMS = [
  { href: "/broker/dashboard", icon: "🏠", label: "Inicio" },
  { href: "/broker/quotes", icon: "📋", label: "Mis Cotizaciones" },
  { href: "/broker/quoter", icon: "⚡", label: "Nueva Cotización" },
  { href: "/broker/commissions", icon: "💰", label: "Mis Comisiones" },
  { href: "/broker/resources", icon: "📁", label: "Materiales" },
];

export default async function BrokerLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "broker") redirect("/installer/dashboard");

  return (
    <div className="font-sans">
      <TopBar userName={profile.full_name} role="broker" />
      <div className="flex">
        <SideNav items={NAV_ITEMS} />
        <main className="flex-1 bg-[#F5F7FA] min-h-[calc(100vh-56px)] p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
