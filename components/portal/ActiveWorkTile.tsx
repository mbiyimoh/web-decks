'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ActiveWorkItem } from './types';
import { GOLD, GOLD_DIM, BG_SURFACE } from './design-tokens';

interface ActiveWorkTileProps {
  item: ActiveWorkItem;
}

export const ActiveWorkTile: React.FC<ActiveWorkTileProps> = ({ item }) => (
  <Link href={item.link} style={{ textDecoration: 'none' }}>
    <motion.div
      whileHover={{ scale: 1.01, y: -2 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px',
        background: BG_SURFACE,
        borderRadius: 12,
        border: '1px solid #27272a',
        transition: 'border-color 0.2s ease',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = GOLD;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#27272a';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: GOLD_DIM,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span style={{ color: GOLD, fontSize: 16 }}>●</span>
        </div>

        <div>
          <p
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: '#fff',
              margin: 0,
              marginBottom: 2,
            }}
          >
            {item.module}
          </p>
          <p
            style={{
              fontSize: 13,
              color: '#737373',
              margin: 0,
            }}
          >
            {item.context}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <span
          style={{
            fontSize: 11,
            color: GOLD,
            padding: '4px 10px',
            background: GOLD_DIM,
            borderRadius: 4,
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          {item.progress}
        </span>
        <span style={{ color: '#525252', fontSize: 16 }}>→</span>
      </div>
    </motion.div>
  </Link>
);

export default ActiveWorkTile;
