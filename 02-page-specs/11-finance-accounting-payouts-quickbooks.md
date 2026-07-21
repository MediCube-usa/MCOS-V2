# Page Spec: Finance / Accounting / Payouts / QuickBooks

## Purpose

Money operations page.

QuickBooks is part of the initial Finance build, not a future optional add-on.

Finance uses contract and facility rules from the secure vault, but executes and tracks money through QuickBooks.

## QuickBooks Requirement

Open the Finance block with QuickBooks as the accounting backbone when the page is built.

QuickBooks should track:

- income
- product orders
- supplier invoices
- fees
- taxes
- payouts
- operating costs

## Data Owned / Managed

- QuickBooks connection
- product orders
- supplier invoices
- sales income
- taxes
- credit card processor fees
- internet fees per machine
- logistics costs
- restocker payouts
- Aramark/facility payouts
- vendor payments
- voucher reimbursement accounting
- facility payouts
- product purchase costs
- shipping costs
- machine profitability
- facility profitability
- product profitability
- campaign/program profitability

## Core Rule

Contracts create the rules.

Finance executes and tracks the money.

## Agent Role

Finance Agent:

- manages QuickBooks entries
- tracks product order costs
- prepares payout records
- tracks taxes and fees
- tracks restocker/Aramark payments
- watches profitability
- alerts when costs hurt performance
- prepares approval requests before money moves when required

## Privacy Rule

Finance is a private money workspace.

Other departments can deposit records into Finance.

Detailed financial information should only be accessible inside Finance unless Jordan chooses otherwise.

Main Command Center should not broadly broadcast detailed financial alerts.

## Command Center Block

Shows limited, non-sensitive summaries:

- finance item needs approval
- payout pending
- invoice missing
- QuickBooks sync issue
- high-level blocker without exposing sensitive details
