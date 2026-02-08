import React, { useState, useRef } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';

// ============================================================================
// CONSTANTS (matching 33 Strategies design system)
// ============================================================================

const GOLD = '#d4a54a';
const GOLD_DIM = 'rgba(212, 165, 74, 0.15)';
const GREEN = '#4ade80';
const GREEN_DIM = 'rgba(74, 222, 128, 0.15)';
const BG_PRIMARY = '#0a0a0f';
const BG_SURFACE = '#111114';
const BG_ELEVATED = '#1a1a1f';

// ============================================================================
// UTILITY COMPONENTS
// ============================================================================

const ProgressBar = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);
  return (
    <motion.div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        background: GOLD,
        transformOrigin: 'left',
        zIndex: 100,
        scaleX
      }}
    />
  );
};

const Section = ({ children, id }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, margin: "-20%" });
  return (
    <motion.section
      ref={ref}
      id={id}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '64px 24px',
        position: 'relative',
      }}
    >
      {children}
    </motion.section>
  );
};

const RevealText = ({ children, delay = 0 }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, margin: "-10%" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.7, delay, ease: [0.25, 0.4, 0.25, 1] }}
    >
      {children}
    </motion.div>
  );
};

const SectionLabel = ({ children }) => (
  <p className="font-mono" style={{
    color: GOLD,
    fontSize: 12,
    fontWeight: 500,
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    marginBottom: 16
  }}>
    {children}
  </p>
);

const Headline = ({ children }) => (
  <h2 className="font-display" style={{
    fontSize: 'clamp(32px, 6vw, 56px)',
    fontWeight: 400,
    lineHeight: 1.15,
    color: '#fff',
    marginBottom: 24
  }}>
    {children}
  </h2>
);

const BodyText = ({ children, style = {} }) => (
  <p className="font-body" style={{
    fontSize: 18,
    lineHeight: 1.7,
    color: '#a3a3a3',
    maxWidth: 600,
    ...style
  }}>
    {children}
  </p>
);

// Expandable Component
const Expandable = ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div style={{
      background: BG_SURFACE,
      borderRadius: 12,
      border: '1px solid #27272a',
      overflow: 'hidden',
      marginBottom: 12
    }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="font-body"
        style={{
          width: '100%',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left'
        }}
      >
        <span style={{ fontSize: 15, fontWeight: 500, color: '#fff' }}>
          {title}
        </span>
        <span style={{
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
          transition: 'transform 0.2s',
          color: '#737373'
        }}>
          ▼
        </span>
      </button>

      {isOpen && (
        <div style={{
          padding: '0 20px 20px 20px',
          borderTop: '1px solid #27272a'
        }}>
          {children}
        </div>
      )}
    </div>
  );
};

// Domain Tab Component
const DomainTab = ({ domain, isActive, onClick, icon }) => (
  <button
    onClick={onClick}
    className="font-body"
    style={{
      padding: '10px 16px',
      background: isActive ? BG_ELEVATED : 'transparent',
      color: isActive ? GOLD : '#737373',
      border: isActive ? `1px solid ${GOLD}` : '1px solid #27272a',
      borderRadius: 8,
      fontSize: 14,
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }}
  >
    <span>{icon}</span>
    {domain}
  </button>
);

// ============================================================================
// DATA
// ============================================================================

const domains = {
  'M&A': {
    icon: '🎯',
    summary: 'Build intelligence infrastructure for smarter target identification and market mapping.',
    projects: [
      'M&A target/prospect database expansion',
      'Automated market mapping and competitive analysis',
      'Founder/company intelligence gathering'
    ],
    metrics: [
      '# of qualified targets identified',
      'Time saved on research (hours/week)',
      'Coverage improvement (% of market mapped)'
    ],
    note: 'This may be a direct collaboration with Rob, separate from the 3 fellowship slots.'
  },
  'Content': {
    icon: '📚',
    summary: 'Scale and systematize content creation — the core of what 33strategies does.',
    projects: [
      'Content creation workflow optimization',
      'AI-assisted first-draft generation',
      'Cross-company content repurposing'
    ],
    metrics: [
      'Content production volume (pieces/week)',
      'Time-to-publish reduction (%)',
      'Quality score maintenance'
    ],
    note: 'High leverage — patterns here apply across all acquired companies.'
  },
  'Finance': {
    icon: '💰',
    summary: 'Bounded, high-ROI automation projects with clear efficiency gains.',
    projects: [
      'Revenue recognition automation',
      'Collections process improvement',
      'Financial close acceleration'
    ],
    metrics: [
      'Manual steps eliminated (#)',
      'Cycle time reduction (%)',
      'Error rate improvement'
    ],
    note: 'Self-contained projects with measurable before/after.'
  },
  'Marketing': {
    icon: '📣',
    summary: 'Seed AI capabilities into marketing for campaign optimization and lead generation.',
    projects: [
      'Campaign generation and A/B testing',
      'Lead scoring and prioritization',
      'Personalization at scale'
    ],
    metrics: [
      'Campaign performance improvement (%)',
      'Lead quality score',
      'Time-to-launch reduction'
    ],
    note: 'Less defined than other domains — good for someone with initiative.'
  }
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function AIFellowshipProposal() {
  const [activeDomain, setActiveDomain] = useState('M&A');

  return (
    <div className="font-body" style={{ background: BG_PRIMARY, color: '#fff' }}>
      <ProgressBar />

      {/* Hero Section */}
      <Section id="hero">
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <RevealText>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 14px',
              background: GOLD_DIM,
              borderRadius: 20,
              marginBottom: 24
            }}>
              <span style={{ fontSize: 14 }}>🎓</span>
              <span className="font-mono" style={{
                fontSize: 12,
                fontWeight: 600,
                color: GOLD,
                textTransform: 'uppercase',
                letterSpacing: '0.1em'
              }}>
                AI Fellowship Program
              </span>
            </div>
          </RevealText>

          <RevealText delay={0.1}>
            <Headline>
              Build <span style={{ color: GOLD }}>Champions</span>,<br />Not Dependency
            </Headline>
          </RevealText>

          <RevealText delay={0.2}>
            <BodyText>
              AI isn't your rally cry this quarter — and that's smart. But the window to build
              internal capability before Phase 2 is now. Here's how we use the next 8 weeks to
              create momentum without boiling the ocean.
            </BodyText>
          </RevealText>

          <RevealText delay={0.3}>
            <div style={{
              marginTop: 40,
              display: 'flex',
              gap: 16,
              flexWrap: 'wrap'
            }}>
              {[
                { value: '8', label: 'Weeks' },
                { value: '3', label: 'Fellows' },
                { value: '2hrs', label: 'Per Week Each' }
              ].map((stat, i) => (
                <div key={i} style={{
                  padding: '16px 24px',
                  background: BG_SURFACE,
                  borderRadius: 12,
                  border: '1px solid #27272a',
                  textAlign: 'center'
                }}>
                  <p className="font-display" style={{
                    fontSize: 28,
                    color: GOLD,
                    marginBottom: 4
                  }}>
                    {stat.value}
                  </p>
                  <p className="font-body" style={{
                    fontSize: 12,
                    color: '#737373',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </RevealText>
        </div>
      </Section>

      {/* The Model Section */}
      <Section id="model">
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <RevealText><SectionLabel>The Model</SectionLabel></RevealText>
          <RevealText delay={0.1}>
            <Headline>Teach Them to <span style={{ color: GOLD }}>Fish</span></Headline>
          </RevealText>
          <RevealText delay={0.2}>
            <BodyText style={{ marginBottom: 48 }}>
              This isn't a consulting engagement where we build everything for you.
              It's a capability transfer where your people become the experts.
            </BodyText>
          </RevealText>

          <RevealText delay={0.3}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 24
            }}>
              {/* My Role */}
              <div style={{
                padding: 28,
                background: BG_SURFACE,
                borderRadius: 16,
                border: `1px solid ${GOLD_DIM}`
              }}>
                <h3 className="font-mono" style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: GOLD,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  marginBottom: 20
                }}>
                  What I Do
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    'Scope and architect use cases',
                    'Introduce AI tools and workflows',
                    'Provide feedback and refinement',
                    'Design experiments and activities'
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ color: GOLD, fontSize: 14 }}>→</span>
                      <span style={{ fontSize: 15, color: '#d4d4d4' }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fellow Role */}
              <div style={{
                padding: 28,
                background: BG_SURFACE,
                borderRadius: 16,
                border: `1px solid ${GREEN_DIM}`
              }}>
                <h3 className="font-mono" style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: GREEN,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  marginBottom: 20
                }}>
                  What Fellows Do
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    'Build and iterate hands-on',
                    'Apply learnings in their workflows',
                    'Document what works',
                    'Become go-to advocates'
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ color: GREEN, fontSize: 14 }}>→</span>
                      <span style={{ fontSize: 15, color: '#d4d4d4' }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </RevealText>
        </div>
      </Section>

      {/* Three Deliverables Section */}
      <Section id="deliverables">
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <RevealText><SectionLabel>What Each Fellow Gets</SectionLabel></RevealText>
          <RevealText delay={0.1}>
            <Headline>Three <span style={{ color: GOLD }}>Deliverables</span></Headline>
          </RevealText>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            marginTop: 40
          }}>
            {[
              {
                number: '01',
                title: 'A Scoped Mission',
                description: 'A clearly defined project tied to a real business objective with measurable success criteria.',
                detail: 'First 1-2 weeks focus on using AI to refine the objective itself and define what winning looks like.'
              },
              {
                number: '02',
                title: 'A Tangible Deliverable',
                description: 'A working workflow, mini-tool, or process improvement that demonstrates "life is better."',
                detail: 'Not a deck or a recommendation — something that actually runs and creates value.'
              },
              {
                number: '03',
                title: 'AI Fluency',
                description: 'The mindset, patterns, and confidence to keep building after the 8 weeks end.',
                detail: 'They become the person their team asks "how do I use AI for this?"'
              }
            ].map((item, i) => (
              <RevealText key={i} delay={0.2 + i * 0.1}>
                <div style={{
                  padding: 24,
                  background: BG_SURFACE,
                  borderRadius: 16,
                  border: '1px solid #27272a',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 20
                }}>
                  <span className="font-display" style={{
                    fontSize: 32,
                    color: GOLD_DIM,
                    lineHeight: 1,
                    flexShrink: 0
                  }}>
                    {item.number}
                  </span>
                  <div style={{ flex: 1 }}>
                    <h3 className="font-body" style={{
                      fontSize: 18,
                      fontWeight: 600,
                      color: '#fff',
                      marginBottom: 8
                    }}>
                      {item.title}
                    </h3>
                    <p className="font-body" style={{
                      fontSize: 15,
                      color: '#a3a3a3',
                      lineHeight: 1.6,
                      marginBottom: 12
                    }}>
                      {item.description}
                    </p>
                    <p className="font-body" style={{
                      fontSize: 13,
                      color: '#525252',
                      fontStyle: 'italic',
                      margin: 0
                    }}>
                      {item.detail}
                    </p>
                  </div>
                </div>
              </RevealText>
            ))}
          </div>
        </div>
      </Section>

      {/* Candidate Domains Section */}
      <Section id="domains">
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <RevealText><SectionLabel>Where We Focus</SectionLabel></RevealText>
          <RevealText delay={0.1}>
            <Headline>Candidate <span style={{ color: GOLD }}>Domains</span></Headline>
          </RevealText>
          <RevealText delay={0.15}>
            <BodyText style={{ marginBottom: 32 }}>
              Four domains with high-impact AI opportunities. Product is explicitly excluded from Phase 1
              (they're focused on the reports rewrite).
            </BodyText>
          </RevealText>

          <RevealText delay={0.2}>
            {/* Domain Tabs */}
            <div style={{
              display: 'flex',
              gap: 10,
              flexWrap: 'wrap',
              marginBottom: 20
            }}>
              {Object.keys(domains).map(domain => (
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
            <div style={{
              background: BG_SURFACE,
              borderRadius: 16,
              border: '1px solid #27272a',
              overflow: 'hidden'
            }}>
              <div style={{
                padding: 24,
                borderBottom: '1px solid #27272a'
              }}>
                <p className="font-body" style={{
                  fontSize: 16,
                  color: '#d4d4d4',
                  lineHeight: 1.6,
                  margin: 0
                }}>
                  {domains[activeDomain].summary}
                </p>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                borderBottom: '1px solid #27272a'
              }}>
                <div style={{ padding: 24, borderRight: '1px solid #27272a' }}>
                  <h4 className="font-mono" style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: '#525252',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: 12
                  }}>
                    Likely Projects
                  </h4>
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                    {domains[activeDomain].projects.map((project, i) => (
                      <li key={i} style={{
                        fontSize: 14,
                        color: '#a3a3a3',
                        padding: '6px 0',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 8
                      }}>
                        <span style={{ color: GOLD }}>•</span>
                        {project}
                      </li>
                    ))}
                  </ul>
                </div>

                <div style={{ padding: 24 }}>
                  <h4 className="font-mono" style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: '#525252',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: 12
                  }}>
                    Success Metrics
                  </h4>
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                    {domains[activeDomain].metrics.map((metric, i) => (
                      <li key={i} style={{
                        fontSize: 14,
                        color: '#a3a3a3',
                        padding: '6px 0',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 8
                      }}>
                        <span style={{ color: GREEN }}>↗</span>
                        {metric}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div style={{
                padding: '14px 24px',
                background: 'rgba(255,255,255,0.02)'
              }}>
                <p className="font-body" style={{
                  fontSize: 13,
                  color: '#525252',
                  fontStyle: 'italic',
                  margin: 0
                }}>
                  💡 {domains[activeDomain].note}
                </p>
              </div>
            </div>

            {/* Product Exclusion Note */}
            <div style={{
              marginTop: 16,
              padding: '14px 20px',
              background: 'rgba(239, 68, 68, 0.05)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12
            }}>
              <span style={{ fontSize: 14 }}>⏸️</span>
              <div>
                <p className="font-body" style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#d4d4d4',
                  marginBottom: 2
                }}>
                  Product Team — Phase 2
                </p>
                <p className="font-body" style={{
                  fontSize: 13,
                  color: '#737373',
                  margin: 0
                }}>
                  Currently heads-down on the reports rewrite (the Q1 rally cry).
                  AI engagement with product deferred to a later phase.
                </p>
              </div>
            </div>
          </RevealText>
        </div>
      </Section>

      {/* Timeline Section */}
      <Section id="timeline">
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <RevealText><SectionLabel>The Journey</SectionLabel></RevealText>
          <RevealText delay={0.1}>
            <Headline>8-Week <span style={{ color: GOLD }}>Arc</span></Headline>
          </RevealText>

          <RevealText delay={0.2}>
            <div style={{
              marginTop: 40,
              display: 'flex',
              flexDirection: 'column',
              gap: 8
            }}>
              {[
                {
                  weeks: 'Week 1-2',
                  title: 'Foundation & Scoping',
                  activities: ['Mission scoping', 'Baseline metrics', 'Custom GPT creation'],
                  height: 120 // 2 weeks
                },
                {
                  weeks: 'Week 3-6',
                  title: 'Build & Iterate',
                  activities: ['Weekly sessions', 'Workflow building', 'Feedback loops', 'Mid-point check-in'],
                  height: 240 // 4 weeks
                },
                {
                  weeks: 'Week 7-8',
                  title: 'Polish & Handoff',
                  activities: ['Documentation', 'Results measurement', 'Showcase prep'],
                  height: 120 // 2 weeks
                }
              ].map((phase, i) => (
                <div key={i} style={{
                  minHeight: phase.height,
                  padding: 24,
                  background: BG_SURFACE,
                  borderRadius: 12,
                  borderLeft: `4px solid ${GOLD}`,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 16,
                    marginBottom: 12
                  }}>
                    <p className="font-mono" style={{
                      fontSize: 12,
                      color: GOLD,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      flexShrink: 0
                    }}>
                      {phase.weeks}
                    </p>
                    <p className="font-body" style={{
                      fontSize: 18,
                      fontWeight: 600,
                      color: '#fff',
                      margin: 0
                    }}>
                      {phase.title}
                    </p>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {phase.activities.map((activity, j) => (
                      <span key={j} style={{
                        background: 'rgba(255,255,255,0.05)',
                        padding: '6px 12px',
                        borderRadius: 20,
                        fontSize: 13,
                        color: '#a3a3a3'
                      }}>
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

      {/* Success Section */}
      <Section id="success">
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <RevealText><SectionLabel>The End State</SectionLabel></RevealText>
          <RevealText delay={0.1}>
            <Headline>What <span style={{ color: GOLD }}>Success</span> Looks Like</Headline>
          </RevealText>
          <RevealText delay={0.15}>
            <BodyText style={{ marginBottom: 40 }}>
              At the end of 8 weeks, you'll be able to say:
            </BodyText>
          </RevealText>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              '"We have 3 internal AI champions who built real things and are ready to scale this in Phase 2."',
              '"We improved [specific workflow] by [measurable amount] — there\'s a clear before and after."',
              '"We demonstrated AI value in content, finance, and marketing — without disrupting the rally cry."'
            ].map((quote, i) => (
              <RevealText key={i} delay={0.2 + i * 0.08}>
                <div style={{
                  padding: 20,
                  background: BG_SURFACE,
                  borderRadius: 12,
                  border: '1px solid #27272a',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 16
                }}>
                  <span className="font-display" style={{
                    fontSize: 24,
                    color: GOLD_DIM
                  }}>
                    "
                  </span>
                  <p className="font-body" style={{
                    fontSize: 16,
                    color: '#d4d4d4',
                    lineHeight: 1.5,
                    fontStyle: 'italic',
                    margin: 0
                  }}>
                    {quote.slice(1, -1)}
                  </p>
                </div>
              </RevealText>
            ))}
          </div>
        </div>
      </Section>

      {/* Open Questions Section */}
      <Section id="questions">
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <RevealText><SectionLabel>Decisions Needed</SectionLabel></RevealText>
          <RevealText delay={0.1}>
            <Headline>Open <span style={{ color: GOLD }}>Questions</span></Headline>
          </RevealText>
          <RevealText delay={0.15}>
            <BodyText style={{ marginBottom: 32 }}>
              Before we kick off Week 1, we need to lock in a few decisions:
            </BodyText>
          </RevealText>

          <RevealText delay={0.2}>
            <Expandable title="Who are the 3 fellows?" defaultOpen={true}>
              <div style={{ paddingTop: 16 }}>
                <p className="font-body" style={{
                  fontSize: 14,
                  color: '#a3a3a3',
                  lineHeight: 1.6,
                  marginBottom: 16
                }}>
                  Two selection approaches discussed:
                </p>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: 12
                }}>
                  <div style={{
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: 8,
                    padding: 16
                  }}>
                    <h4 className="font-body" style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: '#fff',
                      marginBottom: 8
                    }}>
                      Option A: Open Call
                    </h4>
                    <p className="font-body" style={{
                      fontSize: 13,
                      color: '#737373',
                      margin: 0
                    }}>
                      Company-wide invite: "We're picking 3 people — submit your AI project idea."
                    </p>
                  </div>
                  <div style={{
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: 8,
                    padding: 16
                  }}>
                    <h4 className="font-body" style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: '#fff',
                      marginBottom: 8
                    }}>
                      Option B: Top-Down
                    </h4>
                    <p className="font-body" style={{
                      fontSize: 13,
                      color: '#737373',
                      margin: 0
                    }}>
                      Leadership picks specific people in high-impact areas — also a reward/opportunity.
                    </p>
                  </div>
                </div>
              </div>
            </Expandable>

            <Expandable title="Is M&A one of the 3 slots or separate?">
              <div style={{ paddingTop: 16 }}>
                <p className="font-body" style={{
                  fontSize: 14,
                  color: '#a3a3a3',
                  lineHeight: 1.6,
                  margin: 0
                }}>
                  M&A (market mapping, target database) might be a direct you-and-me collaboration,
                  separate from the 3 fellowship slots. That would mean the 3 fellows come from
                  Content, Finance, and Marketing. Or M&A takes one of the 3 slots. Your call.
                </p>
              </div>
            </Expandable>

            <Expandable title="Does success criteria above look right?">
              <div style={{ paddingTop: 16 }}>
                <p className="font-body" style={{
                  fontSize: 14,
                  color: '#a3a3a3',
                  lineHeight: 1.6,
                  margin: 0
                }}>
                  I've articulated what I think success looks like in the previous section —
                  3 champions who built real things, measurable workflow improvements,
                  demonstrated AI value without disrupting the rally cry.
                  Does that match what you need to be able to say at the end of 8 weeks?
                </p>
              </div>
            </Expandable>
          </RevealText>
        </div>
      </Section>

      {/* Investment Section */}
      <Section id="investment">
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <RevealText><SectionLabel>Investment</SectionLabel></RevealText>
          <RevealText delay={0.1}>
            <Headline>The <span style={{ color: GOLD }}>Engagement</span></Headline>
          </RevealText>

          <RevealText delay={0.2}>
            <div style={{
              padding: 32,
              background: BG_SURFACE,
              borderRadius: 20,
              border: `1px solid ${GOLD}`
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                marginBottom: 24,
                paddingBottom: 24,
                borderBottom: '1px solid #27272a'
              }}>
                <div>
                  <p className="font-body" style={{
                    fontSize: 15,
                    color: '#737373',
                    marginBottom: 4
                  }}>
                    8 weeks, 3 champions
                  </p>
                  <p className="font-display" style={{
                    fontSize: 42,
                    color: GOLD,
                    margin: 0
                  }}>
                    $20,000
                  </p>
                </div>
                <p className="font-body" style={{
                  fontSize: 15,
                  color: '#525252',
                  margin: 0
                }}>
                  ~$10K / month
                </p>
              </div>

              <div style={{ marginBottom: 24 }}>
                <p className="font-body" style={{
                  fontSize: 16,
                  color: '#d4d4d4',
                  lineHeight: 1.7,
                  marginBottom: 16
                }}>
                  One day a week embedded with your team. In between sessions, I'm designing exercises, reviewing progress, and thinking through what each champion needs next.
                </p>
                <p className="font-body" style={{
                  fontSize: 15,
                  color: '#a3a3a3',
                  lineHeight: 1.7,
                  margin: 0
                }}>
                  This is lighter than our standard transformation engagement — you get the coaching and capability transfer, but 33 Strategies isn't building something ourselves. You and your champions are. That's the whole point.
                </p>
              </div>

              <div style={{
                padding: '16px 20px',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: 10,
                borderLeft: `3px solid ${GOLD}`
              }}>
                <p className="font-body" style={{
                  fontSize: 14,
                  color: '#737373',
                  margin: 0
                }}>
                  <span style={{ color: '#a3a3a3' }}>Note:</span> If M&A work with you directly makes sense as a fourth track, we can structure that separately depending on scope.
                </p>
              </div>
            </div>
          </RevealText>
        </div>
      </Section>

      {/* CTA Section */}
      <Section id="cta">
        <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
          <RevealText><SectionLabel>Next Steps</SectionLabel></RevealText>
          <RevealText delay={0.1}>
            <Headline>Ready to Build <span style={{ color: GOLD }}>Champions</span>?</Headline>
          </RevealText>
          <RevealText delay={0.2}>
            <BodyText style={{ textAlign: 'center', maxWidth: 500, margin: '0 auto' }}>
              Let's finalize the fellow selection and lock in Week 1.
            </BodyText>
          </RevealText>
        </div>
      </Section>

      {/* Footer */}
      <div style={{
        padding: '48px 24px',
        borderTop: '1px solid #1a1a1a',
        textAlign: 'center'
      }}>
        <p className="font-display" style={{
          fontSize: 24,
          color: '#525252',
          margin: 0
        }}>
          <span style={{ color: GOLD }}>33</span> Strategies
        </p>
        <p className="font-body" style={{
          fontSize: 13,
          color: '#525252',
          marginTop: 12
        }}>
          AI Fellowship Proposal • February 2025
        </p>
      </div>
    </div>
  );
}
