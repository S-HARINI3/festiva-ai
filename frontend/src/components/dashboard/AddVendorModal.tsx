import { useState } from 'react';
import { Store, DollarSign } from 'lucide-react';
import type { SavedEvent } from '../../types/events';
import { Dialog, Button, Input } from '../ui';

interface AddVendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: SavedEvent[];
  onAddVendor: (vendor: {
    eventId: string;
    category: string;
    vendorName: string;
    estimatedCost: number;
    status: 'pending' | 'contacted' | 'booked' | 'confirmed';
    notes?: string;
  }) => void;
}

const CATEGORIES = [
  'Venue & Space Rental',
  'Catering & Food Service',
  'Decorations & Florals',
  'Photography & Cinema',
  'Entertainment & Music',
  'Invitations & Printing',
  'Guest Transport & Logistics',
  'Guest Accommodation',
  'Hair, Makeup & Styling',
  'Audio, Video & Lighting',
  'Other Services',
];

export default function AddVendorModal({
  isOpen,
  onClose,
  events,
  onAddVendor,
}: AddVendorModalProps) {
  const [eventId, setEventId] = useState(events[0]?.id || '');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [vendorName, setVendorName] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [status, setStatus] = useState<'pending' | 'contacted' | 'booked' | 'confirmed'>('pending');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorName.trim()) {
      setError('Please provide a vendor or company name.');
      return;
    }
    const cost = Number(estimatedCost) || 0;
    if (cost < 0) {
      setError('Estimated cost cannot be negative.');
      return;
    }

    onAddVendor({
      eventId: eventId || events[0]?.id,
      category,
      vendorName: vendorName.trim(),
      estimatedCost: cost,
      status,
      notes: notes.trim() || undefined,
    });

    // Reset and close
    setVendorName('');
    setEstimatedCost('');
    setNotes('');
    setError('');
    onClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Add Vendor to Celebration Checklist"
      description="Track vendor quotes, booking stages, and contracts for your celebration."
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

        {/* Category & Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="label-text block mb-1.5 font-medium text-xs text-[var(--text-primary)]">
              Service Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] text-xs text-[var(--text-primary)] outline-none cursor-pointer"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label-text block mb-1.5 font-medium text-xs text-[var(--text-primary)]">
              Booking Status *
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] text-xs text-[var(--text-primary)] outline-none cursor-pointer"
            >
              <option value="pending">Pending Quote / Evaluation</option>
              <option value="contacted">Contacted &amp; In Discussion</option>
              <option value="booked">Advance Paid / Booked</option>
              <option value="confirmed">Contract Confirmed</option>
            </select>
          </div>
        </div>

        {/* Vendor Name & Cost */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Vendor / Studio Name *"
            placeholder="e.g. Royal Rajputana Caterers or DJ Shadow"
            value={vendorName}
            onChange={(e) => setVendorName(e.target.value)}
          />

          <Input
            label="Estimated or Quoted Cost"
            type="number"
            placeholder="e.g. 75000"
            leftIcon={<DollarSign className="w-4 h-4" />}
            value={estimatedCost}
            onChange={(e) => setEstimatedCost(e.target.value)}
          />
        </div>

        {/* Notes */}
        <div>
          <label className="label-text block mb-1.5 font-medium text-xs text-[var(--text-primary)]">
            Vendor Brief &amp; Deliverables (Optional)
          </label>
          <textarea
            rows={2}
            placeholder="e.g. Inclusions: 4 live cooking counters, tableware and waitstaff included."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] text-xs text-[var(--text-primary)] outline-none"
          />
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--border)]">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" leftIcon={<Store className="w-3.5 h-3.5" />}>
            Add Vendor
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
