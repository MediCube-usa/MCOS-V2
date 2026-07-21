# Page Spec: Machine Operations

## Purpose

Private internal page for every active machine.

Shows machine data, live status, configuration, contacts, access, inventory summary, payment provider, service controls, and setup history.

## Data Owned

- machine identity
- machine status
- placement details
- access references
- machine alerts
- maintenance/service history
- damage reports
- screen access link
- machine setup history

## Data Read

- facility records
- machine templates
- live machine data
- inventory records
- restocking tasks
- payment/card reader records
- setup/distribution records
- contacts
- documents/contracts

## Main Machine List

Must support:

- machines grouped by facility/campus/location
- list view
- grouped facility view
- map/status view
- click facility then machine

## Machine Detail Fields

- machine name
- machine ID
- TCN ID
- serial number if available
- model/type
- facility/campus
- location name
- GPS
- exact physical placement
- placement photo/video
- online/offline status
- last communication
- current slot template
- product/slot assignments
- inventory preview
- payment provider such as Nayax, Cantaloupe, or Preva
- payment terminal/account reference
- customer service/refund context
- digital key/access reference
- assigned restocker
- restocker contact
- shipping/receiving office contact
- facility contact
- maintenance history
- service requests
- damage reports
- screen access link later
- machine alerts
- machine setup history

## Machine Actions

- change price
- change product/slot
- assign/change template
- request restock
- request service/maintenance
- generate or log key access
- reboot or remote action later when safe
- dispense/refund support action later only with explicit safe protocol
- open screen/app access later

## Important Rule

Changes drafted in MCOS do not become real until physically or remotely applied and confirmed.

Product/slot changes should be tied to restocking or setup workflow.

## Internal Map / Delivery View

MCOS should have its own private map view.

Field-safe information only:

- facility/address
- GPS
- exact machine placement
- photo of hallway/location
- delivery instructions
- restocker instructions
- authorized contact
- assigned task
- route/direction help

No sensitive system or financial information in field view.

## Agent Role

Machine Agent:

- suggested name: Jeff
- watches machine status and alerts
- helps coordinate service, restocking, template changes, and setup status

## Alerts

- offline machine
- stale last communication
- service needed
- template mismatch
- payment reader issue
- access issue
- damage report
- restock required

## Command Center Block

Shows:

- machines online/offline
- machines needing service
- blocked machine issues
- recent machine alerts
- setup/live status summary
