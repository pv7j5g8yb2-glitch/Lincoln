import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Atelier from "@/components/landing/variants/Atelier";
import Thermal from "@/components/landing/variants/Thermal";
import Field from "@/components/landing/variants/Field";
import Glass from "@/components/landing/variants/Glass";
import Particles from "@/components/landing/variants/Particles";

// Landing page designs under review. Closed (not found) unless LANDING_PREVIEW=1 is set on the server, so none of
// them is ever public by accident; never indexed.
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Lincoln", robots: { index: false, follow: false } };

const OPTIONS = [Atelier, Thermal, Field, Glass, Particles];

export default async function Preview({ params }: { params: Promise<{ n: string }> }) {
  if (process.env.LANDING_PREVIEW !== "1") notFound();
  const Option = OPTIONS[Number((await params).n) - 1];
  if (!Option) notFound();
  return <Option />;
}
