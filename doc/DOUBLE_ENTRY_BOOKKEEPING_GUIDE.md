# Double Entry Bookkeeping System - Complete Implementation Guide

## Table of Contents
1. [System Overview](#system-overview)
2. [Core Architecture](#core-architecture)
3. [Data Models](#data-models)
4. [Chart of Accounts Structure](#chart-of-accounts-structure)
5. [Journal Entry System](#journal-entry-system)
6. [Transaction Processing](#transaction-processing)
7. [Integration Points](#integration-points)
8. [Implementation Steps](#implementation-steps)
9. [Database Schema](#database-schema)
10. [API Reference](#api-reference)

---

## System Overview

The TradoERP double entry bookkeeping system implements the fundamental accounting principle: **Every transaction must have equal debits and credits**.

### Key Principles
- **Debit**: Increases assets/expenses, decreases liabilities/equity/income
- **Credit**: Decreases assets/expenses, increases liabilities/equity/income
- **Balance Rule**: Total Debits = Total Credits for every journal entry
- **Multi-Workspace Support**: Each workspace maintains separate accounting records
- **User Isolation**: Each user (company) has isolated accounting data

### Account Categories (6 Types)
1. **Assets** (1000-1999) - What the company owns
2. **Liabilities** (2000-2999) - What the company owes
3. **Equity** (3000-3999) - Owner's stake in company
4. **Income** (4000-4999) - Revenue from sales/services
5. **Costs of Goods Sold** (5000-5099) - Direct product costs
6. **Expenses** (5100-5999) - Operating expenses

---

## Core Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Double Entry System                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Chart of Accounts → Journal Entry Management → Journal Items│
│         ↓                      ↓                      ↓       │
│  Account Types    →  Debit/Credit Entries  →  Transaction   │
│  & SubTypes                                      Lines       │
│         ↓                                          ↓         │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Invoices (Income) → Bills (Expenses) → Payments   │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Module Location
```
packages/workdo/
├── Account/src/Entities/
│   ├── ChartOfAccount.php
│   ├── ChartOfAccountType.php
│   ├── ChartOfAccountSubType.php
│   ├── AddTransactionLine.php
│   └── AccountUtility.php
└── DoubleEntry/src/
    ├── Entities/
    │   ├── JournalEntry.php
    │   └── JournalItem.php
    └── Http/Controllers/
        └── JournalEntryController.php
```

---

## Data Models

### 1. Chart of Accounts (ChartOfAccount)

**Table**: `chart_of_accounts`

**Fields**:
```php
[
    'id'          => 'Primary Key',
    'name'        => 'Account Name (e.g., "Cash", "Sales Revenue")',
    'code'        => 'Account Code (e.g., "1060", "4100")',
    'type'        => 'FK to ChartOfAccountType',
    'sub_type'    => 'FK to ChartOfAccountSubType',
    'parent'      => 'Parent account ID (hierarchical)',
    'is_enabled'  => 'Boolean - active status',
    'description' => 'Optional description',
    'workspace'   => 'FK to workspace (multi-tenant)',
    'created_by'  => 'FK to user (company owner)',
    'created_at'  => 'Timestamp',
    'updated_at'  => 'Timestamp'
]
```

### 2. Chart of Account Type (ChartOfAccountType)

**Table**: `chart_of_account_types`

**Standard Types**:
```php
[
    'assets'                 => 'Assets',
    'liabilities'            => 'Liabilities',
    'equity'                 => 'Equity',
    'income'                 => 'Income',
    'costs of goods sold'    => 'Costs of Goods Sold',
    'expenses'               => 'Expenses'
]
```

### 3. Chart of Account SubType (ChartOfAccountSubType)

**Table**: `chart_of_account_sub_types`

**Example SubTypes**:
```php
Assets:
  - Accounts Receivable
  - Current Asset
  - Inventory Asset
  - Non-current Asset

Liabilities:
  - Accounts Payable
  - Current Liabilities
  - Long Term Liabilities

Income:
  - Sales Revenue
  - Other Revenue

Expenses:
  - Payroll Expenses
  - General and Administrative expenses
```

### 4. Journal Entry (JournalEntry)

**Table**: `journal_entries`

**Fields**:
```php
[
    'id'          => 'Primary Key',
    'journal_id'  => 'Sequential journal number',
    'date'        => 'Transaction date',
    'reference'   => 'Reference number',
    'description' => 'Transaction description',
    'workspace'   => 'FK to workspace',
    'created_by'  => 'FK to user',
    'created_at'  => 'Timestamp',
    'updated_at'  => 'Timestamp'
]
```

**Key Methods**:
```php
// Format journal number with company prefix
static journalNumberFormat($number)
  Returns: "#JUR00001"

// Get all line items
accounts()
  Returns: Collection of JournalItem

// Calculate totals
totalCredit()  // Sum of all credits
totalDebit()   // Sum of all debits
```

### 5. Journal Item (JournalItem)

**Table**: `journal_items`

**Fields**:
```php
[
    'id'          => 'Primary Key',
    'journal'     => 'FK to JournalEntry',
    'account'     => 'FK to ChartOfAccount',
    'description' => 'Line item description',
    'debit'       => 'Debit amount (0 if credit)',
    'credit'      => 'Credit amount (0 if debit)',
    'workspace'   => 'FK to workspace',
    'created_by'  => 'FK to user',
    'created_at'  => 'Timestamp',
    'updated_at'  => 'Timestamp'
]
```

**Rules**:
- Either `debit` OR `credit` is non-zero, never both
- For each journal entry: sum(debits) = sum(credits)

### 6. Transaction Line (AddTransactionLine)

**Table**: `add_transaction_lines`

**Fields**:
```php
[
    'id'                => 'Primary Key',
    'account_id'        => 'FK to ChartOfAccount',
    'reference'         => 'Transaction type (Invoice, Bill, etc.)',
    'reference_id'      => 'Source document ID',
    'reference_sub_id'  => 'Sub-item ID',
    'date'              => 'Transaction date',
    'debit'             => 'Debit amount',
    'credit'            => 'Credit amount',
    'workspace'         => 'FK to workspace',
    'created_by'        => 'FK to user',
    'created_at'        => 'Timestamp',
    'updated_at'        => 'Timestamp'
]
```

**Purpose**: Actual ledger tracking all account movements and balances

---

## Chart of Accounts Structure

### Account Ranges

```
ASSETS (1000-1999)
  1050: Accounts Receivable
  1060: Checking Account
  1065: Petty Cash
  1510: Inventory
  1810: Land and Buildings

LIABILITIES (2000-2999)
  2100: Accounts Payable
  2120: Income Tax Payable
  2140: VAT Provision

INCOME (4000-4999)
  4100: Sales Revenue
  4200: Other Revenue

COSTS OF GOODS SOLD (5000-5099)
  5005: Cost of Sales - Services
  5010: Cost of Sales - Purchases

EXPENSES (5100-5999)
  5610: Accounting Fees
  5615: Advertising
  5760: Rent Paid
  5790: Utilities
```

---

## Journal Entry System

### Creating a Journal Entry

**Controller**: `JournalEntryController`

**Key Methods**:

#### 1. `create()` - Show form
```php
// Loads parent accounts and sub-accounts
// Returns: Create form view
```

#### 2. `store()` - Save entry
```php
public function store(Request $request)
{
    // Validate: date required, accounts required
    // Validate: totalDebit == totalCredit
    
    // Create JournalEntry
    // Create JournalItem records (one per line)
    // Create AddTransactionLine records (ledger)
    // Update bank account balances
    // Trigger: CreateJournalAccount event
}
```

**Validation**:
```php
if ($totalCredit != $totalDebit) {
    return error('Debit and Credit must be Equal.');
}
```

---

## Transaction Processing

### Invoice Sent Event

**Listener**: `InvoiceSent.php`

**Entries Created**:
```
DEBIT:  Accounts Receivable
CREDIT: Sales Revenue

DEBIT:  Cost of Goods Sold
CREDIT: Inventory
```

### Bill Sent Event

**Listener**: `BillSent.php`

**Entries Created**:
```
DEBIT:  Expense Account
CREDIT: Accounts Payable
```

### Invoice Payment

**Entries Created**:
```
DEBIT:  Bank Account
CREDIT: Accounts Receivable
```

### Bill Payment

**Entries Created**:
```
DEBIT:  Accounts Payable
CREDIT: Bank Account
```

---

## Implementation Steps

### Step 1: Initialize Chart of Accounts

**Method**: `AccountUtility::defaultChartAccountdata()`

```php
// Creates all account types, subtypes, and accounts
// Called during company/workspace setup
```

### Step 2: Create Journal Entry

```php
// 1. Validate debit = credit
// 2. Create JournalEntry record
// 3. Create JournalItem records
// 4. Create AddTransactionLine records
// 5. Update bank balances
```

### Step 3: Record Invoice

```
Invoice Sent → InvoiceSent Event → Create Entries:
  - DEBIT Accounts Receivable
  - CREDIT Sales Revenue
  - DEBIT COGS
  - CREDIT Inventory
```

### Step 4: Record Payment

```
Payment Recorded → PaymentCreate Event → Create Entries:
  - DEBIT Bank Account
  - CREDIT Accounts Receivable/Payable
```

---

## Key Integration Points

### 1. Invoice Processing
- **File**: `Listeners/InvoiceSent.php`
- **Trigger**: Invoice status = Sent
- **Creates**: AR and Revenue entries + COGS and Inventory entries

### 2. Bill Processing
- **File**: `Listeners/BillSent.php`
- **Trigger**: Bill status = Sent
- **Creates**: Expense and AP entries

### 3. Payment Processing
- **File**: `Listeners/InvoicePaymentCreate.php`, `BillPaymentCreate.php`
- **Trigger**: Payment recorded
- **Creates**: Bank and AR/AP entries

### 4. Revenue Entry
- **File**: `Listeners/RevenueCreate.php`
- **Creates**: Bank and Income entries

### 5. Credit/Debit Notes
- **Files**: `Listeners/CustomerCreditNoteCreate.php`, `CustomerDebitNoteCreate.php`
- **Creates**: Reversal entries

---

## Adding Transaction Lines

### Method: `AccountUtility::addTransactionLines()`

```php
public static function addTransactionLines($data, $action = '', $type = '')
{
    // Parameters:
    // $data['account_id']         - Chart of Account ID
    // $data['reference']          - Type (Invoice, Bill, Journal Entry, etc.)
    // $data['reference_id']       - Source document ID
    // $data['reference_sub_id']   - Sub-item ID
    // $data['date']               - Transaction date
    // $data['transaction_type']   - 'debit' or 'credit'
    // $data['transaction_amount'] - Amount
    // $data['workspace']          - Workspace ID (optional)
    // $data['created_by']         - User ID (optional)
    
    // $action - 'edit' to update existing transaction
    // $type   - 'notes' for special handling
    
    // Creates or updates AddTransactionLine record
}
```

---

## Permissions

### Journal Entry Permissions
```php
'journalentry manage'   - List all entries
'journalentry create'   - Create new entries
'journalentry show'     - View entry details
'journalentry edit'     - Edit entries
'journalentry delete'   - Delete entries
```

---

## For Single Vendor Desktop System

### Simplifications Needed

1. **Remove Multi-Tenant Logic**
   - Remove workspace filtering
   - Remove created_by filtering
   - Simplify to single company

2. **Simplified Chart of Accounts**
   - Use predefined accounts
   - No custom account creation
   - Fixed account hierarchy

3. **Automatic Entry Creation**
   - Auto-create entries on invoice/bill send
   - No manual journal entry needed
   - Simple debit/credit rules

4. **Simplified Reports**
   - Trial Balance
   - Income Statement
   - Balance Sheet
   - Account Ledger

### Implementation for Desktop

```php
// Remove workspace checks
ChartOfAccount::where('created_by', creatorId())

// Becomes:
ChartOfAccount::all()

// Remove user isolation
AddTransactionLine::where('created_by', creatorId())

// Becomes:
AddTransactionLine::all()
```

---

## Database Migrations

### Create Tables

```sql
-- Chart of Account Types
CREATE TABLE chart_of_account_types (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255),
    workspace BIGINT,
    created_by BIGINT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Chart of Account SubTypes
CREATE TABLE chart_of_account_sub_types (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255),
    type BIGINT,
    workspace BIGINT,
    created_by BIGINT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Chart of Accounts
CREATE TABLE chart_of_accounts (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255),
    code VARCHAR(50),
    type BIGINT,
    sub_type BIGINT,
    parent BIGINT,
    is_enabled BOOLEAN,
    description TEXT,
    workspace BIGINT,
    created_by BIGINT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Journal Entries
CREATE TABLE journal_entries (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    journal_id BIGINT,
    date DATE,
    reference VARCHAR(255),
    description TEXT,
    workspace BIGINT,
    created_by BIGINT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Journal Items
CREATE TABLE journal_items (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    journal BIGINT,
    account BIGINT,
    description TEXT,
    debit DECIMAL(15,2),
    credit DECIMAL(15,2),
    workspace BIGINT,
    created_by BIGINT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Transaction Lines (Ledger)
CREATE TABLE add_transaction_lines (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    account_id BIGINT,
    reference VARCHAR(255),
    reference_id BIGINT,
    reference_sub_id BIGINT,
    date DATE,
    debit DECIMAL(15,2),
    credit DECIMAL(15,2),
    workspace BIGINT,
    created_by BIGINT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

---

## Testing the System

### Test 1: Create Journal Entry
```
1. Navigate to Journal Entry → Create
2. Enter date and description
3. Add line items:
   - Debit: Cash 1000
   - Credit: Revenue 1000
4. Verify: Total Debit = Total Credit
5. Save and verify entry created
```

### Test 2: Send Invoice
```
1. Create invoice with items
2. Send invoice
3. Check AddTransactionLine records created:
   - DEBIT Accounts Receivable
   - CREDIT Sales Revenue
   - DEBIT COGS
   - CREDIT Inventory
```

### Test 3: Record Payment
```
1. Record payment for invoice
2. Check AddTransactionLine records:
   - DEBIT Bank Account
   - CREDIT Accounts Receivable
```

### Test 4: Account Balance
```
1. Query AddTransactionLine for account
2. Calculate: Sum(Credit) - Sum(Debit)
3. Verify balance is correct
```

---

## Reporting

### Trial Balance
```sql
SELECT 
    coa.code,
    coa.name,
    SUM(CASE WHEN atl.debit > 0 THEN atl.debit ELSE 0 END) as total_debit,
    SUM(CASE WHEN atl.credit > 0 THEN atl.credit ELSE 0 END) as total_credit
FROM chart_of_accounts coa
LEFT JOIN add_transaction_lines atl ON coa.id = atl.account_id
GROUP BY coa.id
ORDER BY coa.code;
```

### Account Ledger
```sql
SELECT 
    date,
    reference,
    reference_id,
    debit,
    credit,
    (SELECT SUM(debit) - SUM(credit) FROM add_transaction_lines 
     WHERE account_id = ? AND date <= atl.date) as running_balance
FROM add_transaction_lines atl
WHERE account_id = ?
ORDER BY date;
```

### Income Statement
```sql
SELECT 
    'Income' as category,
    SUM(credit) - SUM(debit) as amount
FROM add_transaction_lines
WHERE account_id IN (SELECT id FROM chart_of_accounts WHERE type = 'Income')
UNION ALL
SELECT 
    'Expenses',
    SUM(debit) - SUM(credit)
FROM add_transaction_lines
WHERE account_id IN (SELECT id FROM chart_of_accounts WHERE type = 'Expenses');
```

---

## Summary

This double entry bookkeeping system provides:
- ✅ Complete accounting compliance
- ✅ Automatic entry creation from business transactions
- ✅ Manual journal entry capability
- ✅ Multi-tenant support (removable for desktop)
- ✅ Full audit trail
- ✅ Account balance tracking
- ✅ Financial reporting capability

For a single vendor desktop system, remove multi-tenant logic and simplify to single company operations.
