"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

function EyeIcon({ visible }: { visible: boolean }) {
  return visible ? (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
      <path d="m3 3 18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.2A10.7 10.7 0 0 1 12 5c5.4 0 9 5 9 7a8.8 8.8 0 0 1-2.2 3.2M6.2 6.2C3.9 7.7 3 10.3 3 12c0 2 3.6 7 9 7 1.3 0 2.5-.3 3.5-.8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
    </svg>
  ) : (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
      <path d="M3 12s3.3-7 9-7 9 7 9 7-3.3 7-9 7-9-7-9-7Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
      <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function BrandMark() {
  return (
    <span className="grid h-10 w-10 place-items-center rounded-xl border border-blue-400/20 bg-blue-500/15 text-blue-300">
      <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
        <path d="M5 8.5h14M5 12h14M5 15.5h14M8 5v14m8-14v14" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
      </svg>
    </span>
  );
}

function PasswordInput({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (value: string) => void }) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-200" htmlFor={id}>{label}</label>
      <div className="relative">
        <input autoComplete="new-password" className="w-full rounded-xl border border-gray-700 bg-[#0A0F1F] px-4 py-3 pr-12 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20" id={id} minLength={8} onChange={(event) => onChange(event.target.value)} required type={isVisible ? "text" : "password"} value={value} />
        <button aria-label={isVisible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`} aria-pressed={isVisible} className="absolute inset-y-0 right-0 inline-flex w-12 items-center justify-center rounded-r-xl text-gray-400 transition hover:text-white focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-blue-400" onClick={() => setIsVisible((visible) => !visible)} type="button"><EyeIcon visible={isVisible} /></button>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please check and try again.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(result.error ?? "We couldn't create your account.");
        return;
      }

      const login = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl: "/dashboard",
      });

      if (!login?.ok) {
        setError("Your account was created. Please sign in to continue.");
        router.replace("/login");
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError("We couldn't create your account. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0A0F1F] px-4 py-7 text-white sm:px-6">
      <div aria-hidden="true" className="pointer-events-none absolute -right-36 -top-40 h-[28rem] w-[28rem] rounded-full bg-blue-500/10 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-48 -left-36 h-[28rem] w-[28rem] rounded-full bg-cyan-500/5 blur-3xl" />
      <section aria-label="Create a BalanceVault account" className="relative grid w-full max-w-5xl overflow-hidden rounded-3xl border border-gray-800 bg-[#111827] shadow-2xl shadow-black/30 md:grid-cols-[0.92fr_1.08fr]">
        <aside className="flex flex-col justify-between border-b border-gray-800 bg-gradient-to-br from-[#131d31] to-[#0d1424] p-6 sm:p-9 md:border-b-0 md:border-r lg:p-10">
          <div>
            <Link aria-label="BalanceVault home" className="inline-flex items-center gap-3 text-sm font-semibold tracking-tight text-white" href="/"><BrandMark />BalanceVault</Link>
            <p className="mt-9 text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-300">Your money, in good hands</p>
            <h2 className="mt-3 max-w-xs text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl">A safer middle for every transfer.</h2>
            <p className="mt-4 max-w-sm text-sm leading-6 text-gray-400">Start with a clear record of what you send, receive, and hold in between.</p>
            <figure aria-label="Transfer flow from sender through BalanceVault escrow to recipient" className="mt-8 rounded-2xl border border-gray-800 bg-[#0A0F1F] p-4 sm:p-5">
              <figcaption className="mb-5 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400"><span>Escrow flow</span><span className="text-emerald-400">Tracked</span></figcaption>
              <div className="grid grid-cols-[1fr_auto_1.2fr_auto_1fr] items-center gap-2 text-center">
                <div className="flex flex-col items-center gap-2"><span className="grid h-10 w-10 place-items-center rounded-xl bg-gray-800 text-gray-300"><svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="8" r="3" stroke="currentColor" strokeWidth="1.6" /><path d="M5.5 19c.6-3 2.8-4.5 6.5-4.5s5.9 1.5 6.5 4.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" /></svg></span><span className="text-xs text-gray-400">Sender</span></div>
                <span aria-hidden="true" className="text-blue-400">→</span>
                <div className="flex flex-col items-center gap-2"><span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600 text-white"><svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24"><path d="M12 3.5 19 6v5.3c0 4.2-2.8 7.5-7 9.2-4.2-1.7-7-5-7-9.2V6l7-2.5Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.5" /><path d="m9 12 2 2 4-4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" /></svg></span><span className="text-xs font-medium text-blue-300">In escrow</span></div>
                <span aria-hidden="true" className="text-blue-400">→</span>
                <div className="flex flex-col items-center gap-2"><span className="grid h-10 w-10 place-items-center rounded-xl bg-gray-800 text-gray-300"><svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24"><path d="M5 19V8l7-4 7 4v11M8 19v-6h8v6M3.5 19h17" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" /></svg></span><span className="text-xs text-gray-400">Recipient</span></div>
              </div>
            </figure>
          </div>
          <p className="mt-6 hidden border-t border-gray-800 pt-5 text-xs text-gray-500 sm:block">One account. Every transfer accounted for.</p>
        </aside>

        <div className="px-6 py-7 sm:px-10 sm:py-9 lg:px-14">
          <div className="mb-6 border-b border-gray-800 pb-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-400">Create account <span className="text-gray-600">/</span> 02</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">Start your ledger</h1>
            <p className="mt-2 text-sm leading-6 text-gray-400">A secure place to send, receive, and track every transfer.</p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-200" htmlFor="name">Full Name</label>
              <input autoComplete="name" className="w-full rounded-xl border border-gray-700 bg-[#0A0F1F] px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20" id="name" maxLength={80} onChange={(event) => setName(event.target.value)} placeholder="Your name" required type="text" value={name} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-200" htmlFor="email">Email address</label>
              <input autoComplete="email" className="w-full rounded-xl border border-gray-700 bg-[#0A0F1F] px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20" id="email" onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required type="email" value={email} />
            </div>
            <PasswordInput id="password" label="Password" onChange={setPassword} value={password} />
            <PasswordInput id="confirmPassword" label="Confirm Password" onChange={setConfirmPassword} value={confirmPassword} />
            <p className="-mt-1 text-xs text-gray-500">Use at least 8 characters.</p>
            {error && <p className="rounded-xl border border-red-900/70 bg-red-950/50 px-4 py-3 text-sm text-red-300" role="alert">{error}</p>}
            <button className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400 disabled:cursor-not-allowed disabled:opacity-60" disabled={isSubmitting} type="submit">{isSubmitting ? "Creating account..." : "Create Account"}</button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-400">Already registered? <Link className="font-semibold text-blue-400 hover:text-blue-300 focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-blue-400" href="/login">Sign in</Link></p>
          <p className="mt-5 border-t border-gray-800 pt-4 text-center text-xs leading-5 text-gray-500">Protected with secure sign-in and carefully tracked transfers.</p>
        </div>
      </section>
    </main>
  );
}
