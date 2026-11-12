import { authOptions } from "@/auth";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  redirect(session ? "/dashboard" : "/login");
}
