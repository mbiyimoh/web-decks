import React, { useState } from 'react';

// Color constants
const colors = {
  bg: '#111111',
  surface: '#1a1a1a',
  border: '#27272a',
  textPrimary: '#fafafa',
  textSecondary: '#a1a1aa',
  textMuted: '#71717a',
  gold: '#D4A84B',
  goldDim: 'rgba(212, 168, 75, 0.15)',
  green: '#4ADE80',
  greenDim: 'rgba(74, 222, 128, 0.15)',
  red: '#ef4444',
  redDim: 'rgba(239, 68, 68, 0.15)'
};

// Data
const stages = [
  { id: 'lead', name: 'Lead', short: 'LD' },
  { id: 'discovery', name: 'Discovery', short: 'DS' },
  { id: 'assessment', name: 'Assessment', short: 'AS' },
  { id: 'proposal', name: 'Proposal', short: 'PR' },
  { id: 'negotiation', name: 'Negotiation', short: 'NG' },
  { id: 'contract', name: 'Contract', short: 'CT' },
  { id: 'payment', name: 'Payment', short: 'PY' },
  { id: 'kickoff', name: 'Kickoff', short: 'KO' }
];

const weights = { strategic: 20, value: 20, readiness: 20, timeline: 20, bandwidth: 20 };

const intentClients = [
  { id: 'tradeblock', name: 'TradeBlock', industry: 'Sneaker Tech', color: '#22c55e', value: 50000, stageIndex: 7, scores: { strategic: 9, value: 8, readiness: 9, timeline: 8, bandwidth: 7 }, nextAction: 'Monthly check-in scheduled', nextActionDate: '2025-01-05', daysInStage: 25, contact: { name: 'Mbiyimoh Ghogomu', role: 'CEO' } },
  { id: 'plya', name: 'PLYA', industry: 'Consumer App', color: '#f97316', value: 45000, stageIndex: 3, scores: { strategic: 4, value: 9, readiness: 5, timeline: 5, bandwidth: 4 }, nextAction: 'Follow up on proposal review', nextActionDate: '2025-01-08', daysInStage: 12, contact: { name: 'Alex Rivera', role: 'Founder' } }
];

const funnelClients = [
  { id: 'scott', name: 'Scott Arnett', industry: 'Unknown', color: '#D4A84B', potentialValue: 25000, scores: { strategic: 5, value: 5, readiness: 5, timeline: 5, bandwidth: 5 }, discoveryComplete: false, assessmentComplete: false, readinessPercent: 15, decision: 'pending', contact: { name: 'Scott Arnett', role: 'Unknown' }, isNew: true, confidence: { overall: 'low' } },
  { id: 'slam', name: 'SLAM Magazine', industry: 'Media', color: '#ef4444', potentialValue: 75000, scores: { strategic: 8, value: 7, readiness: 3, timeline: 4, bandwidth: 5 }, discoveryComplete: false, assessmentComplete: false, readinessPercent: 25, decision: 'pending', contact: { name: 'Marcus Johnson', role: 'VP Digital' }, confidence: { overall: 'medium' } },
  { id: 'copyt', name: 'CoPyt', industry: 'Sneaker SaaS', color: '#3b82f6', potentialValue: 75000, scores: { strategic: 7, value: 6, readiness: 5, timeline: 6, bandwidth: 7 }, discoveryComplete: true, assessmentComplete: true, readinessPercent: 72, decision: 'pending', contact: { name: 'Jordan Williams', role: 'CEO' }, confidence: { overall: 'high' } },
  { id: 'premiumgoods', name: 'Premium Goods', industry: 'Retail', color: '#a855f7', potentialValue: 24000, scores: { strategic: 5, value: 6, readiness: 6, timeline: 7, bandwidth: 8 }, discoveryComplete: false, assessmentComplete: false, readinessPercent: 8, decision: 'pending', contact: { name: 'Jennifer Ford', role: 'Owner' }, confidence: { overall: 'low' } },
  { id: 'respira', name: 'Respira Global', industry: 'Wellness', color: '#14b8a6', potentialValue: 18000, scores: { strategic: 5, value: 5, readiness: 2, timeline: 2, bandwidth: 5 }, discoveryComplete: true, assessmentComplete: true, readinessPercent: 45, decision: 'no', contact: { name: 'Sarah Kim', role: 'Founder' }, confidence: { overall: 'high' } },
  { id: 'cynthiarichard', name: 'Cynthia Richard', industry: 'Luxury Footwear', color: '#ec4899', potentialValue: 24000, scores: { strategic: 6, value: 6, readiness: 5, timeline: 6, bandwidth: 7 }, discoveryComplete: false, assessmentComplete: false, readinessPercent: 20, decision: 'pending', contact: { name: 'Cynthia Richard', role: 'Founder' }, isNew: true, confidence: { overall: 'medium' } },
  { id: 'seicon', name: 'SEI-Con', industry: 'Sports Events', color: '#8b5cf6', potentialValue: 35000, scores: { strategic: 8, value: 7, readiness: 6, timeline: 7, bandwidth: 6 }, discoveryComplete: false, assessmentComplete: false, readinessPercent: 25, decision: 'pending', contact: { name: 'Shawn Garrity', role: 'Executive' }, isNew: true, confidence: { overall: 'high' } }
];

const closedDeals = [
  { id: 'wsbc', name: 'WSBC', industry: 'Sports Events', color: '#3b82f6', value: 15000, stageIndex: 3, closedDate: '2025-01-28', reason: 'Budget constraints - building in-house instead' }
];

const team = [
  { id: 'emily', name: 'Emily', role: 'Strategy', color: '#f97316', utilization: 55, allocated: [{ client: 'TradeBlock', percent: 10 }, { client: 'PLYA', percent: 20 }, { client: 'New Prospects', percent: 10 }, { client: '33S Internal', percent: 15 }] },
  { id: 'beems', name: 'Beems', role: 'Engineering', color: '#3b82f6', utilization: 75, allocated: [{ client: 'TradeBlock', percent: 35 }, { client: 'M33T Dev', percent: 20 }, { client: 'Products', percent: 20 }] },
  { id: 'pm', name: 'PM', role: 'Operations', color: '#a855f7', utilization: 55, allocated: [{ client: 'TradeBlock', percent: 15 }, { client: 'PLYA', percent: 20 }, { client: 'Coordination', percent: 20 }] },
  { id: 'marketing', name: 'Marketing', role: 'Content', color: '#22c55e', utilization: 70, allocated: [{ client: 'SP33D Content', percent: 40 }, { client: 'Client Onboarding', percent: 15 }, { client: '33S Marketing', percent: 15 }] }
];

// Utilities
const calculatePriority = (scores) => Object.keys(scores).reduce((t, k) => t + scores[k] * (weights[k] / 100), 0);
const formatCurrency = (n) => n >= 1000 ? '$' + (n / 1000).toFixed(0) + 'K' : '$' + n;

// Components
const StageDots = ({ stageIndex }) => (
  <div style={{ display: 'flex', gap: '4px' }}>
    {stages.map((stage, i) => (
      <div key={stage.id} style={{
        width: '12px', height: '12px', borderRadius: '50%', cursor: 'pointer',
        backgroundColor: i < stageIndex ? colors.green : i === stageIndex ? colors.gold : '#3f3f46',
        boxShadow: i === stageIndex ? `0 0 0 3px ${colors.goldDim}` : 'none'
      }} title={stage.name} />
    ))}
  </div>
);

const ProgressBar = ({ percent }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
    <div style={{ flex: 1, maxWidth: '60px', height: '6px', backgroundColor: colors.border, borderRadius: '3px', overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${percent}%`, backgroundColor: percent > 70 ? colors.green : percent > 40 ? colors.gold : colors.red, borderRadius: '3px' }} />
    </div>
    <span style={{ fontFamily: 'monospace', fontSize: '12px', color: colors.textSecondary }}>{percent}%</span>
  </div>
);

const ConfidenceBadge = ({ level }) => {
  const styles = { high: { bg: colors.greenDim, color: colors.green }, medium: { bg: colors.goldDim, color: colors.gold }, low: { bg: colors.redDim, color: colors.red } };
  const s = styles[level] || styles.low;
  return <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 600, backgroundColor: s.bg, color: s.color }}>{level === 'high' ? 'High' : level === 'medium' ? 'Med' : 'Low'}</span>;
};

const Stoplight = ({ decision }) => {
  const c = { yes: '#22c55e', no: '#ef4444', pending: '#eab308' };
  const l = { yes: 'Yes', no: 'No', pending: 'Pending' };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: c[decision] || c.pending }} />
      <span style={{ fontSize: '12px', color: colors.textSecondary }}>{l[decision] || 'Pending'}</span>
    </div>
  );
};

const IntakeStep = ({ number, title, description }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', padding: '20px', backgroundColor: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '12px' }}>
    <div style={{ width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '14px', flexShrink: 0, backgroundColor: colors.border }}>{number}</div>
    <div>
      <div style={{ fontWeight: 600, marginBottom: '4px' }}>{title}</div>
      <div style={{ fontSize: '12px', color: colors.textSecondary, lineHeight: 1.5 }}>{description}</div>
    </div>
  </div>
);

const CapacityCard = ({ member }) => {
  const available = 100 - member.utilization;
  const utilizationColor = member.utilization > 85 ? colors.red : member.utilization > 70 ? colors.gold : colors.green;
  const barColors = ['#3b82f6', '#22c55e', '#f97316', '#a855f7', '#14b8a6'];
  
  return (
    <div style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '12px', padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '11px', backgroundColor: `${member.color}20`, color: member.color }}>{member.name.substring(0, 2).toUpperCase()}</div>
          <div>
            <div style={{ fontWeight: 500, fontSize: '14px' }}>{member.name}</div>
            <div style={{ fontSize: '11px', color: colors.textMuted }}>{member.role}</div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'monospace', fontSize: '20px', fontWeight: 700, color: utilizationColor }}>{member.utilization}%</div>
          <div style={{ fontSize: '10px', color: colors.textMuted }}>utilized</div>
        </div>
      </div>
      <div style={{ height: '8px', backgroundColor: colors.border, borderRadius: '4px', overflow: 'hidden', display: 'flex' }}>
        {member.allocated.map((alloc, i) => <div key={i} style={{ width: `${alloc.percent}%`, height: '100%', backgroundColor: barColors[i % barColors.length] }} title={`${alloc.client}: ${alloc.percent}%`} />)}
      </div>
      <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {member.allocated.slice(0, 3).map((alloc, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: colors.textMuted }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '2px', backgroundColor: barColors[i % barColors.length] }} />
            {alloc.client}
          </div>
        ))}
        {available > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: colors.green }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '2px', backgroundColor: colors.green }} />
            {available}% available
          </div>
        )}
      </div>
    </div>
  );
};

const ClientModal = ({ client, type, onClose }) => {
  if (!client) return null;
  const priority = calculatePriority(client.scores);
  
  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }} onClick={onClose}>
      <div style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '16px', maxWidth: '600px', width: '100%', maxHeight: '85vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '24px', borderBottom: `1px solid ${colors.border}` }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '16px', backgroundColor: `${client.color}20`, color: client.color }}>{client.name.substring(0, 2).toUpperCase()}</div>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 600, margin: 0 }}>{client.name}</h2>
                <p style={{ fontSize: '13px', color: colors.textMuted, margin: '4px 0 0 0' }}>{client.industry} • {client.contact.name} ({client.contact.role})</p>
              </div>
            </div>
            <button onClick={onClose} style={{ width: '32px', height: '32px', backgroundColor: colors.border, border: 'none', borderRadius: '8px', color: colors.textSecondary, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          </div>
        </div>
        <div style={{ padding: '24px' }}>
          {type === 'intent' ? (
            <>
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '11px', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Sales Journey</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
                  {stages.map((stage, i) => (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                      <div style={{ width: '14px', height: '14px', borderRadius: '50%', backgroundColor: i < client.stageIndex ? colors.green : i === client.stageIndex ? colors.gold : '#3f3f46', boxShadow: i === client.stageIndex ? `0 0 0 3px ${colors.goldDim}` : 'none' }} />
                      <span style={{ fontSize: '9px', color: i === client.stageIndex ? colors.gold : colors.textMuted }}>{stage.short}</span>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: '12px', padding: '12px', backgroundColor: colors.goldDim, border: `1px solid rgba(212, 168, 75, 0.2)`, borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: colors.gold, fontWeight: 500 }}>Current: {stages[client.stageIndex].name}</div>
                  <div style={{ fontSize: '12px', color: colors.textSecondary, marginTop: '4px' }}>{client.daysInStage} days in this stage</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
                <div style={{ padding: '16px', backgroundColor: colors.bg, borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontFamily: 'monospace', fontSize: '24px', fontWeight: 700, color: colors.green }}>{formatCurrency(client.value)}</div>
                  <div style={{ fontSize: '11px', color: colors.textMuted }}>Contract Value</div>
                </div>
                <div style={{ padding: '16px', backgroundColor: colors.bg, borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontFamily: 'monospace', fontSize: '24px', fontWeight: 700, color: colors.gold }}>{priority.toFixed(1)}</div>
                  <div style={{ fontSize: '11px', color: colors.textMuted }}>Priority Score</div>
                </div>
                <div style={{ padding: '16px', backgroundColor: colors.bg, borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontFamily: 'monospace', fontSize: '24px', fontWeight: 700, color: colors.textSecondary }}>{client.daysInStage}d</div>
                  <div style={{ fontSize: '11px', color: colors.textMuted }}>Days in Stage</div>
                </div>
              </div>
              <div style={{ padding: '16px', backgroundColor: colors.bg, borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Next Action</div>
                <div style={{ fontSize: '14px' }}>{client.nextAction}</div>
                <div style={{ fontSize: '12px', color: colors.textMuted, marginTop: '4px' }}>{client.nextActionDate}</div>
              </div>
            </>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '24px' }}>
                <div style={{ padding: '16px', backgroundColor: colors.bg, borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontFamily: 'monospace', fontSize: '24px', fontWeight: 700, color: colors.textSecondary }}>{formatCurrency(client.potentialValue)}</div>
                  <div style={{ fontSize: '11px', color: colors.textMuted }}>Potential Value</div>
                </div>
                <div style={{ padding: '16px', backgroundColor: colors.bg, borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontFamily: 'monospace', fontSize: '24px', fontWeight: 700, color: colors.gold }}>{client.readinessPercent}%</div>
                  <div style={{ fontSize: '11px', color: colors.textMuted }}>Readiness</div>
                </div>
              </div>
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '11px', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Progress</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                  <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: client.discoveryComplete ? colors.greenDim : colors.bg, border: client.discoveryComplete ? `1px solid rgba(74, 222, 128, 0.2)` : 'none' }}>
                    <div style={{ fontSize: '14px', fontWeight: 500 }}>{client.discoveryComplete ? '✓' : '○'} Discovery</div>
                  </div>
                  <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: client.assessmentComplete ? colors.greenDim : colors.bg, border: client.assessmentComplete ? `1px solid rgba(74, 222, 128, 0.2)` : 'none' }}>
                    <div style={{ fontSize: '14px', fontWeight: 500 }}>{client.assessmentComplete ? '✓' : '○'} Assessment</div>
                  </div>
                </div>
              </div>
              <div style={{ padding: '16px', backgroundColor: colors.bg, borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Confidence</div>
                <ConfidenceBadge level={client.confidence?.overall} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const IntakeModal = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(1);
  const [method, setMethod] = useState(null);
  
  if (!isOpen) return null;
  
  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }} onClick={onClose}>
      <div style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '16px', maxWidth: '800px', width: '100%', maxHeight: '85vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '24px', borderBottom: `1px solid ${colors.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>Add New Prospect</h2>
              <p style={{ fontSize: '12px', color: colors.textMuted, margin: '4px 0 0 0' }}>Choose how to start the intake process</p>
            </div>
            <button onClick={onClose} style={{ width: '32px', height: '32px', backgroundColor: colors.border, border: 'none', borderRadius: '8px', color: colors.textSecondary, cursor: 'pointer' }}>✕</button>
          </div>
        </div>
        <div style={{ padding: '24px' }}>
          {step === 1 && (
            <>
              <div style={{ fontSize: '11px', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>Step 1: Choose Input Method</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                {[
                  { id: 'granola', icon: '🎙️', title: 'Upload Granola Notes', desc: 'Import transcript from discovery call' },
                  { id: 'canvas', icon: '🎯', title: 'Clarity Canvas', desc: 'Guided persona sharpener interview' },
                  { id: 'manual', icon: '✏️', title: 'Manual Entry', desc: 'Enter basic company info directly' },
                  { id: 'portal', icon: '🔗', title: 'Client Portal Link', desc: 'Import from existing 33S portal' }
                ].map(opt => (
                  <button key={opt.id} onClick={() => { setMethod(opt.id); setStep(2); }} style={{ padding: '20px', backgroundColor: method === opt.id ? colors.goldDim : colors.bg, border: `1px solid ${method === opt.id ? colors.gold : colors.border}`, borderRadius: '12px', cursor: 'pointer', textAlign: 'left', color: colors.textPrimary }}>
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>{opt.icon}</div>
                    <div style={{ fontWeight: 600, marginBottom: '4px' }}>{opt.title}</div>
                    <div style={{ fontSize: '12px', color: colors.textSecondary }}>{opt.desc}</div>
                  </button>
                ))}
              </div>
            </>
          )}
          {step === 2 && (
            <>
              <div style={{ fontSize: '11px', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>Step 2: Enter Information</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <input type="text" placeholder="Company / Contact Name" style={{ width: '100%', padding: '12px 16px', backgroundColor: colors.bg, border: `1px solid ${colors.border}`, borderRadius: '8px', color: colors.textPrimary, fontSize: '14px', outline: 'none' }} />
                <input type="text" placeholder="Industry" style={{ width: '100%', padding: '12px 16px', backgroundColor: colors.bg, border: `1px solid ${colors.border}`, borderRadius: '8px', color: colors.textPrimary, fontSize: '14px', outline: 'none' }} />
                <textarea placeholder="Initial notes..." rows={4} style={{ width: '100%', padding: '12px 16px', backgroundColor: colors.bg, border: `1px solid ${colors.border}`, borderRadius: '8px', color: colors.textPrimary, fontSize: '14px', outline: 'none', resize: 'none' }} />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button onClick={() => setStep(1)} style={{ padding: '12px 20px', backgroundColor: colors.border, border: 'none', borderRadius: '8px', color: colors.textSecondary, fontSize: '13px', cursor: 'pointer' }}>← Back</button>
                <button onClick={() => setStep(3)} style={{ flex: 1, padding: '12px 20px', background: `linear-gradient(135deg, ${colors.gold}, #c49a3d)`, border: 'none', borderRadius: '8px', color: '#000', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>Process with AI Research →</button>
              </div>
            </>
          )}
          {step === 3 && (
            <>
              <div style={{ fontSize: '11px', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>Step 3: Review AI Enrichment</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[{ label: 'Company Info', conf: 'high', note: 'Name, industry, size verified' }, { label: 'Contact Details', conf: 'medium', note: 'Role confirmed, need decision-maker status' }, { label: 'Problem/Opportunity Fit', conf: 'low', note: 'Needs discovery call' }, { label: 'Budget & Timeline', conf: 'low', note: 'No signals found' }].map((item, i) => (
                  <div key={i} style={{ padding: '16px', backgroundColor: colors.bg, borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontWeight: 500, fontSize: '14px' }}>{item.label}</span>
                      <ConfidenceBadge level={item.conf} />
                    </div>
                    <div style={{ fontSize: '12px', color: colors.textSecondary }}>{item.note}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button onClick={() => setStep(2)} style={{ padding: '12px 20px', backgroundColor: colors.border, border: 'none', borderRadius: '8px', color: colors.textSecondary, fontSize: '13px', cursor: 'pointer' }}>← Back</button>
                <button onClick={onClose} style={{ flex: 1, padding: '12px 20px', background: `linear-gradient(135deg, ${colors.green}, #22c55e)`, border: 'none', borderRadius: '8px', color: '#000', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>✓ Add to Pipeline</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default function AdminDashboard() {
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientType, setClientType] = useState(null);
  const [showIntake, setShowIntake] = useState(false);
  const [showClosed, setShowClosed] = useState(false);
  
  const totalPipeline = intentClients.reduce((s, c) => s + c.value, 0) + funnelClients.reduce((s, c) => s + c.potentialValue, 0);
  const intentValue = intentClients.reduce((s, c) => s + c.value, 0);
  const funnelValue = funnelClients.reduce((s, c) => s + c.potentialValue, 0);
  
  const sortedIntent = [...intentClients].sort((a, b) => calculatePriority(b.scores) - calculatePriority(a.scores));
  const sortedFunnel = [...funnelClients].sort((a, b) => {
    if (a.isNew && !b.isNew) return -1;
    if (!a.isNew && b.isNew) return 1;
    return calculatePriority(b.scores) - calculatePriority(a.scores);
  });

  const thStyle = { textAlign: 'left', padding: '12px 16px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: colors.textMuted, borderBottom: `1px solid ${colors.border}` };
  const tdStyle = { padding: '16px', borderBottom: `1px solid rgba(255,255,255,0.03)`, verticalAlign: 'middle' };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: colors.bg, color: colors.textPrimary, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      {/* Header */}
      <header style={{ borderBottom: `1px solid ${colors.border}`, backgroundColor: colors.surface }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '40px', height: '40px', background: `linear-gradient(135deg, ${colors.gold}, #c49a3d)`, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '16px' }}>33</div>
            <div>
              <h1 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>Mission Control</h1>
              <p style={{ fontSize: '12px', color: colors.textMuted, margin: 0 }}>V1 • Weekly Pipeline Review</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pipeline Value</div>
              <div style={{ fontFamily: 'monospace', fontSize: '20px', fontWeight: 700, color: colors.gold }}>${Math.round(totalPipeline / 1000)}K</div>
            </div>
            <div style={{ width: '1px', height: '32px', backgroundColor: colors.border }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
              <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #f97316, #ea580c)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 600 }}>EB</div>
              <span style={{ fontSize: '14px', fontWeight: 500 }}>Emily</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 24px' }}>
        
        {/* Section 0: Intake */}
        <section style={{ marginBottom: '48px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 0', borderBottom: `1px solid ${colors.border}` }}>
            <div style={{ width: '28px', height: '28px', background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '14px' }}>+</div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>New Client Intake</h2>
              <p style={{ fontSize: '12px', color: colors.textMuted, margin: '2px 0 0 0' }}>Add prospects via Clarity Canvas, Granola notes, or manual entry</p>
            </div>
            <button onClick={() => setShowIntake(true)} style={{ marginLeft: 'auto', padding: '10px 20px', background: `linear-gradient(135deg, ${colors.gold}, #c49a3d)`, border: 'none', borderRadius: '8px', color: '#000', fontWeight: 600, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px' }}>+</span> Add New Prospect
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', paddingTop: '20px' }}>
            <IntakeStep number="1" title="Initial Input" description="Upload Granola notes from discovery call, complete Persona Sharpener, or manually enter basic info" />
            <IntakeStep number="2" title="AI Deep Research" description="System enriches data with online research, fills assumptions about company, industry, and opportunity fit" />
            <IntakeStep number="3" title="Review & Enrich" description="Emily/Beems review confidence scores, fill gaps in low-confidence areas, add verbal context" />
          </div>
        </section>

        {/* Section 1: Intent to Money */}
        <section style={{ marginBottom: '48px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 0', borderBottom: `1px solid ${colors.border}` }}>
            <div style={{ width: '28px', height: '28px', background: `linear-gradient(135deg, ${colors.gold}, #c49a3d)`, borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '14px' }}>1</div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Intent → Money</h2>
              <p style={{ fontSize: '12px', color: colors.textMuted, margin: '2px 0 0 0' }}>Clients we've decided to pursue • Ranked by priority score</p>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: colors.textMuted }}>{intentClients.length} active</span>
              <span style={{ fontSize: '12px', color: colors.green }}>{formatCurrency(intentValue)} pipeline</span>
            </div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ ...thStyle, width: '40px' }}>#</th>
                <th style={thStyle}>Client</th>
                <th style={{ ...thStyle, width: '200px' }}>Stage Progress</th>
                <th style={{ ...thStyle, width: '100px' }}>Value</th>
                <th style={{ ...thStyle, width: '80px' }}>Priority</th>
                <th style={{ ...thStyle, width: '200px' }}>Next Action</th>
                <th style={{ ...thStyle, width: '80px' }}>Days</th>
              </tr>
            </thead>
            <tbody>
              {sortedIntent.map((client, index) => (
                <tr key={client.id} style={{ cursor: 'pointer' }} onClick={() => { setSelectedClient(client); setClientType('intent'); }}>
                  <td style={tdStyle}>
                    <div style={{ width: '24px', height: '24px', background: index === 0 ? `linear-gradient(135deg, ${colors.gold}, #c49a3d)` : colors.border, borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 600 }}>{index + 1}</div>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '36px', height: '36px', backgroundColor: `${client.color}20`, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: client.color, fontWeight: 600, fontSize: '12px' }}>{client.name.substring(0, 2).toUpperCase()}</div>
                      <div>
                        <div style={{ fontWeight: 500 }}>{client.name}</div>
                        <div style={{ fontSize: '12px', color: colors.textMuted }}>{client.industry}</div>
                      </div>
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <StageDots stageIndex={client.stageIndex} />
                    <div style={{ fontSize: '11px', color: colors.textMuted, marginTop: '4px' }}>{stages[client.stageIndex].name}</div>
                  </td>
                  <td style={tdStyle}><span style={{ fontFamily: 'monospace', fontWeight: 600, color: colors.green }}>{formatCurrency(client.value)}</span></td>
                  <td style={tdStyle}><span style={{ fontFamily: 'monospace', fontSize: '18px', fontWeight: 700, color: colors.gold }}>{calculatePriority(client.scores).toFixed(1)}</span></td>
                  <td style={tdStyle}>
                    <div style={{ fontSize: '13px' }}>{client.nextAction}</div>
                    <div style={{ fontSize: '11px', color: colors.textMuted }}>{client.nextActionDate}</div>
                  </td>
                  <td style={tdStyle}><span style={{ fontFamily: 'monospace', fontSize: '13px', color: client.daysInStage > 14 ? colors.red : colors.textSecondary }}>{client.daysInStage}d</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Section 2: Top of Funnel */}
        <section style={{ marginBottom: '48px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 0', borderBottom: `1px solid ${colors.border}` }}>
            <div style={{ width: '28px', height: '28px', background: `linear-gradient(135deg, ${colors.gold}, #c49a3d)`, borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '14px' }}>2</div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Top of Funnel</h2>
              <p style={{ fontSize: '12px', color: colors.textMuted, margin: '2px 0 0 0' }}>Still gathering info or haven't decided • Ranked by weighted score</p>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: colors.textMuted }}>{funnelClients.length} prospects</span>
              <span style={{ fontSize: '12px', color: colors.textSecondary }}>{formatCurrency(funnelValue)} potential</span>
            </div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ ...thStyle, width: '40px' }}>#</th>
                <th style={thStyle}>Client</th>
                <th style={{ ...thStyle, width: '80px', textAlign: 'center' }}>Discovery</th>
                <th style={{ ...thStyle, width: '80px', textAlign: 'center' }}>Assessment</th>
                <th style={{ ...thStyle, width: '100px' }}>Readiness</th>
                <th style={{ ...thStyle, width: '80px' }}>Confidence</th>
                <th style={{ ...thStyle, width: '100px' }}>Potential</th>
                <th style={{ ...thStyle, width: '100px' }}>Decision</th>
              </tr>
            </thead>
            <tbody>
              {sortedFunnel.map((client, index) => (
                <tr key={client.id} style={{ cursor: 'pointer', borderLeft: client.isNew ? `3px solid ${colors.gold}` : 'none' }} onClick={() => { setSelectedClient(client); setClientType('funnel'); }}>
                  <td style={tdStyle}>
                    <div style={{ width: '24px', height: '24px', background: client.isNew ? `linear-gradient(135deg, ${colors.gold}, #c49a3d)` : colors.border, borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 600, color: client.isNew ? '#000' : colors.textMuted }}>{client.isNew ? '★' : index + 1}</div>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '36px', height: '36px', backgroundColor: `${client.color}20`, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: client.color, fontWeight: 600, fontSize: '12px' }}>{client.name.substring(0, 2).toUpperCase()}</div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: 500 }}>{client.name}</span>
                          {client.isNew && <span style={{ fontSize: '9px', padding: '2px 6px', backgroundColor: colors.goldDim, color: colors.gold, borderRadius: '4px', fontWeight: 600 }}>NEW</span>}
                        </div>
                        <div style={{ fontSize: '12px', color: colors.textMuted }}>{client.industry}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>{client.discoveryComplete ? <span style={{ color: colors.green }}>✓</span> : <span style={{ color: colors.textMuted }}>—</span>}</td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>{client.assessmentComplete ? <span style={{ color: colors.green }}>✓</span> : <span style={{ color: colors.textMuted }}>—</span>}</td>
                  <td style={tdStyle}><ProgressBar percent={client.readinessPercent} /></td>
                  <td style={tdStyle}><ConfidenceBadge level={client.confidence?.overall} /></td>
                  <td style={tdStyle}><span style={{ fontFamily: 'monospace', fontSize: '13px', color: colors.textSecondary }}>{formatCurrency(client.potentialValue)}</span></td>
                  <td style={tdStyle}><Stoplight decision={client.decision} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Section 3: Closed/Lost */}
        <section style={{ marginBottom: '48px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 0', borderBottom: `1px solid ${colors.border}` }}>
            <div style={{ width: '28px', height: '28px', background: 'linear-gradient(135deg, #71717a, #52525b)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '14px' }}>✕</div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Closed / Lost</h2>
              <p style={{ fontSize: '12px', color: colors.textMuted, margin: '2px 0 0 0' }}>Deals that didn't close • Learning opportunities</p>
            </div>
            <button onClick={() => setShowClosed(!showClosed)} style={{ marginLeft: 'auto', padding: '6px 12px', backgroundColor: colors.border, border: 'none', borderRadius: '6px', color: colors.textSecondary, fontSize: '12px', cursor: 'pointer' }}>{showClosed ? 'Hide Details' : 'Show Details'}</button>
          </div>
          {showClosed && (
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '16px' }}>
              <thead>
                <tr>
                  <th style={thStyle}>Client</th>
                  <th style={thStyle}>Stage Reached</th>
                  <th style={thStyle}>Value</th>
                  <th style={thStyle}>Reason</th>
                  <th style={thStyle}>Date</th>
                </tr>
              </thead>
              <tbody>
                {closedDeals.map(deal => (
                  <tr key={deal.id} style={{ opacity: 0.6 }}>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '36px', height: '36px', backgroundColor: `${deal.color}15`, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: `${deal.color}80`, fontWeight: 600, fontSize: '12px' }}>{deal.name.substring(0, 2).toUpperCase()}</div>
                        <div>
                          <div style={{ fontWeight: 500, color: colors.textSecondary }}>{deal.name}</div>
                          <div style={{ fontSize: '12px', color: colors.textMuted }}>{deal.industry}</div>
                        </div>
                      </div>
                    </td>
                    <td style={tdStyle}><span style={{ fontSize: '12px', color: colors.textMuted }}>{stages[deal.stageIndex].name}</span></td>
                    <td style={tdStyle}><span style={{ fontFamily: 'monospace', fontSize: '13px', color: colors.textMuted }}>{formatCurrency(deal.value)}</span></td>
                    <td style={tdStyle}><div style={{ fontSize: '12px', color: colors.textSecondary, maxWidth: '250px' }}>{deal.reason}</div></td>
                    <td style={tdStyle}><span style={{ fontSize: '12px', color: colors.textMuted }}>{deal.closedDate}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* Section 4: Team Capacity */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 0', borderBottom: `1px solid ${colors.border}` }}>
            <div style={{ width: '28px', height: '28px', background: `linear-gradient(135deg, ${colors.gold}, #c49a3d)`, borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '14px' }}>4</div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Team Capacity</h2>
              <p style={{ fontSize: '12px', color: colors.textMuted, margin: '2px 0 0 0' }}>Current allocation • Can we take on more?</p>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', paddingTop: '20px' }}>
            {team.map(member => <CapacityCard key={member.id} member={member} />)}
          </div>
        </section>
      </main>

      {/* Modals */}
      {selectedClient && <ClientModal client={selectedClient} type={clientType} onClose={() => { setSelectedClient(null); setClientType(null); }} />}
      <IntakeModal isOpen={showIntake} onClose={() => setShowIntake(false)} />
    </div>
  );
}
