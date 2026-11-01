import { useState } from 'react';
import { CheckSquare, Calendar } from 'lucide-react';
import type { SavedEvent } from '../../types/events';
import { Dialog, Button, Input } from '../ui';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: SavedEvent[];
  onAddTask: (task: {
    eventId: string;
    title: string;
    dueDate: string;
    priority: 'high' | 'medium' | 'low';
    category?: string;
  }) => void;
}

export default function CreateTaskModal({
  isOpen,
  onClose,
  events,
  onAddTask,
}: CreateTaskModalProps) {
  const [eventId, setEventId] = useState(events[0]?.id || '');
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('high');
  const [category, setCategory] = useState('Planning & Venue');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a milestone title.');
      return;
    }

    onAddTask({
      eventId: eventId || events[0]?.id,
      title: title.trim(),
      dueDate,
      priority,
      category,
    });

    setTitle('');
    setError('');
    onClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Create Celebration Task"
      description="Add an actionable deadline or milestone for your planning checklist."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 mt-4">
        {error && (
          <div className="p-2.5 rounded-xl bg-[var(--danger-light)] text-[var(--danger)] text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Event Selector */}
        <div>
          <label className="label-text block mb-1.5 font-medium text-xs text-[var(--text-primary)]">
            Select Celebration *
          </label>
          <select
            value={eventId || events[0]?.id}
            onChange={(e) => setEventId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] text-xs text-[var(--text-primary)] outline-none cursor-pointer"
          >
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.event_name}
              </option>
            ))}
          </select>
        </div>

        {/* Title */}
        <Input
          label="Milestone / Task Title *"
          placeholder="e.g. Schedule floral centerpiece walkthrough at venue"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        {/* Due Date & Priority */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Target Due Date *"
            type="date"
            leftIcon={<Calendar className="w-4 h-4" />}
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />

          <div>
            <label className="label-text block mb-1.5 font-medium text-xs text-[var(--text-primary)]">
              Priority Level *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'high', label: 'High', color: 'border-[var(--danger)] text-[var(--danger)]' },
                { id: 'medium', label: 'Medium', color: 'border-[var(--warning)] text-[var(--warning)]' },
                { id: 'low', label: 'Low', color: 'border-[var(--border)] text-[var(--text-secondary)]' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPriority(p.id as any)}
                  className={`py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer text-center ${
                    priority === p.id
                      ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-xs'
                      : 'bg-[var(--surface-elevated)] hover:bg-[var(--surface)]'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="label-text block mb-1.5 font-medium text-xs text-[var(--text-primary)]">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] text-xs text-[var(--text-primary)] outline-none cursor-pointer"
          >
            <option value="Planning & Venue">Planning &amp; Venue</option>
            <option value="Catering & Bar">Catering &amp; Bar</option>
            <option value="Decor & Florals">Decor &amp; Florals</option>
            <option value="Music & Entertainment">Music &amp; Entertainment</option>
            <option value="Photography & Cinema">Photography &amp; Cinema</option>
            <option value="Invitations & RSVPs">Invitations &amp; RSVPs</option>
            <option value="Guest Logistics">Guest Logistics</option>
          </select>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--border)]">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" leftIcon={<CheckSquare className="w-3.5 h-3.5" />}>
            Create Milestone
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
