import { useState } from 'react';
import { Users } from 'lucide-react';
import type { SavedEvent } from '../../types/events';
import { Dialog, Button, Input } from '../ui';

interface AddGuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: SavedEvent[];
  onAddGuest: (guest: {
    eventId: string;
    name: string;
    adults: number;
    children: number;
    dietary: string[];
    accessibility: string[];
    isVip: boolean;
    rsvpStatus: 'confirmed' | 'tentative' | 'declined';
  }) => void;
}

const DIETARY_OPTIONS = [
  'Pure Vegetarian',
  'Jain Friendly',
  'Vegan',
  'Halal',
  'Gluten-Free',
  'Nut Allergy',
];

const ACCESSIBILITY_OPTIONS = [
  'Wheelchair Ramp Access',
  'Ground Floor Seating',
  'Senior Assistance',
];

export default function AddGuestModal({
  isOpen,
  onClose,
  events,
  onAddGuest,
}: AddGuestModalProps) {
  const [eventId, setEventId] = useState(events[0]?.id || '');
  const [name, setName] = useState('');
  const [adults, setAdults] = useState('2');
  const [children, setChildren] = useState('0');
  const [isVip, setIsVip] = useState(false);
  const [rsvpStatus, setRsvpStatus] = useState<'confirmed' | 'tentative' | 'declined'>('confirmed');
  const [dietary, setDietary] = useState<string[]>(['Pure Vegetarian']);
  const [accessibility, setAccessibility] = useState<string[]>([]);
  const [error, setError] = useState('');

  const toggleDietary = (item: string) => {
    setDietary((prev) => (prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]));
  };

  const toggleAccess = (item: string) => {
    setAccessibility((prev) => (prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a guest or party name.');
      return;
    }

    onAddGuest({
      eventId: eventId || events[0]?.id,
      name: name.trim(),
      adults: Number(adults) || 1,
      children: Number(children) || 0,
      dietary,
      accessibility,
      isVip,
      rsvpStatus,
    });

    setName('');
    setError('');
    onClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Add Guest / Party to RSVP Matrix"
      description="Record headcounts, dietary matrices, and VIP seating protocols."
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

        {/* Guest Name & RSVP Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Guest / Family Name *"
            placeholder="e.g. Mr. &amp; Mrs. Sharma"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <div>
            <label className="label-text block mb-1.5 font-medium text-xs text-[var(--text-primary)]">
              RSVP Status *
            </label>
            <select
              value={rsvpStatus}
              onChange={(e) => setRsvpStatus(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] text-xs text-[var(--text-primary)] outline-none cursor-pointer"
            >
              <option value="confirmed">Confirmed Attending</option>
              <option value="tentative">Tentative / Pending</option>
              <option value="declined">Regretfully Declined</option>
            </select>
          </div>
        </div>

        {/* Headcounts & VIP */}
        <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] items-center">
          <Input
            label="Adults"
            type="number"
            min={1}
            value={adults}
            onChange={(e) => setAdults(e.target.value)}
          />

          <Input
            label="Children"
            type="number"
            min={0}
            value={children}
            onChange={(e) => setChildren(e.target.value)}
          />

          <div className="flex flex-col items-center justify-center pt-3">
            <label className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isVip}
                onChange={(e) => setIsVip(e.target.checked)}
                className="rounded accent-[var(--primary)] w-4 h-4"
              />
              <span>VIP Protocol</span>
            </label>
            <span className="text-[10px] text-[var(--text-muted)] mt-0.5">Priority Seating</span>
          </div>
        </div>

        {/* Dietary preferences */}
        <div>
          <label className="label-text block mb-1.5 font-medium text-xs text-[var(--text-primary)]">
            Dietary Preferences
          </label>
          <div className="flex flex-wrap gap-1.5">
            {DIETARY_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => toggleDietary(opt)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                  dietary.includes(opt)
                    ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                    : 'bg-[var(--surface-elevated)] text-[var(--text-secondary)] border-[var(--border)]'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* Accessibility preferences */}
        <div>
          <label className="label-text block mb-1.5 font-medium text-xs text-[var(--text-primary)]">
            Accessibility Provisions
          </label>
          <div className="flex flex-wrap gap-1.5">
            {ACCESSIBILITY_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => toggleAccess(opt)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                  accessibility.includes(opt)
                    ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                    : 'bg-[var(--surface-elevated)] text-[var(--text-secondary)] border-[var(--border)]'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--border)]">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" leftIcon={<Users className="w-3.5 h-3.5" />}>
            Save Guest
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
