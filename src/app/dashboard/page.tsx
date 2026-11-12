"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent } from "react";

type DashboardData = {
  balance: string;
  totalSent: string;
  pendingTransfers: number;
  incoming: Array<{
    id: string;
    amount: string;
    senderEmail: string;
    senderName: string;
    createdAt: string;
  }>;
};

function formatCurrency(value: string) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "Unavailable";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function validateCurrencyData(data: DashboardData) {
  if (
    !data ||
    typeof data !== "object" ||
    !Array.isArray(data.incoming) ||
    data.incoming.some((transfer) => !transfer || typeof transfer !== "object")
  ) {
    throw new Error("The dashboard returned invalid data.");
  }

  const amounts: unknown[] = [data.balance, data.totalSent, ...data.incoming.map((transfer) => transfer.amount)];
  if (amounts.some((value) => typeof value !== "string" || value.trim() === "" || !Number.isFinite(Number(value)))) {
    throw new Error("The dashboard returned invalid currency data.");
  }

  return data;
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

function SummaryCard({ label, value, detail, featured = false }: { label: string; value: string; detail: string; featured?: boolean }) {
  return (
    <article className={`relative overflow-hidden rounded-2xl border p-5 sm:p-6 ${featured ? "border-blue-500/30 bg-gradient-to-br from-blue-950/60 to-[#111827]" : "border-gray-800 bg-[#111827]"}`}>
      {featured && <span aria-hidden="true" className="absolute -right-10 -top-14 h-40 w-40 rounded-full border border-blue-400/10" />}
      <div className="relative flex items-start justify-between gap-4">
        <p className="text-sm font-medium text-gray-400">{label}</p>
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${featured ? "bg-blue-500/15 text-blue-300" : "bg-gray-800 text-gray-400"}`}>
          <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
            {featured ? <><path d="M4 8.5h16v10H4zM4 8.5V6a1 1 0 0 1 1-1h12M16 12.5h4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" /><circle cx="16" cy="13.5" r=".7" fill="currentColor" /></> : <path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />}
          </svg>
        </span>
      </div>
      <p className={`relative mt-5 font-semibold tracking-tight text-white ${featured ? "text-3xl sm:text-4xl" : "text-2xl"}`}>{value}</p>
      <p className="relative mt-2 text-xs leading-5 text-gray-500">{detail}</p>
    </article>
  );
}

function FlowStrip() {
  return (
    <div className="hidden items-center gap-3 rounded-xl border border-gray-800 bg-[#0A0F1F] px-4 py-3 text-xs sm:flex">
      <span className="text-gray-400">Sender</span>
      <span aria-hidden="true" className="text-blue-400">→</span>
      <span className="font-medium text-blue-300">BalanceVault escrow</span>
      <span aria-hidden="true" className="text-blue-400">→</span>
      <span className="text-gray-400">Recipient</span>
    </div>
  );
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [receiverEmail, setReceiverEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [acceptingId, setAcceptingId] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadDashboard = useCallback(async () => {
    const response = await fetch("/api/dashboard", { cache: "no-store" });
    const result = (await response.json()) as DashboardData & { error?: string };

    if (!response.ok) throw new Error(result.error ?? "Unable to load your dashboard.");
    setData(validateCurrencyData(result));
    setError("");
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }

    if (status !== "authenticated") return;
    let active = true;

    fetch("/api/dashboard", { cache: "no-store" })
      .then(async (response) => {
        const result = (await response.json()) as DashboardData & { error?: string };
        if (!response.ok) throw new Error(result.error ?? "Unable to load your dashboard.");
        return validateCurrencyData(result);
      })
      .then((result) => {
        if (active) {
          setData(result);
          setError("");
        }
      })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : "Unable to load your dashboard.");
      });

    return () => {
      active = false;
    };
  }, [router, status]);

  async function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSending(true);

    try {
      const response = await fetch("/api/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverEmail, amount }),
      });
      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(result.error ?? "Unable to create the transfer.");
        return;
      }

      setReceiverEmail("");
      setAmount("");
      setMessage("Transfer request sent. Funds will move only after the recipient accepts.");
      await loadDashboard();
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Unable to create the transfer.");
    } finally {
      setIsSending(false);
    }
  }

  async function handleAccept(transferId: string) {
    setError("");
    setMessage("");
    setAcceptingId(transferId);

    try {
      const response = await fetch("/api/transfer/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transferId }),
      });
      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(result.error ?? "Unable to accept the transfer.");
        return;
      }

      setMessage("Transfer accepted and recorded in your ledger.");
      await loadDashboard();
    } catch (acceptError) {
      setError(acceptError instanceof Error ? acceptError.message : "Unable to accept the transfer.");
    } finally {
      setAcceptingId("");
    }
  }

  async function handleRefresh() {
    setError("");
    setIsRefreshing(true);

    try {
      await loadDashboard();
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load your dashboard.");
    } finally {
      setIsRefreshing(false);
    }
  }

  if (status === "loading" || (status === "authenticated" && !data && !error)) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0A0F1F] px-6 text-white">
        <div className="flex items-center gap-3 rounded-2xl border border-gray-800 bg-[#111827] px-5 py-4">
          <span aria-hidden="true" className="h-5 w-5 animate-spin rounded-full border-2 border-blue-950 border-t-blue-400" />
          <p className="text-sm font-medium text-gray-300">Opening your vault…</p>
        </div>
      </main>
    );
  }

  if (status === "unauthenticated") return null;

  const userName = session?.user?.name?.trim() || "there";

  return (
    <main className="min-h-screen bg-[#0A0F1F] text-white">
      <header className="border-b border-gray-800 bg-[#0d1424]">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Link className="inline-flex items-center gap-3 text-sm font-semibold tracking-tight text-white" href="/"><BrandMark />BalanceVault</Link>
          <div className="flex items-center gap-3">
            <span className="hidden max-w-48 truncate text-sm font-medium text-gray-400 sm:inline">{userName}</span>
            <button className="rounded-xl border border-gray-700 px-3.5 py-2 text-sm font-semibold text-gray-300 transition hover:border-gray-600 hover:bg-gray-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400" onClick={() => signOut({ callbackUrl: "/login" })} type="button">Sign Out</button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 pb-12 pt-8 sm:px-8 sm:pt-11">
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">Your account</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Good to see you, {userName}</h1>
            <p className="mt-2 text-sm leading-6 text-gray-400">A clear view of your money and the transfers that matter.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <FlowStrip />
            {data && <button className="inline-flex items-center gap-2 rounded-xl border border-gray-700 bg-[#111827] px-3.5 py-2.5 text-sm font-semibold text-gray-300 transition hover:border-gray-600 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400 disabled:cursor-wait disabled:opacity-60" disabled={isRefreshing} onClick={handleRefresh} type="button">
              <svg aria-hidden="true" className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24"><path d="M20 11a8 8 0 0 0-14.9-3M4 4v4h4m-4 5a8 8 0 0 0 14.9 3M20 20v-4h-4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" /></svg>
              {isRefreshing ? "Refreshing…" : "Refresh"}
            </button>}
          </div>
        </div>

        {error && <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-red-900/70 bg-red-950/40 px-4 py-4 sm:flex-row sm:items-center sm:justify-between" role="alert">
          <p className="text-sm text-red-300">{error}</p>
          {!data && <button className="w-fit rounded-lg border border-red-900/70 bg-[#111827] px-3 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-950/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400" disabled={isRefreshing} onClick={handleRefresh} type="button">{isRefreshing ? "Trying again…" : "Try again"}</button>}
        </div>}
        {message && <p className="mb-6 rounded-xl border border-emerald-900/70 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-300" role="status">{message}</p>}

        {data ? <>
          <section aria-label="Account summary" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <SummaryCard label="Available Balance" value={formatCurrency(data.balance)} detail="Ready to use in your vault" featured />
            <SummaryCard label="Pending Incoming" value={String(data.pendingTransfers)} detail="Transfers waiting for your review" />
            <SummaryCard label="Total Sent" value={formatCurrency(data.totalSent)} detail="Completed transfers from your account" />
          </section>

          <section className="mt-7 grid gap-5 lg:grid-cols-[0.86fr_1.14fr]">
            <article className="rounded-2xl border border-gray-800 bg-[#111827] p-5 sm:p-7">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-500/15 text-blue-300">
                  <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24"><path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" /></svg>
                </span>
                <div><h2 className="text-lg font-semibold tracking-tight text-white">Send money</h2><p className="mt-1 text-sm leading-5 text-gray-400">Request a transfer from someone you trust.</p></div>
              </div>
              <form className="mt-6 space-y-5" onSubmit={handleSend}>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-200" htmlFor="receiverEmail">Receiver email</label>
                  <input autoComplete="email" className="w-full rounded-xl border border-gray-700 bg-[#0A0F1F] px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20" id="receiverEmail" onChange={(event) => setReceiverEmail(event.target.value)} placeholder="name@example.com" required type="email" value={receiverEmail} />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-200" htmlFor="amount">Amount (USD)</label>
                  <div className="relative">
                    <span aria-hidden="true" className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400">$</span>
                    <input className="w-full rounded-xl border border-gray-700 bg-[#0A0F1F] py-3 pl-9 pr-4 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20" id="amount" inputMode="decimal" min="0.01" onChange={(event) => setAmount(event.target.value)} placeholder="0.00" required step="0.01" type="number" value={amount} />
                  </div>
                </div>
                <button className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400 disabled:cursor-not-allowed disabled:opacity-60" disabled={isSending} type="submit">{isSending ? "Sending request…" : "Send transfer request"}</button>
                <p className="text-center text-xs leading-5 text-gray-500">Funds move only after the recipient accepts.</p>
              </form>
            </article>

            <article className="rounded-2xl border border-gray-800 bg-[#111827] p-5 sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-500/10 text-emerald-300">
                    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24"><path d="M12 5v14m-6-6 6 6 6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" /></svg>
                  </span>
                  <div><h2 className="text-lg font-semibold tracking-tight text-white">Incoming transfers</h2><p className="mt-1 text-sm leading-5 text-gray-400">Review and accept funds sent your way.</p></div>
                </div>
                {data.incoming.length > 0 && <span className="grid h-8 min-w-8 place-items-center rounded-full border border-blue-500/20 bg-blue-500/10 px-2 text-xs font-semibold text-blue-300" aria-label={`${data.incoming.length} incoming transfers`}>{data.incoming.length}</span>}
              </div>
              {data.incoming.length === 0 ? (
                <div className="mt-6 rounded-xl border border-dashed border-gray-700 bg-[#0A0F1F]/70 px-5 py-10 text-center">
                  <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-gray-800 text-gray-400">
                    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24"><path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" /></svg>
                  </span>
                  <p className="mt-3 text-sm font-semibold text-gray-200">Nothing waiting for you</p>
                  <p className="mt-1 text-sm text-gray-500">New incoming requests will show up here.</p>
                </div>
              ) : (
                <ul className="mt-5 divide-y divide-gray-800">
                  {data.incoming.map((transfer) => <li className="flex flex-col gap-4 py-5 first:pt-1 sm:flex-row sm:items-center sm:justify-between" key={transfer.id}>
                    <div className="flex min-w-0 items-center gap-3">
                      <span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gray-800 text-sm font-semibold text-gray-300">{transfer.senderName.trim().charAt(0).toUpperCase() || "?"}</span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-100">{transfer.senderName}</p>
                        <p className="mt-0.5 truncate text-sm text-gray-400">{transfer.senderEmail}</p>
                        <p className="mt-1 text-xs text-gray-500">{new Date(transfer.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-4 sm:justify-end">
                      <span className="text-lg font-semibold tracking-tight text-white">{formatCurrency(transfer.amount)}</span>
                      <button className="shrink-0 rounded-xl bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400 disabled:cursor-not-allowed disabled:opacity-60" disabled={acceptingId === transfer.id} onClick={() => handleAccept(transfer.id)} type="button">{acceptingId === transfer.id ? "Accepting…" : "Accept Funds"}</button>
                    </div>
                  </li>)}
                </ul>
              )}
            </article>
          </section>
        </> : !error ? (
          <div className="rounded-2xl border border-gray-800 bg-[#111827] p-8 text-center text-sm font-medium text-gray-400">Your account summary will appear here.</div>
        ) : null}
      </div>
    </main>
  );
}
