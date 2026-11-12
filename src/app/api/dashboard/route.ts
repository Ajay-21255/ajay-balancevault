import { NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const userId = await getAuthenticatedUserId();

  if (!userId) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const [account, incoming, sent] = await Promise.all([
    prisma.account.findFirst({
      where: { userId },
      select: { balance: true },
    }),
    prisma.transfer.findMany({
      where: {
        receiverId: userId,
        status: "PENDING_ACCEPTANCE",
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.transfer.aggregate({
      where: {
        senderId: userId,
        status: "COMPLETED",
      },
      _sum: { amount: true },
    }),
  ]);

  if (!account) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }

  const senders = await prisma.user.findMany({
    where: { id: { in: [...new Set(incoming.map((transfer) => transfer.senderId))] } },
    select: { id: true, email: true, name: true },
  });
  const senderById = new Map(senders.map((sender) => [sender.id, sender]));

  return NextResponse.json({
    balance: account.balance.toFixed(2),
    totalSent: (sent._sum.amount ?? 0).toFixed(2),
    pendingTransfers: incoming.length,
    incoming: incoming.flatMap((transfer) => {
      const sender = senderById.get(transfer.senderId);
      return sender
        ? [{
            id: transfer.id,
            amount: transfer.amount.toFixed(2),
            senderEmail: sender.email,
            senderName: sender.name,
            createdAt: transfer.createdAt.toISOString(),
          }]
        : [];
    }),
  });
}
