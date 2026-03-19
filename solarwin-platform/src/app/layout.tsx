import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Solarwin | Red de Aliados",
  description: "Plataforma para brokers e instaladores solares Solarwin",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
