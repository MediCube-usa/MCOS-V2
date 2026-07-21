# Page Spec: Agent Management

## Purpose

Central page for managing all MCOS agents.

Page agents may appear in their own departments, but Agent Management is where agents are viewed, configured, updated, duplicated, instructed, or assigned tasks.

## Data Owned

- agent records
- agent names
- agent departments
- agent roles
- permission levels
- task assignments
- instruction sets
- knowledge/SOP references
- recent agent actions

## Data Read

- department pages
- central MCOS data
- task/event history
- connected tool status

## Blocks / Tabs

- All agents list
- Command Center Agent section
- Page agents
- Temporary agents
- Permanent agents
- Agent templates
- Agent tasks
- Agent permissions
- Agent knowledge/SOPs
- Recent actions/history

## Agent Model

- Command Center Agent is separate and higher authority.
- Page agents are department-specific.
- Agents do not own data.
- Agents use central MCOS source of truth and workflow permissions.
- Agents eventually communicate through tasks/events.

## Draft Agent Names

- Command Center: executive/Jarvis-style agent
- Inventory: Ava
- Restocking: Marcus
- Machine Operations: Jeff
- Machine Setup & Distribution: Derek
- Templates & Configuration: Tessa

Names are placeholders.

## Workflows

- create temporary agent
- create permanent agent
- duplicate agent template
- assign page/department
- update instructions
- add reference material
- assign task
- review task history
- set permissions

## Alerts

- agent blocked
- agent needs approval
- agent lacks permission
- task overdue
- agent output awaiting review

## Manual Inputs

- agent name
- department assignment
- instructions
- permission level
- task prompt
- reference/SOP link

## Future Integrations

- connected tools by page
- task event bus
- voice/phone later for Command Center Agent
- department-specific tools

## Command Center Block

Shows:

- active agents
- blocked agents
- approvals waiting
- urgent agent tasks
- recently completed high-value work
