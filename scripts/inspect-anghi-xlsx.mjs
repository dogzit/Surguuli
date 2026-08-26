import * as XLSX from "xlsx";
import fs from "node:fs";
import path from "node:path";

const filePath = process.argv[2] || "/Users/zolo/Downloads/Анги-хуваарилалт.xlsx";
if (!fs.existsSync(filePath)) {
  console.error("Файл олдсонгүй:", filePath);
  process.exit(1);
}

const buf = fs.readFileSync(filePath);
// cellStyles: true lets us read fill colors so we can pick out highlighted rows.
const wb = XLSX.read(buf, { type: "buffer", cellStyles: true });

for (const sheetName of wb.SheetNames) {
  const ws = wb.Sheets[sheetName];
  const ref = ws["!ref"];
  const range = XLSX.utils.decode_range(ref || "A1");
  console.log(`\n=== Sheet: "${sheetName}" (${ref}) ===`);
  const rowsToShow = Math.min(range.e.r, 12);
  for (let R = range.s.r; R <= rowsToShow; R++) {
    const cells = [];
    for (let C = range.s.c; C <= Math.min(range.e.c, 8); C++) {
      const addr = XLSX.utils.encode_cell({ r: R, c: C });
      const cell = ws[addr];
      if (!cell) { cells.push(""); continue; }
      const v = cell.v ?? "";
      const fill = cell.s?.fgColor?.rgb || cell.s?.bgColor?.rgb || "";
      cells.push(fill ? `${v}[${fill}]` : String(v));
    }
    console.log(`R${R + 1}:`, cells.join(" | "));
  }
  console.log(`… (${range.e.r - range.s.r + 1} rows total)`);
}
