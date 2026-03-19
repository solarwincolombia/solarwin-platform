"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Equipment = {
  id: string;
  name: string;
  spec: string;
  unit: string;
  public_price_cop: number;
  partner_price_cop: number;
  stock: number;
  active: boolean;
};

export default function EquipmentPage() {
  const [catalog, setCatalog] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<Record<string, number>>({});

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase.from("equipment_catalog").select("*").eq("active", true);
      setCatalog(data || []);
      setLoading(false);
    }
    load();
  }, []);

  const fmt = (n: number) => `$${n.toLocaleString("es-CO")}`;
  const totalItems = Object.values(cart).reduce((s, v) => s + v, 0);
  const totalValue = Object.entries(cart).reduce((s, [id, qty]) => {
    const item = catalog.find(e => e.id === id);
    return s + (item ? item.partner_price_cop * qty : 0);
  }, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#1A2A3A]">Solicitar Equipos</h2>
          <p className="text-slate-500 text-sm mt-1">Precios especiales para instaladores Solarwin</p>
        </div>
        {totalItems > 0 && (
          <button className="bg-[#FFC107] text-[#1A2A3A] font-bold px-5 py-2.5 rounded-lg hover:bg-yellow-400 transition text-sm">
            🛒 Solicitar ({totalItems} items · ${(totalValue / 1_000_000).toFixed(1)}M)
          </button>
        )}
      </div>

      {loading ? (
        <div className="bg-white rounded-xl p-12 text-center text-slate-400">Cargando catálogo...</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#1A2A3A]">
                {["Producto", "Especificación", "Unidad", "Precio público", "Precio aliado", "Stock", "Cantidad"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-white">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {catalog.map((item, i) => (
                <tr key={item.id} className={`border-b border-slate-50 ${i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}>
                  <td className="px-4 py-3.5 font-semibold text-[#1A2A3A]">{item.name}</td>
                  <td className="px-4 py-3.5 text-slate-500 text-xs">{item.spec}</td>
                  <td className="px-4 py-3.5 text-slate-500">{item.unit}</td>
                  <td className="px-4 py-3.5 text-slate-400 line-through text-xs">{fmt(item.public_price_cop)}</td>
                  <td className="px-4 py-3.5 text-green-600 font-bold">{fmt(item.partner_price_cop)}</td>
                  <td className="px-4 py-3.5">
                    {item.stock === 0 ? (
                      <span className="text-red-500 text-xs font-medium">Sin stock</span>
                    ) : item.stock < 5 ? (
                      <span className="text-yellow-600 text-xs font-medium">⚠️ {item.stock} unid.</span>
                    ) : (
                      <span className="text-green-600 text-xs font-medium">✅ Disponible</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setCart(c => ({ ...c, [item.id]: Math.max(0, (c[item.id] || 0) - 1) }))}
                        className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center transition">−</button>
                      <span className="w-6 text-center font-semibold text-[#1A2A3A]">{cart[item.id] || 0}</span>
                      <button onClick={() => setCart(c => ({ ...c, [item.id]: (c[item.id] || 0) + 1 }))}
                        disabled={item.stock === 0}
                        className="w-7 h-7 rounded-full bg-[#1A2A3A] hover:bg-[#243447] text-white font-bold flex items-center justify-center transition disabled:opacity-40">+</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="px-4 py-3 bg-slate-50 border-t border-slate-100">
            <p className="text-xs text-slate-400">
              * Precios para instaladores certificados Solarwin. El descuento promedio vs precio público es del <strong className="text-slate-600">20%</strong>.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
