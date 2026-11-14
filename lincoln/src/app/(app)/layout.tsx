import Sidebar from "@/components/Sidebar";
import TabBar from "@/components/TabBar";
import Toaster from "@/components/Toaster";
import { cookies } from "next/headers";
import { TOAST_COOKIE } from "@/lib/toast";
import { requireUser } from "@/lib/session";
import { kv, pendingApprovals, recentCases } from "@/lib/queries";
import { EVENTS } from "@/lib/demo-events";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, firm, viewer } = await requireUser({ setup: true });
  const step = Number(kv(firm.id, "demo_step") ?? "0");
  const review = pendingApprovals(firm.id, viewer).length;
  const notice = (await cookies()).get(TOAST_COOKIE)?.value ?? null;
  return (
    <div className="min-h-dvh">
      <Toaster initial={notice} />
      <Sidebar
        firm={firm.name}
        user={{ name: user.name, initials: user.initials, avatar: user.avatar }}
        review={review}
        recent={recentCases(firm.id, 7, viewer).map((c) => ({ id: c.id, client: c.client }))}
        demo={firm.demo ? { next: EVENTS[step]?.label ?? null } : null}
      />
      <TabBar
        firm={firm.name}
        user={{ name: user.name, initials: user.initials, avatar: user.avatar }}
        review={review}
        demo={firm.demo ? { next: EVENTS[step]?.label ?? null } : null}
      />
      <main className="app-main md:pl-[248px]">
        <div className="mx-auto w-full max-w-[1040px] px-4 pb-36 pt-[max(1.75rem,env(safe-area-inset-top))] md:px-12 md:pb-24 md:pt-12">{children}</div>
      </main>
    </div>
  );
}
