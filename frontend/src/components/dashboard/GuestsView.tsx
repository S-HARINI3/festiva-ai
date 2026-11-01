import { useState, useMemo, useEffect, useRef } from 'react';
import {
  Users,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  HelpCircle,
  Upload,
  Download,
  Utensils,
  Accessibility,
  AlertTriangle,
  Trash2,
  Edit3,
  X,
  FileSpreadsheet,
  Info,
  Layers,
  Eye,
} from 'lucide-react';
import type {
  SavedEvent,
  GuestRecord,
  GuestRsvpStatus,
  GuestInvitationStatus,
  BulkGuestImportRow,
  CateringEstimateResponse,
} from '../../types/events';
import { RSVP_STATUS_LABELS } from '../../types/events';
import { Card, Button, useToast } from '../ui';
import {
  getEventGuests,
  addGuest,
  updateGuest,
  deleteGuest,
  bulkImportGuests,
  getCateringEstimate,
} from '../../services/api';

interface GuestsViewProps {
  events: SavedEvent[];
  userId?: string;
  onRefreshEvents?: () => void;
  // Backward compatibility
  guests?: any[];
  onOpenAddGuest?: () => void;
}

const COMMON_DIETARY_OPTIONS = [
  'Standard',
  'Vegetarian',
  'Pure Vegetarian',
  'Vegan',
  'Jain',
  'Halal',
  'Kosher',
  'Gluten-Free',
  'Nut Allergy',
  'Lactose Intolerant',
  'Custom / Other',
];

const COMMON_ACCESSIBILITY_OPTIONS = [
  'None Required',
  'Step-Free Access / Ramp',
  'Wheelchair Accommodation',
  'Priority Ground Seating',
  'Senior Assistance',
  'Sign Language / ASL Interpreter',
  'Low Sensory / Quiet Seating',
];

export default function GuestsView({
  events,
  userId = 'demo-user-001',
  onRefreshEvents,
}: GuestsViewProps) {
  const { success: toastSuccess, error: toastError } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Active event selection
  const [selectedEventId, setSelectedEventId] = useState<string>(() => {
    return events.length > 0 ? events[0].id : '';
  });

  useEffect(() => {
    if (events.length > 0 && (!selectedEventId || !events.some((e) => e.id === selectedEventId))) {
      setSelectedEventId(events[0].id);
    }
  }, [events, selectedEventId]);

  const activeEvent = useMemo(() => {
    return events.find((e) => e.id === selectedEventId) || events[0] || null;
  }, [events, selectedEventId]);

  // Guest list state
  const [guests, setGuests] = useState<GuestRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [cateringEstimate, setCateringEstimate] = useState<CateringEstimateResponse | null>(null);

  // Filters & Search
  const [selectedRsvp, setSelectedRsvp] = useState<string>('all');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [selectedDietary, setSelectedDietary] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<GuestRecord | null>(null);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [isCateringDetailsOpen, setIsCateringDetailsOpen] = useState(false);
  const [guestToDelete, setGuestToDelete] = useState<GuestRecord | null>(null);

  // Bulk Import state
  const [csvText, setCsvText] = useState('');
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importDuplicates, setImportDuplicates] = useState<string[]>([]);

  // Add/Edit Form State
  const [formData, setFormData] = useState({
    name: '',
    group_household: 'General',
    invitation_status: 'sent_manual' as GuestInvitationStatus,
    rsvp_status: 'not_invited' as GuestRsvpStatus,
    party_size: 1,
    adults_count: 1,
    children_count: 0,
    dietary_preference: 'Standard',
    accessibility_requests: '',
    table_assignment: 'Unassigned',
    notes: '',
  });

  // Duplicate warning candidate on live typing
  const duplicateWarning = useMemo(() => {
    if (!formData.name.trim() || editingGuest) return null;
    const cleanNew = formData.name.toLowerCase().trim();
    const match = guests.find(
      (g) => g.name.toLowerCase().trim() === cleanNew || cleanNew.includes(g.name.toLowerCase().trim())
    );
    return match ? match.name : null;
  }, [formData.name, guests, editingGuest]);

  // Load guests & catering estimate
  const loadGuestsAndEstimate = async () => {
    if (!selectedEventId) return;
    setLoading(true);
    try {
      const [guestsRes, estimateRes] = await Promise.allSettled([
        getEventGuests(selectedEventId, undefined, userId),
        getCateringEstimate(selectedEventId, userId),
      ]);

      if (guestsRes.status === 'fulfilled') {
        setGuests(guestsRes.value.guests || []);
      } else {
        // Fallback to local plan_data
        setGuests(activeEvent?.plan_data?.guests || []);
      }

      if (estimateRes.status === 'fulfilled') {
        setCateringEstimate(estimateRes.value);
      }
    } catch {
      setGuests(activeEvent?.plan_data?.guests || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedEventId) {
      loadGuestsAndEstimate();
    }
  }, [selectedEventId]);

  // Available groups
  const availableGroups = useMemo(() => {
    return Array.from(new Set(guests.map((g) => g.group_household).filter(Boolean)));
  }, [guests]);

  // Filtered guest list
  const filteredGuests = useMemo(() => {
    return guests.filter((g) => {
      const matchesRsvp = selectedRsvp === 'all' || g.rsvp_status === selectedRsvp;
      const matchesGroup = selectedGroup === 'all' || g.group_household === selectedGroup;
      const matchesDietary =
        selectedDietary === 'all' || (g.dietary_preference || '').toLowerCase().includes(selectedDietary.toLowerCase());
      const matchesSearch =
        !searchQuery ||
        `${g.name} ${g.group_household} ${g.table_assignment || ''} ${g.notes || ''} ${g.dietary_preference || ''}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase().trim());

      return matchesRsvp && matchesGroup && matchesDietary && matchesSearch;
    });
  }, [guests, selectedRsvp, selectedGroup, selectedDietary, searchQuery]);

  // Summary Metrics
  const totalHeadcount = useMemo(() => {
    return guests.reduce((sum, g) => sum + (g.party_size || 1), 0);
  }, [guests]);

  const confirmedCount = useMemo(() => {
    return guests
      .filter((g) => g.rsvp_status === 'confirmed')
      .reduce((sum, g) => sum + (g.party_size || 1), 0);
  }, [guests]);

  const maybeCount = useMemo(() => {
    return guests
      .filter((g) => g.rsvp_status === 'maybe')
      .reduce((sum, g) => sum + (g.party_size || 1), 0);
  }, [guests]);

  const declinedCount = useMemo(() => {
    return guests
      .filter((g) => g.rsvp_status === 'declined')
      .reduce((sum, g) => sum + (g.party_size || 1), 0);
  }, [guests]);

  const awaitingCount = useMemo(() => {
    return guests
      .filter((g) => g.rsvp_status === 'invited')
      .reduce((sum, g) => sum + (g.party_size || 1), 0);
  }, [guests]);

  const expectedAttendance = useMemo(() => {
    return confirmedCount + Math.round(maybeCount * 0.5);
  }, [confirmedCount, maybeCount]);

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingGuest(null);
    setFormData({
      name: '',
      group_household: availableGroups[0] || 'General',
      invitation_status: 'sent_manual',
      rsvp_status: 'not_invited',
      party_size: 1,
      adults_count: 1,
      children_count: 0,
      dietary_preference: 'Standard',
      accessibility_requests: '',
      table_assignment: 'Unassigned',
      notes: '',
    });
    setIsAddEditOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (guest: GuestRecord) => {
    setEditingGuest(guest);
    setFormData({
      name: guest.name,
      group_household: guest.group_household,
      invitation_status: guest.invitation_status,
      rsvp_status: guest.rsvp_status,
      party_size: guest.party_size || 1,
      adults_count: guest.adults_count !== undefined ? guest.adults_count : guest.party_size || 1,
      children_count: guest.children_count || 0,
      dietary_preference: guest.dietary_preference || 'Standard',
      accessibility_requests: guest.accessibility_requests || '',
      table_assignment: guest.table_assignment || 'Unassigned',
      notes: guest.notes || '',
    });
    setIsAddEditOpen(true);
  };

  // Save Guest Add/Edit
  const handleSaveGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toastError('Guest name is required.');
      return;
    }
    const computedPartySize = Math.max(1, (formData.adults_count || 0) + (formData.children_count || 0));

    try {
      if (editingGuest) {
        const res = await updateGuest(
          selectedEventId,
          editingGuest.id,
          { ...formData, party_size: computedPartySize },
          userId
        );
        setGuests((prev) => prev.map((g) => (g.id === editingGuest.id ? res.guest : g)));
        toastSuccess(`Updated ${formData.name}`);
      } else {
        const res = await addGuest(
          selectedEventId,
          { ...formData, party_size: computedPartySize },
          userId
        );
        setGuests((prev) => [...prev, res.guest]);
        if (res.duplicate_warning) {
          toastSuccess(`Added ${formData.name} (Note: ${res.duplicate_warning})`);
        } else {
          toastSuccess(`Added ${formData.name} to Guest List`);
        }
      }
      setIsAddEditOpen(false);
      loadGuestsAndEstimate();
      onRefreshEvents?.();
    } catch (err: any) {
      toastError(err.message || 'Failed to save guest record.');
    }
  };

  // Quick RSVP change
  const handleQuickRsvpChange = async (guest: GuestRecord, newRsvp: GuestRsvpStatus) => {
    try {
      const res = await updateGuest(selectedEventId, guest.id, { rsvp_status: newRsvp }, userId);
      setGuests((prev) => prev.map((g) => (g.id === guest.id ? res.guest : g)));
      toastSuccess(`Updated RSVP for ${guest.name} to ${RSVP_STATUS_LABELS[newRsvp]}`);
      loadGuestsAndEstimate();
      onRefreshEvents?.();
    } catch (err: any) {
      toastError(err.message || 'Failed to update RSVP status.');
    }
  };

  // Delete Guest
  const handleDeleteGuest = async () => {
    if (!guestToDelete) return;
    try {
      await deleteGuest(selectedEventId, guestToDelete.id, userId);
      setGuests((prev) => prev.filter((g) => g.id !== guestToDelete.id));
      toastSuccess(`Removed ${guestToDelete.name} from guest roster.`);
      setGuestToDelete(null);
      loadGuestsAndEstimate();
      onRefreshEvents?.();
    } catch (err: any) {
      toastError(err.message || 'Failed to remove guest.');
    }
  };

  // Parse CSV File / Text
  const parseCSVRows = (rawText: string): BulkGuestImportRow[] => {
    const lines = rawText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) return [];

    // Check if line 0 is a header row
    const firstLineLower = lines[0].toLowerCase();
    const hasHeader =
      firstLineLower.includes('name') ||
      firstLineLower.includes('guest') ||
      firstLineLower.includes('rsvp');

    const dataLines = hasHeader ? lines.slice(1) : lines;
    const result: BulkGuestImportRow[] = [];

    for (const line of dataLines) {
      // Split by comma respecting quotes
      const regex = /(?:,|\n|^)("(?:(?:"")*[^"]*)*"|[^",\n]*|(?:\n|$))/g;
      const cells: string[] = [];
      let match: RegExpExecArray | null;
      while ((match = regex.exec(line)) !== null) {
        let val = match[1] || '';
        if (val.startsWith('"') && val.endsWith('"')) {
          val = val.substring(1, val.length - 1).replace(/""/g, '"');
        }
        cells.push(val.trim());
        if (regex.lastIndex >= line.length) break;
      }

      if (cells.length > 0 && cells[0]) {
        const adults = parseInt(cells[2], 10) || 1;
        const children = parseInt(cells[3], 10) || 0;
        const partySize = parseInt(cells[4], 10) || adults + children;

        result.push({
          name: cells[0],
          group_household: cells[1] || 'General',
          adults_count: adults,
          children_count: children,
          party_size: partySize,
          rsvp_status: cells[5] || 'not_invited',
          dietary_preference: cells[6] || 'Standard',
          accessibility_requests: cells[7] || '',
          table_assignment: cells[8] || 'Unassigned',
          notes: cells[9] || '',
        });
      }
    }
    return result;
  };

  // Handle File Input Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvText(content);
    };
    reader.readAsText(file);
  };

  // Submit Bulk Import
  const handleRunBulkImport = async () => {
    if (!csvText.trim()) {
      toastError('Please paste CSV text or select a valid .csv file.');
      return;
    }

    const rows = parseCSVRows(csvText);
    if (rows.length === 0) {
      toastError('Could not parse any valid guest rows from CSV.');
      return;
    }

    setImporting(true);
    setImportErrors([]);
    setImportDuplicates([]);

    try {
      const res = await bulkImportGuests(selectedEventId, rows, skipDuplicates, userId);
      setGuests(res.guests);
      setImportErrors(res.errors || []);
      setImportDuplicates(res.duplicates_detected || []);

      if (res.imported_count > 0) {
        toastSuccess(`Successfully imported ${res.imported_count} guests!`);
        if (res.skipped_duplicate_count > 0) {
          toastSuccess(`Skipped ${res.skipped_duplicate_count} duplicate entries.`);
        }
        setIsBulkImportOpen(false);
        setCsvText('');
        loadGuestsAndEstimate();
        onRefreshEvents?.();
      } else if (res.skipped_duplicate_count > 0) {
        toastError(`All ${res.skipped_duplicate_count} rows were skipped as duplicates.`);
      } else if (res.errors.length > 0) {
        toastError(`Import failed: ${res.errors[0]}`);
      }
    } catch (err: any) {
      toastError(err.message || 'Bulk import failed.');
    } finally {
      setImporting(false);
    }
  };

  // Export to CSV with formula injection sanitization
  const handleExportCSV = () => {
    if (guests.length === 0) {
      toastError('No guests to export.');
      return;
    }

    const sanitizeCell = (val: any): string => {
      if (val === null || val === undefined) return '""';
      let str = String(val).replace(/"/g, '""');
      if (/^[=\+\-@\t\r]/.test(str)) {
        str = "'" + str; // Defuse spreadsheet formula execution
      }
      return `"${str}"`;
    };

    const headers = [
      'Guest Name',
      'Group / Household',
      'Party Size',
      'Adults',
      'Children',
      'RSVP Status',
      'Dietary Preference',
      'Accessibility Requests',
      'Table Assignment',
      'Invitation Delivery Tracking',
      'Notes',
    ];

    const rows = guests.map((g) => [
      sanitizeCell(g.name || ''),
      sanitizeCell(g.group_household || ''),
      g.party_size || 1,
      g.adults_count || 1,
      g.children_count || 0,
      sanitizeCell(RSVP_STATUS_LABELS[g.rsvp_status] || g.rsvp_status),
      sanitizeCell(g.dietary_preference || 'Standard'),
      sanitizeCell(g.accessibility_requests || ''),
      sanitizeCell(g.table_assignment || 'Unassigned'),
      sanitizeCell(g.invitation_delivery_note || 'Manually Tracked'),
      sanitizeCell(g.notes || ''),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `FestivaAI_GuestList_${activeEvent?.event_name?.replace(/[^a-zA-Z0-9]/g, '_') || 'Event'}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toastSuccess('Guest list exported to CSV.');
  };

  // Download Sample CSV Template
  const handleDownloadTemplate = () => {
    const templateContent =
      'Name,Group / Household,Adults,Children,Party Size,RSVP Status,Dietary Preference,Accessibility Requests,Table Assignment,Notes\n' +
      '"Aarav & Priya Sharma","Immediate Family",2,0,2,"confirmed","Vegetarian","Step-Free Access","Table 1 - Royal Orchid","Bride\'s close cousins"\n' +
      '"Rohan Mehta","College Friends",1,0,1,"maybe","Gluten-Free","","Unassigned","Awaiting flight booking"\n' +
      '"Kavita & Dev Rao","Groom Family",2,1,3,"invited","Jain","Senior Assistance","Table 2 - Jasmine","Require high chair"\n';

    const encodedUri = encodeURI('data:text/csv;charset=utf-8,' + templateContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'FestivaAI_Guest_Import_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // RSVP badge color
  const getRsvpBadgeVariant = (status: GuestRsvpStatus) => {
    switch (status) {
      case 'confirmed':
        return 'bg-[var(--success-light)] text-[var(--success)] border-[var(--success)]/30';
      case 'maybe':
        return 'bg-[var(--warning-light)] text-[var(--warning)] border-[var(--warning)]/30';
      case 'declined':
        return 'bg-[var(--danger)]/10 text-[var(--danger)] border-[var(--danger)]/20 line-through';
      case 'invited':
        return 'bg-[var(--primary-light)] text-[var(--primary)] border-[var(--primary)]/30';
      case 'not_invited':
      default:
        return 'bg-[var(--surface-elevated)] text-[var(--text-secondary)] border-[var(--border)]';
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* ───────────────────────────────────────────────────────────────────────
          HEADER & CELEBRATION SELECTOR
          ─────────────────────────────────────────────────────────────────────── */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-soft flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center shadow-xs">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display font-bold text-xl sm:text-2xl text-[var(--text-primary)]">
                Guest &amp; RSVP Manager
              </h2>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--success-light)] text-[var(--success)] border border-[var(--success)]/20">
                Hospitality Matrix
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Track invitations, attendance probabilities, dietary care preferences, and table seating assignments.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {events.length > 0 && (
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="px-3.5 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] text-xs font-semibold text-[var(--text-primary)] outline-none cursor-pointer focus:ring-2 focus:ring-[var(--primary)]/20"
              aria-label="Select celebration for guest management"
            >
              {events.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.event_name} ({e.event_type})
                </option>
              ))}
            </select>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsBulkImportOpen(true)}
            leftIcon={<Upload className="w-3.5 h-3.5" />}
          >
            Bulk CSV Import
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            Export CSV
          </Button>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleOpenAdd}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Add Guest
          </Button>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────────────
          GUEST SUMMARY DASHBOARD METRICS
          ─────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card variant="default" padding="sm" className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
              Total Roster
            </span>
            <Users className="w-3.5 h-3.5 text-[var(--primary)]" />
          </div>
          <div className="font-display font-bold text-xl text-[var(--text-primary)]">
            {totalHeadcount}
          </div>
          <span className="text-[10px] text-[var(--text-secondary)] block">
            {guests.length} parties tracked
          </span>
        </Card>

        <Card variant="default" padding="sm" className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
              Confirmed
            </span>
            <CheckCircle2 className="w-3.5 h-3.5 text-[var(--success)]" />
          </div>
          <div className="font-display font-bold text-xl text-[var(--success)]">
            {confirmedCount}
          </div>
          <span className="text-[10px] text-[var(--text-secondary)] block">
            {totalHeadcount > 0 ? `${Math.round((confirmedCount / totalHeadcount) * 100)}% attendance` : '0%'}
          </span>
        </Card>

        <Card variant="default" padding="sm" className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
              Tentative
            </span>
            <HelpCircle className="w-3.5 h-3.5 text-[var(--warning)]" />
          </div>
          <div className="font-display font-bold text-xl text-[var(--warning)]">
            {maybeCount}
          </div>
          <span className="text-[10px] text-[var(--text-secondary)] block">
            Maybe / unconfirmed
          </span>
        </Card>

        <Card variant="default" padding="sm" className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
              Awaiting RSVP
            </span>
            <Clock className="w-3.5 h-3.5 text-[var(--primary)]" />
          </div>
          <div className="font-display font-bold text-xl text-[var(--text-primary)]">
            {awaitingCount}
          </div>
          <span className="text-[10px] text-[var(--text-secondary)] block">
            Pending response
          </span>
        </Card>

        <Card variant="default" padding="sm" className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
              Declined
            </span>
            <XCircle className="w-3.5 h-3.5 text-[var(--danger)]" />
          </div>
          <div className="font-display font-bold text-xl text-[var(--text-secondary)]">
            {declinedCount}
          </div>
          <span className="text-[10px] text-[var(--text-secondary)] block">
            Cannot attend
          </span>
        </Card>

        <Card variant="default" padding="sm" className="space-y-1 bg-[var(--primary-light)]/20 border-[var(--primary)]/30">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-[var(--primary)] uppercase tracking-wider">
              Expected Attendance
            </span>
            <Utensils className="w-3.5 h-3.5 text-[var(--primary)]" />
          </div>
          <div className="font-display font-bold text-xl text-[var(--primary)]">
            ~{expectedAttendance}
          </div>
          <button
            type="button"
            onClick={() => setIsCateringDetailsOpen(true)}
            className="text-[10px] font-bold text-[var(--primary)] hover:underline flex items-center gap-1 text-left"
          >
            <span>View Catering Sheet</span>
            <Eye className="w-2.5 h-2.5" />
          </button>
        </Card>
      </div>

      {/* ───────────────────────────────────────────────────────────────────────
          PRIVACY & DELIVERY TRANSPARENCY NOTICE
          ─────────────────────────────────────────────────────────────────────── */}
      <div className="p-3.5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex items-start gap-2.5 text-xs text-[var(--text-secondary)]">
        <Info className="w-4 h-4 text-[var(--primary)] shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-[var(--text-primary)]">Privacy &amp; Delivery Transparency:</strong>{' '}
          Guest records are strictly restricted to authorized celebration owners. Festiva AI does not claim messages or invitations have been sent unless an actual external carrier delivery integration is configured. Invitation statuses reflect manual coordination entries recorded by you.
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────────────
          FILTERS & SEARCH BAR
          ─────────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-[var(--surface)] border border-[var(--border)]">
        {/* RSVP Status Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none flex-1">
          {[
            { id: 'all', label: 'All Guests', count: totalHeadcount },
            { id: 'confirmed', label: 'Confirmed', count: confirmedCount },
            { id: 'maybe', label: 'Maybe', count: maybeCount },
            { id: 'invited', label: 'Awaiting', count: awaitingCount },
            { id: 'declined', label: 'Declined', count: declinedCount },
            { id: 'not_invited', label: 'Not Invited', count: guests.filter((g) => g.rsvp_status === 'not_invited').reduce((s, g) => s + g.party_size, 0) },
          ].map((pill) => (
            <button
              key={pill.id}
              type="button"
              onClick={() => setSelectedRsvp(pill.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                selectedRsvp === pill.id
                  ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-xs'
                  : 'bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)] hover:bg-[var(--surface-elevated)]'
              }`}
            >
              <span>{pill.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  selectedRsvp === pill.id ? 'bg-white/20 text-white' : 'bg-[var(--surface-elevated)] text-[var(--text-secondary)]'
                }`}
              >
                {pill.count}
              </span>
            </button>
          ))}
        </div>

        {/* Group / Dietary / Table Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedDietary}
            onChange={(e) => setSelectedDietary(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] text-xs font-semibold text-[var(--text-primary)] outline-none cursor-pointer"
            aria-label="Filter by dietary preference"
          >
            <option value="all">All Diets</option>
            {COMMON_DIETARY_OPTIONS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          {availableGroups.length > 0 && (
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] text-xs font-semibold text-[var(--text-primary)] outline-none cursor-pointer"
              aria-label="Filter by household group"
            >
              <option value="all">All Groups</option>
              {availableGroups.map((grp) => (
                <option key={grp} value={grp}>
                  {grp}
                </option>
              ))}
            </select>
          )}

          <div className="relative min-w-[180px]">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
            <input
              type="text"
              placeholder="Search name, table, diet..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)] outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
            />
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────────────
          GUEST LIST TABLE (Desktop) & CARDS (Mobile)
          ─────────────────────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="py-12 text-center text-xs text-[var(--text-secondary)]">
          Loading guest roster...
        </div>
      ) : filteredGuests.length > 0 ? (
        <div className="space-y-4">
          {/* Desktop Accessible Table */}
          <div className="hidden md:block overflow-x-auto border border-[var(--border)] rounded-2xl bg-[var(--surface)] shadow-card">
            <table className="w-full text-left text-xs" aria-label="Celebration Guest List">
              <thead className="bg-[var(--surface-elevated)] border-b border-[var(--border)] text-[var(--text-secondary)] font-semibold">
                <tr>
                  <th scope="col" className="p-3.5">Guest &amp; Household</th>
                  <th scope="col" className="p-3.5">Party Size</th>
                  <th scope="col" className="p-3.5">RSVP Status</th>
                  <th scope="col" className="p-3.5">Dietary &amp; Care</th>
                  <th scope="col" className="p-3.5">Table Seating</th>
                  <th scope="col" className="p-3.5">Invitation Tracking</th>
                  <th scope="col" className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filteredGuests.map((guest) => (
                  <tr key={guest.id} className="hover:bg-[var(--surface-elevated)]/40 transition-colors">
                    {/* Name & Household */}
                    <td className="p-3.5">
                      <div className="font-bold text-[var(--text-primary)] text-sm">
                        {guest.name}
                      </div>
                      <span className="text-[11px] text-[var(--text-secondary)]">
                        {guest.group_household || 'General'}
                      </span>
                      {guest.notes && (
                        <p className="text-[10px] text-[var(--text-secondary)] italic mt-0.5 max-w-xs truncate">
                          "{guest.notes}"
                        </p>
                      )}
                    </td>

                    {/* Party Size */}
                    <td className="p-3.5">
                      <div className="font-bold text-[var(--text-primary)]">
                        {guest.party_size || 1} guest{(guest.party_size || 1) > 1 ? 's' : ''}
                      </div>
                      <span className="text-[10px] text-[var(--text-secondary)]">
                        {guest.adults_count || 1} adult{(guest.adults_count || 1) > 1 ? 's' : ''}
                        {guest.children_count ? `, ${guest.children_count} kid${guest.children_count > 1 ? 's' : ''}` : ''}
                      </span>
                    </td>

                    {/* RSVP Status */}
                    <td className="p-3.5">
                      <select
                        value={guest.rsvp_status}
                        onChange={(e) => handleQuickRsvpChange(guest, e.target.value as GuestRsvpStatus)}
                        className={`px-2 py-1 rounded-full text-xs font-semibold border outline-none cursor-pointer ${getRsvpBadgeVariant(
                          guest.rsvp_status
                        )}`}
                        aria-label={`Change RSVP status for ${guest.name}`}
                      >
                        <option value="not_invited">Not Invited</option>
                        <option value="invited">Invited</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="maybe">Maybe</option>
                        <option value="declined">Declined</option>
                      </select>
                    </td>

                    {/* Dietary & Accessibility */}
                    <td className="p-3.5">
                      <div className="font-semibold text-[var(--text-primary)] flex items-center gap-1">
                        <Utensils className="w-3 h-3 text-[var(--accent)]" />
                        <span>{guest.dietary_preference || 'Standard'}</span>
                      </div>
                      {guest.accessibility_requests && (
                        <span className="text-[10px] text-[var(--primary)] font-medium flex items-center gap-1 mt-0.5">
                          <Accessibility className="w-3 h-3" />
                          <span>{guest.accessibility_requests}</span>
                        </span>
                      )}
                    </td>

                    {/* Table Assignment */}
                    <td className="p-3.5">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-lg border font-medium ${
                          guest.table_assignment && guest.table_assignment.toLowerCase() !== 'unassigned'
                            ? 'bg-[var(--secondary)] text-[var(--primary)] border-[var(--primary)]/20'
                            : 'bg-[var(--surface-elevated)] text-[var(--text-secondary)] border-[var(--border)]'
                        }`}
                      >
                        {guest.table_assignment || 'Unassigned'}
                      </span>
                    </td>

                    {/* Invitation Status */}
                    <td className="p-3.5 text-[11px] text-[var(--text-secondary)]">
                      <span className="capitalize">{guest.invitation_status.replace('_', ' ')}</span>
                      <span className="block text-[9px] text-[var(--text-secondary)]/80">
                        (Manual Record)
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(guest)}
                          className="p-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors"
                          title="Edit guest details"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setGuestToDelete(guest)}
                          className="p-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--danger)]/10 text-[var(--text-secondary)] hover:text-[var(--danger)] transition-colors"
                          title="Remove guest"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Compact Cards Layout */}
          <div className="md:hidden space-y-3">
            {filteredGuests.map((guest) => (
              <Card key={guest.id} variant="default" padding="sm" className="space-y-2 border border-[var(--border)]">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-display font-bold text-sm text-[var(--text-primary)]">
                      {guest.name}
                    </h3>
                    <span className="text-[10px] text-[var(--text-secondary)]">
                      {guest.group_household} • {guest.party_size} attendee{guest.party_size > 1 ? 's' : ''}
                    </span>
                  </div>

                  <select
                    value={guest.rsvp_status}
                    onChange={(e) => handleQuickRsvpChange(guest, e.target.value as GuestRsvpStatus)}
                    className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border outline-none ${getRsvpBadgeVariant(
                      guest.rsvp_status
                    )}`}
                  >
                    <option value="not_invited">Not Invited</option>
                    <option value="invited">Invited</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="maybe">Maybe</option>
                    <option value="declined">Declined</option>
                  </select>
                </div>

                <div className="text-xs text-[var(--text-secondary)] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Utensils className="w-3 h-3 text-[var(--accent)]" />
                      <span>{guest.dietary_preference || 'Standard'}</span>
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-[var(--surface-elevated)] border border-[var(--border)] text-[10px]">
                      {guest.table_assignment || 'Unassigned'}
                    </span>
                  </div>
                  {guest.accessibility_requests && (
                    <div className="text-[10px] text-[var(--primary)] flex items-center gap-1">
                      <Accessibility className="w-3 h-3" />
                      <span>{guest.accessibility_requests}</span>
                    </div>
                  )}
                  {guest.notes && <p className="italic text-[10px]">"{guest.notes}"</p>}
                </div>

                <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-[var(--border)]">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(guest)}
                    className="p-1 rounded border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--primary)] text-xs flex items-center gap-1 px-2"
                  >
                    <Edit3 className="w-3 h-3" /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setGuestToDelete(guest)}
                    className="p-1 rounded border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--danger)] text-xs flex items-center gap-1 px-2"
                  >
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <Card variant="default" padding="lg" className="text-center py-12 space-y-3">
          <Users className="w-12 h-12 text-[var(--text-secondary)] mx-auto opacity-50" />
          <h3 className="font-display font-bold text-lg text-[var(--text-primary)]">
            No Guests Found
          </h3>
          <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto">
            {searchQuery || selectedRsvp !== 'all' || selectedGroup !== 'all'
              ? 'No guest records match your search filters. Try adjusting keywords.'
              : 'Your guest roster is ready for guests. Add family and friends, or bulk import directly from a spreadsheet.'}
          </p>
          <div className="flex items-center justify-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsBulkImportOpen(true)} leftIcon={<Upload className="w-3.5 h-3.5" />}>
              Import CSV
            </Button>
            <Button variant="primary" size="sm" onClick={handleOpenAdd} leftIcon={<Plus className="w-3.5 h-3.5" />}>
              Add Single Guest
            </Button>
          </div>
        </Card>
      )}

      {/* ───────────────────────────────────────────────────────────────────────
          MODAL 1: ADD / EDIT GUEST MODAL
          ─────────────────────────────────────────────────────────────────────── */}
      {isAddEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 w-full max-w-lg shadow-xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <div>
                <h3 className="font-display font-bold text-lg text-[var(--text-primary)]">
                  {editingGuest ? 'Edit Guest Details' : 'Add Guest to Celebration'}
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  Party size, RSVP status, dietary care, and table seating assignment
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddEditOpen(false)}
                className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--surface-elevated)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveGuest} className="space-y-4">
              {/* Name & Duplicate Warning */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-primary)]">Guest / Family Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Dr. Rajesh &amp; Sunita Verma"
                  className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] text-xs text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
                />
                {duplicateWarning && (
                  <div className="flex items-center gap-1.5 text-[11px] text-[var(--warning)] font-medium mt-1">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>Likely duplicate of existing record "{duplicateWarning}".</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-primary)]">Group / Household</label>
                  <input
                    type="text"
                    value={formData.group_household}
                    onChange={(e) => setFormData({ ...formData, group_household: e.target.value })}
                    placeholder="e.g. Family Elders, College Friends"
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] text-xs text-[var(--text-primary)] outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-primary)]">RSVP Status</label>
                  <select
                    value={formData.rsvp_status}
                    onChange={(e) => setFormData({ ...formData, rsvp_status: e.target.value as GuestRsvpStatus })}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] text-xs font-semibold text-[var(--text-primary)] outline-none"
                  >
                    <option value="not_invited">Not Invited</option>
                    <option value="invited">Invited</option>
                    <option value="confirmed">Confirmed Attending</option>
                    <option value="maybe">Tentative / Maybe</option>
                    <option value="declined">Declined</option>
                  </select>
                </div>
              </div>

              {/* Party Breakdown */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-primary)]">Adults</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.adults_count}
                    onChange={(e) => setFormData({ ...formData, adults_count: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] text-xs text-[var(--text-primary)] outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-primary)]">Children</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.children_count}
                    onChange={(e) => setFormData({ ...formData, children_count: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] text-xs text-[var(--text-primary)] outline-none"
                  />
                </div>
              </div>

              {/* Dietary & Accessibility */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-primary)]">Dietary Preference</label>
                  <select
                    value={formData.dietary_preference}
                    onChange={(e) => setFormData({ ...formData, dietary_preference: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] text-xs font-semibold text-[var(--text-primary)] outline-none"
                  >
                    {COMMON_DIETARY_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-primary)]">Accessibility Requests</label>
                  <select
                    value={formData.accessibility_requests}
                    onChange={(e) => setFormData({ ...formData, accessibility_requests: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] text-xs font-semibold text-[var(--text-primary)] outline-none"
                  >
                    {COMMON_ACCESSIBILITY_OPTIONS.map((opt) => (
                      <option key={opt} value={opt === 'None Required' ? '' : opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Table Seating Assignment */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-primary)]">Table / Seating Assignment</label>
                <input
                  type="text"
                  value={formData.table_assignment}
                  onChange={(e) => setFormData({ ...formData, table_assignment: e.target.value })}
                  placeholder="e.g. Table 1 - Royal Orchid, Table 4, Unassigned"
                  className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] text-xs text-[var(--text-primary)] outline-none"
                />
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-primary)]">Hospitality Notes</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g. Needs booster high chair, traveling from out of town"
                  className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] text-xs text-[var(--text-primary)] outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border)]">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsAddEditOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  {editingGuest ? 'Save Changes' : 'Add Guest'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────
          MODAL 2: BULK CSV IMPORT WITH VALIDATION & DUPLICATE DETECTION
          ─────────────────────────────────────────────────────────────────────── */}
      {isBulkImportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 w-full max-w-2xl shadow-xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-[var(--text-primary)]">
                    Bulk Guest Import from CSV
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Upload spreadsheet rows with automatic duplicate protection and data validation
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBulkImportOpen(false)}
                className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--surface-elevated)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* File upload or paste toggle */}
              <div className="p-4 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <div className="font-semibold text-[var(--text-primary)]">Upload CSV File</div>
                  <div className="text-[11px] text-[var(--text-secondary)]">
                    Supports columns: Name, Group, Adults, Children, Party Size, RSVP, Dietary, Accessibility, Table, Notes
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    leftIcon={<Upload className="w-3.5 h-3.5" />}
                  >
                    Select File
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleDownloadTemplate}
                    leftIcon={<Download className="w-3.5 h-3.5" />}
                  >
                    Download Template
                  </Button>
                </div>
              </div>

              {/* Paste Textarea */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-primary)]">
                  Or Paste Raw CSV Rows Directly
                </label>
                <textarea
                  rows={6}
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  placeholder={`Name,Group,Adults,Children,Party Size,RSVP,Dietary,Accessibility,Table,Notes\n"Aarav Sharma","Family",2,0,2,"confirmed","Vegetarian","","Table 1","Cousin"`}
                  className="w-full font-mono text-[11px] p-3 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
                />
              </div>

              {/* Duplicate Protection Option */}
              <label className="flex items-center gap-2 cursor-pointer p-3 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)]">
                <input
                  type="checkbox"
                  checked={skipDuplicates}
                  onChange={(e) => setSkipDuplicates(e.target.checked)}
                  className="w-4 h-4 rounded text-[var(--primary)] focus:ring-[var(--primary)] cursor-pointer"
                />
                <div>
                  <span className="font-semibold text-[var(--text-primary)] block">
                    Skip Potential Duplicates
                  </span>
                  <span className="text-[11px] text-[var(--text-secondary)] block">
                    Automatically skips entries matching existing guest names to prevent double headcounts
                  </span>
                </div>
              </label>

              {/* Error & Duplicate Alerts */}
              {importErrors.length > 0 && (
                <div className="p-3 rounded-xl bg-[var(--danger)]/10 border border-[var(--danger)]/30 text-[var(--danger)] space-y-1">
                  <div className="font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Validation Errors:
                  </div>
                  <ul className="list-disc pl-4 text-[11px] space-y-0.5">
                    {importErrors.slice(0, 5).map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {importDuplicates.length > 0 && (
                <div className="p-3 rounded-xl bg-[var(--warning-light)] border border-[var(--warning)]/30 text-[var(--warning)] space-y-1">
                  <div className="font-bold flex items-center gap-1">
                    <Info className="w-3.5 h-3.5" /> Detected Duplicates:
                  </div>
                  <ul className="list-disc pl-4 text-[11px] space-y-0.5">
                    {importDuplicates.slice(0, 5).map((dup, i) => (
                      <li key={i}>{dup}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border)]">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsBulkImportOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleRunBulkImport}
                disabled={importing}
                leftIcon={<Upload className="w-3.5 h-3.5" />}
              >
                {importing ? 'Importing Rows...' : 'Import Guests'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────
          MODAL 3: CATERING & HOSPITALITY REQUIREMENTS SHEET
          ─────────────────────────────────────────────────────────────────────── */}
      {isCateringDetailsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 w-full max-w-2xl shadow-xl space-y-5 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center">
                  <Utensils className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-[var(--text-primary)]">
                    Catering &amp; Hospitality Requirements Sheet
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Aggregated meal prep counts derived from confirmed guest RSVPs
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCateringDetailsOpen(false)}
                className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--surface-elevated)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Headcount Projections */}
              <div className="grid grid-cols-3 gap-2">
                <div className="p-3 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] text-center">
                  <span className="text-[10px] text-[var(--text-secondary)] font-semibold uppercase block">
                    Confirmed Base
                  </span>
                  <span className="font-display font-bold text-lg text-[var(--success)]">
                    {cateringEstimate?.total_confirmed_guests ?? confirmedCount}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] text-center">
                  <span className="text-[10px] text-[var(--text-secondary)] font-semibold uppercase block">
                    Tentative Buffer
                  </span>
                  <span className="font-display font-bold text-lg text-[var(--warning)]">
                    +{cateringEstimate?.total_maybe_guests ?? maybeCount}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[var(--primary-light)]/30 border border-[var(--primary)]/30 text-center">
                  <span className="text-[10px] text-[var(--primary)] font-semibold uppercase block">
                    Recommended Catering
                  </span>
                  <span className="font-display font-bold text-lg text-[var(--primary)]">
                    {cateringEstimate?.expected_attendance_estimated ?? expectedAttendance}
                  </span>
                </div>
              </div>

              {/* Dietary Breakdown */}
              <div className="space-y-2">
                <h4 className="font-display font-bold text-sm text-[var(--text-primary)] flex items-center gap-1.5">
                  <Utensils className="w-4 h-4 text-[var(--accent)]" />
                  Meal Portions by Dietary Requirement
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.entries(cateringEstimate?.dietary_breakdown || {}).map(([diet, count]) => (
                    <div
                      key={diet}
                      className="p-2.5 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] flex items-center justify-between"
                    >
                      <span className="font-medium text-[var(--text-primary)]">{diet}</span>
                      <span className="font-bold text-[var(--primary)] px-2 py-0.5 rounded-full bg-[var(--primary-light)]">
                        {count} meals
                      </span>
                    </div>
                  ))}
                  {Object.keys(cateringEstimate?.dietary_breakdown || {}).length === 0 && (
                    <div className="col-span-full p-3 rounded-xl bg-[var(--surface-elevated)] text-[var(--text-secondary)] text-center">
                      No confirmed dietary preferences logged yet.
                    </div>
                  )}
                </div>
              </div>

              {/* Table Seating Summary */}
              <div className="space-y-2">
                <h4 className="font-display font-bold text-sm text-[var(--text-primary)] flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-[var(--primary)]" />
                  Table Seating Assignments
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.entries(cateringEstimate?.table_seating_summary || {}).map(([table, count]) => (
                    <div
                      key={table}
                      className="p-2.5 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] flex items-center justify-between"
                    >
                      <span className="font-medium text-[var(--text-primary)] truncate max-w-[120px]">{table}</span>
                      <span className="font-bold text-[var(--text-secondary)]">
                        {count} guests
                      </span>
                    </div>
                  ))}
                  {(cateringEstimate?.unassigned_count || 0) > 0 && (
                    <div className="p-2.5 rounded-xl bg-[var(--warning-light)] border border-[var(--warning)]/30 flex items-center justify-between">
                      <span className="font-medium text-[var(--warning)]">Unassigned</span>
                      <span className="font-bold text-[var(--warning)]">
                        {cateringEstimate?.unassigned_count} guests
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Accessibility Accommodations */}
              {(cateringEstimate?.accessibility_summary || []).length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-display font-bold text-sm text-[var(--text-primary)] flex items-center gap-1.5">
                    <Accessibility className="w-4 h-4 text-[var(--success)]" />
                    Special Accessibility Accommodations
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {cateringEstimate?.accessibility_summary.map((acc, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--text-primary)] font-medium"
                      >
                        {acc}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-[var(--border)]">
              <Button variant="primary" size="sm" onClick={() => setIsCateringDetailsOpen(false)}>
                Done Reviewing
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────
          MODAL 4: DELETE GUEST CONFIRMATION
          ─────────────────────────────────────────────────────────────────────── */}
      {guestToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 w-full max-w-md shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[var(--danger)]/15 text-[var(--danger)] flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-[var(--text-primary)]">
                  Remove Guest
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  Delete guest from celebration roster
                </p>
              </div>
            </div>

            <p className="text-xs text-[var(--text-primary)] leading-relaxed">
              Are you sure you want to remove <strong>{guestToDelete.name}</strong> (party size: {guestToDelete.party_size})? This action will remove their table assignment and dietary preferences.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setGuestToDelete(null)}>
                Cancel
              </Button>
              <Button variant="danger" size="sm" onClick={handleDeleteGuest}>
                Remove Guest
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
