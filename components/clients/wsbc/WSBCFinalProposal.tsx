'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

// ============================================================================
// COLOR CONSTANTS
// ============================================================================
// 33 Strategies Gold (M33T intro + post-WAIT sections)
const GOLD = '#D4A84B';
const GOLD_LIGHT = '#E4C06B';
const GOLD_DIM = '#B8923F';
const GOLD_GLOW = 'rgba(212, 168, 75, 0.15)';
const GOLD_MUTED = 'rgba(212, 168, 75, 0.12)';

// Wisconsin Red (demo sections only)
const WISCONSIN_RED = '#c5050c';
const WISCONSIN_RED_LIGHT = '#e23636';
const WISCONSIN_RED_DIM = '#8b0000';
const WISCONSIN_RED_GLOW = 'rgba(197, 5, 12, 0.15)';

// Shared neutrals
const BG_PRIMARY = '#0a0a0a';
const BG_SURFACE = '#111111';
const BG_ELEVATED = '#1a1a1a';
const TEXT_PRIMARY = '#ffffff';
const TEXT_SECONDARY = '#a3a3a3';
const TEXT_MUTED = '#737373';
const TEXT_DIM = '#525252';

// ============================================================================
// TYPES
// ============================================================================
type Phase = 'intro' | 'demo' | 'pitch' | 'proposal';

// Demo internal phases
const DEMO_PHASES = {
  INTRO_STORIES: 'intro_stories',
  INTERVIEW: 'interview',
  CARD_PREVIEW: 'card_preview',
  GENERATING: 'generating',
  MATCHES_REVEAL: 'matches_reveal',
  MATCH_DETAIL: 'match_detail',
  ALL_ATTENDEES: 'all_attendees',
  ATTENDEE_DETAIL: 'attendee_detail',
  CONFIRMATION: 'confirmation',
} as const;

type DemoPhase = typeof DEMO_PHASES[keyof typeof DEMO_PHASES];

// ============================================================================
// DEMO DATA
// ============================================================================
const INTERVIEW_QUESTIONS = [
  { id: 'welcome', type: 'system', text: "Hey there! Welcome to the Wisconsin Sports Business Conference VIP experience. I'm going to ask you a few questions so we can connect you with the right people." },
  { id: 'ready', type: 'quick_reply', text: "Ready to get started?", options: ["Let's do it", "Ready!"] },
  { id: 'role', type: 'text', text: "Great! What's your current role and what brings you to the conference?", placeholder: "I'm a... looking to..." },
  { id: 'goals', type: 'text', text: "If you could walk away having made one ideal connection, who would that person be?", placeholder: "Someone who..." },
  { id: 'offer', type: 'text', text: "What's something you could help others with?", placeholder: "I can help with..." },
  { id: 'style', type: 'quick_reply', text: "Last one: What's your networking style?", options: ["Deep conversations", "Meet many people", "Somewhere in between"] },
];

const MOCK_USER_PROFILE = {
  name: 'Alex Thompson',
  title: 'Director of Business Development',
  company: 'Midwest Sports Tech',
  initials: 'AT',
  location: 'Chicago, IL',
  headline: 'Scaling sports tech partnerships across the Midwest',
  bio: 'Building the future of sports technology in the Midwest. Former startup founder with 10+ years in B2B sales and partnerships.',
  currentFocus: 'Expanding our sports tech platform to Big Ten athletic departments. Looking to close 3-4 major partnerships this year.',
  background: 'Built and sold a sports analytics startup in 2019. Led enterprise sales at two venture-backed companies. Deep relationships across collegiate athletics.',
  lookingFor: [
    { description: 'Strategic partnerships', detail: 'Seeking athletic department decision-makers for pilot programs', urgency: 'active' },
    { description: 'Investment opportunities', detail: 'Exploring Series A for platform expansion', urgency: 'active' },
  ],
  canHelpWith: [
    { description: 'Go-to-market strategy', detail: 'Launched 3 B2B products in sports tech vertical', availability: 'open' },
    { description: 'B2B sales', detail: '10+ years enterprise sales experience', availability: 'open' },
  ],
  expertise: ['Sports Tech', 'B2B Sales', 'Partnership Development'],
  style: 'Deep conversations over quick intros',
  idealMatch: 'Someone who knows the Big Ten athletic department landscape and can make warm introductions to key decision-makers.',
  notableExperiences: ['Startup Founder', 'Former D3 Athlete', 'UW-Madison MBA'],
};

const MOCK_MATCHES = [
  { id: 1, name: 'Kenny Dichter', title: 'Founder & Chairman', company: 'REAL SLX', initials: 'KD',
    bio: "Serial entrepreneur who founded Wheels Up and Marquis Jet. UW-Madison alum. Now building REAL SLX—a global sports and lifestyle experience club.",
    matchReason: "Kenny's track record building premium membership businesses and your interest in sports tech partnerships create natural synergy.",
    conversationTopic: "Building premium membership models in sports",
    seeking: ['Sports experience partners', 'Tech-enabled hospitality'],
    offering: ['Membership business expertise', 'Aviation connections'],
    conversationStarter: "Ask Kenny about applying his Wheels Up expertise to sports experiences." },
  { id: 2, name: 'Travis Beckum', title: 'Business Development', company: 'Badger Sports Properties', initials: 'TB',
    bio: "Super Bowl XLVI Champion with NY Giants. First-Team All-American at Wisconsin. Now driving corporate partnerships for UW Athletics.",
    matchReason: "Travis bridges the athlete-to-business transition. His corporate partnerships role connects sponsors to Wisconsin's passionate fan base.",
    conversationTopic: "Athlete transitions & sponsorship activation",
    seeking: ['Corporate sponsors', 'Game-day activation partners'],
    offering: ['UW Athletics access', 'Athlete perspective'],
    conversationStarter: "Ask Travis how his playing career shaped his approach to partnerships." },
  { id: 3, name: 'Keaton Nankivil', title: 'Senior Principal', company: 'Alumni Ventures', initials: 'KN',
    bio: "Former UW Basketball player who went pro in Europe. Now leads the AV Sports Fund, investing in sports tech and NIL platforms.",
    matchReason: "Keaton invests in early-stage sports tech and has deep conviction in the NIL space.",
    conversationTopic: "NIL platforms & sports media rights",
    seeking: ['Sports tech deal flow', 'Founders with domain expertise'],
    offering: ['Venture capital access', 'Sports industry network'],
    conversationStarter: "Ask Keaton which emerging sports tech trends he's most excited to back." },
  { id: 4, name: 'Emily Breunig', title: 'Director of Events', company: 'Champion Management', initials: 'EB',
    bio: "Background in clinical research at UW-Madison. Now combines operational expertise with passion for athlete wealth management.",
    matchReason: "Emily's focus on athlete financial wellness aligns with your interest in comprehensive athlete support services.",
    conversationTopic: "Athlete financial wellness",
    seeking: ['Athlete-focused fintech', 'Event sponsors'],
    offering: ['Event production expertise', 'Athlete financial network'],
    conversationStarter: "Ask Emily about the gaps she sees in athlete financial infrastructure." },
  { id: 5, name: 'Justin Wolf', title: 'Corporate Partnerships', company: 'Green Bay Packers', initials: 'JW',
    bio: "Over a decade with the Packers leading corporate partnerships. Also teaches Digital Brand Building at UW-Madison.",
    matchReason: "Justin's role at the Packers gives him unique insight into NFL sponsorship—the gold standard for sports partnerships.",
    conversationTopic: "NFL sponsorship strategy",
    seeking: ['Innovative activation partners', 'Data vendors'],
    offering: ['NFL partnership insights', 'Packers ecosystem access'],
    conversationStarter: "Ask Justin how the Packers' community-owned model shapes their partnerships." },
];

const ALL_ATTENDEES = [
  ...MOCK_MATCHES,
  { id: 6, name: 'Melvin Gordon III', title: 'Co-Founder', company: 'Vibez Golf Club', initials: 'MG', bio: "Former Wisconsin RB, 2014 Doak Walker Award winner.", seeking: ['Sports lifestyle partners'], offering: ['Athlete brand insights'], category: 'Athlete / Entrepreneur' },
  { id: 7, name: 'Jonathan Taylor', title: 'Running Back', company: 'Indianapolis Colts', initials: 'JT', bio: "Wisconsin RB legend, 2x Doak Walker Award winner.", seeking: ['NIL platform insights'], offering: ['Active NFL perspective'], category: 'Active NFL Player' },
  { id: 8, name: 'Sarah Franklin', title: 'Pro Volleyball', company: 'LOVB Madison', initials: 'SF', bio: "Wisconsin volleyball star, 2023 AVCA National Player of the Year.", seeking: ["Women's sports media"], offering: ["Women's sports visibility"], category: 'Pro Athlete' },
  { id: 9, name: 'Montee Ball Jr', title: 'Ambassador', company: 'Sandstone Care', initials: 'MB', bio: "Wisconsin RB legend, College Football Hall of Fame 2025.", seeking: ['Athlete mental health partners'], offering: ['Mental health advocacy'], category: 'Hall of Famer' },
  { id: 10, name: 'Justin Klein', title: 'Founding Partner', company: 'Marks & Klein LLP', initials: 'JMK', bio: "Leading US franchise attorney. Founded WSBC.", seeking: ['Conference sponsors'], offering: ['Legal expertise', 'WSBC network'], category: 'Conference Founder' },
];

// ============================================================================
// M33T INTRO COMPONENTS (Gold Theme)
// ============================================================================

const MatchCardTease = () => (
  <div style={{
    background: BG_SURFACE,
    borderRadius: 16,
    padding: 20,
    border: `1px solid rgba(212, 168, 75, 0.2)`,
    maxWidth: 340,
    margin: '0 auto',
    boxShadow: `0 8px 32px rgba(0,0,0,0.3), 0 0 60px ${GOLD_GLOW}`,
    textAlign: 'left',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
      <div style={{
        width: 48, height: 48, borderRadius: '50%', background: GOLD,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 16, fontWeight: 600, color: BG_PRIMARY,
      }}>KD</div>
      <div>
        <div style={{ fontSize: 16, fontWeight: 600, color: TEXT_PRIMARY }}>Kenny Dichter</div>
        <div style={{ fontSize: 13, color: TEXT_SECONDARY }}>Founder & Chairman</div>
        <div style={{ fontSize: 13, color: GOLD }}>REAL SLX</div>
      </div>
    </div>
    <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 14, marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 14 }}>🎯</span>
        <span style={{ fontSize: 10, fontWeight: 600, color: TEXT_MUTED, letterSpacing: '0.05em' }}>WHY YOU MATCH</span>
      </div>
      <p style={{ fontSize: 13, color: TEXT_SECONDARY, margin: 0, lineHeight: 1.5 }}>
        Kenny&apos;s track record building premium membership businesses and your interest in sports tech partnerships create natural synergy.
      </p>
    </div>
    <div style={{ background: GOLD_MUTED, borderRadius: 12, padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 14 }}>💬</span>
        <span style={{ fontSize: 10, fontWeight: 600, color: GOLD, letterSpacing: '0.05em' }}>TALK ABOUT</span>
      </div>
      <p style={{ fontSize: 14, color: GOLD_LIGHT, margin: 0, fontWeight: 500 }}>
        Building premium membership models in sports
      </p>
    </div>
  </div>
);

const IPhoneMockup = ({ children, label }: { children: React.ReactNode; label?: string }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
    <div style={{ width: 280, height: 580, position: 'relative', filter: 'drop-shadow(0 25px 50px rgba(0,0,0,0.5))' }}>
      <svg width="280" height="580" viewBox="0 0 280 580" fill="none" style={{ position: 'absolute', top: 0, left: 0, zIndex: 1 }}>
        <rect x="0" y="0" width="280" height="580" rx="40" fill="#1a1a1a"/>
        <rect x="-2" y="100" width="3" height="24" rx="1" fill="#2a2a2a"/>
        <rect x="-2" y="140" width="3" height="40" rx="1" fill="#2a2a2a"/>
        <rect x="-2" y="186" width="3" height="40" rx="1" fill="#2a2a2a"/>
        <rect x="279" y="150" width="3" height="60" rx="1" fill="#2a2a2a"/>
        <rect x="4" y="4" width="272" height="572" rx="36" fill="#0d0d0d"/>
      </svg>
      <div style={{ position: 'absolute', top: 8, left: 8, width: 264, height: 564, borderRadius: 32, overflow: 'hidden', background: BG_PRIMARY, zIndex: 2 }}>
        {children}
      </div>
      <svg width="280" height="580" viewBox="0 0 280 580" fill="none" style={{ position: 'absolute', top: 0, left: 0, zIndex: 3, pointerEvents: 'none' }}>
        <rect x="90" y="18" width="100" height="28" rx="14" fill="#000000"/>
        <circle cx="158" cy="32" r="6" fill="#1a1a1a"/>
        <circle cx="158" cy="32" r="4" fill="#0a1a2a"/>
        <rect x="100" y="554" width="80" height="4" rx="2" fill="rgba(255,255,255,0.15)"/>
      </svg>
    </div>
    {label && <p style={{ fontSize: 15, color: TEXT_PRIMARY, textAlign: 'center', maxWidth: 260, lineHeight: 1.5, fontWeight: 500 }}>{label}</p>}
  </div>
);

const InterviewScreenMockup = () => (
  <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: BG_PRIMARY, textAlign: 'left' }}>
    <style>{`
      @keyframes typingBounce {
        0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
        30% { transform: translateY(-3px); opacity: 1; }
      }
    `}</style>
    <div style={{ padding: '14px 20px 8px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 50 }}>
      <span style={{ fontSize: 9, fontWeight: 600, color: TEXT_PRIMARY }}>9:41</span>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
          <rect x="0" y="6" width="2.5" height="4" rx="0.5" fill={TEXT_PRIMARY}/>
          <rect x="3.5" y="4" width="2.5" height="6" rx="0.5" fill={TEXT_PRIMARY}/>
          <rect x="7" y="2" width="2.5" height="8" rx="0.5" fill={TEXT_PRIMARY}/>
          <rect x="10.5" y="0" width="2.5" height="10" rx="0.5" fill={TEXT_PRIMARY}/>
        </svg>
        <svg width="18" height="9" viewBox="0 0 18 9" fill="none">
          <rect x="0.5" y="0.5" width="14" height="8" rx="2" stroke={TEXT_PRIMARY} strokeWidth="1"/>
          <rect x="2" y="2" width="10" height="5" rx="1" fill={TEXT_PRIMARY}/>
          <rect x="15" y="2.5" width="2" height="4" rx="0.5" fill={TEXT_PRIMARY}/>
        </svg>
      </div>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px 12px 16px' }}>
      <div style={{ width: 28, height: 28, borderRadius: 6, background: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: BG_PRIMARY }}>33</div>
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, color: TEXT_PRIMARY }}>M33T Concierge</div>
        <div style={{ fontSize: 9, color: TEXT_MUTED }}>Finding your connections</div>
      </div>
    </div>
    <div style={{ flex: 1, padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 6, overflow: 'hidden' }}>
      <div style={{ background: BG_ELEVATED, borderRadius: 12, borderTopLeftRadius: 4, padding: 10, maxWidth: '85%', fontSize: 10, color: TEXT_PRIMARY, lineHeight: 1.45 }}>
        I&apos;ll ask a few questions to connect you with the right people. Takes about 3 minutes.
      </div>
      <div style={{ background: BG_ELEVATED, borderRadius: 12, borderTopLeftRadius: 4, padding: 10, maxWidth: '85%', fontSize: 10, color: TEXT_PRIMARY, lineHeight: 1.45 }}>
        What&apos;s your current role and what brings you to the event?
      </div>
      <div style={{ background: GOLD, borderRadius: 12, borderTopRightRadius: 4, padding: 10, maxWidth: '75%', alignSelf: 'flex-end', fontSize: 10, color: BG_PRIMARY, fontWeight: 500, lineHeight: 1.45 }}>
        Founder - looking for investors
      </div>
      <div style={{ background: BG_ELEVATED, borderRadius: 12, borderTopLeftRadius: 4, padding: 10, maxWidth: '85%', fontSize: 10, color: TEXT_PRIMARY, lineHeight: 1.45 }}>
        If you could make one ideal connection at this event, who would that be?
      </div>
      <div style={{ background: GOLD, borderRadius: 12, borderTopRightRadius: 4, padding: 10, maxWidth: '75%', alignSelf: 'flex-end', fontSize: 10, color: BG_PRIMARY, fontWeight: 500, lineHeight: 1.45 }}>
        Series A investors in SaaS
      </div>
      {/* Typing indicator - AI preparing to respond */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: BG_ELEVATED, borderRadius: 12, borderTopLeftRadius: 4, padding: '10px 14px', width: 'fit-content' }}>
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: TEXT_MUTED, animation: 'typingBounce 1.4s ease-in-out infinite', animationDelay: '0s' }} />
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: TEXT_MUTED, animation: 'typingBounce 1.4s ease-in-out infinite', animationDelay: '0.2s' }} />
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: TEXT_MUTED, animation: 'typingBounce 1.4s ease-in-out infinite', animationDelay: '0.4s' }} />
      </div>
    </div>
    <div style={{ padding: '12px 12px 20px 12px' }}>
      <div style={{ background: BG_ELEVATED, borderRadius: 20, padding: '10px 14px', fontSize: 9, color: TEXT_DIM }}>
        Type your response...
      </div>
    </div>
  </div>
);

const MatchesScreenMockup = () => (
  <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: BG_PRIMARY, textAlign: 'left' }}>
    <div style={{ padding: '14px 20px 8px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 50 }}>
      <span style={{ fontSize: 9, fontWeight: 600, color: TEXT_PRIMARY }}>9:41</span>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
          <rect x="0" y="6" width="2.5" height="4" rx="0.5" fill={TEXT_PRIMARY}/>
          <rect x="3.5" y="4" width="2.5" height="6" rx="0.5" fill={TEXT_PRIMARY}/>
          <rect x="7" y="2" width="2.5" height="8" rx="0.5" fill={TEXT_PRIMARY}/>
          <rect x="10.5" y="0" width="2.5" height="10" rx="0.5" fill={TEXT_PRIMARY}/>
        </svg>
        <svg width="18" height="9" viewBox="0 0 18 9" fill="none">
          <rect x="0.5" y="0.5" width="14" height="8" rx="2" stroke={TEXT_PRIMARY} strokeWidth="1"/>
          <rect x="2" y="2" width="10" height="5" rx="1" fill={TEXT_PRIMARY}/>
          <rect x="15" y="2.5" width="2" height="4" rx="0.5" fill={TEXT_PRIMARY}/>
        </svg>
      </div>
    </div>
    <div style={{ padding: '4px 16px 12px 16px' }}>
      <div style={{ fontSize: 9, fontWeight: 600, color: GOLD, letterSpacing: '0.08em', marginBottom: 4 }}>YOUR MATCHES</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: TEXT_PRIMARY, marginBottom: 2 }}>We found 5 ideal connections</div>
      <div style={{ fontSize: 9, color: TEXT_MUTED }}>Tap any card to see the full profile</div>
    </div>
    <div style={{ flex: 1, padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 8, overflow: 'hidden' }}>
      {[
        { initials: 'KD', name: 'Kenny Dichter', role: 'Founder & Chairman', company: 'REAL SLX', showMatch: true },
        { initials: 'TB', name: 'Travis Beckum', role: 'Business Development', company: 'Badger Sports', showMatch: false },
        { initials: 'KN', name: 'Keaton Nankivil', role: 'Senior Principal', company: 'Alumni Ventures', showMatch: false },
        { initials: 'MR', name: 'Maya Rodriguez', role: 'VP Partnerships', company: 'SportsTech Co', showMatch: false },
      ].map((match, i) => (
        <div key={i} style={{ background: BG_SURFACE, borderRadius: 10, padding: 10, border: `1px solid ${i === 0 ? 'rgba(212, 168, 75, 0.3)' : 'rgba(255,255,255,0.04)'}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: i === 0 ? GOLD : BG_ELEVATED, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, color: i === 0 ? BG_PRIMARY : TEXT_MUTED }}>{match.initials}</div>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: TEXT_PRIMARY }}>{match.name}</div>
              <div style={{ fontSize: 9, color: TEXT_MUTED }}>{match.role}</div>
              <div style={{ fontSize: 9, color: GOLD }}>{match.company}</div>
            </div>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={TEXT_DIM} strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
          </div>
          {match.showMatch && (
            <div style={{ marginTop: 8, padding: 8, background: 'rgba(255,255,255,0.02)', borderRadius: 6, fontSize: 9, color: TEXT_SECONDARY, lineHeight: 1.4, textAlign: 'left' }}>
              <span style={{ color: GOLD, fontWeight: 500 }}>Why you match:</span> Premium membership expertise aligns with your goals
            </div>
          )}
        </div>
      ))}
      <div style={{ paddingTop: 2, textAlign: 'left' }}><span style={{ fontSize: 9, color: TEXT_MUTED }}>+1 more connection</span></div>
    </div>
    <div style={{ padding: '12px 12px 20px 12px' }}>
      <div style={{ background: GOLD, borderRadius: 10, padding: 12, textAlign: 'center', fontSize: 11, fontWeight: 600, color: BG_PRIMARY }}>I&apos;m ready for the event</div>
    </div>
  </div>
);

// ============================================================================
// M33T INTRO SECTION (Scroll-based, Gold Theme)
// ============================================================================
const M33TIntroSection = ({ onComplete }: { onComplete: () => void }) => {
  const [currentSection, setCurrentSection] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      const progress = scrollTop / (scrollHeight - clientHeight);
      setScrollProgress(Math.min(1, Math.max(0, progress)));
      const sectionHeight = clientHeight;
      const newSection = Math.min(3, Math.floor((scrollTop + sectionHeight * 0.5) / sectionHeight));
      setCurrentSection(newSection);
    };
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  const sections = [
    { id: 'problem', label: 'The Problem' },
    { id: 'whatif', label: 'What If' },
    { id: 'm33t', label: 'M33T' },
    { id: 'experience', label: 'Experience It' },
  ];

  return (
    <div ref={containerRef} style={{ height: '100vh', overflowY: 'auto', background: BG_PRIMARY, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      {/* Progress bar */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 3, background: 'rgba(255,255,255,0.1)', zIndex: 100 }}>
        <div style={{ height: '100%', background: GOLD, width: `${scrollProgress * 100}%`, transition: 'width 0.1s ease-out' }} />
      </div>

      {/* Section dots */}
      <div style={{ position: 'fixed', right: 24, top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: 12, zIndex: 100 }}>
        {sections.map((section, i) => (
          <div key={section.id} onClick={() => sectionRefs.current[i]?.scrollIntoView({ behavior: 'smooth' })}
            style={{ width: 8, height: 8, borderRadius: '50%', background: currentSection === i ? GOLD : 'rgba(255,255,255,0.2)', cursor: 'pointer', transition: 'all 0.3s ease', transform: currentSection === i ? 'scale(1.25)' : 'scale(1)' }} title={section.label} />
        ))}
      </div>

      {/* SECTION 1: THE PROBLEM */}
      <section ref={el => { sectionRefs.current[0] = el; }} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 24px', position: 'relative', textAlign: 'center' }}>
        <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%, -50%)', width: 400, height: 400, background: `radial-gradient(circle, ${GOLD}10 0%, transparent 70%)`, pointerEvents: 'none' }} />
        <div style={{ maxWidth: 500, position: 'relative', zIndex: 10 }}>
          <p style={{ color: TEXT_DIM, fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 24 }}>The networking problem</p>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 36, fontWeight: 400, color: TEXT_PRIMARY, marginBottom: 40, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            Every event, the <span style={{ color: GOLD }}>same story</span>
          </h1>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 40 }}>
            <div style={{ background: BG_SURFACE, borderRadius: 16, padding: 24, border: `1px solid ${GOLD}30`, textAlign: 'left' }}>
              <p style={{ color: GOLD, fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 16, fontWeight: 600 }}>Expectation</p>
              <p style={{ fontFamily: 'Georgia, serif', color: TEXT_PRIMARY, fontSize: 20, lineHeight: 1.4, margin: 0 }}>
                Make 3-4 meaningful connections that could actually go somewhere
              </p>
            </div>
            <div style={{ background: BG_SURFACE, borderRadius: 16, padding: 24, border: '1px solid rgba(255,255,255,0.06)', textAlign: 'left' }}>
              <p style={{ color: TEXT_MUTED, fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 16, fontWeight: 600 }}>Reality</p>
              <p style={{ fontFamily: 'Georgia, serif', color: TEXT_SECONDARY, fontSize: 20, lineHeight: 1.4, margin: 0 }}>
                Six random conversations that probably won&apos;t go anywhere
              </p>
            </div>
          </div>
          <p style={{ color: TEXT_MUTED, fontSize: 16, lineHeight: 1.6 }}>
            The right people were probably in the room.<br/>
            <span style={{ color: TEXT_PRIMARY }}>You just had no way to find each other.</span>
          </p>
        </div>
        <div style={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)', textAlign: 'center' }}>
          <p style={{ color: TEXT_DIM, fontSize: 11, letterSpacing: '0.1em', marginBottom: 8 }}>Scroll</p>
          <div style={{ width: 20, height: 32, borderRadius: 10, border: `2px solid ${TEXT_DIM}`, margin: '0 auto', position: 'relative' }}>
            <div style={{ width: 3, height: 6, borderRadius: 2, background: GOLD, position: 'absolute', top: 6, left: '50%', transform: 'translateX(-50%)', animation: 'scrollBounce 2s ease-in-out infinite' }} />
          </div>
        </div>
        <style>{`@keyframes scrollBounce { 0%, 100% { transform: translateX(-50%) translateY(0); opacity: 1; } 50% { transform: translateX(-50%) translateY(8px); opacity: 0.5; } }`}</style>
      </section>

      {/* SECTION 2: WHAT IF + PRODUCT TEASE */}
      <section ref={el => { sectionRefs.current[1] = el; }} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 24px', position: 'relative', textAlign: 'center' }}>
        <div style={{ maxWidth: 400, position: 'relative', zIndex: 10 }}>
          <p style={{ color: TEXT_PRIMARY, fontSize: 22, lineHeight: 1.5, marginBottom: 40, fontWeight: 500 }}>
            What if you knew <span style={{ color: GOLD }}>exactly who to meet</span> before you walked in?
          </p>
          <div style={{ marginBottom: 40 }}><MatchCardTease /></div>
          <p style={{ color: TEXT_PRIMARY, fontSize: 22, lineHeight: 1.5, fontWeight: 500 }}>
            And what if <span style={{ color: GOLD }}>they</span> knew to find <span style={{ color: GOLD }}>you</span> too?
          </p>
        </div>
      </section>

      {/* SECTION 3: INTRODUCING M33T */}
      <section ref={el => { sectionRefs.current[2] = el; }} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 24px', position: 'relative', textAlign: 'center' }}>
        <div style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%, -50%)', width: 600, height: 600, background: `radial-gradient(circle, ${GOLD}12 0%, transparent 70%)`, pointerEvents: 'none' }} />
        <div style={{ maxWidth: 700, position: 'relative', zIndex: 10 }}>
          <p style={{ color: GOLD, fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 16 }}>Introducing</p>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 64, fontWeight: 400, color: TEXT_PRIMARY, marginBottom: 8, lineHeight: 1 }}>
            M<span style={{ color: GOLD }}>33</span>T
          </h2>
          <p style={{ color: TEXT_MUTED, fontSize: 14, letterSpacing: '0.1em', marginBottom: 16 }}>by 33 Strategies</p>
          <p style={{ color: TEXT_SECONDARY, fontSize: 18, marginBottom: 48 }}>
            The right people. The right context. <span style={{ color: TEXT_PRIMARY, fontWeight: 500 }}>Before you arrive.</span>
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 40, flexWrap: 'wrap' }}>
            <IPhoneMockup label="AI learns about you and what you're trying to accomplish right now">
              <InterviewScreenMockup />
            </IPhoneMockup>
            <IPhoneMockup label="Then matches you with highly relevant connections before the event">
              <MatchesScreenMockup />
            </IPhoneMockup>
          </div>
        </div>
      </section>

      {/* SECTION 4: EXPERIENCE IT (Transition to Demo) */}
      <section ref={el => { sectionRefs.current[3] = el; }} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 24px', position: 'relative', textAlign: 'center' }}>
        <div style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%, -50%)', width: 500, height: 500, background: `radial-gradient(circle, ${GOLD}15 0%, transparent 70%)`, pointerEvents: 'none' }} />
        <div style={{ maxWidth: 400, position: 'relative', zIndex: 10 }}>
          <p style={{ color: GOLD, fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 16 }}>Now...</p>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 36, fontWeight: 400, color: TEXT_PRIMARY, marginBottom: 32, lineHeight: 1.2 }}>
            Experience it yourself.
          </h2>
          <p style={{ color: TEXT_SECONDARY, fontSize: 16, marginBottom: 40, lineHeight: 1.6 }}>
            Tap through an AI-powered demo as a Wisconsin VIP
          </p>
          <button onClick={onComplete} style={{ padding: '16px 40px', borderRadius: 12, border: 'none', background: GOLD, color: BG_PRIMARY, fontSize: 15, fontWeight: 600, cursor: 'pointer', boxShadow: `0 8px 32px rgba(212, 168, 75, 0.25)` }}>
            Start Demo
          </button>
        </div>
      </section>
    </div>
  );
};

// ============================================================================
// DEMO COMPONENTS (Wisconsin Red Theme)
// ============================================================================

const AmbientBackground = ({ intensity = 1, color = WISCONSIN_RED }: { intensity?: number; color?: string }) => {
  const particleCount = 15;
  const particlesRef = useRef(
    Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      delay: Math.random() * 12,
      duration: 12 + Math.random() * 10,
      xStart: Math.random() * 100,
      xDrift: (Math.random() - 0.5) * 40,
      size: 2 + Math.random() * 3,
      maxOpacity: (0.12 + Math.random() * 0.15) * intensity,
    }))
  );

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      {particlesRef.current.map(p => (
        <div key={p.id} style={{
          position: 'absolute', bottom: -20, left: `${p.xStart}%`,
          width: p.size, height: p.size, background: color,
          borderRadius: '50%', filter: 'blur(1px)',
          animation: `floatUp-${p.id} ${p.duration}s ease-in-out ${p.delay}s infinite`,
        }} />
      ))}
      <div style={{ position: 'absolute', width: 400, height: 400, top: -100, right: -100, background: color, borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%', filter: 'blur(80px)', opacity: 0.12 * intensity, animation: 'blobMorph1 12s ease-in-out infinite alternate' }} />
      <div style={{ position: 'absolute', width: 300, height: 300, bottom: '20%', left: -80, background: color, borderRadius: '40% 60% 60% 40% / 70% 30% 70% 30%', filter: 'blur(80px)', opacity: 0.1 * intensity, animation: 'blobMorph2 15s ease-in-out infinite alternate' }} />
      <style>{`
        ${particlesRef.current.map(p => `
          @keyframes floatUp-${p.id} {
            0% { transform: translateY(0) translateX(0); opacity: 0; }
            10% { opacity: 0; }
            25% { opacity: ${p.maxOpacity}; }
            75% { opacity: ${p.maxOpacity}; }
            90% { opacity: 0; }
            100% { transform: translateY(-100vh) translateX(${p.xDrift}px); opacity: 0; }
          }
        `).join('')}
        @keyframes blobMorph1 { 0%, 100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; } 50% { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; } }
        @keyframes blobMorph2 { 0%, 100% { border-radius: 40% 60% 60% 40% / 70% 30% 70% 30%; } 50% { border-radius: 60% 40% 30% 70% / 40% 60% 40% 60%; } }
      `}</style>
    </div>
  );
};

const Breathing = ({ children, duration = 5, delay = 0 }: { children: React.ReactNode; duration?: number; delay?: number }) => (
  <div style={{ display: 'inline-block', animation: `breathe ${duration}s ease-in-out ${delay}s infinite` }}>
    {children}
    <style>{`@keyframes breathe { 0%, 100% { transform: scale(0.92); } 50% { transform: scale(1.08); } }`}</style>
  </div>
);

const Avatar = ({ initials, size = 64, color = WISCONSIN_RED }: { initials: string; size?: number; color?: string }) => (
  <div style={{
    width: size, height: size, borderRadius: '50%',
    background: `linear-gradient(135deg, ${color} 0%, ${WISCONSIN_RED_DIM} 100%)`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: size * 0.35, fontWeight: 600, color: TEXT_PRIMARY,
    boxShadow: `0 4px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)`,
  }}>{initials}</div>
);

const WisconsinLogo = ({ size = 48 }: { size?: number }) => (
  <div style={{
    width: size, height: size,
    background: `linear-gradient(135deg, ${WISCONSIN_RED} 0%, ${WISCONSIN_RED_DIM} 100%)`,
    borderRadius: size * 0.15, display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: size * 0.55, color: TEXT_PRIMARY,
    boxShadow: `0 4px 20px ${WISCONSIN_RED_GLOW}, inset 0 1px 0 rgba(255,255,255,0.15)`,
  }}>W</div>
);

const StoryProgressBar = ({ totalSlides, currentSlide, progress }: { totalSlides: number; currentSlide: number; progress: number }) => (
  <div style={{ display: 'flex', gap: 4, padding: '16px 16px 12px', position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100 }}>
    {Array.from({ length: totalSlides }).map((_, i) => (
      <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.15)', overflow: 'hidden' }}>
        <div style={{ height: '100%', background: TEXT_PRIMARY, borderRadius: 2, width: i < currentSlide ? '100%' : i === currentSlide ? `${progress}%` : '0%' }} />
      </div>
    ))}
  </div>
);

const ProcessFlow = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 24 }}>
    {[
      { icon: '💬', label: 'Questions', delay: 0 },
      { icon: '🎯', label: 'Matches', delay: 0.3 },
      { icon: '🤝', label: 'Connect', delay: 0.6 },
    ].map((step, i) => (
      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <Breathing duration={5} delay={step.delay}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: `linear-gradient(135deg, ${BG_ELEVATED} 0%, ${BG_SURFACE} 100%)`, border: `2px solid ${WISCONSIN_RED}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, boxShadow: `0 4px 16px ${WISCONSIN_RED_GLOW}` }}>{step.icon}</div>
          </Breathing>
          <span style={{ fontSize: 10, fontWeight: 600, color: TEXT_PRIMARY }}>{step.label}</span>
        </div>
        {i < 2 && (
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 18 }}>
            <div style={{ width: 20, height: 2, background: `linear-gradient(to right, ${WISCONSIN_RED}, ${WISCONSIN_RED}60)` }} />
            <div style={{ width: 0, height: 0, borderTop: '4px solid transparent', borderBottom: '4px solid transparent', borderLeft: `5px solid ${WISCONSIN_RED}60` }} />
          </div>
        )}
      </div>
    ))}
  </div>
);

// Demo sub-components - IntroStories
const DemoIntroStories = ({ onComplete }: { onComplete: () => void }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [progress, setProgress] = useState(0);

  const slides = [
    { headline: "Wisconsin Sports Business Conference", subline: "Madison, WI \u2022 March 2025", visual: 'logo' },
    { headline: "You've been invited.", subline: "200+ executives, investors, and operators shaping the future of Midwest sports.", visual: 'exclusive' },
    { headline: "We make sure you meet the right people.", subline: "By learning what each VIP is looking for\u2014and what they bring to the table.", visual: 'match' },
    { headline: "Here's how it works", subline: "Answer a few questions. Get matched. Arrive knowing exactly who to meet.", visual: 'flow' },
    { headline: "Takes about 3 minutes.", subline: "Let's find your people.", visual: 'start' },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          if (currentSlide < slides.length - 1) { setCurrentSlide(c => c + 1); return 0; }
          else { clearInterval(interval); onComplete(); return 100; }
        }
        return prev + 1.5;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [currentSlide, slides.length, onComplete]);

  const handleTap = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x > rect.width / 2) {
      if (currentSlide < slides.length - 1) { setCurrentSlide(c => c + 1); setProgress(0); }
      else onComplete();
    } else if (currentSlide > 0) { setCurrentSlide(c => c - 1); setProgress(0); }
  };

  const slide = slides[currentSlide];

  return (
    <div onClick={handleTap} style={{ minHeight: '100vh', background: BG_PRIMARY, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '80px 24px 40px', position: 'relative', cursor: 'pointer', userSelect: 'none', overflow: 'hidden' }}>
      <AmbientBackground intensity={1.2} />
      <StoryProgressBar totalSlides={slides.length} currentSlide={currentSlide} progress={progress} />

      <div style={{ textAlign: 'center', maxWidth: 340, position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {slide.visual === 'logo' && <div style={{ marginBottom: 32 }}><Breathing duration={6}><WisconsinLogo size={80} /></Breathing></div>}
        {slide.visual === 'exclusive' && <div style={{ marginBottom: 32 }}><Breathing duration={5}><div style={{ fontSize: 56 }}>🎟️</div></Breathing></div>}
        {slide.visual === 'match' && <div style={{ marginBottom: 32 }}><Breathing duration={6}><div style={{ display: 'flex', gap: 8 }}><Avatar initials="JK" size={48} /><Avatar initials="MW" size={48} color={WISCONSIN_RED_DIM} /><Avatar initials="SC" size={48} color={WISCONSIN_RED_LIGHT} /></div></Breathing></div>}
        {slide.visual === 'flow' && <ProcessFlow />}
        {slide.visual === 'start' && <div style={{ marginBottom: 32 }}><Breathing duration={4}><div style={{ width: 72, height: 72, borderRadius: '50%', background: `linear-gradient(135deg, ${WISCONSIN_RED} 0%, ${WISCONSIN_RED_DIM} 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 8px 32px ${WISCONSIN_RED_GLOW}` }}><span style={{ fontSize: 28, marginLeft: 4 }}>▶</span></div></Breathing></div>}

        {slide.visual !== 'flow' && (
          <>
            <h1 style={{ fontFamily: 'Georgia, serif', fontSize: currentSlide === 0 ? 26 : 28, fontWeight: 400, color: TEXT_PRIMARY, marginBottom: 16, lineHeight: 1.25 }}>{slide.headline}</h1>
            <p style={{ fontSize: 15, color: TEXT_SECONDARY, lineHeight: 1.6 }}>{slide.subline}</p>
          </>
        )}
        {slide.visual === 'flow' && (
          <>
            <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 26, fontWeight: 400, color: TEXT_PRIMARY, marginBottom: 8, marginTop: 24, lineHeight: 1.25 }}>{slide.headline}</h1>
            <p style={{ fontSize: 14, color: TEXT_SECONDARY, lineHeight: 1.6 }}>{slide.subline}</p>
          </>
        )}
      </div>

      <p style={{ position: 'absolute', bottom: 28, fontSize: 11, color: TEXT_MUTED, letterSpacing: '0.05em' }}>Tap to continue</p>
    </div>
  );
};

// Demo sub-components - Interview
const ChatBubble = ({ role, text, isNew = false }: { role: string; text: string; isNew?: boolean }) => {
  const isUser = role === 'user';
  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', animation: isNew ? 'bubbleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none' }}>
      <div style={{
        maxWidth: '82%', padding: '14px 18px',
        borderRadius: isUser ? '20px 20px 6px 20px' : '20px 20px 20px 6px',
        background: isUser ? `linear-gradient(145deg, ${WISCONSIN_RED} 0%, ${WISCONSIN_RED_DIM} 100%)` : `linear-gradient(145deg, ${BG_ELEVATED} 0%, ${BG_SURFACE} 100%)`,
        boxShadow: `4px 4px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)`,
        fontSize: 15, color: TEXT_PRIMARY, lineHeight: 1.5,
      }}>{text}</div>
      <style>{`@keyframes bubbleIn { 0% { opacity: 0; transform: translateY(12px) scale(0.95); } 100% { opacity: 1; transform: translateY(0) scale(1); } }`}</style>
    </div>
  );
};

const DemoInterview = ({ onComplete }: { onComplete: () => void }) => {
  const [messages, setMessages] = useState<Array<{ role: string; text: string; type?: string; options?: string[]; isNew?: boolean }>>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Prevent duplicate initialization in React Strict Mode
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    setTimeout(() => {
      setMessages([{ role: 'system', text: INTERVIEW_QUESTIONS[0].text, isNew: true }]);
      setTimeout(() => {
        setCurrentQuestion(1);
        const q = INTERVIEW_QUESTIONS[1];
        setMessages(prev => [...prev, { role: 'system', text: q.text, type: q.type, options: q.options, isNew: true }]);
      }, 1200);
    }, 500);
  }, []);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = (text: string) => {
    if (!text.trim()) return;
    setMessages(prev => [...prev, { role: 'user', text, isNew: true }]);
    setInputValue('');
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const nextQ = currentQuestion + 1;
      if (nextQ < INTERVIEW_QUESTIONS.length) {
        setCurrentQuestion(nextQ);
        const q = INTERVIEW_QUESTIONS[nextQ];
        setMessages(prev => [...prev, { role: 'system', text: q.text, type: q.type, options: q.options, isNew: true }]);
      } else {
        setIsComplete(true);
        setMessages(prev => [...prev, { role: 'system', text: "Perfect! Let me put together your profile...", isNew: true }]);
        setTimeout(onComplete, 1500);
      }
    }, 1000);
  };

  const currentQ = INTERVIEW_QUESTIONS[currentQuestion];
  const showQuickReply = !isTyping && !isComplete && currentQ?.type === 'quick_reply' && messages.length > 0 && messages[messages.length - 1].role === 'system';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: BG_PRIMARY, position: 'relative', overflow: 'hidden' }}>
      <AmbientBackground intensity={0.4} />

      <div style={{ padding: '16px 20px', borderBottom: `1px solid rgba(255,255,255,0.05)`, display: 'flex', alignItems: 'center', gap: 12, position: 'relative', zIndex: 10, background: 'rgba(10,10,10,0.8)', backdropFilter: 'blur(12px)' }}>
        <Breathing duration={6}><WisconsinLogo size={36} /></Breathing>
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, color: TEXT_PRIMARY, margin: 0 }}>WSBC Concierge</p>
          <p style={{ fontSize: 11, color: TEXT_MUTED, margin: 0 }}>Finding your connections</p>
        </div>
        <div style={{ marginLeft: 'auto', fontSize: 11, color: TEXT_MUTED, background: BG_ELEVATED, padding: '4px 10px', borderRadius: 12 }}>{Math.min(currentQuestion + 1, INTERVIEW_QUESTIONS.length)}/{INTERVIEW_QUESTIONS.length}</div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 12, position: 'relative', zIndex: 10 }}>
        {messages.map((msg, i) => <ChatBubble key={i} {...msg} />)}

        {showQuickReply && currentQ.options && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end', marginTop: 4 }}>
            {currentQ.options.map((opt, i) => (
              <button key={i} onClick={() => handleSend(opt)} style={{ padding: '10px 16px', borderRadius: 20, border: `1.5px solid ${WISCONSIN_RED}`, background: 'rgba(197, 5, 12, 0.1)', color: WISCONSIN_RED, fontSize: 13, fontWeight: 500, cursor: 'pointer', boxShadow: `0 2px 8px rgba(197, 5, 12, 0.2)` }}>{opt}</button>
            ))}
          </div>
        )}

        {isTyping && (
          <div style={{ display: 'flex', gap: 5, padding: '14px 18px', background: BG_ELEVATED, borderRadius: '20px 20px 20px 6px', width: 'fit-content', boxShadow: `4px 4px 12px rgba(0,0,0,0.3)` }}>
            {[0, 1, 2].map(i => (<div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: TEXT_MUTED, animation: `typePulse 1.4s ease-in-out ${i * 0.15}s infinite` }} />))}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {currentQ?.type === 'text' && !isTyping && !isComplete && (
        <div style={{ padding: 16, borderTop: `1px solid rgba(255,255,255,0.05)`, display: 'flex', gap: 12, position: 'relative', zIndex: 10, background: 'rgba(10,10,10,0.9)', backdropFilter: 'blur(12px)' }}>
          <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend(inputValue)} placeholder={currentQ.placeholder} style={{ flex: 1, padding: '14px 20px', borderRadius: 24, border: `1px solid rgba(255,255,255,0.1)`, background: BG_SURFACE, color: TEXT_PRIMARY, fontSize: 15, outline: 'none', boxShadow: `inset 2px 2px 6px rgba(0,0,0,0.2)` }} />
          <button onClick={() => handleSend(inputValue)} disabled={!inputValue.trim()} style={{ width: 48, height: 48, borderRadius: '50%', border: 'none', background: inputValue.trim() ? `linear-gradient(135deg, ${WISCONSIN_RED} 0%, ${WISCONSIN_RED_DIM} 100%)` : BG_ELEVATED, cursor: inputValue.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: inputValue.trim() ? `0 4px 16px ${WISCONSIN_RED_GLOW}` : 'none', color: 'white', fontSize: 18 }}>→</button>
        </div>
      )}

      <style>{`@keyframes typePulse { 0%, 80%, 100% { opacity: 0.3; transform: scale(0.85); } 40% { opacity: 1; transform: scale(1.1); } }`}</style>
    </div>
  );
};

// Demo sub-components - Card Preview
const DemoCardPreview = ({ onConfirm }: { onConfirm: () => void }) => {
  const profile = MOCK_USER_PROFILE;

  return (
    <div style={{ minHeight: '100vh', background: BG_PRIMARY, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', position: 'relative', overflow: 'hidden' }}>
      <AmbientBackground intensity={0.6} />

      <div style={{ textAlign: 'center', marginBottom: 20, position: 'relative', zIndex: 10 }}>
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.15em', color: WISCONSIN_RED, textTransform: 'uppercase', marginBottom: 8 }}>Your VIP Profile</p>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 22, color: TEXT_PRIMARY, margin: 0 }}>Here&apos;s how you&apos;ll appear</h1>
      </div>

      <div style={{ width: 300, minHeight: 380, borderRadius: 20, background: `linear-gradient(165deg, ${BG_ELEVATED} 0%, #0d0d0d 50%, ${BG_SURFACE} 100%)`, border: `2px solid ${WISCONSIN_RED}`, boxShadow: `0 25px 50px rgba(0,0,0,0.5), 0 0 60px ${WISCONSIN_RED_GLOW}`, overflow: 'hidden', position: 'relative', zIndex: 10 }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 100, background: `linear-gradient(180deg, ${WISCONSIN_RED}25 0%, transparent 100%)`, pointerEvents: 'none' }} />

        <div style={{ padding: '16px 18px', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div style={{ width: 26, height: 26, borderRadius: 6, background: WISCONSIN_RED, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 14, color: TEXT_PRIMARY, boxShadow: `0 2px 8px ${WISCONSIN_RED_GLOW}` }}>W</div>
            <div style={{ fontSize: 8, color: TEXT_MUTED, textAlign: 'right', lineHeight: 1.3, background: 'rgba(0,0,0,0.3)', padding: '4px 8px', borderRadius: 6 }}>WSBC 2025<br/>VIP ATTENDEE</div>
          </div>

          <div style={{ textAlign: 'center', marginBottom: 12 }}>
            <Avatar initials={profile.initials} size={56} />
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 17, color: TEXT_PRIMARY, marginTop: 10, marginBottom: 3 }}>{profile.name}</h2>
            <p style={{ fontSize: 11, color: TEXT_SECONDARY, marginBottom: 1, margin: 0 }}>{profile.headline}</p>
            <p style={{ fontSize: 10, color: TEXT_MUTED, margin: 0 }}>{profile.title} · {profile.location}</p>
          </div>

          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
            {profile.expertise.map((tag, i) => (
              <span key={i} style={{ padding: '4px 10px', borderRadius: 12, fontSize: 9, fontWeight: 500, background: i === 0 ? 'rgba(197, 5, 12, 0.2)' : 'rgba(255,255,255,0.05)', color: i === 0 ? WISCONSIN_RED : TEXT_SECONDARY }}>{tag}</span>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
            <div style={{ padding: 10, borderRadius: 10, background: 'rgba(251, 191, 36, 0.08)', border: '1px solid rgba(251, 191, 36, 0.15)' }}>
              <div style={{ fontSize: 8, fontWeight: 700, color: '#FBBF24', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                <span>◎</span> Seeking
              </div>
              <p style={{ fontSize: 9, color: TEXT_SECONDARY, margin: 0, lineHeight: 1.4 }}>
                {profile.lookingFor.slice(0, 2).map(l => l.description).join(' · ')}
              </p>
            </div>
            <div style={{ padding: 10, borderRadius: 10, background: 'rgba(52, 211, 153, 0.08)', border: '1px solid rgba(52, 211, 153, 0.15)' }}>
              <div style={{ fontSize: 8, fontWeight: 700, color: '#34D399', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                <span>◈</span> Offering
              </div>
              <p style={{ fontSize: 9, color: TEXT_SECONDARY, margin: 0, lineHeight: 1.4 }}>
                {profile.canHelpWith.slice(0, 2).map(c => c.description).join(' · ')}
              </p>
            </div>
          </div>

          <div style={{ height: 4, borderRadius: 2, background: `linear-gradient(90deg, rgba(255,0,128,0.6) 0%, rgba(0,255,255,0.6) 25%, rgba(255,255,0,0.6) 50%, rgba(0,255,128,0.6) 75%, rgba(255,0,255,0.6) 100%)`, backgroundSize: '200% 100%', animation: 'holoShift 3s linear infinite', marginTop: 'auto' }} />
        </div>
      </div>

      <button onClick={onConfirm} style={{ marginTop: 24, padding: '16px 32px', borderRadius: 14, border: 'none', background: `linear-gradient(135deg, ${WISCONSIN_RED} 0%, ${WISCONSIN_RED_DIM} 100%)`, color: TEXT_PRIMARY, fontSize: 16, fontWeight: 600, cursor: 'pointer', boxShadow: `0 8px 24px ${WISCONSIN_RED_GLOW}`, position: 'relative', zIndex: 10 }}>Looks great! Find my matches →</button>

      <style>{`@keyframes holoShift { 0% { background-position: 0% 50%; } 100% { background-position: 200% 50%; } }`}</style>
    </div>
  );
};

// Demo sub-components - Generating Matches
const DemoGenerating = ({ onComplete }: { onComplete: () => void }) => {
  const [step, setStep] = useState(0);
  const steps = ["Analyzing your goals...", "Scanning 200+ attendees...", "Finding complementary profiles...", "Ranking connection potential...", "Finalizing your matches..."];

  useEffect(() => {
    const interval = setInterval(() => {
      setStep(prev => {
        if (prev >= steps.length - 1) { clearInterval(interval); setTimeout(onComplete, 800); return prev; }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [onComplete, steps.length]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: BG_PRIMARY, padding: 24, position: 'relative', overflow: 'hidden' }}>
      <AmbientBackground intensity={0.8} />

      <div style={{ position: 'relative', width: 120, height: 120, marginBottom: 40, zIndex: 10 }}>
        <div style={{ position: 'absolute', inset: 0, border: `3px solid ${BG_ELEVATED}`, borderTopColor: WISCONSIN_RED, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <div style={{ position: 'absolute', inset: 12, border: `3px solid ${BG_ELEVATED}`, borderTopColor: WISCONSIN_RED_LIGHT, borderRadius: '50%', animation: 'spin 1.5s linear infinite reverse' }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Breathing duration={6}><WisconsinLogo size={48} /></Breathing></div>
      </div>

      <p style={{ fontSize: 16, color: TEXT_PRIMARY, marginBottom: 8, textAlign: 'center', position: 'relative', zIndex: 10 }}>{steps[step]}</p>

      <div style={{ display: 'flex', gap: 6, marginTop: 20, position: 'relative', zIndex: 10 }}>
        {steps.map((_, i) => <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: i <= step ? WISCONSIN_RED : BG_ELEVATED, transition: 'background 0.3s ease', boxShadow: i <= step ? `0 0 8px ${WISCONSIN_RED_GLOW}` : 'none' }} />)}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

// Demo sub-components - Match Card
const MatchPreviewCard = ({ match, index, onSelect }: { match: typeof MOCK_MATCHES[0]; index: number; onSelect: () => void }) => {
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setIsVisible(true), 150 + index * 120); return () => clearTimeout(t); }, [index]);

  return (
    <div onClick={onSelect} style={{
      background: `linear-gradient(145deg, ${BG_SURFACE} 0%, ${BG_PRIMARY} 100%)`,
      borderRadius: 16, padding: 20, border: `1px solid rgba(255,255,255,0.05)`,
      cursor: 'pointer', opacity: isVisible ? 1 : 0, transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
      transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
      boxShadow: `6px 6px 16px rgba(0,0,0,0.3), -2px -2px 8px rgba(255,255,255,0.02), inset 0 1px 0 rgba(255,255,255,0.05)`
    }}>
      <div style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
        <Avatar initials={match.initials} size={52} />
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: TEXT_PRIMARY, marginBottom: 2, margin: 0 }}>{match.name}</h3>
          <p style={{ fontSize: 12, color: TEXT_SECONDARY, margin: 0 }}>{match.title}</p>
          <p style={{ fontSize: 12, color: WISCONSIN_RED, margin: 0 }}>{match.company}</p>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, padding: '12px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: 10, marginBottom: 12, border: '1px solid rgba(255,255,255,0.03)' }}>
        <span style={{ fontSize: 16 }}>🎯</span>
        <div>
          <p style={{ fontSize: 10, fontWeight: 600, color: TEXT_MUTED, textTransform: 'uppercase', marginBottom: 4, margin: 0 }}>Why You Match</p>
          <p style={{ fontSize: 13, color: TEXT_SECONDARY, lineHeight: 1.5, margin: 0 }}>{match.matchReason}</p>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, padding: '12px 14px', background: 'rgba(197, 5, 12, 0.08)', borderRadius: 10, border: `1px solid rgba(197, 5, 12, 0.2)` }}>
        <span style={{ fontSize: 16 }}>💬</span>
        <div>
          <p style={{ fontSize: 10, fontWeight: 600, color: WISCONSIN_RED, textTransform: 'uppercase', marginBottom: 4, margin: 0 }}>Talk About</p>
          <p style={{ fontSize: 13, color: WISCONSIN_RED_LIGHT, fontWeight: 500, margin: 0 }}>{match.conversationTopic}</p>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6, marginTop: 14, color: WISCONSIN_RED, fontSize: 13, fontWeight: 500 }}><span>View profile</span><span>→</span></div>
    </div>
  );
};

// Demo sub-components - Match Reveal
const DemoMatchReveal = ({ onSelectMatch, onContinue }: { onSelectMatch: (match: typeof MOCK_MATCHES[0]) => void; onContinue: () => void }) => (
  <div style={{ minHeight: '100vh', background: BG_PRIMARY, position: 'relative', display: 'flex', flexDirection: 'column' }}>
    <AmbientBackground intensity={0.5} />

    <div style={{ padding: '28px 20px 16px', textAlign: 'center', position: 'relative', zIndex: 10 }}>
      <Breathing duration={6}><p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.15em', color: WISCONSIN_RED, textTransform: 'uppercase', marginBottom: 8 }}>Your Matches</p></Breathing>
      <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 26, color: TEXT_PRIMARY, marginBottom: 8, margin: 0 }}>We found {MOCK_MATCHES.length} ideal connections</h1>
      <p style={{ fontSize: 13, color: TEXT_SECONDARY, marginBottom: 16, margin: 0 }}>Tap any card to see the full profile</p>
    </div>

    <div style={{ padding: '12px 20px 120px', display: 'flex', flexDirection: 'column', gap: 16, position: 'relative', zIndex: 10, flex: 1 }}>
      {MOCK_MATCHES.map((match, i) => <MatchPreviewCard key={match.id} match={match} index={i} onSelect={() => onSelectMatch(match)} />)}
    </div>

    <div style={{ padding: '20px', paddingBottom: '40px', background: `linear-gradient(transparent, ${BG_PRIMARY} 30%)`, position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 20 }}>
      <button onClick={onContinue} style={{ width: '100%', maxWidth: 400, margin: '0 auto', display: 'block', padding: 16, borderRadius: 14, border: 'none', background: `linear-gradient(135deg, ${WISCONSIN_RED} 0%, ${WISCONSIN_RED_DIM} 100%)`, color: TEXT_PRIMARY, fontSize: 16, fontWeight: 600, cursor: 'pointer', boxShadow: `0 8px 24px ${WISCONSIN_RED_GLOW}` }}>Great, I&apos;m ready for the event!</button>
    </div>
  </div>
);

// Demo sub-components - Match Detail
const DemoMatchDetail = ({ match, onBack }: { match: typeof MOCK_MATCHES[0]; onBack: () => void }) => (
  <div style={{ minHeight: '100vh', background: BG_PRIMARY, overflowY: 'auto', position: 'relative' }}>
    <AmbientBackground intensity={0.4} />
    <button onClick={onBack} style={{ position: 'absolute', top: 16, left: 16, zIndex: 100, padding: '8px 16px', borderRadius: 20, border: `1px solid rgba(255,255,255,0.1)`, background: 'rgba(10,10,10,0.8)', backdropFilter: 'blur(8px)', color: TEXT_PRIMARY, fontSize: 13, cursor: 'pointer' }}>← Back</button>

    <div style={{ padding: '60px 20px 32px', textAlign: 'center', position: 'relative', zIndex: 10 }}>
      <Avatar initials={match.initials} size={96} />
      <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 26, color: TEXT_PRIMARY, marginTop: 16, marginBottom: 4 }}>{match.name}</h1>
      <p style={{ fontSize: 14, color: TEXT_SECONDARY, margin: 0 }}>{match.title}</p>
      <p style={{ fontSize: 14, color: WISCONSIN_RED, margin: 0 }}>{match.company}</p>
    </div>

    <div style={{ padding: '0 20px 40px', position: 'relative', zIndex: 10 }}>
      <div style={{ background: `linear-gradient(145deg, ${BG_SURFACE} 0%, ${BG_PRIMARY} 100%)`, borderRadius: 16, padding: 20, marginBottom: 16, boxShadow: `4px 4px 12px rgba(0,0,0,0.3)` }}>
        <h3 style={{ fontSize: 11, fontWeight: 600, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12, margin: 0 }}>About</h3>
        <p style={{ fontSize: 14, color: TEXT_PRIMARY, lineHeight: 1.6, margin: 0 }}>{match.bio}</p>
      </div>

      <div style={{ background: `linear-gradient(145deg, ${BG_SURFACE} 0%, ${BG_PRIMARY} 100%)`, borderRadius: 16, padding: 20, marginBottom: 16, boxShadow: `4px 4px 12px rgba(0,0,0,0.3)` }}>
        <h3 style={{ fontSize: 11, fontWeight: 600, color: WISCONSIN_RED, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12, margin: 0 }}>🎯 Why You&apos;re Matched</h3>
        <p style={{ fontSize: 14, color: TEXT_PRIMARY, lineHeight: 1.6, margin: 0 }}>{match.matchReason}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <div style={{ background: `linear-gradient(145deg, ${BG_SURFACE} 0%, ${BG_PRIMARY} 100%)`, borderRadius: 14, padding: 16, boxShadow: `4px 4px 12px rgba(0,0,0,0.25)` }}>
          <h4 style={{ fontSize: 10, fontWeight: 600, color: TEXT_MUTED, textTransform: 'uppercase', marginBottom: 12, margin: 0 }}>Seeking</h4>
          {match.seeking.map((item, i) => <p key={i} style={{ fontSize: 12, color: TEXT_SECONDARY, marginBottom: 6, margin: i === match.seeking.length - 1 ? 0 : '0 0 6px 0' }}>• {item}</p>)}
        </div>
        <div style={{ background: `linear-gradient(145deg, ${BG_SURFACE} 0%, ${BG_PRIMARY} 100%)`, borderRadius: 14, padding: 16, boxShadow: `4px 4px 12px rgba(0,0,0,0.25)` }}>
          <h4 style={{ fontSize: 10, fontWeight: 600, color: TEXT_MUTED, textTransform: 'uppercase', marginBottom: 12, margin: 0 }}>Offering</h4>
          {match.offering.map((item, i) => <p key={i} style={{ fontSize: 12, color: TEXT_SECONDARY, marginBottom: 6, margin: i === match.offering.length - 1 ? 0 : '0 0 6px 0' }}>• {item}</p>)}
        </div>
      </div>

      <div style={{ background: `linear-gradient(135deg, rgba(197, 5, 12, 0.15) 0%, ${BG_SURFACE} 100%)`, borderRadius: 16, padding: 20, border: `1px solid rgba(197, 5, 12, 0.25)`, boxShadow: `0 0 30px ${WISCONSIN_RED_GLOW}` }}>
        <h3 style={{ fontSize: 11, fontWeight: 600, color: WISCONSIN_RED, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12, margin: 0 }}>💬 Conversation Starter</h3>
        <p style={{ fontFamily: 'Georgia, serif', fontSize: 15, color: TEXT_PRIMARY, lineHeight: 1.6, fontStyle: 'italic', margin: 0 }}>&ldquo;{match.conversationStarter}&rdquo;</p>
      </div>
    </div>
  </div>
);

// Demo sub-components - Confirmation
const DemoConfirmation = ({ onContinue }: { onContinue: () => void }) => (
  <div style={{ minHeight: '100vh', background: BG_PRIMARY, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
    <AmbientBackground intensity={0.6} />
    <div style={{ marginBottom: 32, position: 'relative', zIndex: 10 }}>
      <Breathing duration={4}>
        <div style={{ width: 100, height: 100, borderRadius: '50%', background: `linear-gradient(135deg, ${WISCONSIN_RED} 0%, ${WISCONSIN_RED_DIM} 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 60px ${WISCONSIN_RED_GLOW}`, fontSize: 48, color: TEXT_PRIMARY }}>✓</div>
      </Breathing>
    </div>
    <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 30, color: TEXT_PRIMARY, marginBottom: 12, position: 'relative', zIndex: 10 }}>You&apos;re all set!</h1>
    <p style={{ fontSize: 15, color: TEXT_SECONDARY, marginBottom: 8, maxWidth: 300, position: 'relative', zIndex: 10, margin: '0 0 8px 0' }}>We&apos;ll send you a reminder before the event with your match details.</p>
    <p style={{ fontSize: 14, color: TEXT_MUTED, marginBottom: 40, position: 'relative', zIndex: 10 }}>See you in Madison! 🏈</p>
    <button onClick={onContinue} style={{ padding: '16px 36px', borderRadius: 14, border: 'none', background: `linear-gradient(135deg, ${WISCONSIN_RED} 0%, ${WISCONSIN_RED_DIM} 100%)`, color: TEXT_PRIMARY, fontSize: 16, fontWeight: 600, cursor: 'pointer', boxShadow: `0 8px 24px ${WISCONSIN_RED_GLOW}`, position: 'relative', zIndex: 10 }}>Continue →</button>
  </div>
);

// Main Demo Component (orchestrates demo phases)
const DemoSection = ({ onComplete }: { onComplete: () => void }) => {
  const [demoPhase, setDemoPhase] = useState<DemoPhase>(DEMO_PHASES.INTRO_STORIES);
  const [selectedMatch, setSelectedMatch] = useState<typeof MOCK_MATCHES[0] | null>(null);

  const renderDemoPhase = () => {
    switch (demoPhase) {
      case DEMO_PHASES.INTRO_STORIES:
        return <DemoIntroStories onComplete={() => setDemoPhase(DEMO_PHASES.INTERVIEW)} />;
      case DEMO_PHASES.INTERVIEW:
        return <DemoInterview onComplete={() => setDemoPhase(DEMO_PHASES.CARD_PREVIEW)} />;
      case DEMO_PHASES.CARD_PREVIEW:
        return <DemoCardPreview onConfirm={() => setDemoPhase(DEMO_PHASES.GENERATING)} />;
      case DEMO_PHASES.GENERATING:
        return <DemoGenerating onComplete={() => setDemoPhase(DEMO_PHASES.MATCHES_REVEAL)} />;
      case DEMO_PHASES.MATCHES_REVEAL:
        return <DemoMatchReveal
          onSelectMatch={(m) => { setSelectedMatch(m); setDemoPhase(DEMO_PHASES.MATCH_DETAIL); }}
          onContinue={() => setDemoPhase(DEMO_PHASES.CONFIRMATION)}
        />;
      case DEMO_PHASES.MATCH_DETAIL:
        return selectedMatch ? <DemoMatchDetail match={selectedMatch} onBack={() => setDemoPhase(DEMO_PHASES.MATCHES_REVEAL)} /> : null;
      case DEMO_PHASES.CONFIRMATION:
        return <DemoConfirmation onContinue={onComplete} />;
      default:
        return <DemoIntroStories onComplete={() => setDemoPhase(DEMO_PHASES.INTERVIEW)} />;
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: 480, minHeight: '100vh', margin: '0 auto', background: BG_PRIMARY, position: 'relative' }}>
      {renderDemoPhase()}
    </div>
  );
};

// ============================================================================
// PITCH SECTION (Gold Theme with WAIT Animation)
// ============================================================================
const PitchSection = ({ onComplete }: { onComplete: () => void }) => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [introAnimated, setIntroAnimated] = useState(false);

  useEffect(() => {
    setTimeout(() => setIntroAnimated(true), 100);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const scrollTop = containerRef.current.scrollTop;
      const scrollHeight = containerRef.current.scrollHeight - containerRef.current.clientHeight;
      if (scrollHeight > 0) setScrollProgress(scrollTop / scrollHeight);
    };
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  const SectionContent = ({ level, headline, highlightText, bodyParagraphs, showButton }: { level: string; headline: string; highlightText: string; bodyParagraphs: string[]; showButton?: boolean }) => (
    <div style={{ maxWidth: 440, margin: '0 auto', textAlign: 'left', position: 'relative', zIndex: 10 }}>
      <p style={{ color: GOLD, fontSize: 12, fontWeight: 500, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 16 }}>{level}</p>
      <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 28, fontWeight: 400, lineHeight: 1.25, color: TEXT_PRIMARY, marginBottom: 24 }}>
        {headline} <span style={{ color: GOLD }}>{highlightText}</span>
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {bodyParagraphs.map((para, i) => (
          <p key={i} style={{ fontSize: 16, lineHeight: 1.7, color: TEXT_SECONDARY, margin: 0 }}>{para}</p>
        ))}
      </div>
      {showButton && (
        <button onClick={onComplete} style={{ marginTop: 40, padding: '16px 32px', borderRadius: 14, border: 'none', background: GOLD, color: BG_PRIMARY, fontSize: 15, fontWeight: 600, cursor: 'pointer', boxShadow: `0 8px 24px rgba(212, 168, 75, 0.3)` }}>
          See the packages →
        </button>
      )}
    </div>
  );

  return (
    <div ref={containerRef} style={{ height: '100vh', overflowY: 'auto', background: BG_PRIMARY, position: 'relative' }}>
      <style>{`
        @keyframes scrollBounce { 0%, 100% { transform: translateX(-50%) translateY(0); opacity: 1; } 50% { transform: translateX(-50%) translateY(12px); opacity: 0.5; } }
      `}</style>

      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 3, background: 'rgba(255,255,255,0.1)', zIndex: 100 }}>
        <div style={{ height: '100%', background: GOLD, width: `${scrollProgress * 100}%`, transition: 'width 0.1s ease-out' }} />
      </div>

      {/* WAIT Intro */}
      <section style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '64px 24px', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%, -50%)', width: 500, height: 500, pointerEvents: 'none', opacity: introAnimated ? 1 : 0, background: `radial-gradient(circle, ${GOLD}20 0%, transparent 70%)`, transition: 'all 1.5s ease' }} />
        <div style={{ maxWidth: 380, textAlign: 'center', position: 'relative', zIndex: 10 }}>
          <p style={{ fontSize: 13, color: GOLD, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 16, opacity: introAnimated ? 1 : 0, transition: 'opacity 0.8s ease' }}>Wait...</p>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 28, color: TEXT_PRIMARY, marginBottom: 20, lineHeight: 1.3, opacity: introAnimated ? 1 : 0, transform: introAnimated ? 'translateY(0)' : 'translateY(20px)', transition: 'all 0.8s ease 0.3s' }}>Now imagine every VIP at your conference having this experience.</h1>
          <p style={{ fontSize: 16, color: TEXT_SECONDARY, lineHeight: 1.6, opacity: introAnimated ? 1 : 0, transform: introAnimated ? 'translateY(0)' : 'translateY(20px)', transition: 'all 0.8s ease 0.6s', margin: 0 }}>Pre-event intelligence. Curated connections. Conversations that actually matter.</p>
        </div>
        <div style={{ position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)', textAlign: 'center', opacity: introAnimated ? 1 : 0, transition: 'opacity 0.8s ease 1.2s' }}>
          <p style={{ fontSize: 11, color: TEXT_MUTED, marginBottom: 8, letterSpacing: '0.1em' }}>Scroll to explore</p>
          <div style={{ width: 24, height: 40, borderRadius: 12, border: `2px solid ${TEXT_MUTED}`, margin: '0 auto', position: 'relative' }}>
            <div style={{ width: 4, height: 8, borderRadius: 2, background: GOLD, position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', animation: 'scrollBounce 2s ease-in-out infinite' }} />
          </div>
        </div>
      </section>

      {/* Level 1 */}
      <section style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '64px 24px', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%, -50%)', width: 400, height: 400, background: `radial-gradient(circle, ${GOLD}12 0%, transparent 70%)`, pointerEvents: 'none' }} />
        <SectionContent level="Level 1: VIP Digital Experience" headline="Before the conference starts, your VIPs know" highlightText="exactly who to meet." bodyParagraphs={["M33T for your VIP attendees.", "AI-powered profiling, curated matches, conversation starters—all delivered digitally before they arrive.", "They come with purpose, not just a badge."]} />
      </section>

      {/* Level 2 */}
      <section style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '64px 24px', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%, -50%)', width: 400, height: 400, background: `radial-gradient(circle, ${GOLD}12 0%, transparent 70%)`, pointerEvents: 'none' }} />
        <SectionContent level="Level 2: Full Digital Experience" headline="Expand the network. Two audiences," highlightText="one connected platform." bodyParagraphs={["M33T for both VIPs AND student attendees—two separate but connected networks.", "VIPs can discover promising students.", "Students can connect with industry leaders.", "All still digital, but now everyone's in."]} />
      </section>

      {/* Level 3 */}
      <section style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '64px 24px', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%, -50%)', width: 400, height: 400, background: `radial-gradient(circle, ${GOLD}12 0%, transparent 70%)`, pointerEvents: 'none' }} />
        <SectionContent level="Level 3: Full Experience + VIP Track" headline="While students attend their sessions, your VIPs have" highlightText="their own curated experience." bodyParagraphs={["Everything in Level 2, plus a dedicated VIP programming track.", "Executive roundtables, curated content, and facilitated networking woven throughout.", "33 Strategies handles the planning—your VIPs feel like the priority they are."]} showButton={true} />
      </section>
    </div>
  );
};

// ============================================================================
// PROPOSAL SECTION (Gold Theme)
// ============================================================================
const ProposalSection = () => {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [expandedTier, setExpandedTier] = useState<number | null>(1);

  const packages = [
    { name: 'Essential', price: '8,000', tagline: 'VIP Digital Experience', description: 'M33T for your VIP attendees. AI-powered profiling, curated matches, conversation starters—delivered before they arrive.', features: ['Branded VIP intake experience', 'AI-powered attendee profiling', '3-5 curated matches per attendee', 'Personalized conversation starters', 'Full VIP directory access', 'Post-event analytics'], outcome: 'VIPs arrive knowing exactly who to meet', highlighted: false },
    { name: 'Premium', price: '12,000', tagline: 'Full Digital Experience', description: 'Expand the network. M33T for both VIPs and students—two connected audiences, one powerful platform.', features: ['Everything in Essential', 'Student attendee network (separate but connected)', 'Cross-network matching (VIP ↔ Student)', 'Expanded directory access', 'Network analytics dashboard', 'Priority support'], outcome: 'Two audiences. One connected experience.', highlighted: true, badge: 'Most Popular' },
    { name: 'Full Experience', price: '20,000', tagline: 'Full Experience + VIP Track', description: 'The complete package. Digital platform for all, plus a dedicated VIP track with programming and facilitated networking.', features: ['Everything in Premium', 'Curated VIP programming track', 'In-person facilitated networking sessions', 'Executive roundtables', 'Pre-conference VIP reception', '33 Strategies event coordination', 'Dedicated VIP concierge'], outcome: 'A conference within a conference—designed for your VIPs', highlighted: false, badge: 'White Glove' },
  ];

  const faqs = [
    { q: 'How many VIPs can this support?', a: 'The app scales to any size. For in-person experiences, we recommend 50-150 VIPs for optimal connection quality.' },
    { q: 'What data do you need?', a: 'Just your VIP list with names and emails. We handle all intake, profiling, and matching.' },
    { q: 'How far in advance?', a: '6-8 weeks for Premium/Full Experience. Essential can deploy in 3 weeks.' },
  ];

  return (
    <div style={{ minHeight: '100%', background: BG_PRIMARY, overflowY: 'auto' }}>
      {/* Header */}
      <div style={{ padding: '48px 24px 40px', textAlign: 'center', background: `radial-gradient(ellipse at 50% 0%, ${GOLD}12 0%, transparent 60%)`, borderBottom: `1px solid rgba(255,255,255,0.05)` }}>
        <div style={{ width: 48, height: 48, borderRadius: 10, background: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontFamily: 'Georgia, serif', fontSize: 22, fontWeight: 700, color: BG_PRIMARY }}>33</div>
        <p style={{ fontSize: 11, fontWeight: 600, color: GOLD, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>Better Networking for WSBC</p>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 26, color: TEXT_PRIMARY, marginBottom: 12, lineHeight: 1.3 }}>Make your VIPs feel like VIPs</h1>
        <p style={{ fontSize: 14, color: TEXT_SECONDARY, maxWidth: 340, margin: '0 auto', lineHeight: 1.6 }}>Pre-event intelligence. Curated connections. A dedicated experience.</p>
      </div>

      {/* Packages */}
      <div style={{ padding: '32px 20px' }}>
        <h2 style={{ fontSize: 11, fontWeight: 600, color: TEXT_MUTED, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 20, textAlign: 'center' }}>Choose Your Experience</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {packages.map((pkg, i) => (
            <div key={i} onClick={() => setExpandedTier(expandedTier === i ? null : i)} style={{ background: `linear-gradient(145deg, ${BG_SURFACE} 0%, ${BG_PRIMARY} 100%)`, borderRadius: 16, padding: expandedTier === i ? 24 : 20, border: `1px solid ${pkg.highlighted ? GOLD : 'rgba(255,255,255,0.08)'}`, position: 'relative', boxShadow: pkg.highlighted ? `0 0 40px rgba(212, 168, 75, 0.15)` : 'none', cursor: 'pointer', transition: 'all 0.3s ease' }}>
              {pkg.badge && <div style={{ position: 'absolute', top: 12, right: 12, padding: '4px 10px', borderRadius: 12, background: pkg.highlighted ? GOLD : `${GOLD}30`, fontSize: 9, fontWeight: 700, color: pkg.highlighted ? BG_PRIMARY : GOLD, textTransform: 'uppercase' }}>{pkg.badge}</div>}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 4 }}>
                <h3 style={{ fontSize: 18, fontWeight: 600, color: TEXT_PRIMARY, margin: 0 }}>{pkg.name}</h3>
                <span style={{ fontSize: 12, color: TEXT_MUTED }}>{pkg.tagline}</span>
              </div>
              <p style={{ fontFamily: 'Georgia, serif', fontSize: 32, color: GOLD, marginBottom: 8 }}>${pkg.price}</p>
              {expandedTier === i ? (
                <>
                  <p style={{ fontSize: 13, color: TEXT_SECONDARY, marginBottom: 16, lineHeight: 1.5 }}>{pkg.description}</p>
                  <div style={{ background: `rgba(212, 168, 75, 0.1)`, border: `1px solid rgba(212, 168, 75, 0.3)`, borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: GOLD, marginBottom: 2, margin: 0 }}>THE OUTCOME</p>
                    <p style={{ fontFamily: 'Georgia, serif', fontSize: 14, color: TEXT_PRIMARY, fontStyle: 'italic', margin: 0 }}>{pkg.outcome}</p>
                  </div>
                  <div style={{ borderTop: `1px solid rgba(255,255,255,0.05)`, paddingTop: 16 }}>
                    {pkg.features.map((f, j) => (
                      <div key={j} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                        <span style={{ color: GOLD }}>✓</span>
                        <span style={{ fontSize: 13, color: TEXT_SECONDARY }}>{f}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p style={{ fontFamily: 'Georgia, serif', fontSize: 13, color: TEXT_MUTED, fontStyle: 'italic', margin: 0 }}>{pkg.outcome}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* FAQs */}
      <div style={{ padding: '0 20px 32px' }}>
        <h2 style={{ fontSize: 11, fontWeight: 600, color: TEXT_MUTED, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 16 }}>Questions</h2>
        {faqs.map((faq, i) => (
          <div key={i} style={{ borderBottom: `1px solid rgba(255,255,255,0.05)`, paddingBottom: 16, marginBottom: 16 }}>
            <button onClick={() => setExpandedFaq(expandedFaq === i ? null : i)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}>
              <span style={{ fontSize: 14, fontWeight: 500, color: TEXT_PRIMARY }}>{faq.q}</span>
              <span style={{ color: TEXT_MUTED, transform: expandedFaq === i ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease', fontSize: 12 }}>▼</span>
            </button>
            {expandedFaq === i && <p style={{ fontSize: 13, color: TEXT_SECONDARY, marginTop: 12, lineHeight: 1.6, margin: 0 }}>{faq.a}</p>}
          </div>
        ))}
      </div>

      {/* CTA */}
      <div style={{ padding: '24px 20px 40px', textAlign: 'center', background: `radial-gradient(ellipse at 50% 100%, ${GOLD}10 0%, transparent 60%)` }}>
        <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 22, color: TEXT_PRIMARY, marginBottom: 12 }}>Ready to elevate the VIP experience?</h2>
        <p style={{ fontSize: 13, color: TEXT_SECONDARY, marginBottom: 24 }}>Let&apos;s design something that makes your top attendees feel valued.</p>
        <button style={{ padding: '16px 44px', borderRadius: 14, border: 'none', background: GOLD, color: BG_PRIMARY, fontSize: 16, fontWeight: 600, cursor: 'pointer', marginBottom: 16, boxShadow: `0 8px 24px rgba(212, 168, 75, 0.25)` }}>Schedule a Call</button>
        <p style={{ fontSize: 12, color: TEXT_MUTED, margin: 0 }}>or email <span style={{ color: GOLD }}>beems@33strategies.com</span></p>
      </div>

      {/* Footer */}
      <div style={{ padding: 20, borderTop: `1px solid rgba(255,255,255,0.05)`, textAlign: 'center' }}>
        <p style={{ fontSize: 11, color: TEXT_MUTED, margin: 0 }}><span style={{ color: GOLD }}>33</span> Strategies • Better Networking</p>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function WSBCFinalProposal() {
  const [phase, setPhase] = useState<Phase>('intro');
  const [demoVisible, setDemoVisible] = useState(false);

  // Handle demo fade-in
  useEffect(() => {
    if (phase === 'demo') {
      requestAnimationFrame(() => setDemoVisible(true));
    } else {
      setDemoVisible(false);
    }
  }, [phase]);

  return (
    <div style={{ background: BG_PRIMARY, minHeight: '100vh', color: TEXT_PRIMARY }}>
      {phase === 'intro' && (
        <M33TIntroSection onComplete={() => setPhase('demo')} />
      )}

      {phase === 'demo' && (
        <div style={{
          opacity: demoVisible ? 1 : 0,
          transition: 'opacity 0.8s ease-in-out',
        }}>
          <DemoSection onComplete={() => setPhase('pitch')} />
        </div>
      )}

      {phase === 'pitch' && (
        <PitchSection onComplete={() => setPhase('proposal')} />
      )}

      {phase === 'proposal' && (
        <ProposalSection />
      )}
    </div>
  );
}
