import { NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

const amountPattern = /^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/;

export async function POST(request: Request) {
  const senderId = await getAuthenticatedUserId();

  if (!senderId) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid transfer details." }, { status: 400 });
  }

  const { receiverEmail, amount: rawAmount } = body as Record<string, unknown>;
  const amountText =
    typeof rawAmount === "number" || typeof rawAmount === "string"
      ? String(rawAmount)
      : "";

  if (
    typeof receiverEmail !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(receiverEmail.trim())
  ) {
    return NextResponse.json({ error: "Enter a valid receiver email address." }, { status: 400 });
  }

  if (!amountPattern.test(amountText) || !Number.isFinite(Number(amountText)) || Number(amountText) <= 0) {
    return NextResponse.json(
      { error: "Amount must be greater than zero and have no more than two decimal places." },
      { status: 400 },
    );
  }

  const receiverEmailNormalized = receiverEmail.trim().toLowerCase();
  const [sender, receiver] = await Promise.all([
    prisma.account.findFirst({
      where: { userId: senderId },
      select: { id: true, balance: true, status: true },
    }),
    prisma.user.findUnique({
      where: { email: receiverEmailNormalized },
      select: {
        id: true,
        accounts: { select: { id: true, status: true }, take: 1 },
      },
    }),
  ]);

  if (!sender || sender.status !== "APPROVED") {
    return NextResponse.json({ error: "An approved sender account is required." }, { status: 403 });
  }

  const receiverAccount = receiver?.accounts[0];
  if (!receiverAccount || receiverAccount.status !== "APPROVED") {
    return NextResponse.json({ error: "No approved recipient account was found for that email." }, { status: 404 });
  }

  if (receiver.id === senderId) {
    return NextResponse.json({ error: "You cannot send a transfer to yourself." }, { status: 400 });
  }

  const amount = Number(amountText);

  if (sender.balance < amount) {
    return NextResponse.json({ error: "Insufficient balance." }, { status: 409 });
  }

  const transfer = await prisma.transfer.create({
    data: {
      senderId,
      receiverId: receiver.id,
      amount,
      status: "PENDING_ACCEPTANCE",
    },
    select: {
      id: true,
      amount: true,
      status: true,
      createdAt: true,
    },
  });

  return NextResponse.json(
    { ...transfer, amount: transfer.amount.toString() },
    { status: 201 },
  );
}
