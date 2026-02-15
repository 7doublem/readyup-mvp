# ReadyUp - Competitive Gaming Events Platform

A modern, full-stack competitive gaming events platform built with React, TypeScript, Firebase, Stripe, and Google Calendar. ReadyUp allows staff to create gaming tournaments and community members to sign up, pay entry fees, and add events to their Google Calendar.

## Live Demo

**Frontend:** [https://readyup-mvp.vercel.app](https://readyup-mvp.vercel.app)

**Backend (Stripe API):** [https://readyup-mvp.onrender.com](https://readyup-mvp.onrender.com)

> **Note:** The backend is hosted on Render's free tier, which spins down after 15 minutes of inactivity. The first payment request after a period of inactivity may take up to 30 seconds while the server wakes up. Subsequent requests will be fast.

## Features

- **Staff Event Creation**: Full event creation form with title, game, date, location, prize pool, entry fee, max participants, and description
- **Player Event Signup**: Join free events instantly or pay entry fees via Stripe Checkout
- **Real-Time Event Feed**: Live updates powered by Firestore `onSnapshot` — see slots fill up in real time
- **Stripe Payment Integration**: Secure payment processing for paid events using Stripe Checkout (test mode)
- **Google Calendar API**: Add events to your personal Google Calendar via OAuth 2.0, with a URL fallback
- **RAWG Game API**: Automatic game banners, Metacritic scores, and genre tags pulled from the RAWG Video Games Database
- **Role-Based Access Control**: Staff and player roles enforced by Firestore security rules
- **Staff Promotion**: Existing staff can promote registered users to staff from the dashboard
- **Avatar System**: Upload a custom avatar or choose from RAWG gaming prebuilts during signup
- **Profile Editing**: Change your gamertag and avatar at any time
- **Password Strength Meter**: Visual strength indicator during signup with validation rules
- **Gamertag Validation**: Must contain both letters and numbers, uniqueness enforced
- **Inline Form Validation**: Error messages displayed below each field with red border highlighting
- **Global Error Boundary**: Catches app crashes and shows a branded recovery screen
- **Loading Skeletons**: Animated placeholder cards while events are loading
- **Toast Notifications**: Success and error feedback for every user action
- **Responsive Design**: Mobile-first layout that scales to desktop using Tailwind CSS
- **Accessibility**: ARIA attributes, semantic HTML, screen reader text, and keyboard navigation

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite 7, Tailwind CSS v4 |
| Routing | React Router v7 |
| Backend | Node.js, Express 5, TypeScript, tsx |
| Database | Firebase Firestore (with security rules) |
| Authentication | Firebase Authentication |
| Payments | Stripe Checkout (test mode) |
| Calendar | Google Calendar API (OAuth 2.0) + URL fallback |
| Game Data | RAWG Video Games Database API |
| Notifications | react-hot-toast |
| Error Handling | react-error-boundary |
| Font | Orbitron (gaming-style) |
| Testing | Vitest + React Testing Library |
| Frontend Hosting | Vercel |
| Backend Hosting | Render |

## Prerequisites

Before you begin, ensure you have the following:

- **Node.js** 18.0 or later
- **npm** package manager
- A **Firebase** project with Authentication and Firestore enabled
- A **Firebase service account key** (JSON file, for seeding the database)
- A **Stripe** account (free, test mode)
- A **RAWG** API key (free from [rawg.io](https://rawg.io/apidocs))
- A **Google Cloud** project with the Calendar API enabled and an OAuth 2.0 client ID

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/7doublem/readyup-mvp.git
cd readyup-mvp
```

### 2. Install Dependencies

```bash
# Frontend
cd frontend && npm install

# Backend
cd ../backend && npm install

# Return to root
cd ..
```

### 3. Environment Setup

Create `frontend/.env.local`:

```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
VITE_RAWG_API_KEY=your_rawg_api_key
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id
VITE_BACKEND_URL=http://localhost:4242
VITE_APP_URL=http://localhost:5174
```

Create `backend/.env`:

```env
GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
FRONTEND_URL=http://localhost:5174
```

Place your Firebase service account JSON file at `backend/service-account-key.json`.

### 4. Seed the Database

This creates two test users and 5 sample gaming events:

```bash
npm run seed
```

### 5. Run the Development Servers

Start both servers in separate terminals:

```bash
# Terminal 1 — Frontend (runs on http://localhost:5174)
cd frontend && npm run dev

# Terminal 2 — Backend / Stripe server (runs on http://localhost:4242)
cd backend && npm run dev
```

Open [http://localhost:5174](http://localhost:5174) in your browser.

## Test Credentials

The seed script creates two accounts you can use immediately:

| Role | Email | Password |
|---|---|---|
| Staff | `staff@readyup.gg` | `ReadyUp2026!` |
| Player | `player@readyup.gg` | `ReadyUp2026!` |

**Staff** can create events, promote users to staff, and join events.

**Players** can browse events, join free events, pay for paid events, and add events to Google Calendar.

## Testing Payments (Stripe)

Stripe is in **test mode** — no real money is ever charged. Use the following test card details:

| Field | Value |
|---|---|
| Card Number | `4242 4242 4242 4242` |
| Expiry | Any future date (e.g. `12/34`) |
| CVC | Any 3 digits (e.g. `123`) |
| Postcode | Any value (e.g. `12345`) |

To test a **declined payment**, use card number `4000 0000 0000 0002`.

## Testing Google Calendar

The Google Calendar integration uses OAuth 2.0. When you click "Add to Google Calendar" on an event you've joined:

1. A Google consent popup will appear
2. Sign in and grant calendar access
3. The event is inserted directly into your primary Google Calendar

> **Note:** As the app has not completed Google's verification process, you may see a warning screen saying "Google hasn't verified this app" when granting calendar access. This is expected for development/testing projects. Click **"Advanced"** then **"Go to readyup-mvp (unsafe)"** to proceed. This has been tested thoroughly and the app only requests permission to add events to your calendar — nothing else. If the OAuth popup is unavailable, the app falls back to opening a Google Calendar URL in a new tab.

## Building for Production

```bash
cd frontend
npm run build
```

This compiles TypeScript and generates an optimised production build in `frontend/dist/`. You can preview it locally with:

```bash
npm run preview
```

## Running Tests

```bash
cd frontend
npx vitest
```

Test cases cover:

- Navbar rendering
- Join button disabled state when event is full
- Google Calendar URL generation with correct date format and parameters

## Deployment

### Frontend (Vercel)

1. Push your code to GitHub
2. Connect your repository to [Vercel](https://vercel.com)
3. Set the **Root Directory** to `frontend`
4. Add all `VITE_*` environment variables in the Vercel dashboard
5. Set `VITE_BACKEND_URL` to your Render backend URL
6. Deploy automatically on every push

### Backend (Render)

1. Connect your repository to [Render](https://render.com)
2. Create a new **Web Service**
3. Set the **Root Directory** to `backend`
4. Set **Build Command** to `npm install`
5. Set **Start Command** to `npx tsx server.ts`
6. Add environment variables: `STRIPE_SECRET_KEY` and `FRONTEND_URL` (your Vercel URL)
7. Deploy

### Post-Deployment Checklist

- Add your Vercel domain to **Firebase Console > Authentication > Settings > Authorized domains**
- Add your Vercel URL to **Google Cloud Console > Credentials > OAuth 2.0 Client > Authorized JavaScript origins** and **Authorized redirect URIs**
- Add your Vercel URL to **Stripe Dashboard > Settings > Public details > Website**

## Security Considerations

- **Password Security**: Firebase Authentication handles all password hashing, salting, and session management. Passwords are never stored or transmitted in plain text.
- **Payment Security**: Stripe Checkout is fully PCI compliant. Card details are entered on Stripe's hosted page and never touch our servers.
- **Firestore Security Rules**: Role-based access control is enforced at the database level. Players can only add themselves to event attendees. Users cannot set their own role to staff. Only staff can create, delete, or fully update events.
- **Environment Variables**: All API keys and secrets are stored in environment variables, never hardcoded in source code. The `.env` files and Firebase service account key are gitignored.
- **Input Validation**: Client-side validation on all forms (gamertag format, email format, password strength, event field types and ranges) with server-side Firestore rules as a second layer.

## Firestore Security Rules

The security rules enforce the following access patterns:

| Collection | Action | Who Can Do It |
|---|---|---|
| `events` | Read | Anyone (public) |
| `events` | Create / Delete | Staff only |
| `events` | Update (all fields) | Staff only |
| `events` | Update (join queue) | Logged-in users (can only add own UID to attendees) |
| `users` | Read | Any authenticated user |
| `users` | Create | Authenticated user creating their own profile (role must be "user") |
| `users` | Update (own profile) | Authenticated user (cannot change their own role) |
| `users` | Update (any profile) | Staff (can change roles for promotion) |

## Known Limitations

- **Render Cold Starts**: The backend free tier spins down after ~15 minutes of inactivity. The first request after inactivity takes ~30 seconds to respond.
- **Google Calendar Testing Mode**: If the Google Cloud app is in "Testing" mode, only users added as test users in the OAuth consent screen can use the Calendar API. Alternatively, the app can be published to allow any Google account.
- **Avatar Storage**: Avatars are stored as base64 strings or URLs directly in Firestore documents (no Firebase Storage for MVP simplicity).
- **No Confirmation Emails**: Email notifications for event signups are not implemented (listed as a possible extension in the project brief).
- **No Social Login**: Google or social media login is not implemented (listed as a possible extension in the project brief).

## Possible Future Extensions

- **Confirmation Emails**: Send email notifications when users sign up for events
- **Social Media Login**: Google, Discord, or other social media authentication
- **Mobile App**: React Native companion app sharing the same Firebase backend
- **Social Media Integration**: Share events on Twitter, Discord, or Instagram
- **Event Chat**: Real-time chat for registered participants
- **Leaderboards**: Track player wins and rankings across tournaments
- **Pay As You Feel**: Variable entry fee option for community events

## External APIs Used

| API | Purpose | Docs |
|---|---|---|
| RAWG Video Games Database | Game images, Metacritic scores, genres | [rawg.io/apidocs](https://rawg.io/apidocs) |
| Google Calendar API | Insert events into user's calendar via OAuth 2.0 | [developers.google.com/calendar](https://developers.google.com/calendar/api/v3/reference) |
| Stripe Checkout | Secure payment processing for paid events | [stripe.com/docs](https://stripe.com/docs/checkout) |
| Firebase Authentication | User registration, login, and session management | [firebase.google.com/docs/auth](https://firebase.google.com/docs/auth) |
| Firebase Firestore | Real-time NoSQL database for events and users | [firebase.google.com/docs/firestore](https://firebase.google.com/docs/firestore) |

---

Built for the Skills Bootcamp: Software Developer Events Platform Project
