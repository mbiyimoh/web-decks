import { useState, useEffect, useRef, useCallback } from 'react';

// ============================================================================
// WISCONSIN SPORTS BUSINESS CONFERENCE — ENHANCED PROPOSAL
// ============================================================================

const WISCONSIN_RED = '#c5050c';
const WISCONSIN_RED_LIGHT = '#e23636';
const WISCONSIN_RED_DIM = '#8b0000';
const WISCONSIN_RED_GLOW = 'rgba(197, 5, 12, 0.15)';
const BG_PRIMARY = '#0a0a0a';
const BG_SURFACE = '#111111';
const BG_ELEVATED = '#1a1a1a';
const TEXT_PRIMARY = '#ffffff';
const TEXT_SECONDARY = '#a1a1a1';
const TEXT_MUTED = '#6b6b6b';
const GOLD_ACCENT = '#D4A84B';

const PHASES = {
  INTRO_STORIES: 'intro_stories',
  INTERVIEW: 'interview',
  CARD_PREVIEW: 'card_preview',
  GENERATING: 'generating',
  MATCHES_REVEAL: 'matches_reveal',
  MATCH_DETAIL: 'match_detail',
  ALL_ATTENDEES: 'all_attendees',
  ATTENDEE_DETAIL: 'attendee_detail',
  CONFIRMATION: 'confirmation',
  TRANSITION: 'transition',
  PITCH_SCROLLY: 'pitch_scrolly',
  PROPOSAL: 'proposal',
};

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
    { description: 'NIL expertise', detail: 'Understanding compliance and monetization best practices', urgency: 'exploratory' },
    { description: 'Media connections', detail: 'Content distribution partnerships', urgency: 'exploratory' },
  ],
  canHelpWith: [
    { description: 'Go-to-market strategy', detail: 'Launched 3 B2B products in sports tech vertical', availability: 'open' },
    { description: 'B2B sales', detail: '10+ years enterprise sales experience', availability: 'open' },
    { description: 'Tech partnerships', detail: 'Built integration partnerships with major platforms', availability: 'selective' },
    { description: 'Startup mentorship', detail: 'Happy to share lessons from my founder journey', availability: 'open' },
  ],
  expertise: ['Sports Tech', 'B2B Sales', 'Partnership Development'],
  style: 'Deep conversations over quick intros',
  communicationStyle: { primary: 'collaborative', pace: 'moderate' },
  preferences: ['Substantive discussions', 'Follow-through on commitments', 'Warm intros'],
  dealbreakers: ['Surface-level networking', 'No-shows'],
  idealMatch: 'Someone who knows the Big Ten athletic department landscape and can make warm introductions to key decision-makers.',
  conversationHooks: [
    { topic: 'Cubs baseball', why: 'Season ticket holder, great icebreaker' },
    { topic: 'Startup exits', why: 'Sold company in 2019, love founder stories' },
    { topic: 'Midwest tech scene', why: 'Passionate about building outside the coasts' },
  ],
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
  { id: 6, name: 'Melvin Gordon III', title: 'Co-Founder', company: 'Vibez Golf Club', initials: 'MG', bio: "Former Wisconsin RB, 2014 Doak Walker Award winner. NCAA single-game rushing record holder.", seeking: ['Sports lifestyle partners'], offering: ['Athlete brand insights'], category: 'Athlete / Entrepreneur' },
  { id: 7, name: 'Jonathan Taylor', title: 'Running Back', company: 'Indianapolis Colts', initials: 'JT', bio: "Wisconsin RB legend, 2x Doak Walker Award winner. 2021 NFL rushing champion.", seeking: ['NIL platform insights'], offering: ['Active NFL perspective'], category: 'Active NFL Player' },
  { id: 8, name: 'Sarah Franklin', title: 'Pro Volleyball', company: 'LOVB Madison', initials: 'SF', bio: "Wisconsin volleyball star, 2023 AVCA National Player of the Year. Now plays for LOVB Madison and USA National Team.", seeking: ["Women's sports media"], offering: ["Women's sports visibility"], category: 'Pro Athlete' },
  { id: 9, name: 'Montee Ball Jr', title: 'Ambassador', company: 'Sandstone Care', initials: 'MB', bio: "Wisconsin RB legend, College Football Hall of Fame 2025. NCAA record: 83 career TDs. Mental health advocate.", seeking: ['Athlete mental health partners'], offering: ['Mental health advocacy'], category: 'Hall of Famer' },
  { id: 10, name: 'Justin Klein', title: 'Founding Partner', company: 'Marks & Klein LLP', initials: 'JMK', bio: "Leading US franchise attorney. Founded the Wisconsin Sports Business Conference.", seeking: ['Conference sponsors'], offering: ['Legal expertise', 'WSBC network'], category: 'Conference Founder' },
];

// ============================================================================
// PREMIUM UI COMPONENTS
// ============================================================================

// AMBIENT BACKGROUND WITH PARTICLES AND MORPHING BLOBS
const AmbientBackground = ({ intensity = 1, color = WISCONSIN_RED }) => {
  const particleCount = 15;
  const particles = useRef(
    Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      delay: Math.random() * 12,
      duration: 12 + Math.random() * 10, // Faster: was 25-45s, now 12-22s
      xStart: Math.random() * 100,
      xDrift: (Math.random() - 0.5) * 40,
      size: 2 + Math.random() * 3,
      maxOpacity: (0.12 + Math.random() * 0.15) * intensity, // More visible: was 0.04-0.10, now 0.12-0.27
    }))
  ).current;

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      {/* Floating particles */}
      {particles.map(p => (
        <div key={p.id} style={{
          position: 'absolute', bottom: -20, left: `${p.xStart}%`,
          width: p.size, height: p.size, background: color,
          borderRadius: '50%', filter: 'blur(1px)',
          animation: `floatUp-${p.id} ${p.duration}s ease-in-out ${p.delay}s infinite`,
        }} />
      ))}
      
      {/* Morphing blobs */}
      <div style={{
        position: 'absolute', width: 400, height: 400, top: -100, right: -100,
        background: color, borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%',
        filter: 'blur(80px)', opacity: 0.12 * intensity,
        animation: 'blobMorph1 12s ease-in-out infinite alternate, blobDrift1 18s ease-in-out infinite alternate',
      }} />
      <div style={{
        position: 'absolute', width: 300, height: 300, bottom: '20%', left: -80,
        background: color, borderRadius: '40% 60% 60% 40% / 70% 30% 70% 30%',
        filter: 'blur(80px)', opacity: 0.1 * intensity,
        animation: 'blobMorph2 15s ease-in-out infinite alternate, blobDrift2 22s ease-in-out infinite alternate',
      }} />
      <div style={{
        position: 'absolute', width: 250, height: 250, top: '40%', right: '10%',
        background: color, borderRadius: '50% 50% 40% 60% / 40% 60% 40% 60%',
        filter: 'blur(80px)', opacity: 0.08 * intensity,
        animation: 'blobMorph3 10s ease-in-out infinite alternate',
      }} />
      
      <style>{`
        ${particles.map(p => `
          @keyframes floatUp-${p.id} {
            0% { transform: translateY(0) translateX(0); opacity: 0; }
            10% { opacity: 0; }
            25% { opacity: ${p.maxOpacity}; }
            75% { opacity: ${p.maxOpacity}; }
            90% { opacity: 0; }
            100% { transform: translateY(-100vh) translateX(${p.xDrift}px); opacity: 0; }
          }
        `).join('')}
        @keyframes blobMorph1 {
          0%, 100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
          50% { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; }
        }
        @keyframes blobMorph2 {
          0%, 100% { border-radius: 40% 60% 60% 40% / 70% 30% 70% 30%; }
          50% { border-radius: 60% 40% 30% 70% / 40% 60% 40% 60%; }
        }
        @keyframes blobMorph3 {
          0%, 100% { border-radius: 50% 50% 40% 60% / 40% 60% 40% 60%; }
          50% { border-radius: 40% 60% 60% 40% / 60% 40% 60% 40%; }
        }
        @keyframes blobDrift1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-30px, 20px) scale(1.05); }
          66% { transform: translate(20px, -10px) scale(0.95); }
        }
        @keyframes blobDrift2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(25px, -15px) scale(0.95); }
          66% { transform: translate(-15px, 25px) scale(1.08); }
        }
      `}</style>
    </div>
  );
};

// BREATHING ANIMATION
const Breathing = ({ children, duration = 5, delay = 0 }) => (
  <div style={{ display: 'inline-block', animation: `breathe ${duration}s ease-in-out ${delay}s infinite` }}>
    {children}
    <style>{`
      @keyframes breathe {
        0%, 100% { transform: scale(0.92); }
        50% { transform: scale(1.08); }
      }
    `}</style>
  </div>
);

// AVATAR WITH GRADIENT AND DEPTH
const Avatar = ({ initials, size = 64, color = WISCONSIN_RED }) => (
  <div style={{
    width: size, height: size, borderRadius: '50%',
    background: `linear-gradient(135deg, ${color} 0%, ${WISCONSIN_RED_DIM} 100%)`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: size * 0.35, fontWeight: 600, color: TEXT_PRIMARY,
    boxShadow: `0 4px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)`,
  }}>{initials}</div>
);

// WISCONSIN LOGO WITH GLOW
const WisconsinLogo = ({ size = 48 }) => (
  <div style={{
    width: size, height: size,
    background: `linear-gradient(135deg, ${WISCONSIN_RED} 0%, ${WISCONSIN_RED_DIM} 100%)`,
    borderRadius: size * 0.15, display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: size * 0.55, color: TEXT_PRIMARY,
    boxShadow: `0 4px 20px ${WISCONSIN_RED_GLOW}, inset 0 1px 0 rgba(255,255,255,0.15)`,
  }}>W</div>
);

// STORY PROGRESS BAR
const StoryProgressBar = ({ totalSlides, currentSlide, progress }) => (
  <div style={{ display: 'flex', gap: 4, padding: '16px 16px 12px', position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100 }}>
    {Array.from({ length: totalSlides }).map((_, i) => (
      <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.15)', overflow: 'hidden' }}>
        <div style={{ height: '100%', background: TEXT_PRIMARY, borderRadius: 2, width: i < currentSlide ? '100%' : i === currentSlide ? `${progress}%` : '0%' }} />
      </div>
    ))}
  </div>
);

// PROCESS FLOW DIAGRAM
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

// ============================================================================
// INTRO STORIES
// ============================================================================
const IntroStories = ({ onComplete }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [progress, setProgress] = useState(0);
  
  const slides = [
    { headline: "Wisconsin Sports Business Conference", subline: "Madison, WI • March 2025", visual: 'logo' },
    { headline: "You've been invited.", subline: "200+ executives, investors, and operators shaping the future of Midwest sports.", visual: 'exclusive' },
    { headline: "We make sure you meet the right people.", subline: "By learning what each VIP is looking for—and what they bring to the table.", visual: 'match' },
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

  const handleTap = (e) => {
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

// ============================================================================
// CHAT INTERVIEW
// ============================================================================
const ChatBubble = ({ role, text, isNew = false }) => {
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

const Interview = ({ onComplete }) => {
  const [messages, setMessages] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
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

  const handleSend = (text) => {
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
      
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: `1px solid rgba(255,255,255,0.05)`, display: 'flex', alignItems: 'center', gap: 12, position: 'relative', zIndex: 10, background: 'rgba(10,10,10,0.8)', backdropFilter: 'blur(12px)' }}>
        <Breathing duration={6}><WisconsinLogo size={36} /></Breathing>
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, color: TEXT_PRIMARY }}>WSBC Concierge</p>
          <p style={{ fontSize: 11, color: TEXT_MUTED }}>Finding your connections</p>
        </div>
        <div style={{ marginLeft: 'auto', fontSize: 11, color: TEXT_MUTED, background: BG_ELEVATED, padding: '4px 10px', borderRadius: 12 }}>{Math.min(currentQuestion + 1, INTERVIEW_QUESTIONS.length)}/{INTERVIEW_QUESTIONS.length}</div>
      </div>
      
      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 12, position: 'relative', zIndex: 10 }}>
        {messages.map((msg, i) => <ChatBubble key={i} {...msg} />)}
        
        {/* Quick reply buttons - only show when not complete */}
        {showQuickReply && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end', marginTop: 4 }}>
            {currentQ.options.map((opt, i) => (
              <button key={i} onClick={() => handleSend(opt)} style={{ padding: '10px 16px', borderRadius: 20, border: `1.5px solid ${WISCONSIN_RED}`, background: 'rgba(197, 5, 12, 0.1)', color: WISCONSIN_RED, fontSize: 13, fontWeight: 500, cursor: 'pointer', boxShadow: `0 2px 8px rgba(197, 5, 12, 0.2)` }}>{opt}</button>
            ))}
          </div>
        )}
        
        {/* Typing indicator */}
        {isTyping && (
          <div style={{ display: 'flex', gap: 5, padding: '14px 18px', background: BG_ELEVATED, borderRadius: '20px 20px 20px 6px', width: 'fit-content', boxShadow: `4px 4px 12px rgba(0,0,0,0.3)` }}>
            {[0, 1, 2].map(i => (<div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: TEXT_MUTED, animation: `typePulse 1.4s ease-in-out ${i * 0.15}s infinite` }} />))}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Text input - only show when not complete */}
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

// ============================================================================
// HOLOGRAPHIC TRADING CARD - L3 Read summary + L4 Deep full profile
// ============================================================================
const HolographicTradingCard = ({ profile, onConfirm }) => {
  const cardRef = useRef(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [autoRotate, setAutoRotate] = useState({ x: 0, y: 0 });
  const [showFullProfile, setShowFullProfile] = useState(false);
  const [expandedSection, setExpandedSection] = useState(null);
  
  useEffect(() => {
    let frame;
    let t = 0;
    const animate = () => {
      t += 0.015;
      setAutoRotate({ x: Math.sin(t * 0.8) * 3, y: Math.sin(t * 0.6) * 5 });
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);
  
  const handleMouseMove = useCallback((e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setRotation({ x: ((y - rect.height / 2) / (rect.height / 2)) * -12, y: ((x - rect.width / 2) / (rect.width / 2)) * 12 });
  }, []);
  
  const handleMouseLeave = () => { setIsHovering(false); setRotation({ x: 0, y: 0 }); };
  const finalRotation = isHovering ? rotation : autoRotate;
  const glareX = 50 + finalRotation.y * 2;
  const glareY = 50 + finalRotation.x * 2;

  // Helper: Urgency/Availability badge colors
  const getBadgeStyle = (type) => {
    const styles = {
      active: { bg: 'rgba(52, 211, 153, 0.15)', color: '#34D399' },
      exploratory: { bg: 'rgba(251, 191, 36, 0.12)', color: '#FBBF24' },
      open: { bg: 'rgba(52, 211, 153, 0.15)', color: '#34D399' },
      selective: { bg: 'rgba(255,255,255,0.08)', color: TEXT_MUTED },
    };
    return styles[type?.toLowerCase()] || styles.selective;
  };

  // Helper: Detail item component
  const DetailItem = ({ primary, secondary, badge }) => {
    const badgeStyle = getBadgeStyle(badge);
    return (
      <div style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 12, marginBottom: 8, border: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: secondary ? 6 : 0 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: TEXT_PRIMARY }}>{primary}</span>
          {badge && (
            <span style={{ fontSize: 9, fontWeight: 600, padding: '3px 8px', borderRadius: 20, background: badgeStyle.bg, color: badgeStyle.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{badge}</span>
          )}
        </div>
        {secondary && <p style={{ fontSize: 12, color: TEXT_MUTED, margin: 0, lineHeight: 1.5 }}>{secondary}</p>}
      </div>
    );
  };

  // Helper: Expandable section
  const ExpandableSection = ({ title, isOpen, onToggle, children }) => (
    <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 16 }}>
      <button onClick={onToggle} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', background: 'none', border: 'none', cursor: 'pointer' }}>
        <span style={{ fontSize: 10, fontWeight: 600, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{title}</span>
        <span style={{ color: TEXT_MUTED, fontSize: 12, transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.2s ease' }}>▼</span>
      </button>
      <div style={{ maxHeight: isOpen ? 600 : 0, overflow: 'hidden', transition: 'max-height 0.4s ease' }}>
        <div style={{ paddingBottom: 16 }}>{children}</div>
      </div>
    </div>
  );

  // ========== FULL PROFILE VIEW (L4 Deep with holographic styling) ==========
  if (showFullProfile) {
    return (
      <div style={{ minHeight: '100vh', background: BG_PRIMARY, overflowY: 'auto', position: 'relative' }}>
        <AmbientBackground intensity={0.5} />
        
        {/* Holographic header background */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 280, background: `linear-gradient(180deg, ${WISCONSIN_RED}20 0%, transparent 100%)`, pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, rgba(255,0,128,0.08) 0%, rgba(0,255,255,0.08) 25%, rgba(255,255,0,0.08) 50%, rgba(0,255,128,0.08) 75%, rgba(255,0,255,0.08) 100%)`, mixBlendMode: 'color-dodge', opacity: 0.5 }} />
        </div>
        
        <button onClick={() => setShowFullProfile(false)} style={{ position: 'fixed', top: 16, left: 16, zIndex: 100, padding: '10px 18px', borderRadius: 24, border: `1px solid ${WISCONSIN_RED}50`, background: 'rgba(10,10,10,0.9)', backdropFilter: 'blur(12px)', color: TEXT_PRIMARY, fontSize: 13, cursor: 'pointer', boxShadow: `0 4px 20px rgba(0,0,0,0.4)` }}>← Back to card</button>
        
        {/* Header with avatar */}
        <div style={{ padding: '70px 24px 24px', textAlign: 'center', position: 'relative', zIndex: 10 }}>
          {/* Avatar with holographic ring */}
          <div style={{ width: 96, height: 96, borderRadius: '50%', margin: '0 auto 16px', position: 'relative' }}>
            <div style={{ position: 'absolute', inset: -4, borderRadius: '50%', background: `conic-gradient(from 0deg, ${WISCONSIN_RED}, #ff0080, #00ffff, #ffff00, #00ff80, #ff00ff, ${WISCONSIN_RED})`, animation: 'holoSpin 4s linear infinite', opacity: 0.8 }} />
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: `linear-gradient(145deg, ${BG_ELEVATED} 0%, ${BG_SURFACE} 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 40px ${WISCONSIN_RED_GLOW}` }}>
              <span style={{ fontSize: 32, fontWeight: 600, color: WISCONSIN_RED }}>{profile.initials}</span>
            </div>
          </div>
          
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 26, color: TEXT_PRIMARY, marginBottom: 4 }}>{profile.name}</h1>
          <p style={{ fontSize: 14, color: TEXT_SECONDARY, marginBottom: 2 }}>{profile.headline}</p>
          <p style={{ fontSize: 13, color: TEXT_MUTED }}>{profile.title} at {profile.company} · {profile.location}</p>
          
          {/* Expertise tags */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginTop: 16 }}>
            {profile.expertise.map((tag, i) => (
              <span key={i} style={{ padding: '6px 14px', borderRadius: 20, fontSize: 11, fontWeight: 500, background: i === 0 ? 'rgba(197, 5, 12, 0.15)' : 'rgba(255,255,255,0.05)', color: i === 0 ? WISCONSIN_RED : TEXT_SECONDARY, border: `1px solid ${i === 0 ? 'rgba(197, 5, 12, 0.3)' : 'rgba(255,255,255,0.08)'}` }}>{tag}</span>
            ))}
          </div>
        </div>
        
        {/* Content */}
        <div style={{ padding: '0 20px 40px', position: 'relative', zIndex: 10 }}>
          {/* Exchange Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            <div style={{ padding: 14, borderRadius: 14, background: 'rgba(251, 191, 36, 0.08)', border: '1px solid rgba(251, 191, 36, 0.2)' }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#FBBF24', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12 }}>◎</span> Seeking
              </div>
              <p style={{ fontSize: 12, color: TEXT_SECONDARY, margin: 0, lineHeight: 1.5 }}>
                {profile.lookingFor.slice(0, 2).map(l => l.description).join(' · ')}
              </p>
            </div>
            <div style={{ padding: 14, borderRadius: 14, background: 'rgba(52, 211, 153, 0.08)', border: '1px solid rgba(52, 211, 153, 0.2)' }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#34D399', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12 }}>◈</span> Offering
              </div>
              <p style={{ fontSize: 12, color: TEXT_SECONDARY, margin: 0, lineHeight: 1.5 }}>
                {profile.canHelpWith.slice(0, 2).map(c => c.description).join(' · ')}
              </p>
            </div>
          </div>
          
          {/* Current Focus */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Current Focus</div>
            <p style={{ fontSize: 13, color: TEXT_SECONDARY, margin: 0, lineHeight: 1.6 }}>{profile.currentFocus}</p>
          </div>
          
          {/* Background */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Background</div>
            <p style={{ fontSize: 13, color: TEXT_SECONDARY, margin: 0, lineHeight: 1.6 }}>{profile.background}</p>
          </div>
          
          {/* Ideal Match Quote */}
          <div style={{ padding: 16, borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Ideal Connection</div>
            <p style={{ fontSize: 13, color: TEXT_SECONDARY, margin: 0, lineHeight: 1.6, fontStyle: 'italic', paddingLeft: 12, borderLeft: `2px solid ${WISCONSIN_RED}` }}>"{profile.idealMatch}"</p>
          </div>
          
          {/* Notable experiences */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)', marginBottom: 8 }}>
            {profile.notableExperiences.map((exp, i) => (
              <span key={i} style={{ fontSize: 11, color: TEXT_MUTED, background: 'rgba(255,255,255,0.03)', padding: '6px 12px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.06)' }}>{exp}</span>
            ))}
          </div>
          
          {/* EXPANDABLE SECTIONS (L4 Deep) */}
          <ExpandableSection title="What I'm Seeking (Detailed)" isOpen={expandedSection === 'seeking'} onToggle={() => setExpandedSection(expandedSection === 'seeking' ? null : 'seeking')}>
            {profile.lookingFor.map((item, i) => (
              <DetailItem key={i} primary={item.description} secondary={item.detail} badge={item.urgency} />
            ))}
          </ExpandableSection>
          
          <ExpandableSection title="What I Can Help With (Detailed)" isOpen={expandedSection === 'offering'} onToggle={() => setExpandedSection(expandedSection === 'offering' ? null : 'offering')}>
            {profile.canHelpWith.map((item, i) => (
              <DetailItem key={i} primary={item.description} secondary={item.detail} badge={item.availability} />
            ))}
          </ExpandableSection>
          
          <ExpandableSection title="Working Style" isOpen={expandedSection === 'style'} onToggle={() => setExpandedSection(expandedSection === 'style' ? null : 'style')}>
            <p style={{ fontSize: 13, color: TEXT_SECONDARY, margin: '0 0 12px' }}>
              {profile.communicationStyle.primary.charAt(0).toUpperCase() + profile.communicationStyle.primary.slice(1)} communicator, {profile.communicationStyle.pace} pace
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {profile.preferences.map((pref, i) => (
                <span key={i} style={{ fontSize: 11, padding: '5px 10px', borderRadius: 20, background: 'rgba(52, 211, 153, 0.1)', color: '#34D399' }}>{pref}</span>
              ))}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {profile.dealbreakers.map((db, i) => (
                <span key={i} style={{ fontSize: 11, padding: '5px 10px', borderRadius: 20, background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444' }}>✗ {db}</span>
              ))}
            </div>
          </ExpandableSection>
          
          <ExpandableSection title="Conversation Starters" isOpen={expandedSection === 'hooks'} onToggle={() => setExpandedSection(expandedSection === 'hooks' ? null : 'hooks')}>
            {profile.conversationHooks.map((hook, i) => (
              <DetailItem key={i} primary={hook.topic} secondary={hook.why} />
            ))}
          </ExpandableSection>
          
          {/* CTA */}
          <button onClick={onConfirm} style={{ width: '100%', marginTop: 24, padding: 16, borderRadius: 14, border: 'none', background: `linear-gradient(135deg, ${WISCONSIN_RED} 0%, ${WISCONSIN_RED_DIM} 100%)`, color: TEXT_PRIMARY, fontSize: 16, fontWeight: 600, cursor: 'pointer', boxShadow: `0 8px 24px ${WISCONSIN_RED_GLOW}` }}>Looks great! Find my matches →</button>
        </div>
        
        <style>{`@keyframes holoSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ========== SUMMARY CARD VIEW (L3 Read level) ==========
  return (
    <div style={{ minHeight: '100vh', background: BG_PRIMARY, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', position: 'relative', overflow: 'hidden' }}>
      <AmbientBackground intensity={0.6} />
      
      <div style={{ textAlign: 'center', marginBottom: 20, position: 'relative', zIndex: 10 }}>
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.15em', color: WISCONSIN_RED, textTransform: 'uppercase', marginBottom: 8 }}>Your VIP Profile</p>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 22, color: TEXT_PRIMARY }}>Here's how you'll appear</h1>
      </div>
      
      {/* 3D Card Container */}
      <div style={{ perspective: 1200, perspectiveOrigin: '50% 50%', position: 'relative', zIndex: 10 }}>
        <div ref={cardRef} onMouseMove={handleMouseMove} onMouseEnter={() => setIsHovering(true)} onMouseLeave={handleMouseLeave}
          style={{ width: 300, minHeight: 420, borderRadius: 20, position: 'relative', transformStyle: 'preserve-3d', transform: `rotateX(${finalRotation.x}deg) rotateY(${finalRotation.y}deg)`, transition: isHovering ? 'none' : 'transform 0.1s ease-out', cursor: 'pointer' }}>
          
          {/* Card face */}
          <div style={{ position: 'absolute', inset: 0, borderRadius: 20, background: `linear-gradient(165deg, ${BG_ELEVATED} 0%, #0d0d0d 50%, ${BG_SURFACE} 100%)`, border: `2px solid ${WISCONSIN_RED}`, boxShadow: `0 25px 50px rgba(0,0,0,0.5), 0 0 60px ${WISCONSIN_RED_GLOW}, inset 0 1px 0 rgba(255,255,255,0.1)`, overflow: 'hidden' }}>
            
            {/* Holographic rainbow */}
            <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(${125 + finalRotation.y * 2}deg, rgba(255,0,128,0.1) 0%, rgba(0,255,255,0.1) 25%, rgba(255,255,0,0.1) 50%, rgba(0,255,128,0.1) 75%, rgba(255,0,255,0.1) 100%)`, mixBlendMode: 'color-dodge', opacity: 0.6, pointerEvents: 'none' }} />
            
            {/* Glare */}
            <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.1) 20%, transparent 60%)`, pointerEvents: 'none' }} />
            
            {/* Header gradient */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 100, background: `linear-gradient(180deg, ${WISCONSIN_RED}25 0%, transparent 100%)`, pointerEvents: 'none' }} />
            
            {/* Content - L3 Read level */}
            <div style={{ padding: '16px 18px', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
              {/* Header badges */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ width: 26, height: 26, borderRadius: 6, background: WISCONSIN_RED, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 14, color: TEXT_PRIMARY, boxShadow: `0 2px 8px ${WISCONSIN_RED_GLOW}` }}>W</div>
                <div style={{ fontSize: 8, color: TEXT_MUTED, textAlign: 'right', lineHeight: 1.3, background: 'rgba(0,0,0,0.3)', padding: '4px 8px', borderRadius: 6 }}>WSBC 2025<br/>VIP ATTENDEE</div>
              </div>
              
              {/* Profile header */}
              <div style={{ textAlign: 'center', marginBottom: 12 }}>
                <Avatar initials={profile.initials} size={56} />
                <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 17, color: TEXT_PRIMARY, marginTop: 10, marginBottom: 3 }}>{profile.name}</h2>
                <p style={{ fontSize: 11, color: TEXT_SECONDARY, marginBottom: 1 }}>{profile.headline}</p>
                <p style={{ fontSize: 10, color: TEXT_MUTED }}>{profile.title} · {profile.location}</p>
              </div>
              
              {/* Expertise tags */}
              <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
                {profile.expertise.map((tag, i) => (
                  <span key={i} style={{ padding: '4px 10px', borderRadius: 12, fontSize: 9, fontWeight: 500, background: i === 0 ? 'rgba(197, 5, 12, 0.2)' : 'rgba(255,255,255,0.05)', color: i === 0 ? WISCONSIN_RED : TEXT_SECONDARY }}>{tag}</span>
                ))}
              </div>
              
              {/* Exchange cards - compact */}
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
              
              {/* Current focus - brief */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 8, fontWeight: 600, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Current Focus</div>
                <p style={{ fontSize: 10, color: TEXT_SECONDARY, margin: 0, lineHeight: 1.5 }}>{profile.currentFocus.split('.')[0]}.</p>
              </div>
              
              {/* View full profile link */}
              <button onClick={(e) => { e.stopPropagation(); setShowFullProfile(true); }} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '8px 12px', color: TEXT_SECONDARY, fontSize: 10, cursor: 'pointer', marginTop: 'auto', marginBottom: 8, transition: '0.2s ease' }}>
                View full profile →
              </button>
              
              {/* Holographic stripe */}
              <div style={{ height: 4, borderRadius: 2, background: `linear-gradient(90deg, rgba(255,0,128,0.6) 0%, rgba(0,255,255,0.6) 25%, rgba(255,255,0,0.6) 50%, rgba(0,255,128,0.6) 75%, rgba(255,0,255,0.6) 100%)`, backgroundSize: '200% 100%', animation: 'holoShift 3s linear infinite' }} />
            </div>
          </div>
          
          {/* Shadow */}
          <div style={{ position: 'absolute', bottom: -20, left: '10%', right: '10%', height: 40, background: 'rgba(0,0,0,0.4)', borderRadius: '50%', filter: 'blur(20px)', transform: `scale(${1 + Math.abs(finalRotation.y) * 0.01})`, opacity: 0.6, zIndex: -1 }} />
        </div>
      </div>
      
      <button onClick={onConfirm} style={{ marginTop: 24, padding: '16px 32px', borderRadius: 14, border: 'none', background: `linear-gradient(135deg, ${WISCONSIN_RED} 0%, ${WISCONSIN_RED_DIM} 100%)`, color: TEXT_PRIMARY, fontSize: 16, fontWeight: 600, cursor: 'pointer', boxShadow: `0 8px 24px ${WISCONSIN_RED_GLOW}`, position: 'relative', zIndex: 10 }}>Looks great! Find my matches →</button>
      
      <style>{`@keyframes holoShift { 0% { background-position: 0% 50%; } 100% { background-position: 200% 50%; } }`}</style>
    </div>
  );
};

// ============================================================================
// GENERATING MATCHES
// ============================================================================
const GeneratingMatches = ({ onComplete }) => {
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
      
      {/* Spinner */}
      <div style={{ position: 'relative', width: 120, height: 120, marginBottom: 40, zIndex: 10 }}>
        <div style={{ position: 'absolute', inset: 0, border: `3px solid ${BG_ELEVATED}`, borderTopColor: WISCONSIN_RED, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <div style={{ position: 'absolute', inset: 12, border: `3px solid ${BG_ELEVATED}`, borderTopColor: WISCONSIN_RED_LIGHT, borderRadius: '50%', animation: 'spin 1.5s linear infinite reverse' }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Breathing duration={6}><WisconsinLogo size={48} /></Breathing></div>
      </div>
      
      <p style={{ fontSize: 16, color: TEXT_PRIMARY, marginBottom: 8, textAlign: 'center', position: 'relative', zIndex: 10 }}>{steps[step]}</p>
      
      {/* Progress dots */}
      <div style={{ display: 'flex', gap: 6, marginTop: 20, position: 'relative', zIndex: 10 }}>
        {steps.map((_, i) => <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: i <= step ? WISCONSIN_RED : BG_ELEVATED, transition: 'background 0.3s ease', boxShadow: i <= step ? `0 0 8px ${WISCONSIN_RED_GLOW}` : 'none' }} />)}
      </div>
      
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

// ============================================================================
// MATCH CARDS
// ============================================================================
const MatchPreviewCard = ({ match, index, onSelect }) => {
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
          <h3 style={{ fontSize: 16, fontWeight: 600, color: TEXT_PRIMARY, marginBottom: 2 }}>{match.name}</h3>
          <p style={{ fontSize: 12, color: TEXT_SECONDARY }}>{match.title}</p>
          <p style={{ fontSize: 12, color: WISCONSIN_RED }}>{match.company}</p>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, padding: '12px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: 10, marginBottom: 12, border: '1px solid rgba(255,255,255,0.03)' }}>
        <span style={{ fontSize: 16 }}>🎯</span>
        <div>
          <p style={{ fontSize: 10, fontWeight: 600, color: TEXT_MUTED, textTransform: 'uppercase', marginBottom: 4 }}>Why You Match</p>
          <p style={{ fontSize: 13, color: TEXT_SECONDARY, lineHeight: 1.5 }}>{match.matchReason}</p>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, padding: '12px 14px', background: 'rgba(197, 5, 12, 0.08)', borderRadius: 10, border: `1px solid rgba(197, 5, 12, 0.2)` }}>
        <span style={{ fontSize: 16 }}>💬</span>
        <div>
          <p style={{ fontSize: 10, fontWeight: 600, color: WISCONSIN_RED, textTransform: 'uppercase', marginBottom: 4 }}>Talk About</p>
          <p style={{ fontSize: 13, color: WISCONSIN_RED_LIGHT, fontWeight: 500 }}>{match.conversationTopic}</p>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6, marginTop: 14, color: WISCONSIN_RED, fontSize: 13, fontWeight: 500 }}><span>View profile</span><span>→</span></div>
    </div>
  );
};

const MatchReveal = ({ onSelectMatch, onContinue, onViewAll }) => (
  <div style={{ minHeight: '100vh', background: BG_PRIMARY, position: 'relative', display: 'flex', flexDirection: 'column' }}>
    <AmbientBackground intensity={0.5} />
    
    <div style={{ padding: '28px 20px 16px', textAlign: 'center', position: 'relative', zIndex: 10 }}>
      <Breathing duration={6}><p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.15em', color: WISCONSIN_RED, textTransform: 'uppercase', marginBottom: 8 }}>Your Matches</p></Breathing>
      <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 26, color: TEXT_PRIMARY, marginBottom: 8 }}>We found {MOCK_MATCHES.length} ideal connections</h1>
      <p style={{ fontSize: 13, color: TEXT_SECONDARY, marginBottom: 16 }}>Tap any card to see the full profile</p>
      
      <button onClick={onViewAll} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 24, border: `1px solid rgba(255,255,255,0.15)`, background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(8px)', color: TEXT_SECONDARY, fontSize: 13, cursor: 'pointer' }}>
        <span>👥</span><span>Browse all {ALL_ATTENDEES.length} VIP attendees</span><span>→</span>
      </button>
    </div>
    
    <div style={{ padding: '12px 20px 120px', display: 'flex', flexDirection: 'column', gap: 16, position: 'relative', zIndex: 10, flex: 1 }}>
      {MOCK_MATCHES.map((match, i) => <MatchPreviewCard key={match.id} match={match} index={i} onSelect={() => onSelectMatch(match)} />)}
    </div>
    
    <div style={{ padding: '20px', paddingBottom: '40px', background: `linear-gradient(transparent, ${BG_PRIMARY} 30%)`, position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 20 }}>
      <button onClick={onContinue} style={{ width: '100%', maxWidth: 400, margin: '0 auto', display: 'block', padding: 16, borderRadius: 14, border: 'none', background: `linear-gradient(135deg, ${WISCONSIN_RED} 0%, ${WISCONSIN_RED_DIM} 100%)`, color: TEXT_PRIMARY, fontSize: 16, fontWeight: 600, cursor: 'pointer', boxShadow: `0 8px 24px ${WISCONSIN_RED_GLOW}` }}>Great, I'm ready for the event!</button>
    </div>
  </div>
);

const MatchDetail = ({ match, onBack }) => (
  <div style={{ minHeight: '100vh', background: BG_PRIMARY, overflowY: 'auto', position: 'relative' }}>
    <AmbientBackground intensity={0.4} />
    <button onClick={onBack} style={{ position: 'absolute', top: 16, left: 16, zIndex: 100, padding: '8px 16px', borderRadius: 20, border: `1px solid rgba(255,255,255,0.1)`, background: 'rgba(10,10,10,0.8)', backdropFilter: 'blur(8px)', color: TEXT_PRIMARY, fontSize: 13, cursor: 'pointer' }}>← Back</button>
    
    <div style={{ padding: '60px 20px 32px', textAlign: 'center', position: 'relative', zIndex: 10 }}>
      <Avatar initials={match.initials} size={96} />
      <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 26, color: TEXT_PRIMARY, marginTop: 16, marginBottom: 4 }}>{match.name}</h1>
      <p style={{ fontSize: 14, color: TEXT_SECONDARY }}>{match.title}</p>
      <p style={{ fontSize: 14, color: WISCONSIN_RED }}>{match.company}</p>
    </div>
    
    <div style={{ padding: '0 20px 40px', position: 'relative', zIndex: 10 }}>
      <div style={{ background: `linear-gradient(145deg, ${BG_SURFACE} 0%, ${BG_PRIMARY} 100%)`, borderRadius: 16, padding: 20, marginBottom: 16, boxShadow: `4px 4px 12px rgba(0,0,0,0.3)` }}>
        <h3 style={{ fontSize: 11, fontWeight: 600, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>About</h3>
        <p style={{ fontSize: 14, color: TEXT_PRIMARY, lineHeight: 1.6 }}>{match.bio}</p>
      </div>
      
      <div style={{ background: `linear-gradient(145deg, ${BG_SURFACE} 0%, ${BG_PRIMARY} 100%)`, borderRadius: 16, padding: 20, marginBottom: 16, boxShadow: `4px 4px 12px rgba(0,0,0,0.3)` }}>
        <h3 style={{ fontSize: 11, fontWeight: 600, color: WISCONSIN_RED, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>🎯 Why You're Matched</h3>
        <p style={{ fontSize: 14, color: TEXT_PRIMARY, lineHeight: 1.6 }}>{match.matchReason}</p>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <div style={{ background: `linear-gradient(145deg, ${BG_SURFACE} 0%, ${BG_PRIMARY} 100%)`, borderRadius: 14, padding: 16, boxShadow: `4px 4px 12px rgba(0,0,0,0.25)` }}>
          <h4 style={{ fontSize: 10, fontWeight: 600, color: TEXT_MUTED, textTransform: 'uppercase', marginBottom: 12 }}>Seeking</h4>
          {match.seeking.map((item, i) => <p key={i} style={{ fontSize: 12, color: TEXT_SECONDARY, marginBottom: 6 }}>• {item}</p>)}
        </div>
        <div style={{ background: `linear-gradient(145deg, ${BG_SURFACE} 0%, ${BG_PRIMARY} 100%)`, borderRadius: 14, padding: 16, boxShadow: `4px 4px 12px rgba(0,0,0,0.25)` }}>
          <h4 style={{ fontSize: 10, fontWeight: 600, color: TEXT_MUTED, textTransform: 'uppercase', marginBottom: 12 }}>Offering</h4>
          {match.offering.map((item, i) => <p key={i} style={{ fontSize: 12, color: TEXT_SECONDARY, marginBottom: 6 }}>• {item}</p>)}
        </div>
      </div>
      
      <div style={{ background: `linear-gradient(135deg, rgba(197, 5, 12, 0.15) 0%, ${BG_SURFACE} 100%)`, borderRadius: 16, padding: 20, border: `1px solid rgba(197, 5, 12, 0.25)`, boxShadow: `0 0 30px ${WISCONSIN_RED_GLOW}` }}>
        <h3 style={{ fontSize: 11, fontWeight: 600, color: WISCONSIN_RED, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>💬 Conversation Starter</h3>
        <p style={{ fontFamily: 'Georgia, serif', fontSize: 15, color: TEXT_PRIMARY, lineHeight: 1.6, fontStyle: 'italic' }}>"{match.conversationStarter}"</p>
      </div>
    </div>
  </div>
);

// ============================================================================
// ALL ATTENDEES GRID
// ============================================================================
const AttendeeSummaryCard = ({ attendee, index, onSelect, isMatch }) => {
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setIsVisible(true), 50 + index * 40); return () => clearTimeout(t); }, [index]);
  
  return (
    <div onClick={onSelect} style={{ 
      background: `linear-gradient(145deg, ${BG_SURFACE} 0%, ${BG_PRIMARY} 100%)`, borderRadius: 14, padding: 16, 
      border: isMatch ? `1.5px solid ${WISCONSIN_RED}` : `1px solid rgba(255,255,255,0.05)`, 
      cursor: 'pointer', opacity: isVisible ? 1 : 0, transform: isVisible ? 'translateY(0)' : 'translateY(16px)', 
      transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)', 
      boxShadow: isMatch ? `4px 4px 12px rgba(0,0,0,0.3), 0 0 20px ${WISCONSIN_RED_GLOW}` : `4px 4px 12px rgba(0,0,0,0.25)`,
      position: 'relative', overflow: 'hidden'
    }}>
      {isMatch && <div style={{ position: 'absolute', top: 10, right: 10, background: WISCONSIN_RED, padding: '3px 8px', borderRadius: 8, fontSize: 9, fontWeight: 700, color: TEXT_PRIMARY }}>MATCH</div>}
      {attendee.category && !isMatch && <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(255,255,255,0.08)', padding: '3px 8px', borderRadius: 8, fontSize: 9, fontWeight: 500, color: TEXT_MUTED }}>{attendee.category}</div>}
      
      <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
        <Avatar initials={attendee.initials} size={44} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: TEXT_PRIMARY, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{attendee.name}</h3>
          <p style={{ fontSize: 11, color: TEXT_SECONDARY, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{attendee.title}</p>
          <p style={{ fontSize: 11, color: WISCONSIN_RED }}>{attendee.company}</p>
        </div>
      </div>
      {attendee.bio && <p style={{ fontSize: 11, color: TEXT_MUTED, lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{attendee.bio}</p>}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 10, color: WISCONSIN_RED, fontSize: 11, fontWeight: 500 }}><span>View</span><span>→</span></div>
    </div>
  );
};

const AllAttendeesGrid = ({ onSelectAttendee, onBack }) => {
  const [filter, setFilter] = useState('all');
  const categories = ['all', ...new Set(ALL_ATTENDEES.filter(a => a.category).map(a => a.category))];
  const filteredAttendees = filter === 'all' ? ALL_ATTENDEES : ALL_ATTENDEES.filter(a => a.category === filter || MOCK_MATCHES.some(m => m.id === a.id));
  
  return (
    <div style={{ minHeight: '100vh', background: BG_PRIMARY, position: 'relative' }}>
      <AmbientBackground intensity={0.4} />
      
      <div style={{ padding: '16px 20px', borderBottom: `1px solid rgba(255,255,255,0.05)`, background: 'rgba(10,10,10,0.9)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <button onClick={onBack} style={{ padding: '8px 16px', borderRadius: 20, border: `1px solid rgba(255,255,255,0.1)`, background: 'rgba(255,255,255,0.05)', color: TEXT_PRIMARY, fontSize: 13, cursor: 'pointer' }}>← My Matches</button>
          <div style={{ flex: 1 }} />
          <Breathing duration={6}><WisconsinLogo size={28} /></Breathing>
        </div>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 22, color: TEXT_PRIMARY, marginBottom: 4 }}>All VIP Attendees</h1>
        <p style={{ fontSize: 12, color: TEXT_SECONDARY, marginBottom: 14 }}>{ALL_ATTENDEES.length} executives, athletes, and leaders</p>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          {categories.map(cat => (
            <button key={cat} onClick={() => setFilter(cat)} style={{ padding: '6px 14px', borderRadius: 16, border: 'none', background: filter === cat ? WISCONSIN_RED : 'rgba(255,255,255,0.08)', color: filter === cat ? TEXT_PRIMARY : TEXT_SECONDARY, fontSize: 11, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: filter === cat ? `0 2px 8px ${WISCONSIN_RED_GLOW}` : 'none' }}>
              {cat === 'all' ? 'All' : cat}
            </button>
          ))}
        </div>
      </div>
      
      <div style={{ padding: 16, position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
          {filteredAttendees.map((a, i) => <AttendeeSummaryCard key={a.id} attendee={a} index={i} onSelect={() => onSelectAttendee(a)} isMatch={MOCK_MATCHES.some(m => m.id === a.id)} />)}
        </div>
      </div>
    </div>
  );
};

const AttendeeDetail = ({ attendee, onBack, isMatch }) => (
  <div style={{ minHeight: '100vh', background: BG_PRIMARY, overflowY: 'auto', position: 'relative' }}>
    <AmbientBackground intensity={0.4} />
    <button onClick={onBack} style={{ position: 'absolute', top: 16, left: 16, zIndex: 100, padding: '8px 16px', borderRadius: 20, border: `1px solid rgba(255,255,255,0.1)`, background: 'rgba(10,10,10,0.8)', backdropFilter: 'blur(8px)', color: TEXT_PRIMARY, fontSize: 13, cursor: 'pointer' }}>← Back</button>
    
    <div style={{ padding: '60px 20px 24px', textAlign: 'center', position: 'relative', zIndex: 10 }}>
      {isMatch && <div style={{ display: 'inline-block', background: WISCONSIN_RED, padding: '4px 12px', borderRadius: 12, fontSize: 10, fontWeight: 700, color: TEXT_PRIMARY, marginBottom: 12 }}>YOUR MATCH</div>}
      {attendee.category && !isMatch && <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.1)', padding: '4px 12px', borderRadius: 12, fontSize: 10, fontWeight: 500, color: TEXT_MUTED, marginBottom: 12 }}>{attendee.category}</div>}
      <Avatar initials={attendee.initials} size={96} />
      <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 26, color: TEXT_PRIMARY, marginTop: 16, marginBottom: 4 }}>{attendee.name}</h1>
      <p style={{ fontSize: 14, color: TEXT_SECONDARY }}>{attendee.title}</p>
      <p style={{ fontSize: 14, color: WISCONSIN_RED }}>{attendee.company}</p>
    </div>
    
    <div style={{ padding: '0 20px 40px', position: 'relative', zIndex: 10 }}>
      {attendee.bio && (
        <div style={{ background: `linear-gradient(145deg, ${BG_SURFACE} 0%, ${BG_PRIMARY} 100%)`, borderRadius: 16, padding: 20, marginBottom: 16, boxShadow: `4px 4px 12px rgba(0,0,0,0.3)` }}>
          <h3 style={{ fontSize: 11, fontWeight: 600, color: TEXT_MUTED, textTransform: 'uppercase', marginBottom: 12 }}>About</h3>
          <p style={{ fontSize: 14, color: TEXT_PRIMARY, lineHeight: 1.6 }}>{attendee.bio}</p>
        </div>
      )}
      {isMatch && attendee.matchReason && (
        <div style={{ background: `linear-gradient(145deg, ${BG_SURFACE} 0%, ${BG_PRIMARY} 100%)`, borderRadius: 16, padding: 20, marginBottom: 16, boxShadow: `4px 4px 12px rgba(0,0,0,0.3)`, border: `1px solid rgba(197, 5, 12, 0.2)` }}>
          <h3 style={{ fontSize: 11, fontWeight: 600, color: WISCONSIN_RED, textTransform: 'uppercase', marginBottom: 12 }}>🎯 Why You're Matched</h3>
          <p style={{ fontSize: 14, color: TEXT_PRIMARY, lineHeight: 1.6 }}>{attendee.matchReason}</p>
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{ background: `linear-gradient(145deg, ${BG_SURFACE} 0%, ${BG_PRIMARY} 100%)`, borderRadius: 14, padding: 16, boxShadow: `4px 4px 12px rgba(0,0,0,0.25)` }}>
          <h4 style={{ fontSize: 10, fontWeight: 600, color: TEXT_MUTED, textTransform: 'uppercase', marginBottom: 12 }}>Seeking</h4>
          {(attendee.seeking || []).map((item, i) => <p key={i} style={{ fontSize: 12, color: TEXT_SECONDARY, marginBottom: 6 }}>• {item}</p>)}
        </div>
        <div style={{ background: `linear-gradient(145deg, ${BG_SURFACE} 0%, ${BG_PRIMARY} 100%)`, borderRadius: 14, padding: 16, boxShadow: `4px 4px 12px rgba(0,0,0,0.25)` }}>
          <h4 style={{ fontSize: 10, fontWeight: 600, color: TEXT_MUTED, textTransform: 'uppercase', marginBottom: 12 }}>Offering</h4>
          {(attendee.offering || []).map((item, i) => <p key={i} style={{ fontSize: 12, color: TEXT_SECONDARY, marginBottom: 6 }}>• {item}</p>)}
        </div>
      </div>
      {isMatch && attendee.conversationStarter && (
        <div style={{ background: `linear-gradient(135deg, rgba(197, 5, 12, 0.15) 0%, ${BG_SURFACE} 100%)`, borderRadius: 16, padding: 20, marginTop: 16, border: `1px solid rgba(197, 5, 12, 0.25)`, boxShadow: `0 0 30px ${WISCONSIN_RED_GLOW}` }}>
          <h3 style={{ fontSize: 11, fontWeight: 600, color: WISCONSIN_RED, textTransform: 'uppercase', marginBottom: 12 }}>💬 Conversation Starter</h3>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: 15, color: TEXT_PRIMARY, lineHeight: 1.6, fontStyle: 'italic' }}>"{attendee.conversationStarter}"</p>
        </div>
      )}
    </div>
  </div>
);

// ============================================================================
// CONFIRMATION & TRANSITION
// ============================================================================
const Confirmation = ({ onContinue }) => (
  <div style={{ minHeight: '100vh', background: BG_PRIMARY, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
    <AmbientBackground intensity={0.6} />
    <div style={{ marginBottom: 32, position: 'relative', zIndex: 10 }}>
      <Breathing duration={4}>
        <div style={{ width: 100, height: 100, borderRadius: '50%', background: `linear-gradient(135deg, ${WISCONSIN_RED} 0%, ${WISCONSIN_RED_DIM} 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 60px ${WISCONSIN_RED_GLOW}`, fontSize: 48, color: TEXT_PRIMARY }}>✓</div>
      </Breathing>
    </div>
    <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 30, color: TEXT_PRIMARY, marginBottom: 12, position: 'relative', zIndex: 10 }}>You're all set!</h1>
    <p style={{ fontSize: 15, color: TEXT_SECONDARY, marginBottom: 8, maxWidth: 300, position: 'relative', zIndex: 10 }}>We'll send you a reminder before the event with your match details.</p>
    <p style={{ fontSize: 14, color: TEXT_MUTED, marginBottom: 40, position: 'relative', zIndex: 10 }}>See you in Madison! 🏈</p>
    <button onClick={onContinue} style={{ padding: '16px 36px', borderRadius: 14, border: 'none', background: `linear-gradient(135deg, ${WISCONSIN_RED} 0%, ${WISCONSIN_RED_DIM} 100%)`, color: TEXT_PRIMARY, fontSize: 16, fontWeight: 600, cursor: 'pointer', boxShadow: `0 8px 24px ${WISCONSIN_RED_GLOW}`, position: 'relative', zIndex: 10 }}>Continue →</button>
  </div>
);

// ============================================================================
// PITCH SCROLLYTELLING - Includes "Wait" intro, smooth reveal, no flashing
// Uses CSS-only animations to avoid React re-render issues
// ============================================================================
const PitchScrolly = ({ onComplete }) => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const containerRef = useRef(null);
  const [introAnimated, setIntroAnimated] = useState(false);
  
  // Trigger intro animation on mount
  useEffect(() => {
    setTimeout(() => setIntroAnimated(true), 100);
  }, []);
  
  // Track scroll for progress bar only - don't trigger re-renders of content
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const scrollTop = containerRef.current.scrollTop;
      const scrollHeight = containerRef.current.scrollHeight - containerRef.current.clientHeight;
      if (scrollHeight > 0) {
        setScrollProgress(scrollTop / scrollHeight);
      }
    };
    
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // Section content component - static, no state changes during scroll
  const SectionContent = ({ icon, level, headline, highlightText, body, showButton }) => (
    <div style={{ maxWidth: 400, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 10 }}>
      <div className="reveal-item" style={{ animationDelay: '0s' }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, background: `linear-gradient(135deg, ${BG_ELEVATED} 0%, ${BG_SURFACE} 100%)`, border: `2px solid ${GOLD_ACCENT}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 24px', boxShadow: `0 8px 32px rgba(0,0,0,0.3)` }}>{icon}</div>
      </div>
      <div className="reveal-item" style={{ animationDelay: '0.1s' }}>
        <p style={{ color: GOLD_ACCENT, fontSize: 12, fontWeight: 500, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 16 }}>
          {level}
        </p>
      </div>
      <div className="reveal-item" style={{ animationDelay: '0.2s' }}>
        <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 28, fontWeight: 400, lineHeight: 1.25, color: TEXT_PRIMARY, marginBottom: 20 }}>
          {headline} <span style={{ color: GOLD_ACCENT }}>{highlightText}</span>
        </h2>
      </div>
      <div className="reveal-item" style={{ animationDelay: '0.3s' }}>
        <p style={{ fontSize: 16, lineHeight: 1.7, color: TEXT_SECONDARY }}>{body}</p>
      </div>
      {showButton && (
        <div className="reveal-item" style={{ animationDelay: '0.5s' }}>
          <button 
            onClick={onComplete}
            style={{ 
              marginTop: 40, padding: '16px 32px', borderRadius: 14, border: 'none',
              background: GOLD_ACCENT, color: BG_PRIMARY,
              fontSize: 15, fontWeight: 600, cursor: 'pointer',
              boxShadow: `0 8px 24px rgba(212, 168, 75, 0.3)`
            }}
          >
            See the packages →
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div 
      ref={containerRef}
      style={{ height: '100vh', overflowY: 'auto', background: BG_PRIMARY, position: 'relative' }}
    >
      {/* CSS for reveal animations */}
      <style>{`
        @keyframes scrollBounce {
          0%, 100% { transform: translateX(-50%) translateY(0); opacity: 1; }
          50% { transform: translateX(-50%) translateY(12px); opacity: 0.5; }
        }
        @keyframes revealUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .reveal-item {
          opacity: 0;
          animation: revealUp 0.7s cubic-bezier(0.25, 0.4, 0.25, 1) forwards;
        }
        .pitch-section {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 64px 24px;
          position: relative;
        }
        .pitch-section .reveal-item {
          opacity: 0;
        }
        .pitch-section:nth-child(2) .reveal-item,
        .pitch-section:nth-child(3) .reveal-item,
        .pitch-section:nth-child(4) .reveal-item,
        .pitch-section:nth-child(5) .reveal-item {
          animation: none;
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>

      {/* Progress bar at top */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 3, background: 'rgba(255,255,255,0.1)', zIndex: 100 }}>
        <div style={{ height: '100%', background: GOLD_ACCENT, width: `${scrollProgress * 100}%`, transition: 'width 0.1s ease-out' }} />
      </div>

      {/* SECTION 0: The "Wait..." Intro */}
      <section className="pitch-section" style={{ alignItems: 'center' }}>
        <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%, -50%)', width: 500, height: 500, pointerEvents: 'none', opacity: introAnimated ? 1 : 0, background: `radial-gradient(circle, ${GOLD_ACCENT}20 0%, transparent 70%)`, transition: 'all 1.5s ease' }} />
        <div style={{ maxWidth: 380, textAlign: 'center', position: 'relative', zIndex: 10 }}>
          <p style={{ fontSize: 13, color: GOLD_ACCENT, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 16, opacity: introAnimated ? 1 : 0, transition: 'opacity 0.8s ease' }}>Wait...</p>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 28, color: TEXT_PRIMARY, marginBottom: 20, lineHeight: 1.3, opacity: introAnimated ? 1 : 0, transform: introAnimated ? 'translateY(0)' : 'translateY(20px)', transition: 'all 0.8s ease 0.3s' }}>Now imagine every VIP at your conference having this experience.</h1>
          <p style={{ fontSize: 16, color: TEXT_SECONDARY, lineHeight: 1.6, opacity: introAnimated ? 1 : 0, transform: introAnimated ? 'translateY(0)' : 'translateY(20px)', transition: 'all 0.8s ease 0.6s' }}>Pre-event intelligence. Curated connections. Conversations that actually matter.</p>
        </div>
        
        {/* Scroll hint */}
        <div style={{ position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)', textAlign: 'center', opacity: introAnimated ? 1 : 0, transition: 'opacity 0.8s ease 1.2s' }}>
          <p style={{ fontSize: 11, color: TEXT_MUTED, marginBottom: 8, letterSpacing: '0.1em' }}>Scroll to explore</p>
          <div style={{ width: 24, height: 40, borderRadius: 12, border: `2px solid ${TEXT_MUTED}`, margin: '0 auto', position: 'relative' }}>
            <div style={{ width: 4, height: 8, borderRadius: 2, background: GOLD_ACCENT, position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', animation: 'scrollBounce 2s ease-in-out infinite' }} />
          </div>
        </div>
      </section>

      {/* SECTION 1: The Digital Experience */}
      <section className="pitch-section">
        <div style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%, -50%)', width: 400, height: 400, background: `radial-gradient(circle, ${GOLD_ACCENT}12 0%, transparent 70%)`, pointerEvents: 'none' }} />
        <SectionContent 
          icon="📱"
          level="Level 1: The Digital Experience"
          headline="Before the conference starts, your VIPs know"
          highlightText="exactly who to meet."
          body="The app experience you just saw—delivered to every VIP on your list. Personalized profiles, curated matches, conversation starters. They arrive with purpose, not just a badge."
        />
      </section>

      {/* SECTION 2: The Signature Event */}
      <section className="pitch-section">
        <div style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%, -50%)', width: 400, height: 400, background: `radial-gradient(circle, ${GOLD_ACCENT}12 0%, transparent 70%)`, pointerEvents: 'none' }} />
        <SectionContent 
          icon="🤝"
          level="Level 2: The Signature Event"
          headline="Now that they're here—and you have all that data—"
          highlightText="make the moment count."
          body="A dedicated networking session designed around who's actually in the room. Facilitated introductions, conversation prompts, connection stations. Not random mingling—intentional meetings."
        />
      </section>

      {/* SECTION 3: The Full VIP Track */}
      <section className="pitch-section">
        <div style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%, -50%)', width: 400, height: 400, background: `radial-gradient(circle, ${GOLD_ACCENT}12 0%, transparent 70%)`, pointerEvents: 'none' }} />
        <SectionContent 
          icon="🎯"
          level="Level 3: The Full VIP Track"
          headline="While students attend their sessions, executives have"
          highlightText="their own curated experience."
          body="A parallel conference designed entirely for your VIPs. Executive roundtables, private lounges, VIP-only speakers. From the night before through the entire day—they feel like the priority they are."
          showButton={true}
        />
      </section>
    </div>
  );
};

// ============================================================================
// PROPOSAL - Now using GOLD_ACCENT consistently (no more Wisconsin red)
// ============================================================================
const Proposal = () => {
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [expandedTier, setExpandedTier] = useState(1);
  
  const packages = [
    { name: 'Essential', price: '8,000', tagline: 'The App Experience', description: 'Give every VIP a reason to attend before they arrive.', features: ['Branded VIP intake experience', 'AI-powered attendee profiling', '3-5 curated matches per attendee', 'Personalized conversation starters', 'Full VIP directory access', 'Post-event analytics'], outcome: 'VIPs arrive knowing exactly who to meet', highlighted: false },
    { name: 'Premium', price: '15,000', tagline: 'App + Signature VIP Event', description: 'Beyond the app—a dedicated networking event that turns introductions into relationships.', features: ['Everything in Essential', 'Curated VIP networking session (60-90 min)', 'Live "connection board" displaying highlights', 'Interactive matching stations', 'Facilitated speed-networking rounds', 'On-site coordination'], outcome: 'VIPs leave with relationships, not just cards', highlighted: true, badge: 'Most Popular' },
    { name: 'Full Experience', price: '25,000', tagline: 'App + Event + VIP Track', description: 'A complete parallel conference for your VIPs.', features: ['Everything in Premium', 'Pre-conference VIP reception', 'Dedicated VIP programming track', 'Executive roundtables', 'Private VIP lounge', 'VIP-only speakers', 'Concierge coordination'], outcome: 'VIPs experience a conference designed for them', highlighted: false, badge: 'White Glove' },
  ];
  
  const faqs = [
    { q: 'How many VIPs can this support?', a: 'The app scales to any size. For in-person experiences, we recommend 50-150 VIPs for optimal connection quality.' },
    { q: 'What data do you need?', a: 'Just your VIP list with names and emails. We handle all intake, profiling, and matching.' },
    { q: 'How far in advance?', a: '6-8 weeks for Premium/Full Experience. Essential can deploy in 3 weeks.' },
  ];

  return (
    <div style={{ minHeight: '100%', background: BG_PRIMARY, overflowY: 'auto' }}>
      {/* Header */}
      <div style={{ padding: '48px 24px 40px', textAlign: 'center', background: `radial-gradient(ellipse at 50% 0%, ${GOLD_ACCENT}12 0%, transparent 60%)`, borderBottom: `1px solid rgba(255,255,255,0.05)` }}>
        <div style={{ width: 48, height: 48, borderRadius: 10, background: GOLD_ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontFamily: 'Georgia, serif', fontSize: 22, fontWeight: 700, color: BG_PRIMARY }}>33</div>
        <p style={{ fontSize: 11, fontWeight: 600, color: GOLD_ACCENT, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>Better Networking for WSBC</p>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 26, color: TEXT_PRIMARY, marginBottom: 12, lineHeight: 1.3 }}>Make your VIPs feel like VIPs</h1>
        <p style={{ fontSize: 14, color: TEXT_SECONDARY, maxWidth: 340, margin: '0 auto', lineHeight: 1.6 }}>Pre-event intelligence. Curated connections. A dedicated experience.</p>
      </div>
      
      {/* Packages */}
      <div style={{ padding: '32px 20px' }}>
        <h2 style={{ fontSize: 11, fontWeight: 600, color: TEXT_MUTED, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 20, textAlign: 'center' }}>Choose Your Experience</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {packages.map((pkg, i) => (
            <div key={i} onClick={() => setExpandedTier(expandedTier === i ? null : i)} style={{ background: `linear-gradient(145deg, ${BG_SURFACE} 0%, ${BG_PRIMARY} 100%)`, borderRadius: 16, padding: expandedTier === i ? 24 : 20, border: `1px solid ${pkg.highlighted ? GOLD_ACCENT : 'rgba(255,255,255,0.08)'}`, position: 'relative', boxShadow: pkg.highlighted ? `0 0 40px rgba(212, 168, 75, 0.15)` : 'none', cursor: 'pointer', transition: 'all 0.3s ease' }}>
              {pkg.badge && <div style={{ position: 'absolute', top: 12, right: 12, padding: '4px 10px', borderRadius: 12, background: pkg.highlighted ? GOLD_ACCENT : `${GOLD_ACCENT}30`, fontSize: 9, fontWeight: 700, color: pkg.highlighted ? BG_PRIMARY : GOLD_ACCENT, textTransform: 'uppercase' }}>{pkg.badge}</div>}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 4 }}>
                <h3 style={{ fontSize: 18, fontWeight: 600, color: TEXT_PRIMARY }}>{pkg.name}</h3>
                <span style={{ fontSize: 12, color: TEXT_MUTED }}>{pkg.tagline}</span>
              </div>
              <p style={{ fontFamily: 'Georgia, serif', fontSize: 32, color: GOLD_ACCENT, marginBottom: 8 }}>${pkg.price}</p>
              {expandedTier === i ? (
                <>
                  <p style={{ fontSize: 13, color: TEXT_SECONDARY, marginBottom: 16, lineHeight: 1.5 }}>{pkg.description}</p>
                  <div style={{ background: `rgba(212, 168, 75, 0.1)`, border: `1px solid rgba(212, 168, 75, 0.3)`, borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: GOLD_ACCENT, marginBottom: 2 }}>THE OUTCOME</p>
                    <p style={{ fontFamily: 'Georgia, serif', fontSize: 14, color: TEXT_PRIMARY, fontStyle: 'italic' }}>{pkg.outcome}</p>
                  </div>
                  <div style={{ borderTop: `1px solid rgba(255,255,255,0.05)`, paddingTop: 16 }}>
                    {pkg.features.map((f, j) => (
                      <div key={j} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                        <span style={{ color: GOLD_ACCENT }}>✓</span>
                        <span style={{ fontSize: 13, color: TEXT_SECONDARY }}>{f}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p style={{ fontFamily: 'Georgia, serif', fontSize: 13, color: TEXT_MUTED, fontStyle: 'italic' }}>{pkg.outcome}</p>
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
            {expandedFaq === i && <p style={{ fontSize: 13, color: TEXT_SECONDARY, marginTop: 12, lineHeight: 1.6 }}>{faq.a}</p>}
          </div>
        ))}
      </div>
      
      {/* CTA */}
      <div style={{ padding: '24px 20px 40px', textAlign: 'center', background: `radial-gradient(ellipse at 50% 100%, ${GOLD_ACCENT}10 0%, transparent 60%)` }}>
        <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 22, color: TEXT_PRIMARY, marginBottom: 12 }}>Ready to elevate the VIP experience?</h2>
        <p style={{ fontSize: 13, color: TEXT_SECONDARY, marginBottom: 24 }}>Let's design something that makes your top attendees feel valued.</p>
        <button style={{ padding: '16px 44px', borderRadius: 14, border: 'none', background: GOLD_ACCENT, color: BG_PRIMARY, fontSize: 16, fontWeight: 600, cursor: 'pointer', marginBottom: 16, boxShadow: `0 8px 24px rgba(212, 168, 75, 0.25)` }}>Schedule a Call</button>
        <p style={{ fontSize: 12, color: TEXT_MUTED }}>or email <span style={{ color: GOLD_ACCENT }}>beems@33strategies.com</span></p>
      </div>
      
      {/* Footer */}
      <div style={{ padding: 20, borderTop: `1px solid rgba(255,255,255,0.05)`, textAlign: 'center' }}>
        <p style={{ fontSize: 11, color: TEXT_MUTED }}><span style={{ color: GOLD_ACCENT }}>33</span> Strategies • Better Networking</p>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN APP
// ============================================================================
export default function WisconsinProposalEnhanced() {
  const [phase, setPhase] = useState(PHASES.INTRO_STORIES);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [selectedAttendee, setSelectedAttendee] = useState(null);

  const renderPhase = () => {
    switch (phase) {
      case PHASES.INTRO_STORIES: return <IntroStories onComplete={() => setPhase(PHASES.INTERVIEW)} />;
      case PHASES.INTERVIEW: return <Interview onComplete={() => setPhase(PHASES.CARD_PREVIEW)} />;
      case PHASES.CARD_PREVIEW: return <HolographicTradingCard profile={MOCK_USER_PROFILE} onConfirm={() => setPhase(PHASES.GENERATING)} />;
      case PHASES.GENERATING: return <GeneratingMatches onComplete={() => setPhase(PHASES.MATCHES_REVEAL)} />;
      case PHASES.MATCHES_REVEAL: return <MatchReveal onSelectMatch={(m) => { setSelectedMatch(m); setPhase(PHASES.MATCH_DETAIL); }} onContinue={() => setPhase(PHASES.CONFIRMATION)} onViewAll={() => setPhase(PHASES.ALL_ATTENDEES)} />;
      case PHASES.MATCH_DETAIL: return <MatchDetail match={selectedMatch} onBack={() => setPhase(PHASES.MATCHES_REVEAL)} />;
      case PHASES.ALL_ATTENDEES: return <AllAttendeesGrid onSelectAttendee={(a) => { setSelectedAttendee(a); setPhase(PHASES.ATTENDEE_DETAIL); }} onBack={() => setPhase(PHASES.MATCHES_REVEAL)} />;
      case PHASES.ATTENDEE_DETAIL: return <AttendeeDetail attendee={selectedAttendee} onBack={() => setPhase(PHASES.ALL_ATTENDEES)} isMatch={MOCK_MATCHES.some(m => m.id === selectedAttendee?.id)} />;
      case PHASES.CONFIRMATION: return <Confirmation onContinue={() => setPhase(PHASES.PITCH_SCROLLY)} />;
      case PHASES.TRANSITION: return <PitchScrolly onComplete={() => setPhase(PHASES.PROPOSAL)} />; // Legacy redirect
      case PHASES.PITCH_SCROLLY: return <PitchScrolly onComplete={() => setPhase(PHASES.PROPOSAL)} />;
      case PHASES.PROPOSAL: return <Proposal />;
      default: return <IntroStories onComplete={() => setPhase(PHASES.INTERVIEW)} />;
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: 480, minHeight: '100vh', margin: '0 auto', background: BG_PRIMARY, position: 'relative' }}>
      {renderPhase()}
    </div>
  );
}
