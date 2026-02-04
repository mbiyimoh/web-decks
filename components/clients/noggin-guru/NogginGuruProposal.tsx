'use client';

import React, { useState } from 'react';

// Shared deck components
import { Section } from '@/components/deck/Section';
import { RevealText } from '@/components/deck/RevealText';
import { ProgressBar } from '@/components/deck/ProgressBar';
import { SectionLabel } from '@/components/deck/SectionLabel';

// Design tokens
import {
  GOLD,
  GOLD_DIM,
  GREEN,
  GREEN_DIM,
  BG_PRIMARY,
  BG_SURFACE,
  BG_ELEVATED,
  TEXT_PRIMARY,
  TEXT_MUTED,
  TEXT_DIM,
  BORDER,
} from '@/lib/design-tokens';

// ============================================================================
// SVG ICONS (no emojis per design system)
// ============================================================================

const GraduationIcon = ({ size = 16, color = GOLD }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L2 7l10 5 10-5-10-5z" />
    <path d="M2 17l10 5 10-5" />
    <path d="M2 12l10 5 10-5" />
  </svg>
);

const TargetIcon = ({ size = 18, color = GOLD }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

const DocumentIcon = ({ size = 18, color = GOLD }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);

const FinanceIcon = ({ size = 18, color = GOLD }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="4" height="13" rx="1" />
    <rect x="10" y="4" width="4" height="16" rx="1" />
    <rect x="18" y="10" width="4" height="10" rx="1" />
  </svg>
);

const MegaphoneIcon = ({ size = 18, color = GOLD }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 01-3.46 0" />
    <line x1="12" y1="2" x2="12" y2="4" />
  </svg>
);

const GrowthIcon = ({ size = 14, color = GREEN }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round">
    <polyline points="2 12 6 6 10 9 14 3" />
    <polyline points="10 3 14 3 14 7" />
  </svg>
);

const PauseIcon = ({ size = 14, color = '#f87171' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round">
    <circle cx="8" cy="8" r="6" />
    <line x1="6" y1="6" x2="6" y2="10" />
    <line x1="10" y1="6" x2="10" y2="10" />
  </svg>
);

const LightbulbIcon = ({ size = 14, color = TEXT_DIM }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 1a5 5 0 00-2 9.58V12h4v-1.42A5 5 0 008 1z" />
    <line x1="6" y1="14" x2="10" y2="14" />
  </svg>
);

const ChevronIcon = ({ size = 14, color = TEXT_DIM }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="4 2 12 8 4 14" />
  </svg>
);

// ============================================================================
// DECK-SPECIFIC COMPONENTS
// ============================================================================

const Headline = ({ children }: { children: React.ReactNode }) => (
  <h2 className="font-display text-3xl md:text-4xl lg:text-5xl mb-6" style={{ lineHeight: 1.15, color: TEXT_PRIMARY }}>
    {children}
  </h2>
);

const BodyText = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <p className={`font-body text-base md:text-lg leading-relaxed max-w-[600px] ${className}`} style={{ color: TEXT_MUTED }}>
    {children}
  </p>
);

// Expandable Component
const Expandable = ({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div
      className="rounded-xl border overflow-hidden mb-3"
      style={{ background: BG_SURFACE, borderColor: BORDER }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 px-5 flex items-center justify-between bg-transparent border-none cursor-pointer text-left"
      >
        <span className="font-body text-[15px] font-medium" style={{ color: TEXT_PRIMARY }}>
          {title}
        </span>
        <span
          className="transition-transform duration-200"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
            color: TEXT_DIM,
          }}
        >
          <ChevronIcon size={12} color={TEXT_DIM} />
        </span>
      </button>

      {isOpen && (
        <div className="px-5 pb-5" style={{ borderTop: `1px solid ${BORDER}` }}>
          {children}
        </div>
      )}
    </div>
  );
};

// Domain Tab Component
const DomainTab = ({
  domain,
  isActive,
  onClick,
  icon,
}: {
  domain: string;
  isActive: boolean;
  onClick: () => void;
  icon: React.ReactNode;
}) => (
  <button
    onClick={onClick}
    className="font-body text-sm font-medium cursor-pointer transition-all duration-200 flex items-center gap-2 rounded-lg px-4 py-2.5"
    style={{
      background: isActive ? BG_ELEVATED : 'transparent',
      color: isActive ? GOLD : TEXT_DIM,
      border: isActive ? `1px solid ${GOLD}` : `1px solid ${BORDER}`,
    }}
  >
    {icon}
    {domain}
  </button>
);

// ============================================================================
// DATA
// ============================================================================

const domains: Record<
  string,
  {
    icon: React.ReactNode;
    summary: string;
    projects: string[];
    metrics: string[];
    note: string;
  }
> = {
  'M&A': {
    icon: <TargetIcon size={16} />,
    summary: 'Build intelligence infrastructure for smarter target identification and market mapping.',
    projects: [
      'M&A target/prospect database expansion',
      'Automated market mapping and competitive analysis',
      'Founder/company intelligence gathering',
    ],
    metrics: [
      '# of qualified targets identified',
      'Time saved on research (hours/week)',
      'Coverage improvement (% of market mapped)',
    ],
    note: 'This may be a direct collaboration with Rob, separate from the 3 fellowship slots.',
  },
  Content: {
    icon: <DocumentIcon size={16} />,
    summary: "Scale and systematize content creation — the core of what Noggin Guru does.",
    projects: [
      'Content creation workflow optimization',
      'AI-assisted first-draft generation',
      'Cross-company content repurposing',
    ],
    metrics: ['Content production volume (pieces/week)', 'Time-to-publish reduction (%)', 'Quality score maintenance'],
    note: 'High leverage — patterns here apply across all acquired companies.',
  },
  Finance: {
    icon: <FinanceIcon size={16} />,
    summary: 'Bounded, high-ROI automation projects with clear efficiency gains.',
    projects: ['Revenue recognition automation', 'Collections process improvement', 'Financial close acceleration'],
    metrics: ['Manual steps eliminated (#)', 'Cycle time reduction (%)', 'Error rate improvement'],
    note: 'Self-contained projects with measurable before/after.',
  },
  Marketing: {
    icon: <MegaphoneIcon size={16} />,
    summary: 'Seed AI capabilities into marketing for campaign optimization and lead generation.',
    projects: ['Campaign generation and A/B testing', 'Lead scoring and prioritization', 'Personalization at scale'],
    metrics: ['Campaign performance improvement (%)', 'Lead quality score', 'Time-to-launch reduction'],
    note: 'Less defined than other domains — good for someone with initiative.',
  },
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function NogginGuruProposal() {
  const [activeDomain, setActiveDomain] = useState('M&A');

  return (
    <div className="font-body" style={{ background: BG_PRIMARY, color: TEXT_PRIMARY }}>
      <ProgressBar />

      {/* ── Hero Section ── */}
      <Section id="hero">
        <div className="max-w-[800px] mx-auto">
          <RevealText>
            <div
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-6"
              style={{ background: GOLD_DIM }}
            >
              <GraduationIcon size={14} color={GOLD} />
              <span
                className="text-xs font-medium tracking-[0.1em] uppercase"
                style={{ color: GOLD, fontFamily: 'JetBrains Mono' }}
              >
                AI Fellowship Program
              </span>
            </div>
          </RevealText>

          <RevealText delay={0.1}>
            <Headline>
              Build <span style={{ color: GOLD }}>Champions</span>,
              <br />
              Not Dependency
            </Headline>
          </RevealText>

          <RevealText delay={0.2}>
            <BodyText>
              AI isn&apos;t your rally cry this quarter — and that&apos;s smart. But the window to build internal
              capability before Phase 2 is now.
            </BodyText>
            <BodyText className="mt-4">
              Here&apos;s how we use the next 8 weeks to create momentum without boiling the ocean.
            </BodyText>
          </RevealText>

          <RevealText delay={0.3}>
            <div className="mt-10 flex gap-4 flex-wrap">
              {[
                { value: '8', label: 'Weeks' },
                { value: '3', label: 'Fellows' },
                { value: '2hrs', label: 'Per Week Each' },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="rounded-xl p-4 px-6 text-center border"
                  style={{ background: BG_SURFACE, borderColor: BORDER }}
                >
                  <p className="font-display text-[28px] mb-1" style={{ color: GOLD }}>
                    {stat.value}
                  </p>
                  <p className="text-xs uppercase tracking-[0.05em]" style={{ color: TEXT_DIM }}>
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </RevealText>
        </div>
      </Section>

      {/* ── The Model Section ── */}
      <Section id="model">
        <div className="max-w-[900px] mx-auto">
          <RevealText>
            <SectionLabel number="01" label="The Model" />
          </RevealText>
          <RevealText delay={0.1}>
            <Headline>
              Teach Them to <span style={{ color: GOLD }}>Fish</span>
            </Headline>
          </RevealText>
          <RevealText delay={0.2}>
            <BodyText className="mb-12">
              This isn&apos;t a consulting engagement where we build everything for you. It&apos;s a capability transfer
              where your people become the experts.
            </BodyText>
          </RevealText>

          <RevealText delay={0.3}>
            <div className="grid md:grid-cols-2 gap-6">
              {/* My Role */}
              <div
                className="rounded-2xl p-7 border"
                style={{ background: 'rgba(255,255,255,0.03)', borderColor: GOLD_DIM }}
              >
                <h3
                  className="text-xs font-medium tracking-[0.1em] uppercase mb-5"
                  style={{ color: GOLD, fontFamily: 'JetBrains Mono' }}
                >
                  What I Do
                </h3>
                <div className="flex flex-col gap-3">
                  {[
                    'Scope and architect use cases',
                    'Introduce AI tools and workflows',
                    'Provide feedback and refinement',
                    'Design experiments and activities',
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      <span style={{ color: GOLD, fontSize: 14 }}>&rarr;</span>
                      <span className="text-[15px]" style={{ color: '#d4d4d4' }}>
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fellow Role */}
              <div
                className="rounded-2xl p-7 border"
                style={{ background: 'rgba(255,255,255,0.03)', borderColor: GREEN_DIM }}
              >
                <h3
                  className="text-xs font-medium tracking-[0.1em] uppercase mb-5"
                  style={{ color: GREEN, fontFamily: 'JetBrains Mono' }}
                >
                  What Fellows Do
                </h3>
                <div className="flex flex-col gap-3">
                  {[
                    'Build and iterate hands-on',
                    'Apply learnings in their workflows',
                    'Document what works',
                    'Become go-to advocates',
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      <span style={{ color: GREEN, fontSize: 14 }}>&rarr;</span>
                      <span className="text-[15px]" style={{ color: '#d4d4d4' }}>
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </RevealText>
        </div>
      </Section>

      {/* ── Three Deliverables Section ── */}
      <Section id="deliverables">
        <div className="max-w-[700px] mx-auto">
          <RevealText>
            <SectionLabel number="02" label="What Each Fellow Gets" />
          </RevealText>
          <RevealText delay={0.1}>
            <Headline>
              Three <span style={{ color: GOLD }}>Deliverables</span>
            </Headline>
          </RevealText>

          <div className="flex flex-col gap-4 mt-10">
            {[
              {
                number: '01',
                title: 'A Scoped Mission',
                description:
                  'A clearly defined project tied to a real business objective with measurable success criteria.',
                detail:
                  'First 1-2 weeks focus on using AI to refine the objective itself and define what winning looks like.',
              },
              {
                number: '02',
                title: 'A Tangible Deliverable',
                description:
                  'A working workflow, mini-tool, or process improvement that demonstrates "life is better."',
                detail: "Not a deck or a recommendation — something that actually runs and creates value.",
              },
              {
                number: '03',
                title: 'AI Fluency',
                description:
                  'The mindset, patterns, and confidence to keep building after the 8 weeks end.',
                detail: 'They become the person their team asks "how do I use AI for this?"',
              },
            ].map((item, i) => (
              <RevealText key={i} delay={0.2 + i * 0.1}>
                <div
                  className="rounded-2xl p-6 border flex items-start gap-5"
                  style={{ background: BG_SURFACE, borderColor: BORDER }}
                >
                  <span className="font-display text-[32px] shrink-0" style={{ color: GOLD_DIM, lineHeight: 1 }}>
                    {item.number}
                  </span>
                  <div className="flex-1">
                    <h3 className="font-body text-lg font-semibold mb-2" style={{ color: TEXT_PRIMARY }}>
                      {item.title}
                    </h3>
                    <p className="font-body text-[15px] leading-relaxed mb-3" style={{ color: TEXT_MUTED }}>
                      {item.description}
                    </p>
                    <p className="font-body text-[13px] italic" style={{ color: TEXT_DIM }}>
                      {item.detail}
                    </p>
                  </div>
                </div>
              </RevealText>
            ))}
          </div>
        </div>
      </Section>

      {/* ── Candidate Domains Section ── */}
      <Section id="domains">
        <div className="max-w-[900px] mx-auto">
          <RevealText>
            <SectionLabel number="03" label="Where We Focus" />
          </RevealText>
          <RevealText delay={0.1}>
            <Headline>
              Candidate <span style={{ color: GOLD }}>Domains</span>
            </Headline>
          </RevealText>
          <RevealText delay={0.15}>
            <BodyText className="mb-8">
              Four domains with high-impact AI opportunities. Product is explicitly excluded from Phase 1 (they&apos;re
              focused on the reports rewrite).
            </BodyText>
          </RevealText>

          <RevealText delay={0.2}>
            {/* Domain Tabs */}
            <div className="flex gap-2.5 flex-wrap mb-5">
              {Object.keys(domains).map((domain) => (
                <DomainTab
                  key={domain}
                  domain={domain}
                  icon={domains[domain].icon}
                  isActive={activeDomain === domain}
                  onClick={() => setActiveDomain(domain)}
                />
              ))}
            </div>

            {/* Active Domain Content */}
            <div className="rounded-2xl border overflow-hidden" style={{ background: BG_SURFACE, borderColor: BORDER }}>
              <div className="p-6" style={{ borderBottom: `1px solid ${BORDER}` }}>
                <p className="font-body text-base leading-relaxed" style={{ color: '#d4d4d4' }}>
                  {domains[activeDomain].summary}
                </p>
              </div>

              <div
                className="grid md:grid-cols-2"
                style={{ borderBottom: `1px solid ${BORDER}` }}
              >
                <div className="p-6" style={{ borderRight: `1px solid ${BORDER}` }}>
                  <h4
                    className="text-[11px] font-medium uppercase tracking-[0.05em] mb-3"
                    style={{ color: TEXT_DIM, fontFamily: 'JetBrains Mono' }}
                  >
                    Likely Projects
                  </h4>
                  <ul className="m-0 p-0 list-none">
                    {domains[activeDomain].projects.map((project, i) => (
                      <li key={i} className="text-sm py-1.5 flex items-start gap-2" style={{ color: TEXT_MUTED }}>
                        <span style={{ color: GOLD }}>&bull;</span>
                        {project}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-6">
                  <h4
                    className="text-[11px] font-medium uppercase tracking-[0.05em] mb-3"
                    style={{ color: TEXT_DIM, fontFamily: 'JetBrains Mono' }}
                  >
                    Success Metrics
                  </h4>
                  <ul className="m-0 p-0 list-none">
                    {domains[activeDomain].metrics.map((metric, i) => (
                      <li key={i} className="text-sm py-1.5 flex items-start gap-2" style={{ color: TEXT_MUTED }}>
                        <GrowthIcon size={14} color={GREEN} />
                        {metric}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="py-3.5 px-6" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <p className="font-body text-[13px] italic flex items-center gap-2" style={{ color: TEXT_DIM }}>
                  <LightbulbIcon size={14} color={TEXT_DIM} />
                  {domains[activeDomain].note}
                </p>
              </div>
            </div>

            {/* Product Exclusion Note */}
            <div
              className="mt-4 py-3.5 px-5 rounded-lg border flex items-start gap-3"
              style={{
                background: 'rgba(248, 113, 113, 0.05)',
                borderColor: 'rgba(248, 113, 113, 0.2)',
              }}
            >
              <PauseIcon size={14} color="#f87171" />
              <div>
                <p className="font-body text-sm font-semibold mb-0.5" style={{ color: '#d4d4d4' }}>
                  Product Team — Phase 2
                </p>
                <p className="font-body text-[13px]" style={{ color: TEXT_DIM }}>
                  Currently heads-down on the reports rewrite (the Q1 rally cry). AI engagement with product deferred to
                  a later phase.
                </p>
              </div>
            </div>
          </RevealText>
        </div>
      </Section>

      {/* ── Timeline Section ── */}
      <Section id="timeline">
        <div className="max-w-[700px] mx-auto">
          <RevealText>
            <SectionLabel number="04" label="The Journey" />
          </RevealText>
          <RevealText delay={0.1}>
            <Headline>
              8-Week <span style={{ color: GOLD }}>Arc</span>
            </Headline>
          </RevealText>

          <RevealText delay={0.2}>
            <div className="mt-10 flex flex-col gap-2">
              {[
                {
                  weeks: 'Week 1–2',
                  title: 'Foundation & Scoping',
                  activities: ['Mission scoping', 'Baseline metrics', 'Custom GPT creation'],
                },
                {
                  weeks: 'Week 3–6',
                  title: 'Build & Iterate',
                  activities: ['Weekly sessions', 'Workflow building', 'Feedback loops', 'Mid-point check-in'],
                },
                {
                  weeks: 'Week 7–8',
                  title: 'Polish & Handoff',
                  activities: ['Documentation', 'Results measurement', 'Showcase prep'],
                },
              ].map((phase, i) => (
                <div
                  key={i}
                  className="rounded-xl p-6"
                  style={{
                    background: BG_SURFACE,
                    borderLeft: `4px solid ${GOLD}`,
                    minHeight: i === 1 ? 160 : 100,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                  }}
                >
                  <div className="flex items-baseline gap-4 mb-3">
                    <p
                      className="text-xs uppercase tracking-[0.05em] shrink-0"
                      style={{ color: GOLD, fontFamily: 'JetBrains Mono' }}
                    >
                      {phase.weeks}
                    </p>
                    <p className="font-body text-lg font-semibold" style={{ color: TEXT_PRIMARY }}>
                      {phase.title}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {phase.activities.map((activity, j) => (
                      <span
                        key={j}
                        className="rounded-full px-3 py-1.5 text-[13px]"
                        style={{ background: 'rgba(255,255,255,0.05)', color: TEXT_MUTED }}
                      >
                        {activity}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </RevealText>
        </div>
      </Section>

      {/* ── Success Section ── */}
      <Section id="success">
        <div className="max-w-[700px] mx-auto">
          <RevealText>
            <SectionLabel number="05" label="The End State" />
          </RevealText>
          <RevealText delay={0.1}>
            <Headline>
              What <span style={{ color: GOLD }}>Success</span> Looks Like
            </Headline>
          </RevealText>
          <RevealText delay={0.15}>
            <BodyText className="mb-10">At the end of 8 weeks, you&apos;ll be able to say:</BodyText>
          </RevealText>

          <div className="flex flex-col gap-4">
            {[
              'We have 3 internal AI champions who built real things and are ready to scale this in Phase 2.',
              'We improved [specific workflow] by [measurable amount] — there\'s a clear before and after.',
              'We demonstrated AI value in content, finance, and marketing — without disrupting the rally cry.',
            ].map((quote, i) => (
              <RevealText key={i} delay={0.2 + i * 0.08}>
                <div
                  className="rounded-xl p-5 border flex items-start gap-4"
                  style={{ background: BG_SURFACE, borderColor: BORDER }}
                >
                  <span className="font-display text-2xl" style={{ color: GOLD_DIM }}>
                    &ldquo;
                  </span>
                  <p className="font-body text-base leading-relaxed italic" style={{ color: '#d4d4d4' }}>
                    {quote}
                  </p>
                </div>
              </RevealText>
            ))}
          </div>
        </div>
      </Section>

      {/* ── Open Questions Section ── */}
      <Section id="questions">
        <div className="max-w-[800px] mx-auto">
          <RevealText>
            <SectionLabel number="06" label="Decisions Needed" />
          </RevealText>
          <RevealText delay={0.1}>
            <Headline>
              Open <span style={{ color: GOLD }}>Questions</span>
            </Headline>
          </RevealText>
          <RevealText delay={0.15}>
            <BodyText className="mb-8">Before we kick off Week 1, we need to lock in a few decisions:</BodyText>
          </RevealText>

          <RevealText delay={0.2}>
            <Expandable title="Who are the 3 fellows?" defaultOpen={true}>
              <div className="pt-4">
                <p className="font-body text-sm leading-relaxed mb-4" style={{ color: TEXT_MUTED }}>
                  Two selection approaches discussed:
                </p>
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="rounded-lg p-4" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <h4 className="font-body text-sm font-semibold mb-2" style={{ color: TEXT_PRIMARY }}>
                      Option A: Open Call
                    </h4>
                    <p className="font-body text-[13px]" style={{ color: TEXT_DIM }}>
                      Company-wide invite: &ldquo;We&apos;re picking 3 people — submit your AI project idea.&rdquo;
                    </p>
                  </div>
                  <div className="rounded-lg p-4" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <h4 className="font-body text-sm font-semibold mb-2" style={{ color: TEXT_PRIMARY }}>
                      Option B: Top-Down
                    </h4>
                    <p className="font-body text-[13px]" style={{ color: TEXT_DIM }}>
                      Leadership picks specific people in high-impact areas — also a reward/opportunity.
                    </p>
                  </div>
                </div>
              </div>
            </Expandable>

            <Expandable title="Is M&A one of the 3 slots or separate?">
              <div className="pt-4">
                <p className="font-body text-sm leading-relaxed" style={{ color: TEXT_MUTED }}>
                  M&A (market mapping, target database) might be a direct you-and-me collaboration, separate from the 3
                  fellowship slots. That would mean the 3 fellows come from Content, Finance, and Marketing. Or M&A takes
                  one of the 3 slots. Your call.
                </p>
              </div>
            </Expandable>

            <Expandable title="Does success criteria above look right?">
              <div className="pt-4">
                <p className="font-body text-sm leading-relaxed" style={{ color: TEXT_MUTED }}>
                  I&apos;ve articulated what I think success looks like in the previous section — 3 champions who built
                  real things, measurable workflow improvements, demonstrated AI value without disrupting the rally cry.
                  Does that match what you need to be able to say at the end of 8 weeks?
                </p>
              </div>
            </Expandable>
          </RevealText>
        </div>
      </Section>

      {/* ── Investment Section ── */}
      <Section id="investment">
        <div className="max-w-[700px] mx-auto">
          <RevealText>
            <SectionLabel number="07" label="Investment" />
          </RevealText>
          <RevealText delay={0.1}>
            <Headline>
              The <span style={{ color: GOLD }}>Engagement</span>
            </Headline>
          </RevealText>

          <RevealText delay={0.2}>
            <div
              className="rounded-2xl p-8 border"
              style={{ background: BG_SURFACE, borderColor: GOLD }}
            >
              <div
                className="flex items-baseline justify-between mb-6 pb-6"
                style={{ borderBottom: `1px solid ${BORDER}` }}
              >
                <div>
                  <p className="font-body text-[15px] mb-1" style={{ color: TEXT_DIM }}>
                    8 weeks, 3 champions
                  </p>
                  <p className="font-display text-[42px]" style={{ color: GOLD }}>
                    $20,000
                  </p>
                </div>
                <p className="font-body text-[15px]" style={{ color: TEXT_DIM }}>
                  ~$10K / month
                </p>
              </div>

              <div className="mb-6">
                <p className="font-body text-base leading-relaxed mb-4" style={{ color: '#d4d4d4' }}>
                  One day a week embedded with your team. In between sessions, I&apos;m designing exercises, reviewing
                  progress, and thinking through what each champion needs next.
                </p>
                <p className="font-body text-[15px] leading-relaxed" style={{ color: TEXT_MUTED }}>
                  This is lighter than our standard transformation engagement — you get the coaching and capability
                  transfer, but 33 Strategies isn&apos;t building something ourselves. You and your champions are.
                  That&apos;s the whole point.
                </p>
              </div>

              <div
                className="py-4 px-5 rounded-lg"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  borderLeft: `3px solid ${GOLD}`,
                }}
              >
                <p className="font-body text-sm" style={{ color: TEXT_DIM }}>
                  <span style={{ color: TEXT_MUTED }}>Note:</span> If M&A work with you directly makes sense as a fourth
                  track, we can structure that separately depending on scope.
                </p>
              </div>
            </div>
          </RevealText>
        </div>
      </Section>

      {/* ── CTA Section ── */}
      <Section id="cta">
        <div className="max-w-[600px] mx-auto text-center">
          <RevealText>
            <SectionLabel number="08" label="Next Steps" />
          </RevealText>
          <RevealText delay={0.1}>
            <Headline>
              Ready to Build <span style={{ color: GOLD }}>Champions</span>?
            </Headline>
          </RevealText>
          <RevealText delay={0.2}>
            <BodyText className="text-center max-w-[500px] mx-auto">
              Let&apos;s finalize the fellow selection and lock in Week 1.
            </BodyText>
          </RevealText>
        </div>
      </Section>

      {/* ── Footer ── */}
      <div className="py-12 px-6 text-center" style={{ borderTop: '1px solid #1a1a1a' }}>
        <p className="font-display text-2xl" style={{ color: TEXT_DIM }}>
          <span style={{ color: GOLD }}>33</span> Strategies
        </p>
        <p className="font-body text-[13px] mt-3" style={{ color: TEXT_DIM }}>
          AI Fellowship Proposal &bull; February 2026
        </p>
      </div>
    </div>
  );
}
