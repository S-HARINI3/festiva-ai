import { useState, useEffect, useRef } from 'react';
import {
  Bot, Sparkles, Send, CheckCircle2, XCircle, AlertTriangle,
  Calendar, Users, DollarSign, ShieldCheck
} from 'lucide-react';
import type { SavedEvent, CopilotMessage, CopilotProposedAction } from '../../types/events';
import { sendCopilotMessage, executeCopilotAction } from '../../services/api';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';

interface AICopilotViewProps {
  events: SavedEvent[];
  userId?: string;
  onRefreshEvents?: () => void;
  selectedEventId?: string;
}

const QUICK_PROMPTS = [
  'Reduce my budget by ₹30,000 without changing the venue.',
  'What tasks should I finish this week?',
  'Compare my two catering quotations.',
  'What are the biggest risks in my current plan?',
  'Create a rainy-weather backup plan.',
  'Explain existing budget calculations.',
  'Summarize event readiness.',
  'Suggest a low-cost celebration theme.',
];

export default function AICopilotView({
  events,
  userId = 'demo-user-001',
  onRefreshEvents,
  selectedEventId,
}: AICopilotViewProps) {
  const { isDemoMode } = useAuth();
  const [selectedId, setSelectedId] = useState<string>(selectedEventId || events[0]?.id || '');
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [actionErrorMsg, setActionErrorMsg] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Active selected celebration
  const currentEvent = events.find((e) => e.id === selectedId) || events[0];
  const planData = currentEvent?.plan_data || {};

  // Financial statistics
  const currency = planData.currency || 'INR';
  const totalBudget = Number((planData as any).total_budget || planData.total_estimated_budget || 1500000);
  const expenses = planData.expenses || [];
  const totalSpent = expenses.reduce((acc: number, e: any) => {
    return ['logged_expense', 'paid', 'confirmed'].includes(e.status) ? acc + Number(e.amount || 0) : acc;
  }, 0);
  const remainingBudget = Math.max(0, totalBudget - totalSpent);

  // Timeline statistics
  const tasks = planData.tasks || [];
  const completedTasks = tasks.filter((t: any) => t.status === 'completed');
  const todayStr = new Date().toISOString().split('T')[0];
  const overdueTasks = tasks.filter((t: any) => t.due_date && t.due_date < todayStr && t.status !== 'completed');

  // Guest statistics
  const guests = planData.guests || [];
  const confirmedGuests = guests.filter((g: any) => g.rsvp_status === 'attending' || g.rsvp_status === 'confirmed');
  const confirmedHeads = confirmedGuests.reduce((sum: number, g: any) => sum + Number(g.party_size || 1), 0);

  // Dialogue history
  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      role: 'assistant',
      content: `Namaste! I am your Festiva AI Event Copilot for **${currentEvent?.event_name || 'your celebration'}**.\n\nI have loaded your live budget, tasks, vendor quotes, and guest RSVPs. Ask me to reallocate budget margins, prioritize milestones, compare vendors, or audit planning risks.`,
      timestamp: new Date().toISOString(),
    },
  ]);

  // Sync when event selection changes
  useEffect(() => {
    if (currentEvent) {
      setMessages([
        {
          role: 'assistant',
          content: `Switching focus to **${currentEvent.event_name}** (${currentEvent.event_date}).\n\n• **Budget:** ${currency} ${remainingBudget.toLocaleString()} remaining of ${currency} ${totalBudget.toLocaleString()}\n• **Tasks:** ${completedTasks.length}/${tasks.length} completed (${overdueTasks.length} overdue)\n• **Guests:** ${confirmedHeads} confirmed attendees\n\nHow can I optimize your celebration blueprint today?`,
          timestamp: new Date().toISOString(),
        },
      ]);
    }
  }, [selectedId]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isTyping || !currentEvent) return;

    const userMsg: CopilotMessage = {
      role: 'user',
      content: query,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    setActionSuccessMsg(null);
    setActionErrorMsg(null);

    try {
      const response = await sendCopilotMessage(currentEvent.id, query, messages, userId);
      const assistantMsg: CopilotMessage = {
        role: 'assistant',
        content: response.reply,
        proposed_action: response.proposed_action,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ Could not reach the celebration intelligence engine: ${err.message || 'Unknown network error'}. Please retry in a moment.`,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleConfirmAction = async (msgIndex: number, action: CopilotProposedAction) => {
    if (!currentEvent) return;
    setActionLoadingId(action.id);
    setActionSuccessMsg(null);
    setActionErrorMsg(null);

    try {
      const res = await executeCopilotAction(
        currentEvent.id,
        action.id,
        action.action_type,
        action.parameters,
        true, // Explicit user confirmation
        userId
      );

      // Update message state
      setMessages((prev) => {
        const next = [...prev];
        const target = next[msgIndex];
        if (target && target.proposed_action) {
          target.proposed_action = {
            ...target.proposed_action,
            status: 'applied',
          };
        }
        return next;
      });

      setActionSuccessMsg(res.message || 'Modification applied successfully!');
      if (onRefreshEvents) {
        onRefreshEvents();
      }
    } catch (err: any) {
      setActionErrorMsg(err.message || 'Failed to apply proposed action.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDismissAction = (msgIndex: number) => {
    setMessages((prev) => {
      const next = [...prev];
      const target = next[msgIndex];
      if (target && target.proposed_action) {
        target.proposed_action = {
          ...target.proposed_action,
          status: 'declined',
        };
      }
      return next;
    });
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Header & Celebration Switcher */}
      <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[var(--primary)] text-white flex items-center justify-center shadow-xs flex-shrink-0">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display font-bold text-lg text-[var(--text-primary)]">
                AI Event Copilot
              </h2>
              {isDemoMode ? (
                <span className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-[10px] font-semibold text-amber-700 dark:text-amber-400">
                  Demo Studio
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Event Connected
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              Event-aware conversational planner with safe, allowlisted blueprint actions
            </p>
          </div>
        </div>

        {/* Celebration Selector */}
        {events.length > 0 && (
          <div className="flex items-center gap-2 w-full md:w-auto">
            <label className="text-xs text-[var(--text-secondary)] font-medium whitespace-nowrap">
              Active Event:
            </label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] text-xs text-[var(--text-primary)] font-medium focus:border-[var(--primary)] outline-none cursor-pointer flex-1 md:flex-initial"
            >
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.event_name} ({ev.event_type})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Live Celebration Intelligence Metrics Bar */}
      {currentEvent && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center flex-shrink-0">
              <DollarSign className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider font-semibold">Remaining</p>
              <p className="text-xs font-bold text-[var(--text-primary)] truncate">
                {currency} {remainingBudget.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider font-semibold">Tasks Completed</p>
              <p className="text-xs font-bold text-[var(--text-primary)] truncate">
                {completedTasks.length} / {tasks.length}
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center flex-shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider font-semibold">Confirmed RSVPs</p>
              <p className="text-xs font-bold text-[var(--text-primary)] truncate">
                {confirmedHeads} guests
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider font-semibold">Overdue Tasks</p>
              <p className="text-xs font-bold text-[var(--text-primary)] truncate">
                {overdueTasks.length} pending
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Suggested Quick Prompt Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {QUICK_PROMPTS.map((prompt, i) => (
          <button
            key={i}
            type="button"
            onClick={() => handleSend(prompt)}
            disabled={isTyping}
            className="flex-shrink-0 px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-elevated)] hover:border-[var(--primary)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer whitespace-nowrap shadow-xs disabled:opacity-50"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Feedback Alerts */}
      {actionSuccessMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}
      {actionErrorMsg && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-400 text-xs flex items-center gap-2">
          <XCircle className="w-4 h-4 flex-shrink-0" />
          <span>{actionErrorMsg}</span>
        </div>
      )}

      {/* Chat Thread */}
      <Card variant="default" padding="md" className="min-h-[420px] max-h-[580px] overflow-y-auto space-y-4">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {m.role === 'assistant' && (
              <div className="w-7 h-7 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
            )}

            <div
              className={`p-4 rounded-2xl text-xs max-w-[88%] leading-relaxed space-y-3 ${
                m.role === 'user'
                  ? 'bg-[var(--primary)] text-white rounded-tr-xs'
                  : 'bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--text-primary)] rounded-tl-xs shadow-xs'
              }`}
            >
              <div className="whitespace-pre-line leading-relaxed">
                {m.content}
              </div>

              {/* Interactive Action Preview Card */}
              {m.proposed_action && (
                <div className="mt-3 p-3.5 rounded-xl border border-[var(--primary)]/30 bg-[var(--surface)] text-[var(--text-primary)] space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-[var(--primary)]/10 text-[var(--primary)] text-[10px] font-bold uppercase tracking-wider">
                      Proposed Blueprint Action
                    </span>
                    <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${
                      m.proposed_action.status === 'applied'
                        ? 'bg-emerald-500/15 text-emerald-600'
                        : m.proposed_action.status === 'declined'
                        ? 'bg-zinc-500/15 text-zinc-500'
                        : 'bg-amber-500/15 text-amber-600'
                    }`}>
                      {m.proposed_action.status === 'applied'
                        ? '✓ Confirmed & Applied'
                        : m.proposed_action.status === 'declined'
                        ? 'Dismissed'
                        : 'Requires Confirmation'}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-semibold text-xs text-[var(--text-primary)]">
                      {m.proposed_action.title}
                    </h4>
                    <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                      {m.proposed_action.description}
                    </p>
                  </div>

                  <div className="p-2 rounded-lg bg-[var(--surface-elevated)] border border-[var(--border)] space-y-1 text-[11px]">
                    <p>
                      <strong className="text-[var(--text-primary)]">Affected Records:</strong>{' '}
                      <span className="text-[var(--text-secondary)]">
                        {m.proposed_action.affected_records.join(', ')}
                      </span>
                    </p>
                    <p>
                      <strong className="text-[var(--text-primary)]">Expected Impact:</strong>{' '}
                      <span className="text-[var(--text-secondary)]">
                        {m.proposed_action.expected_impact}
                      </span>
                    </p>
                  </div>

                  {/* Confirmation Buttons */}
                  {m.proposed_action.status === 'pending' && (
                    <div className="pt-1 flex items-center gap-2">
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={() => handleConfirmAction(idx, m.proposed_action!)}
                        isLoading={actionLoadingId === m.proposed_action.id}
                        leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                        className="text-xs"
                      >
                        Confirm &amp; Apply
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleDismissAction(idx)}
                        disabled={actionLoadingId === m.proposed_action.id}
                        leftIcon={<XCircle className="w-3.5 h-3.5" />}
                        className="text-xs text-[var(--text-secondary)]"
                      >
                        Dismiss
                      </Button>
                      <div className="ml-auto text-[10px] text-[var(--text-muted)] flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-[var(--primary)]" />
                        Safe confirmation guard
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] p-2">
            <Sparkles className="w-3.5 h-3.5 text-[var(--primary)] animate-spin" />
            <span>Festiva AI is synthesizing live celebration data...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </Card>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex items-center gap-2"
      >
        <input
          type="text"
          placeholder="Ask Copilot: 'Reduce my budget by ₹30k', 'Compare catering quotes', 'Tasks this week'..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isTyping}
          className="flex-1 px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-xs text-[var(--text-primary)] outline-none focus:border-[var(--primary)] transition-all shadow-xs"
        />
        <Button
          type="submit"
          variant="primary"
          size="md"
          isLoading={isTyping}
          leftIcon={<Send className="w-4 h-4" />}
          disabled={!input.trim() || isTyping}
        >
          Send
        </Button>
      </form>
    </div>
  );
}
