import { ChartOfAccountType } from '../db/models/accounting/ChartOfAccountType';
import { ChartOfAccountSubType } from '../db/models/accounting/ChartOfAccountSubType';
import { ChartOfAccount } from '../db/models/accounting/ChartOfAccount';
import { TransactionLine } from '../db/models/accounting/TransactionLine';
import { JournalEntry } from '../db/models/accounting/JournalEntry';
import { JournalItem } from '../db/models/accounting/JournalItem';

/**
 * Initialize default chart of accounts for a new system
 */
export async function initializeDefaultChartOfAccounts() {
  // Check if already initialized
  const existingTypes = await ChartOfAccountType.countDocuments();
  if (existingTypes > 0) {
    console.log('Chart of accounts already initialized');
    return;
  }

  console.log('Initializing default chart of accounts...');

  // 1. Create Account Types
  const types = await ChartOfAccountType.create([
    { name: 'Assets' },
    { name: 'Liabilities' },
    { name: 'Equity' },
    { name: 'Income' },
    { name: 'Cost of Goods Sold' },
    { name: 'Expenses' },
  ]);

  const typeMap: Record<string, string> = {};
  types.forEach((type) => {
    typeMap[type.name] = type._id;
  });

  // 2. Create Account SubTypes
  const subTypes = await ChartOfAccountSubType.create([
    // Assets SubTypes
    { name: 'Current Asset', type_id: typeMap['Assets'] },
    { name: 'Accounts Receivable', type_id: typeMap['Assets'] },
    { name: 'Inventory Asset', type_id: typeMap['Assets'] },
    { name: 'Fixed Asset', type_id: typeMap['Assets'] },
    
    // Liabilities SubTypes
    { name: 'Current Liabilities', type_id: typeMap['Liabilities'] },
    { name: 'Accounts Payable', type_id: typeMap['Liabilities'] },
    { name: 'Long Term Liabilities', type_id: typeMap['Liabilities'] },
    
    // Equity SubTypes
    { name: 'Owner Equity', type_id: typeMap['Equity'] },
    { name: 'Retained Earnings', type_id: typeMap['Equity'] },
    
    // Income SubTypes
    { name: 'Sales Revenue', type_id: typeMap['Income'] },
    { name: 'Other Revenue', type_id: typeMap['Income'] },
    
    // COGS SubTypes
    { name: 'Cost of Sales', type_id: typeMap['Cost of Goods Sold'] },
    
    // Expenses SubTypes
    { name: 'Operating Expenses', type_id: typeMap['Expenses'] },
    { name: 'Payroll Expenses', type_id: typeMap['Expenses'] },
  ]);

  const subTypeMap: Record<string, string> = {};
  subTypes.forEach((subType) => {
    subTypeMap[subType.name] = subType._id;
  });

  // 3. Create Default Accounts
  await ChartOfAccount.create([
    // ASSETS (1000-1999)
    {
      code: '1050',
      name: 'Accounts Receivable',
      type_id: typeMap['Assets'],
      sub_type_id: subTypeMap['Accounts Receivable'],
      is_enabled: true,
      description: 'Money owed by customers',
    },
    {
      code: '1060',
      name: 'Cash',
      type_id: typeMap['Assets'],
      sub_type_id: subTypeMap['Current Asset'],
      is_enabled: true,
      description: 'Cash on hand and in bank',
    },
    {
      code: '1065',
      name: 'Petty Cash',
      type_id: typeMap['Assets'],
      sub_type_id: subTypeMap['Current Asset'],
      is_enabled: true,
      description: 'Small cash fund for minor expenses',
    },
    {
      code: '1510',
      name: 'Inventory',
      type_id: typeMap['Assets'],
      sub_type_id: subTypeMap['Inventory Asset'],
      is_enabled: true,
      description: 'Products available for sale',
    },
    {
      code: '1810',
      name: 'Fixed Assets',
      type_id: typeMap['Assets'],
      sub_type_id: subTypeMap['Fixed Asset'],
      is_enabled: true,
      description: 'Long-term assets like equipment and property',
    },

    // LIABILITIES (2000-2999)
    {
      code: '2100',
      name: 'Accounts Payable',
      type_id: typeMap['Liabilities'],
      sub_type_id: subTypeMap['Accounts Payable'],
      is_enabled: true,
      description: 'Money owed to suppliers',
    },
    {
      code: '2120',
      name: 'Sales Tax Payable',
      type_id: typeMap['Liabilities'],
      sub_type_id: subTypeMap['Current Liabilities'],
      is_enabled: true,
      description: 'Sales tax collected from customers',
    },

    // EQUITY (3000-3999)
    {
      code: '3000',
      name: 'Owner Equity',
      type_id: typeMap['Equity'],
      sub_type_id: subTypeMap['Owner Equity'],
      is_enabled: true,
      description: 'Owner investment in business',
    },
    {
      code: '3200',
      name: 'Retained Earnings',
      type_id: typeMap['Equity'],
      sub_type_id: subTypeMap['Retained Earnings'],
      is_enabled: true,
      description: 'Accumulated profits',
    },

    // INCOME (4000-4999)
    {
      code: '4100',
      name: 'Sales Revenue',
      type_id: typeMap['Income'],
      sub_type_id: subTypeMap['Sales Revenue'],
      is_enabled: true,
      description: 'Revenue from product sales',
    },
    {
      code: '4200',
      name: 'Other Revenue',
      type_id: typeMap['Income'],
      sub_type_id: subTypeMap['Other Revenue'],
      is_enabled: true,
      description: 'Other income sources',
    },

    // COST OF GOODS SOLD (5000-5099)
    {
      code: '5010',
      name: 'Cost of Goods Sold',
      type_id: typeMap['Cost of Goods Sold'],
      sub_type_id: subTypeMap['Cost of Sales'],
      is_enabled: true,
      description: 'Direct cost of products sold',
    },

    // EXPENSES (5100-5999)
    {
      code: '5610',
      name: 'Accounting Fees',
      type_id: typeMap['Expenses'],
      sub_type_id: subTypeMap['Operating Expenses'],
      is_enabled: true,
      description: 'Fees for accounting services',
    },
    {
      code: '5615',
      name: 'Advertising',
      type_id: typeMap['Expenses'],
      sub_type_id: subTypeMap['Operating Expenses'],
      is_enabled: true,
      description: 'Marketing and advertising costs',
    },
    {
      code: '5760',
      name: 'Rent',
      type_id: typeMap['Expenses'],
      sub_type_id: subTypeMap['Operating Expenses'],
      is_enabled: true,
      description: 'Rent for business premises',
    },
    {
      code: '5790',
      name: 'Utilities',
      type_id: typeMap['Expenses'],
      sub_type_id: subTypeMap['Operating Expenses'],
      is_enabled: true,
      description: 'Electricity, water, internet, etc.',
    },
    {
      code: '5800',
      name: 'Salaries',
      type_id: typeMap['Expenses'],
      sub_type_id: subTypeMap['Payroll Expenses'],
      is_enabled: true,
      description: 'Employee salaries and wages',
    },
  ]);

  console.log('✅ Default chart of accounts initialized successfully');
}

/**
 * Add transaction lines to the ledger
 */
export async function addTransactionLine(data: {
  account_id: string;
  reference: 'Order' | 'PurchaseOrder' | 'JournalEntry' | 'Payment' | 'Adjustment' | 'GoodsReceipt' | 'Return' | 'MarketPurchase';
  reference_id: string;
  reference_sub_id?: string;
  date: Date;
  debit: number;
  credit: number;
  description?: string;
}) {
  return await TransactionLine.create(data);
}

/**
 * Get account balance
 */
export async function getAccountBalance(accountId: string, endDate?: Date) {
  const query: any = { account_id: accountId };
  if (endDate) {
    query.date = { $lte: endDate };
  }

  const transactions = await TransactionLine.find(query);
  
  let balance = 0;
  transactions.forEach((txn) => {
    balance += txn.debit - txn.credit;
  });

  return balance;
}

/**
 * Get next journal entry number
 */
export async function getNextJournalNumber(): Promise<string> {
  const lastEntry = await JournalEntry.findOne().sort({ journal_number: -1 });
  if (!lastEntry) {
    return formatJournalNumber(1);
  }
  const lastNumber = parseInt(lastEntry.journal_number.split('-')[1]);
  return formatJournalNumber(lastNumber + 1);
}

/**
 * Format journal number
 */
export function formatJournalNumber(number: number): string {
  return `JE-${String(number).padStart(5, '0')}`;
}

/**
 * Validate journal entry (debits must equal credits)
 */
export function validateJournalEntry(items: Array<{ debit: number; credit: number }>) {
  const totalDebit = items.reduce((sum, item) => sum + item.debit, 0);
  const totalCredit = items.reduce((sum, item) => sum + item.credit, 0);
  
  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    throw new Error('Debit and Credit must be equal');
  }
  
  return { totalDebit, totalCredit };
}
