"use server";
import { verifyAdminPin, setAdminSession } from "@/lib/admin";
import { hitRateLimit, getClientIp } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 60_000;

export async function loginAsAdmin(pin: string) {
  const ip = await getClientIp();

  // Brute-force protection: per-IP fixed window. The bucket is keyed on IP
  // only and is NOT reset on success, so repeated guessing stays limited.
  // (The admin PIN is a static env secret — there is no per-user lockout.)
  if (!hitRateLimit(`admin-login:${ip}`, MAX_ATTEMPTS, WINDOW_MS)) {
    await logAudit({ action: "auth.admin_rate_limited" });
    return {
      success: false,
      message: "Хэт олон удаа буруу оруулсан байна. 1 минутын дараа дахин оролдоно уу.",
    };
  }

  if (verifyAdminPin(pin)) {
    await setAdminSession();
    await logAudit({ action: "auth.admin_login_success" });
    return { success: true };
  }
  await logAudit({ action: "auth.admin_login_failed" });
  return { success: false, message: "Буруу PIN" };
}
