'use client';

import { useState } from 'react';
import {
  GOLD,
  GREEN,
  BLUE,
  RED,
  BG_ELEVATED,
  BG_PRIMARY,
  TEXT_PRIMARY,
  TEXT_MUTED,
  TEXT_DIM,
} from '@/components/portal/design-tokens';
import type { Stakeholder } from '@/lib/central-command/types';

interface StakeholdersSectionProps {
  stakeholders: Stakeholder[];
  onEdit?: (index: number, updated: Stakeholder) => void;
  onAdd?: (stakeholder: Stakeholder) => void;
}

const ROLE_COLORS: Record<string, string> = {
  champion: GREEN,
  economic_buyer: GOLD,
  decision_maker: GOLD,
  technical_evaluator: BLUE,
  blocker: RED,
  unknown: TEXT_MUTED,
};

const ROLE_LABELS: Record<string, string> = {
  champion: 'Champion',
  economic_buyer: 'Economic Buyer',
  decision_maker: 'Decision Maker',
  technical_evaluator: 'Technical Evaluator',
  operations_gatekeeper: 'Operations',
  legal_compliance: 'Legal/Compliance',
  end_user: 'End User',
  influencer: 'Influencer',
  blocker: 'Blocker',
  unknown: 'Unknown',
};

export default function StakeholdersSection({
  stakeholders,
  onEdit,
  onAdd,
}: StakeholdersSectionProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editForm, setEditForm] = useState<Stakeholder | null>(null);

  function handleCardClick(index: number) {
    if (editingIndex !== null) return;
    setExpandedIndex(expandedIndex === index ? null : index);
  }

  function handleEditClick(index: number, stakeholder: Stakeholder) {
    setEditingIndex(index);
    setEditForm({ ...stakeholder });
  }

  function handleSaveEdit() {
    if (editingIndex !== null && editForm && onEdit) {
      onEdit(editingIndex, editForm);
      setEditingIndex(null);
      setEditForm(null);
    }
  }

  function handleCancelEdit() {
    setEditingIndex(null);
    setEditForm(null);
  }

  function handleAddNew() {
    setShowAddForm(true);
    setEditForm({
      name: '',
      title: '',
      role: 'unknown',
      context: '',
      contactInfo: { email: null, phone: null, linkedin: null },
      confidence: 0.5,
    });
  }

  function handleSaveNew() {
    if (editForm && onAdd && editForm.name.trim()) {
      onAdd(editForm);
      setShowAddForm(false);
      setEditForm(null);
    }
  }

  function handleCancelAdd() {
    setShowAddForm(false);
    setEditForm(null);
  }

  if (stakeholders.length === 0 && !showAddForm) {
    return (
      <div className="text-center py-6">
        <p className="text-sm mb-3" style={{ color: TEXT_DIM }}>
          No stakeholders extracted yet.
        </p>
        {onAdd && (
          <button
            onClick={handleAddNew}
            className="px-3 py-1.5 rounded text-xs transition-colors hover:bg-white/5"
            style={{ color: GOLD, border: `1px solid ${GOLD}` }}
          >
            + Add Stakeholder
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Add button */}
      {onAdd && !showAddForm && (
        <div className="flex justify-end">
          <button
            onClick={handleAddNew}
            className="px-2 py-1 rounded text-xs transition-colors hover:bg-white/5"
            style={{ color: GOLD }}
          >
            + Add
          </button>
        </div>
      )}

      {/* Stakeholder cards */}
      {stakeholders.map((stakeholder, index) => {
        const roleColor = ROLE_COLORS[stakeholder.role] || TEXT_MUTED;
        const roleLabel = ROLE_LABELS[stakeholder.role] || stakeholder.role;
        const isExpanded = expandedIndex === index;
        const isEditing = editingIndex === index;

        if (isEditing && editForm) {
          return (
            <StakeholderEditForm
              key={index}
              stakeholder={editForm}
              onChange={setEditForm}
              onSave={handleSaveEdit}
              onCancel={handleCancelEdit}
            />
          );
        }

        return (
          <div
            key={index}
            onClick={() => handleCardClick(index)}
            className="p-3 rounded-lg cursor-pointer transition-colors hover:bg-white/5"
            style={{ background: BG_ELEVATED }}
          >
            {/* Header row */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium" style={{ color: TEXT_PRIMARY }}>
                  {stakeholder.name}
                </span>
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase"
                  style={{ background: `${roleColor}20`, color: roleColor }}
                >
                  {roleLabel}
                </span>
              </div>
              <span className="text-[10px] font-mono" style={{ color: TEXT_DIM }}>
                {Math.round(stakeholder.confidence * 100)}%
              </span>
            </div>

            {/* Title */}
            {stakeholder.title && (
              <p className="text-xs mt-1" style={{ color: TEXT_MUTED }}>
                {stakeholder.title}
              </p>
            )}

            {/* Expanded content */}
            {isExpanded && (
              <div className="mt-3 pt-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                <p className="text-xs mb-2" style={{ color: TEXT_MUTED }}>
                  {stakeholder.context}
                </p>

                {stakeholder.contactInfo && (
                  <div className="flex flex-wrap gap-3 text-xs" style={{ color: TEXT_DIM }}>
                    {stakeholder.contactInfo.email && (
                      <span>📧 {stakeholder.contactInfo.email}</span>
                    )}
                    {stakeholder.contactInfo.phone && (
                      <span>📱 {stakeholder.contactInfo.phone}</span>
                    )}
                    {stakeholder.contactInfo.linkedin && (
                      <span>🔗 LinkedIn</span>
                    )}
                  </div>
                )}

                {onEdit && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditClick(index, stakeholder);
                    }}
                    className="mt-3 px-2 py-1 rounded text-xs transition-colors hover:bg-white/5"
                    style={{ color: TEXT_MUTED }}
                  >
                    Edit
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Add form */}
      {showAddForm && editForm && (
        <StakeholderEditForm
          stakeholder={editForm}
          onChange={setEditForm}
          onSave={handleSaveNew}
          onCancel={handleCancelAdd}
          isNew
        />
      )}
    </div>
  );
}

// Edit form subcomponent
function StakeholderEditForm({
  stakeholder,
  onChange,
  onSave,
  onCancel,
  isNew = false,
}: {
  stakeholder: Stakeholder;
  onChange: (s: Stakeholder) => void;
  onSave: () => void;
  onCancel: () => void;
  isNew?: boolean;
}) {
  const roles = Object.keys(ROLE_LABELS);

  return (
    <div className="p-3 rounded-lg space-y-3" style={{ background: BG_ELEVATED, border: '1px solid rgba(212,165,74,0.3)' }}>
      <input
        type="text"
        value={stakeholder.name}
        onChange={(e) => onChange({ ...stakeholder, name: e.target.value })}
        placeholder="Name"
        className="w-full px-2 py-1 rounded text-sm"
        style={{ background: BG_PRIMARY, color: TEXT_PRIMARY, border: '1px solid rgba(255,255,255,0.1)' }}
      />
      <input
        type="text"
        value={stakeholder.title || ''}
        onChange={(e) => onChange({ ...stakeholder, title: e.target.value })}
        placeholder="Title"
        className="w-full px-2 py-1 rounded text-sm"
        style={{ background: BG_PRIMARY, color: TEXT_PRIMARY, border: '1px solid rgba(255,255,255,0.1)' }}
      />
      <select
        value={stakeholder.role}
        onChange={(e) => onChange({ ...stakeholder, role: e.target.value })}
        className="w-full px-2 py-1 rounded text-sm"
        style={{ background: BG_PRIMARY, color: TEXT_PRIMARY, border: '1px solid rgba(255,255,255,0.1)' }}
      >
        {roles.map((role) => (
          <option key={role} value={role}>{ROLE_LABELS[role]}</option>
        ))}
      </select>
      <textarea
        value={stakeholder.context}
        onChange={(e) => onChange({ ...stakeholder, context: e.target.value })}
        placeholder="Context about this stakeholder..."
        className="w-full px-2 py-1 rounded text-sm resize-none"
        style={{ background: BG_PRIMARY, color: TEXT_PRIMARY, border: '1px solid rgba(255,255,255,0.1)', minHeight: '60px' }}
      />
      <div className="flex gap-2">
        <button onClick={onCancel} className="px-3 py-1 rounded text-xs" style={{ color: TEXT_MUTED }}>
          Cancel
        </button>
        <button onClick={onSave} className="px-3 py-1 rounded text-xs" style={{ background: GOLD, color: BG_PRIMARY }}>
          {isNew ? 'Add' : 'Save'}
        </button>
      </div>
    </div>
  );
}
