"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Profile = {
  full_name: string;
  email: string;
  phone: string | null;
  city: string | null;
  company_name: string | null;
  trade_name: string | null;
  logo_url: string | null;
  avatar_url: string | null;
};

export default function BrokerSettingsPage() {
  const [profile, setProfile] = useState<Profile>({
    full_name: "",
    email: "",
    phone: "",
    city: "",
    company_name: "",
    trade_name: "",
    logo_url: "",
    avatar_url: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await (supabase as any)
      .from("profiles")
      .select("full_name, email, phone, city, company_name, trade_name, logo_url, avatar_url")
      .eq("id", user.id)
      .single();

    if (data) {
      setProfile({
        full_name: data.full_name ?? "",
        email: data.email ?? user.email ?? "",
        phone: data.phone ?? "",
        city: data.city ?? "",
        company_name: data.company_name ?? "",
        trade_name: data.trade_name ?? "",
        logo_url: data.logo_url ?? "",
        avatar_url: data.avatar_url ?? "",
      });
    }
    setLoading(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error: updateError } = await (supabase as any)
      .from("profiles")
      .update({
        full_name: profile.full_name,
        phone: profile.phone || null,
        city: profile.city || null,
        company_name: profile.company_name || null,
        trade_name: profile.trade_name || null,
        logo_url: profile.logo_url || null,
        avatar_url: profile.avatar_url || null,
      })
      .eq("id", user.id);

    setSaving(false);
    if (updateError) {
      setError("Error guardando los cambios. Inténtalo de nuevo.");
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  }

  const inp = (field: keyof Profile) => ({
    value: profile[field] ?? "",
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setProfile((p) => ({ ...p, [field]: e.target.value })),
  });

  const displayName = profile.trade_name || profile.company_name || "SOLARWIN ENERGÍAS SOLARES S.A.S";
  const hasLogo = profile.logo_url && profile.logo_url.trim().length > 0;
  const hasAvatar = profile.avatar_url && profile.avatar_url.trim().length > 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400 text-sm animate-pulse">Cargando perfil…</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-7">
        <h2 className="text-2xl font-bold text-[#1A2A3A]">Mi perfil y marca</h2>
        <p className="text-slate-500 text-sm mt-1">
          Tu nombre y logo aparecerán en las propuestas que generes para tus clientes.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Personal info */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-bold text-[#1A2A3A] text-sm mb-4 uppercase tracking-wide">
            Información personal
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-500 font-medium block mb-1">
                Nombre completo
              </label>
              <input
                {...inp("full_name")}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFC107]"
                required
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 font-medium block mb-1">Email</label>
              <input
                value={profile.email}
                readOnly
                className="w-full border border-slate-100 rounded-lg px-3 py-2 text-sm bg-slate-50 text-slate-400 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 font-medium block mb-1">Teléfono</label>
              <input
                {...inp("phone")}
                placeholder="+57 300 000 0000"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFC107]"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 font-medium block mb-1">Ciudad</label>
              <input
                {...inp("city")}
                placeholder="Bogotá"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFC107]"
              />
            </div>
          </div>
        </div>

        {/* Branding */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-bold text-[#1A2A3A] text-sm mb-1 uppercase tracking-wide">
            Marca / empresa
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Personaliza cómo aparece tu empresa en las propuestas. Si no configuras nada, se
            usará la marca Solarwin por defecto.
          </p>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-slate-500 font-medium block mb-1">
                Razón social
              </label>
              <input
                {...inp("company_name")}
                placeholder="Dejar vacío para usar marca Solarwin"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFC107]"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 font-medium block mb-1">
                Nombre comercial{" "}
                <span className="text-[#FFC107] font-semibold">(aparece en propuestas)</span>
              </label>
              <input
                {...inp("trade_name")}
                placeholder="Dejar vacío para usar marca Solarwin"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFC107]"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 font-medium block mb-1">
                URL del logo de empresa{" "}
                <span className="text-slate-400">(recomendado 200×60px, fondo transparente)</span>
              </label>
              <input
                {...inp("logo_url")}
                placeholder="https://tuempresa.com/logo.png"
                type="url"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFC107]"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 font-medium block mb-1">
                URL de tu foto de perfil{" "}
                <span className="text-[#FFC107] font-semibold">(aparece en propuestas junto a tu nombre)</span>
              </label>
              <input
                {...inp("avatar_url")}
                placeholder="https://tuempresa.com/foto.jpg"
                type="url"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFC107]"
              />
              <p className="text-xs text-slate-400 mt-1">
                Sube tu foto a{" "}
                <a
                  href="https://imgur.com/upload"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 underline"
                >
                  Imgur
                </a>{" "}
                o cualquier host de imágenes y pega el link directo aquí.
              </p>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-bold text-[#1A2A3A] text-sm mb-3 uppercase tracking-wide">
            Vista previa · Firma en propuestas
          </h3>
          <div className="bg-[#1A2A3A] rounded-xl px-6 py-4 flex items-center justify-between">
            {/* Left: company brand */}
            <div className="flex items-center gap-3">
              {hasLogo ? (
                <img
                  src={profile.logo_url!}
                  alt="Logo"
                  className="h-10 w-auto object-contain rounded"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <div className="w-10 h-10 bg-[#FFC107] rounded-full flex items-center justify-center text-xl font-bold text-[#1A2A3A]">
                  ☀
                </div>
              )}
              <div>
                <p className="text-white font-black text-base leading-none">{displayName}</p>
                <p className="text-slate-400 text-xs mt-0.5">
                  Especialistas en soluciones fotovoltaicas
                </p>
              </div>
            </div>
            {/* Right: broker contact */}
            <div className="flex items-center gap-3">
              {hasAvatar ? (
                <img
                  src={profile.avatar_url!}
                  alt="Foto"
                  className="w-12 h-12 rounded-full object-cover border-2 border-[#FFC107] shrink-0"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-slate-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
                  {(profile.full_name || "?")[0].toUpperCase()}
                </div>
              )}
              <div className="text-right">
                <p className="text-white font-semibold text-sm">
                  {profile.full_name || "Tu nombre"}
                </p>
                <p className="text-slate-400 text-xs mt-0.5">Asesor comercial</p>
                <p className="text-slate-300 text-xs mt-1">{profile.email}</p>
                {profile.phone && (
                  <p className="text-slate-300 text-xs">{profile.phone}</p>
                )}
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Así se verá el pie de página en las propuestas PDF que generes.
          </p>
        </div>

        {/* Save button */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="bg-[#1A2A3A] text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-[#243447] transition text-sm disabled:opacity-60"
          >
            {saving ? "Guardando…" : "Guardar cambios"}
          </button>
          {saved && (
            <span className="text-green-600 text-sm font-semibold">✓ Cambios guardados</span>
          )}
          {error && <span className="text-red-500 text-sm">{error}</span>}
        </div>
      </form>
    </div>
  );
}
