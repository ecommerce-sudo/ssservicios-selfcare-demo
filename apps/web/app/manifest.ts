import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SSServicios Selfcare",
    short_name: "SSServicios",
    description: "Portal de autoservicio: facturas, servicios y beneficios.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#7b00ff",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
