import "./globals.css";
import AppShell from "./_components/AppShell";

export const metadata = {
  title: "SSServicios Selfcare Demo",
  description: "Demo de autoservicio: cupo, reservas y órdenes"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
