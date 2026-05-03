<div align="center">
  <h1>CA Batch 001</h1>
  <p>Course platform untuk CA Batch 001</p>
</div>

## Prerequisites

- [Node.js](https://nodejs.org/) v22+
- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) CLI installed
- A Claude Pro or Max subscription
- A PostgreSQL database (e.g. [Supabase](https://supabase.com/))

## Getting Started

```bash
# 1. Clone repo
git clone https://github.com/Herri68/ca-batch-001.git
cd ca-batch-001

# 2. Install dependencies
npm install

# 3. Setup environment
cp .env.example .env
```

Buka `.env` dan isi dengan kredensial database kamu:

```env
DATABASE_URL=postgresql://user:password@host:port/database
```

```bash
# 4. Jalankan migrasi database
npm run db:migrate

# 5. Seed database (opsional)
npm run db:seed

# 6. Jalankan dev server
npm run dev
```

App berjalan di `http://localhost:5173`.

## Scripts

| Command | Keterangan |
| --- | --- |
| `npm run dev` | Jalankan development server |
| `npm run build` | Build untuk production |
| `npm run test` | Jalankan tests |
| `npm run test:watch` | Jalankan tests dalam watch mode |
| `npm run typecheck` | Type-check project |
| `npm run db:migrate` | Jalankan migrasi database |
| `npm run db:seed` | Seed database |
| `npm run reset` | Reset branch ke lesson checkpoint |

## Course Reset

Untuk pindah ke checkpoint tertentu:

```bash
npm run reset
```

> Jika masih di branch `main`, script akan otomatis minta nama kamu dan buatkan branch baru. Setelah itu jalankan `npm run reset` lagi untuk memilih checkpoint.

## Tech Stack

- **Framework:** [React Router](https://reactrouter.com/) v7 with SSR
- **Language:** TypeScript 5.9
- **Database:** PostgreSQL via [Drizzle ORM](https://orm.drizzle.team/)
- **Styling:** Tailwind CSS 4 + [shadcn/ui](https://ui.shadcn.com/)
- **Testing:** [Vitest](https://vitest.dev/)
- **Build:** [Vite](https://vite.dev/) 7
