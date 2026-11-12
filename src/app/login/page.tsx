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

function TransferPath() {
  return (
    <figure aria-label="Sender to BalanceVault escrow to recipient" className="mt-8 rounded-2xl border border-gray-800 bg-[#0A0F1F] p-4 sm:p-5">
      <figcaption className="mb-5 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400">
        <span>Protected transfer path</span>
        <span className="flex items-center gap-2 normal-case tracking-normal text-emerald-400">
          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Tracked
        </span>
      </figcaption>
      <div className="grid grid-cols-[1fr_auto_1.2fr_auto_1fr] items-center gap-2">
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gray-800 text-gray-300">
            <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle cx="12" cy="8" r="3" stroke="currentColor" strokeWidth="1.6" />
              <path d="M5.5 19c.6-3 2.8-4.5 6.5-4.5s5.9 1.5 6.5 4.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
            </svg>
          </span>
          <span className="text-xs text-gray-400">Sender</span>
        </div>
        <span aria-hidden="true" className="text-blue-400">→</span>
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-950/50">
            <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
              <path d="M12 3.5 19 6v5.3c0 4.2-2.8 7.5-7 9.2-4.2-1.7-7-5-7-9.2V6l7-2.5Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.5" />
              <path d="m9 12 2 2 4-4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
            </svg>
          </span>
          <span className="text-xs font-medium text-blue-300">In escrow</span>
        </div>
        <span aria-hidden="true" className="text-blue-400">→</span>
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gray-800 text-gray-300">
            <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
              <path d="M5 19V8l7-4 7 4v11M8 19v-6h8v6M3.5 19h17" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
            </svg>
          </span>
          <span className="text-xs text-gray-400">Recipient</span>
        </div>
      </div>
    </figure>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    setIsSubmitting(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl: "/dashboard",
      });

      if (!result?.ok) {
        setError("Email or password is incorrect.");
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError("We couldn't sign you in. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0A0F1F] px-4 py-8 text-white sm:px-6">
      <div aria-hidden="true" className="pointer-events-none absolute -right-36 -top-40 h-[28rem] w-[28rem] rounded-full bg-blue-500/10 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-48 -left-36 h-[28rem] w-[28rem] rounded-full bg-cyan-500/5 blur-3xl" />
      <section aria-label="Sign in to BalanceVault" className="relative grid w-full max-w-5xl overflow-hidden rounded-3xl border border-gray-800 bg-[#111827] shadow-2xl shadow-black/30 md:grid-cols-[0.92fr_1.08fr]">
        <aside className="flex flex-col justify-between border-b border-gray-800 bg-gradient-to-br from-[#131d31] to-[#0d1424] p-6 sm:p-9 md:border-b-0 md:border-r lg:p-10">
          <div>
            <Link aria-label="BalanceVault home" className="inline-flex items-center gap-3 text-sm font-semibold tracking-tight text-white" href="/">
              <BrandMark />
              BalanceVault
            </Link>
            <p className="mt-9 text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-300">Private ledger</p>
            <h2 className="mt-3 max-w-xs text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl">Every transfer has a safer middle.</h2>
            <p className="mt-4 max-w-sm text-sm leading-6 text-gray-400">Funds stay accounted for while your payment moves from sender to recipient.</p>
            <TransferPath />
          </div>
          <p className="mt-6 hidden border-t border-gray-800 pt-5 text-xs text-gray-500 sm:block">One account. Every transfer accounted for.</p>
        </aside>

        <div className="px-6 py-8 sm:px-10 sm:py-11 lg:px-14">
          <div className="mb-8 border-b border-gray-800 pb-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-400">Account access <span className="text-gray-600">/</span> 01</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">Welcome back</h1>
            <p className="mt-2 text-sm leading-6 text-gray-400">Sign in to see your balance and keep your transfers moving.</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-200" htmlFor="email">Email address</label>
              <input autoComplete="email" className="w-full rounded-xl border border-gray-700 bg-[#0A0F1F] px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20" id="email" name="email" onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required type="email" value={email} />
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label className="block text-sm font-medium text-gray-200" htmlFor="password">Password</label>
                <button aria-controls="password-reset-note" aria-expanded={Boolean(notice)} className="text-xs font-semibold text-blue-400 transition hover:text-blue-300 focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-blue-400" onClick={() => { setError(""); setNotice("Password reset isn’t available yet. Please contact support for help signing in."); }} type="button">Forgot Password?</button>
              </div>
              <div className="relative">
                <input autoComplete="current-password" className="w-full rounded-xl border border-gray-700 bg-[#0A0F1F] px-4 py-3 pr-12 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20" id="password" name="password" onChange={(event) => setPassword(event.target.value)} required type={isPasswordVisible ? "text" : "password"} value={password} />
                <button aria-label={isPasswordVisible ? "Hide password" : "Show password"} aria-pressed={isPasswordVisible} className="absolute inset-y-0 right-0 inline-flex w-12 items-center justify-center rounded-r-xl text-gray-400 transition hover:text-white focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-blue-400" onClick={() => setIsPasswordVisible((visible) => !visible)} type="button"><EyeIcon visible={isPasswordVisible} /></button>
              </div>
            </div>
            {error && <p className="rounded-xl border border-red-900/70 bg-red-950/50 px-4 py-3 text-sm text-red-300" role="alert">{error}</p>}
            {notice && <p className="rounded-xl border border-blue-900/70 bg-blue-950/40 px-4 py-3 text-sm leading-5 text-blue-200" id="password-reset-note" role="status">{notice}</p>}
            <button className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400 disabled:cursor-not-allowed disabled:opacity-60" disabled={isSubmitting} type="submit">{isSubmitting ? "Signing in..." : "Sign In"}</button>
          </form>

          <p className="mt-7 text-center text-sm text-gray-400">Don&apos;t have an account? <Link className="font-semibold text-blue-400 hover:text-blue-300 focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-blue-400" href="/register">Sign up</Link></p>
          <p className="mt-6 border-t border-gray-800 pt-5 text-center text-xs leading-5 text-gray-500">Secure access to your personal transfer ledger.</p>
        </div>
      </section>
    </main>
  );
}
