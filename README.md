# Eid Salami Spin Wheel

A full-stack Next.js 14 App Router website where an owner generates one-time redeem codes and users spin once for an Eid Salami prize.

## 1. Install

```bash
npm install


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

## Deploy on Vercel

Add these variables in **Vercel Project Settings > Environment Variables** before deploying:

```env
MONGODB_URI=your-mongodb-atlas-connection-string
JWT_SECRET=use-a-long-random-secret
ADMIN_PASSWORD=your-owner-setup-password
NEXTAUTH_URL=https://your-vercel-domain.vercel.app
NEXTAUTH_SECRET=use-another-long-random-secret
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
ADMIN_GOOGLE_EMAILS=yourgmail@gmail.com
```

For Vercel, use a MongoDB Atlas URI, not `mongodb://127.0.0.1:27017/...`.

Example:

```env
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/eid-salami?retryWrites=true&w=majority
```

If your variable is already named `MONGO_URI` or `DATABASE_URL`, the app also supports those aliases.

For Google login, create an OAuth client in Google Cloud Console and add this Authorized redirect URI:

```text
https://your-vercel-domain.vercel.app/api/auth/callback/google
```

`ADMIN_GOOGLE_EMAILS` is optional, but recommended. Put your Gmail there so only your Google account can become an admin.

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

updated on june 2026
