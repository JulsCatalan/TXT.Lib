import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TXT.lib",
  description: "Plataforma de biblioteca de textos con generación de audio mediante ElevenLabs, sistema para compartir contenido e integración con Kapseo para conectarlo con WhatsApp.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
