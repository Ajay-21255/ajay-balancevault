import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

class TransferError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export async function POST(request: Request) {
  const receiverId = await getAuthenticatedUserId();

  if (!receiverId) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  if (
    !body ||
    typeof body !== "object" ||
    typeof (body as Record<string, unknown>).transferId !== "string" ||
    !(body as Record<string, string>).transferId.trim()
  ) {
    return NextResponse.json({ error: "A transfer ID is required." }, { status: 400 });
  }

  const transferId = (body as Record<string, string>).transferId.trim();
  const reference = randomUUID();

  try {
    const transfer = await prisma.$transaction(async (transaction) => {
      const currentTransfer = await transaction.transfer.findUnique({
        where: { id: transferId },
      });

      if (!currentTransfer) {
        throw new TransferError("Transfer not found.", 404);
      }

      if (currentTransfer.receiverId !== receiverId) {
        throw new TransferError("Only the recipient can accept this transfer.", 403);
      }

      if (currentTransfer.status !== "PENDING_ACCEPTANCE") {
        throw new TransferError("This transfer has already been processed.", 409);
      }

      const claimed = await transaction.transfer.updateMany({
        where: {
          id: transferId,
          receiverId,
          status: "PENDING_ACCEPTANCE",
        },
        data: { status: "COMPLETED" },
      });

      if (claimed.count !== 1) {
        throw new TransferError("This transfer has already been processed.", 409);
      }

      const senderDebit = await transaction.account.updateMany({
        where: {
          userId: currentTransfer.senderId,
          status: "APPROVED",
          balance: { gte: currentTransfer.amount },
        },
        data: { balance: { decrement: currentTransfer.amount } },
      });

      if (senderDebit.count !== 1) {
        throw new TransferError("The sender no longer has sufficient available balance.", 409);
      }

      const receiverCredit = await transaction.account.updateMany({
        where: {
          userId: currentTransfer.receiverId,
          status: "APPROVED",
        },
        data: { balance: { increment: currentTransfer.amount } },
      });

      if (receiverCredit.count !== 1) {
        throw new TransferError("The recipient account is not approved.", 409);
      }

      const [senderAccount, receiverAccount] = await Promise.all([
        transaction.account.findFirstOrThrow({
          where: { userId: currentTransfer.senderId },
          select: { id: true },
        }),
        transaction.account.findFirstOrThrow({
          where: { userId: currentTransfer.receiverId },
          select: { id: true },
        }),
      ]);

      await transaction.ledgerEntry.createMany({
        data: [
          {
            accountId: senderAccount.id,
            amount: currentTransfer.amount,
            type: "DEBIT",
            reference,
          },
          {
            accountId: receiverAccount.id,
            amount: currentTransfer.amount,
            type: "CREDIT",
            reference,
          },
        ],
      });

      return currentTransfer;
    });

    return NextResponse.json({
      id: transfer.id,
      status: "COMPLETED",
      amount: transfer.amount.toString(),
      reference,
    });
  } catch (error) {
    if (error instanceof TransferError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    throw error;
  }
}
