import React, { useState } from 'react';

// Color system
const colors = {
  bg: '#0a0a0a',
  surface: '#111111',
  surfaceDim: '#0d0d0d',
  gold: '#D4A84B',
  goldLight: '#E4C06B',
  green: '#4ADE80',
  yellow: '#FBBF24',
  orange: '#F97316',
  red: '#EF4444',
  white: '#ffffff',
  zinc300: '#d4d4d8',
  zinc400: '#a1a1aa',
  zinc500: '#71717a',
  zinc600: '#52525b',
  zinc700: '#3f3f46',
  zinc800: '#27272a'
};

// Sample profile data
const sampleProfile = {
  user: { name: "Chase Mitchell", level: 6, company: "PLYA Fitness", lastActive: "2 hours ago", totalHours: 47, totalSessions: 142 },
  sections: {
    individual: {
      id: "individual", name: "The Individual", icon: "👤", score: 78,
      summary: "Product leader turned founder with deep consumer app experience, systems-thinking approach, and bias for rapid iteration.",
      subsections: {
        background: {
          id: "background", name: "Background & Identity", score: 85,
          summary: "10+ years in product, Google → Uber → Peloton → founder journey with technical roots.",
          fields: {
            education: { id: "education", name: "Education", score: 90, summary: "MBA from Stanford GSB (2018), BS Computer Science from MIT (2012)", fullContext: "Completed MBA at Stanford Graduate School of Business in 2018, focusing on entrepreneurship and technology strategy. Undergraduate degree in Computer Science from MIT (2012), where I developed strong fundamentals in algorithms and systems design.", insights: ["Technical foundation enables deep engineering collaboration", "Business training supports strategic thinking", "Stanford network valuable for fundraising"], lastUpdated: "5 days ago" },
            career: { id: "career", name: "Career Journey", score: 92, summary: "10 years in product management, transitioned from engineering, deep experience in consumer apps.", fullContext: "Started as a software engineer at Google (2012-2015), building Android apps for Google Play. Realized I was more interested in the 'why' than the 'how' and transitioned to PM at Uber (2015-2018) where I owned rider growth features. Then moved to Peloton (2018-2022) as Senior PM leading the content recommendation engine.", insights: ["Strong consumer product intuition", "Technical background enables deep eng collaboration", "Pattern of moving toward personalization/AI"], lastUpdated: "3 days ago" },
            defining: { id: "defining", name: "Defining Experiences", score: 78, summary: "Led turnaround of failing product line at Peloton, learned importance of ruthless prioritization.", fullContext: "At Peloton, inherited the recommendation engine when it was underperforming - users weren't discovering content that kept them engaged. Had to make hard calls about what to cut versus double down on. Shipped a completely rebuilt system in 6 months that improved content discovery by 40%.", insights: ["Comfortable with turnaround situations", "Values focus over feature proliferation"], lastUpdated: "1 week ago" }
          }
        },
        thinking: {
          id: "thinking", name: "Thinking Style", score: 72,
          summary: "Systems thinker, data-informed but follows intuition on big bets.",
          fields: {
            decisions: { id: "decisions", name: "Decision Making", score: 75, summary: "Data-informed but intuition-led on strategic calls, fast on reversible decisions.", fullContext: "I gather data obsessively but ultimately trust my gut on big strategic decisions. For reversible decisions, I move fast and iterate. For irreversible ones, I slow down and seek diverse input.", insights: ["Bias for action on reversible decisions", "Seeks input for high-stakes choices"], lastUpdated: "4 days ago" },
            problemSolving: { id: "problemSolving", name: "Problem Solving", score: 70, summary: "Systems thinker who seeks root causes, uses first principles when stuck.", fullContext: "When facing a problem, I first try to understand the system it exists within. What are the inputs, outputs, feedback loops? I find that most problems are symptoms of deeper structural issues.", insights: ["Looks for systemic root causes", "Uses first principles reasoning"], lastUpdated: "1 week ago" }
          }
        },
        working: {
          id: "working", name: "Working Style", score: 90,
          summary: "Async-first, morning deep work, detailed written documentation.",
          fields: {
            communication: { id: "communication", name: "Communication Preferences", score: 95, summary: "Async-first, detailed written docs, meetings only when necessary.", fullContext: "I strongly prefer written communication - it forces clarity and creates artifacts. Meetings should be for discussion and decisions, not information transfer.", insights: ["Written communication preferred", "Meetings for decisions only"], lastUpdated: "2 days ago" },
            energy: { id: "energy", name: "Energy Management", score: 92, summary: "Morning deep work, afternoon meetings, protected focus time.", fullContext: "My best thinking happens between 6am and noon, so I protect that time fiercely for deep work - no meetings, no Slack. Afternoons are for collaboration, calls, and lighter tasks.", insights: ["Morning person for deep work", "Protects focus time actively"], lastUpdated: "1 day ago" }
          }
        },
        values: {
          id: "values", name: "Values & Motivations", score: 65,
          summary: "Impact over optics, democratizing fitness access globally.",
          fields: {
            coreValues: { id: "coreValues", name: "Core Values", score: 70, summary: "Impact over optics, speed over perfection, users over metrics.", fullContext: "I care about actual impact, not the appearance of success. I'd rather ship something imperfect that helps users than polish something endlessly.", insights: ["Substance over appearance", "User-centric decision making"], lastUpdated: "1 week ago" },
            motivations: { id: "motivations", name: "Primary Motivations", score: 62, summary: "Democratizing fitness access, building something that outlasts me.", fullContext: "Growing up in Lagos, I saw how access to good fitness resources was limited to the wealthy. I want PLYA to make personalized fitness coaching accessible to anyone with a smartphone.", insights: ["Personal connection to mission", "Long-term legacy thinking"], lastUpdated: "2 weeks ago" }
          }
        }
      }
    },
    role: {
      id: "role", name: "Your Role", icon: "💼", score: 82,
      summary: "CEO and sole product decision-maker at early-stage startup, wearing all hats while building toward first hires.",
      subsections: {
        responsibilities: {
          id: "responsibilities", name: "Core Responsibilities", score: 88,
          summary: "Product strategy, fundraising, team building, and hands-on development.",
          fields: {
            primary: { id: "primary", name: "Primary Deliverables", score: 90, summary: "Ship MVP, raise seed round, hire first 3 employees.", fullContext: "My three primary deliverables for the next 6 months: (1) Ship a functional MVP that validates our core hypothesis about AI coaching. (2) Raise a $2M seed round. (3) Hire our first 3 employees.", insights: ["Clear prioritization of outcomes", "MVP before fundraising"], lastUpdated: "3 days ago" },
            ownership: { id: "ownership", name: "Areas of Ownership", score: 85, summary: "Everything - product, engineering, design, ops, finance, legal.", fullContext: "As a solo founder with contractors, I own everything: product strategy, engineering decisions, design direction, operations and finance, legal and compliance.", insights: ["Solo founder stage constraints", "Hiring will enable focus"], lastUpdated: "4 days ago" }
          }
        },
        scope: {
          id: "scope", name: "Scope & Authority", score: 85,
          summary: "Full decision-making authority, accountable to future investors and users.",
          fields: {
            decisions: { id: "decisions", name: "Decision Authority", score: 88, summary: "Complete authority on all decisions, no approval needed.", fullContext: "As sole founder pre-funding, I have complete decision-making authority. No board, no co-founder consensus needed.", insights: ["Full autonomy currently", "Board will add accountability"], lastUpdated: "1 week ago" },
            budget: { id: "budget", name: "Budget & Resources", score: 80, summary: "$150K personal runway, spending ~$15K/month on contractors and tools.", fullContext: "Operating on personal savings - approximately $150K runway remaining. Current burn is ~$15K/month. This gives me roughly 10 months to raise or reach profitability.", insights: ["10 months runway", "Cost-conscious operations"], lastUpdated: "2 days ago" }
          }
        }
      }
    },
    organization: {
      id: "organization", name: "Your Organization", icon: "🏢", score: 71,
      summary: "Pre-launch B2C fitness app building AI-powered coaching for accessible personalized fitness.",
      subsections: {
        fundamentals: {
          id: "fundamentals", name: "Company Fundamentals", score: 80,
          summary: "Pre-launch, bootstrapped, B2C subscription model targeting seed raise.",
          fields: {
            stage: { id: "stage", name: "Company Stage", score: 85, summary: "Pre-launch, building MVP, preparing for seed fundraise.", fullContext: "PLYA is pre-launch, currently building our MVP. Founded in early 2024, we've been in development for about 10 months. Targeting MVP completion in January 2025.", insights: ["10 months in development", "MVP imminent"], lastUpdated: "2 days ago" },
            model: { id: "model", name: "Business Model", score: 82, summary: "B2C subscription - $19/month or $149/year for AI coaching.", fullContext: "PLYA is a B2C subscription business. Core offering is $19/month or $149/year for unlimited access to AI-powered personal training.", insights: ["Subscription model proven in fitness", "Annual pricing for retention"], lastUpdated: "1 week ago" },
            team: { id: "team", name: "Team Composition", score: 78, summary: "Solo founder + 2 contractors (engineering, design).", fullContext: "Currently a team of 3: myself as founder/CEO, plus two contractors - a senior mobile engineer (40 hrs/week) and a product designer (20 hrs/week).", insights: ["Lean contractor model", "Engineering-first hiring"], lastUpdated: "4 days ago" }
          }
        },
        product: {
          id: "product", name: "Product & Strategy", score: 75,
          summary: "Mobile-first AI fitness coach with personalized, adaptive workout plans.",
          fields: {
            core: { id: "core", name: "Core Product", score: 80, summary: "Mobile app with AI that creates personalized workouts and adapts based on feedback.", fullContext: "PLYA is a mobile app (iOS first) that acts as a personal trainer in your pocket. Users complete a fitness assessment, share their goals, and the AI creates personalized workout plans.", insights: ["iOS first strategy", "Feedback loop is key differentiator"], lastUpdated: "3 days ago" },
            differentiation: { id: "differentiation", name: "Competitive Differentiation", score: 72, summary: "True personalization through AI + feedback loops, not just content library.", fullContext: "Most fitness apps are content libraries with light personalization. We're building true personalization - the AI understands your body, preferences, and progress.", insights: ["Adaptation is the moat", "Compounding personalization advantage"], lastUpdated: "1 week ago" }
          }
        }
      }
    },
    goals: {
      id: "goals", name: "Your Goals", icon: "🎯", score: 68,
      summary: "Ship MVP, validate with beta users, raise seed round - all within Q1-Q2 2025.",
      subsections: {
        immediate: {
          id: "immediate", name: "Immediate Objectives", score: 72,
          summary: "Ship MVP by end of January, begin beta testing with 50 users.",
          fields: {
            thirtyDay: { id: "thirtyDay", name: "30-Day Priorities", score: 75, summary: "Complete AI workout generation, finish onboarding flow, fix critical bugs.", fullContext: "Next 30 days: (1) Complete the AI workout generation system - currently at 80%. (2) Finish user onboarding flow. (3) Fix the 5 critical bugs in our tracking.", insights: ["AI generation is core focus", "Onboarding gates everything"], lastUpdated: "2 days ago" },
            ninetyDay: { id: "ninetyDay", name: "90-Day Targets", score: 70, summary: "Launch beta, 50 active users, validate retention hypothesis, prep seed deck.", fullContext: "90-day goals: (1) Launch closed beta to 50 carefully selected users. (2) Achieve 60%+ weekly retention. (3) Conduct 20+ user interviews.", insights: ["Retention is key metric", "User interviews for insight"], lastUpdated: "4 days ago" }
          }
        },
        medium: {
          id: "medium", name: "Medium-term Goals", score: 65,
          summary: "Raise seed, hit 1000 paying users, build core team by end of 2025.",
          fields: {
            sixMonth: { id: "sixMonth", name: "6-Month Goals", score: 68, summary: "Close seed round, launch publicly, reach 500 paying users.", fullContext: "By June 2025: (1) Close $2M seed round. (2) Launch publicly on iOS App Store. (3) Reach 500 paying users with healthy unit economics.", insights: ["Seed enables public launch", "500 users proves model"], lastUpdated: "1 week ago" }
          }
        },
        metrics: {
          id: "metrics", name: "Success Metrics", score: 72,
          summary: "Weekly retention, LTV/CAC, NPS - focused on engagement over vanity metrics.",
          fields: {
            primary: { id: "primary", name: "Primary KPIs", score: 75, summary: "Weekly retention (target 60%), LTV/CAC (target 3:1), NPS (target 50+).", fullContext: "Our north star metrics: (1) Weekly retention - what % of users complete at least one workout per week, target 60%. (2) LTV/CAC ratio - target 3:1 or better.", insights: ["Retention is north star", "Unit economics matter early"], lastUpdated: "5 days ago" }
          }
        }
      }
    },
    network: {
      id: "network", name: "Your Network", icon: "🔗", score: 64,
      summary: "Small team, strong investor relationships, fitness industry advisors.",
      subsections: {
        stakeholders: {
          id: "stakeholders", name: "Key Stakeholders", score: 68,
          summary: "Interested investors, key advisors, early users.",
          fields: {
            investors: { id: "investors", name: "Investor Relationships", score: 70, summary: "3 funds showing strong interest, 5 more in conversation.", fullContext: "Current investor pipeline: (1) Forerunner Ventures - partner interested, had 2 calls. (2) First Round Capital - scout introduction. (3) General Catalyst - warm intro pending.", insights: ["Quality over quantity approach", "Peloton network valuable"], lastUpdated: "4 days ago" },
            advisors: { id: "advisors", name: "Advisor Network", score: 72, summary: "3 formal advisors (fitness, AI, fundraising), several informal mentors.", fullContext: "Formal advisors (0.25-0.5% each): (1) Sarah Chen - former VP Product at Peloton. (2) Marcus Williams - AI researcher at Stanford. (3) Jennifer Park - 3x founder.", insights: ["Domain expertise covered", "Equity allocated to advisors"], lastUpdated: "1 week ago" }
          }
        },
        team: {
          id: "team", name: "Team & Collaborators", score: 65,
          summary: "2 contractors currently, actively recruiting first full-time hires.",
          fields: {
            current: { id: "current", name: "Current Team", score: 68, summary: "Engineering contractor (40hrs), design contractor (20hrs).", fullContext: "Current team: (1) Alex Rivera - senior mobile engineer contractor, 40hrs/week, been with us 8 months. (2) Maria Santos - product designer contractor, 20hrs/week, 6 months.", insights: ["Strong contractor relationships", "Conversion potential post-funding"], lastUpdated: "3 days ago" }
          }
        }
      }
    },
    projects: {
      id: "projects", name: "Your Projects", icon: "📁", score: 72,
      summary: "MVP development, seed fundraising, beta program setup - all running in parallel.",
      subsections: {
        active: {
          id: "active", name: "Active Initiatives", score: 78,
          summary: "MVP completion, seed deck preparation, beta recruitment.",
          fields: {
            mvp: { id: "mvp", name: "MVP Development", score: 80, summary: "80% complete, targeting end of January ship date.", fullContext: "MVP scope: (1) User onboarding and assessment - 95% done. (2) AI workout generation - 80% done. (3) Workout tracking and feedback - 90% done. Critical path is AI generation quality.", insights: ["AI generation is critical path", "On track for January"], lastUpdated: "1 day ago" },
            fundraise: { id: "fundraise", name: "Seed Fundraise Prep", score: 75, summary: "Deck 70% done, financial model complete, building investor list.", fullContext: "Fundraise preparation: (1) Pitch deck - 70% complete, need early metrics. (2) Financial model - done. (3) Data room - 40% complete. (4) Investor list - 30 funds identified.", insights: ["Deck needs metrics", "Financial model ready"], lastUpdated: "3 days ago" }
          }
        },
        upcoming: {
          id: "upcoming", name: "Upcoming Priorities", score: 68,
          summary: "Public launch, Android development, first marketing campaigns.",
          fields: {
            launch: { id: "launch", name: "Public Launch", score: 65, summary: "Planned for March, depends on beta learnings and funding.", fullContext: "Public launch plan (tentative March 2025): (1) App Store submission and approval. (2) Launch PR/communications. (3) Initial growth experiments.", insights: ["Flexible timeline", "Depends on beta learnings"], lastUpdated: "1 week ago" }
          }
        }
      }
    }
  }
};

// Utility functions
const getScoreColor = (score) => {
  if (score >= 90) return { bar: colors.gold, text: colors.gold };
  if (score >= 75) return { bar: colors.green, text: colors.green };
  if (score >= 50) return { bar: colors.yellow, text: colors.yellow };
  if (score >= 25) return { bar: colors.orange, text: colors.orange };
  return { bar: colors.red, text: colors.red };
};

const getLevelBadge = (level) => {
  const levels = { 1: { name: 'IC', color: '#6B7280' }, 2: { name: 'Team Lead', color: '#8B5CF6' }, 3: { name: 'Manager', color: '#3B82F6' }, 4: { name: 'Director', color: '#10B981' }, 5: { name: 'Executive', color: '#F59E0B' }, 6: { name: 'Founder', color: colors.gold } };
  return levels[level] || levels[1];
};

// Components
const ClarityBar = ({ score, width = 96 }) => {
  const c = getScoreColor(score);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 12, fontFamily: 'monospace', fontWeight: 500, color: c.text }}>{score}%</span>
      <div style={{ width, height: 6, backgroundColor: colors.zinc800, borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${score}%`, height: '100%', backgroundColor: c.bar, borderRadius: 3 }} />
      </div>
    </div>
  );
};

const SectionHeader = ({ section, isExpanded, onClick }) => (
  <button onClick={onClick} style={{ width: '100%', textAlign: 'left', padding: 20, borderRadius: 12, border: `1px solid ${isExpanded ? 'rgba(212,168,75,0.3)' : colors.zinc800}`, backgroundColor: isExpanded ? colors.surfaceDim : colors.surface, cursor: 'pointer', transition: 'all 0.2s' }}>
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flex: 1 }}>
        <span style={{ fontSize: 24 }}>{section.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
            <h3 style={{ fontSize: 14, fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase', color: isExpanded ? colors.gold : colors.white, margin: 0 }}>{section.name}</h3>
            <ClarityBar score={section.score} width={64} />
          </div>
          <p style={{ fontSize: 14, color: colors.zinc400, margin: 0, lineHeight: 1.5 }}>{section.summary}</p>
        </div>
      </div>
      <div style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={colors.zinc500} strokeWidth="2"><path d="M19 9l-7 7-7-7" /></svg>
      </div>
    </div>
  </button>
);

const SubsectionCard = ({ subsection, onClick }) => (
  <button onClick={onClick} style={{ width: '100%', textAlign: 'left', padding: 16, borderRadius: 12, border: `1px solid ${subsection.score < 50 ? 'rgba(239,68,68,0.3)' : colors.zinc800}`, backgroundColor: colors.surface, cursor: 'pointer', transition: 'all 0.2s' }}>
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
      <h4 style={{ fontSize: 14, fontWeight: 500, color: colors.white, margin: 0 }}>{subsection.name}</h4>
      <ClarityBar score={subsection.score} width={56} />
    </div>
    <p style={{ fontSize: 12, color: colors.zinc500, margin: 0, lineHeight: 1.4 }}>{subsection.summary}</p>
  </button>
);

const FieldRow = ({ field, isExpanded, onClick }) => (
  <div style={{ borderBottom: `1px solid ${colors.zinc800}` }}>
    <button onClick={onClick} style={{ width: '100%', textAlign: 'left', padding: '16px 4px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, backgroundColor: 'transparent', border: 'none', cursor: 'pointer' }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase', color: colors.zinc500 }}>{field.name}</span>
          {field.score < 60 && <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, backgroundColor: 'rgba(249,115,22,0.2)', color: colors.orange }}>Needs detail</span>}
        </div>
        <p style={{ fontSize: 14, color: colors.zinc300, margin: 0 }}>{field.summary}</p>
      </div>
      <div style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={colors.zinc600} strokeWidth="2"><path d="M19 9l-7 7-7-7" /></svg>
      </div>
    </button>
    {isExpanded && (
      <div style={{ padding: '0 4px 16px' }}>
        <div style={{ padding: 16, backgroundColor: colors.surfaceDim, borderRadius: 8, border: `1px solid ${colors.zinc800}` }}>
          <div style={{ marginBottom: 16 }}>
            <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.zinc600, display: 'block', marginBottom: 8 }}>Full Context</span>
            <p style={{ fontSize: 14, color: colors.zinc300, margin: 0, lineHeight: 1.6 }}>{field.fullContext}</p>
          </div>
          {field.insights?.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.zinc600, display: 'block', marginBottom: 8 }}>Key Insights</span>
              <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none' }}>
                {field.insights.map((insight, i) => <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: colors.zinc400, marginBottom: 4 }}><span style={{ color: colors.gold, marginTop: 2 }}>•</span>{insight}</li>)}
              </ul>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: `1px solid ${colors.zinc800}` }}>
            <span style={{ fontSize: 10, color: colors.zinc600 }}>Updated {field.lastUpdated}</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={{ padding: '6px 12px', fontSize: 12, fontWeight: 500, color: colors.zinc400, backgroundColor: colors.zinc800, border: 'none', borderRadius: 6, cursor: 'pointer' }}>Edit</button>
              <button style={{ padding: '6px 12px', fontSize: 12, fontWeight: 500, color: colors.gold, backgroundColor: 'rgba(212,168,75,0.1)', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Add More</button>
            </div>
          </div>
        </div>
      </div>
    )}
  </div>
);

const Breadcrumbs = ({ path, onNavigate }) => {
  if (!path.length) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, fontSize: 14 }}>
      <button onClick={() => onNavigate([])} style={{ color: colors.zinc500, backgroundColor: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>Profile</button>
      {path.map((item, i) => (
        <React.Fragment key={i}>
          <span style={{ color: colors.zinc700 }}>›</span>
          <button onClick={() => onNavigate(path.slice(0, i + 1))} style={{ color: i === path.length - 1 ? colors.gold : colors.zinc500, backgroundColor: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>{item.name}</button>
        </React.Fragment>
      ))}
    </div>
  );
};

const ProfileHeader = ({ user, overallScore }) => {
  const levelBadge = getLevelBadge(user.level);
  const scoreColors = getScoreColor(overallScore);
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: `linear-gradient(135deg, ${colors.gold}, ${colors.goldLight})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, color: colors.bg }}>{user.name.split(' ').map(n => n[0]).join('')}</div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 600, color: colors.white, margin: '0 0 4px 0' }}>{user.name}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 12, fontWeight: 500, padding: '2px 8px', borderRadius: 12, backgroundColor: `${levelBadge.color}20`, color: levelBadge.color }}>{levelBadge.name}</span>
              <span style={{ fontSize: 14, color: colors.zinc500 }}>{user.company}</span>
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.zinc600, display: 'block', marginBottom: 4 }}>Profile Clarity</span>
          <span style={{ fontSize: 40, fontFamily: 'monospace', fontWeight: 700, color: scoreColors.text }}>{overallScore}%</span>
          <div style={{ width: 192, height: 8, backgroundColor: colors.zinc800, borderRadius: 4, overflow: 'hidden', marginTop: 8 }}>
            <div style={{ width: `${overallScore}%`, height: '100%', backgroundColor: scoreColors.bar, borderRadius: 4 }} />
          </div>
        </div>
      </div>
    </div>
  );
};

const SectionListView = ({ sections, onSectionClick, expandedSection, onSubsectionClick }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
    {Object.values(sections).map(section => (
      <div key={section.id}>
        <SectionHeader section={section} isExpanded={expandedSection === section.id} onClick={() => onSectionClick(section.id)} />
        {expandedSection === section.id && (
          <div style={{ marginTop: 12, paddingLeft: 48, paddingRight: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              {Object.values(section.subsections).map(sub => <SubsectionCard key={sub.id} subsection={sub} onClick={() => onSubsectionClick(section.id, sub.id)} />)}
            </div>
          </div>
        )}
      </div>
    ))}
  </div>
);

const SubsectionDetailView = ({ section, subsection, onBack }) => {
  const [expandedField, setExpandedField] = useState(null);
  return (
    <div>
      <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: colors.zinc500, backgroundColor: 'transparent', border: 'none', cursor: 'pointer', marginBottom: 24, padding: 0 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 19l-7-7 7-7" /></svg>
        Back to {section.name}
      </button>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <span style={{ fontSize: 24 }}>{section.icon}</span>
          <h2 style={{ fontSize: 18, fontWeight: 500, color: colors.white, margin: 0 }}>{subsection.name}</h2>
          <ClarityBar score={subsection.score} width={80} />
        </div>
        <p style={{ fontSize: 14, color: colors.zinc400, marginLeft: 40, lineHeight: 1.6 }}>{subsection.summary}</p>
      </div>
      <div style={{ backgroundColor: colors.surfaceDim, borderRadius: 12, border: `1px solid ${colors.zinc800}`, padding: 16 }}>
        {Object.values(subsection.fields).map(field => <FieldRow key={field.id} field={field} isExpanded={expandedField === field.id} onClick={() => setExpandedField(expandedField === field.id ? null : field.id)} />)}
        <button style={{ width: '100%', marginTop: 16, padding: 12, fontSize: 14, fontWeight: 500, color: colors.gold, backgroundColor: 'rgba(212,168,75,0.05)', border: 'none', borderRadius: 8, cursor: 'pointer' }}>+ Add more context to this section</button>
      </div>
    </div>
  );
};

const FooterStats = ({ user }) => (
  <div style={{ marginTop: 32, paddingTop: 24, borderTop: `1px solid ${colors.zinc800}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: colors.zinc600 }}>
    <div style={{ display: 'flex', gap: 16 }}>
      <span>Last session: {user.lastActive}</span>
      <span>•</span>
      <span>{user.totalHours} hours engaged</span>
      <span>•</span>
      <span>{user.totalSessions} sessions</span>
    </div>
    <button style={{ fontSize: 12, color: colors.zinc500, backgroundColor: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>Export Profile</button>
  </div>
);

// Main component
export default function LivingProfileCanvas() {
  const [profile] = useState(sampleProfile);
  const [expandedSection, setExpandedSection] = useState(null);
  const [currentSubsection, setCurrentSubsection] = useState(null);
  const [breadcrumbPath, setBreadcrumbPath] = useState([]);

  const overallScore = Math.round(Object.values(profile.sections).reduce((a, s) => a + s.score, 0) / Object.keys(profile.sections).length);

  const handleSectionClick = (id) => {
    if (expandedSection === id) { setExpandedSection(null); setBreadcrumbPath([]); }
    else { setExpandedSection(id); setBreadcrumbPath([{ id, name: profile.sections[id].name }]); }
    setCurrentSubsection(null);
  };

  const handleSubsectionClick = (sectionId, subsectionId) => {
    setCurrentSubsection({ sectionId, subsectionId });
    setBreadcrumbPath([{ id: sectionId, name: profile.sections[sectionId].name }, { id: subsectionId, name: profile.sections[sectionId].subsections[subsectionId].name }]);
  };

  const handleBreadcrumbNavigate = (path) => {
    if (!path.length) { setExpandedSection(null); setCurrentSubsection(null); setBreadcrumbPath([]); }
    else if (path.length === 1) { setExpandedSection(path[0].id); setCurrentSubsection(null); setBreadcrumbPath(path); }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: colors.bg, color: colors.white, padding: '24px 40px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: colors.gold, fontSize: 20, fontWeight: 600 }}>33</span>
            <span style={{ color: colors.zinc600, fontSize: 14, fontWeight: 500, letterSpacing: '0.05em' }}>CLARITY CANVAS</span>
          </div>
          <button style={{ padding: '8px 16px', fontSize: 14, fontWeight: 500, color: colors.gold, backgroundColor: 'rgba(212,168,75,0.1)', border: 'none', borderRadius: 8, cursor: 'pointer' }}>+ Add Context</button>
        </div>
        <ProfileHeader user={profile.user} overallScore={overallScore} />
        <Breadcrumbs path={breadcrumbPath} onNavigate={handleBreadcrumbNavigate} />
        {currentSubsection ? (
          <SubsectionDetailView section={profile.sections[currentSubsection.sectionId]} subsection={profile.sections[currentSubsection.sectionId].subsections[currentSubsection.subsectionId]} onBack={() => { setCurrentSubsection(null); setBreadcrumbPath(breadcrumbPath.slice(0, 1)); }} />
        ) : (
          <SectionListView sections={profile.sections} expandedSection={expandedSection} onSectionClick={handleSectionClick} onSubsectionClick={handleSubsectionClick} />
        )}
        <FooterStats user={profile.user} />
      </div>
    </div>
  );
}
