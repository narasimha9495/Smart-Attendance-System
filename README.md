# Smart Attendance System (MERN)

A proxy-proof attendance platform. A student is marked present only when **all**
verification layers pass at once:

1. **College-ID login** (identity)
2. **Live face scan** matched against an enrolled embedding, with a **blink liveness** check
3. **In-room rotating code** (TOTP-style) the teacher shows in class, backed by a **GPS geofence**

Plus: timetable-driven sessions (a teacher can only open their scheduled class),
a live dashboard, automatic **75%-style** records, **Excel export**, and
automatic **WhatsApp alerts** to parents of absent students on Save.

---

## Tech stack

- Frontend: React + Vite, face-api.js (face detection, embeddings, blink liveness), qrcode.react + html5-qrcode (in-room QR), recharts (analytics), socket.io-client
- Backend: Node.js + Express, Socket.io, JWT + bcrypt, SheetJS (xlsx), Twilio (WhatsApp/SMS)
- Database: MongoDB (Mongoose)
- Security: helmet, express-rate-limit, express-mongo-sanitize, express-validator

## What's included

- **Landing page** describing the product, then role-based login.
- **Face model weights are bundled** in `frontend/public/models/` — recognition works with no extra download.
- **QR-based in-room code**: teacher shows a rotating QR, student scans it (or types the code).
- **Analytics dashboard**: per-student attendance %, 75% reference line, defaulter list, class average (recharts).
- **Production hardening**: input validation on every write route, rate limiting (login + marking), NoSQL-injection sanitization, security headers, central error handler, and env validation on boot.

## Algorithms used

- Face detection: Tiny Face Detector (CNN)
- Face alignment: 68-point landmarks
- Face recognition: 128-d embedding (FaceNet/ResNet style) + Euclidean-distance match
- Liveness: Eye Aspect Ratio (EAR) blink detection
- In-room code: TOTP (HMAC-SHA1 over a time counter)
- Link token: JWT signed with HMAC-SHA256, short expiry
- Geofence: Haversine distance
- Auth: JWT + bcrypt, role-based access

---

## Prerequisites

- Node.js 18+ and npm
- MongoDB (local `mongod`, or a free MongoDB Atlas cluster)

---

## 1. Backend setup

```bash
cd backend
npm install
copy .env.example .env      # Windows (PowerShell: Copy-Item .env.example .env)
# then edit .env: set MONGO_URI, JWT_SECRET, LINK_SECRET (Twilio optional)
npm run seed                # creates demo admin/teacher/students + a class active NOW
npm run dev                 # starts API on http://localhost:5000
```

Demo logins (password is `password123`):

- Admin: `ADMIN01`
- Teacher: `TCH01`
- Students: `S001`, `S002`, `S003` (section CSE-B)

## 2. Frontend setup

(Face model weights are already bundled in `frontend/public/models/` — nothing to download.)

```bash
cd frontend
npm install
copy .env.example .env      # sets VITE_API_URL=http://localhost:5000
npm run dev                 # opens http://localhost:5173
```

---

## How to test the full flow

1. Log in as **student S001**, enroll your face on the home screen.
2. Log in as **teacher TCH01** (new tab/browser) — the seeded class is active now.
   Click **Start attendance**. A rotating code and a student link appear.
3. Back as the student, open the student link (or `/attend/<linkToken>`), scan your
   face (blink when prompted), enter the code shown on the teacher screen, and submit.
4. The student pops up live on the teacher's **Present** list.
5. Teacher clicks **Save & alert parents** — absent students are recorded and their
   parents' WhatsApp alerts are queued (logged to the backend console if Twilio keys
   aren't set). Then **Download Excel**.

## Notes / real deployment

- Camera + GPS only work over **HTTPS** (or `localhost`). Deploy behind HTTPS
  (Vercel/Render give it free) so phones can use the camera and location.
- Set each classroom's real `roomLat` / `roomLng` / `radius` in the timetable.
- For production WhatsApp, use the verified WhatsApp Cloud API; the Twilio sandbox
  is fine for demo.
- Web Bluetooth (BLE beacons) isn't supported on iOS Safari, which is why the
  in-room proof here is a rotating QR/code rather than BLE.

## Folder structure

```
smart-attendance/
  backend/   Express API, models, routes, algorithm utils, seed
  frontend/  React + Vite app (login, admin, teacher, student flows)
```
