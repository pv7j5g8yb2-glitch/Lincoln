import { redirect } from "next/navigation";

// Lincoln sets up each firm itself; there is no public sign up. New firms start from the enquiry form.
export default function SignUp() {
  redirect("/start");
}
