import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { CelebrationRibbon } from '../components/ui/CelebrationRibbon';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[var(--background)] text-[var(--text-primary)]">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="text-center max-w-md p-8"
      >
        <div className="flex justify-center mb-4">
          <CelebrationRibbon variant="accent" className="text-[var(--accent)]" />
        </div>
        <div className="text-8xl font-display font-bold text-[var(--primary)] mb-2">
          404
        </div>
        <h1 className="font-display text-2xl font-bold text-[var(--text-primary)] mb-3">
          Celebration Not Found
        </h1>
        <p className="text-[var(--text-secondary)] mb-8 text-sm leading-relaxed">
          The page you are looking for has moved or does not exist. Let's get you back to planning extraordinary events.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link to="/">
            <Button variant="outline" leftIcon={<Home className="w-4 h-4" />}>
              Home
            </Button>
          </Link>
          <Link to="/events/new">
            <Button variant="primary" leftIcon={<Sparkles className="w-4 h-4" />}>
              Plan an Event
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
