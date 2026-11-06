# Setting up accounts and sync

With a free Supabase project, anyone can create an account on the site (email and password), sign in on
any device, and keep their own progress: journey, Tempo ladder history, songs, trainer settings and best
streaks. Changes show up on their other devices within a second or two. Nobody can see anyone else's progress.

Until this is set up, the site works exactly as before: progress is kept on each device only.

This takes about 10 minutes and is only needed once.

## 1. Create the project

1. Go to <https://supabase.com>, sign up (you can use your GitHub account) and click **New project**.
2. Name it, for example `music`. Choose a **database password** and keep it somewhere safe (the site doesn't
   need it, but you might later). Pick a **region** close to you, for example *Central EU (Frankfurt)*.
3. Under **Security**, use these settings:
   - **Enable Data API:** on (the site needs it).
   - **Automatically expose new tables:** off. New tables then stay private until you give access
     yourself; the setup SQL in step 2 gives the progress table exactly the access it needs.
   - **Enable automatic RLS:** on, as a safety net for any table you add later.
4. Keep the **Free** plan and click **Create new project**. It takes a minute or two to start.

Before you go on, have a look at Supabase's terms (<https://supabase.com/terms>) to check they fit how you
want to use it, the same way you checked Firebase's.

## 2. Create the table and rules

1. In the menu on the left, open **SQL Editor** and click **New query**.
2. Open `supabase-setup.sql` from this repository, copy all of it, paste it in, and click **Run**.
   You should see *Success. No rows returned*.

This creates the `progress` table (one row per person), the security rules that let each person reach only
their own row, the merge step that combines changes from several devices, and "delete my account".

## 3. Tell Supabase where the site lives

1. Open **Authentication → URL Configuration**.
2. **Site URL:** `https://rubensanders28.github.io/music/`
3. Under **Redirect URLs**, add both of these (the second one is for testing on your computer):
   - `https://rubensanders28.github.io/music/**`
   - `http://localhost:8765/**`

These are the pages that confirmation and password-reset emails are allowed to send people back to.

## 4. Check the sign-in settings

1. Open **Authentication → Sign In / Providers** (in some versions: **Providers**) and check that **Email**
   is turned on. It is by default.
2. Leave **Confirm email** on: new accounts then get an email with a link to confirm their address,
   which stops people signing up with someone else's email.
3. If you see a setting for the **minimum password length**, set it to 8, to match the site.

## 5. Connect the site to the project

1. Open **Project Settings → API** (in some versions: **Data API** and **API Keys**).
2. Copy the **Project URL** and the **anon** key (in newer versions it's called the **publishable** key).
   Don't use the **service_role** or **secret** key: that one must never be put in a website.
3. In `sync.js`, fill them in near the top:

```js
const SUPABASE_URL = "https://abcdefghijkl.supabase.co";
const SUPABASE_KEY = "eyJhbGciOi...";   // or "sb_publishable_..."
```

Both are meant to be public, so they're fine in a public repository: the security rules from step 2 are
what protect people's data. You can also send me these two values and I'll put them in.

## 6. Create your account

1. Push the change, then open the site **on the device that has your progress** (your laptop) first.
2. Click **☁ Sign in** at the end of the menu, then **Create an account**. Confirm your email address
   with the link you receive, and you're signed in. The progress on this device goes into your account.
3. On your phone, click **☁ Sign in** and sign in with the same email and password. Your progress appears.
   If the phone had some progress of its own that your account doesn't have yet, it asks whether to add it.

## Good to know

- **Signing out clears the device.** Your progress stays in your account, but it's removed from that
  device, so on a shared computer the next person starts fresh.
- **Delete my account** (click your name in the menu) removes the account and all its progress for good.
- **Each saved item syncs as a whole**, and the most recent change wins. For example, all of the Tempo
  ladder (exercises and history) is one item. If you practise on two devices at the same time while one
  of them is offline, the device that saves last wins for that item.
- **Free plan limits** are generous for this kind of site, with two to keep in mind:
  - Supabase **pauses a free project after a week without any use**. If that happens, the sign-in button
    shows a problem; open the Supabase dashboard and click **Restore project**.
  - The **built-in email sender** only sends a few emails an hour (account confirmations and password
    resets). That's fine for you and some friends. If many people sign up, connect your own email service
    under **Authentication → Emails → SMTP Settings** (services like Resend or Brevo have free plans).
- **Other people's data:** once friends (or anyone) create accounts, you're looking after their email
  address and practice progress. If you open the site up more widely, add a short privacy note saying
  what's stored and that people can delete their account at any time. Under EU rules (GDPR) that's expected.
