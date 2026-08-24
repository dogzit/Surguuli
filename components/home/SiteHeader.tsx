import { loadAnnouncements } from "@/lib/site-data";
import { SiteHeaderClient } from "./SiteHeaderClient";

export async function SiteHeader() {
  const announcements = await loadAnnouncements();
  return <SiteHeaderClient announcements={announcements.map((a) => a.text)} />;
}
