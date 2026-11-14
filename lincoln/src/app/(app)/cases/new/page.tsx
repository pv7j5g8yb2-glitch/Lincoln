import CaseComposer from "@/components/CaseComposer";
import { requireUser } from "@/lib/session";

const ERRORS: Record<string, string> = {
  size: "25 MB max.",
  type: "PDFs and photos only.",
  sample: "Not available in the sample workspace.",
  model: "Lincoln's model is not connected.",
  failed: "Could not open the case. Try again.",
  limited: "Too many at once. Try again in a few minutes.",
  budget: "Today's model budget is used up.",
};

export default async function NewCase({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireUser();
  const { error } = await searchParams;
  return (
    <div className="rise mx-auto flex min-h-[62dvh] max-w-[680px] flex-col justify-center">
      <h1 className="serif mb-8 text-center text-[30px] font-medium leading-none md:text-[34px]">New case</h1>
      <CaseComposer />
      {error && ERRORS[error] && <p className="mt-3 text-center text-[13px] text-risk">{ERRORS[error]}</p>}
    </div>
  );
}
