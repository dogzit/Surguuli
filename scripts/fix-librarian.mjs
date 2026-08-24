import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const POSITION = "Номын санч";
const NEW_PIN = "0000";

const all = await prisma.user.findMany({
  where: { position: POSITION },
});

if (all.length === 0) {
  console.log(`✗ "${POSITION}" position-тэй хэрэглэгч олдсонгүй. Шинээр үүсгэе...`);
  const hashed = await bcrypt.hash(NEW_PIN, 10);
  const created = await prisma.user.create({
    data: {
      name: POSITION,
      position: POSITION,
      role: "APPROVER",
      pin: hashed,
    },
  });
  console.log(`✓ Үүсгэлээ: ${created.id} (PIN: ${NEW_PIN})`);
} else if (all.length > 1) {
  console.log(`! ${all.length} ширхэг "${POSITION}" олдлоо. Эхнийхийг үлдээж бусдыг устгана...`);
  const [keep, ...rest] = all;
  for (const r of rest) {
    await prisma.user.delete({ where: { id: r.id } });
    console.log(`  Устгав: ${r.name} (${r.id})`);
  }
  const hashed = await bcrypt.hash(NEW_PIN, 10);
  await prisma.user.update({
    where: { id: keep.id },
    data: { name: POSITION, position: POSITION, role: "APPROVER", pin: hashed },
  });
  console.log(`✓ Үлдсэн: ${keep.id} (PIN: ${NEW_PIN})`);
} else {
  const u = all[0];
  const hashed = await bcrypt.hash(NEW_PIN, 10);
  await prisma.user.update({
    where: { id: u.id },
    data: {
      name: u.name.trim() || POSITION,
      position: POSITION,
      role: "APPROVER",
      pin: hashed,
    },
  });
  console.log(`✓ Шинэчлэв: ${u.id}`);
  console.log(`  name: "${u.name}"`);
  console.log(`  position: "${POSITION}"`);
  console.log(`  role: APPROVER`);
  console.log(`  pin: ${NEW_PIN}`);
}

console.log(`\n→ Browser-аас logout хийгээд PIN ${NEW_PIN}-ээр дахин нэвтэрнэ үү.`);
await prisma.$disconnect();
