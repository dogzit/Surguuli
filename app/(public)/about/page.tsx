import type { Metadata } from "next";
import { About } from "@/components/home/About";
import { loadSchoolInfoBundle, loadSchoolName } from "@/lib/school-info";

export async function generateMetadata(): Promise<Metadata> {
  const name = await loadSchoolName();
  return {
    title: name ? `Танилцуулга · ${name}` : "Танилцуулга",
    description: name
      ? `${name}-ийн танилцуулга, түүх, зорилго, уламжлал.`
      : "Танилцуулга.",
  };
}

export const revalidate = 3600;

export default async function AboutPage() {
  const info = await loadSchoolInfoBundle();
  return (
    <About
      students={info.heroStudents}
      staff={info.heroStaff}
      olympiadMedals={info.olympiadMedals}
      foundedYear={info.foundedYear ? Number(info.foundedYear) : null}
      history={info.history}
      mission={info.mission}
      locations={info.locations}
      missionDescription={info.principalQuote}
    />
  );
}
