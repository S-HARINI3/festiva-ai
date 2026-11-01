import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Palette,
  Check,
  Sparkles,
  Copy,
  Plus,
  Trash2,
  Edit3,
  Download,
  Printer,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  ArrowRight,
  Sliders,
  Image as ImageIcon,
  CheckCircle2,
  Upload,
  Layers,
  Sparkle,
  Eye,
  FileText,
  DollarSign,
  TrendingDown,
  Info,
  RefreshCw,
} from 'lucide-react';
import type {
  SavedEvent,
  MoodboardRecord,
  EventConceptComparisonItem,
} from '../../types/events';
import {
  Card,
  Button,
  Badge,
  Dialog,
  useToast,
  EmptyState,
} from '../ui';
import { formatCurrency, formatDate } from '../../utils/helpers';
import {
  getEventMoodboards,
  createMoodboard,
  updateMoodboard,
  deleteMoodboard,
  duplicateMoodboard,
  getConceptComparison,
  generateConceptComparison,
  adoptConcept,
} from '../../services/api';

// Coordinated color palette presets by theme keyword
const PRESET_PALETTES: Record<string, string[]> = {
  royal: ['#713B70', '#4A1E49', '#D8B477', '#E9DDF3', '#FAF8F5'],
  heritage: ['#8C2D19', '#D8B477', '#F4E8C1', '#3E1E16', '#FAF8F5'],
  rustic: ['#8C5835', '#C89D7C', '#5C6B52', '#E8D8C8', '#FAF8F5'],
  bohemian: ['#D97D54', '#E8A87C', '#7C9082', '#F6EDE2', '#2B3A42'],
  minimalist: ['#26232B', '#77717D', '#D1CCD6', '#E9E3E8', '#FFFFFF'],
  cyberpunk: ['#00F0FF', '#FF007F', '#7928CA', '#17141D', '#0A0612'],
  botanical: ['#2D5A43', '#5C8C71', '#D8B477', '#EAF2EC', '#FAF8F5'],
  sunset: ['#D85A38', '#E69138', '#D8B477', '#713B70', '#FAF8F5'],
  celestial: ['#1A2238', '#4A5874', '#D8B477', '#E9DDF3', '#0F1424'],
  default: ['#713B70', '#E9DDF3', '#D8B477', '#26232B', '#FAF8F5'],
};

function getCoordinatedPalette(themeName: string): string[] {
  const norm = (themeName || '').toLowerCase();
  for (const [key, palette] of Object.entries(PRESET_PALETTES)) {
    if (key !== 'default' && norm.includes(key)) {
      return [...palette];
    }
  }
  if (norm.includes('traditional') || norm.includes('luxury') || norm.includes('gold')) {
    return [...PRESET_PALETTES.royal];
  }
  if (norm.includes('garden') || norm.includes('floral') || norm.includes('spring')) {
    return [...PRESET_PALETTES.botanical];
  }
  if (norm.includes('modern') || norm.includes('contemporary')) {
    return [...PRESET_PALETTES.minimalist];
  }
  return [...PRESET_PALETTES.default];
}

interface MoodboardsViewProps {
  events: SavedEvent[];
  selectedEventId?: string;
  onEventUpdated?: () => void;
}

export default function MoodboardsView({
  events,
  selectedEventId,
  onEventUpdated,
}: MoodboardsViewProps) {
  const { success, error, info } = useToast();

  // Active top-level subtab: 'studio' | 'comparison'
  const [activeSubTab, setActiveSubTab] = useState<'studio' | 'comparison'>('studio');

  // Active event selection
  const [activeEventId, setActiveEventId] = useState<string>(() => {
    if (selectedEventId && selectedEventId !== 'all') return selectedEventId;
    return events[0]?.id || '';
  });

  useEffect(() => {
    if (selectedEventId && selectedEventId !== 'all') {
      setActiveEventId(selectedEventId);
    }
  }, [selectedEventId]);

  const activeEvent = useMemo(() => {
    return events.find((e) => e.id === activeEventId) || events[0] || null;
  }, [events, activeEventId]);

  // ══════════════════════════════════════════════════════════════════════════════
  // 1. MOODBOARD STUDIO STATE
  // ══════════════════════════════════════════════════════════════════════════════
  const [moodboards, setMoodboards] = useState<MoodboardRecord[]>([]);
  const [activeMoodboardId, setActiveMoodboardId] = useState<string>('');
  const [isLoadingMoodboards, setIsLoadingMoodboards] = useState<boolean>(false);
  const [isSavingMoodboard, setIsSavingMoodboard] = useState<boolean>(false);
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  // Modals for Moodboard Management
  const [isNewMoodboardOpen, setIsNewMoodboardOpen] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [newBoardTheme, setNewBoardTheme] = useState('');

  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [renameInput, setRenameInput] = useState('');

  const [isDuplicateOpen, setIsDuplicateOpen] = useState(false);
  const [duplicateInput, setDuplicateInput] = useState('');

  // Editing items / notes
  const [newNoteInput, setNewNoteInput] = useState('');
  const [activeSectionEdit, setActiveSectionEdit] = useState<string | null>(null);
  const [newSectionItemText, setNewSectionItemText] = useState('');

  // Hidden file input for image uploads
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // ══════════════════════════════════════════════════════════════════════════════
  // 2. EVENT PLAN CONCEPT COMPARISON STATE
  // ══════════════════════════════════════════════════════════════════════════════
  const [concepts, setConcepts] = useState<EventConceptComparisonItem[]>([]);
  const [isLoadingConcepts, setIsLoadingConcepts] = useState<boolean>(false);
  const [isGeneratingConcepts, setIsGeneratingConcepts] = useState<boolean>(false);
  const [customInstructions, setCustomInstructions] = useState<string>('');
  const [comparisonLayout, setComparisonLayout] = useState<'side-by-side' | 'stacked'>('side-by-side');

  // Safe Concept Adoption Modal
  const [conceptToAdopt, setConceptToAdopt] = useState<EventConceptComparisonItem | null>(null);
  const [adoptConfirmed, setAdoptConfirmed] = useState<boolean>(false);
  const [isAdopting, setIsAdopting] = useState<boolean>(false);

  // ── Fetch Moodboards for Active Event ──────────────────────────────────────
  const fetchMoodboards = async (eventId: string) => {
    if (!eventId) return;
    setIsLoadingMoodboards(true);
    try {
      const res = await getEventMoodboards(eventId);
      if (res.success && res.moodboards) {
        setMoodboards(res.moodboards);
        if (res.moodboards.length > 0) {
          setActiveMoodboardId((prev) => {
            const exists = res.moodboards.some((b) => b.id === prev);
            return exists ? prev : res.moodboards[0].id;
          });
        } else {
          setActiveMoodboardId('');
        }
      }
    } catch (err: any) {
      console.warn('Failed to load moodboards from backend:', err);
      // Fallback from activeEvent's plan_data if available
      const local = (activeEvent?.plan_data?.moodboards as MoodboardRecord[]) || [];
      setMoodboards(local);
      if (local.length > 0) setActiveMoodboardId(local[0].id);
    } finally {
      setIsLoadingMoodboards(false);
    }
  };

  // ── Fetch Concepts for Active Event ────────────────────────────────────────
  const fetchConcepts = async (eventId: string) => {
    if (!eventId) return;
    setIsLoadingConcepts(true);
    try {
      const res = await getConceptComparison(eventId);
      if (res && res.concepts) {
        setConcepts(res.concepts);
      }
    } catch (err: any) {
      console.warn('Failed to load concept comparison:', err);
      // Fallback from activeEvent plan_data
      const local = (activeEvent?.plan_data?.concept_comparisons as EventConceptComparisonItem[]) || [];
      setConcepts(local);
    } finally {
      setIsLoadingConcepts(false);
    }
  };

  useEffect(() => {
    if (activeEventId) {
      fetchMoodboards(activeEventId);
      if (activeSubTab === 'comparison') {
        fetchConcepts(activeEventId);
      }
    }
  }, [activeEventId, activeSubTab]);

  // Current active moodboard object
  const activeMoodboard = useMemo(() => {
    return moodboards.find((b) => b.id === activeMoodboardId) || moodboards[0] || null;
  }, [moodboards, activeMoodboardId]);

  // ── Moodboard Actions ──────────────────────────────────────────────────────
  const copyColorToClipboard = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    success(`Copied color swatch ${hex} to clipboard!`);
    setTimeout(() => setCopiedHex(null), 2000);
  };

  const handleUpdateActiveMoodboard = async (updates: Partial<MoodboardRecord>) => {
    if (!activeMoodboard || !activeEventId) return;
    setIsSavingMoodboard(true);
    try {
      const res = await updateMoodboard(activeEventId, activeMoodboard.id, updates);
      if (res.success && res.moodboard) {
        setMoodboards((prev) =>
          prev.map((b) => (b.id === res.moodboard.id ? res.moodboard : b))
        );
        success('Moodboard styling updated.');
      }
    } catch (err: any) {
      error(err.message || 'Failed to save moodboard update.');
    } finally {
      setIsSavingMoodboard(false);
    }
  };

  // Color Palette editing
  const handleColorChange = (index: number, newHex: string) => {
    if (!activeMoodboard) return;
    const nextPalette = [...(activeMoodboard.color_palette || [])];
    nextPalette[index] = newHex;
    handleUpdateActiveMoodboard({ color_palette: nextPalette });
  };

  const handleHarmonizePalette = () => {
    if (!activeMoodboard) return;
    const newPalette = getCoordinatedPalette(activeMoodboard.theme);
    handleUpdateActiveMoodboard({ color_palette: newPalette });
    success('Harmonized color palette generated from theme.');
  };

  const handleAddColor = () => {
    if (!activeMoodboard) return;
    const current = activeMoodboard.color_palette || [];
    if (current.length >= 8) {
      info('Maximum 8 color swatches allowed for a cohesive palette.');
      return;
    }
    const nextPalette = [...current, '#D8B477'];
    handleUpdateActiveMoodboard({ color_palette: nextPalette });
  };

  const handleRemoveColor = (index: number) => {
    if (!activeMoodboard) return;
    const current = activeMoodboard.color_palette || [];
    if (current.length <= 3) {
      info('A minimum of 3 colors is recommended for palette balance.');
      return;
    }
    const nextPalette = current.filter((_, i) => i !== index);
    handleUpdateActiveMoodboard({ color_palette: nextPalette });
  };

  // Add custom inspiration note
  const handleAddNote = () => {
    if (!activeMoodboard || !newNoteInput.trim()) return;
    const updatedNotes = [...(activeMoodboard.inspiration_notes || []), newNoteInput.trim()];
    setNewNoteInput('');
    handleUpdateActiveMoodboard({ inspiration_notes: updatedNotes });
  };

  const handleRemoveNote = (idx: number) => {
    if (!activeMoodboard) return;
    const updatedNotes = (activeMoodboard.inspiration_notes || []).filter((_, i) => i !== idx);
    handleUpdateActiveMoodboard({ inspiration_notes: updatedNotes });
  };

  // Add item to structured sections
  const handleAddSectionItem = (sectionKey: keyof MoodboardRecord) => {
    if (!activeMoodboard || !newSectionItemText.trim()) return;
    const currentList = (activeMoodboard[sectionKey] as string[]) || [];
    const updated = [...currentList, newSectionItemText.trim()];
    setNewSectionItemText('');
    setActiveSectionEdit(null);
    handleUpdateActiveMoodboard({ [sectionKey]: updated });
  };

  const handleRemoveSectionItem = (sectionKey: keyof MoodboardRecord, itemIdx: number) => {
    if (!activeMoodboard) return;
    const currentList = (activeMoodboard[sectionKey] as string[]) || [];
    const updated = currentList.filter((_, i) => i !== itemIdx);
    handleUpdateActiveMoodboard({ [sectionKey]: updated });
  };

  // Reorder items in structured sections
  const handleReorderSectionItem = (
    sectionKey: keyof MoodboardRecord,
    itemIdx: number,
    direction: 'up' | 'down'
  ) => {
    if (!activeMoodboard) return;
    const currentList = [...((activeMoodboard[sectionKey] as string[]) || [])];
    const targetIdx = direction === 'up' ? itemIdx - 1 : itemIdx + 1;
    if (targetIdx < 0 || targetIdx >= currentList.length) return;
    const temp = currentList[itemIdx];
    currentList[itemIdx] = currentList[targetIdx];
    currentList[targetIdx] = temp;
    handleUpdateActiveMoodboard({ [sectionKey]: currentList });
  };

  // Image Upload handler (Base64 data URL)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeMoodboard) return;

    if (!file.type.startsWith('image/')) {
      error('Please select an image file (PNG, JPG, WEBP).');
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      error('Please select an image under 3MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        const currentImages = [...(activeMoodboard.images || []), base64];
        handleUpdateActiveMoodboard({ images: currentImages });
        success('Inspiration image added to moodboard.');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveImage = (imgIdx: number) => {
    if (!activeMoodboard) return;
    const updatedImages = (activeMoodboard.images || []).filter((_, i) => i !== imgIdx);
    handleUpdateActiveMoodboard({ images: updatedImages });
  };

  // Create Moodboard
  const handleCreateMoodboard = async () => {
    if (!activeEventId || !newBoardName.trim()) return;
    const theme = newBoardTheme.trim() || activeEvent?.plan_data?.theme_details?.theme_name || 'Elegance & Celebration';
    const autoPalette = getCoordinatedPalette(theme);

    try {
      const res = await createMoodboard(activeEventId, {
        name: newBoardName.trim(),
        theme,
        color_palette: autoPalette,
        dress_code: 'Celebration formal attire matching theme tone',
        invitation_direction: 'Letterpress foil on heavy cotton cardstock',
        decoration_ideas: ['Suspended botanical installations', 'Warm glowing ambient lamps'],
        venue_styling: ['Curated seating pods with velvet textures'],
        lighting: ['Amber perimeter wash and pinpoint table spots'],
        floral_arrangements: ['Seasonal garden blooms and wild greenery accents'],
        table_styling: ['Textured linens with brushed brass cutlery'],
        food_presentation: ['Plated courses with edible micro-greens garnish'],
        inspiration_notes: ['Ensure cohesive lighting transitions at twilight'],
        images: ['pattern:botanical-gold'],
        items: [],
      });
      if (res.success && res.moodboard) {
        setMoodboards((prev) => [res.moodboard, ...prev]);
        setActiveMoodboardId(res.moodboard.id);
        setIsNewMoodboardOpen(false);
        setNewBoardName('');
        setNewBoardTheme('');
        success(`Created moodboard "${res.moodboard.name}"!`);
      }
    } catch (err: any) {
      error(err.message || 'Failed to create moodboard.');
    }
  };

  // Rename Moodboard
  const handleRenameMoodboard = async () => {
    if (!activeMoodboard || !renameInput.trim()) return;
    await handleUpdateActiveMoodboard({ name: renameInput.trim() });
    setIsRenameOpen(false);
    setRenameInput('');
  };

  // Duplicate Moodboard
  const handleDuplicateMoodboard = async () => {
    if (!activeMoodboard || !activeEventId) return;
    try {
      const res = await duplicateMoodboard(
        activeEventId,
        activeMoodboard.id,
        duplicateInput.trim() || undefined
      );
      if (res.success && res.moodboard) {
        setMoodboards((prev) => [res.moodboard, ...prev]);
        setActiveMoodboardId(res.moodboard.id);
        setIsDuplicateOpen(false);
        setDuplicateInput('');
        success(`Duplicated moodboard as "${res.moodboard.name}"!`);
      }
    } catch (err: any) {
      error(err.message || 'Failed to duplicate moodboard.');
    }
  };

  // Delete Moodboard
  const handleDeleteMoodboard = async () => {
    if (!activeMoodboard || !activeEventId) return;
    if (moodboards.length <= 1) {
      error('Every celebration requires at least one active moodboard.');
      return;
    }
    if (!confirm(`Are you sure you want to delete the moodboard "${activeMoodboard.name}"?`)) {
      return;
    }
    try {
      const res = await deleteMoodboard(activeEventId, activeMoodboard.id);
      if (res.success) {
        const remaining = moodboards.filter((b) => b.id !== activeMoodboard.id);
        setMoodboards(remaining);
        setActiveMoodboardId(remaining[0]?.id || '');
        success('Moodboard deleted.');
      }
    } catch (err: any) {
      error(err.message || 'Failed to delete moodboard.');
    }
  };

  // Export / Print
  const handlePrintMoodboard = () => {
    window.print();
  };

  const handleDownloadMoodboardImage = () => {
    if (!activeMoodboard) return;
    // Build a canvas-rendered moodboard poster
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    ctx.fillStyle = '#FAF8F5';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Header banner
    ctx.fillStyle = '#713B70';
    ctx.fillRect(0, 0, canvas.width, 120);

    // Title
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText(activeMoodboard.name, 50, 60);

    ctx.fillStyle = '#D8B477';
    ctx.font = 'italic 20px sans-serif';
    ctx.fillText(`Theme: ${activeMoodboard.theme} • Festiva AI Studio`, 50, 95);

    // Color Swatches
    const palette = activeMoodboard.color_palette || [];
    const swatchWidth = 180;
    const swatchHeight = 90;
    const startX = 50;
    const startY = 160;

    ctx.fillStyle = '#26232B';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('COLOR HARMONY PALETTE', 50, 150);

    palette.forEach((hex, i) => {
      const x = startX + i * (swatchWidth + 20);
      ctx.fillStyle = hex;
      ctx.beginPath();
      ctx.roundRect(x, startY, swatchWidth, swatchHeight, 12);
      ctx.fill();
      ctx.strokeStyle = '#E9E3E8';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#26232B';
      ctx.font = 'bold 16px monospace';
      ctx.fillText(hex.toUpperCase(), x + 15, startY + swatchHeight + 25);
    });

    // Content summary boxes
    const sections = [
      { title: 'Decoration & Florals', items: [...activeMoodboard.decoration_ideas, ...activeMoodboard.floral_arrangements].slice(0, 3) },
      { title: 'Venue & Lighting', items: [...activeMoodboard.venue_styling, ...activeMoodboard.lighting].slice(0, 3) },
      { title: 'Attire & Table Styling', items: [activeMoodboard.dress_code || 'Formal', ...activeMoodboard.table_styling].slice(0, 3) },
      { title: 'Catering & Food Styling', items: [...activeMoodboard.food_presentation].slice(0, 3) },
    ];

    const boxW = 260;
    const boxH = 340;
    const boxY = 320;

    sections.forEach((sec, idx) => {
      const bx = 50 + idx * (boxW + 20);
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.roundRect(bx, boxY, boxW, boxH, 16);
      ctx.fill();
      ctx.strokeStyle = '#E9E3E8';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#713B70';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText(sec.title, bx + 15, boxY + 35);

      ctx.fillStyle = '#77717D';
      ctx.font = '14px sans-serif';
      let lineY = boxY + 70;
      sec.items.forEach((it) => {
        const words = it.split(' ');
        let currentLine = '• ';
        for (const w of words) {
          if (ctx.measureText(currentLine + w).width > boxW - 30) {
            ctx.fillText(currentLine, bx + 15, lineY);
            currentLine = '  ' + w + ' ';
            lineY += 20;
          } else {
            currentLine += w + ' ';
          }
        }
        ctx.fillText(currentLine, bx + 15, lineY);
        lineY += 28;
      });
    });

    // Footer disclaimer
    ctx.fillStyle = '#77717D';
    ctx.font = '12px sans-serif';
    ctx.fillText('Festiva AI Moodboard Studio • Visual Concept Direction (Non-contractual styling guidance)', 50, 770);

    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${activeMoodboard.name.toLowerCase().replace(/\s+/g, '-')}-moodboard.png`;
    a.click();
    success('Exported moodboard image to downloads!');
  };

  // ══════════════════════════════════════════════════════════════════════════════
  // 3. CONCEPT COMPARISON ACTIONS
  // ══════════════════════════════════════════════════════════════════════════════
  const handleRegenerateConcepts = async () => {
    if (!activeEventId) return;
    setIsGeneratingConcepts(true);
    try {
      const res = await generateConceptComparison(
        activeEventId,
        customInstructions.trim() || undefined
      );
      if (res && res.concepts) {
        setConcepts(res.concepts);
        success('Generated 3 distinct event concepts for side-by-side comparison!');
      }
    } catch (err: any) {
      error(err.message || 'Failed to synthesize concept comparison.');
    } finally {
      setIsGeneratingConcepts(false);
    }
  };

  const handleOpenAdoptModal = (concept: EventConceptComparisonItem) => {
    setConceptToAdopt(concept);
    setAdoptConfirmed(false);
  };

  const handleConfirmAdopt = async () => {
    if (!conceptToAdopt || !activeEventId || !adoptConfirmed) return;
    setIsAdopting(true);
    try {
      const res = await adoptConcept(activeEventId, conceptToAdopt.id, true);
      if (res.success) {
        success(res.message || `Adopted concept "${conceptToAdopt.concept_name}"!`);
        setConceptToAdopt(null);
        setAdoptConfirmed(false);
        // Refresh moodboards and parent dashboard
        fetchMoodboards(activeEventId);
        if (onEventUpdated) onEventUpdated();
      }
    } catch (err: any) {
      error(err.message || 'Failed to adopt concept.');
    } finally {
      setIsAdopting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* ── Subtab Navigation & Global Header ── */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[var(--primary)]/15 text-[var(--primary)] flex items-center justify-center shrink-0">
            {activeSubTab === 'studio' ? <Palette className="w-6 h-6" /> : <Sliders className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display font-bold text-xl text-[var(--text-primary)]">
                {activeSubTab === 'studio' ? 'Moodboard Studio' : 'Event Plan Comparison'}
              </h2>
              <Badge variant="primary">AI Creative Suite</Badge>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              {activeSubTab === 'studio'
                ? 'Design tactile color swatches, venue decor, florals, and export visual styling guidelines'
                : 'Compare up to three tailored event concepts with budget transparency, complexity, and trade-offs'}
            </p>
          </div>
        </div>

        {/* Controls: Event Selector & Subtab Switcher */}
        <div className="flex flex-wrap items-center gap-2.5">
          {events.length > 1 && (
            <div className="relative">
              <select
                value={activeEventId}
                onChange={(e) => setActiveEventId(e.target.value)}
                className="text-xs font-semibold px-3 py-2 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] cursor-pointer pr-8"
              >
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.event_name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[var(--text-secondary)] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          )}

          <div className="flex rounded-xl bg-[var(--surface-elevated)] p-1 border border-[var(--border)]">
            <button
              type="button"
              onClick={() => setActiveSubTab('studio')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'studio'
                  ? 'bg-[var(--primary)] text-white shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              Moodboard Studio
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('comparison')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'comparison'
                  ? 'bg-[var(--primary)] text-white shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              Plan Comparison ({concepts.length || 3})
            </button>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════
          SUBTAB 1: MOODBOARD STUDIO
          ══════════════════════════════════════════════════════════════════════════ */}
      {activeSubTab === 'studio' && (
        <div className="space-y-6">
          {/* Moodboard Selector Bar & Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-[var(--surface)] border border-[var(--border)]">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mr-1">
                Boards ({moodboards.length}):
              </span>
              {moodboards.map((board) => (
                <button
                  key={board.id}
                  type="button"
                  onClick={() => setActiveMoodboardId(board.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border flex items-center gap-1.5 ${
                    activeMoodboardId === board.id
                      ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-xs'
                      : 'bg-[var(--surface-elevated)] text-[var(--text-primary)] border-[var(--border)] hover:border-[var(--primary)]'
                  }`}
                >
                  <Layers className="w-3 h-3" />
                  {board.name}
                </button>
              ))}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsNewMoodboardOpen(true)}
                className="gap-1.5 text-xs py-1.5 h-auto rounded-xl"
              >
                <Plus className="w-3.5 h-3.5" /> New Board
              </Button>
            </div>

            {/* Board Controls */}
            {activeMoodboard && (
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setRenameInput(activeMoodboard.name);
                    setIsRenameOpen(true);
                  }}
                  className="gap-1 text-xs py-1.5 h-auto text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Rename
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setDuplicateInput(`${activeMoodboard.name} (Copy)`);
                    setIsDuplicateOpen(true);
                  }}
                  className="gap-1 text-xs py-1.5 h-auto text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  <Copy className="w-3.5 h-3.5" /> Duplicate
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadMoodboardImage}
                  className="gap-1 text-xs py-1.5 h-auto"
                >
                  <Download className="w-3.5 h-3.5 text-[var(--accent)]" /> Export PNG
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrintMoodboard}
                  className="gap-1 text-xs py-1.5 h-auto"
                >
                  <Printer className="w-3.5 h-3.5 text-[var(--primary)]" /> Print / PDF
                </Button>

                {moodboards.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDeleteMoodboard}
                    className="gap-1 text-xs py-1.5 h-auto text-[var(--danger)] hover:bg-[var(--danger)]/10"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            )}
          </div>

          {isLoadingMoodboards ? (
            <div className="p-12 text-center text-[var(--text-secondary)] space-y-3">
              <RefreshCw className="w-8 h-8 mx-auto animate-spin text-[var(--primary)]" />
              <p className="text-sm font-semibold">Loading celebration moodboards...</p>
            </div>
          ) : activeMoodboard ? (
            <div className="space-y-6">
              {/* 1. HERO PALETTE & THEME HEADER */}
              <Card variant="default" padding="lg" className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-[var(--primary)] uppercase tracking-wider">
                        Active Moodboard Theme
                      </span>
                      <span className="text-xs text-[var(--text-secondary)]">
                        • Updated {formatDate(activeMoodboard.updated_at || new Date().toISOString())}
                      </span>
                      {isSavingMoodboard && (
                        <span className="text-[11px] text-[var(--accent)] font-semibold animate-pulse">
                          • Saving changes...
                        </span>
                      )}
                    </div>
                    <h3 className="font-display font-bold text-2xl text-[var(--text-primary)] mt-1">
                      {activeMoodboard.name}
                    </h3>
                    <p className="text-sm italic text-[var(--accent)] mt-0.5">
                      "{activeMoodboard.theme}"
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleHarmonizePalette}
                      className="gap-1.5 text-xs rounded-xl"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" /> Auto-Harmonize Palette
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAddColor}
                      className="gap-1.5 text-xs rounded-xl"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Color
                    </Button>
                  </div>
                </div>

                {/* Coordinated Color Palette Swatches */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5 text-[var(--primary)]" />
                      Coordinated Color Harmony (Click Hex or Pick Color)
                    </label>
                    <span className="text-[11px] text-[var(--text-secondary)]">
                      {activeMoodboard.color_palette.length} Curated Hues
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                    {activeMoodboard.color_palette.map((hex, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)] hover:border-[var(--primary)] transition-all flex flex-col items-center group relative shadow-xs"
                      >
                        {/* Swatch color block with native color picker integration */}
                        <div
                          className="w-full h-16 rounded-xl border border-black/10 relative overflow-hidden flex items-center justify-center cursor-pointer transition-transform group-hover:scale-[1.02]"
                          style={{ backgroundColor: hex }}
                        >
                          <input
                            type="color"
                            value={hex}
                            onChange={(e) => handleColorChange(idx, e.target.value)}
                            title="Click to change hue"
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          />
                          {copiedHex === hex ? (
                            <span className="p-1 rounded-full bg-black/40 text-white backdrop-blur-xs">
                              <Check className="w-4 h-4" />
                            </span>
                          ) : (
                            <span className="p-1 rounded-full bg-black/20 text-white/80 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Edit3 className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>

                        {/* Hex Code & Copy Action */}
                        <div className="flex items-center justify-between w-full mt-2.5 px-1">
                          <button
                            type="button"
                            onClick={() => copyColorToClipboard(hex)}
                            title="Click to copy hex code"
                            className="text-xs font-mono font-bold text-[var(--text-primary)] hover:text-[var(--primary)] cursor-pointer"
                          >
                            {hex.toUpperCase()}
                          </button>
                          {activeMoodboard.color_palette.length > 3 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveColor(idx)}
                              title="Remove swatch"
                              className="text-[var(--text-secondary)] hover:text-[var(--danger)] cursor-pointer text-xs p-0.5"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              {/* 2. THE 8 STYLING DIMENSIONS GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {/* 1. Decoration Ideas */}
                <Card variant="default" padding="md" className="space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
                      <h4 className="font-display font-bold text-sm text-[var(--text-primary)] flex items-center gap-1.5">
                        <Sparkle className="w-4 h-4 text-[var(--primary)]" /> Decoration Ideas
                      </h4>
                      <Badge variant="neutral">{activeMoodboard.decoration_ideas.length}</Badge>
                    </div>
                    <ul className="mt-3 space-y-2 text-xs">
                      {activeMoodboard.decoration_ideas.map((item, idx) => (
                        <li
                          key={idx}
                          className="p-2.5 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] flex items-start justify-between gap-2 group"
                        >
                          <span className="text-[var(--text-primary)] leading-relaxed">• {item}</span>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            {idx > 0 && (
                              <button
                                type="button"
                                onClick={() => handleReorderSectionItem('decoration_ideas', idx, 'up')}
                                className="p-0.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                              >
                                <ChevronUp className="w-3 h-3" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveSectionItem('decoration_ideas', idx)}
                              className="p-0.5 text-[var(--danger)] hover:bg-[var(--danger)]/10 rounded"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-2">
                    {activeSectionEdit === 'decoration_ideas' ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={newSectionItemText}
                          onChange={(e) => setNewSectionItemText(e.target.value)}
                          placeholder="Add decoration concept..."
                          className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)]"
                          onKeyDown={(e) => e.key === 'Enter' && handleAddSectionItem('decoration_ideas')}
                        />
                        <div className="flex gap-1.5">
                          <Button size="sm" variant="primary" onClick={() => handleAddSectionItem('decoration_ideas')} className="text-xs py-1 h-auto">
                            Add
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setActiveSectionEdit(null)} className="text-xs py-1 h-auto">
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setActiveSectionEdit('decoration_ideas');
                          setNewSectionItemText('');
                        }}
                        className="w-full text-xs gap-1 border border-dashed border-[var(--border)]"
                      >
                        <Plus className="w-3 h-3" /> Add Decoration Idea
                      </Button>
                    )}
                  </div>
                </Card>

                {/* 2. Venue Styling */}
                <Card variant="default" padding="md" className="space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
                      <h4 className="font-display font-bold text-sm text-[var(--text-primary)] flex items-center gap-1.5">
                        <Eye className="w-4 h-4 text-[var(--accent)]" /> Venue Styling
                      </h4>
                      <Badge variant="neutral">{activeMoodboard.venue_styling.length}</Badge>
                    </div>
                    <ul className="mt-3 space-y-2 text-xs">
                      {activeMoodboard.venue_styling.map((item, idx) => (
                        <li
                          key={idx}
                          className="p-2.5 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] flex items-start justify-between gap-2 group"
                        >
                          <span className="text-[var(--text-primary)] leading-relaxed">• {item}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSectionItem('venue_styling', idx)}
                            className="p-0.5 text-[var(--danger)] opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-2">
                    {activeSectionEdit === 'venue_styling' ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={newSectionItemText}
                          onChange={(e) => setNewSectionItemText(e.target.value)}
                          placeholder="Add venue styling direction..."
                          className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)]"
                          onKeyDown={(e) => e.key === 'Enter' && handleAddSectionItem('venue_styling')}
                        />
                        <div className="flex gap-1.5">
                          <Button size="sm" variant="primary" onClick={() => handleAddSectionItem('venue_styling')} className="text-xs py-1 h-auto">
                            Add
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setActiveSectionEdit(null)} className="text-xs py-1 h-auto">
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setActiveSectionEdit('venue_styling');
                          setNewSectionItemText('');
                        }}
                        className="w-full text-xs gap-1 border border-dashed border-[var(--border)]"
                      >
                        <Plus className="w-3 h-3" /> Add Venue Styling
                      </Button>
                    )}
                  </div>
                </Card>

                {/* 3. Lighting */}
                <Card variant="default" padding="md" className="space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
                      <h4 className="font-display font-bold text-sm text-[var(--text-primary)] flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-500" /> Lighting &amp; Ambiance
                      </h4>
                      <Badge variant="neutral">{activeMoodboard.lighting.length}</Badge>
                    </div>
                    <ul className="mt-3 space-y-2 text-xs">
                      {activeMoodboard.lighting.map((item, idx) => (
                        <li
                          key={idx}
                          className="p-2.5 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] flex items-start justify-between gap-2 group"
                        >
                          <span className="text-[var(--text-primary)] leading-relaxed">• {item}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSectionItem('lighting', idx)}
                            className="p-0.5 text-[var(--danger)] opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-2">
                    {activeSectionEdit === 'lighting' ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={newSectionItemText}
                          onChange={(e) => setNewSectionItemText(e.target.value)}
                          placeholder="Add lighting fixture/wash..."
                          className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)]"
                          onKeyDown={(e) => e.key === 'Enter' && handleAddSectionItem('lighting')}
                        />
                        <div className="flex gap-1.5">
                          <Button size="sm" variant="primary" onClick={() => handleAddSectionItem('lighting')} className="text-xs py-1 h-auto">
                            Add
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setActiveSectionEdit(null)} className="text-xs py-1 h-auto">
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setActiveSectionEdit('lighting');
                          setNewSectionItemText('');
                        }}
                        className="w-full text-xs gap-1 border border-dashed border-[var(--border)]"
                      >
                        <Plus className="w-3 h-3" /> Add Lighting Element
                      </Button>
                    )}
                  </div>
                </Card>

                {/* 4. Floral Arrangements */}
                <Card variant="default" padding="md" className="space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
                      <h4 className="font-display font-bold text-sm text-[var(--text-primary)] flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-emerald-600" /> Floral Arrangements
                      </h4>
                      <Badge variant="neutral">{activeMoodboard.floral_arrangements.length}</Badge>
                    </div>
                    <ul className="mt-3 space-y-2 text-xs">
                      {activeMoodboard.floral_arrangements.map((item, idx) => (
                        <li
                          key={idx}
                          className="p-2.5 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] flex items-start justify-between gap-2 group"
                        >
                          <span className="text-[var(--text-primary)] leading-relaxed">• {item}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSectionItem('floral_arrangements', idx)}
                            className="p-0.5 text-[var(--danger)] opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-2">
                    {activeSectionEdit === 'floral_arrangements' ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={newSectionItemText}
                          onChange={(e) => setNewSectionItemText(e.target.value)}
                          placeholder="Add botanical/floral concept..."
                          className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)]"
                          onKeyDown={(e) => e.key === 'Enter' && handleAddSectionItem('floral_arrangements')}
                        />
                        <div className="flex gap-1.5">
                          <Button size="sm" variant="primary" onClick={() => handleAddSectionItem('floral_arrangements')} className="text-xs py-1 h-auto">
                            Add
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setActiveSectionEdit(null)} className="text-xs py-1 h-auto">
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setActiveSectionEdit('floral_arrangements');
                          setNewSectionItemText('');
                        }}
                        className="w-full text-xs gap-1 border border-dashed border-[var(--border)]"
                      >
                        <Plus className="w-3 h-3" /> Add Floral Idea
                      </Button>
                    )}
                  </div>
                </Card>

                {/* 5. Dress Code */}
                <Card variant="default" padding="md" className="space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
                      <h4 className="font-display font-bold text-sm text-[var(--text-primary)] flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-[var(--primary)]" /> Dress Code &amp; Guest Attire
                      </h4>
                      <Badge variant="accent">Attire</Badge>
                    </div>
                    <div className="mt-3 p-3 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] text-xs text-[var(--text-primary)] leading-relaxed">
                      {activeMoodboard.dress_code || 'Celebration formal attire matching theme tone'}
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const val = prompt('Enter recommended dress code:', activeMoodboard.dress_code || '');
                        if (val !== null) handleUpdateActiveMoodboard({ dress_code: val.trim() });
                      }}
                      className="w-full text-xs gap-1 border border-dashed border-[var(--border)]"
                    >
                      <Edit3 className="w-3 h-3" /> Edit Dress Code
                    </Button>
                  </div>
                </Card>

                {/* 6. Table Styling */}
                <Card variant="default" padding="md" className="space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
                      <h4 className="font-display font-bold text-sm text-[var(--text-primary)] flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-purple-600" /> Table Styling &amp; Settings
                      </h4>
                      <Badge variant="neutral">{activeMoodboard.table_styling.length}</Badge>
                    </div>
                    <ul className="mt-3 space-y-2 text-xs">
                      {activeMoodboard.table_styling.map((item, idx) => (
                        <li
                          key={idx}
                          className="p-2.5 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] flex items-start justify-between gap-2 group"
                        >
                          <span className="text-[var(--text-primary)] leading-relaxed">• {item}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSectionItem('table_styling', idx)}
                            className="p-0.5 text-[var(--danger)] opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-2">
                    {activeSectionEdit === 'table_styling' ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={newSectionItemText}
                          onChange={(e) => setNewSectionItemText(e.target.value)}
                          placeholder="Add table setting / runner idea..."
                          className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)]"
                          onKeyDown={(e) => e.key === 'Enter' && handleAddSectionItem('table_styling')}
                        />
                        <div className="flex gap-1.5">
                          <Button size="sm" variant="primary" onClick={() => handleAddSectionItem('table_styling')} className="text-xs py-1 h-auto">
                            Add
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setActiveSectionEdit(null)} className="text-xs py-1 h-auto">
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setActiveSectionEdit('table_styling');
                          setNewSectionItemText('');
                        }}
                        className="w-full text-xs gap-1 border border-dashed border-[var(--border)]"
                      >
                        <Plus className="w-3 h-3" /> Add Table Styling
                      </Button>
                    )}
                  </div>
                </Card>

                {/* 7. Invitation Direction */}
                <Card variant="default" padding="md" className="space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
                      <h4 className="font-display font-bold text-sm text-[var(--text-primary)] flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-[var(--accent)]" /> Invitation Design Direction
                      </h4>
                      <Badge variant="accent">Stationery</Badge>
                    </div>
                    <div className="mt-3 p-3 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] text-xs text-[var(--text-primary)] leading-relaxed">
                      {activeMoodboard.invitation_direction || 'Letterpress foil on heavy cotton cardstock'}
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const val = prompt('Enter invitation design direction:', activeMoodboard.invitation_direction || '');
                        if (val !== null) handleUpdateActiveMoodboard({ invitation_direction: val.trim() });
                      }}
                      className="w-full text-xs gap-1 border border-dashed border-[var(--border)]"
                    >
                      <Edit3 className="w-3 h-3" /> Edit Invitation Direction
                    </Button>
                  </div>
                </Card>

                {/* 8. Food Presentation Ideas */}
                <Card variant="default" padding="md" className="space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
                      <h4 className="font-display font-bold text-sm text-[var(--text-primary)] flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-rose-500" /> Food Presentation Ideas
                      </h4>
                      <Badge variant="neutral">{activeMoodboard.food_presentation.length}</Badge>
                    </div>
                    <ul className="mt-3 space-y-2 text-xs">
                      {activeMoodboard.food_presentation.map((item, idx) => (
                        <li
                          key={idx}
                          className="p-2.5 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] flex items-start justify-between gap-2 group"
                        >
                          <span className="text-[var(--text-primary)] leading-relaxed">• {item}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSectionItem('food_presentation', idx)}
                            className="p-0.5 text-[var(--danger)] opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-2">
                    {activeSectionEdit === 'food_presentation' ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={newSectionItemText}
                          onChange={(e) => setNewSectionItemText(e.target.value)}
                          placeholder="Add culinary presentation idea..."
                          className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)]"
                          onKeyDown={(e) => e.key === 'Enter' && handleAddSectionItem('food_presentation')}
                        />
                        <div className="flex gap-1.5">
                          <Button size="sm" variant="primary" onClick={() => handleAddSectionItem('food_presentation')} className="text-xs py-1 h-auto">
                            Add
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setActiveSectionEdit(null)} className="text-xs py-1 h-auto">
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setActiveSectionEdit('food_presentation');
                          setNewSectionItemText('');
                        }}
                        className="w-full text-xs gap-1 border border-dashed border-[var(--border)]"
                      >
                        <Plus className="w-3 h-3" /> Add Food Presentation
                      </Button>
                    )}
                  </div>
                </Card>

                {/* 9. Custom Inspiration Notes */}
                <Card variant="default" padding="md" className="space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
                      <h4 className="font-display font-bold text-sm text-[var(--text-primary)] flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-blue-500" /> Custom Inspiration Notes
                      </h4>
                      <Badge variant="neutral">{activeMoodboard.inspiration_notes.length}</Badge>
                    </div>
                    <ul className="mt-3 space-y-2 text-xs">
                      {activeMoodboard.inspiration_notes.map((note, idx) => (
                        <li
                          key={idx}
                          className="p-2.5 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] flex items-start justify-between gap-2 group"
                        >
                          <span className="text-[var(--text-primary)] leading-relaxed italic">"{note}"</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveNote(idx)}
                            className="p-0.5 text-[var(--danger)] opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-2">
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={newNoteInput}
                        onChange={(e) => setNewNoteInput(e.target.value)}
                        placeholder="Add personal note..."
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)]"
                        onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                      />
                      <Button size="sm" variant="primary" onClick={handleAddNote} className="text-xs py-1 h-auto">
                        Save
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>

              {/* 3. VISUAL INSPIRATION & CSS ILLUSTRATION GALLERY */}
              <Card variant="default" padding="lg" className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border)]">
                  <div>
                    <h4 className="font-display font-bold text-base text-[var(--text-primary)] flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-[var(--accent)]" /> Visual Styling References &amp; Textures
                    </h4>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                      Curated CSS abstract textures and user-provided inspiration images.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="gap-1.5 text-xs rounded-xl"
                    >
                      <Upload className="w-3.5 h-3.5" /> Upload Image
                    </Button>
                  </div>
                </div>

                {/* Regulatory / Transparency Notice */}
                <div className="p-3 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                  <Info className="w-4 h-4 text-[var(--primary)] shrink-0" />
                  <span>
                    <strong>Visual Transparency:</strong> Festiva AI uses CSS patterns and styling swatches as mood inspiration only. AI-generated graphics are never presented as actual physical venues or booked vendors.
                  </span>
                </div>

                {/* Gallery Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {/* CSS Illustration Preset 1: Botanical Gold */}
                  <div className="h-44 rounded-2xl p-4 flex flex-col justify-between border border-[var(--border)] relative overflow-hidden bg-gradient-to-br from-[#2D5A43] via-[#1E3D2D] to-[#0D1F17] text-white shadow-xs">
                    <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full border border-[#D8B477]/30 bg-[#D8B477]/10 blur-xs" />
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-[#D8B477] block">
                        Botanical Harmony
                      </span>
                      <h5 className="font-display font-bold text-base mt-1">Lush Conservatory</h5>
                    </div>
                    <p className="text-[11px] text-white/80 leading-relaxed z-10">
                      Suspended wisteria, velvet foliage, and warm brass filigree.
                    </p>
                  </div>

                  {/* CSS Illustration Preset 2: Celestial Twilight */}
                  <div className="h-44 rounded-2xl p-4 flex flex-col justify-between border border-[var(--border)] relative overflow-hidden bg-gradient-to-br from-[#1A2238] via-[#2A1B3D] to-[#120B1D] text-white shadow-xs">
                    <div className="absolute -right-4 -top-4 w-28 h-28 rounded-full border border-purple-400/20 bg-purple-500/10" />
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--secondary)] block">
                        Atmospheric Glow
                      </span>
                      <h5 className="font-display font-bold text-base mt-1">Starlit Pavilion</h5>
                    </div>
                    <p className="text-[11px] text-white/80 leading-relaxed z-10">
                      Warm Edison string washes, frosted candle votives, and midnight hues.
                    </p>
                  </div>

                  {/* CSS Illustration Preset 3: Modern Minimalist */}
                  <div className="h-44 rounded-2xl p-4 flex flex-col justify-between border border-[var(--border)] relative overflow-hidden bg-gradient-to-br from-[#26232B] via-[#332C3A] to-[#1C1821] text-white shadow-xs">
                    <div className="absolute right-2 bottom-2 w-20 h-20 border border-white/10 rotate-45" />
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--accent)] block">
                        Architectural Line
                      </span>
                      <h5 className="font-display font-bold text-base mt-1">Linear Elegance</h5>
                    </div>
                    <p className="text-[11px] text-white/80 leading-relaxed z-10">
                      Smoked acrylic plinths, monochromatic lilies, and frosted glass.
                    </p>
                  </div>

                  {/* User Uploaded Images */}
                  {(activeMoodboard.images || [])
                    .filter((img) => img.startsWith('data:image'))
                    .map((imgData, iIdx) => (
                      <div
                        key={iIdx}
                        className="h-44 rounded-2xl border border-[var(--border)] relative overflow-hidden group shadow-xs"
                      >
                        <img
                          src={imgData}
                          alt="User Moodboard Reference"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(iIdx)}
                          className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white hover:bg-[var(--danger)] transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                </div>
              </Card>
            </div>
          ) : (
            <EmptyState
              title="No Moodboards Created"
              description="Craft your celebration's first visual moodboard with custom palettes, florals, and lighting."
              action={
                <Button variant="primary" onClick={() => setIsNewMoodboardOpen(true)}>
                  Create Moodboard
                </Button>
              }
            />
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          SUBTAB 2: EVENT PLAN CONCEPT COMPARISON
          ══════════════════════════════════════════════════════════════════════════ */}
      {activeSubTab === 'comparison' && (
        <div className="space-y-6">
          {/* Comparison Control Bar */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-card space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-bold text-lg text-[var(--text-primary)]">
                    Three Tailored Celebration Concepts
                  </h3>
                  <Badge variant="primary">Target Budget Aligned</Badge>
                </div>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Benchmark budget:{' '}
                  <span className="font-semibold text-[var(--text-primary)]">
                    {formatCurrency(
                      activeEvent?.plan_data?.total_estimated_budget || 500000,
                      activeEvent?.plan_data?.currency || 'INR'
                    )}
                  </span>{' '}
                  • Guest Headcount:{' '}
                  <span className="font-semibold text-[var(--text-primary)]">
                    {activeEvent?.plan_data?.guest_count || 100} Guests
                  </span>
                </p>
              </div>

              {/* View Layout Toggle */}
              <div className="flex items-center gap-2">
                <div className="flex rounded-xl bg-[var(--surface-elevated)] p-1 border border-[var(--border)]">
                  <button
                    type="button"
                    onClick={() => setComparisonLayout('side-by-side')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      comparisonLayout === 'side-by-side'
                        ? 'bg-[var(--primary)] text-white shadow-xs'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    Side-by-Side
                  </button>
                  <button
                    type="button"
                    onClick={() => setComparisonLayout('stacked')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      comparisonLayout === 'stacked'
                        ? 'bg-[var(--primary)] text-white shadow-xs'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    Stacked Deep Dive
                  </button>
                </div>
              </div>
            </div>

            {/* Custom Instructions / Re-generate Input */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-[var(--border)]">
              <input
                type="text"
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                placeholder="Optional AI tuning instructions (e.g. 'Focus on sunset terrace lighting and live acoustic strings')..."
                className="flex-1 text-xs px-3.5 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                onKeyDown={(e) => e.key === 'Enter' && handleRegenerateConcepts()}
              />
              <Button
                variant="primary"
                onClick={handleRegenerateConcepts}
                disabled={isGeneratingConcepts}
                className="gap-1.5 text-xs rounded-xl shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingConcepts ? 'animate-spin' : ''}`} />
                {isGeneratingConcepts ? 'Synthesizing...' : 'Re-synthesize Concepts'}
              </Button>
            </div>
          </div>

          {/* Concepts Grid / Stack */}
          {isLoadingConcepts ? (
            <div className="p-12 text-center text-[var(--text-secondary)] space-y-3">
              <RefreshCw className="w-8 h-8 mx-auto animate-spin text-[var(--primary)]" />
              <p className="text-sm font-semibold">Synthesizing 3 distinct event concepts...</p>
            </div>
          ) : concepts.length > 0 ? (
            <div
              className={`grid gap-6 ${
                comparisonLayout === 'side-by-side'
                  ? 'grid-cols-1 lg:grid-cols-3'
                  : 'grid-cols-1'
              }`}
            >
              {concepts.map((concept, idx) => {
                const isOverrun = !concept.is_within_budget;
                const isAdoptedCurrently =
                  activeEvent?.plan_data?.theme_details?.theme_name === concept.theme;

                return (
                  <Card
                    key={concept.id || idx}
                    variant="default"
                    padding="lg"
                    className={`space-y-5 flex flex-col justify-between transition-all relative ${
                      isAdoptedCurrently
                        ? 'border-2 border-[var(--primary)] shadow-md'
                        : 'hover:border-[var(--primary)]/60'
                    }`}
                  >
                    {isAdoptedCurrently && (
                      <div className="absolute -top-3 right-4 px-3 py-0.5 rounded-full bg-[var(--primary)] text-white text-[10px] font-bold uppercase tracking-wider shadow-xs">
                        Active Blueprint Plan
                      </div>
                    )}

                    <div className="space-y-4">
                      {/* Concept Header */}
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-bold text-[var(--primary)] uppercase tracking-wider">
                            Concept {idx + 1}
                          </span>
                          <Badge
                            variant={
                              concept.planning_complexity === 'Low'
                                ? 'success'
                                : concept.planning_complexity === 'Medium'
                                ? 'primary'
                                : 'warning'
                            }
                          >
                            {concept.planning_complexity} Complexity
                          </Badge>
                        </div>
                        <h4 className="font-display font-bold text-lg text-[var(--text-primary)] mt-1">
                          {concept.concept_name}
                        </h4>
                        <p className="text-xs text-[var(--accent)] italic mt-0.5">
                          Theme: {concept.theme}
                        </p>
                      </div>

                      {/* Budget Fit & Allocation */}
                      <div className="p-3.5 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] space-y-2">
                        <div className="flex items-baseline justify-between">
                          <span className="text-xs text-[var(--text-secondary)] font-medium">
                            Estimated Budget
                          </span>
                          <span className="font-display font-bold text-base text-[var(--text-primary)]">
                            {formatCurrency(concept.estimated_budget, concept.currency)}
                          </span>
                        </div>

                        {/* Budget Status Badge */}
                        <div className="flex items-center justify-between pt-1 border-t border-[var(--border)] text-xs">
                          <span className="text-[11px] text-[var(--text-secondary)]">Budget Alignment:</span>
                          <span
                            className={`font-semibold flex items-center gap-1 ${
                              isOverrun ? 'text-amber-600' : 'text-emerald-600'
                            }`}
                          >
                            {isOverrun ? (
                              <AlertTriangle className="w-3.5 h-3.5" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            )}
                            {concept.budget_fit}
                          </span>
                        </div>

                        {/* Overrun Trade-off Callout */}
                        {isOverrun && concept.overrun_amount > 0 && (
                          <p className="text-[11px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 p-2 rounded-lg leading-relaxed">
                            <strong>Overrun Explanation:</strong> Exceeds baseline by{' '}
                            {formatCurrency(concept.overrun_amount, concept.currency)}. Can be balanced using the cost-saving opportunities below.
                          </p>
                        )}
                      </div>

                      {/* Palette Bar */}
                      <div>
                        <span className="text-[11px] font-semibold text-[var(--text-secondary)] block mb-1 uppercase tracking-wider">
                          Recommended Color Palette
                        </span>
                        <div className="flex h-5 rounded-lg overflow-hidden border border-black/10 shadow-xs">
                          {concept.recommended_color_palette.map((cHex, cIdx) => (
                            <div
                              key={cIdx}
                              className="flex-1 cursor-pointer hover:opacity-90 transition-opacity"
                              style={{ backgroundColor: cHex }}
                              title={cHex}
                              onClick={() => copyColorToClipboard(cHex)}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Guest Experience */}
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider block">
                          Guest Experience
                        </span>
                        <p className="text-xs text-[var(--text-primary)] leading-relaxed bg-[var(--surface-elevated)] p-2.5 rounded-xl border border-[var(--border)]">
                          {concept.guest_experience}
                        </p>
                      </div>

                      {/* Decoration & Catering Directions */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                        <div className="p-2.5 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] space-y-1">
                          <span className="font-bold text-[var(--primary)] flex items-center gap-1 text-[11px]">
                            <Sparkle className="w-3 h-3" /> Decoration
                          </span>
                          <p className="text-[var(--text-secondary)] leading-relaxed">
                            {concept.decoration_direction}
                          </p>
                        </div>

                        <div className="p-2.5 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] space-y-1">
                          <span className="font-bold text-[var(--accent)] flex items-center gap-1 text-[11px]">
                            <DollarSign className="w-3 h-3" /> Catering
                          </span>
                          <p className="text-[var(--text-secondary)] leading-relaxed">
                            {concept.catering_direction}
                          </p>
                        </div>
                      </div>

                      {/* Complexity Rationale */}
                      <div className="text-xs p-2.5 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)]">
                        <span className="font-bold text-[var(--text-primary)] block mb-0.5">
                          Complexity Rationale:
                        </span>
                        <p className="text-[var(--text-secondary)] leading-relaxed">
                          {concept.complexity_rationale}
                        </p>
                      </div>

                      {/* Main Advantages */}
                      <div className="space-y-1.5 text-xs">
                        <span className="font-bold text-emerald-700 dark:text-emerald-400 block uppercase tracking-wider text-[11px]">
                          Key Advantages:
                        </span>
                        <ul className="space-y-1 text-[var(--text-primary)]">
                          {concept.main_advantages.map((adv, aIdx) => (
                            <li key={aIdx} className="flex items-start gap-1.5">
                              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                              <span>{adv}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Trade-offs */}
                      <div className="space-y-1.5 text-xs">
                        <span className="font-bold text-amber-700 dark:text-amber-400 block uppercase tracking-wider text-[11px]">
                          Considerations &amp; Trade-offs:
                        </span>
                        <ul className="space-y-1 text-[var(--text-secondary)]">
                          {concept.trade_offs.map((tr, tIdx) => (
                            <li key={tIdx} className="flex items-start gap-1.5">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                              <span>{tr}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Estimated Cost-Saving Opportunities */}
                      <div className="space-y-1.5 text-xs p-3 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)]">
                        <span className="font-bold text-[var(--primary)] flex items-center gap-1 uppercase tracking-wider text-[11px]">
                          <TrendingDown className="w-3.5 h-3.5" /> Cost-Saving Opportunities:
                        </span>
                        <ul className="space-y-1.5 text-[var(--text-secondary)]">
                          {(concept.estimated_cost_savings || concept.cost_saving_opportunities || []).map(
                            (sav, sIdx) => (
                              <li key={sIdx} className="flex items-start gap-1.5">
                                <DollarSign className="w-3.5 h-3.5 text-[var(--accent)] shrink-0 mt-0.5" />
                                <span>{sav}</span>
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    </div>

                    {/* Adoption CTA Button */}
                    <div className="pt-3 border-t border-[var(--border)]">
                      <Button
                        variant={isAdoptedCurrently ? 'outline' : 'primary'}
                        onClick={() => handleOpenAdoptModal(concept)}
                        disabled={isAdoptedCurrently}
                        className="w-full gap-2 justify-center text-xs py-2.5 rounded-xl font-semibold"
                      >
                        {isAdoptedCurrently ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-600" /> Active Celebration Plan
                          </>
                        ) : (
                          <>
                            <ArrowRight className="w-4 h-4" /> Select &amp; Adopt This Concept
                          </>
                        )}
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="No Concepts Generated Yet"
              description="Synthesize 3 distinct event concepts side-by-side to compare themes, budgets, and guest experiences."
              action={
                <Button variant="primary" onClick={handleRegenerateConcepts}>
                  Generate 3 Concepts
                </Button>
              }
            />
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          MODAL 1: CREATE NEW MOODBOARD
          ══════════════════════════════════════════════════════════════════════════ */}
      <Dialog
        isOpen={isNewMoodboardOpen}
        onClose={() => setIsNewMoodboardOpen(false)}
        title="Create New Event Moodboard"
      >
        <div className="space-y-4 pt-2">
          <p className="text-xs text-[var(--text-secondary)]">
            Create an additional moodboard variation for your celebration (e.g. Cocktail Reception, Daytime Sangeet, or Afterparty Lounge).
          </p>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-[var(--text-primary)] block mb-1">
                Moodboard Name *
              </label>
              <input
                type="text"
                value={newBoardName}
                onChange={(e) => setNewBoardName(e.target.value)}
                placeholder="e.g. Glasshouse Twilight Evening"
                className="w-full text-xs px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[var(--text-primary)] block mb-1">
                Theme / Aesthetic Keywords
              </label>
              <input
                type="text"
                value={newBoardTheme}
                onChange={(e) => setNewBoardTheme(e.target.value)}
                placeholder="e.g. Emerald, Brushed Champagne, Botanical"
                className="w-full text-xs px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
              />
              <span className="text-[11px] text-[var(--text-secondary)] mt-1 block">
                Festiva AI will automatically harmonize a coordinated 5-color palette based on this theme.
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border)]">
            <Button variant="ghost" onClick={() => setIsNewMoodboardOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateMoodboard}
              disabled={!newBoardName.trim()}
            >
              Create Moodboard
            </Button>
          </div>
        </div>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════════════════════
          MODAL 2: RENAME MOODBOARD
          ══════════════════════════════════════════════════════════════════════════ */}
      <Dialog
        isOpen={isRenameOpen}
        onClose={() => setIsRenameOpen(false)}
        title="Rename Moodboard"
      >
        <div className="space-y-4 pt-2">
          <div>
            <label className="text-xs font-semibold text-[var(--text-primary)] block mb-1">
              New Moodboard Name *
            </label>
            <input
              type="text"
              value={renameInput}
              onChange={(e) => setRenameInput(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border)]">
            <Button variant="ghost" onClick={() => setIsRenameOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleRenameMoodboard}
              disabled={!renameInput.trim()}
            >
              Save Name
            </Button>
          </div>
        </div>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════════════════════
          MODAL 3: DUPLICATE MOODBOARD
          ══════════════════════════════════════════════════════════════════════════ */}
      <Dialog
        isOpen={isDuplicateOpen}
        onClose={() => setIsDuplicateOpen(false)}
        title="Duplicate Moodboard"
      >
        <div className="space-y-4 pt-2">
          <p className="text-xs text-[var(--text-secondary)]">
            Create an exact copy of "{activeMoodboard?.name}" with all colors, floral notes, and styling intact.
          </p>

          <div>
            <label className="text-xs font-semibold text-[var(--text-primary)] block mb-1">
              New Copy Name
            </label>
            <input
              type="text"
              value={duplicateInput}
              onChange={(e) => setDuplicateInput(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border)]">
            <Button variant="ghost" onClick={() => setIsDuplicateOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleDuplicateMoodboard}>
              Duplicate Board
            </Button>
          </div>
        </div>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════════════════════
          MODAL 4: STRICT SAFE ADOPTION CONFIRMATION MODAL
          ══════════════════════════════════════════════════════════════════════════ */}
      <Dialog
        isOpen={Boolean(conceptToAdopt)}
        onClose={() => setConceptToAdopt(null)}
        title="Confirm Concept Plan Adoption"
      >
        {conceptToAdopt && (
          <div className="space-y-4 pt-2">
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Important Plan Replacement Notice:</strong>
                Adopting <strong>"{conceptToAdopt.concept_name}"</strong> will replace your active celebration blueprint's theme, color palette, decoration direction, and concept statement.
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Concept:</span>
                <span className="font-bold text-[var(--text-primary)]">{conceptToAdopt.concept_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Theme:</span>
                <span className="font-semibold text-[var(--accent)]">{conceptToAdopt.theme}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Estimated Budget:</span>
                <span className="font-bold text-[var(--text-primary)]">
                  {formatCurrency(conceptToAdopt.estimated_budget, conceptToAdopt.currency)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Budget Alignment:</span>
                <span className={`font-bold ${conceptToAdopt.is_within_budget ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {conceptToAdopt.budget_fit}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] text-xs text-[var(--text-secondary)]">
              <strong>What will happen:</strong>
              <ul className="mt-1 space-y-1 list-disc list-inside">
                <li>Your celebration theme details will update to "{conceptToAdopt.theme}".</li>
                <li>A dedicated "(Adopted)" moodboard will be automatically created with this concept's palette.</li>
                <li>Existing guest lists, expense items, and timeline tasks will be preserved intact.</li>
              </ul>
            </div>

            {/* Explicit Confirmation Checkbox (STRICT REQUIREMENT) */}
            <label className="flex items-start gap-2.5 p-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] cursor-pointer">
              <input
                type="checkbox"
                checked={adoptConfirmed}
                onChange={(e) => setAdoptConfirmed(e.target.checked)}
                className="mt-0.5 rounded text-[var(--primary)] focus:ring-[var(--primary)]"
              />
              <span className="text-xs text-[var(--text-primary)] font-medium">
                I explicitly confirm adopting this concept and updating my active celebration blueprint.
              </span>
            </label>

            <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border)]">
              <Button variant="ghost" onClick={() => setConceptToAdopt(null)} disabled={isAdopting}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmAdopt}
                disabled={!adoptConfirmed || isAdopting}
                className="gap-1.5"
              >
                {isAdopting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                Confirm &amp; Adopt Concept
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
