# Dira Intelligence

> **Authoritative Executive Regulatory, Statutory & Policy Decision Engine**  
> Specialized in Kenya's Vision 2030, the Digital Superhighway, the 2026 National AI Strategy, and the Data Protection Act 2019.

---

## Overview

Dira Intelligence provides C-suite executives, general counsels, and compliance officers with zero-hallucination, statutory-grade guidance grounded directly in authentic Kenyan regulatory instruments:
- **Kenya Vision 2030 & Medium Term Plans** (National Transformation Pillars)
- **Digital Superhighway & Broadband Frameworks** (National ICT Infrastructure)
- **National AI Strategy & Policy 2026** (Emerging Tech & Algorithmic Governance)
- **Kenya Data Protection Act No. 24 of 2019 & ODPC Regulations** (Statutory Privacy Mandates)
- **Kenya Cloud Policy & Implementation Guidelines** (Sovereign Cloud & Data Localization)
- **National Cybersecurity Strategy 2022** (Critical Infrastructure Defense)

---

## Tech Stack & Architecture

- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS, Lucide Icons, Framer Motion
- **Backend**: Next.js Route Handlers (Edge & Node.js Serverless)
- **Database & Auth**: Supabase PostgreSQL, Row Level Security (RLS), pgvector semantic vector search
- **AI Intelligence**: Google Gemini 2.5/3.1 Flash with multi-model failover & zero-laundering citation verifier

---

## Deployment on Vercel

This repository is pre-configured for instant one-click deployment on Vercel:

1. **Push this repository to GitHub**:
   ```bash
   git add .
   git commit -m "Deploy: Dira Intelligence production release"
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin master
   ```

2. **Connect to Vercel**:
   - Go to [Vercel Dashboard](https://vercel.com/new).
   - Import this GitHub repository.
   - Framework Preset: **Next.js** (Auto-detected).
   - Root Directory: `./` (Auto-detected).

3. **Environment Variables (Optional / Recommended)**:
   Add the following in Vercel Project Settings $\rightarrow$ Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GEMINI_API_KEY`

4. Click **Deploy**.

---

## Database Setup

The database schema, RLS policies, vector indices, and integrity sanitization rules are included in `supabase_setup.sql`.

---

## Local Development

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build
```
