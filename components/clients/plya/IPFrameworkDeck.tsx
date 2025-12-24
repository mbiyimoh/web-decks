'use client';

import React, { useState, useEffect, useRef, ReactNode } from 'react';

const GOLD = '#d4a54a';
const GOLD_DIM = 'rgba(212, 165, 74, 0.15)';
const GREEN = '#4ade80';
const BG_PRIMARY = '#0a0a0f';
const BG_SURFACE = '#111114';

interface SectionProps {
  children: ReactNode;
  id: string;
}

const Section = ({ children, id }: SectionProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.2 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      id={id}
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '64px 24px',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'opacity 0.6s ease, transform 0.6s ease'
      }}
    >
      {children}
    </section>
  );
};

const SectionLabel = ({ children }: { children: ReactNode }) => (
  <p className="font-mono" style={{ color: GOLD, fontSize: 12, fontWeight: 500, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 16 }}>
    {children}
  </p>
);

const Headline = ({ children }: { children: ReactNode }) => (
  <h2 className="font-display" style={{ fontSize: 'clamp(32px, 6vw, 56px)', fontWeight: 400, lineHeight: 1.15, color: '#fff', marginBottom: 24 }}>
    {children}
  </h2>
);

interface BodyTextProps {
  children: ReactNode;
  style?: React.CSSProperties;
}

const BodyText = ({ children, style = {} }: BodyTextProps) => (
  <p className="font-body" style={{ fontSize: 18, lineHeight: 1.7, color: '#a3a3a3', maxWidth: 600, ...style }}>{children}</p>
);

export default function IPFrameworkDeck() {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      setScrollProgress(docHeight > 0 ? scrollTop / docHeight : 0);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const chaseTerms = [
    { term: '100% IP assignment', issue: 'Would prevent us from applying general technical approaches to any future client', consequence: 'Kills our ability to run a consulting business' },
    { term: 'Work for hire', issue: 'Means PLYA owns not just the implementation, but the underlying methodologies', consequence: 'Could block us from building any AI coaching tools' },
    { term: 'No derivative works', issue: 'Prevents building anything with similar functionality anywhere', consequence: 'An aggressive acquirer could argue this covers nearly everything' },
    { term: 'No reuse rights', issue: 'Cannot apply lessons learned or patterns developed', consequence: 'Each engagement starts from scratch' }
  ];

  return (
    <div className="font-body" style={{ background: BG_PRIMARY, color: '#fff' }}>
      {/* Progress Bar */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 3, background: '#1a1a1a', zIndex: 100 }}>
        <div style={{ height: '100%', background: GOLD, width: `${scrollProgress * 100}%`, transition: 'width 0.1s' }} />
      </div>

      {/* ========== SLIDE 1: TITLE ========== */}
      <Section id="title">
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <SectionLabel>33 Strategies × PLYA</SectionLabel>
          <Headline>
            IP: Protecting both <span style={{ color: GOLD }}>yours&nbsp;and&nbsp;ours</span>.
          </Headline>
          <BodyText style={{ margin: '0 auto', textAlign: 'center' }}>
            How we think about intellectual property, ownership, and protecting what&nbsp;matters&nbsp;most.
          </BodyText>
        </div>
      </Section>

      {/* ========== SLIDE 2: THE BOTTOM LINE ========== */}
      <Section id="bottom-line">
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <SectionLabel>The Bottom Line</SectionLabel>
          <Headline>
            Clear boundaries. <span style={{ color: GOLD }}>Shared&nbsp;value.</span>
          </Headline>
          <div style={{ padding: 24, background: `${GREEN}15`, borderRadius: 12, border: `1px solid ${GREEN}40`, marginBottom: 32 }}>
            <p style={{ fontSize: 18, color: '#fff', lineHeight: 1.6, margin: 0 }}>
              <strong style={{ color: GREEN }}>You own everything we build for you.</strong> We have zero interest in competing with&nbsp;our&nbsp;clients.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            <div style={{ padding: 32, background: BG_SURFACE, borderRadius: 16, border: `1px solid ${GREEN}40` }}>
              <h3 style={{ fontSize: 13, fontWeight: 600, color: GREEN, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 24 }}>
                What PLYA Owns
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {['Your specific app and implementation', 'All user data and content', 'Fitness-specific business logic', 'Your competitive advantages'].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <span style={{ color: GREEN, fontSize: 14, marginTop: 2 }}>✓</span>
                    <span style={{ fontSize: 15, color: '#d4d4d4', lineHeight: 1.5 }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ padding: 32, background: BG_SURFACE, borderRadius: 16, border: '1px solid #27272a' }}>
              <h3 style={{ fontSize: 13, fontWeight: 600, color: GOLD, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 24 }}>
                What 33 Strategies Retains
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {['Technical approaches and patterns', 'General AI methodologies', 'Reusable code frameworks', 'Cross-industry applications'].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <span style={{ color: GOLD, fontSize: 14, marginTop: 2 }}>→</span>
                    <span style={{ fontSize: 15, color: '#d4d4d4', lineHeight: 1.5 }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div style={{ marginTop: 32, padding: 20, background: BG_SURFACE, borderRadius: 12, border: '1px solid #27272a' }}>
            <p style={{ fontSize: 14, color: '#737373', lineHeight: 1.6, margin: 0 }}>
              <span style={{ color: '#a3a3a3' }}>By the way:</span> Our goal is to attract the most brilliant minds to work with us. That means going above and beyond to avoid even the <em>perception</em> of doing something that competes with a founder who trusted us to&nbsp;build&nbsp;with&nbsp;them.
            </p>
          </div>
        </div>
      </Section>

      {/* ========== SLIDE 3: SPIRIT VS LETTER ========== */}
      <Section id="spirit-letter">
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <SectionLabel>Spirit vs. Letter</SectionLabel>
          <Headline>
            We are aligned in spirit. But we need <span style={{ color: GOLD }}>legal&nbsp;clarity</span>.
          </Headline>
          <BodyText>
            You asked for terms like &quot;100% IP assignment,&quot; &quot;work for hire,&quot; and &quot;no derivative works.&quot; We get why - you want protection. But here is why those specific terms would paint us into&nbsp;a&nbsp;corner:
          </BodyText>
          <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {chaseTerms.map((item, i) => (
              <div key={i} style={{ padding: 20, background: BG_SURFACE, borderRadius: 12, border: '1px solid #27272a' }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: '#ef4444', display: 'block', marginBottom: 8 }}>{item.term}</span>
                <p style={{ fontSize: 14, color: '#a3a3a3', marginBottom: 4, lineHeight: 1.5 }}>{item.issue}</p>
                <p style={{ fontSize: 13, color: '#737373', margin: 0 }}>→ {item.consequence}</p>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 32, padding: 24, background: '#7f1d1d20', borderRadius: 16, border: '1px solid #7f1d1d40' }}>
            <h4 style={{ fontSize: 14, fontWeight: 600, color: '#fbbf24', marginBottom: 12 }}>The PE Scenario</h4>
            <p style={{ fontSize: 15, color: '#d4d4d4', lineHeight: 1.6, margin: 0 }}>
              You might not always be the person we are dealing with. PLYA could be acquired by aggressive PE in 5 years. Our agreements need to protect our ability to operate <em>even if</em> we are dealing with someone who interprets contract terms as&nbsp;aggressively&nbsp;as&nbsp;possible.
            </p>
          </div>
{/* Link hidden until contract terms page is ready
          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <a
              href="#"
              style={{
                color: GOLD,
                fontSize: 14,
                textDecoration: 'none',
                borderBottom: `1px solid ${GOLD}`,
                paddingBottom: 2
              }}
            >
              View our full IP language and contract terms →
            </a>
          </div>
*/}
        </div>
      </Section>

      {/* ========== SLIDE 4: MOVING FORWARD ========== */}
      <Section id="moving-forward">
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <SectionLabel>Moving Forward</SectionLabel>
          <Headline>
            What we can do <span style={{ color: GOLD }}>right&nbsp;now</span>.
          </Headline>
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ padding: 28, background: BG_SURFACE, borderRadius: 16, border: '1px solid #27272a' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: GOLD_DIM, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600, color: GOLD, flexShrink: 0 }}>
                  1
                </div>
                <div>
                  <p style={{ fontSize: 18, fontWeight: 500, color: '#fff', marginBottom: 8 }}>Call out specific derivatives you are&nbsp;worried&nbsp;about</p>
                  <p style={{ fontSize: 15, color: '#a3a3a3', lineHeight: 1.6, margin: 0 }}>
                    If there are specific future directions for PLYA that you want explicitly protected - features you are planning, adjacent markets you want to own - let us name them in&nbsp;the&nbsp;contract.
                  </p>
                </div>
              </div>
            </div>
            <div style={{ padding: 28, background: BG_SURFACE, borderRadius: 16, border: '1px solid #27272a' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: GOLD_DIM, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600, color: GOLD, flexShrink: 0 }}>
                  2
                </div>
                <div>
                  <p style={{ fontSize: 18, fontWeight: 500, color: '#fff', marginBottom: 8 }}>Know that our framework is designed to give you&nbsp;upside</p>
                  <p style={{ fontSize: 15, color: '#a3a3a3', lineHeight: 1.6, margin: 0 }}>
                    This is a side conversation for another time - but you should know how we operate: if we ever build something in the future that benefits from work we did together, even if it is clearly non-competitive, our framework is designed to give you equity in that&nbsp;new&nbsp;endeavor.
                  </p>
                  <p style={{ fontSize: 13, color: '#737373', lineHeight: 1.5, marginTop: 12 }}>
                    We mention this not because we need to solve it now, but because it speaks to how seriously we take the &quot;we will not compete with you&quot; commitment. We have built an entire system around&nbsp;it.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <p style={{ marginTop: 32, fontSize: 16, color: '#737373', textAlign: 'center' }}>
            We will handle the rest in the&nbsp;contract.
          </p>
        </div>
      </Section>

      {/* ========== SLIDE 5: NEXT STEPS ========== */}
      <Section id="next-steps">
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <SectionLabel>Next Steps</SectionLabel>
          <Headline>
            Here is what <span style={{ color: GOLD }}>happens&nbsp;next</span>.
          </Headline>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ padding: 24, background: BG_SURFACE, borderRadius: 12, border: '1px solid #27272a', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: GOLD_DIM, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, color: GOLD, flexShrink: 0 }}>1</div>
              <div>
                <p style={{ fontSize: 16, fontWeight: 500, color: '#fff', marginBottom: 4 }}>Full contract via TalkingDocs</p>
                <p style={{ fontSize: 14, color: '#a3a3a3', lineHeight: 1.5, margin: 0 }}>
                  We will send you a complete contract with IP language through our interactive TalkingDocs portal - you will be able to ask questions and get explanations on any&nbsp;section.
                </p>
              </div>
            </div>
            <div style={{ padding: 24, background: BG_SURFACE, borderRadius: 12, border: '1px solid #27272a', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: GOLD_DIM, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, color: GOLD, flexShrink: 0 }}>2</div>
              <div>
                <p style={{ fontSize: 16, fontWeight: 500, color: '#fff', marginBottom: 4 }}>Clear explanation of protections</p>
                <p style={{ fontSize: 14, color: '#a3a3a3', lineHeight: 1.5, margin: 0 }}>
                  The contract will include a plain-language explanation of how the IP terms protect 33 Strategies&apos; position as a consultant while ensuring you fully own all IP that relates specifically to&nbsp;PLYA.
                </p>
              </div>
            </div>
            <div style={{ padding: 24, background: BG_SURFACE, borderRadius: 12, border: '1px solid #27272a', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: GOLD_DIM, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, color: GOLD, flexShrink: 0 }}>3</div>
              <div>
                <p style={{ fontSize: 16, fontWeight: 500, color: '#fff', marginBottom: 4 }}>Review terms</p>
                <p style={{ fontSize: 14, color: '#a3a3a3', lineHeight: 1.5, margin: 0 }}>
                  Take the time you need to review. We will address any questions and make sure everything is&nbsp;clear.
                </p>
              </div>
            </div>
            <div style={{ padding: 24, background: BG_SURFACE, borderRadius: 12, border: `1px solid ${GREEN}40`, display: 'flex', alignItems: 'flex-start', gap: 16 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: `${GREEN}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, color: GREEN, flexShrink: 0 }}>4</div>
              <div>
                <p style={{ fontSize: 16, fontWeight: 500, color: '#fff', marginBottom: 4 }}>Sign and kick off</p>
                <p style={{ fontSize: 14, color: '#a3a3a3', lineHeight: 1.5, margin: 0 }}>
                  Once aligned, sign the agreement and submit the first 1/3 deposit to begin the&nbsp;engagement.
                </p>
                <div style={{ marginTop: 12, padding: 12, background: 'rgba(255,255,255,0.03)', borderRadius: 8, borderLeft: `2px solid ${GOLD}` }}>
                  <p style={{ fontSize: 13, color: '#737373', margin: 0, lineHeight: 1.5 }}>
                    <span style={{ color: '#a3a3a3' }}>Agreed terms:</span> <span style={{ color: GOLD }}>$29,700</span> cash + <span style={{ color: GOLD }}>1% equity</span> in PLYA
                  </p>
                </div>
              </div>
            </div>
          </div>
          <p style={{ marginTop: 32, fontSize: 16, color: '#737373', textAlign: 'center' }}>
            Meanwhile, we&apos;ll continue laying the groundwork for the PLYA v1 app&nbsp;build&nbsp;out.
          </p>
        </div>
      </Section>

      {/* ========== SLIDE 6: CLOSING ========== */}
      <Section id="closing">
        <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
          <p className="font-display" style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 400, lineHeight: 1.3, color: '#fff', marginBottom: 24 }}>
            Questions in the <span style={{ color: GOLD }}>meantime</span>?
          </p>
          <BodyText style={{ margin: '0 auto 32px', textAlign: 'center' }}>
            We are actively working on the full documents and the official 33 Strategies company launch. If anything comes up before then, just&nbsp;ask.
          </BodyText>
          <p style={{ fontSize: 14, color: '#737373', lineHeight: 1.6, margin: 0 }}>
            We will get all the documents on a webpage to you&nbsp;shortly.
          </p>
        </div>
      </Section>

      {/* Footer */}
      <div style={{ padding: '48px 24px', borderTop: '1px solid #1a1a1a', textAlign: 'center' }}>
        <p className="font-display" style={{ fontSize: 24, fontWeight: 400, color: '#525252', margin: 0 }}>
          <span style={{ color: GOLD }}>33</span> Strategies
        </p>
      </div>
    </div>
  );
}
