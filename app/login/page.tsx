"use client";

import { Button } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { Chrome, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const errorCopy: Record<string, string> = {
  unauthorized: "Email Google ini belum terdaftar sebagai tim GrowthHive.",
  config: "Google Sign-In belum dikonfigurasi di environment app.",
  oauth: "Login Google gagal. Coba masuk ulang.",
};

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const hasGoogleConfig = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("error");
    if (code) setError(errorCopy[code] || "Login gagal. Coba masuk ulang.");
  }, []);

  async function loginWithGoogle() {
    setLoading(true);
    setError("");
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      setError(errorCopy.config);
      setLoading(false);
      return;
    }
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { prompt: "select_account" },
      },
    });
    if (authError) {
      setError(authError.message);
      setLoading(false);
    }
  }

  async function loginWithPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
    });
    if (!response.ok) {
      setError("Email atau kata sandi salah.");
      setLoading(false);
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#F2F8F6] p-5 dark:bg-slate-950">
      <div className="w-full max-w-md rounded-3xl border border-white bg-white p-8 shadow-2xl shadow-teal-900/10 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-8 flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-teal-600 text-2xl font-black text-white">G</div>
          <div>
            <div className="text-xl font-black text-ink dark:text-white">GrowthHive</div>
            <div className="text-[10px] font-bold uppercase tracking-[.22em] text-teal-600">Operating System</div>
          </div>
        </div>
        <div className="mb-6 grid h-12 w-12 place-items-center rounded-2xl bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-200">
          <ShieldCheck size={22} />
        </div>
        <h1 className="text-2xl font-black text-ink dark:text-white">Masuk ke GrowthHive OS</h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">Akses dibatasi untuk akun Google tim GrowthHive yang sudah terdaftar.</p>
        {error && <p className="mt-5 rounded-xl bg-red-50 p-3 text-xs font-bold text-red-600">{error}</p>}
        {hasGoogleConfig ? (
          <Button onClick={loginWithGoogle} className="mt-7 h-12 w-full" disabled={loading}>
            <Chrome size={17} /> {loading ? "Menghubungkan..." : "Masuk dengan Google"}
          </Button>
        ) : (
          <form onSubmit={loginWithPassword} className="mt-7 space-y-4">
            <label className="block">
              <span className="mb-2 block text-xs font-bold text-slate-500">Email</span>
              <div className="flex h-12 items-center gap-3 rounded-xl border border-slate-200 px-4 dark:border-slate-700">
                <Mail size={16} className="text-slate-400" />
                <input name="email" type="email" required defaultValue="growthiveofficial@gmail.com" className="w-full bg-transparent text-sm outline-none" />
              </div>
            </label>
            <label className="block">
              <span className="mb-2 block text-xs font-bold text-slate-500">Kata sandi</span>
              <div className="flex h-12 items-center gap-3 rounded-xl border border-slate-200 px-4 dark:border-slate-700">
                <LockKeyhole size={16} className="text-slate-400" />
                <input name="password" type="password" required className="w-full bg-transparent text-sm outline-none" />
              </div>
            </label>
            <Button className="h-12 w-full" disabled={loading}>{loading ? "Memproses..." : "Masuk"}</Button>
          </form>
        )}
      </div>
    </main>
  );
}
