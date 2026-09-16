// Ганц удаа гүйцэтгэх seed: DB-д "Системийн Админ" гэсэн ADMIN хэрэглэгч
// үүсгэнэ. Уг хэрэглэгчийн жинхэнэ PIN нь DB-д хадгалагдахгүй — нэвтрэх
// үед ердөө `.env`-ийн `ADMIN_PIN`-тэй тулгана. DB дэх pin field-т ердөө
// санамсаргүй bcrypt hash хадгалагдана (ашиглагдахгүй).
//
// Ажиллуулах:
//   npx tsx scripts/seed-super-admin.ts
//
// Урьдчилсан нөхцөл: `.env`-д дараах хоёр хувьсагч байх ёстой:
//   SUPER_ADMIN_EMAIL=you@example.com
//   ADMIN_PIN=your-pin
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SUPER_ADMIN_EMAIL?.toLowerCase();
  const adminPin = process.env.ADMIN_PIN;

  if (!email) {
    console.error("❌ SUPER_ADMIN_EMAIL хувьсагч .env дотор байхгүй байна.");
    process.exit(1);
  }
  if (!adminPin || adminPin.length < 4) {
    console.error("❌ ADMIN_PIN хувьсагч .env дотор байхгүй эсвэл 4-с бага тэмдэгттэй.");
    process.exit(1);
  }

  const unusedRandomPin = crypto.randomBytes(16).toString("hex");
  const placeholderHash = await bcrypt.hash(unusedRandomPin, 10);

  const user = await prisma.user.upsert({
    where: { email },
    create: {
      name: "Системийн Админ",
      email,
      position: "Super Admin",
      role: "ADMIN",
      pin: placeholderHash,
    },
    update: {
      role: "ADMIN",
      position: "Super Admin",
    },
  });

  console.log("─".repeat(60));
  console.log("✅ Super admin бэлэн боллоо.");
  console.log("");
  console.log(`   ID:     ${user.id}`);
  console.log(`   Email:  ${user.email}`);
  console.log(`   Role:   ${user.role}`);
  console.log("");
  console.log("🔐 Нэвтрэх зам:");
  console.log("   1. /login хуудсанд нээгээд, доор нь байгаа");
  console.log('      "Cистемийн админаар нэвтрэх" линкийг дарна.');
  console.log(`   2. Email:  ${user.email}`);
  console.log("   3. PIN:    .env-д тавьсан ADMIN_PIN утга");
  console.log("─".repeat(60));
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
