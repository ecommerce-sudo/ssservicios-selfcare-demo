import "./globals.css";

export const metadata = {
  title: "SSServicios Selfcare Demo",
  description: "Demo de autoservicio: cupo, reservas y órdenes"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}

