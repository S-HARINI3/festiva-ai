import { useState, useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  Coins,
  TrendingUp,
  ShieldCheck,
  DollarSign,
  AlertTriangle,
  Sparkles,
  Download,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  Filter,
  Search,
  Info,
  X,
  Layers,
} from 'lucide-react';
import type { SavedEvent, ExpenseItem, ExpenseStatus, BudgetCategory, BudgetRescueResponse } from '../../types/events';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { useTheme } from '../../contexts/ThemeContext';
import { Card, Button, Badge } from '../ui';
import {
  getBudgetRescue,
  applyBudgetRescue,
  addBudgetExpense,
  updateBudgetExpense,
  deleteBudgetExpense,
  updateBudgetCategories,
} from '../../services/api';
import BudgetRescueModal from './BudgetRescueModal';

interface BudgetStudioViewProps {
  events: SavedEvent[];
  userId?: string;
  onRefreshEvents?: () => void;
}

const LIGHT_PALETTE = ['#713B70', '#D8B477', '#23856D', '#C18432', '#9B639A', '#588399', '#D65F68', '#B692C4'];
const DARK_PALETTE = ['#C8A8F0', '#E2C18C', '#70D5B0', '#E6A9C4', '#F0C477', '#7AC5EB', '#FF929C', '#DBBCFA'];

// Financial Rounding Helper to prevent floating-point quirks
function round2(val: number): number {
  return Math.round((val + Number.EPSILON) * 100) / 100;
}

export default function BudgetStudioView({
  events,
  userId = 'demo-user-001',
  onRefreshEvents,
}: BudgetStudioViewProps) {
  const { isDark } = useTheme();
  const palette = isDark ? DARK_PALETTE : LIGHT_PALETTE;

  // Selected celebration
  const [selectedEventId, setSelectedEventId] = useState<string>(() => {
    return events.length > 0 ? events[0].id : '';
  });

  // Current active event
  const currentEvent = useMemo(() => {
    return events.find((e) => e.id === selectedEventId) || events[0] || null;
  }, [events, selectedEventId]);

  // Currency
  const currency = currentEvent?.plan_data?.currency || 'INR';

  // Raw categories from plan_data
  const rawCategories: BudgetCategory[] = useMemo(() => {
    if (!currentEvent?.plan_data) return [];
    const plan = currentEvent.plan_data;
    const cats = plan.budget_plan?.categories || plan.budget?.categories || plan.budget_breakdown || [];
    return cats;
  }, [currentEvent]);

  // Expenses from plan_data
  const expensesList: ExpenseItem[] = useMemo(() => {
    if (!currentEvent?.plan_data?.expenses) return [];
    return currentEvent.plan_data.expenses;
  }, [currentEvent]);

  // Total Planned Budget
  const totalPlannedBudget = useMemo(() => {
    if (!currentEvent?.plan_data) return 0;
    const plan = currentEvent.plan_data;
    const directTotal = plan.budget_plan?.total_budget || plan.budget?.total_budget || plan.total_estimated_budget;
    if (directTotal && directTotal > 0) return directTotal;
    // Fallback: sum of raw category allocations
    return rawCategories.reduce((sum, c) => sum + (c.allocated_amount || c.estimated_amount || 0), 0);
  }, [currentEvent, rawCategories]);

  // Contingency Reserve
  const contingencyReserve = useMemo(() => {
    if (!currentEvent?.plan_data) return 0;
    const plan = currentEvent.plan_data;
    if (typeof plan.budget_plan?.contingency_amount === 'number') {
      return plan.budget_plan.contingency_amount;
    }
    if (typeof plan.budget?.contingency_amount === 'number') {
      return plan.budget.contingency_amount;
    }
    return round2(totalPlannedBudget * 0.1);
  }, [currentEvent, totalPlannedBudget]);

  // Compute category stats merging planned and actual expenses
  const categoriesWithStats = useMemo(() => {
    return rawCategories.map((cat) => {
      const planned = cat.allocated_amount || cat.estimated_amount || 0;
      // Actual from recorded expenses matching this category
      const actualFromExpenses = expensesList
        .filter((exp) => exp.category.toLowerCase().trim() === cat.category.toLowerCase().trim())
        .reduce((sum, exp) => sum + Number(exp.amount || 0), 0);
      const actual = round2(actualFromExpenses);
      const difference = round2(planned - actual);
      const percentageOfTotal =
        totalPlannedBudget > 0 ? round2((planned / totalPlannedBudget) * 100) : 0;

      return {
        ...cat,
        planned_amount: planned,
        actual_amount: actual,
        difference,
        percentage_of_total: percentageOfTotal,
        notes: cat.cost_notes || (cat.items && cat.items.length > 0 ? cat.items.slice(0, 3).join(', ') : 'Allocated category service'),
      };
    });
  }, [rawCategories, expensesList, totalPlannedBudget]);

  // Actual Spending
  const totalActualSpending = useMemo(() => {
    return round2(expensesList.reduce((sum, exp) => sum + Number(exp.amount || 0), 0));
  }, [expensesList]);

  // Remaining Amount
  const remainingAmount = useMemo(() => {
    return round2(totalPlannedBudget - totalActualSpending);
  }, [totalPlannedBudget, totalActualSpending]);

  // Amount Committed to Vendors
  const committedAmount = useMemo(() => {
    const committedExpenses = expensesList
      .filter((exp) => exp.status === 'vendor_commitment')
      .reduce((sum, exp) => sum + Number(exp.amount || 0), 0);
    return round2(committedExpenses);
  }, [expensesList]);

  // Budget Utilization Percentage
  const utilizationPercentage = useMemo(() => {
    if (totalPlannedBudget <= 0) return 0;
    return Math.min(999, Math.round((totalActualSpending / totalPlannedBudget) * 100));
  }, [totalActualSpending, totalPlannedBudget]);

  // Over-budget state
  const isOverBudget = totalActualSpending > totalPlannedBudget && totalPlannedBudget > 0;
  const overrunAmount = Math.max(0, round2(totalActualSpending - totalPlannedBudget));

  // ── Modals & Actions State ──────────────────────────────────────────────────
  const [isRescueOpen, setIsRescueOpen] = useState(false);
  const [rescueLoading, setRescueLoading] = useState(false);
  const [rescueData, setRescueData] = useState<BudgetRescueResponse | null>(null);
  const [isApplyingRescue, setIsApplyingRescue] = useState(false);

  // Expense modal state
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null);
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [expenseStatus, setExpenseStatus] = useState<ExpenseStatus>('logged_expense');
  const [expenseNotes, setExpenseNotes] = useState('');
  const [expenseSaving, setExpenseSaving] = useState(false);

  // Delete Expense Confirmation
  const [expenseToDelete, setExpenseToDelete] = useState<ExpenseItem | null>(null);
  const [expenseDeleting, setExpenseDeleting] = useState(false);

  // Add / Edit Category Modal
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [categoryPlanned, setCategoryPlanned] = useState('');
  const [categoryNotes, setCategoryNotes] = useState('');
  const [categorySaving, setCategorySaving] = useState(false);

  // Filters for Expense Ledger
  const [ledgerCategoryFilter, setLedgerCategoryFilter] = useState('all');
  const [ledgerDateFilter, setLedgerDateFilter] = useState('');
  const [ledgerSearch, setLedgerSearch] = useState('');

  // Filtered Expenses
  const filteredExpenses = useMemo(() => {
    return expensesList.filter((exp) => {
      if (ledgerCategoryFilter !== 'all' && exp.category !== ledgerCategoryFilter) {
        return false;
      }
      if (ledgerDateFilter && !exp.date.startsWith(ledgerDateFilter)) {
        return false;
      }
      if (ledgerSearch.trim()) {
        const query = ledgerSearch.toLowerCase();
        const matchesTitle = exp.title.toLowerCase().includes(query);
        const matchesNotes = exp.notes?.toLowerCase().includes(query);
        const matchesCategory = exp.category.toLowerCase().includes(query);
        if (!matchesTitle && !matchesNotes && !matchesCategory) return false;
      }
      return true;
    });
  }, [expensesList, ledgerCategoryFilter, ledgerDateFilter, ledgerSearch]);

  // ── Budget Rescue Handler ──────────────────────────────────────────────────
  const handleOpenBudgetRescue = async () => {
    if (!currentEvent) return;
    setIsRescueOpen(true);
    setRescueLoading(true);
    try {
      const data = await getBudgetRescue(currentEvent.id, userId);
      setRescueData(data);
    } catch (err) {
      console.error('Failed to load rescue recommendations', err);
    } finally {
      setRescueLoading(false);
    }
  };

  const handleApplyRescue = async (
    tier: string,
    revisedCategories: BudgetCategory[],
    revisedContingency: number
  ) => {
    if (!currentEvent) return;
    setIsApplyingRescue(true);
    try {
      await applyBudgetRescue(
        currentEvent.id,
        {
          tier,
          revised_categories: revisedCategories,
          revised_contingency: revisedContingency,
        },
        userId
      );
      if (onRefreshEvents) onRefreshEvents();
    } catch (err) {
      console.error('Failed to apply rescue plan', err);
    } finally {
      setIsApplyingRescue(false);
    }
  };

  // ── Expense CRUD Handlers ──────────────────────────────────────────────────
  const handleOpenAddExpense = (presetCategory?: string) => {
    setEditingExpense(null);
    setExpenseTitle('');
    setExpenseCategory(presetCategory || (rawCategories[0]?.category || 'Decorations'));
    setExpenseAmount('');
    setExpenseDate(new Date().toISOString().split('T')[0]);
    setExpenseStatus('logged_expense');
    setExpenseNotes('');
    setIsExpenseModalOpen(true);
  };

  const handleOpenEditExpense = (expense: ExpenseItem) => {
    setEditingExpense(expense);
    setExpenseTitle(expense.title);
    setExpenseCategory(expense.category);
    setExpenseAmount(expense.amount.toString());
    setExpenseDate(expense.date);
    setExpenseStatus(expense.status);
    setExpenseNotes(expense.notes || '');
    setIsExpenseModalOpen(true);
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEvent) return;
    const parsedAmount = parseFloat(expenseAmount);
    if (isNaN(parsedAmount) || parsedAmount < 0) {
      alert('Please enter a valid non-negative amount.');
      return;
    }

    setExpenseSaving(true);
    try {
      if (editingExpense) {
        await updateBudgetExpense(
          currentEvent.id,
          editingExpense.id,
          {
            ...editingExpense,
            title: expenseTitle.trim() || 'Recorded Expense',
            category: expenseCategory,
            amount: round2(parsedAmount),
            date: expenseDate,
            status: expenseStatus,
            notes: expenseNotes.trim(),
            is_verified_payment: false,
          },
          userId
        );
      } else {
        await addBudgetExpense(
          currentEvent.id,
          {
            title: expenseTitle.trim() || 'Recorded Expense',
            category: expenseCategory,
            amount: round2(parsedAmount),
            date: expenseDate,
            status: expenseStatus,
            notes: expenseNotes.trim(),
            is_verified_payment: false,
          },
          userId
        );
      }
      setIsExpenseModalOpen(false);
      if (onRefreshEvents) onRefreshEvents();
    } catch (err) {
      console.error('Failed to save expense', err);
    } finally {
      setExpenseSaving(false);
    }
  };

  const handleConfirmDeleteExpense = async () => {
    if (!currentEvent || !expenseToDelete) return;
    setExpenseDeleting(true);
    try {
      await deleteBudgetExpense(currentEvent.id, expenseToDelete.id, userId);
      setExpenseToDelete(null);
      if (onRefreshEvents) onRefreshEvents();
    } catch (err) {
      console.error('Failed to delete expense', err);
    } finally {
      setExpenseDeleting(false);
    }
  };

  // ── Category Add / Remove Handlers ─────────────────────────────────────────
  const handleOpenAddCategory = () => {
    setCategoryName('');
    setCategoryPlanned('');
    setCategoryNotes('');
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEvent || !categoryName.trim()) return;
    const parsedAmount = parseFloat(categoryPlanned);
    if (isNaN(parsedAmount) || parsedAmount < 0) {
      alert('Please specify a valid non-negative allocation amount.');
      return;
    }

    setCategorySaving(true);
    try {
      const existing = [...rawCategories];
      const newCategory: BudgetCategory = {
        category: categoryName.trim(),
        estimated_amount: round2(parsedAmount),
        allocated_amount: round2(parsedAmount),
        percentage: totalPlannedBudget > 0 ? Math.round((parsedAmount / totalPlannedBudget) * 100) : 0,
        items: [categoryNotes.trim() || 'Custom allocation'],
        cost_notes: categoryNotes.trim(),
      };
      existing.push(newCategory);

      await updateBudgetCategories(
        currentEvent.id,
        {
          categories: existing,
          contingency_amount: contingencyReserve,
          total_budget: totalPlannedBudget + round2(parsedAmount),
        },
        userId
      );
      setIsCategoryModalOpen(false);
      if (onRefreshEvents) onRefreshEvents();
    } catch (err) {
      console.error('Failed to add category', err);
    } finally {
      setCategorySaving(false);
    }
  };

  const handleRemoveCategory = async (catName: string) => {
    if (!currentEvent) return;
    const hasExpenses = expensesList.some(
      (exp) => exp.category.toLowerCase().trim() === catName.toLowerCase().trim()
    );
    if (hasExpenses) {
      alert(`Cannot remove "${catName}" because it already has recorded expenses in the ledger. Delete the associated expenses first.`);
      return;
    }

    if (!confirm(`Are you sure you want to remove the category "${catName}"?`)) return;

    try {
      const remainingCats = rawCategories.filter(
        (c) => c.category.toLowerCase().trim() !== catName.toLowerCase().trim()
      );
      await updateBudgetCategories(
        currentEvent.id,
        {
          categories: remainingCats,
          contingency_amount: contingencyReserve,
        },
        userId
      );
      if (onRefreshEvents) onRefreshEvents();
    } catch (err) {
      console.error('Failed to remove category', err);
    }
  };

  // ── CSV Export Functionality ────────────────────────────────────────────────
  const handleExportCSV = () => {
    if (!currentEvent) return;

    const eventNameSafe = currentEvent.event_name.replace(/[^a-z0-9_-]/gi, '_');
    const today = new Date().toISOString().split('T')[0];

    let csvContent = `FESTIVA AI - SMART BUDGET STUDIO EXPORT\n`;
    csvContent += `Celebration:,"${currentEvent.event_name}"\n`;
    csvContent += `Event Date:,"${currentEvent.event_date}"\n`;
    csvContent += `Currency:,"${currency}"\n`;
    csvContent += `Total Planned Budget:,${totalPlannedBudget}\n`;
    csvContent += `Actual Spending:,${totalActualSpending}\n`;
    csvContent += `Remaining Variance:,${remainingAmount}\n`;
    csvContent += `Vendor Commitments:,${committedAmount}\n`;
    csvContent += `Contingency Reserve:,${contingencyReserve}\n`;
    csvContent += `Budget Utilization:,${utilizationPercentage}%\n\n`;

    // 1. Category Allocation Table
    csvContent += `CATEGORY BREAKDOWN & ALLOCATIONS\n`;
    csvContent += `Category,Planned Allocation,Actual Spending,Difference (Surplus/Deficit),% of Total Budget,Notes / Inclusions\n`;
    categoriesWithStats.forEach((cat) => {
      csvContent += `"${cat.category}",${cat.planned_amount},${cat.actual_amount},${cat.difference},${cat.percentage_of_total}%,"${(cat.notes || '').replace(/"/g, '""')}"\n`;
    });
    csvContent += `\n`;

    // 2. Detailed Expenses Ledger
    csvContent += `DETAILED EXPENSES LEDGER\n`;
    csvContent += `Date,Expense Title,Category,Status,Amount,Notes,Payment Gateway Status\n`;
    expensesList.forEach((exp) => {
      csvContent += `"${exp.date}","${exp.title.replace(/"/g, '""')}","${exp.category}","${exp.status}",${exp.amount},"${(exp.notes || '').replace(/"/g, '""')}","Self-Reported (Unverified)"\n`;
    });

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Festiva_Budget_${eventNameSafe}_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Recharts styling
  const tooltipStyle = isDark
    ? { background: '#292333', border: '1px solid #41364B', borderRadius: 12, color: '#F7F2FA' }
    : { background: '#FFFFFF', border: '1px solid #E9E3E8', borderRadius: 12, color: '#26232B' };

  // Data for Category Share Donut
  const donutData = categoriesWithStats.map((c) => ({
    name: c.category,
    value: c.planned_amount,
    percentage: c.percentage_of_total,
  }));

  // Data for Planned vs Actual Bar Chart
  const barData = categoriesWithStats.map((c) => ({
    name: c.category.length > 11 ? c.category.slice(0, 10) + '..' : c.category,
    fullName: c.category,
    planned: c.planned_amount,
    actual: c.actual_amount,
  }));

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* ── Top Bar: Event Selector & Global Actions ───────────────────────── */}
      <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center shrink-0">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display font-bold text-xl text-[var(--text-primary)]">
                Smart Budget Studio
              </h2>
              {isOverBudget && (
                <Badge variant="danger" size="sm" className="animate-pulse">
                  Over Target
                </Badge>
              )}
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              Category-based tracking, planned vs. actual analytics &amp; AI rescue engine
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {events.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--text-secondary)] font-semibold hidden sm:inline">
                Celebration:
              </span>
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] text-xs font-bold text-[var(--text-primary)] outline-none cursor-pointer"
              >
                {events.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.event_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Rescue My Budget Button */}
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenBudgetRescue}
            className={`cursor-pointer flex items-center gap-1.5 ${
              isOverBudget
                ? 'bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-700 hover:to-rose-700 shadow-md ring-2 ring-rose-500/30 animate-pulse'
                : ''
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Rescue My Budget</span>
          </Button>

          {/* Export CSV Button */}
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportCSV}
            className="cursor-pointer flex items-center gap-1.5"
            title="Download CSV breakdown and ledger"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </Button>

          {/* Record Expense Button */}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleOpenAddExpense()}
            className="cursor-pointer flex items-center gap-1.5 bg-[var(--surface-elevated)] text-[var(--text-primary)] border border-[var(--border)]"
          >
            <Plus className="w-3.5 h-3.5 text-[var(--primary)]" />
            <span>Record Expense</span>
          </Button>
        </div>
      </div>

      {/* ── Over-Budget Warning Banner ─────────────────────────────────────── */}
      {isOverBudget && (
        <div className="p-4 sm:p-5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[var(--text-primary)]">
                Budget Overrun Alert: Exceeding Target by {formatCurrency(overrunAmount, currency)}
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Actual expenditures currently stand at {formatCurrency(totalActualSpending, currency)} against the planned {formatCurrency(totalPlannedBudget, currency)}. Use the Rescue Engine to generate balanced alternatives.
              </p>
            </div>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenBudgetRescue}
            className="self-start sm:self-auto shrink-0 bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer"
          >
            Launch Budget Rescue
          </Button>
        </div>
      )}

      {/* ── 6 Core Budget Metric Cards ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* 1. Total Planned Budget */}
        <Card variant="default" padding="sm" className="space-y-1">
          <div className="flex items-center justify-between text-[var(--text-secondary)]">
            <span className="text-[10px] font-bold uppercase tracking-wider">Planned Total</span>
            <DollarSign className="w-3.5 h-3.5 text-[var(--primary)]" />
          </div>
          <div className="font-display font-bold text-lg sm:text-xl text-[var(--text-primary)] truncate">
            {formatCurrency(totalPlannedBudget, currency)}
          </div>
          <span className="text-[10px] text-[var(--text-secondary)] block truncate">
            Target benchmark
          </span>
        </Card>

        {/* 2. Actual Spending */}
        <Card variant="default" padding="sm" className="space-y-1">
          <div className="flex items-center justify-between text-[var(--text-secondary)]">
            <span className="text-[10px] font-bold uppercase tracking-wider">Actual Spent</span>
            <TrendingUp className={`w-3.5 h-3.5 ${isOverBudget ? 'text-rose-500' : 'text-amber-500'}`} />
          </div>
          <div className={`font-display font-bold text-lg sm:text-xl truncate ${
            isOverBudget ? 'text-rose-600 dark:text-rose-400' : 'text-[var(--text-primary)]'
          }`}>
            {formatCurrency(totalActualSpending, currency)}
          </div>
          <span className="text-[10px] text-[var(--text-secondary)] block truncate">
            {expensesList.length} recorded items
          </span>
        </Card>

        {/* 3. Remaining Amount */}
        <Card variant="default" padding="sm" className="space-y-1">
          <div className="flex items-center justify-between text-[var(--text-secondary)]">
            <span className="text-[10px] font-bold uppercase tracking-wider">Remaining</span>
            <ShieldCheck className={`w-3.5 h-3.5 ${remainingAmount < 0 ? 'text-rose-500' : 'text-emerald-500'}`} />
          </div>
          <div className={`font-display font-bold text-lg sm:text-xl truncate ${
            remainingAmount < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
          }`}>
            {formatCurrency(remainingAmount, currency)}
          </div>
          <span className="text-[10px] text-[var(--text-secondary)] block truncate">
            {remainingAmount >= 0 ? 'Surplus buffer' : 'Deficit shortfall'}
          </span>
        </Card>

        {/* 4. Committed to Vendors */}
        <Card variant="default" padding="sm" className="space-y-1">
          <div className="flex items-center justify-between text-[var(--text-secondary)]">
            <span className="text-[10px] font-bold uppercase tracking-wider">Committed</span>
            <Coins className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="font-display font-bold text-lg sm:text-xl text-[var(--warning)] truncate">
            {formatCurrency(committedAmount, currency)}
          </div>
          <span className="text-[10px] text-[var(--text-secondary)] block truncate">
            Vendor contracts
          </span>
        </Card>

        {/* 5. Contingency Reserve */}
        <Card variant="default" padding="sm" className="space-y-1">
          <div className="flex items-center justify-between text-[var(--text-secondary)]">
            <span className="text-[10px] font-bold uppercase tracking-wider">Contingency</span>
            <Layers className="w-3.5 h-3.5 text-[var(--accent)]" />
          </div>
          <div className="font-display font-bold text-lg sm:text-xl text-[var(--accent)] truncate">
            {formatCurrency(contingencyReserve, currency)}
          </div>
          <span className="text-[10px] text-[var(--text-secondary)] block truncate">
            Safety reserve
          </span>
        </Card>

        {/* 6. Budget Utilization Percentage */}
        <Card variant="default" padding="sm" className="space-y-1">
          <div className="flex items-center justify-between text-[var(--text-secondary)]">
            <span className="text-[10px] font-bold uppercase tracking-wider">Utilization</span>
            <span className="font-mono text-xs font-bold text-[var(--text-primary)]">{utilizationPercentage}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-[var(--border)] overflow-hidden mt-2">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                utilizationPercentage > 100
                  ? 'bg-rose-500'
                  : utilizationPercentage > 85
                  ? 'bg-amber-500'
                  : 'bg-[var(--primary)]'
              }`}
              style={{ width: `${Math.min(100, utilizationPercentage)}%` }}
            />
          </div>
          <span className="text-[10px] text-[var(--text-secondary)] block truncate">
            {utilizationPercentage}% of target
          </span>
        </Card>
      </div>

      {/* ── Recharts Visualizations (Donut & Planned vs. Actual Bar) ──────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Share Donut Chart */}
        <Card variant="default" padding="md" className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-base text-[var(--text-primary)]">
              Category Allocation Share
            </h3>
            <span className="text-xs text-[var(--text-secondary)]">Target % split</span>
          </div>

          <div className="h-64 w-full">
            {donutData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {donutData.map((_, i) => (
                      <Cell key={i} fill={palette[i % palette.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: any) => [formatCurrency(Number(v), currency), 'Allocation']}
                    contentStyle={tooltipStyle}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-[var(--text-secondary)]">
                No category data available
              </div>
            )}
          </div>
        </Card>

        {/* Planned vs. Actual Grouped Bar Chart */}
        <Card variant="default" padding="md" className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-base text-[var(--text-primary)]">
              Planned vs. Actual Spending
            </h3>
            <span className="text-xs text-[var(--text-secondary)]">Side-by-side variance</span>
          </div>

          <div className="h-64 w-full">
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#41364B' : '#E9E3E8'} opacity={0.5} />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: isDark ? '#B7AFBF' : '#77717D', fontSize: 9 }}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                  />
                  <YAxis
                    tick={{ fill: isDark ? '#B7AFBF' : '#77717D', fontSize: 9 }}
                    tickFormatter={(v) => (v >= 100000 ? `${(v / 100000).toFixed(0)}L` : `${(v / 1000).toFixed(0)}k`)}
                  />
                  <Tooltip
                    formatter={(v: any, name: any) => [
                      formatCurrency(Number(v), currency),
                      name === 'planned' ? 'Planned Target' : 'Actual Spent',
                    ]}
                    contentStyle={tooltipStyle}
                  />
                  <Legend
                    verticalAlign="top"
                    wrapperStyle={{ fontSize: '11px', paddingBottom: '10px' }}
                  />
                  <Bar dataKey="planned" fill={isDark ? '#C8A8F0' : '#713B70'} name="Planned" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="actual" fill={isDark ? '#E2C18C' : '#D8B477'} name="Actual" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-[var(--text-secondary)]">
                No spending data available
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* ── Interactive Category-Based Budget Table ───────────────────────── */}
      <Card variant="default" padding="none" className="overflow-hidden space-y-0">
        <div className="p-4 sm:p-5 border-b border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[var(--surface)]">
          <div>
            <h3 className="font-display font-bold text-base text-[var(--text-primary)]">
              Category Budget Allocations
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Interactive allocation ledger with real-time actual expense reconciliation
            </p>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleOpenAddCategory}
            className="self-start sm:self-auto cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Category</span>
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[var(--surface-elevated)] border-b border-[var(--border)] text-[var(--text-secondary)] uppercase tracking-wider text-[10px] font-semibold">
              <tr>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Planned Amount</th>
                <th className="p-3.5">Actual Amount</th>
                <th className="p-3.5">Difference</th>
                <th className="p-3.5">% of Total</th>
                <th className="p-3.5">Notes / Service Items</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {categoriesWithStats.map((cat, i) => {
                const isOver = cat.difference < 0;
                return (
                  <tr key={cat.category} className="hover:bg-[var(--surface-elevated)]/50 transition-colors">
                    <td className="p-3.5 font-bold text-[var(--text-primary)] flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: palette[i % palette.length] }}
                      />
                      <span>{cat.category}</span>
                    </td>

                    <td className="p-3.5 font-mono font-semibold text-[var(--text-primary)]">
                      {formatCurrency(cat.planned_amount, currency)}
                    </td>

                    <td className="p-3.5 font-mono font-semibold text-[var(--text-primary)]">
                      {formatCurrency(cat.actual_amount, currency)}
                    </td>

                    <td className="p-3.5 font-mono font-bold">
                      <span className={isOver ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}>
                        {cat.difference >= 0 ? '+' : ''}
                        {formatCurrency(cat.difference, currency)}
                      </span>
                    </td>

                    <td className="p-3.5 text-[var(--text-secondary)] font-medium">
                      {cat.percentage_of_total}%
                    </td>

                    <td className="p-3.5 text-[var(--text-secondary)] truncate max-w-xs">
                      {cat.notes}
                    </td>

                    <td className="p-3.5 text-right space-x-1">
                      <button
                        type="button"
                        onClick={() => handleOpenAddExpense(cat.category)}
                        title="Record expense for this category"
                        className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--primary)] hover:bg-[var(--surface-elevated)] cursor-pointer transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveCategory(cat.category)}
                        title="Remove category"
                        className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-rose-500 hover:bg-[var(--surface-elevated)] cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {/* Contingency Row */}
              <tr className="bg-[var(--surface-elevated)]/40 font-semibold border-t border-[var(--border)]">
                <td className="p-3.5 text-[var(--accent)] font-bold flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-[var(--accent)]" />
                  Contingency Reserve
                </td>
                <td className="p-3.5 font-mono text-[var(--accent)]">
                  {formatCurrency(contingencyReserve, currency)}
                </td>
                <td className="p-3.5 font-mono text-[var(--text-secondary)]">—</td>
                <td className="p-3.5 font-mono text-[var(--accent)]">+{formatCurrency(contingencyReserve, currency)}</td>
                <td className="p-3.5 text-[var(--text-secondary)]">
                  {totalPlannedBudget > 0 ? Math.round((contingencyReserve / totalPlannedBudget) * 100) : 0}%
                </td>
                <td className="p-3.5 text-[var(--text-secondary)] italic">
                  Protected safety buffer for unplanned occurrences
                </td>
                <td className="p-3.5 text-right text-[var(--text-secondary)]">—</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── Actual Expenses Ledger (Record, Edit, Delete, Filter) ────────── */}
      <Card variant="default" padding="none" className="overflow-hidden space-y-0">
        <div className="p-4 sm:p-5 border-b border-[var(--border)] flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[var(--surface)]">
          <div>
            <h3 className="font-display font-bold text-base text-[var(--text-primary)]">
              Recorded Expenses Ledger
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Logged invoices, vendor commitments and preliminary estimates
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Category Filter */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)]">
              <Filter className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
              <select
                value={ledgerCategoryFilter}
                onChange={(e) => setLedgerCategoryFilter(e.target.value)}
                className="bg-transparent text-xs font-semibold text-[var(--text-primary)] outline-none cursor-pointer"
              >
                <option value="all">All Categories</option>
                {categoriesWithStats.map((c) => (
                  <option key={c.category} value={c.category}>
                    {c.category}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Filter */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)]">
              <Calendar className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
              <input
                type="date"
                value={ledgerDateFilter}
                onChange={(e) => setLedgerDateFilter(e.target.value)}
                className="bg-transparent text-xs font-semibold text-[var(--text-primary)] outline-none cursor-pointer"
                title="Filter by date"
              />
              {ledgerDateFilter && (
                <button
                  type="button"
                  onClick={() => setLedgerDateFilter('')}
                  className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                >
                  ×
                </button>
              )}
            </div>

            {/* Search Input */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)]">
              <Search className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
              <input
                type="text"
                placeholder="Search expense..."
                value={ledgerSearch}
                onChange={(e) => setLedgerSearch(e.target.value)}
                className="bg-transparent text-xs font-semibold text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)]/50 w-28 sm:w-36"
              />
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={() => handleOpenAddExpense()}
              className="cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record Expense</span>
            </Button>
          </div>
        </div>

        {/* Financial Compliance Notice */}
        <div className="p-3 bg-amber-500/5 border-b border-[var(--border)] flex items-start gap-2 text-[11px] text-[var(--text-secondary)]">
          <Info className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <span>
            <strong>Payment Verification Policy:</strong> All recorded expenses in this studio are self-reported commitments or logged vendor bills. No payment transaction is claimed as finalized through a banking gateway unless confirmed by integrated payment services.
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[var(--surface-elevated)] border-b border-[var(--border)] text-[var(--text-secondary)] uppercase tracking-wider text-[10px] font-semibold">
              <tr>
                <th className="p-3.5">Expense Title</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Date</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Amount</th>
                <th className="p-3.5">Notes</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[var(--text-secondary)]">
                    No recorded expenses match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-[var(--surface-elevated)]/50 transition-colors">
                    <td className="p-3.5 font-bold text-[var(--text-primary)]">
                      {exp.title}
                    </td>

                    <td className="p-3.5 text-[var(--text-secondary)]">
                      <span className="px-2 py-0.5 rounded-lg bg-[var(--surface-elevated)] border border-[var(--border)] text-[11px] font-semibold">
                        {exp.category}
                      </span>
                    </td>

                    <td className="p-3.5 text-[var(--text-secondary)] font-mono">
                      {formatDate(exp.date)}
                    </td>

                    <td className="p-3.5">
                      {exp.status === 'logged_expense' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                          Logged Expense
                        </span>
                      ) : exp.status === 'vendor_commitment' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                          Vendor Commitment
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/20">
                          Preliminary Estimate
                        </span>
                      )}
                    </td>

                    <td className="p-3.5 font-mono font-bold text-[var(--text-primary)]">
                      {formatCurrency(exp.amount, currency)}
                    </td>

                    <td className="p-3.5 text-[var(--text-secondary)] truncate max-w-xs">
                      {exp.notes || '—'}
                    </td>

                    <td className="p-3.5 text-right space-x-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEditExpense(exp)}
                        title="Edit expense"
                        className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--primary)] hover:bg-[var(--surface-elevated)] cursor-pointer transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setExpenseToDelete(exp)}
                        title="Delete expense"
                        className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-rose-500 hover:bg-[var(--surface-elevated)] cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── Budget Rescue Modal ────────────────────────────────────────────── */}
      <BudgetRescueModal
        isOpen={isRescueOpen}
        onClose={() => setIsRescueOpen(false)}
        eventId={currentEvent?.id || ''}
        eventName={currentEvent?.event_name || 'Celebration'}
        currency={currency}
        rescueData={rescueData}
        isLoading={rescueLoading}
        onApplyRescue={handleApplyRescue}
        isApplying={isApplyingRescue}
      />

      {/* ── Record / Edit Expense Modal ────────────────────────────────────── */}
      {isExpenseModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
        >
          <div className="relative w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-3xl shadow-modal p-6 space-y-5 text-[var(--text-primary)]">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h3 className="font-display font-bold text-lg text-[var(--text-primary)]">
                {editingExpense ? 'Edit Expense Record' : 'Record Actual Expense'}
              </h3>
              <button
                type="button"
                onClick={() => setIsExpenseModalOpen(false)}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-[var(--text-secondary)] uppercase tracking-wider block mb-1">
                  Expense Description *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Venue Advance Deposit"
                  value={expenseTitle}
                  onChange={(e) => setExpenseTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--text-primary)] outline-none focus:border-[var(--primary)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[var(--text-secondary)] uppercase tracking-wider block mb-1">
                    Category *
                  </label>
                  <select
                    value={expenseCategory}
                    onChange={(e) => setExpenseCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--text-primary)] outline-none focus:border-[var(--primary)] cursor-pointer"
                  >
                    {categoriesWithStats.map((c) => (
                      <option key={c.category} value={c.category}>
                        {c.category}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[var(--text-secondary)] uppercase tracking-wider block mb-1">
                    Amount ({currency}) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--text-primary)] outline-none focus:border-[var(--primary)] font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[var(--text-secondary)] uppercase tracking-wider block mb-1">
                    Status Classification *
                  </label>
                  <select
                    value={expenseStatus}
                    onChange={(e) => setExpenseStatus(e.target.value as ExpenseStatus)}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--text-primary)] outline-none focus:border-[var(--primary)] cursor-pointer"
                  >
                    <option value="logged_expense">Logged Expense (Self-Reported)</option>
                    <option value="vendor_commitment">Vendor Commitment / Contract</option>
                    <option value="estimate">Preliminary Estimate</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[var(--text-secondary)] uppercase tracking-wider block mb-1">
                    Date Recorded *
                  </label>
                  <input
                    type="date"
                    required
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--text-primary)] outline-none focus:border-[var(--primary)]"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-[var(--text-secondary)] uppercase tracking-wider block mb-1">
                  Notes &amp; Inclusions (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Receipt #1042 or vendor contract note"
                  value={expenseNotes}
                  onChange={(e) => setExpenseNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--text-primary)] outline-none focus:border-[var(--primary)] resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={expenseSaving}
                  className="cursor-pointer"
                >
                  {editingExpense ? 'Save Changes' : 'Record Expense'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Expense Confirmation Dialog ─────────────────────────────── */}
      {expenseToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
        >
          <div className="relative w-full max-w-sm bg-[var(--surface)] border border-[var(--border)] rounded-3xl shadow-modal p-6 space-y-4 text-[var(--text-primary)]">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-display font-bold text-base text-[var(--text-primary)]">
                Delete Recorded Expense?
              </h4>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Are you sure you want to remove &quot;{expenseToDelete.title}&quot; ({formatCurrency(expenseToDelete.amount, currency)})? This will recalculate the category actual spending.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setExpenseToDelete(null)}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleConfirmDeleteExpense}
                isLoading={expenseDeleting}
                className="cursor-pointer"
              >
                Delete Expense
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Category Modal ────────────────────────────────────────────── */}
      {isCategoryModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
        >
          <div className="relative w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-3xl shadow-modal p-6 space-y-5 text-[var(--text-primary)]">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h3 className="font-display font-bold text-lg text-[var(--text-primary)]">
                Add New Budget Category
              </h3>
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-[var(--text-secondary)] uppercase tracking-wider block mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Videography & Drone"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--text-primary)] outline-none focus:border-[var(--primary)]"
                />
              </div>

              <div>
                <label className="font-bold text-[var(--text-secondary)] uppercase tracking-wider block mb-1">
                  Planned Allocation ({currency}) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  placeholder="50000"
                  value={categoryPlanned}
                  onChange={(e) => setCategoryPlanned(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--text-primary)] outline-none focus:border-[var(--primary)] font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-[var(--text-secondary)] uppercase tracking-wider block mb-1">
                  Key Inclusions / Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. 4K highlights reel, drone coverage, raw footages"
                  value={categoryNotes}
                  onChange={(e) => setCategoryNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--text-primary)] outline-none focus:border-[var(--primary)] resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={categorySaving}
                  className="cursor-pointer"
                >
                  Create Category
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
