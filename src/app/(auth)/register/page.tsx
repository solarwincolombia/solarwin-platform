"use client";
import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const defaultRole = params.get("role") === "installer" ? "installer" : "broker";

  const [role, setRole] = useState<"broker" | "installer">(defaultRole as "broker" | "installer");
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", city: "", companyName: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();

    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          full_name: form.fullName,
          role,
          phone: form.phone,
          city: form.city,
          company_name: form.companyName,
        },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push(role === "installer" ? "/installer/dashboard" : "/broker/dashboard");
  }

  const field = (label: string, key: keyof typeof form, type = "text", placeholder = "") => (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-1">{label}</label>
      <input type={type} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} required
        className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFC107]"
        placeholder={placeholder} />
    </div>
  );

  return (
    <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-xl">
      <div className="text-center mb-6">
        <div className="text-3xl font-extrabold mb-1">
          <span className="text-[#FFC107]">SOLAR</span>
          <span className="text-[#1A2A3A]">WIN</span>
        </div>
        <p className="text-slate-500 text-sm">Crea tu cuenta de aliado</p>
      </div>

      {/* Role selector */}
      <div className="flex gap-3 mb-6">
        {(["broker", "installer"] as const).map(r => (
          <button key={r} onClick={() => setRole(r)} type="button"
            className={`flex-1 py-3 rounded-xl font-semibold text-sm border-2 transition ${
              role === r ? "border-[#FFC107] bg-[#FFFBEB] text-[#1A2A3A]" : "border-slate-200 text-slate-500"
            }`}>
            {r === "broker" ? "🤝 Broker" : "🔧 Instalador"}
          </button>
        ))}
      </div>

      <form onSubmit={handleRegister} className="space-y-4">
        {field("Nombre completo", "fullName", "text", "Juan Pérez")}
        {field("Correo electrónico", "email", "email", "tu@correo.com")}
        {field("Teléfono / WhatsApp", "phone", "tel", "+57 300 000 0000")}
        {field("Ciudad", "city", "text", "Cartagena")}
        {field(role === "broker" ? "Empresa (opcional)" : "Nombre de tu empresa instaladora", "companyName", "text")}
        {field("Contraseña", "password", "password", "Mínimo 8 caracteres")}

        {error && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{error}</p>}

        <button type="submit" disabled={loading}
          className="w-full bg-[#1A2A3A] text-white font-bold py-3 rounded-lg hover:bg-[#243447] transition disabled:opacity-60 mt-2">
          {loading ? "Creando cuenta..." : "Crear cuenta →"}
        </button>
      </form>

      <p className="text-center text-sm text-slate-500 mt-5">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="text-[#1A2A3A] font-semibold hover:underline">Ingresar</Link>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-[#1A2A3A] flex items-center justify-center px-4 py-10">
      <Suspense fallback={<div className="text-white">Cargando...</div>}>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
