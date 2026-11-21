import { cookies } from "next/headers";

// A short notice after an action ("Saved", "Sent"). The server sets it for the next render of the app;
// the Toaster shows it once and clears it.
export const TOAST_COOKIE = "lincoln_toast";

export async function toast(text: string) {
  (await cookies()).set(TOAST_COOKIE, `${text}|${Date.now()}`, { path: "/", maxAge: 30, sameSite: "lax", httpOnly: false });
}
