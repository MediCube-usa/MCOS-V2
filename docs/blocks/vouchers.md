# Vouchers block = the IMPACT redemption (code) side — NARCAN PROGRAM FIRST

Joe defined this 2026-08-21. **First live use = the NARCAN initiative program (coming SOON —
must be 100% before it runs).** "Voucher program" = the initiative/Narcan program.

## HARD BOUNDARY (do not cross)
- **IMPACT is a SEPARATE product** (repo `MediCube-usa/Impact` = IMPACT V1; NOT the old
  `medicube-impact-platform`). It is NOT part of MediCube/MCOS.
- **IMPACT owns:** the platform/website, donations/funding, participant signup, the parameters
  (eligibility), approvals, attaching a code to a participant's NAME, and impact reporting.
- **MCOS/MediCube owns ONLY:** the **codes**, **product tracking**, and **distribution** at the machine.
- **They connect through a SHARED DATABASE used for verification only.** OPEN: confirm where that
  shared DB lives (same Supabase `negtepvmbkyefvxiakwu`, or a separate shared DB) before building.

## THE FLOW (Joe's words, 2026-08-21)
1. Person goes on the platform/website (IMPACT).
2. Joe sets parameters; if they meet them → **generate a code, attach it to their name in the DB**.
3. They go to a MediCube machine.
4. Type in their code.
5. Choose one of the listed items (or a specific item) and select it.
6. Machine dispenses + tracks.
7. Sends to the DB that it was received.

## WHAT'S CONFIRMED (from Joe's OurVend HAR, docs/blocks/ourvend-write.md)
- **Generate codes:** `POST /PickUpCode/MassProductionCode` — `MID` (machine) + `count` → OK.
- **Read/track codes:** `POST /PickUpCode/ListJsoin` → rows: `SecurityCode` (8-digit), `WXSmid`
  (machine), **`SCstatus` (0 = unused)**, `WXScreate` (date), `MGName`. → this is the
  "was it received?" read (used vs unused).

## OPEN — MUST VERIFY ON A REAL MACHINE BEFORE NARCAN GOES LIVE (honesty: not yet tested)
1. **At-machine steps / extra auth?** Believed: pick item → "pickup code" → type 8-digit code →
   dispense, with the **code as the only credential (no PIN, no name)**. NOT verified on Joe's
   machines — confirm with one real redemption.
2. **Item restriction (biggest Narcan risk):** does a machine-level code let them pick ANY item,
   or can a code be locked to a SPECIFIC item (Narcan only)? If OurVend can't item-lock a code,
   plan the redeemable machine/slots to be Narcan-only. MUST resolve before live.
3. **One-time use + expiry:** confirm a code can't be reused (status 0→used) and whether/when it expires.

### The 100% check = ONE live redemption test
Generate a code on a not-live/test machine → redeem it in person → watch: what the screen asks
(code only? PIN? name?), whether item is free-choice or lockable, and that status flips to used.
That single test closes all three open items.

## MCOS BUILD (after the test, per the boundary — codes + tracking + distro only)
- Verify a code/participant against the shared DB.
- Generate the pickup code in OurVend on the target machine (`MassProductionCode`), behind approval.
- Track redemption by polling `ListJsoin` (status flip) → write "received" back to the shared DB.
- Product tracking + distribution (which item, which machine, when) on the MediCube side.
- Do NOT build IMPACT's side (signup/approvals/reporting) into MCOS.
