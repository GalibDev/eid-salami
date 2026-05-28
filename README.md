# Eid Salami Spin Wheel

A full-stack Next.js 14 App Router website where an owner generates one-time redeem codes and users spin once for an Eid Salami prize.

## 1. Install

```bash
npm install
```

## 2. Create `.env.local`

Copy `.env.example` to `.env.local` and update the values:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/eid-salami
JWT_SECRET=use-a-long-random-secret
ADMIN_PASSWORD=your-owner-password
```

## 3. Run

```bash
npm run dev
```

Open:

- Public site: `http://localhost:3000`
- Owner login: `http://localhost:3000/admin/login`

## Folder Structure

- `app/page.tsx` - Eid landing page, redeem code input, and wheel section.
- `components/SpinWheel.tsx` - animated prize wheel and confetti.
- `app/admin/login/page.tsx` - owner password login.
- `app/admin/dashboard/page.tsx` - prize editor, code generator, stats, winners table.
- `app/api/*` - Next API route handlers.
- `lib/db.ts` - MongoDB connection.
- `lib/auth.ts` - JWT cookie auth and owner password check.
- `models/*` - Mongoose models for Admin, Prize, and Code.

## Security Notes

- `/api/spin` chooses the prize on the server.
- `/api/spin` marks the code as used in the same database operation that saves the prize.
- Admin API routes require the HTTP-only JWT cookie created by `/api/admin/login`.
- Frontend never sends the selected prize to the server.
