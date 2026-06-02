"use server";
import { verifyAdminPin, setAdminSession } from "@/lib/admin";

export async function loginAsAdmin(pin: string) {
  if (verifyAdminPin(pin)) {
    await setAdminSession();
    return { success: true };
  }
  return { success: false, message: "Буруу PIN" };
}
