import "./globals.css";
import AppShell from "./_components/AppShell";

export const metadata = {
  title: "SSServicios Selfcare Demo",
  description: "Demo de autoservicio: cupo, reservas y órdenes",
  manifest: "/manifest.webmanifest",
  themeColor: "#7b00ff",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SSServicios",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,600,0,0"
        />
      </head>
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
