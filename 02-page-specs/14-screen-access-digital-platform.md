# Page Spec: Screen Access / Digital Platform

## Purpose

Investigate and build the MCOS-controlled path into the existing Android/YS/TCN screen interface.

This is not a plan to blindly replace the existing vending app.

The goal is to connect MCOS to the interface layer that already manages images, pricing, slots, ads, QR codes, coupon/free-item style flows, inventory display, and dispense behavior.

## Locked Direction

- Do not rebuild the full MCOS dashboard until Android machine interface path is proven.
- Existing YS/TCN Android interface is critical.
- MCOS should replace slow TeamViewer-style manual access with a controlled MCOS-managed interface path where possible.
- Gateway telemetry remains useful, but gateway-only communication cannot load product images, screen media, voucher UI, or full templates.
- Do not ask TCN/Luis for more unless absolutely unavoidable.

## Candidate Routes To Prove

1. Existing gateway bidirectional command route.
2. TCN Android delivery-code / app pickup-code route.
3. Custom MediCube Android screen agent route.
4. TCN SDK/local controller route.
5. Direct serial/MDB/controller route.

No production dispense command should be sent until the command path is verified, logged, and reversible.

## TCN SDK Evidence

- TCN has Android SDK integration path.
- SDK is provided as AAR: `lib_ys_vending-release.aar`.
- SDK setup includes machine serial port configuration.
- Serial examples: `ttyS3`, `ttyS2`, `ttyS1`.
- SDK supports shipment/dispense command.
- SDK listeners report shipment status, fault info, fault code, slot number, order number, payment method, and success/failure.
- SDK includes authorization management.
- If authorization is not successful, after machine restart SDK may be usable for one hour; must verify.

## Preferred Screen-Agent Architecture

If SDK materials and authorization are available, preferred control path is MediCube Android Screen Agent using TCN SDK AAR.

Existing gateway remains important for inbound telemetry.

Screen Agent becomes primary route for:

- voucher UI
- Impact eligibility lookup
- MCOS-controlled dispense
- local status listener
- product image sync
- ads/media
- screen workflows

Gateway and Screen Agent should both write to MCOS, but MCOS remains source of truth.

## Refined Direction

Jordan clarified the goal is not to rebuild or replace the entire working YSN/TCN vending app.

Use existing YSN/TCN app and ES-file system whenever possible.

Use SDK only where required to communicate with interface/controller or receive/report results cleanly.

MCOS cloud cannot call an Android AAR directly from Vercel; an Android app/bridge is required.

## Required SDK Materials Before Control Coding

- `lib_ys_vending-release.aar`
- sample Android project/source
- SDK docs
- authorization/licensing method
- serial port expected for target machine
- example shipment command and listener implementation
- safe test shipment procedure
- confirmation whether app can run side-by-side with TcnVending or must replace/control it

## First APK Rule

First MediCube Screen Agent APK must be safe and non-control.

Allowed:

- phone home to MCOS
- report device identity
- report app version
- report Android version
- test read/write access to non-critical folders

Not allowed:

- product dispense
- controller commands
- serial writes
- payment flows
- file replacement

## Command Center Block

Shows:

- screen agent connected/not connected
- last check-in
- Android/device identity status
- interface route proof status
- SDK/filesystem access blockers
- no-control safety status
