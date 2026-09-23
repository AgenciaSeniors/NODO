import type { Metadata, Viewport } from "next";
import { Figtree } from "next/font/google";
import { ServiceWorkerRegister } from "@/components/pwa/sw-register";
import "./globals.css";

// next/font downloads the font at build time and serves it from our own
// domain, so the app never depends on Google Fonts being reachable from Cuba.
const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "NODO · Todo conecta cerca de ti",
    template: "%s · NODO",
  },
  description:
    "Encuentra lo que buscas cerca de ti: productos, tiendas y vendedores de tu municipio en Cuba.",
  applicationName: "NODO",
  appleWebApp: { capable: true, title: "NODO", statusBarStyle: "default" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#fbf7ee",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${figtree.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
