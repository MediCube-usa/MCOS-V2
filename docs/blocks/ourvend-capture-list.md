# OurVend — the capture list (what Joe records in Chrome) + everything still risky

Written 2026-08-22, three days before the school goes live. Purpose: find every OurVend
problem NOW, on the ground, instead of at game time.

---

## PART 1 — WHAT TO RECORD (do these in Chrome, one at a time)

### How to record (same every time)
1. Open OurVend in **Chrome**.
2. Press **F12** → click the **Network** tab.
3. Tick **Preserve log**.
4. Do **ONE** action from the list below. Nothing else.
5. Right-click anywhere in the request list → **Save all as HAR with content**.
6. Name the file after the action (e.g. `1-save-coil.har`) and send it.

**Do the login BEFORE you start recording** — a HAR taken across the login carries the
password and session cookie. (If one does, say so and we treat it as a secret: it never goes
in the repo, per hard rule 5.)

One action per file. A HAR with ten things in it is much harder to read than four clean ones.

---

### 🔴 1. SAVE ONE COIL — the blocker, most important
On any machine, change **one** coil (product, price, or quantity) and press save.

*Why:* `POST /Selection/Edit` — the recipe we have — returns 404. This is the single thing
standing between us and Atlas pushing planograms. Nothing else in the push path is broken.

### 🔴 2. ADD A NEW PRODUCT, WITH AN IMAGE
Add one of the six missing products (BITES Creatine Gummies is the one we need for ASU West),
filling in **image + size + description** the way you normally would.

*Why:* the catalog gate. OurVend refuses a coil whose product isn't already in its catalog, so
one missing product fails a whole planogram. Six are missing today. Also confirms exactly which
field the description goes in when WRITING (we now know the read side: `PrContent`).

### 🟠 3. CLONE ONE MACHINE ONTO ANOTHER — do this on two machines that are NOT live
Apply one machine's layout onto another and save.

*Why:* this is "apply a planogram" in OurVend. **We must be certain which side is source and
which is target.** If we have it backwards, a push would copy an empty machine over a stocked
one. Please use two test machines (`2602080924`, `2602080931`), never a campus machine.

### 🟠 4. CLEAR / EMPTY A COIL
Remove a product from a single coil.

*Why:* planograms change. `/Selection/ClearSoltInfo` and `ClearSoltInfoAll` exist on the page —
we need to know which is one coil and which is the whole machine, so we never fire the wrong one.

### 🟡 5. OPEN THE SALES REPORT and page through it once
Open Sales, pick a date range, let the table load.

*Why:* the sales feed has never worked (returns empty). It's what makes inventory draw down
automatically instead of you guessing. **I may be able to fix this myself** — see Part 3 — so
treat this one as optional; skip it if you're short on time.

### 🟡 6. GENERATE PICKUP CODES
Generate a batch of codes on a machine, then open the list of codes.

*Why:* this is the Narcan/IMPACT redemption side. Not needed for the school launch, but it's
the next mission and it's cheap to capture while you're in there.

---

## PART 2 — WHAT ELSE ON OURVEND COULD BITE US

### ⚠️ We share one OurVend login with the crons — this can log you out mid-recording
`ourvend-auto-login` re-logs in **every hour**, and `ourvend-fleet-sync` reads **every 20
minutes**, on the same account you use. If OurVend allows only one session per account, our
cron can kick you out while you're recording (or your login invalidates our cookie and the
readers stall until the next self-heal).

**Fix for the session: I can pause all OurVend crons while you record, and switch them back on
after.** Say the word. (Jobs: `ourvend-auto-login`, `ourvend-fleet-sync`, `ourvend-catalog-sync`,
`slot-history-snapshot`.)

### ⚠️ Two different prices per coil — which one does the customer actually pay?
Each coil carries `SiPrice` (cloud) and `SiCustomPrice` (machine). Our notes say the machine can
hold its own price and lag the cloud, which is why "differs" flags show up. **Before launch we
need to know which one the machine charges**, or we can set a price in OurVend and the machine
still takes the old one. Capture #1 will show what the portal sends for both.

### ⚠️ "Capacity" has to mean the real coil capacity
Several machines still report the factory defaults (99/199), which makes every low-stock
percentage meaningless. Real per-slot capacity comes from the coil pitch (28mm=15, 38mm=11,
60mm=7, 70mm=6, 86mm=5). Until real capacities are in, refill triggers can't be trusted.

### ⚠️ The catalog is one warehouse
We read `Type=0` (Local warehouse) only. If products for another campus live in a different
warehouse, our catalog is incomplete and those coils would fail the gate. Worth one look.

### ⚠️ Matching by name is fragile
"Playtex Sport" in the machine vs "Platex Tampon" in the catalog; "Advil " has a trailing space.
Planograms built from photos match on name, so near-misses are possible. Every coil now shows
its catalog image on the Planograms board — that visual check is the safety net.

### ⚠️ Test residue still live
**"MCOS TEST 2" (code 999002)** is sitting in the live OurVend catalog. Should be deleted.

### ⚠️ Aliyun bot wall
OurVend sits behind Aliyun WAF (`aliyungf_tc` cookie). It already answers 200-with-no-rows when
a session hasn't "visited" the page. Pushing 40 coils in a row is more traffic than it's used
to — the planogram push should pace itself and stop on the first failure rather than hammer.

---

## PART 3 — WHAT I CAN TRY WITHOUT YOU

**Tried it — the sales reader already does the page visit, so that wasn't its problem.** But
reading the sales page's own scripts gave up the real call:

```
url: '/SaleSummarize/ListJson'   (there is also ListJsonPro for per-product, and
                                  ListJsonExp / ListJsonProExp for the exports)
postData: Categories · MiGroup · MachineID · boxId · StartDate · EndDate · Statistics:"0"
```

Our reader already sends every one of those. Two clues from the page:
- it runs inside an **iframe** (`window.parent.getSessInfo()`), and
- **`boxId`** is filled from the surrounding page, and we send it empty.

`boxId` is the prime suspect. **Item #5 stays on the list** — but now it is a cheap capture and
I know exactly what to look for: the real `boxId` value and the date format the picker sends.
