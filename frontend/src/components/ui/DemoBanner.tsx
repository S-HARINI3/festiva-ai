import { Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function DemoBanner() {
  return (
    <motion.div
      initial={{ y: -30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-[60] bg-[var(--accent)] text-[var(--accent-text)] border-b border-[var(--border)] shadow-xs select-none"
    >
      <div className="container-app py-1.5 flex items-center justify-center gap-2 text-xs font-medium">
        <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
        <p>
          <strong>Studio Demo Mode:</strong> Ready to explore! Connect Gemini &amp; Supabase in{' '}
          <code className="bg-black/10 px-1 py-0.5 rounded text-[11px] font-mono">.env</code> for live persistence.
        </p>
      </div>
    </motion.div>
  );
}
