# OurVend — the recording script (Claude Chrome), and what it unblocks

Rewritten 2026-08-22 for the live-machine session. School goes live in 3 days.

The empty template machines are **offline**, so recording has to happen on a **live** machine.
Every action below is therefore chosen so it **cannot change anything**.

---

## HOW TO RECORD (same each time)
1. Log in to OurVend in Chrome **first** — before you start recording. A recording taken across
   the login carries the password and session cookie. If one does, say so: it never goes in the
   repo (hard rule 5).
2. **F12** → **Network** tab → tick **Preserve log**.
3. Do **ONE** action from the list. Nothing else.
4. Right-click the request list → **Save all as HAR with content**.
5. Name it after the action and send it.

---

## 🔴 1. OPEN ONE COIL → PRESS SAVE → **CHANGE NOTHING**
Pick any machine, open a coil, press save without touching a single value.

**Safe because it writes back the values already there** — the machine sees no change. But the
request is identical in shape to a real edit, so it hands us the true save URL and every field.

*Unblocks:* everything. `POST /Selection/Edit` (the recipe we had) 404s, and that alone is why
Atlas cannot push a planogram. Nothing else in the push path is broken.
Likely real endpoints, from the page's own script: `/Selection/SEdit`, `/Selection/MultiEdit`.

## 🔴 2. ADD ONE PRODUCT, WITH AN IMAGE — **BITES Creatine Gummies**
Add it the way you normally would: image, size, unit price, supplier, type, description.

**Safe because it touches no machine** — catalog only. And it is one of the six we actually need,
so it is real work, not a test.

*Unblocks:* the catalog gate. We proved OurVend **refuses to create a product without an image**
(its own code: *"Please choose a commodity image"*), and it requires supplier + type. This one
capture gives the supplier id, the type id, the image encoding and the full `AddCI` payload.

## 🟡 3. (optional, read-only) OPEN THE SALES REPORT AND LET IT LOAD
Pick a date range, let the table fill. Nothing is written.

*Unblocks:* the sales feed, which has never returned data. We know the call is
`/SaleSummarize/ListJson` with `Categories · MiGroup · MachineID · boxId · StartDate · EndDate ·
Statistics`. We send all of them; **`boxId` is the suspect** — the page fills it from its parent
frame and we send it empty.

**NOT on the critical path** (Joe, 2026-08-22): inventory truth comes from the refiller pressing
the refresher on the machine screen → OurVend → us. Sales is business intelligence — what sells,
what a location earns. Grab it only if you are already in there with a spare minute.

---

## THE SIX PRODUCTS BLOCKING PLANOGRAM PUSHES
One missing product fails a whole planogram, so these gate everything:
- **ASU West Campus 1** — coil 53 **BITES Creatine Gummies**
- **UNLV Tonopah 1** — coil 1 Clear Blue Pregnancy Test · coil 7 Beast Bites 30 Gummies ·
  coil 9 Creatine Gummies 30 gummies · coil 38 Dove Bar Soap · coil 43 Chapstick Cherry

Each needs its **own product image** at creation — a shelf photo will not do (the form runs a
cropper and expects a single-product picture).

---

## STILL OPEN, WORTH KNOWING BEFORE LAUNCH

**We share one OurVend login with the crons.** `ourvend-auto-login` fires hourly and
`ourvend-fleet-sync` every 20 minutes on the same account. If OurVend is one-session-per-account,
a cron can log you out mid-recording. **I can pause all four crons while you record** — say the
word and I will.

**Which price does the customer pay?** Each coil carries `SiPrice` (cloud) and `SiCustomPrice`
(machine). Capture #1 shows what the portal sends for both, and since OurVend now writes down
into the machine, this decides whether a price change actually reaches the customer.

**Capacity is still fake on most machines** — 99/199 factory defaults make every low-stock
percentage meaningless. Real capacity comes from coil pitch (28mm=15, 38mm=11, 60mm=7, 70mm=6,
86mm=5).

**We only read one warehouse** (`Type=0`). If any campus's products live in another warehouse,
our catalog is incomplete and those coils fail the gate.

**Test residue:** "MCOS TEST 2" (code 999002) is still in the live catalog — delete it.

**Aliyun bot wall:** OurVend already answers 200-with-no-rows when a session has not visited the
owning page. Combined with writes reaching live machines, the push must go **one coil at a time,
verified** — write, read back, compare, continue; stop on the first mismatch.
