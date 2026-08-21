# Machine Ad Screen / Media Player — the company's #1 remaining need (Joe, 2026-08-21)

Joe: after OurVend API + MCOS + IMPACT, the two MAJOR things left for the whole company are:
1. **The Android ad-screen media player** — remotely load + **schedule** videos, control content,
   and **charge for ads** (ad revenue). ← this doc
2. **Digital lockbox code for refills** (see bottom).

## THE MACHINE SCREEN — what we know
- Machine screen = **Android** (TCN / Yunshu "YS"). Runs the vending app (tied to OurVend) + an ad player.
- Ad media (video ads AND the product ad images) is loaded by **dropping files into the "ES folder"**
  via **ES Explorer** (= ES File Explorer, the Android file manager app) — by **USB** or by **TeamViewer**
  (Joe's brother has done a few this way; slow, manual, crappy).
- New machines didn't ship with ES Explorer → vendor sent an **ES Explorer EPK file** they install on newer ones.
- **No remote way to control/schedule the ad screen today.** The dev hasn't cracked it. "It's all done
  from dropping a file in a folder, so it can't be that good a system" — likely no real scheduler.

## PATHS TO SOLVE (ranked — cheapest/most-proper first)
### A. OurVend's own Advertisement/Media module (CHECK THIS FIRST — cheapest win)
Many OurVend/TCN cloud portals have an **Advertisement / Media / Screen** section to upload media +
push to machines remotely (maybe with scheduling). We already reverse-engineered OurVend's private API
— if this module exists, we capture it (HAR) and automate media push + schedule from MCOS, same as we
did slots/codes. **OPEN: Joe to look for an "Advertisement"/"Media"/"Screen"/"广告" section in the
OurVend portal.** If it's there, this is the fast path.

### B. Build our own MediCube "Screen" Android app (the big win — his partner's instinct)
A lightweight **APK installed once per machine** (they can already install EPK/APK) that:
- pulls its **video playlist + schedule** from MCOS/cloud (Supabase storage or a URL),
- plays it on the screen on schedule, updates itself remotely (no more USB/TeamViewer),
- **reports what it's currently playing back to MCOS** → this ALSO powers the Command-Center "mirror
  what's on the machines" box,
- logs plays → feeds an **ad-manager layer in MCOS** (campaigns, schedule, impressions, billing → "charge for ads").
KEY UNKNOWNS to test on ONE machine before committing:
- Can a second app run alongside/over the TCN vending app without breaking vending? (kiosk/launcher lockdown?)
- Does each machine have reliable network access (WiFi/cellular) to pull media?
- Does the machine let us set our app as the ad/overlay layer, or is the ad player baked into the vending app?

### C. Semi-automate the current folder-drop (bridge, not the goal)
- ES File Explorer supports **FTP/network/cloud** sources — if we can point the machine's ES Explorer at a
  shared FTP/cloud folder, media could sync in without USB. Scheduling still limited to the vending app.
- TeamViewer unattended + file-transfer/scripting can automate what the brother does by hand — clunky, interim.

### What I need from Joe to chase these
- **Check OurVend for an Advertisement/Media section** (path A).
- **Send me:** the **ES Explorer EPK**, the **YS/TCN Android machine manual**, and **photos of the ad
  folder + any ad/schedule settings screen** on the machine → I'll hunt for a built-in scheduler or a
  network/URL media source (some TCN ad apps have a cloud/FTP pull = easy win).
- Access to **one test machine** (TeamViewer) to try path B safely.

HONEST NOTE: this is harder than the OurVend web work — it's ON-DEVICE Android, not a web API — but very
solvable. Path A is a quick check; Path B is the real product (remote, scheduled, monetizable, + mirrors
to the command center). We don't have the YS/TCN Android manual yet.

## SECOND MAJOR THING — DIGITAL LOCKBOX CODE FOR REFILLS
A digital/electronic lockbox on the machine service door that a refiller opens with a **code**. MCOS
already has a "lockbox generate" stub on Machine Ops. To make it REAL = integrate the actual lockbox
hardware's code system. **OPEN: what lockbox hardware is it?** (keypad smart-lock brand / model / any app
or API?) Once we know the device, we generate + assign + expire codes from MCOS like the OurVend pickup codes.
