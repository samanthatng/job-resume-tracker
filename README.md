# Job Application Resume Tracker

A spreadsheet-style tracker for job applications. Fill in a row, click **Generate**,
and the app calls Claude to tailor Samantha's resume, builds a styled `.docx`,
uploads it to a Google Drive folder, and writes the resume title, Drive link, and
tailoring notes back into the row.

## Architecture

- `client/` — React (Vite) frontend. Row data lives in browser `localStorage`, so
  no database is required. Each row is stateless from the backend's point of view.
- `server/app.js` — Express app with two routes: `GET /api/health` and
  `POST /api/generate`. `POST /api/generate` does the full pipeline: Claude call →
  parse → docx build → Drive upload → return `{ resumeTitle, driveLink, tailoringNotes }`.
- `server/lib/` — one module per concern: `claude.js` (Anthropic API call + JSON
  parsing), `resumeParser.js` (turns the plain-text resume into sections/roles/bullets),
  `docxGenerator.js` (styled `.docx` via the `docx` package), `drive.js` (service-account
  upload), `filename.js` (resume title generation), `systemPrompt.js` (the tailoring
  prompt + master resume).
- `api/index.js` — wraps the same Express app with `serverless-http` so Vercel can run
  it as a serverless function. Local dev and production hit identical route logic.
- `vercel.json` — builds the client as a static site and the API as a Node function,
  routing `/api/*` to the function and everything else to the built frontend.

## 1. Google Drive service account setup

1. In [Google Cloud Console](https://console.cloud.google.com/), create (or reuse) a
   project, then enable the **Google Drive API**.
2. Go to **IAM & Admin → Service Accounts → Create Service Account**. No roles are
   needed at the project level.
3. Open the new service account → **Keys → Add Key → Create new key → JSON**. This
   downloads a JSON file — that whole file's contents (minified to one line) is your
   `GOOGLE_SERVICE_ACCOUNT_JSON` value.
4. In Google Drive, create (or pick) the folder that will hold generated resumes.
   Share that folder with the service account's `client_email` (found in the JSON
   file) as **Editor**. Copy the folder ID from its URL
   (`https://drive.google.com/drive/folders/<THIS_PART>`) — that's `GOOGLE_DRIVE_FOLDER_ID`.

## 2. Environment variables

Copy `.env.example` to `.env` and fill in:

| Variable | Description |
|---|---|
| `ANTHROPIC_API_KEY` | From [console.anthropic.com](https://console.anthropic.com) |
| `CLAUDE_MODEL` | Optional, defaults to `claude-sonnet-4-5-20250929` |
| `GOOGLE_DRIVE_FOLDER_ID` | Folder ID from step 1.4 |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Full service account JSON key, single line |
| `PORT` | Local Express port, defaults to `5000` |

## 3. Local development

```bash
# install backend deps (root) and frontend deps (client)
npm install
cd client && npm install && cd ..

# terminal 1: API on http://localhost:5000
npm run dev:server

# terminal 2: frontend on http://localhost:5173 (proxies /api to :5000)
cd client && npm run dev
```

## 4. Push to GitHub

```bash
git init
git add .
git commit -m "Job application resume tracker"
gh repo create job-resume-tracker --private --source=. --push
# or: git remote add origin <your-repo-url> && git push -u origin main
```

## 5. Deploy to Vercel

```bash
npm install -g vercel   # if not already installed
vercel login
vercel
```

In the Vercel project settings, add the same three environment variables
(`ANTHROPIC_API_KEY`, `GOOGLE_DRIVE_FOLDER_ID`, `GOOGLE_SERVICE_ACCOUNT_JSON`,
plus optional `CLAUDE_MODEL`) under **Settings → Environment Variables**, then
redeploy (`vercel --prod`). `vercel.json` already wires up the static client
build and the `/api` serverless function, so no further config is needed.

## Notes on the resume text pipeline

Claude returns `{ resume: "<plain text>", tailoring_notes: [...] }`. The system
prompt instructs Claude to keep the master resume's structure (name line, contact
line, ALL-CAPS section headers, `Title | Company | Dates` role lines, `- ` bullets),
and `resumeParser.js` parses that structure so `docxGenerator.js` can apply the
navy/Calibri styling (bold role titles, italic company, navy bullet dots, ALL-CAPS
section headers with a light rule). If Claude ever drifts from that structure, the
parser falls back gracefully to plain paragraphs rather than throwing. Em dashes are
stripped as a safety net in `resumeParser.js` in addition to the system prompt's
instruction not to use them.

## Known limitations / next steps

- No auth: anyone with the deployed URL can trigger generations and see rows in
  their own browser's `localStorage` (rows are not shared across devices/browsers).
- No retry/backoff on Claude or Drive API failures; a failed row can be re-generated
  by clicking **Generate** again.
- Filenames are auto-generated from company/title (e.g. `Resume_Samantha_Stripe_BusinessDevelopmentDirector.docx`);
  edit `server/lib/filename.js` if you want shorter abbreviations.
