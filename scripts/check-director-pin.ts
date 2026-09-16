// Захирлын PIN-ийг DB-с шалгах бяцхан tool.
//
// Ажиллуулах:  npx tsx scripts/check-director-pin.ts
//
// PIN нь bcrypt hash-аар хадгалагдвал (`$2...`-аар эхэлбэл) буцаах
// боломжгүй тул зөвхөн "hash-тай" гэж мэдээлнэ. Хэрэв хуучин plaintext
// PIN-ээр л үлдсэн байвал (шинэ bcrypt-т шилжээгүй), тэр утгыг шууд
// хэвлэнэ.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const directors = await prisma.user.findMany({
    where: { position: { contains: "Захирал", mode: "insensitive" } },
    select: { id: true, name: true, position: true, role: true, pin: true, email: true },
  });

  if (directors.length === 0) {
    console.log('Захирал position-той хэрэглэгч олдсонгүй.');
    return;
  }

  for (const d of directors) {
    console.log("─".repeat(50));
    console.log("Нэр:      ", d.name);
    console.log("Албан:    ", d.position);
    console.log("Үүрэг:    ", d.role);
    console.log("Имэйл:    ", d.email ?? "—");
    if (d.pin.startsWith("$2")) {
      console.log("PIN:      🔒 bcrypt hash-тай — жинхэнэ утгыг сэргээх БОЛОМЖГҮЙ.");
      console.log("           Шинэ PIN үүсгэхийн тулд /dashboard/admin/codes хэсэгт");
      console.log("           энэ хэрэглэгч дээр Reset товч дарна уу.");
    } else {
      console.log("PIN:      ⚠️  " + d.pin + " (хуучин plaintext — bcrypt-т шилжээгүй)");
    }
  }
  console.log("─".repeat(50));
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
