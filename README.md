# Madaris Software — مدارس سافٹ ویئر

**Complete online Madrasa Management System in Urdu (RTL)** — طلبہ، حاضری، شعبہ حفظ و ناظرہ، فیس، امتحانات، مالیات، رول بیسڈ صارفین اور وٹس ایپ الرٹس.

Built for madaris in Pakistan: hifz & nazra sabaq tracking (سبق، سبقی، منزل), Dars-e-Nizami classes, fee ledgers, printable result cards using the ممتاز / جید جداً / جید / مقبول / راسب grading scale, and per-user records — every user (منتظم / استاد / محاسب) signs in with their own login and everything they enter is recorded under their name.

## What's inside

| Part | Description |
|---|---|
| `index.html` | Urdu landing website (features, modules, PKR pricing with WhatsApp checkout, FAQ) |
| `app/` | Admin panel (single-page app, Urdu RTL, works fully offline, data in localStorage) |
| `server/` | Zero-dependency Node.js REST API (same resources, file-backed JSON store) |
| `docs/` | Feature list and API reference |

## 11 modules

Dashboard with today's stats & "my sabaq" · Students (guardian, previous madrasa, active/left) · Teachers & staff · Hourly attendance · Hifz & Nazra sabaq log (para, surah, ayat, pages, mistakes, stuck/اٹکان, سامع, quality) · Fees (charges, collection, receipts, student ledger, defaulter WhatsApp reminders) · Exams & results (auto total/percent/grade/position, printable result card) · Finance (income/expense, accounts, receipt numbers) · Announcements + absent-student WhatsApp alerts · Users & roles (own logins, own records) · Settings (madrasa profile, classes, JSON backup/restore)

## Demo logins

| Role | Email | Password |
|---|---|---|
| منتظم (Admin) | admin@madaris.pk | admin123 |
| استاد (Teacher) | ustad@madaris.pk | ustad123 |
| محاسب (Accountant) | muhassib@madaris.pk | hisab123 |

## Run it

- **Just the website + app:** open `index.html`, or serve the folder: `npx serve .`
- **With the API:** `cd server && node server.js` → http://localhost:8080 (API at `/api/...`)

## Contact / licensing

© Masood Azhar — WhatsApp 0346 2469006 · azharmasoos479@gmail.com · Kohat, Pakistan
