import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Users, Edit2 } from 'lucide-react';
import type { SavedEvent } from '../../types/events';
import { Dialog, Button, Input } from '../ui';

interface EditEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: SavedEvent | null;
  onSave: (updated: {
    eventId: string;
    eventName: string;
    eventDate: string;
    location: string;
    guestCount: number;
  }) => Promise<void>;
}

export default function EditEventModal({
  isOpen,
  onClose,
  event,
  onSave,
}: EditEventModalProps) {
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [location, setLocation] = useState('');
  const [guestCount, setGuestCount] = useState('100');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (event) {
      setEventName(event.event_name || '');
      setEventDate(event.event_date || '');
      setLocation(event.plan_data?.location || '');
      setGuestCount(String(event.plan_data?.guest_count || 100));
      setError('');
    }
  }, [event]);

  if (!event) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventName.trim()) {
      setError('Event name is required.');
      return;
    }

    setLoading(true);
    try {
      await onSave({
        eventId: event.id,
        eventName: eventName.trim(),
        eventDate,
        location: location.trim(),
        guestCount: Number(guestCount) || 100,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update event.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Celebration Details"
      description="Update basic event parameters. Changes will sync across your blueprint."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 mt-4">
        {error && (
          <div className="p-2.5 rounded-xl bg-[var(--danger-light)] text-[var(--danger)] text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Event Name */}
        <Input
          label="Event Name *"
          value={eventName}
          onChange={(e) => setEventName(e.target.value)}
        />

        {/* Date and Location */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Event Date *"
            type="date"
            leftIcon={<Calendar className="w-4 h-4" />}
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
          />

          <Input
            label="Location / Venue *"
            leftIcon={<MapPin className="w-4 h-4" />}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>

        {/* Guest Count */}
        <Input
          label="Total Expected Guests"
          type="number"
          min={1}
          leftIcon={<Users className="w-4 h-4" />}
          value={guestCount}
          onChange={(e) => setGuestCount(e.target.value)}
        />

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--border)]">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={loading}
            leftIcon={<Edit2 className="w-3.5 h-3.5" />}
          >
            Save Changes
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
