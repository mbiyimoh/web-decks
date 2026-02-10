'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Info, ExternalLink } from 'lucide-react';
import {
  GOLD,
  TEXT_MUTED,
  BG_ELEVATED,
} from '@/components/portal/design-tokens';
import { truncate, formatDate } from '@/lib/input-session/utils';

interface FieldSource {
  id: string;
  type: string;
  extractedAt: string;
  rawContent: string;
  inputSession?: {
    id: string;
    title: string;
    inputType: string;
    capturedAt: string;
  };
}

interface FieldCitationProps {
  fieldId: string;
  sourceCount: number;
}

export function FieldCitation({ fieldId, sourceCount }: FieldCitationProps) {
  const router = useRouter();
  const [showPopover, setShowPopover] = useState(false);
  const [sources, setSources] = useState<FieldSource[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Navigate to archive with chunk highlighted
  function handleViewInArchive(source: FieldSource) {
    if (source.inputSession?.id) {
      router.push(`/clarity-canvas/archive?session=${source.inputSession.id}&chunk=${source.id}`);
      setShowPopover(false);
    }
  }

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        setShowPopover(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function loadSources() {
    if (sources || loading) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/clarity-canvas/fields/${fieldId}/sources`);
      if (!res.ok) {
        throw new Error(`Failed to load sources`);
      }
      const data = await res.json();
      setSources(data.sources || []);
    } catch (err) {
      console.error('Failed to load sources:', err);
      setError('Failed to load sources');
      setSources([]);
    } finally {
      setLoading(false);
    }
  }

  function handleRetry() {
    setSources(null);
    setError(null);
    loadSources();
  }

  if (sourceCount === 0) return null;

  return (
    <div className="relative inline-block" ref={popoverRef}>
      <button
        onClick={() => {
          loadSources();
          setShowPopover(!showPopover);
        }}
        className="flex items-center gap-1 text-xs hover:opacity-80"
        style={{ color: TEXT_MUTED }}
      >
        <Info size={12} />
        <span>
          {sourceCount} source{sourceCount !== 1 ? 's' : ''}
        </span>
      </button>

      {showPopover && (
        <div
          className="absolute z-50 top-full left-0 mt-2 w-80 rounded-lg border p-4 shadow-xl"
          style={{
            background: BG_ELEVATED,
            borderColor: 'rgba(255, 255, 255, 0.1)',
          }}
        >
          <p
            className="text-xs font-mono uppercase mb-3"
            style={{ color: GOLD }}
          >
            Sources
          </p>
          {loading ? (
            <p className="text-sm" style={{ color: TEXT_MUTED }}>
              Loading...
            </p>
          ) : error ? (
            <div>
              <p className="text-sm text-red-400 mb-2">{error}</p>
              <button
                onClick={handleRetry}
                className="text-xs hover:opacity-80"
                style={{ color: GOLD }}
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {sources?.map((source) => (
                <div key={source.id} className="text-sm">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-xs px-1.5 py-0.5 rounded"
                        style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          color: TEXT_MUTED,
                        }}
                      >
                        {source.type}
                      </span>
                      <span className="text-xs" style={{ color: TEXT_MUTED }}>
                        {formatDate(source.extractedAt)}
                      </span>
                    </div>
                    {source.inputSession && (
                      <button
                        onClick={() => handleViewInArchive(source)}
                        className="flex items-center gap-1 text-xs hover:opacity-80 transition-opacity"
                        style={{ color: GOLD }}
                        title="View in archive"
                      >
                        <ExternalLink size={10} />
                        <span>View</span>
                      </button>
                    )}
                  </div>
                  <p className="text-sm" style={{ color: TEXT_MUTED }}>
                    {truncate(source.rawContent, 150)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
