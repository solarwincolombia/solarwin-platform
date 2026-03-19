"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError("Correo o contraseña incorrectos");
      setLoading(false);
      return;
    }

    // Leer rol del perfil
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    const role = profile && profile.role ? profile.role : "broker";
    router.push(role === "installer" ? "/installer/dashboard" : "/broker/dashboard");
  }

  return (
    <div className="min-h-screen bg-[#1A2A3A] flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-xl">
        <div className="text-center mb-8">
          <div className="text-3xl font-extrabold mb-1">
            <span className="text-[#FFC107]">SOLAR</span>
            <span className="text-[#1A2A3A]">WIN</span>
          </div>
          <p className="text-slate-500 text-sm">Red de Aliados — Ingresa a tu cuenta</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Correo electrónico</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFC107]"
              placeholder="tu@correo.com" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Contraseña</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
              className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFC107]"
              placeholder="••••••••" />
          </div>

          {error && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full bg-[#1A2A3A] text-white font-bold py-3 rounded-lg hover:bg-[#243447] transition disabled:opacity-60">
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-6">
          ¿No tienes cuenta?{" "}
          <Link href="/register" className="text-[#1A2A3A] font-semibold hover:underline">Regístrate aquí</Link>
        </p>
      </div>
    </div>
  );
}
