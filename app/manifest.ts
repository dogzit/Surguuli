import type { MetadataRoute } from "next";
import { loadSchoolInfoBundle } from "@/lib/school-info";

// Next serves this as /manifest.webmanifest. Dynamic so the short_name
// and theme_color flow from SchoolInfo rather than being another set
// of hardcoded strings.
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const info = await loadSchoolInfoBundle();
  const name = info.name ?? "Сургууль";
  const shortName = info.shortName ?? name.slice(0, 20);

  return {
    name,
    short_name: shortName,
    description: info.foundedYear
      ? `${info.foundedYear} онд байгуулагдсан ${name}-ийн албан ёсны цахим портал.`
      : `${name} — албан ёсны цахим портал.`,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0f172a",
    icons: [
      {
        src: "/logo.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/logo.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
