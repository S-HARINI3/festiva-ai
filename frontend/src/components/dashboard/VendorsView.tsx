import { useState, useMemo, useEffect } from 'react';
import {
  Store,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  Star,
  CheckCircle2,
  Phone,
  Mail,
  Globe,
  FileText,
  Trash2,
  Edit3,
  Download,
  Sparkles,
  Scale,
  AlertCircle,
  Calendar,
  X,
  ExternalLink,
  Info,
  Check,
  Table,
  LayoutGrid,
} from 'lucide-react';
import type {
  SavedEvent,
  VendorRecord,
  VendorCategory,
  VendorSelectionStatus,
  VendorAvailability,
  VendorComparisonAnalysis,
} from '../../types/events';
import {
  VENDOR_CATEGORY_LABELS,
  VENDOR_SELECTION_LABELS,
} from '../../types/events';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { Card, Button, useToast } from '../ui';
import {
  getEventVendors,
  addVendor,
  updateVendor,
  deleteVendor,
  compareVendors,
} from '../../services/api';

interface VendorsViewProps {
  events: SavedEvent[];
  userId?: string;
  onRefreshEvents?: () => void;
  // Backward compatibility
  vendors?: any[];
  onOpenAddVendor?: () => void;
  onUpdateVendorStatus?: (vendorId: string, status: any) => void;
}

const ALL_CATEGORIES: VendorCategory[] = [
  'venues',
  'caterers',
  'photographers',
  'decorators',
  'florists',
  'entertainment',
  'makeup_artists',
  'transportation',
  'other',
];

export default function VendorsView({
  events,
  userId = 'demo-user-001',
  onRefreshEvents,
}: VendorsViewProps) {
  const { success: toastSuccess, error: toastError } = useToast();

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

  // Vendor list state
  const [vendors, setVendors] = useState<VendorRecord[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters & Search
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'price_asc' | 'price_desc' | 'rating_desc' | 'name_asc'>('price_asc');
  const [desktopViewMode, setDesktopViewMode] = useState<'table' | 'cards'>('table');

  // Multi-selection for comparison
  const [selectedVendorIds, setSelectedVendorIds] = useState<string[]>([]);

  // Modals
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<VendorRecord | null>(null);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [comparisonAnalysis, setComparisonAnalysis] = useState<VendorComparisonAnalysis | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [vendorToDelete, setVendorToDelete] = useState<VendorRecord | null>(null);
  const [bookingConfirmationVendor, setBookingConfirmationVendor] = useState<VendorRecord | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    business_name: '',
    category: 'venues' as VendorCategory,
    contact_name: '',
    contact_phone: '',
    contact_email: '',
    website: '',
    quoted_price: 0,
    currency: 'INR',
    availability_status: 'available' as VendorAvailability,
    selection_status: 'shortlisted' as VendorSelectionStatus,
    rating: 5,
    notes: '',
    follow_up_date: '',
    quotation_details: '',
    comparison_notes: '',
  });

  // Load vendors from API
  const loadVendors = async () => {
    if (!selectedEventId) return;
    setLoading(true);
    try {
      const res = await getEventVendors(selectedEventId, undefined, userId);
      setVendors(res.vendors || []);
    } catch {
      // Fallback to local plan_data vendors if available
      const localVendors = activeEvent?.plan_data?.vendors || [];
      setVendors(localVendors);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedEventId) {
      loadVendors();
      setSelectedVendorIds([]);
    }
  }, [selectedEventId]);

  // Filtered & Sorted Vendors
  const filteredVendors = useMemo(() => {
    let result = vendors.filter((v) => {
      const matchesCat = selectedCategory === 'all' || v.category === selectedCategory;
      const matchesStatus = statusFilter === 'all' || v.selection_status === statusFilter;
      const matchesAvail = availabilityFilter === 'all' || v.availability_status === availabilityFilter;
      const matchesSearch =
        !searchQuery ||
        `${v.business_name} ${v.notes || ''} ${v.quotation_details || ''} ${v.contact_info || ''}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase().trim());

      return matchesCat && matchesStatus && matchesAvail && matchesSearch;
    });

    result.sort((a, b) => {
      if (sortBy === 'price_asc') return a.quoted_price - b.quoted_price;
      if (sortBy === 'price_desc') return b.quoted_price - a.quoted_price;
      if (sortBy === 'rating_desc') return (b.rating || 0) - (a.rating || 0);
      if (sortBy === 'name_asc') return a.business_name.localeCompare(b.business_name);
      return 0;
    });

    return result;
  }, [vendors, selectedCategory, statusFilter, availabilityFilter, searchQuery, sortBy]);

  // Derived metrics
  const totalQuotedAmount = useMemo(() => {
    return vendors.reduce((sum, v) => sum + (v.quoted_price || 0), 0);
  }, [vendors]);

  const bookedAmount = useMemo(() => {
    return vendors
      .filter((v) => v.selection_status === 'booked' || v.selection_status === 'selected')
      .reduce((sum, v) => sum + (v.quoted_price || 0), 0);
  }, [vendors]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    vendors.forEach((v) => {
      counts[v.category] = (counts[v.category] || 0) + 1;
    });
    return counts;
  }, [vendors]);

  // Toggle selection for comparison
  const handleToggleSelectVendor = (vendorId: string) => {
    setSelectedVendorIds((prev) =>
      prev.includes(vendorId) ? prev.filter((id) => id !== vendorId) : [...prev, vendorId]
    );
  };

  // Open Add modal
  const handleOpenAdd = () => {
    setEditingVendor(null);
    setFormData({
      business_name: '',
      category: (selectedCategory !== 'all' ? selectedCategory : 'venues') as VendorCategory,
      contact_name: '',
      contact_phone: '',
      contact_email: '',
      website: '',
      quoted_price: 0,
      currency: activeEvent?.plan_data?.currency || 'INR',
      availability_status: 'available',
      selection_status: 'shortlisted',
      rating: 5,
      notes: '',
      follow_up_date: '',
      quotation_details: '',
      comparison_notes: '',
    });
    setIsAddEditOpen(true);
  };

  // Open Edit modal
  const handleOpenEdit = (vendor: VendorRecord) => {
    setEditingVendor(vendor);
    setFormData({
      business_name: vendor.business_name,
      category: vendor.category,
      contact_name: vendor.contact_name || '',
      contact_phone: vendor.contact_phone || '',
      contact_email: vendor.contact_email || '',
      website: vendor.website || '',
      quoted_price: vendor.quoted_price || 0,
      currency: vendor.currency || 'INR',
      availability_status: vendor.availability_status,
      selection_status: vendor.selection_status,
      rating: vendor.rating || 5,
      notes: vendor.notes || '',
      follow_up_date: vendor.follow_up_date || '',
      quotation_details: vendor.quotation_details || '',
      comparison_notes: vendor.comparison_notes || '',
    });
    setIsAddEditOpen(true);
  };

  // Save Add/Edit
  const handleSaveVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.business_name.trim()) {
      toastError('Vendor business name is required.');
      return;
    }
    if (formData.quoted_price < 0) {
      toastError('Quoted price cannot be negative.');
      return;
    }

    try {
      if (editingVendor) {
        const res = await updateVendor(selectedEventId, editingVendor.id, formData, userId);
        setVendors((prev) => prev.map((v) => (v.id === editingVendor.id ? res.vendor : v)));
        toastSuccess(`Updated ${formData.business_name}`);
      } else {
        const res = await addVendor(selectedEventId, formData, userId);
        setVendors((prev) => [...prev, res.vendor]);
        toastSuccess(`Added ${formData.business_name} to Matchboard`);
      }
      setIsAddEditOpen(false);
      onRefreshEvents?.();
    } catch (err: any) {
      toastError(err.message || 'Failed to save vendor record.');
    }
  };

  // Direct status update
  const handleQuickStatusChange = async (vendor: VendorRecord, newStatus: VendorSelectionStatus) => {
    if (newStatus === 'booked') {
      setBookingConfirmationVendor(vendor);
      return;
    }

    try {
      const res = await updateVendor(selectedEventId, vendor.id, { selection_status: newStatus }, userId);
      setVendors((prev) => prev.map((v) => (v.id === vendor.id ? res.vendor : v)));
      toastSuccess(`Updated status to ${VENDOR_SELECTION_LABELS[newStatus]}`);
      onRefreshEvents?.();
    } catch (err: any) {
      toastError(err.message || 'Failed to update selection status.');
    }
  };

  // Confirmed booking confirmation
  const handleConfirmBooking = async () => {
    if (!bookingConfirmationVendor) return;
    try {
      const res = await updateVendor(
        selectedEventId,
        bookingConfirmationVendor.id,
        { selection_status: 'booked' },
        userId
      );
      setVendors((prev) => prev.map((v) => (v.id === bookingConfirmationVendor.id ? res.vendor : v)));
      toastSuccess(`Confirmed booking with ${bookingConfirmationVendor.business_name}!`);
      setBookingConfirmationVendor(null);
      onRefreshEvents?.();
    } catch (err: any) {
      toastError(err.message || 'Failed to record booking confirmation.');
    }
  };

  // Delete vendor
  const handleDeleteVendor = async () => {
    if (!vendorToDelete) return;
    try {
      await deleteVendor(selectedEventId, vendorToDelete.id, userId);
      setVendors((prev) => prev.filter((v) => v.id !== vendorToDelete.id));
      setSelectedVendorIds((prev) => prev.filter((id) => id !== vendorToDelete.id));
      toastSuccess(`Removed ${vendorToDelete.business_name}`);
      setVendorToDelete(null);
      onRefreshEvents?.();
    } catch (err: any) {
      toastError(err.message || 'Failed to delete vendor.');
    }
  };

  // Run AI Comparison
  const handleRunComparison = async () => {
    if (selectedVendorIds.length < 2) {
      toastError('Select at least 2 vendors to compare quotations side-by-side.');
      return;
    }

    setIsComparing(true);
    setIsCompareOpen(true);
    try {
      const res = await compareVendors(
        selectedEventId,
        selectedVendorIds,
        selectedCategory !== 'all' ? selectedCategory : undefined,
        userId
      );
      setComparisonAnalysis(res.analysis);
    } catch (err: any) {
      toastError(err.message || 'Could not synthesize vendor comparison.');
      setIsCompareOpen(false);
    } finally {
      setIsComparing(false);
    }
  };

  // Export vendors to CSV with CSV injection formula sanitization
  const handleExportCSV = () => {
    if (vendors.length === 0) {
      toastError('No vendor records to export.');
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
      'Business Name',
      'Category',
      'Contact Info',
      'Website',
      'Quoted Price',
      'Currency',
      'Availability Status',
      'Selection Status',
      'Rating',
      'Follow-up Date',
      'Quotation Details',
      'Comparison Notes',
      'Notes',
    ];

    const rows = vendors.map((v) => [
      sanitizeCell(v.business_name || ''),
      sanitizeCell(VENDOR_CATEGORY_LABELS[v.category] || v.category),
      sanitizeCell(v.contact_info || ''),
      sanitizeCell(v.website || ''),
      v.quoted_price || 0,
      sanitizeCell(v.currency || 'INR'),
      sanitizeCell(v.availability_status || 'unknown'),
      sanitizeCell(VENDOR_SELECTION_LABELS[v.selection_status] || v.selection_status),
      v.rating || '',
      sanitizeCell(v.follow_up_date || ''),
      sanitizeCell(v.quotation_details || ''),
      sanitizeCell(v.comparison_notes || ''),
      sanitizeCell(v.notes || ''),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `FestivaAI_Vendors_${activeEvent?.event_name?.replace(/[^a-zA-Z0-9]/g, '_') || 'Event'}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toastSuccess('Vendor records exported to CSV.');
  };

  // Status badge styling
  const getStatusBadgeVariant = (status: VendorSelectionStatus) => {
    switch (status) {
      case 'booked':
        return 'bg-[var(--primary)] text-white border-[var(--primary)]';
      case 'selected':
        return 'bg-[var(--success-light)] text-[var(--success)] border-[var(--success)]/30';
      case 'contacted':
        return 'bg-[var(--warning-light)] text-[var(--warning)] border-[var(--warning)]/30';
      case 'shortlisted':
        return 'bg-[var(--secondary)] text-[var(--primary)] border-[var(--primary)]/20';
      case 'rejected':
        return 'bg-[var(--surface-elevated)] text-[var(--text-secondary)] border-[var(--border)] line-through';
      default:
        return 'bg-[var(--surface-elevated)] text-[var(--text-secondary)] border-[var(--border)]';
    }
  };

  const selectedVendorsForModal = useMemo(() => {
    return vendors.filter((v) => selectedVendorIds.includes(v.id));
  }, [vendors, selectedVendorIds]);

  const renderVendorCard = (vendor: VendorRecord) => {
    const isSelectedForCompare = selectedVendorIds.includes(vendor.id);
    return (
      <Card
        key={vendor.id}
        variant="default"
        padding="md"
        className={`relative transition-all border ${
          isSelectedForCompare
            ? 'border-[var(--primary)] ring-2 ring-[var(--primary)]/20 shadow-md'
            : 'border-[var(--border)] hover:border-[var(--primary)]/30'
        }`}
      >
        {/* Header row: Checkbox, Name, Category, Price */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <label className="flex items-center cursor-pointer mt-1" title="Select to compare">
              <input
                type="checkbox"
                checked={isSelectedForCompare}
                onChange={() => handleToggleSelectVendor(vendor.id)}
                className="w-4 h-4 rounded text-[var(--primary)] focus:ring-[var(--primary)] cursor-pointer"
                aria-label={`Select ${vendor.business_name} to compare`}
              />
            </label>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-display font-bold text-base text-[var(--text-primary)]">
                  {vendor.business_name}
                </h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-[var(--surface-elevated)] text-[var(--text-secondary)] border border-[var(--border)]">
                  {VENDOR_CATEGORY_LABELS[vendor.category] || vendor.category}
                </span>
              </div>

              {/* User Rating */}
              <div className="flex items-center gap-1 mt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-3.5 h-3.5 ${
                      (vendor.rating || 0) >= star
                        ? 'fill-[var(--accent)] text-[var(--accent)]'
                        : 'text-[var(--border)]'
                    }`}
                  />
                ))}
                <span className="text-[11px] font-bold text-[var(--text-secondary)] ml-1">
                  {vendor.rating ? `${vendor.rating.toFixed(1)} / 5.0` : 'Unrated'}
                </span>
              </div>
            </div>
          </div>

          {/* Quoted Price */}
          <div className="text-right">
            <div className="text-[10px] text-[var(--text-secondary)] font-semibold uppercase">Quoted Fee</div>
            <div className="font-display font-bold text-lg text-[var(--primary)]">
              {formatCurrency(vendor.quoted_price, vendor.currency || 'INR')}
            </div>
          </div>
        </div>

        {/* Badges: Selection & Availability */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <span
            className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${getStatusBadgeVariant(
              vendor.selection_status
            )}`}
          >
            {VENDOR_SELECTION_LABELS[vendor.selection_status] || vendor.selection_status}
          </span>

          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
              vendor.availability_status === 'available'
                ? 'bg-[var(--success-light)] text-[var(--success)] border-[var(--success)]/20'
                : vendor.availability_status === 'tentative'
                ? 'bg-[var(--warning-light)] text-[var(--warning)] border-[var(--warning)]/20'
                : 'bg-[var(--surface-elevated)] text-[var(--text-secondary)] border-[var(--border)]'
            }`}
          >
            Availability: {vendor.availability_status}
          </span>

          {vendor.follow_up_date && (
            <span className="text-[10px] font-medium text-[var(--text-secondary)] flex items-center gap-1">
              <Calendar className="w-3 h-3 text-[var(--accent)]" />
              Follow-up: {formatDate(vendor.follow_up_date)}
            </span>
          )}
        </div>

        {/* Quotation Details / Package summary */}
        {vendor.quotation_details && (
          <div className="mt-3 p-2.5 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] text-xs text-[var(--text-primary)]">
            <div className="flex items-center gap-1 text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
              <FileText className="w-3 h-3 text-[var(--primary)]" />
              Quotation Inclusions &amp; Scope
            </div>
            <p className="leading-relaxed line-clamp-2">{vendor.quotation_details}</p>
          </div>
        )}

        {/* Comparison notes */}
        {vendor.comparison_notes && (
          <p className="mt-2 text-xs text-[var(--text-secondary)] italic">
            Note: "{vendor.comparison_notes}"
          </p>
        )}

        {/* Contact info row */}
        <div className="mt-3 pt-3 border-t border-[var(--border)] flex items-center justify-between gap-2 flex-wrap text-xs">
          <div className="flex items-center gap-3 text-[var(--text-secondary)] flex-wrap">
            {vendor.contact_phone && (
              <a
                href={`tel:${vendor.contact_phone}`}
                className="flex items-center gap-1 hover:text-[var(--primary)] transition-colors"
                title={vendor.contact_phone}
              >
                <Phone className="w-3 h-3 text-[var(--primary)]" />
                <span>{vendor.contact_phone}</span>
              </a>
            )}
            {vendor.contact_email && (
              <a
                href={`mailto:${vendor.contact_email}`}
                className="flex items-center gap-1 hover:text-[var(--primary)] transition-colors"
                title={vendor.contact_email}
              >
                <Mail className="w-3 h-3 text-[var(--primary)]" />
                <span className="truncate max-w-[140px]">{vendor.contact_email}</span>
              </a>
            )}
            {vendor.website && (
              <a
                href={vendor.website.startsWith('http') ? vendor.website : `https://${vendor.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[var(--primary)] hover:underline"
              >
                <Globe className="w-3 h-3" />
                <span>Site</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 ml-auto">
            {/* Status quick select */}
            <select
              value={vendor.selection_status}
              onChange={(e) => handleQuickStatusChange(vendor, e.target.value as VendorSelectionStatus)}
              className="px-2 py-1 rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] text-[11px] font-semibold text-[var(--text-primary)] outline-none cursor-pointer"
              aria-label={`Change vendor status for ${vendor.business_name}`}
            >
              <option value="shortlisted">Shortlist</option>
              <option value="contacted">Contacted</option>
              <option value="selected">Select</option>
              <option value="booked">Confirm Booking</option>
              <option value="rejected">Reject</option>
            </select>

            <button
              type="button"
              onClick={() => handleOpenEdit(vendor)}
              className="p-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors cursor-pointer"
              title="Edit vendor details"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setVendorToDelete(vendor)}
              className="p-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--danger)]/10 text-[var(--text-secondary)] hover:text-[var(--danger)] transition-colors cursor-pointer"
              title="Delete vendor"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* ───────────────────────────────────────────────────────────────────────
          HEADER & CELEBRATION SELECTOR
          ─────────────────────────────────────────────────────────────────────── */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-soft flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center shadow-xs">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display font-bold text-xl sm:text-2xl text-[var(--text-primary)]">
                Vendor Matchboard
              </h2>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30">
                Directory &amp; Quotes
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Organize venues, caterers, photographers, compare quotations, and generate targeted interview questions.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {events.length > 0 && (
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="px-3.5 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] text-xs font-semibold text-[var(--text-primary)] outline-none cursor-pointer focus:ring-2 focus:ring-[var(--primary)]/20"
              aria-label="Select celebration for vendor board"
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
            Add Vendor
          </Button>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────────────
          METRICS & PIPELINE SUMMARY
          ─────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card variant="default" padding="sm" className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
              Total Quoted Value
            </span>
            <Store className="w-3.5 h-3.5 text-[var(--primary)]" />
          </div>
          <div className="font-display font-bold text-xl text-[var(--text-primary)]">
            {formatCurrency(totalQuotedAmount, activeEvent?.plan_data?.currency || 'INR')}
          </div>
          <span className="text-[10px] text-[var(--text-secondary)] block">
            Across {vendors.length} vendor options
          </span>
        </Card>

        <Card variant="default" padding="sm" className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
              Selected &amp; Booked
            </span>
            <CheckCircle2 className="w-3.5 h-3.5 text-[var(--success)]" />
          </div>
          <div className="font-display font-bold text-xl text-[var(--success)]">
            {formatCurrency(bookedAmount, activeEvent?.plan_data?.currency || 'INR')}
          </div>
          <span className="text-[10px] text-[var(--text-secondary)] block">
            {vendors.filter((v) => v.selection_status === 'booked' || v.selection_status === 'selected').length} chosen partners
          </span>
        </Card>

        <Card variant="default" padding="sm" className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
              Categories Covered
            </span>
            <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
          </div>
          <div className="font-display font-bold text-xl text-[var(--text-primary)]">
            {Object.keys(categoryCounts).length} / 9
          </div>
          <span className="text-[10px] text-[var(--text-secondary)] block">
            Event service disciplines
          </span>
        </Card>

        <Card variant="default" padding="sm" className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
              Selected for Compare
            </span>
            <Scale className="w-3.5 h-3.5 text-[var(--warning)]" />
          </div>
          <div className="font-display font-bold text-xl text-[var(--text-primary)]">
            {selectedVendorIds.length}
          </div>
          <span className="text-[10px] text-[var(--text-secondary)] block">
            {selectedVendorIds.length >= 2 ? 'Ready to compare quotes' : 'Select >= 2 to compare'}
          </span>
        </Card>
      </div>

      {/* ───────────────────────────────────────────────────────────────────────
          CATEGORY PILLS & COMPARISON BAR
          ─────────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-[var(--surface)] border border-[var(--border)]">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none flex-1">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap ${
              selectedCategory === 'all'
                ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-xs'
                : 'bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)] hover:bg-[var(--surface-elevated)]'
            }`}
          >
            All Categories ({vendors.length})
          </button>
          {ALL_CATEGORIES.map((cat) => {
            const count = categoryCounts[cat] || 0;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  selectedCategory === cat
                    ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-xs'
                    : 'bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)] hover:bg-[var(--surface-elevated)]'
                }`}
              >
                <span>{VENDOR_CATEGORY_LABELS[cat]}</span>
                {count > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      selectedCategory === cat ? 'bg-white/20 text-white' : 'bg-[var(--surface-elevated)] text-[var(--text-secondary)]'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Action to Compare */}
        {selectedVendorIds.length >= 2 && (
          <Button
            type="button"
            variant="accent"
            size="sm"
            onClick={handleRunComparison}
            leftIcon={<Sparkles className="w-3.5 h-3.5" />}
            className="animate-pulse whitespace-nowrap shadow-md"
          >
            Compare {selectedVendorIds.length} Quotes
          </Button>
        )}
      </div>

      {/* ───────────────────────────────────────────────────────────────────────
          SEARCH & FILTER TOOLBAR
          ─────────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-[var(--surface)] border border-[var(--border)]">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
          <input
            type="text"
            placeholder="Search business name, quotation notes, contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)] outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
          />
        </div>

        {/* Filters & Sorting */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] text-xs font-semibold text-[var(--text-primary)] outline-none cursor-pointer"
              aria-label="Filter by selection status"
            >
              <option value="all">All Selection Statuses</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="contacted">Contacted</option>
              <option value="selected">Selected</option>
              <option value="booked">Confirmed Booking</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <select
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] text-xs font-semibold text-[var(--text-primary)] outline-none cursor-pointer"
              aria-label="Filter by availability status"
            >
              <option value="all">All Availability</option>
              <option value="available">Available</option>
              <option value="tentative">Tentative</option>
              <option value="unavailable">Unavailable</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] text-xs font-semibold text-[var(--text-primary)] outline-none cursor-pointer"
              aria-label="Sort vendors"
            >
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating_desc">Highest Rated</option>
              <option value="name_asc">Name: A to Z</option>
            </select>
          </div>

          {/* Desktop View Switcher */}
          <div className="hidden md:flex items-center p-0.5 rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] ml-auto">
            <button
              type="button"
              onClick={() => setDesktopViewMode('table')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                desktopViewMode === 'table'
                  ? 'bg-[var(--primary)] text-white shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
              title="Accessible Table View"
            >
              <Table className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
            <button
              type="button"
              onClick={() => setDesktopViewMode('cards')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                desktopViewMode === 'cards'
                  ? 'bg-[var(--primary)] text-white shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
              title="Card Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Cards</span>
            </button>
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────────────
          VENDOR LIST / GRID
          ─────────────────────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="py-12 text-center text-xs text-[var(--text-secondary)]">
          Loading vendor matchboard...
        </div>
      ) : filteredVendors.length > 0 ? (
        <div className="space-y-4">
          {/* Desktop Accessible Table (Default on desktop) */}
          {desktopViewMode === 'table' && (
            <div className="hidden md:block overflow-x-auto border border-[var(--border)] rounded-2xl bg-[var(--surface)] shadow-card">
              <table className="w-full text-left text-xs" aria-label="Vendor Matchboard Directory">
                <thead className="bg-[var(--surface-elevated)] border-b border-[var(--border)] text-[var(--text-secondary)] font-semibold">
                  <tr>
                    <th scope="col" className="p-3.5 w-10 text-center">Compare</th>
                    <th scope="col" className="p-3.5">Vendor &amp; Category</th>
                    <th scope="col" className="p-3.5">Quoted Fee</th>
                    <th scope="col" className="p-3.5">Selection Status</th>
                    <th scope="col" className="p-3.5">Availability</th>
                    <th scope="col" className="p-3.5">Rating</th>
                    <th scope="col" className="p-3.5">Contact &amp; Web</th>
                    <th scope="col" className="p-3.5">Follow-up / Scope</th>
                    <th scope="col" className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {filteredVendors.map((vendor) => {
                    const isSelectedForCompare = selectedVendorIds.includes(vendor.id);
                    return (
                      <tr
                        key={vendor.id}
                        className={`hover:bg-[var(--surface-elevated)]/40 transition-colors ${
                          isSelectedForCompare ? 'bg-[var(--primary-light)]/10' : ''
                        }`}
                      >
                        {/* Compare checkbox */}
                        <td className="p-3.5 text-center">
                          <input
                            type="checkbox"
                            checked={isSelectedForCompare}
                            onChange={() => handleToggleSelectVendor(vendor.id)}
                            className="w-4 h-4 rounded text-[var(--primary)] focus:ring-[var(--primary)] cursor-pointer"
                            aria-label={`Select ${vendor.business_name} to compare`}
                          />
                        </td>

                        {/* Vendor Name & Category */}
                        <td className="p-3.5">
                          <div className="font-bold text-[var(--text-primary)] text-sm">
                            {vendor.business_name}
                          </div>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-[var(--surface-elevated)] text-[var(--text-secondary)] border border-[var(--border)] inline-block mt-0.5">
                            {VENDOR_CATEGORY_LABELS[vendor.category] || vendor.category}
                          </span>
                        </td>

                        {/* Quoted Price */}
                        <td className="p-3.5">
                          <span className="font-display font-bold text-sm text-[var(--primary)]">
                            {formatCurrency(vendor.quoted_price, vendor.currency || 'INR')}
                          </span>
                        </td>

                        {/* Selection Status Dropdown */}
                        <td className="p-3.5">
                          <select
                            value={vendor.selection_status}
                            onChange={(e) => handleQuickStatusChange(vendor, e.target.value as VendorSelectionStatus)}
                            className={`px-2.5 py-1 rounded-full text-xs font-semibold border outline-none cursor-pointer ${getStatusBadgeVariant(
                              vendor.selection_status
                            )}`}
                            aria-label={`Change status for ${vendor.business_name}`}
                          >
                            <option value="shortlisted">Shortlisted</option>
                            <option value="contacted">Contacted</option>
                            <option value="selected">Selected</option>
                            <option value="booked">Confirm Booking</option>
                            <option value="rejected">Rejected</option>
                          </select>
                        </td>

                        {/* Availability */}
                        <td className="p-3.5">
                          <span
                            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                              vendor.availability_status === 'available'
                                ? 'bg-[var(--success-light)] text-[var(--success)] border-[var(--success)]/20'
                                : vendor.availability_status === 'tentative'
                                ? 'bg-[var(--warning-light)] text-[var(--warning)] border-[var(--warning)]/20'
                                : 'bg-[var(--surface-elevated)] text-[var(--text-secondary)] border-[var(--border)]'
                            }`}
                          >
                            {vendor.availability_status}
                          </span>
                        </td>

                        {/* Rating */}
                        <td className="p-3.5">
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-3 h-3 ${
                                  (vendor.rating || 0) >= star
                                    ? 'fill-[var(--accent)] text-[var(--accent)]'
                                    : 'text-[var(--border)]'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-[10px] text-[var(--text-secondary)] font-bold">
                            {vendor.rating ? `${vendor.rating.toFixed(1)} / 5.0` : 'Unrated'}
                          </span>
                        </td>

                        {/* Contact Info */}
                        <td className="p-3.5 text-xs text-[var(--text-secondary)]">
                          <div className="space-y-0.5">
                            {vendor.contact_phone && (
                              <a href={`tel:${vendor.contact_phone}`} className="flex items-center gap-1 hover:text-[var(--primary)] transition-colors">
                                <Phone className="w-3 h-3 text-[var(--primary)]" />
                                <span>{vendor.contact_phone}</span>
                              </a>
                            )}
                            {vendor.contact_email && (
                              <a href={`mailto:${vendor.contact_email}`} className="flex items-center gap-1 hover:text-[var(--primary)] transition-colors">
                                <Mail className="w-3 h-3 text-[var(--primary)]" />
                                <span className="truncate max-w-[120px]">{vendor.contact_email}</span>
                              </a>
                            )}
                            {vendor.website && (
                              <a
                                href={vendor.website.startsWith('http') ? vendor.website : `https://${vendor.website}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-[var(--primary)] hover:underline"
                              >
                                <Globe className="w-3 h-3" />
                                <span>Site</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                            {!vendor.contact_phone && !vendor.contact_email && !vendor.website && (
                              <span className="text-[10px] italic">No contact details</span>
                            )}
                          </div>
                        </td>

                        {/* Follow-up / Quotation notes */}
                        <td className="p-3.5 text-xs text-[var(--text-secondary)] max-w-xs">
                          {vendor.follow_up_date && (
                            <div className="text-[10px] text-[var(--accent)] font-semibold flex items-center gap-1 mb-0.5">
                              <Calendar className="w-3 h-3" />
                              <span>Due: {formatDate(vendor.follow_up_date)}</span>
                            </div>
                          )}
                          {vendor.quotation_details && (
                            <p className="text-[11px] text-[var(--text-primary)] truncate max-w-[160px]" title={vendor.quotation_details}>
                              {vendor.quotation_details}
                            </p>
                          )}
                          {vendor.notes && (
                            <p className="text-[10px] italic truncate max-w-[160px]" title={vendor.notes}>
                              "{vendor.notes}"
                            </p>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(vendor)}
                              className="p-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors cursor-pointer"
                              title="Edit vendor details"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setVendorToDelete(vendor)}
                              className="p-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--danger)]/10 text-[var(--text-secondary)] hover:text-[var(--danger)] transition-colors cursor-pointer"
                              title="Delete vendor"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Desktop Grid Cards (Active when user chooses Cards) */}
          {desktopViewMode === 'cards' && (
            <div className="hidden md:grid md:grid-cols-2 gap-4">
              {filteredVendors.map((vendor) => renderVendorCard(vendor))}
            </div>
          )}

          {/* Mobile Compact Cards (Always active on mobile screens) */}
          <div className="md:hidden space-y-3">
            {filteredVendors.map((vendor) => renderVendorCard(vendor))}
          </div>
        </div>
      ) : (
        <Card variant="default" padding="lg" className="text-center py-12 space-y-3">
          <Store className="w-12 h-12 text-[var(--text-secondary)] mx-auto opacity-50" />
          <h3 className="font-display font-bold text-lg text-[var(--text-primary)]">
            No Vendors Found
          </h3>
          <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto">
            {searchQuery || selectedCategory !== 'all' || statusFilter !== 'all'
              ? 'No vendors match your search filters. Try clearing queries or switching categories.'
              : 'Start building your vendor pipeline. Add caterers, venues, decorators, or photographers to organize quotes.'}
          </p>
          <Button variant="primary" size="sm" onClick={handleOpenAdd} leftIcon={<Plus className="w-4 h-4" />}>
            Add First Vendor
          </Button>
        </Card>
      )}

      {/* ───────────────────────────────────────────────────────────────────────
          MODAL 1: ADD / EDIT VENDOR DIALOG
          ─────────────────────────────────────────────────────────────────────── */}
      {isAddEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 w-full max-w-xl shadow-xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <div>
                <h3 className="font-display font-bold text-lg text-[var(--text-primary)]">
                  {editingVendor ? 'Edit Vendor Record' : 'Add New Vendor'}
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  Enter quotation details, availability status, user ratings, and notes
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

            <form onSubmit={handleSaveVendor} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-primary)]">Business Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.business_name}
                    onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                    placeholder="e.g. Royal Banquet Studio"
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] text-xs text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-primary)]">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as VendorCategory })}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] text-xs font-semibold text-[var(--text-primary)] outline-none"
                  >
                    {ALL_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {VENDOR_CATEGORY_LABELS[cat]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-primary)]">Quoted Price</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={formData.quoted_price}
                    onChange={(e) => setFormData({ ...formData, quoted_price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] text-xs text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-primary)]">Availability</label>
                  <select
                    value={formData.availability_status}
                    onChange={(e) => setFormData({ ...formData, availability_status: e.target.value as VendorAvailability })}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] text-xs font-semibold text-[var(--text-primary)] outline-none"
                  >
                    <option value="available">Available</option>
                    <option value="tentative">Tentative</option>
                    <option value="unavailable">Unavailable</option>
                    <option value="unknown">Unknown</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-primary)]">Selection Status</label>
                  <select
                    value={formData.selection_status}
                    onChange={(e) => setFormData({ ...formData, selection_status: e.target.value as VendorSelectionStatus })}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] text-xs font-semibold text-[var(--text-primary)] outline-none"
                  >
                    <option value="shortlisted">Shortlisted</option>
                    <option value="contacted">Contacted</option>
                    <option value="selected">Selected</option>
                    <option value="booked">Confirmed Booking</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>

              {/* Contact Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-primary)]">Contact Name</label>
                  <input
                    type="text"
                    value={formData.contact_name}
                    onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                    placeholder="e.g. Chef Arvind"
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] text-xs text-[var(--text-primary)] outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-primary)]">Phone Number</label>
                  <input
                    type="text"
                    value={formData.contact_phone}
                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                    placeholder="+91 98450 12345"
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] text-xs text-[var(--text-primary)] outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-primary)]">Email</label>
                  <input
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                    placeholder="info@vendor.com"
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] text-xs text-[var(--text-primary)] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-primary)]">Website</label>
                  <input
                    type="text"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] text-xs text-[var(--text-primary)] outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-primary)]">User Rating (1 - 5 Stars)</label>
                  <div className="flex items-center gap-1 py-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFormData({ ...formData, rating: star })}
                        className="p-1 hover:scale-110 transition-transform"
                      >
                        <Star
                          className={`w-5 h-5 ${
                            formData.rating >= star
                              ? 'fill-[var(--accent)] text-[var(--accent)]'
                              : 'text-[var(--border)]'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-primary)]">Follow-up Date</label>
                  <input
                    type="date"
                    value={formData.follow_up_date}
                    onChange={(e) => setFormData({ ...formData, follow_up_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] text-xs text-[var(--text-primary)] outline-none"
                  />
                </div>
              </div>

              {/* Quotation Details */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-primary)]">
                  Quotation Details &amp; Scope Inclusions
                </label>
                <textarea
                  rows={2}
                  value={formData.quotation_details}
                  onChange={(e) => setFormData({ ...formData, quotation_details: e.target.value })}
                  placeholder="e.g. Includes 120 pax buffet, bone china crockery, mocktail bar, 2 live cooking stations."
                  className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] text-xs text-[var(--text-primary)] outline-none"
                />
              </div>

              {/* Comparison Notes */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-primary)]">
                  Comparison Notes &amp; Observations
                </label>
                <textarea
                  rows={2}
                  value={formData.comparison_notes}
                  onChange={(e) => setFormData({ ...formData, comparison_notes: e.target.value })}
                  placeholder="e.g. Quoted Rs 20k less than Royal Feast, but doesn't include live dessert counter."
                  className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] text-xs text-[var(--text-primary)] outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border)]">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsAddEditOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  {editingVendor ? 'Save Changes' : 'Add to Matchboard'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────
          MODAL 2: AI VENDOR QUOTATION COMPARISON & INTERVIEW QUESTIONS
          ─────────────────────────────────────────────────────────────────────── */}
      {isCompareOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 w-full max-w-3xl shadow-xl space-y-5 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-[var(--text-primary)]">
                    AI Quotation Comparison &amp; Interview Guide
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Objective side-by-side analysis synthesized strictly from your recorded quotes
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCompareOpen(false)}
                className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--surface-elevated)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isComparing ? (
              <div className="py-12 text-center text-xs text-[var(--text-secondary)] space-y-2">
                <Sparkles className="w-6 h-6 animate-spin mx-auto text-[var(--primary)]" />
                <p>Synthesizing quotation variances and targeted interview questions...</p>
              </div>
            ) : comparisonAnalysis ? (
              <div className="space-y-4 text-xs">
                {/* Summary & Price Differential */}
                <div className="p-4 rounded-2xl bg-[var(--primary-light)]/40 border border-[var(--primary)]/20 space-y-2">
                  <div className="font-semibold text-[var(--primary)] text-sm">
                    {comparisonAnalysis.summary}
                  </div>
                  <div className="font-bold text-[var(--text-primary)]">
                    {comparisonAnalysis.price_comparison}
                  </div>
                </div>

                {/* Side-by-side specs table */}
                <div className="overflow-x-auto border border-[var(--border)] rounded-2xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[var(--surface-elevated)] border-b border-[var(--border)] text-[var(--text-secondary)] font-semibold">
                      <tr>
                        <th className="p-3">Vendor</th>
                        <th className="p-3">Quoted Fee</th>
                        <th className="p-3">User Rating</th>
                        <th className="p-3">Availability</th>
                        <th className="p-3">Scope &amp; Inclusions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {selectedVendorsForModal.map((v) => (
                        <tr key={v.id} className="hover:bg-[var(--surface-elevated)]/50">
                          <td className="p-3 font-bold text-[var(--text-primary)]">
                            {v.business_name}
                          </td>
                          <td className="p-3 font-semibold text-[var(--primary)]">
                            {formatCurrency(v.quoted_price, v.currency || 'INR')}
                          </td>
                          <td className="p-3 text-[var(--accent)] font-semibold">
                            ★ {v.rating ? v.rating.toFixed(1) : 'Unrated'}
                          </td>
                          <td className="p-3">
                            <span className="capitalize">{v.availability_status}</span>
                          </td>
                          <td className="p-3 max-w-xs text-[var(--text-secondary)]">
                            {v.quotation_details || 'No scope details logged'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Suggested Interview Questions */}
                <div className="space-y-2">
                  <h4 className="font-display font-bold text-sm text-[var(--text-primary)] flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[var(--success)]" />
                    Essential Questions to Ask Vendors Before Signing
                  </h4>
                  <ul className="space-y-1.5 pl-1">
                    {comparisonAnalysis.suggested_interview_questions.map((q, idx) => (
                      <li
                        key={idx}
                        className="p-2.5 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--text-primary)] flex items-start gap-2"
                      >
                        <span className="w-4 h-4 rounded-full bg-[var(--primary)] text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="leading-relaxed">{q}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Negotiation Guidance */}
                {comparisonAnalysis.negotiation_tips.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-display font-bold text-sm text-[var(--text-primary)] flex items-center gap-1.5">
                      <Scale className="w-4 h-4 text-[var(--accent)]" />
                      Practical Negotiation &amp; Contract Tips
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {comparisonAnalysis.negotiation_tips.map((tip, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--text-secondary)] leading-relaxed"
                        >
                          {tip}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Transparency Disclaimer */}
                <div className="p-3 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] text-[11px] text-[var(--text-secondary)] flex items-start gap-2">
                  <Info className="w-4 h-4 text-[var(--accent)] shrink-0 mt-0.5" />
                  <span>
                    <strong>Verification Guarantee:</strong> {comparisonAnalysis.disclaimer} Never confirm a contract or pay advances without obtaining an itemized written agreement.
                  </span>
                </div>
              </div>
            ) : null}

            <div className="flex justify-end pt-3 border-t border-[var(--border)]">
              <Button variant="primary" size="sm" onClick={() => setIsCompareOpen(false)}>
                Done Reviewing
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────
          MODAL 3: CONFIRM BOOKING DIALOG (Rule: Never book without explicit confirmation)
          ─────────────────────────────────────────────────────────────────────── */}
      {bookingConfirmationVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 w-full max-w-md shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[var(--primary)]/15 text-[var(--primary)] flex items-center justify-center">
                <Check className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-[var(--text-primary)]">
                  Confirm Official Booking
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  Record confirmed partner booking in your plan
                </p>
              </div>
            </div>

            <p className="text-xs text-[var(--text-primary)] leading-relaxed">
              Are you sure you want to mark{' '}
              <strong>{bookingConfirmationVendor.business_name}</strong> as your confirmed booking for{' '}
              <strong>{VENDOR_CATEGORY_LABELS[bookingConfirmationVendor.category]}</strong> at{' '}
              <strong>
                {formatCurrency(
                  bookingConfirmationVendor.quoted_price,
                  bookingConfirmationVendor.currency || 'INR'
                )}
              </strong>
              ?
            </p>

            <div className="p-3 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] text-[11px] text-[var(--text-secondary)]">
              Festiva AI requires your explicit confirmation before locking a vendor into your budget commitment ledger.
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBookingConfirmationVendor(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmBooking}
              >
                Confirm Booking
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────
          MODAL 4: DELETE CONFIRMATION DIALOG
          ─────────────────────────────────────────────────────────────────────── */}
      {vendorToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 w-full max-w-md shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[var(--danger)]/15 text-[var(--danger)] flex items-center justify-center">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-[var(--text-primary)]">
                  Remove Vendor
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  Delete vendor from your celebration matchboard
                </p>
              </div>
            </div>

            <p className="text-xs text-[var(--text-primary)] leading-relaxed">
              Are you sure you want to remove <strong>{vendorToDelete.business_name}</strong>? This action will delete their quotation records from this celebration.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setVendorToDelete(null)}>
                Cancel
              </Button>
              <Button variant="danger" size="sm" onClick={handleDeleteVendor}>
                Remove Vendor
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
