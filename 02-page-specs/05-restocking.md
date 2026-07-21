# Page Spec: Restocking

## Purpose

Field execution page for getting people to refill machines.

Restocking tracks assignments, work orders, confirmations, access/keypass, photos, training, and completion.

## Data Owned

- restocking alerts
- restocking tasks
- assigned restocker
- work order
- products to refill
- slot numbers
- expected quantities
- access/key process
- photo proof
- checklist
- exception report
- restock status

## Data Read

- inventory needs
- product records
- machine records
- facility access rules
- campus closet stock
- restocker contact records
- calendar/logistics

## Workflow

Restocking starts from inventory need:

1. Inventory detects the need.
2. Restocking receives the task.
3. Restocking sends work order to the correct person/program.
4. Restocker confirms acceptance.
5. Restocker confirms arrival.
6. Keypass/access is generated or manually provided.
7. Restocker opens machine.
8. Restocker fills products.
9. Restocker enters quantities if not standard.
10. Restocker uploads photo proof.
11. Restocker confirms machine closed.
12. MCOS updates inventory.

## Work Order Fields

- facility
- machine
- exact machine location
- products to refill
- slot numbers
- quantity expected
- quantity available in machine storage or campus closet
- instructions
- restocker contact
- confirmation required
- key/access process
- photo proof
- checklist
- exception report

## Statuses

- Drafted by Inventory Agent
- Waiting for product
- Ready to assign
- Sent to restocker
- Restocker confirmed
- En route
- At machine
- Keypass generated
- Machine opened
- Refill in progress
- Quantities submitted
- Photo proof uploaded
- Machine closed
- Inventory updated
- Complete
- Exception

## Training / Maintenance

Restocking page should hold training videos and instructions for:

- refill process
- opening machine
- rebooting internet
- minor troubleshooting
- wiping screen/glass
- checking coils
- reporting damage
- basic monthly maintenance

## Agent Role

Restocking Agent:

- suggested name: Marcus
- sends work orders
- tracks restocker status
- coordinates with Inventory Agent
- logs proof and exceptions
- reports urgent issues to Command Center Agent

## Alerts

- restocker not confirmed
- product not available
- restock overdue
- access/key problem
- photo proof missing
- machine damage reported
- inventory not updated

## Command Center Block

Shows:

- open restock tasks
- urgent restocks
- blocked restocks
- restocker confirmations missing
- proof missing
- exceptions
