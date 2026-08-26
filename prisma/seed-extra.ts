import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding extra content...\n");

  // Gallery
  await prisma.galleryImage.deleteMany();
  await prisma.galleryImage.createMany({
    data: [
      { title: "Сургуулийн гол хаалга", url: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=600&h=400&fit=crop", category: "school", order: 0 },
      { title: "Хичээлийн өрөө", url: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=600&h=400&fit=crop", category: "school", order: 1 },
      { title: "Номын сан", url: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=600&h=400&fit=crop", category: "school", order: 2 },
      { title: "Нээлтийн ажиллагаа", url: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=600&h=400&fit=crop", category: "events", order: 3 },
      { title: "Олимпиадын шагнал", url: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&h=400&fit=crop", category: "events", order: 4 },
      { title: "Спорт наадам", url: "https://images.unsplash.com/photo-1461896836934-bd45ba8a0fca?w=600&h=400&fit=crop", category: "sports", order: 5 },
      { title: "Сагсан бөмбөгийн баг", url: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=600&h=400&fit=crop", category: "sports", order: 6 },
      { title: "Шинжлэх ухааны lab", url: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=600&h=400&fit=crop", category: "academic", order: 7 },
      { title: "Гараар хийх ажил", url: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&h=400&fit=crop", category: "academic", order: 8 },
    ],
  });
  console.log(`  ✓ ${await prisma.galleryImage.count()} gallery images`);

  // Achievements
  await prisma.achievement.deleteMany();
  await prisma.achievement.createMany({
    data: [
      { name: "Б. Тэмүүлэн", grade: "11", award: "Математикийн улсын олимпиад - Алтан медаль", year: 2025, category: "olimpiad", order: 0 },
      { name: "С. Номин", grade: "10", award: "Байгалийн ухааны улсын олимпиад - Мөнгөн медаль", year: 2025, category: "olimpiad", order: 1 },
      { name: "Д. Билгүүн", grade: "12", award: "Англи хэлний олон улсын тэмцээн - 1-р байр", year: 2025, category: "competition", order: 2 },
      { name: "Нийслэлийн ерөнхий боловсролын 3-р сургуулийн баг", grade: null, award: "Сагсан бөмбөгийн улсын аварга", year: 2025, category: "sports", order: 3 },
      { name: "Н. Ариунзаяа", grade: "9", award: "Зохиолын улсын уралдаан - Гран при", year: 2024, category: "academic", order: 4 },
      { name: "Р. Мишээл", grade: "11", award: "Физикийн олон улсын олимпиад - Хүрэл медаль", year: 2024, category: "olimpiad", order: 5 },
      { name: "Х. Хулан", grade: "8", award: "Уран зургийн улсын уралдаан - 1-р байр", year: 2024, category: "competition", order: 6 },
      { name: "Т. Баттүвшин", grade: "12", award: "PISA шалгалт - Үндэсний дунджаас дээш", year: 2024, category: "academic", order: 7 },
    ],
  });
  console.log(`  ✓ ${await prisma.achievement.count()} achievements`);

  // FAQ
  await prisma.faq.deleteMany();
  await prisma.faq.createMany({
    data: [
      { question: "Хүүхдээ хэрхэн бүртгүүлэх вэ?", answer: "Бүртгэл нь жил бүрийн 5-р сард явагдана. Бүртгүүлэхийн тулд хүүхдийн төрсний гэрчлэл, эцэг эхийн хувийн бичиг, 4x6 хэмжээтэй зураг авч ирнэ үү.", order: 0 },
      { question: "Хичээлийн жил хэдэн сараас эхэлдэг вэ?", answer: "Хичээлийн жил 9-р сарын 1-нээс эхэлж 6-р сарын 1-нд дуусна. Нэмэлт хичээл болон зуны сургалт 7-р сард явагдана.", order: 1 },
      { question: "PIN кодоо мартсан бол яах вэ?", answer: "Ангийн ахлах багш эсвэл захиргаанд хандана уу. Таныг нэрээр нь танихад PIN-г дахин тохируулж өгнө.", order: 2 },
      { question: "Цайны мөнгө хэр их байна вэ?", answer: "Өдрийн хоолны үнэ 3,000 төгрөг. Нэмэлт цай, жимсний мөнгө тусдаа. Тусгай хоолны хувилбар байна.", order: 3 },
      { question: "Хүүхэд хамгааллын холбоо барих утас байна уу?", answer: "Тийм ээ, хүүхэд хамгааллын хариуцлагатай ажилтан 7011-1189 утсаар холбогдоно уу. Мөн email: uuriingegee22@gmail.com", order: 4 },
      { question: "Сургуулийн цаг хэдэн цагаас хэдэн хүртэл вэ?", answer: "Сургууль 08:00-17:00 цаг хүртэл ажиллана. Хичээл 08:30-аас эхэлнэ. Аравдугаар цагаас хойш дугуйлан, нэмэлт хичээл явагдана.", order: 5 },
    ],
  });
  console.log(`  ✓ ${await prisma.faq.count()} FAQs`);

  // Events
  await prisma.event.deleteMany();
  await prisma.event.createMany({
    data: [
      { title: "Хичээлийн жилийн нээлтийн ажиллагаа", date: new Date("2026-09-01"), time: "09:00", location: "Төв талбай", description: "2026-2027 оны хичээлийн жилийн нээлтийн ажиллагаа. Бүх сурагч, эцэг эхийг урьж байна.", type: "school", order: 0 },
      { title: "Эцэг эхийн хурал", date: new Date("2026-09-10"), time: "18:00", location: "Их танхим", description: "Анги бүрийн эцэг эхийн хурал. Ангийн ахлах багш нартай уулзана.", type: "school", order: 1 },
      { title: "Улсын хэмжээний математикийн олимпиад", date: new Date("2026-11-15"), time: "09:00", location: "Сургуулийн спорт заал", description: "Дунд ангийн сурагчдын дунд зохион байгуулагдах улсын олимпиад.", type: "academic", order: 2 },
      { title: "Зуны амралт эхэлнэ", date: new Date("2027-06-01"), time: null, location: null, description: "Хичээлийн жил дуусч зуны амралт эхэлнэ.", type: "school", order: 3 },
      { title: "Спорт наадам", date: new Date("2026-10-20"), time: "10:00", location: "Спорт заал", description: "Жил бүрийн спортын наадам. Сагсан бөмбөг, гар бөмбөг, гүйлт.", type: "sports", order: 4 },
      { title: "Урлагийн наадам", date: new Date("2026-12-15"), time: "14:00", location: "Их танхим", description: "Сурагчдын урлагийн тоглолт, дуу, бүжиг, жүжиг.", type: "cultural", order: 5 },
    ],
  });
  console.log(`  ✓ ${await prisma.event.count()} events`);

  // Testimonials
  await prisma.testimonial.deleteMany();
  await prisma.testimonial.createMany({
    data: [
      { name: "Б. Дорж", role: "3А ангийн ээж", text: "Манай хүүхэд энэ сургуульд сурч байгаад маш их баяртай байна. Багш нар хүүхдэд маш их анхаарал хандуулдаг.", rating: 5, order: 0 },
      { name: "С. Оюунцэцэг", role: "5Б ангийн аав", text: "Ил тод удирдлага, эцэг эхийн хурал бүрт оролцож байгаад сайн байна. Хүүхдийнхээ хөгжлийг тодорхой харж байна.", rating: 5, order: 1 },
      { name: "Д. Мөнхбат", role: "7В ангийн ээж", text: "Хүүхэд хамгааллын бодлого маш сайн. Хүүхдээ аюулгүй орчинд сурч байгаад санаа амар байна.", rating: 4, order: 2 },
      { name: "Г. Батцэцэг", role: "2А ангийн аав", text: "Бага ангийн багш нар маш тэвчээртэй, мэргэжлийн. Хүүхдээ school-д дуртай болсон.", rating: 5, order: 3 },
      { name: "Н. Сүрэнжав", role: "10Г ангийн ээж", text: "Олимпиадын бэлтгэл маш сайн. Хүүхдээ математикийн олимпиадад оролцож медаль авлаа.", rating: 5, order: 4 },
      { name: "Р. Цэрэндолгор", role: "4А ангийн аав", text: "Сургуулийн орчин цэвэрхэн, ногоон бүс сайтай. Хүүхдэд ээлтэй орчин байна.", rating: 4, order: 5 },
    ],
  });
  console.log(`  ✓ ${await prisma.testimonial.count()} testimonials`);

  // Clubs
  await prisma.club.deleteMany();
  await prisma.club.createMany({
    data: [
      { name: "Математикийн дугуйлан", description: "Математик сонирхогч сурагчдын улсын олимпиадын бэлтгэл. Даваа, Лхагва 16:00-18:00.", teacher: "Б. Мөнхцэцэг", schedule: "Даваа, Лхагва 16:00", icon: "Code", order: 0 },
      { name: "Зургийн дугуйлан", description: "Уран зураг, график дизайн, фото зураг. Мягмар, Пүрэв 15:00-17:00.", teacher: "Ч. Наранцэцэг", schedule: "Мягмар, Пүрэв 15:00", icon: "Palette", order: 1 },
      { name: "Хөгжмийн дугуйлан", description: "Тоглох аялгуу, хамтлаг дуу, найрал дуу. Лхагва, Баасан 15:00-17:00.", teacher: "Г. Болдмаа", schedule: "Лхагва, Баасан 15:00", icon: "Music", order: 2 },
      { name: "Роботехникийн клуб", description: "Arduino, робот бүтээх, programming. Даваа, Пүрэв 16:00-18:00.", teacher: "Б. Золбаяр", schedule: "Даваа, Пүрэв 16:00", icon: "Code", order: 3 },
      { name: "Спортын клуб", description: "Сагсан бөмбөг, гар бөмбөг, ширээний теннис. Өдөр бүр 16:00-18:00.", teacher: "С. Ганбаатар", schedule: "Өдөр бүр 16:00", icon: "Dumbbell", order: 4 },
      { name: "Англи хэлний клуб", description: "English conversation, drama club, debate. Мягмар, Баасан 16:00-17:30.", teacher: "Д. Батсайхан", schedule: "Мягмар, Баасан 16:00", icon: "Globe", order: 5 },
    ],
  });
  console.log(`  ✓ ${await prisma.club.count()} clubs`);

  console.log("\nDone!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
