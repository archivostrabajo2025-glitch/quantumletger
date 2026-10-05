# Quantum Ledger Web

## Render deployment without Supabase

The frontend uses the Node API in `server/index.js`; Supabase is not used for authentication, records, or identity-document storage. For a free public deployment, use Render's free Node Web Service and Neon Free PostgreSQL (permanent free tier, 1 GB limit). Both can sleep when idle, so the first request may be slow; this is a hobby/test setup, not a high-availability production service.

1. Create a Neon Free PostgreSQL project and copy its pooled connection string.
2. Create a new Render Web Service from this repository using the root `render.yaml` (plan: free).
3. Set `DATABASE_URL` to the Neon connection string. The blueprint creates `admin@quantumledgerbusiness.com` and generates its password and `APP_TOKEN_SECRET`; retrieve the generated password from the service's Render Environment page.
4. After `/api/health` reports `{ "ok": true }`, test a new signup and confirm it appears in Admin → Verification. Then move the custom domain to this new service.

See `.env.example` for the complete list of environment variables used by the API, the Vite client, and local mode. Values are set in the Render dashboard (or in `.env` for local development); none are required at build time for a same-origin deploy.

The existing Static Site cannot host the API. Keep it until the new Web Service is healthy, then attach the custom domain to the new service. Accounts and documents previously stored elsewhere are not copied automatically; the new database starts empty. This deployment does not send email: there are no welcome, document, or password-recovery messages. Render's free web service sleeps after inactivity, and Neon Free has usage/storage limits.

## Literal local mode

Run `npm run dev:local`, then open `http://localhost:8082`. This starts the API on `127.0.0.1:10000` and the Vite site locally. It requires no cloud account, PostgreSQL server, or Supabase credentials. Local test records and uploaded documents are stored in the ignored `data/local-db.json` file. You may override the local admin and API port with `LOCAL_ADMIN_EMAIL`, `LOCAL_ADMIN_PASSWORD`, and `LOCAL_API_PORT` (see `.env.example`).

Local admin test login: `admin@quantumledger.local` / `Admin123!`. This account is for local testing only. Local signups are visible only to the local admin on this computer; they are not shared with the public Render site. Local mode does not send email.

## Project technologies

Vite, React, TypeScript, Tailwind CSS, Express, and PostgreSQL.

## Project info

**URL**: https://lovable.dev/projects/9665c96a-6f66-41a4-81f3-1d7ce3b5a569

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/9665c96a-6f66-41a4-81f3-1d7ce3b5a569) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/9665c96a-6f66-41a4-81f3-1d7ce3b5a569) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
