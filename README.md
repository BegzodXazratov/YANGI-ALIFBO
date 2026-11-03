# Alifbo Converter Telegram Bot

Telegram bot + web admin panel. Built with Next.js, TypeScript, Supabase and Telegram Bot API; deployable to Vercel.

## Alphabet mapping

The mappings are transcribed from the second alphabet chart supplied by the project owner. Both `H` and `X` map to Cyrillic `Х`; reverse conversion uses `Х -> X` as a deterministic default. `NG` is handled as a two-letter sequence.

## Features

- Registration on first use: display name entered by the user and phone number shared with Telegram's contact button.
- Latin-to-Cyrillic and Cyrillic-to-Latin conversion.
- Plain text and TXT, DOCX, PDF input.
- Converted files are returned in the same format.
- Admin dashboard: total users, active users (24h/7d/30d), blocked users, conversion counts, format/direction breakdown, and metadata-only usage events.
- Admin broadcast to users who have not blocked the bot.
- Privacy by design: message bodies, uploaded files, and original filenames are not written to the database. Only registration details and usage metadata (format, direction, timestamp) are stored. Admins cannot view submitted text or files.
- Phone number is received only when the user taps Telegram's explicit `request_contact` button. The bot cannot silently read a user's phone number.

## Run locally

1. Install Node.js 20 or later.
2. Copy `.env.example` to `.env.local` and fill in the values.
3. Create a Supabase project. In its SQL Editor, run `supabase/schema.sql` on a fresh database.
4. Create a Telegram bot using `@BotFather` and copy its token.
5. Install dependencies and start the app:

   ```bash
   npm install
   npm run dev
   ```

6. Open `http://localhost:3000/admin` for the admin dashboard.

## Deploy to GitHub and Vercel

1. Create a GitHub repository and push this project.
2. Import the repository into Vercel.
3. Add all variables from `.env.example` in Vercel Project → Settings → Environment Variables.
4. Deploy the project. Copy its production URL, for example `https://your-project.vercel.app`.
5. Register the webhook (replace placeholders):

   ```bash
   curl -X POST "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook" \\
     -H "Content-Type: application/json" \\
     -d '{"url":"https://your-project.vercel.app/api/telegram","secret_token":"<TELEGRAM_WEBHOOK_SECRET>","allowed_updates":["message"]}'
   ```

6. Open `https://your-project.vercel.app/admin` and sign in with `ADMIN_PASSWORD`.

## Environment variables

- `TELEGRAM_BOT_TOKEN`: token from BotFather.
- `TELEGRAM_WEBHOOK_SECRET`: 1–256 character Telegram webhook secret; use a random value using only letters, digits, `_` and `-`.
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL.
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service-role key. Server-side only; never expose it in client code.
- `ADMIN_PASSWORD`: strong unique admin password.
- `MAX_FILE_SIZE`: incoming file limit in bytes (default 15 MiB).

## Important production notes

- Telegram's hosted Bot API download limit and Vercel's function memory/time limits constrain file size. The default is deliberately set to 15 MiB; test your Vercel plan before increasing it.
- Scanned/image-only PDFs need OCR, which is not included.
- PDF text is extracted and a new PDF is generated; original layout, tables, images and styling are not preserved. PDF font coverage should be verified with Uzbek Latin/Cyrillic test documents before public launch.
- Broadcast currently sends sequentially in one serverless request. For a large audience, move it to a durable queue/worker to avoid Vercel execution limits and respect Telegram rate limits.
- The starter dashboard uses a single shared admin password; use stronger admin authentication before multi-admin production use.
