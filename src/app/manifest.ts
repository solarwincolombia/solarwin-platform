import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Solarwin | Red de Aliados",
    short_name: "Solarwin",
    description: "Plataforma para brokers e instaladores solares",
    start_url: "/broker/dashboard",
    display: "standalone",
    background_color: "#1A2A3A",
    theme_color: "#FFC107",
    orientation: "portrait",
    categories: ["business", "utilities"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any maskable" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
    ],
  };
}
