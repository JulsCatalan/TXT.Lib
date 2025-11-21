import type { Metadata } from "next";
import "./globals.css";
import ToasterClient from "../components/ToasterClient";

export const metadata: Metadata = {
  title: "TXT.lib",
  description:
    "Plataforma de biblioteca de textos con generación de audio mediante ElevenLabs, sistema para compartir contenido e integración con Kapseo para conectarlo con WhatsApp.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
        <ToasterClient />  {/* 👈 AQUÍ SE MONTA EL TOASTER */}
      </body>
    </html>
  );
}
