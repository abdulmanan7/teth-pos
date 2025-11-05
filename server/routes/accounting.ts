import { RequestHandler } from 'express';
import { ChartOfAccountType } from '../db/models/accounting/ChartOfAccountType';
import { ChartOfAccountSubType } from '../db/models/accounting/ChartOfAccountSubType';
import { ChartOfAccount } from '../db/models/accounting/ChartOfAccount';
import { JournalEntry } from '../db/models/accounting/JournalEntry';
import { JournalItem } from '../db/models/accounting/JournalItem';
import { TransactionLine } from '../db/models/accounting/TransactionLine';
import {
  initializeDefaultChartOfAccounts,
  addTransactionLine,
  getAccountBalance,
  getNextJournalNumber,
  validateJournalEntry,
} from '../utils/accountingUtils';

// Initialize default chart of accounts
export const initializeAccounts: RequestHandler = async (req, res) => {
  try {
    await initializeDefaultChartOfAccounts();
    res.json({ success: true, message: 'Chart of accounts initialized successfully' });
  } catch (error: any) {
    console.error('Error initializing accounts:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get all account types
export const getAccountTypes: RequestHandler = async (req, res) => {
  try {
    const types = await ChartOfAccountType.find().sort({ name: 1 });
    res.json(types);
  } catch (error: any) {
    console.error('Error fetching account types:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get all account sub-types
export const getAccountSubTypes: RequestHandler = async (req, res) => {
  try {
    const { type_id } = req.query;
    const query = type_id ? { type_id } : {};
    const subTypes = await ChartOfAccountSubType.find(query).sort({ name: 1 });
    res.json(subTypes);
  } catch (error: any) {
    console.error('Error fetching account sub-types:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get all chart of accounts
export const getChartOfAccounts: RequestHandler = async (req, res) => {
  try {
    const { type_id, is_enabled } = req.query;
    const query: any = {};
    if (type_id) query.type_id = type_id;
    if (is_enabled !== undefined) query.is_enabled = is_enabled === 'true';

    const accounts = await ChartOfAccount.find(query)
      .populate('type_id')
      .populate('sub_type_id')
      .sort({ code: 1 });
    res.json(accounts);
  } catch (error: any) {
    console.error('Error fetching chart of accounts:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get single account
export const getAccount: RequestHandler = async (req, res) => {
  try {
    const account = await ChartOfAccount.findById(req.params.id)
      .populate('type_id')
      .populate('sub_type_id');
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }
    res.json(account);
  } catch (error: any) {
    console.error('Error fetching account:', error);
    res.status(500).json({ error: error.message });
  }
};

// Create new account
export const createAccount: RequestHandler = async (req, res) => {
  try {
    const account = await ChartOfAccount.create(req.body);
    res.status(201).json(account);
  } catch (error: any) {
    console.error('Error creating account:', error);
    res.status(500).json({ error: error.message });
  }
};

// Update account
export const updateAccount: RequestHandler = async (req, res) => {
  try {
    const account = await ChartOfAccount.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }
    res.json(account);
  } catch (error: any) {
    console.error('Error updating account:', error);
    res.status(500).json({ error: error.message });
  }
};

// Delete account
export const deleteAccount: RequestHandler = async (req, res) => {
  try {
    // Check if account has transactions
    const hasTransactions = await TransactionLine.exists({ account_id: req.params.id });
    if (hasTransactions) {
      return res.status(400).json({ error: 'Cannot delete account with existing transactions' });
    }

    const account = await ChartOfAccount.findByIdAndDelete(req.params.id);
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }
    res.json({ success: true, message: 'Account deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting account:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get account balance
export const getBalance: RequestHandler = async (req, res) => {
  try {
    const { account_id } = req.params;
    const { end_date } = req.query;
    const endDate = end_date ? new Date(end_date as string) : undefined;
    const balance = await getAccountBalance(account_id, endDate);
    res.json({ account_id, balance, end_date: endDate });
  } catch (error: any) {
    console.error('Error getting account balance:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get all journal entries
export const getJournalEntries: RequestHandler = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const query: any = {};
    if (start_date || end_date) {
      query.date = {};
      if (start_date) query.date.$gte = new Date(start_date as string);
      if (end_date) query.date.$lte = new Date(end_date as string);
    }

    const entries = await JournalEntry.find(query).sort({ date: -1, journal_number: -1 });
    res.json(entries);
  } catch (error: any) {
    console.error('Error fetching journal entries:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get single journal entry with items
export const getJournalEntry: RequestHandler = async (req, res) => {
  try {
    const entry = await JournalEntry.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ error: 'Journal entry not found' });
    }

    const items = await JournalItem.find({ journal_entry_id: entry._id }).populate('account_id');
    res.json({ entry, items });
  } catch (error: any) {
    console.error('Error fetching journal entry:', error);
    res.status(500).json({ error: error.message });
  }
};

// Create journal entry
export const createJournalEntry: RequestHandler = async (req, res) => {
  try {
    const { date, reference, description, items } = req.body;

    // Validate items
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Journal entry must have at least one item' });
    }

    // Validate debits = credits
    const { totalDebit, totalCredit } = validateJournalEntry(items);

    // Get next journal number
    const journal_number = await getNextJournalNumber();

    // Create journal entry
    const entry = await JournalEntry.create({
      journal_number,
      date: new Date(date),
      reference,
      description,
      total_debit: totalDebit,
      total_credit: totalCredit,
    });

    // Create journal items
    const journalItems = await Promise.all(
      items.map((item: any) =>
        JournalItem.create({
          journal_entry_id: entry._id,
          account_id: item.account_id,
          description: item.description,
          debit: item.debit || 0,
          credit: item.credit || 0,
        })
      )
    );

    // Create transaction lines
    await Promise.all(
      items.map((item: any) =>
        addTransactionLine({
          account_id: item.account_id,
          reference: 'JournalEntry',
          reference_id: entry._id,
          date: new Date(date),
          debit: item.debit || 0,
          credit: item.credit || 0,
          description: item.description,
        })
      )
    );

    res.status(201).json({ entry, items: journalItems });
  } catch (error: any) {
    console.error('Error creating journal entry:', error);
    res.status(500).json({ error: error.message });
  }
};

// Delete journal entry
export const deleteJournalEntry: RequestHandler = async (req, res) => {
  try {
    const entry = await JournalEntry.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ error: 'Journal entry not found' });
    }

    // Delete journal items
    await JournalItem.deleteMany({ journal_entry_id: entry._id });

    // Delete transaction lines
    await TransactionLine.deleteMany({
      reference: 'JournalEntry',
      reference_id: entry._id,
    });

    // Delete entry
    await entry.deleteOne();

    res.json({ success: true, message: 'Journal entry deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting journal entry:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get transaction lines (ledger)
export const getTransactionLines: RequestHandler = async (req, res) => {
  try {
    const { account_id, start_date, end_date, reference } = req.query;
    const query: any = {};

    if (account_id) query.account_id = account_id;
    if (reference) query.reference = reference;
    if (start_date || end_date) {
      query.date = {};
      if (start_date) query.date.$gte = new Date(start_date as string);
      if (end_date) query.date.$lte = new Date(end_date as string);
    }

    const transactions = await TransactionLine.find(query)
      .populate('account_id')
      .sort({ date: -1, created_at: -1 });

    res.json(transactions);
  } catch (error: any) {
    console.error('Error fetching transaction lines:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get trial balance
export const getTrialBalance: RequestHandler = async (req, res) => {
  try {
    const { end_date } = req.query;
    const dateFilter = end_date ? { date: { $lte: new Date(end_date as string) } } : {};

    const accounts = await ChartOfAccount.find({ is_enabled: true })
      .populate('type_id')
      .sort({ code: 1 });

    const trialBalance = await Promise.all(
      accounts.map(async (account) => {
        const transactions = await TransactionLine.find({
          account_id: account._id,
          ...dateFilter,
        });

        const totalDebit = transactions.reduce((sum, txn) => sum + txn.debit, 0);
        const totalCredit = transactions.reduce((sum, txn) => sum + txn.credit, 0);
        const balance = totalDebit - totalCredit;

        return {
          account_id: account._id,
          code: account.code,
          name: account.name,
          type: (account.type_id as any).name,
          total_debit: totalDebit,
          total_credit: totalCredit,
          balance,
        };
      })
    );

    // Calculate totals
    const totals = trialBalance.reduce(
      (acc, item) => ({
        total_debit: acc.total_debit + item.total_debit,
        total_credit: acc.total_credit + item.total_credit,
      }),
      { total_debit: 0, total_credit: 0 }
    );

    res.json({ trial_balance: trialBalance, totals });
  } catch (error: any) {
    console.error('Error generating trial balance:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get income statement
export const getIncomeStatement: RequestHandler = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const dateFilter: any = {};
    if (start_date) dateFilter.$gte = new Date(start_date as string);
    if (end_date) dateFilter.$lte = new Date(end_date as string);

    const query = Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {};

    // Get Income accounts
    const incomeType = await ChartOfAccountType.findOne({ name: 'Income' });
    const incomeAccounts = await ChartOfAccount.find({ type_id: incomeType?._id });
    const incomeAccountIds = incomeAccounts.map((acc) => acc._id);

    const incomeTransactions = await TransactionLine.find({
      account_id: { $in: incomeAccountIds },
      ...query,
    });
    const totalIncome = incomeTransactions.reduce(
      (sum, txn) => sum + txn.credit - txn.debit,
      0
    );

    // Get COGS accounts
    const cogsType = await ChartOfAccountType.findOne({ name: 'Cost of Goods Sold' });
    const cogsAccounts = await ChartOfAccount.find({ type_id: cogsType?._id });
    const cogsAccountIds = cogsAccounts.map((acc) => acc._id);

    const cogsTransactions = await TransactionLine.find({
      account_id: { $in: cogsAccountIds },
      ...query,
    });
    const totalCOGS = cogsTransactions.reduce((sum, txn) => sum + txn.debit - txn.credit, 0);

    // Get Expense accounts
    const expenseType = await ChartOfAccountType.findOne({ name: 'Expenses' });
    const expenseAccounts = await ChartOfAccount.find({ type_id: expenseType?._id });
    const expenseAccountIds = expenseAccounts.map((acc) => acc._id);

    const expenseTransactions = await TransactionLine.find({
      account_id: { $in: expenseAccountIds },
      ...query,
    });
    const totalExpenses = expenseTransactions.reduce(
      (sum, txn) => sum + txn.debit - txn.credit,
      0
    );

    const grossProfit = totalIncome - totalCOGS;
    const netIncome = grossProfit - totalExpenses;

    res.json({
      total_income: totalIncome,
      total_cogs: totalCOGS,
      gross_profit: grossProfit,
      total_expenses: totalExpenses,
      net_income: netIncome,
      start_date,
      end_date,
    });
  } catch (error: any) {
    console.error('Error generating income statement:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get balance sheet
export const getBalanceSheet: RequestHandler = async (req, res) => {
  try {
    const { end_date } = req.query;
    const dateFilter = end_date ? { date: { $lte: new Date(end_date as string) } } : {};

    // Get Assets
    const assetsType = await ChartOfAccountType.findOne({ name: 'Assets' });
    const assetsAccounts = await ChartOfAccount.find({ type_id: assetsType?._id });
    const assetsAccountIds = assetsAccounts.map((acc) => acc._id);

    const assetsTransactions = await TransactionLine.find({
      account_id: { $in: assetsAccountIds },
      ...dateFilter,
    });
    const totalAssets = assetsTransactions.reduce((sum, txn) => sum + txn.debit - txn.credit, 0);

    // Get Liabilities
    const liabilitiesType = await ChartOfAccountType.findOne({ name: 'Liabilities' });
    const liabilitiesAccounts = await ChartOfAccount.find({ type_id: liabilitiesType?._id });
    const liabilitiesAccountIds = liabilitiesAccounts.map((acc) => acc._id);

    const liabilitiesTransactions = await TransactionLine.find({
      account_id: { $in: liabilitiesAccountIds },
      ...dateFilter,
    });
    const totalLiabilities = liabilitiesTransactions.reduce(
      (sum, txn) => sum + txn.credit - txn.debit,
      0
    );

    // Get Equity
    const equityType = await ChartOfAccountType.findOne({ name: 'Equity' });
    const equityAccounts = await ChartOfAccount.find({ type_id: equityType?._id });
    const equityAccountIds = equityAccounts.map((acc) => acc._id);

    const equityTransactions = await TransactionLine.find({
      account_id: { $in: equityAccountIds },
      ...dateFilter,
    });
    const totalEquity = equityTransactions.reduce((sum, txn) => sum + txn.credit - txn.debit, 0);

    // Calculate Net Income (Revenue - COGS - Expenses)
    // This is needed because in accounting, Net Income flows into Retained Earnings
    
    // Get Income
    const incomeType = await ChartOfAccountType.findOne({ name: 'Income' });
    const incomeAccounts = await ChartOfAccount.find({ type_id: incomeType?._id });
    const incomeAccountIds = incomeAccounts.map((acc) => acc._id);
    const incomeTransactions = await TransactionLine.find({
      account_id: { $in: incomeAccountIds },
      ...dateFilter,
    });
    const totalIncome = incomeTransactions.reduce((sum, txn) => sum + txn.credit - txn.debit, 0);

    // Get COGS
    const cogsType = await ChartOfAccountType.findOne({ name: 'Cost of Goods Sold' });
    const cogsAccounts = await ChartOfAccount.find({ type_id: cogsType?._id });
    const cogsAccountIds = cogsAccounts.map((acc) => acc._id);
    const cogsTransactions = await TransactionLine.find({
      account_id: { $in: cogsAccountIds },
      ...dateFilter,
    });
    const totalCOGS = cogsTransactions.reduce((sum, txn) => sum + txn.debit - txn.credit, 0);

    // Get Expenses
    const expenseType = await ChartOfAccountType.findOne({ name: 'Expenses' });
    const expenseAccounts = await ChartOfAccount.find({ type_id: expenseType?._id });
    const expenseAccountIds = expenseAccounts.map((acc) => acc._id);
    const expenseTransactions = await TransactionLine.find({
      account_id: { $in: expenseAccountIds },
      ...dateFilter,
    });
    const totalExpenses = expenseTransactions.reduce((sum, txn) => sum + txn.debit - txn.credit, 0);

    // Net Income = Revenue - COGS - Expenses
    const netIncome = totalIncome - totalCOGS - totalExpenses;

    // Total Equity includes both equity accounts AND net income (retained earnings)
    const totalEquityWithIncome = totalEquity + netIncome;

    res.json({
      total_assets: totalAssets,
      total_liabilities: totalLiabilities,
      total_equity: totalEquityWithIncome,
      net_income: netIncome,
      total_liabilities_and_equity: totalLiabilities + totalEquityWithIncome,
      end_date,
    });
  } catch (error: any) {
    console.error('Error generating balance sheet:', error);
    res.status(500).json({ error: error.message });
  }
};
