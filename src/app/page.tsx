"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/login");
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0A0F1F] flex items-center justify-center text-blue-500 font-mono">
      Loading Vault...
    </div>
  );
}