import { redirect } from "next/navigation";

export const metadata = { title: "Get In Touch" };

// Lincoln sets up each firm itself; there is no public sign up. New firms start from the enquiry form.
export default function SignUp() {
  redirect("/start");
}
