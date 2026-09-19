import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "./logout-button";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: professor } = await supabase
    .from("professores")
    .select("nome")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link href="/dashboard" className="font-semibold text-slate-900">
            Planos de Ensino SC
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600">
              {professor?.nome ?? user.email}
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-6 py-8">{children}</main>
    </div>
  );
}
