import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { APPROVER_POSITIONS } from "../lib/positions";

const prisma = new PrismaClient();

const DEFAULT_PIN = "0000";

async function main() {
  console.log("Seeding database...");
  const hashedPin = await bcrypt.hash(DEFAULT_PIN, 10);

  const teacherNames = [
    "Б. Мөнхцэцэг", "Д. Оюунчимэг", "Ц. Батжаргал", "Н. Батчимэг",
    "Х. Түмэндэмбэрэл", "Б. Оюунбилэг", "Г. Наранцэцэг", "Ц. Энхтуяа",
    "Р. Пүрэвсүрэн", "Э. Батсайхан", "Т. Долгорсүрэн", "Ж. Мөнхзаяа",
    "С. Ганбаатар", "О. Уянга", "А. Дэлгэрмөрөн", "Ц. Батзориг",
    "Н. Сэлэнгэ", "Б. Ариунтуяа", "Д. Мөнхбат", "А. Түмэн-Өлзий",
    "Р. Ганзориг", "Ч. Наранцэцэг", "У. Соёлмаа", "Э. Мөнхтуяа",
    "Т. Хишигжаргал", "Б. Отгонбаяр", "Ц. Дэлгэрмаа", "Х. Ундрал",
    "Ө. Мөнхжаргал", "Д. Нямсүрэн", "Г. Батбаяр", "Н. Оюунтуяа",
    "Б. Энхжаргал", "Т. Гансүх", "Ц. Мөнхтуяа", "Р. Батсүх",
    "Ц. Дэлгэрсайхан", "Б. Золбаяр", "С. Эрдэнэцэцэг", "Д. Батмөнх",
    "Ж. Болормаа", "М. Тунгалаг", "Л. Ганцэцэг", "П. Сүрэнжав",
    "Б. Нарантуяа", "Д. Цэрэнханд", "З. Мөнхбаяр", "С. Ариунзаяа",
    "Т. Эрдэнэчимэг", "Р. Бямбажав", "Н. Даваацэрэн", "Б. Пүрэвсүрэн",
    "Г. Болдмаа", "Ц. Ганбат", "Х. Сүрэнхатан", "Д. Баярмаа",
    "О. Чинбат", "Э. Батхишиг", "А. Мөнхзул", "С. Доржпүрэв",
    "Ж. Хүрэлбаяр", "М. Одончимэг", "Л. Түвшинтөгс", "П. Ганбат",
    "Б. Нямжав", "Д. Долгоржав", "З. Батчимэг", "С. Мөнхцэцэг",
    "Т. Батболд", "Р. Сүрэнмаа", "Н. Ганзориг", "Б. Даваажав",
    "Г. Мөнхнасан", "Ц. Батсуурь", "Х. Энхбат", "Д. Наранчимэг",
    "О. Батцэцэг", "Э. Ганзориг", "А. Түмэнбаяр", "С. Батмөнх",
    "Ж. Оюунцэцэг", "М. Батсүх", "Л. Нямхүү", "П. Батжаргал",
    "Б. Ганчимэг", "Д. Бат-Өлзий", "З. Сүрэнцэцэг", "С. Батбаяр",
    "Т. Баттүвшин", "Р. Наранцэцэг", "Н. Батсайхан", "Б. Эрдэнэцэцэг",
    "Г. Батмөнх", "Ц. Оюунчимэг", "Х. Батжаргал", "Д. Мөнхзаяа",
    "О. Батсайхан", "Э. Батчимэг", "А. Ганбат", "С. Батсүрэн",
  ];
  const teachers = teacherNames.map((name) => ({
    name,
    position: "Багш",
    role: "TEACHER",
    pin: hashedPin,
  }));

  const approvers = APPROVER_POSITIONS.map((position) => ({
    name: position,
    position,
    role: "APPROVER",
    pin: hashedPin,
  }));

  await prisma.signature.deleteMany();
  await prisma.user.deleteMany();
  await prisma.user.createMany({ data: teachers });
  await prisma.user.createMany({ data: approvers });
  console.log(
    `Seeded ${teachers.length} багш, ${approvers.length} гарын үсэг зурагч. Анхны PIN: ${DEFAULT_PIN}`,
  );

  await prisma.classroom.deleteMany();
  await prisma.classroom.createMany({ data: buildClassroomSeed() });
  const classroomCount = await prisma.classroom.count();
  console.log(`Seeded ${classroomCount} анги.`);

  // Site content
  await seedSiteData(prisma);
}

function buildClassroomSeed() {
  const sections = ["А", "Б", "В", "Г"] as const;
  const rows: Array<{
    grade: number;
    section: string;
    label: string;
    headTeacher: string;
    room: string;
    capacity: number;
    studentCount: number;
    status: string;
  }> = [];

  const headTeachers = [
    "Б. Мөнхцэцэг", "Д. Оюунчимэг", "Ц. Батжаргал", "Н. Батчимэг",
    "Х. Түмэндэмбэрэл", "Б. Оюунбилэг", "Г. Наранцэцэг", "Ц. Энхтуяа",
    "Р. Пүрэвсүрэн", "Э. Батсайхан", "Т. Долгорсүрэн", "Ж. Мөнхзаяа",
    "С. Ганбаатар", "О. Уянга", "А. Дэлгэрмөрөн", "Ц. Батзориг",
    "Н. Сэлэнгэ", "Б. Ариунтуяа", "Д. Мөнхбат", "А. Түмэн-Өлзий",
    "Р. Ганзориг", "Ч. Наранцэцэг", "У. Соёлмаа", "Э. Мөнхтуяа",
    "Т. Хишигжаргал", "Б. Отгонбаяр", "Ц. Дэлгэрмаа", "Х. Ундрал",
    "Ө. Мөнхжаргал", "Д. Нямсүрэн", "Г. Батбаяр", "Н. Оюунтуяа",
    "Б. Энхжаргал", "Т. Гансүх", "Ц. Мөнхтуяа", "Р. Батсүх",
    "Ц. Дэлгэрсайхан",
  ];

  let teacherIdx = 0;
  for (let grade = 1; grade <= 12; grade++) {
    const sectionCount = grade >= 7 && grade <= 9 ? 4 : 3;
    for (let i = 0; i < sectionCount; i++) {
      const section = sections[i]!;
      const teacher = headTeachers[teacherIdx++ % headTeachers.length]!;
      const room = `${200 + grade * 4 + i} тоот`;
      const studentCount = 26 + ((grade + i * 3) % 8);
      rows.push({
        grade,
        section,
        label: `${grade}${section} анги`,
        headTeacher: teacher,
        room,
        capacity: 32,
        studentCount,
        status: "official",
      });
    }
  }
  return rows;
}

async function seedSiteData(p: PrismaClient) {
  await p.announcement.deleteMany();
  await p.announcement.createMany({
    data: [
      { text: "📢 2025—2026 оны хичээлийн жилийн нээлтийн ажиллагаа 9-р сарын 1-ний өдөр 09:00 цагт болно", order: 0 },
      { text: "📚 Хичээлийн номын жагсаалт, кабинетын хуваарь батлагдлаа", order: 1 },
      { text: "🛡️ Хүүхэд хамгааллын үзлэг, шалгалт амжилттай явагдлаа", order: 2 },
      { text: "🏆 Манай сургуулийн сурагчид улсын олимпиадаас 27 медаль хүртлээ", order: 3 },
    ],
  });
  console.log(`  ✓ ${await p.announcement.count()} announcements`);

  await p.newsItem.deleteMany();
  await p.newsItem.createMany({
    data: [
      { tag: "Захиргаа", title: "2025—2026 оны хичээлийн жилийн нээлтийн ажиллагаа зарлагдав", excerpt: "9-р сарын 1-ний 09:00 цагт төв талбайд болно.", date: new Date("2026-08-20"), order: 0 },
      { tag: "Сургалт", title: "Хичээлийн номын жагсаалт, кабинетын хуваарь батлагдлаа", excerpt: "Ангийн ахлах багш нар эцэг эхийн бүлэг чат руу жагсаалтыг хүргэсэн.", date: new Date("2026-08-15"), order: 1 },
      { tag: "Хамгаалал", title: "Хүүхэд хамгааллын үзлэг, шалгалт эхэллээ", excerpt: "Аюулгүй байдлын дотоод үзлэг зохион байгуулав.", date: new Date("2026-08-10"), order: 2 },
    ],
  });
  console.log(`  ✓ ${await p.newsItem.count()} news items`);

  await p.tourRoomFact.deleteMany();
  await p.tourRoom.deleteMany();
  const roomData = [
    { slug: "entrance", label: "Гол хаалга ба фойе", subtitle: "Main entrance & foyer", description: "Электрон бүртгэлийн хаалга.", icon: "DoorOpen", order: 0, facts: [["Оролт", "3 цэг"], ["Ажиллах цаг", "07:30—19:00"]] },
    { slug: "class", label: "Хичээлийн байр", subtitle: "Academic wing", description: "36 хичээлийн өрөө.", icon: "BookOpen", order: 1, facts: [["Хичээлийн өрөө", "36"], ["Лаборатори", "5"]] },
    { slug: "library", label: "Номын сан", subtitle: "Library", description: "24,000 гаруй ном.", icon: "Library", order: 2, facts: [["Ном", "24,000+"], ["Танхим", "120 хүн"]] },
    { slug: "sports", label: "Спорт заал", subtitle: "Sports complex", description: "Сагсан бөмбөгийн заал.", icon: "Activity", order: 3, facts: [["Талбай", "820 м²"], ["Хүчин чадал", "300 үзэгч"]] },
    { slug: "cafeteria", label: "Хоолны газар", subtitle: "Dining hall", description: "Диетологичийн зөвлөмж.", icon: "UtensilsCrossed", order: 4, facts: [["Багтаамж", "220 сурагч"], ["Ээлж", "3 ээлж"]] },
    { slug: "yard", label: "Сургуулийн хашаа", subtitle: "Outdoor yard", description: "Тоглоомын талбай.", icon: "Trees", order: 5, facts: [["Талбай", "3,400 м²"], ["Ногоон бүс", "48%"]] },
  ];
  for (const r of roomData) {
    const { facts, ...data } = r;
    const created = await p.tourRoom.create({ data });
    await p.tourRoomFact.createMany({ data: facts.map((f, i) => ({ key: f[0], value: f[1], roomId: created.id, order: i })) });
  }
  console.log(`  ✓ ${await p.tourRoom.count()} tour rooms`);

  await p.schoolInfo.deleteMany();
  await p.schoolInfo.createMany({
    data: [
      { key: "address", value: "Сүхбаатар дүүрэг, 10-р хороо, Монгол 3-р сургууль" },
      { key: "phone", value: "(976) 7011-1180" },
      { key: "email", value: "uuriingegee22@gmail.com" },
      { key: "work_hours", value: "Дав—Баа · 08:00 — 17:00" },
      { key: "protection_officer", value: "Д. Соёлмаа" },
      { key: "protection_phone", value: "7011-1189" },
      { key: "protection_email", value: "uuriingegee22@gmail.com" },
      { key: "hero_stats_students", value: "1,120+" },
      { key: "hero_stats_staff", value: "84" },
      { key: "quality_national_exam", value: "3.72" },
      { key: "quality_university_rate", value: "94" },
      { key: "quality_olympiad_medals", value: "27" },
      { key: "quality_pisa_score", value: "512" },
      { key: "quality_national_exam_desc", value: "2024-2025 оны улсын шалгалтад 94% нь дээд сургуульд элссэн." },
      { key: "quality_teacher_desc", value: "Нийт багш нарын 62% нь магистр, докторын зэрэгтэй." },
      { key: "protection_policy_1", value: "Хүүхэд хамгааллын хариуцлагатай ажилтан 08:00—18:00 цагт ажиллана." },
      { key: "protection_policy_2", value: "Дарамт, хүчирхийллийн мэдээллийн 24/7 нууц утас: 108" },
      { key: "protection_policy_3", value: "Сургуулийн орчны камерын хяналт." },
      { key: "protection_policy_4", value: "Сэтгэл судлаачтай уулзах цагийн захиалга онлайнаар авна." },
    ],
  });
  console.log(`  ✓ ${await p.schoolInfo.count()} school info entries`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
