# MCOS ↔ TCN/Yunshu Gateway

This is the one thing everything else in MCOS-V2 depends on: a small server
that speaks the Yunshu machine protocol (the "V2.5" doc, from Hunan Yunshu
Information Technology / herevend.com) correctly enough that a real machine
can point at it without locking up.

**Why this exists, in one sentence:** the machine calls one address every
few seconds expecting very specific answers; whatever answers that call is
in control of pricing, product info, images, and remote dispense for that
machine. This is that answering service.

## What it implements

Five message types, dispatched by the `FunCode` field in the request body
(not by URL path — the machine only has one configurable address):

| FunCode | What it means | Direction |
|---|---|---|
| 1000 | Machine reports its product/slot data | machine → us |
| 2000 | Customer entered a pickup code / QR / IC card | machine → us → machine (this is the voucher/free-item hook) |
| 4000 | Heartbeat / "what should I do?" (default every 3s) | machine → us → machine (this is how we push price/product/image updates and remote dispense) |
| 5000 | Machine reports a completed sale | machine → us |
| 5001 | Machine confirms a remote update took effect | machine → us |

See `lib/protocol.js` for the exact field names — they're transcribed
directly from the vendor document, including a couple of inconsistencies
(`Err` vs `Er` between message types) that are the vendor's, not a mistake
here. **Do not "clean up" those field names without testing the change
against a real machine first.**

## Known unknowns — verify these on the test machine

- **Exact URL path.** The doc only documents the IP/port fields on the
  machine, never the path. `server.js` catches every POST path for exactly
  this reason. Once you see real traffic in `/admin/events`, note the path
  it actually hit.
- **The "nothing to do" response for FunCode 4000.** The doc only shows
  examples for MsgType 0 and 1; there's no documented example for "no
  command queued." This currently replies `{"Status":"0"}`. Watch the
  machine's behavior when this happens — if the screen does anything odd,
  that's the first thing to revisit.
- **`ProductID` key spacing** in the MsgType-0 example in the doc renders as
  "Product ID" (with a space) in one place and "ProductID" everywhere else.
  Implemented as `ProductID` (no space) for consistency — flag it here if
  real traffic disagrees.

## Running it

```bash
cd gateway
npm install
npm start
```

Runs on port 4150 by default (`PORT` env var to change — does not need to
match OurVend's port, it's just a convenient default). `data/store.json` is
created automatically — it's the temporary flat-file store for this test
phase (see the note at the top of `lib/db.js` for why, and what replaces it
later).

### Deploying

`Dockerfile` included. This is server-side infrastructure — per the main
repo's hosting direction, this belongs on DigitalOcean, not Vercel. Needs a
publicly reachable IP/domain and port; the machine calls out to it, nothing
calls in, so no inbound access to your network is required.

## Testing on the one online machine

Use the exact reset procedure already confirmed with the vendor (do **not**
skip the reset steps — this is very likely why the earlier attempt locked up
the screen):

1. Disconnect the machine's internet.
2. Restore default settings (Android system settings menu).
3. Open the ES File Explorer.
4. Delete the `MachineData` folder.
5. Restart the machine.
6. Basic Setting → Server Setting → Server Type → "Use Your Own Server."
7. Enter this gateway's address and port.

Then watch `GET /admin/events?machineId=<id>` — you should see a `1000` call
land within moments of reconnecting, and `4000` calls arriving roughly every
3 seconds after that. That's the connection working.

### Trying the controls once it's connected

Queue a remote dispense:
```bash
curl -X POST http://<gateway>:<port>/admin/command \
  -H 'Content-Type: application/json' \
  -d '{"machineId":"<id>","msgType":0,"slotNo":"1","productId":"1002"}'
```

Queue a price/image update on a slot:
```bash
curl -X POST http://<gateway>:<port>/admin/command \
  -H 'Content-Type: application/json' \
  -d '{"machineId":"<id>","msgType":1,"slotNo":"1","productId":"1002","name":"Advil","price":"6.99","imageUrl":"https://.../advil.png"}'
```

Create a free-item code (the voucher/coupon mechanism, riding the existing
"enter pickup code" screen):
```bash
curl -X POST http://<gateway>:<port>/admin/redeem-code \
  -H 'Content-Type: application/json' \
  -d '{"code":"FREESNACK1","machineId":"<id>","slotNo":"1","productId":"1002","maxUses":1}'
```

Each of these takes effect on the machine's *next* poll (within a few
seconds), not instantly — that's how the protocol works, not a delay in
this code.

## Where this fits in MCOS-V2

This is infrastructure, not a dashboard page, so it isn't subject to the
repo's "blueprint before code" rule the same way `01-blueprints/` pages are
— it's the connection everything else depends on being real before those
pages have live data to show. Once this is proven on one machine, the same
service handles every machine in the fleet; nothing about it changes per
machine except which machine ID shows up in the data.
