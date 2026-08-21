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

## FINDINGS FROM JOE'S PHOTOS (2026-08-21) — three real seams
Photos: the machine's Android controller board + a TeamViewer session into the machine's ES File
Explorer (sdcard root) + a config/manifest text file.
- **Machine is networked:** controller has **RJ45 WAN** + **SIM port** (+ USB1/2/3, COM1 485, COM2,
  COM3). So an on-device cloud pull / remote management is viable (it has internet).
- **`advert.txt` sits in the sdcard root** → almost certainly the **ad config/playlist file** the
  screen reads. Media folders present: **Movies** (video ads), **Pictures** / **imageloader** /
  **look** (image ads). Plus `TcnConfig`, `YsConfig`, `TcnFolder`, `YsDownloadFile`, `MachineData`,
  `TcnKey`, `TcnLog`, `elog.txt`, `tcn_config_dex.txt`, and **`TcnVending.apk`** (the vending app installer).
- **`AirDroidBiz` is ALREADY INSTALLED on the machine** (AirDroid Business = a full Android **fleet
  MDM**: remote file push, app management, scheduling, remote view — from a web console + API).
  This is a remote channel far better than TeamViewer, and it's already there.
- **TCN cloud backend host = `tcnvmms.com`** — the manifest shows machines (by `androidSN`, e.g.
  `SUAK1K518QY...`) pulling APK/skin updates from `http://tfs.android.tcnvmms.com:4103/Android/YsSystem/
  UpdateApp/TCN_SKIN_WxOffline/...apk`. App package = **`com.tcn.tcnstand`**, skin `TCN_SKIN_WxOffline`.
  So TCN has its own VMMS cloud that pushes files to machines by serial — a possible remote ad-push too.

### NEXT (turn these seams into control)
1. **Read `advert.txt`** (open it in ES Explorer → send contents). That's the ad playlist format — if we
   can read+write it and drop files in Movies/Pictures, we CONTROL what plays (the loophole Joe wanted).
   Also grab `TcnConfig` / `YsConfig` if openable.
2. **AirDroid Business** — does Joe have the AirDroid Business account/console login? If yes: remote
   file push + scheduling to ALL machines from one dashboard (and an API we can drive from MCOS). Likely
   the fastest real remote solution; it's already installed.
3. **TCN VMMS cloud** (tcnvmms.com) — does Joe have a TCN cloud login? If it pushes APKs by serial, it
   may push ad media too. Worth a look.

## REALITY CHECK — Joe's 2 years of experience (2026-08-21, corrects the optimism above)
- **TCN gives NO API/SDK to customers.** 2 years in, only channels ever offered = clunky TeamViewer or
  USB-by-hand. `tcnvmms.com` is TCN's OWN internal update server the machine phones home to — Joe has
  NO login to it. Cross off "TCN cloud login" as a path.
- **The machine is KIOSK-LOCKED.** Android **7.1.2**; the YS app (`com.tcn.tcnstand`) auto-starts and
  **keeps other apps off / restricted** — it's effectively the launcher/device-owner with a watchdog.
  Joe & partner have tried repeatedly to install their OWN APK agent to phone home / control the box;
  **the agents get killed or "just disappear."** → So "build & install our own player app" (Path B) is
  EXACTLY what keeps failing. Do NOT lead with that. AirDroidBiz folder may be a DEAD leftover from such
  an attempt, not a working install — CONFIRM before trusting it.
- **The ONLY channel that reliably works = dropping files into the ES/advert folder** (USB or TeamViewer).
- Key implication: the win must run THROUGH the allowed file-drop + `advert.txt`, NOT through a rogue app.
- Joe is sending the **ES Explorer APK** TCN shipped for the new machines. ES File Explorer is TCN-approved
  (so it's ALLOWED to run) and has built-in **FTP server / LAN / cloud** features — leveraging the app
  that's already permitted to receive files over the network is more promising than a killed rogue agent.
- Ads must land on the **main TCN Android 7.1.2 interface** (NOT a card-reader clip like Nayax/Cantaloupe).
- Fragile idea (kill YS app → load → restart): watchdog re-kills; unreliable. Avoid.

### ES APP IDENTIFIED = ES File Explorer 4.0.2 (old full version)
Joe sent it (came as an iOS placeholder link, not the APK bytes, but the filename = ES文件浏览器_4.0.2).
ES 4.0.2 has a built-in **FTP server / "Remote Manager"** + LAN/SMB + cloud client. HONEST CATCH:
the machine is behind **WAN/SIM NAT** — a server hosted ON the machine (inbound) generally CAN'T be
reached from the internet (cellular = carrier NAT, campus WAN = firewalled). So "machine as FTP server"
only works on a LOCAL network, NOT remotely across campuses. NAT-friendly = the machine must PULL
(outbound), not be pushed to. So the remote answer is NOT ES-as-server.
### ⭐ BREAKTHROUGH FROM SETTINGS/APP-DRAWER PHOTOS (2026-08-21)
- **The router is a Teltonika RUT241** (machine Wi-Fi SSID `RUT241_ED94`). This is an INDUSTRIAL 4G
  router with **Teltonika RMS (Remote Management System)** + **VPN (OpenVPN/WireGuard) + port-forwarding
  + remote-access-to-LAN-devices**. IT IS JOE'S OWN EQUIPMENT (no TCN gatekeeping). → This SOLVES the NAT
  problem: via RMS or a router VPN/port-forward we can reach the machine's LAN REMOTELY. So "ES-as-server"
  is back ON the table — the ROUTER is the way in, not the public internet directly.
- **The kiosk is NOT total.** App drawer shows utility apps coexisting with TcnVending: **ES File Explorer,
  Chrome, ComAssistant, Host (TeamViewer Host = unattended), QuickSupport (TeamViewer), Gallery, Music,
  Camera, Calculator, Settings** — 15 apps. So TCN-approved/whitelisted apps survive; only Joe's UNKNOWN
  sideloaded agent got removed. TeamViewer **Host** is persistent (outbound, beats NAT) — proven channel.
- **Constraints:** Storage 4.09 GB (1.56 used) and RAM ~1.9 GB total → keep ad video files MODEST.
  Android **7.1.2**, user = "Owner", TZ Pacific. "System Reboot" available in Settings.

### ⭐ THE REMOTE PIPELINE THIS UNLOCKS (no new app, no TCN, no rogue agent)
**Teltonika RUT241 (RMS/VPN/port-forward) → reach the machine's LAN remotely → ES File Explorer's built-in
FTP/"Remote Manager" (already on the machine, allowed) receives files → drop media into the advert folder +
write `advert.txt` → ads change.** All Joe's own gear (router + the TCN-approved ES app). Automate the whole
chain from MCOS. NEEDS: (1) Joe manages the RUT241 (login / Teltonika RMS account); (2) enable ES FTP once;
(3) advert.txt format. This routes AROUND TCN entirely.

### ✅✅ advert.txt FORMAT CRACKED (2026-08-21) — it's plain JSON, scheduling built in
Opened via ES Note Editor. `advert.txt` = a JSON ARRAY of ad entries. Real example from the machine:
```
[{"AdSite":2,"AdType":2,"DefaultAds":"true","IsDefault":"0","PlayTime":"0-24",
  "EndTime":"2099-12-30T00:00:00","AdContent1":"a2f1d5b7-2291-4fa5-8fa3-13852180084.png"},
 {"AdSite":6,"AdType":2,"DefaultAds":"true","IsDefault":"0","PlayTime":"0-24",
  "EndTime":"2099-12-30T00:00:00","AdContent1":"...e153b4ef48be.png"}]
```
Fields decoded:
- **AdContent1** = the media FILE NAME (GUID.png here) — LOCAL file (not a URL). Media must live on the
  machine; advert.txt points to it by name. (OPEN: which folder holds these — likely `imageloader`/`look`/
  `Pictures`; confirm.)
- **AdType** = media type. `2` = IMAGE (.png). Video type # unknown (the `Movies` folder implies video is
  supported — need ONE video-ad example or a test to learn the video AdType value).
- **AdSite** = screen zone/slot (`2` and `6` seen — e.g. idle full-screen vs another region; confirm mapping).
- **PlayTime** = "0-24" → HOURS-OF-DAY SCHEDULE window. ← SCHEDULING IS BUILT IN.
- **EndTime** = expiry timestamp ("2099-...": never). ← campaign expiry built in.
- **DefaultAds**/**IsDefault** = default-ad flags.
⇒ We do NOT need to build a scheduler — TCN's player already schedules via PlayTime + EndTime. To change
ads = (1) drop the media file on the machine, (2) write advert.txt entries referencing it with the
AdSite/AdType/PlayTime/EndTime you want. THAT'S THE WHOLE CONTROL SURFACE.

### FULL SOLUTION (now concrete)
MCOS becomes the **ad manager**: campaigns (advertiser, media, machines, schedule via PlayTime/EndTime,
price → billing) → generates `advert.txt` + delivers media → pushes to each machine over the **RUT241
router (RMS/VPN) → ES File Explorer FTP** pipeline (or TeamViewer as fallback) → the machine plays on
schedule. Remaining unknowns before build: (a) media folder path for AdContent, (b) video AdType value,
(c) does the YS app hot-reload advert.txt or need a nudge/reboot. All small, answerable by 1-2 tests.

### ⭐⭐ LIVE RECON RESULTS (2026-08-21 AM, via TeamViewer into "UNLV Tonopah Hall")
- **AD MEDIA FOLDER = `VideoAndImageRemote`** (self-named "video and image, remote"). This is almost
  certainly where the ad player pulls `AdContent1` files from. FINAL CONFIRM PENDING: that
  `a2f1d5b7-…png` + `All adGummies.mp4` sit inside it + its exact full path (likely
  `/sdcard/VideoAndImageRemote` or `/storage/emulated/0/VideoAndImageRemote`).
- **VIDEO ADS = `.mp4`** — confirmed: `All adGummies.mp4` in the ad-media set. (Still need the numeric
  video `AdType` value in advert.txt; image `AdType`=2.)
- **Ad-creative library seen:** Creatine Gummies, AxeSpray, Neosporin, TRESemmé (several), Dove, PregTest,
  Medi Cube HIGH RES, Neutrogena/Simple wipes — human-named .jpg/.png plus the .mp4.
- **`imageloader` = ES's OWN thumbnail cache** (number-named files) — NOT the ad folder. Ruled out.
- **ES "Remote Manager" = built-in FTP server**, confirmed present, on the **RUT241_ED94** network
  (Teltonika RUT241 router). "Turn on" exposes an `ftp://…` endpoint (get the address; set a user/pass
  in its ⚙ before production). Local-net now; remote via the RUT241 (RMS/VPN/port-forward).
- **Installed user apps:** TcnVending (kiosk), YsSystem + "service" (Yunshu system), Host (TeamViewer
  unattended), ComAssistant (serial/485), ES File Explorer, AirDroid Business daemon (APK present).
- ES library counts: Images 298, Movies 5, storage 1.56/4.09 GB (keep video files modest).

### COMPLETE RECIPE (pending the one path confirm)
Drop image/`.mp4` into **VideoAndImageRemote** + append an entry to **advert.txt** (root:
AdSite/AdType/PlayTime/EndTime/AdContent1) → deliver over **ES FTP through the RUT241** → the TCN
player shows it on schedule. MCOS = the ad manager (campaigns, media, machines, schedule, billing)
that generates advert.txt + pushes files. Nothing installed on the machine; nothing for the watchdog to kill.

### THE MAKE-OR-BREAK = advert.txt's format
- If **advert.txt / config can point at a REMOTE URL** → machine pulls ads outbound from MCOS-hosted
  media (works through NAT, nothing to install, nothing for the watchdog to kill) = SOLVED. Best case.
- If **local-files-only** → remote delivery must ride an OUTBOUND remote-control channel that's
  automatable: AirDroid Business (IF actually running — TeamViewer/AirDroid work BECAUSE the machine
  dials OUT to their cloud, beating NAT) or scripted TeamViewer, dropping files to the advert folder.
### SHARPENED NEXT STEPS (given the lockdown)
1. **`advert.txt` contents = THE key** — reveals the ad playlist format AND whether it can point at a
   remote URL/FTP (if yes = host media in MCOS, machine pulls it, no rogue app needed). GET THIS.
2. **Inspect the ES APK Joe sends** — version + whether its FTP/remote/cloud features are usable as the
   push channel (the allowed app doing the file delivery).
3. Confirm whether AirDroidBiz is actually RUNNING or just a dead folder.

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
