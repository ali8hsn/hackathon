# Dependencies Added Beyond Spec

Per §15 rule 3: any new top-level dependency is noted here.

| Package | Reason |
|---|---|
| `@prisma/adapter-better-sqlite3` | Prisma 7 requires explicit SQLite adapter |
| `better-sqlite3` | Required by the adapter |
| `@prisma/adapter-libsql` + `@libsql/client` | Tried as alternative adapter; kept for future use |
| `class-variance-authority` | shadcn/ui component variants |
| `clsx` + `tailwind-merge` | shadcn/ui utility |
| `@radix-ui/react-*` | shadcn/ui component primitives |
| `date-fns` | Relative timestamps in incident cards |
| `framer-motion` | Card animations |
| `lucide-react` | Icons (spec-approved) |
| `maplibre-gl` | Map rendering (spec-approved) |
| `zod` | Runtime validation (spec-approved) |
