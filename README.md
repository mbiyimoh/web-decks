# Web Decks

Password-protected investor presentation decks built with Next.js 14.

## Features

- Full-screen scrollable presentations with smooth animations
- Password protection using iron-session
- Responsive design with Tailwind CSS
- Railway-ready deployment

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create environment file:
   ```bash
   cp .env.example .env.local
   ```

3. Edit `.env.local` with your values:
   ```
   DECK_PASSWORD=your_password
   SESSION_SECRET=your_32_char_secret
   ```

   Generate a session secret:
   ```bash
   openssl rand -hex 32
   ```

4. Run development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

## Deployment to Railway

1. Push to GitHub:
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. Create new project in [Railway](https://railway.app)

3. Connect your GitHub repository

4. Set environment variables in Railway:
   - `DECK_PASSWORD` - Password for deck access
   - `SESSION_SECRET` - 32-character hex secret

5. Deploy automatically triggers on push

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Framer Motion
- iron-session

## Project Structure

```
web-decks/
├── app/
│   ├── api/auth/     # Auth API endpoint
│   ├── login/        # Login page
│   ├── layout.tsx    # Root layout
│   └── page.tsx      # Main deck page
├── components/       # Deck components
├── lib/              # Session configuration
├── styles/           # Global CSS
└── middleware.ts     # Auth middleware
```
