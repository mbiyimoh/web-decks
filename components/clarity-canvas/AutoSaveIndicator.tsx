'use client';

import { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { GREEN } from '@/components/portal/design-tokens';

interface AutoSaveIndicatorProps {
  show: boolean;
  onHide?: () => void;
}

export function AutoSaveIndicator({ show, onHide }: AutoSaveIndicatorProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        onHide?.();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onHide]);

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-6 right-6 flex items-center gap-2 px-4 py-2 rounded-full shadow-lg z-50 animate-fade-in"
      style={{
        background: 'rgba(74, 222, 128, 0.1)',
        border: `1px solid ${GREEN}`,
      }}
    >
      <Check size={14} style={{ color: GREEN }} />
      <span className="text-sm" style={{ color: GREEN }}>
        Saved
      </span>
    </div>
  );
}
