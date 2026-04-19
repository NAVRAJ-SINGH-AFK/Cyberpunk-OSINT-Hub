# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Contains an OSINT Terminal web application with a Matrix/Cyberpunk aesthetic.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod, `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite + Tailwind CSS

## Artifacts

### OSINT Terminal (`artifacts/osint-terminal`)
- **Type**: React + Vite web app
- **Preview path**: `/`
- **Description**: Full OSINT intelligence tool with Matrix/Cyberpunk terminal aesthetic
- **Features**:
  - Home page with ASCII art header and Matrix green terminal cards
  - CRT scanline effects and glitch hover animations
  - Module 1: Metadata Extraction (drag-and-drop, EXIF parsing, GPS detection)
  - Module 2: Geolocation Intelligence (AI vision image analyzer via GPT-4o, observation checklist, reverse image search links)
  - Module 3: Crypto/Decoding (Base64, ROT13, Hex, Morse, Binary, URL, hash identification)

### API Server (`artifacts/api-server`)
- **Type**: Express 5 Node.js API
- **Preview path**: `/api`
- **Routes**:
  - `GET /api/healthz` - Health check
  - `POST /api/metadata/extract` - Extract EXIF/metadata from base64-encoded files
  - `POST /api/geolocation/solar-calc` - Solar shadow calculator for geolocation
  - `POST /api/crypto/decode` - Multi-method decoder (base64, rot13, hex, morse, binary, url, reverse)
  - `POST /api/crypto/identify-hash` - Hash type identification (MD5, SHA-1/256/512, bcrypt, etc.)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Visual Theme

- Background: pure black (#0a0a0a)
- Primary text: Matrix green (#00FF41 / hsl 120 100% 50%)
- Monospace font throughout (JetBrains Mono)
- CRT scanline effects, glitch hover animations
- Border radius: 0px (sharp terminal look)

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
