import "./globals.css";
import type { ReactNode } from "react";
import { Playfair_Display, Space_Grotesk } from "next/font/google";

// Fuente base para textos.
const bodyFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

// Fuente para titulos.
const titleFont = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-title",
  display: "swap",
});

// Metadatos de la pagina.
export const metadata = {
  title: "Guia de tallas YELLOW ORIGINAL",
  description: "Calcula tu talla con altura, peso y preferencias de fit.",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    // Estructura HTML con variables de fuentes.
    <html lang="es" className={`${bodyFont.variable} ${titleFont.variable}`}>
      <body>{children}</body>
    </html>
  );
}
