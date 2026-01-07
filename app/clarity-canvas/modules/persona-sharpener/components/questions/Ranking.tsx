'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { Question, RankedItem } from '@/lib/clarity-canvas/modules/persona-sharpener/types';

interface Props {
  question: Question;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
}

export function Ranking({ question, value, onChange, disabled }: Props) {
  const items = question.items || [];
  const [rankedItems, setRankedItems] = useState<RankedItem[]>([]);
  const [unrankedItems, setUnrankedItems] = useState<RankedItem[]>([]);

  // Initialize items
  useEffect(() => {
    if (Array.isArray(value) && value.length > 0) {
      // Restore from saved value
      const ranked = value as RankedItem[];
      setRankedItems(ranked);
      const rankedIds = ranked.map((r) => r.id);
      setUnrankedItems(items.filter((i) => !rankedIds.includes(i.id)));
    } else {
      setRankedItems([]);
      setUnrankedItems([...items]);
    }
  }, [question.id]);

  const handleAddToRanking = (item: RankedItem) => {
    if (disabled) return;

    const newRanked = [...rankedItems, { ...item, rank: rankedItems.length + 1 }];
    const newUnranked = unrankedItems.filter((i) => i.id !== item.id);

    setRankedItems(newRanked);
    setUnrankedItems(newUnranked);
    onChange(newRanked);
  };

  const handleRemoveFromRanking = (item: RankedItem) => {
    if (disabled) return;

    const newRanked = rankedItems
      .filter((i) => i.id !== item.id)
      .map((i, idx) => ({ ...i, rank: idx + 1 }));
    const newUnranked = [...unrankedItems, { id: item.id, label: item.label }];

    setRankedItems(newRanked);
    setUnrankedItems(newUnranked);
    onChange(newRanked.length > 0 ? newRanked : null);
  };

  const handleMoveUp = (index: number) => {
    if (disabled || index === 0) return;

    const newRanked = [...rankedItems];
    [newRanked[index - 1], newRanked[index]] = [
      newRanked[index],
      newRanked[index - 1],
    ];
    const reranked = newRanked.map((i, idx) => ({ ...i, rank: idx + 1 }));

    setRankedItems(reranked);
    onChange(reranked);
  };

  const handleMoveDown = (index: number) => {
    if (disabled || index === rankedItems.length - 1) return;

    const newRanked = [...rankedItems];
    [newRanked[index], newRanked[index + 1]] = [
      newRanked[index + 1],
      newRanked[index],
    ];
    const reranked = newRanked.map((i, idx) => ({ ...i, rank: idx + 1 }));

    setRankedItems(reranked);
    onChange(reranked);
  };

  return (
    <div className="space-y-4">
      {/* Ranked items */}
      {rankedItems.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-zinc-400">Your ranking:</p>
          {rankedItems.map((item, index) => (
            <motion.div
              key={item.id}
              layout
              className="flex items-center gap-3 p-3 bg-[#D4A84B]/10 border border-[#D4A84B]/30 rounded-lg"
            >
              <span className="w-6 h-6 rounded-full bg-[#D4A84B] text-black text-sm font-medium flex items-center justify-center">
                {index + 1}
              </span>
              <span className="flex-1 text-white">{item.label}</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleMoveUp(index)}
                  disabled={disabled || index === 0}
                  className="p-1 text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  ↑
                </button>
                <button
                  onClick={() => handleMoveDown(index)}
                  disabled={disabled || index === rankedItems.length - 1}
                  className="p-1 text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  ↓
                </button>
                <button
                  onClick={() => handleRemoveFromRanking(item)}
                  disabled={disabled}
                  className="p-1 text-zinc-400 hover:text-red-400 disabled:cursor-not-allowed"
                >
                  ×
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Unranked items */}
      {unrankedItems.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-zinc-400">
            {rankedItems.length > 0
              ? 'Click to add to ranking:'
              : 'Click items in order of priority:'}
          </p>
          <div className="flex flex-wrap gap-2">
            {unrankedItems.map((item) => (
              <motion.button
                key={item.id}
                onClick={() => handleAddToRanking(item)}
                disabled={disabled}
                whileHover={disabled ? undefined : { scale: 1.02 }}
                whileTap={disabled ? undefined : { scale: 0.98 }}
                className={`px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-300 hover:border-zinc-500 hover:text-white transition-colors ${
                  disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                }`}
              >
                {item.label}
              </motion.button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
