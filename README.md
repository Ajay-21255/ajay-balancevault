# Ajay BalanceVault

A Next.js App Router application for peer-to-peer transfer requests and double-entry ledger accounting.

## Setup

Configure `DATABASE_URL` with a MySQL connection string, plus `NEXTAUTH_SECRET` and `NEXTAUTH_URL` in `.env`. Then install dependencies and create the database schema:

```bash
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). New registrations create an approved account with the schema's initial balance. Transfers remain pending until their recipient accepts them; acceptance updates both balances and writes matching debit/credit ledger entries in one database transaction.

Transfer amounts are validated to two fractional digits. The current Prisma schema represents balances and transfer amounts as floating-point values; use fixed-precision decimals before handling real funds.
