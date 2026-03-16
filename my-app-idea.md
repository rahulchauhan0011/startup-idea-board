# My App Idea: Startup Idea Board

## What is this app?

A community board where users can post their startup ideas, browse ideas from others, and vote on the ones they find most promising. It's a simple, encouraging space for aspiring entrepreneurs to share early-stage thinking and get a sense of community interest.

## Who is it for?

Students, early-stage founders, and curious people who have startup ideas but want lightweight feedback before investing more time. Think of it as a low-stakes "Product Hunt for raw ideas."

## Core Features

1. **Post an Idea** — Any logged-in user can submit a startup idea with:
   - A title (e.g. "AI tutor for GMAT prep")
   - A short description (1–3 sentences)
   - A category tag (e.g. EdTech, FinTech, HealthTech, Other)

2. **Browse Ideas** — The home page shows all posted ideas in a feed, sorted by most votes. Anyone (even logged-out) can browse.

3. **Upvote Ideas** — Logged-in users can upvote ideas they find interesting. Each user can only vote once per idea.

4. **My Ideas** — A personal page where users can see the ideas they've posted and manage them (edit or delete).

## Data Model (keep it simple)

- **users** — managed by InstantDB auth (email, user ID)
- **ideas** — title, description, category, createdAt, authorId
- **votes** — ideaId, userId (one per user per idea)

## Design Direction

- Clean, modern, mobile-responsive
- Card-based layout for browsing ideas
- Encouraging tone — this is a safe space to share early ideas
- Color palette: light background, with a bold accent color (e.g. indigo or teal)

## Nice-to-Have (only if time allows)

- Comment/feedback on ideas
- Filter by category
- Sort by newest vs. most voted
