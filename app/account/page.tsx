"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Header } from "@/components/header";
import { fieldClass } from "@/components/modal";
import { Button, Card } from "@/components/ui";
import { KeyRound, ShieldCheck } from "lucide-react";

export default function AccountPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/session")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => setEmail(data?.email || ""))
      .catch(() => setEmail(""));
  }, []);

  async function submitPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    const data = new FormData(event.currentTarget);
    const response = await fetch("/api/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword: data.get("currentPassword"),
        newPassword: data.get("newPassword"),
        confirmPassword: data.get("confirmPassword"),
      }),
    });
    const result = await response.json();
    setSaving(false);
    if (!response.ok) {
      setError(result.error || "Password gagal diganti.");
      return;
    }
    event.currentTarget.reset();
    setMessage("Password berhasil diganti untuk browser ini.");
  }

  return (
    <>
      <Header title="Akun" subtitle="Kelola akses login GrowthHive OS kamu." />

      <section className="grid gap-5 xl:grid-cols-[.9fr_1.1fr]">
        <Card className="p-6">
          <div className="mb-5 grid h-12 w-12 place-items-center rounded-xl bg-teal-50 text-teal-700">
            <ShieldCheck size={22} />
          </div>
          <p className="text-xs font-black uppercase tracking-[.16em] text-slate-400">Signed in as</p>
          <h2 className="mt-2 break-words text-xl font-black text-ink dark:text-white">{email || "GrowthHive Team"}</h2>
          <p className="mt-4 text-sm leading-6 text-slate-500">Password custom disimpan untuk fallback login di browser ini. Jika login dari device lain, gunakan password default sampai database auth terpusat aktif.</p>
        </Card>

        <Card className="p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-slate-100 text-slate-700">
              <KeyRound size={20} />
            </div>
            <div>
              <h2 className="font-black">Ganti Password</h2>
              <p className="text-xs text-slate-400">Masukkan password lama dan password baru.</p>
            </div>
          </div>
          <form onSubmit={submitPassword} className="space-y-4">
            {error && <div className="rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-700">{error}</div>}
            {message && <div className="rounded-xl bg-teal-50 p-3 text-sm font-bold text-teal-700">{message}</div>}
            <label>
              <span className="mb-2 block text-xs font-bold">Password lama</span>
              <input name="currentPassword" type="password" required className={fieldClass} />
            </label>
            <label>
              <span className="mb-2 block text-xs font-bold">Password baru</span>
              <input name="newPassword" type="password" required minLength={8} className={fieldClass} />
            </label>
            <label>
              <span className="mb-2 block text-xs font-bold">Konfirmasi password baru</span>
              <input name="confirmPassword" type="password" required minLength={8} className={fieldClass} />
            </label>
            <Button disabled={saving} className="w-full">{saving ? "Menyimpan..." : "Simpan Password Baru"}</Button>
          </form>
        </Card>
      </section>
    </>
  );
}
