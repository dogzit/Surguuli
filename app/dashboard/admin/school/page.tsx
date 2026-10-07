import { School } from "lucide-react";
import { canAccessAdmin } from "@/lib/admin";
import { loadSchoolInfoBundle } from "@/lib/school-info";
import AdminGate from "../AdminGate";
import { PageHero } from "../PageHero";
import { SchoolInfoForm } from "./SchoolInfoForm";

export default async function SchoolInfoPage() {
  const access = await canAccessAdmin();
  if (access.role !== "ADMIN") return <AdminGate role={access.role as "APPROVER" | null} />;

  const info = await loadSchoolInfoBundle();
  const initial = {
    name: info.name ?? "",
    shortName: info.shortName ?? "",
    foundedYear: info.foundedYear ?? "",
    address: info.address ?? "",
    district: info.district ?? "",
    city: info.city ?? "",
    phone: info.phone ?? "",
    email: info.email ?? "",
    workHours: info.workHours ?? "",
    mapUrl: info.mapUrl ?? "",
    principalName: info.principalName ?? "",
    principalQuote: info.principalQuote ?? "",
    heroStudents: info.heroStudents ?? "",
    heroStaff: info.heroStaff ?? "",
    olympiadMedals: info.olympiadMedals ?? "",
    qualityNationalExam: info.qualityNationalExam ?? "",
    qualityNationalExamDesc: info.qualityNationalExamDesc ?? "",
    qualityUniversityRate: info.qualityUniversityRate ?? "",
    qualityPisaScore: info.qualityPisaScore ?? "",
    qualityTeacherDesc: info.qualityTeacherDesc ?? "",
    protectionOfficer: info.protectionOfficer ?? "",
    protectionPhone: info.protectionPhone ?? "",
    protectionEmail: info.protectionEmail ?? "",
    developerCredit: info.developerCredit ?? "",
    protectionPolicies: info.protectionPolicies,
    gradeManagers: info.gradeManagers,
    history: info.history,
    mission: info.mission,
    locations: info.locations,
  };

  const filled = Object.values(initial).filter((v) =>
    Array.isArray(v) ? v.length > 0 : typeof v === "object" ? Object.keys(v).length > 0 : v !== "",
  ).length;

  return (
    <>
      <PageHero
        icon={School}
        title="Сургуулийн мэдээлэл"
        subtitle="Нэр, холбоо барих, тоон үзүүлэлт, түүх — сайтын бүх хуудсанд эндээс орно"
        accent="emerald"
        stats={[{ label: "Бөглөсөн талбар", value: `${filled} / ${Object.keys(initial).length}`, tone: "accent" }]}
      />
      <SchoolInfoForm initial={initial} />
    </>
  );
}
