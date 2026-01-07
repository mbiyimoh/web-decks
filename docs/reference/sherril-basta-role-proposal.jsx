import React, { useState } from 'react';

const ContractorOpportunity = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedCards, setExpandedCards] = useState({});

  const toggleCard = (cardId) => {
    setExpandedCards(prev => ({
      ...prev,
      [cardId]: !prev[cardId]
    }));
  };

  const tabs = [
    { id: 'overview', label: 'Executive Overview' },
    { id: 'timeline', label: '30 / 60 / 90' },
    { id: 'organization', label: 'By Organization' },
    { id: 'priorities', label: 'Prioritization' }
  ];

  const timelineData = {
    '30': {
      title: 'Deploy & Own',
      subtitle: 'Weeks 1-4',
      summary: 'Get marketing automation live at TradeBlock, take over product ownership',
      details: [
        'Harden marketing automation code for production reliability',
        'Lead implementation with TradeBlock sneakerhead SME',
        'Establish working workflow: Claude → JSON → multi-channel content',
        'Take over product ownership for documented roadmap items',
        'Begin comprehensive codebase documentation project',
        'Quick wins: reactivate weekly emails, release campaigns, templates'
      ]
    },
    '60': {
      title: 'Optimize & Expand',
      subtitle: 'Weeks 5-8',
      summary: 'Marketing running smoothly, team transitioning to AI workflows, begin engagement features',
      details: [
        'Marketing automation running: 90-day content calendars live',
        'Every relevant sneaker release covered across all channels',
        'Weekly/monthly recurring campaigns automated',
        'TradeBlock team actively using AI development workflows',
        'Codebase documentation enabling AI-assisted development',
        'Begin building social engagement features (reply prioritization)'
      ]
    },
    '90': {
      title: 'Scale & Productize',
      subtitle: 'Weeks 9-12',
      summary: 'Full engagement suite prototyped, battle-tested product ready for 33 Strategies clients',
      details: [
        'Social engagement suite: AI-drafted replies, proactive targeting',
        'Viral detection with real-time alerts (including SMS)',
        'TradeBlock using complete marketing + engagement pipeline',
        '"Top posts to engage with now" feature operational',
        '33 Strategies has proven, demo-ready product',
        'Documented methodology for client implementations'
      ]
    }
  };

  const orgData = {
    tradeblock: {
      title: 'TradeBlock',
      subtitle: 'Immediate Value',
      color: '#3B82F6',
      items: [
        {
          title: 'Marketing Automation Deployment',
          description: 'Deploy and lead implementation of existing marketing tools with SME'
        },
        {
          title: 'Product Ownership',
          description: 'Shepherd documented roadmap, keep team on task'
        },
        {
          title: 'AI Workflow Transition',
          description: 'Facilitate team adoption of AI-driven development'
        },
        {
          title: 'Codebase Documentation',
          description: 'Enable AI tools with comprehensive system context'
        }
      ]
    },
    strategies: {
      title: '33 Strategies',
      subtitle: 'Building the Future',
      color: '#D4A84B',
      items: [
        {
          title: 'Marketing Suite Development',
          description: 'Engineer expanding features using Claude Code'
        },
        {
          title: 'Social Engagement Platform',
          description: 'Reply prioritization, AI drafts, proactive targeting'
        },
        {
          title: 'Viral Detection System',
          description: 'Real-time alerts for high-engagement opportunities'
        },
        {
          title: 'Product Validation',
          description: 'Battle-test everything at TradeBlock first'
        }
      ]
    },
    overlap: {
      title: 'The Overlap',
      subtitle: 'Where Magic Happens',
      color: '#10B981',
      items: [
        {
          title: 'Build Once, Use Twice',
          description: 'Every feature serves TradeBlock AND becomes 33 Strategies product'
        },
        {
          title: 'Prove Then Sell',
          description: 'TradeBlock success = demo-ready case study'
        },
        {
          title: 'PM + Engineer + User',
          description: 'You\'re all three roles, which accelerates everything'
        }
      ]
    }
  };

  const priorityData = [
    {
      level: 1,
      title: 'TradeBlock Foundation',
      timeframe: 'Weeks 1-4',
      rationale: 'TradeBlock pays the bills and proves the concept',
      tasks: [
        'Marketing automation reliability',
        'Get team actually using it successfully',
        'Product roadmap management',
        'Codebase documentation'
      ]
    },
    {
      level: 2,
      title: 'Validate & Systematize',
      timeframe: 'Weeks 4-8',
      rationale: 'Make sure it actually works before we sell it',
      tasks: [
        'TradeBlock marketing running smoothly',
        'Team using AI workflows effectively',
        'Document what works (becomes methodology)',
        'Capture pain points and user feedback'
      ]
    },
    {
      level: 3,
      title: 'Expand for Both',
      timeframe: 'Weeks 8-12',
      rationale: 'Build features that serve TradeBlock AND become products',
      tasks: [
        'Social engagement features development',
        'TradeBlock as first user/tester',
        'Battle-test everything before client-facing'
      ]
    }
  ];

  const decisionTree = [
    { question: 'Does TradeBlock need this to function?', answer: 'TradeBlock wins' },
    { question: 'Will this break TradeBlock if delayed?', answer: 'TradeBlock wins' },
    { question: 'Can we build it once and use it for both?', answer: 'Perfect alignment ✓' },
    { question: 'Is this pure 33 Strategies feature building?', answer: 'Lower priority until TradeBlock stable' }
  ];

  // Font definitions
  const fontDisplay = "'Playfair Display', Georgia, serif";
  const fontBody = "'DM Sans', 'Inter', system-ui, sans-serif";
  
  // Color definitions from design system
  const colors = {
    bgPrimary: '#0a0a0a',
    bgSurface: '#111111',
    bgElevated: '#1a1a1a',
    gold: '#D4A84B',
    goldLight: '#E4C06B',
    green: '#4ADE80',
    textPrimary: '#ffffff',
    textSecondary: '#a3a3a3',
    textMuted: '#737373',
    textDimmed: '#525252',
    border: '#27272a'
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: colors.bgPrimary,
      color: colors.textPrimary,
      fontFamily: fontBody,
      padding: '40px 24px'
    }}>
      {/* Google Fonts */}
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      
      {/* Header */}
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ marginBottom: '48px' }}>
          <p style={{
            color: colors.gold,
            fontSize: '12px',
            fontWeight: '500',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            marginBottom: '16px',
            fontFamily: fontBody
          }}>
            THE OPPORTUNITY
          </p>
          <h1 style={{
            fontSize: '36px',
            fontWeight: '500',
            lineHeight: '1.2',
            marginBottom: '24px',
            fontFamily: fontDisplay
          }}>
            Build the Future of <span style={{ color: colors.gold }}>Both Companies</span>
          </h1>
          
          {/* The Hook - with gold glow effect */}
          <div style={{
            backgroundColor: colors.bgSurface,
            border: `1px solid ${colors.gold}`,
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '32px',
            boxShadow: '0 0 80px rgba(212, 168, 75, 0.15)',
            position: 'relative'
          }}>
            <p style={{
              fontSize: '18px',
              lineHeight: '1.6',
              color: '#e4e4e7',
              marginBottom: '16px',
              fontFamily: fontBody
            }}>
              I want you to take over two things that are directly connected: <strong style={{ color: colors.textPrimary }}>First</strong>, deploy our marketing automation at TradeBlock and own our product roadmap. <strong style={{ color: colors.textPrimary }}>Second</strong>, while you're proving that automation works for us, you'll also be building it into a full social engagement platform that becomes a core 33 Strategies offering.
            </p>
            <p style={{
              fontSize: '16px',
              color: colors.gold,
              fontStyle: 'italic',
              fontFamily: fontDisplay
            }}>
              You're not just implementing existing stuff — you're building the future of both companies simultaneously.
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '32px',
          borderBottom: `1px solid ${colors.border}`,
          paddingBottom: '16px'
        }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '12px 24px',
                backgroundColor: activeTab === tab.id ? colors.gold : 'transparent',
                color: activeTab === tab.id ? colors.bgPrimary : colors.textSecondary,
                border: activeTab === tab.id ? 'none' : `1px solid ${colors.border}`,
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontFamily: fontBody
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Executive Overview */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* The Opportunity */}
            <div style={{
              backgroundColor: colors.bgSurface,
              border: `1px solid ${colors.gold}`,
              borderRadius: '16px',
              padding: '32px',
              boxShadow: '0 0 60px rgba(212, 168, 75, 0.1)'
            }}>
              <p style={{
                color: colors.gold,
                fontSize: '11px',
                fontWeight: '600',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                marginBottom: '12px',
                fontFamily: fontBody
              }}>
                THE OPPORTUNITY
              </p>
              <p style={{
                fontSize: '20px',
                lineHeight: '1.5',
                color: colors.textPrimary,
                marginBottom: '16px',
                fontFamily: fontDisplay
              }}>
                Take over two directly connected roles: <strong>deploy marketing automation at TradeBlock</strong> and <strong>own product leadership</strong> — while simultaneously building those tools into a full social engagement platform for <span style={{ color: colors.gold }}>33 Strategies</span>.
              </p>
              <p style={{
                fontSize: '16px',
                color: colors.green,
                fontWeight: '500',
                fontFamily: fontBody
              }}>
                You're not splitting time. You're building one system that serves both companies.
              </p>
            </div>

            {/* Two Columns: TradeBlock + 33 Strategies */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {/* TradeBlock Column */}
              <div style={{
                backgroundColor: colors.bgSurface,
                border: `1px solid ${colors.border}`,
                borderRadius: '16px',
                padding: '24px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '16px'
                }}>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: '#3B82F6'
                  }} />
                  <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#3B82F6', fontFamily: fontDisplay }}>
                    TradeBlock
                  </h3>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '4px', fontFamily: fontBody }}>
                      Marketing Automation
                    </p>
                    <p style={{ fontSize: '13px', color: colors.textSecondary, fontFamily: fontBody }}>
                      Deploy existing tools, lead implementation with SME, activate dormant campaigns
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '4px', fontFamily: fontBody }}>
                      Product Ownership
                    </p>
                    <p style={{ fontSize: '13px', color: colors.textSecondary, fontFamily: fontBody }}>
                      Shepherd roadmap, keep team on task, enforce AI-driven development
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '4px', fontFamily: fontBody }}>
                      Codebase Documentation
                    </p>
                    <p style={{ fontSize: '13px', color: colors.textSecondary, fontFamily: fontBody }}>
                      Enable AI tools with comprehensive system context
                    </p>
                  </div>
                </div>
              </div>

              {/* 33 Strategies Column */}
              <div style={{
                backgroundColor: colors.bgSurface,
                border: `1px solid ${colors.border}`,
                borderRadius: '16px',
                padding: '24px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '16px'
                }}>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: colors.gold
                  }} />
                  <h3 style={{ fontSize: '18px', fontWeight: '600', color: colors.gold, fontFamily: fontDisplay }}>
                    33 Strategies
                  </h3>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '4px', fontFamily: fontBody }}>
                      Marketing Suite Development
                    </p>
                    <p style={{ fontSize: '13px', color: colors.textSecondary, fontFamily: fontBody }}>
                      Engineer expanding features using Claude Code
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '4px', fontFamily: fontBody }}>
                      Social Engagement Platform
                    </p>
                    <p style={{ fontSize: '13px', color: colors.textSecondary, fontFamily: fontBody }}>
                      Reply prioritization, AI-drafted responses, proactive targeting
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '4px', fontFamily: fontBody }}>
                      Viral Detection System
                    </p>
                    <p style={{ fontSize: '13px', color: colors.textSecondary, fontFamily: fontBody }}>
                      Real-time alerts for high-engagement opportunities
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline Summary */}
            <div style={{
              backgroundColor: colors.bgSurface,
              border: `1px solid ${colors.border}`,
              borderRadius: '16px',
              padding: '24px'
            }}>
              <p style={{
                color: colors.textMuted,
                fontSize: '11px',
                fontWeight: '600',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                marginBottom: '20px',
                fontFamily: fontBody
              }}>
                THE ROADMAP
              </p>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <div style={{
                  backgroundColor: colors.bgPrimary,
                  borderRadius: '12px',
                  padding: '20px',
                  borderLeft: `3px solid ${colors.gold}`
                }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '28px', fontWeight: '600', color: colors.gold, fontFamily: fontDisplay }}>30</span>
                    <span style={{ fontSize: '12px', color: colors.textMuted, fontFamily: fontBody }}>DAYS</span>
                  </div>
                  <p style={{ fontSize: '15px', fontWeight: '600', color: colors.textPrimary, marginBottom: '4px', fontFamily: fontDisplay }}>
                    Deploy & Own
                  </p>
                  <p style={{ fontSize: '13px', color: colors.textSecondary, fontFamily: fontBody }}>
                    Marketing automation live, product ownership established, documentation started
                  </p>
                </div>

                <div style={{
                  backgroundColor: colors.bgPrimary,
                  borderRadius: '12px',
                  padding: '20px',
                  borderLeft: '3px solid #3B82F6'
                }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '28px', fontWeight: '600', color: '#3B82F6', fontFamily: fontDisplay }}>60</span>
                    <span style={{ fontSize: '12px', color: colors.textMuted, fontFamily: fontBody }}>DAYS</span>
                  </div>
                  <p style={{ fontSize: '15px', fontWeight: '600', color: colors.textPrimary, marginBottom: '4px', fontFamily: fontDisplay }}>
                    Optimize & Expand
                  </p>
                  <p style={{ fontSize: '13px', color: colors.textSecondary, fontFamily: fontBody }}>
                    Campaigns automated, team on AI workflows, engagement features building
                  </p>
                </div>

                <div style={{
                  backgroundColor: colors.bgPrimary,
                  borderRadius: '12px',
                  padding: '20px',
                  borderLeft: `3px solid ${colors.green}`
                }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '28px', fontWeight: '600', color: colors.green, fontFamily: fontDisplay }}>90</span>
                    <span style={{ fontSize: '12px', color: colors.textMuted, fontFamily: fontBody }}>DAYS</span>
                  </div>
                  <p style={{ fontSize: '15px', fontWeight: '600', color: colors.textPrimary, marginBottom: '4px', fontFamily: fontDisplay }}>
                    Scale & Productize
                  </p>
                  <p style={{ fontSize: '13px', color: colors.textSecondary, fontFamily: fontBody }}>
                    Full engagement suite, battle-tested product ready for clients
                  </p>
                </div>
              </div>
            </div>

            {/* Your Unique Position */}
            <div style={{
              backgroundColor: colors.bgSurface,
              border: `1px solid ${colors.border}`,
              borderRadius: '16px',
              padding: '24px'
            }}>
              <p style={{
                color: colors.textMuted,
                fontSize: '11px',
                fontWeight: '600',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                marginBottom: '16px',
                fontFamily: fontBody
              }}>
                WHY THIS WORKS
              </p>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <div style={{ textAlign: 'center', padding: '16px' }}>
                  <div style={{
                    fontSize: '32px',
                    marginBottom: '12px'
                  }}>🔧</div>
                  <p style={{ fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '4px', fontFamily: fontBody }}>
                    You Know the Systems
                  </p>
                  <p style={{ fontSize: '13px', color: colors.textSecondary, fontFamily: fontBody }}>
                    Former TradeBlock product owner — no ramp-up time
                  </p>
                </div>
                
                <div style={{ textAlign: 'center', padding: '16px' }}>
                  <div style={{
                    fontSize: '32px',
                    marginBottom: '12px'
                  }}>⚡</div>
                  <p style={{ fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '4px', fontFamily: fontBody }}>
                    Technical + Product
                  </p>
                  <p style={{ fontSize: '13px', color: colors.textSecondary, fontFamily: fontBody }}>
                    Engineer background means you can build AND lead
                  </p>
                </div>
                
                <div style={{ textAlign: 'center', padding: '16px' }}>
                  <div style={{
                    fontSize: '32px',
                    marginBottom: '12px'
                  }}>🎯</div>
                  <p style={{ fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '4px', fontFamily: fontBody }}>
                    PM + Engineer + User
                  </p>
                  <p style={{ fontSize: '13px', color: colors.textSecondary, fontFamily: fontBody }}>
                    All three roles accelerates everything
                  </p>
                </div>
              </div>
            </div>

            {/* Priority Principle */}
            <div style={{
              backgroundColor: colors.bgElevated,
              border: `1px solid ${colors.gold}`,
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 0 60px rgba(212, 168, 75, 0.08)'
            }}>
              <p style={{
                color: colors.gold,
                fontSize: '11px',
                fontWeight: '600',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                marginBottom: '12px',
                fontFamily: fontBody
              }}>
                THE PRIORITY PRINCIPLE
              </p>
              <p style={{
                fontSize: '16px',
                color: '#e4e4e7',
                lineHeight: '1.6',
                marginBottom: '12px',
                fontFamily: fontBody
              }}>
                <strong style={{ color: '#3B82F6' }}>TradeBlock pays the bills and proves the concept.</strong> Get that running first. But everything you build there becomes a <strong style={{ color: colors.gold }}>33 Strategies product</strong> — so you're never choosing between them, you're sequencing them.
              </p>
              <p style={{
                fontSize: '14px',
                color: colors.green,
                fontFamily: fontBody
              }}>
                When TradeBlock wins, 33 Strategies gets a proven product. When 33 Strategies builds features, TradeBlock gets first access.
              </p>
            </div>
          </div>
        )}

        {/* Timeline View */}
        {activeTab === 'timeline' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {Object.entries(timelineData).map(([period, data]) => (
              <div
                key={period}
                onClick={() => toggleCard(`timeline-${period}`)}
                style={{
                  backgroundColor: colors.bgSurface,
                  border: expandedCards[`timeline-${period}`] ? `1px solid ${colors.gold}` : `1px solid ${colors.border}`,
                  borderRadius: '16px',
                  padding: '24px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: expandedCards[`timeline-${period}`] ? '0 0 40px rgba(212, 168, 75, 0.1)' : 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
                      <span style={{
                        fontSize: '32px',
                        fontWeight: '600',
                        color: colors.gold,
                        fontFamily: fontDisplay
                      }}>
                        {period}
                      </span>
                      <span style={{
                        fontSize: '12px',
                        color: colors.textMuted,
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        fontFamily: fontBody
                      }}>
                        days
                      </span>
                    </div>
                    <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '4px', fontFamily: fontDisplay }}>
                      {data.title}
                    </h3>
                    <p style={{ fontSize: '14px', color: colors.textMuted, marginBottom: '8px', fontFamily: fontBody }}>
                      {data.subtitle}
                    </p>
                    <p style={{ fontSize: '15px', color: colors.textSecondary, fontFamily: fontBody }}>
                      {data.summary}
                    </p>
                  </div>
                  <span style={{
                    color: colors.gold,
                    fontSize: '20px',
                    transform: expandedCards[`timeline-${period}`] ? 'rotate(180deg)' : 'rotate(0)',
                    transition: 'transform 0.2s ease'
                  }}>
                    ▼
                  </span>
                </div>
                
                {expandedCards[`timeline-${period}`] && (
                  <div style={{
                    marginTop: '20px',
                    paddingTop: '20px',
                    borderTop: `1px solid ${colors.border}`
                  }}>
                    <ul style={{ margin: 0, paddingLeft: '20px' }}>
                      {data.details.map((detail, idx) => (
                        <li key={idx} style={{
                          color: '#d4d4d8',
                          fontSize: '14px',
                          lineHeight: '1.8',
                          marginBottom: '8px',
                          fontFamily: fontBody
                        }}>
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Organization View */}
        {activeTab === 'organization' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Two column layout for TradeBlock and 33 Strategies */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {['tradeblock', 'strategies'].map(orgKey => {
                const org = orgData[orgKey];
                const orgColor = orgKey === 'tradeblock' ? '#3B82F6' : colors.gold;
                return (
                  <div
                    key={orgKey}
                    onClick={() => toggleCard(`org-${orgKey}`)}
                    style={{
                      backgroundColor: colors.bgSurface,
                      border: `1px solid ${expandedCards[`org-${orgKey}`] ? orgColor : colors.border}`,
                      borderRadius: '16px',
                      padding: '24px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: expandedCards[`org-${orgKey}`] ? `0 0 40px ${orgColor}20` : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h3 style={{ fontSize: '20px', fontWeight: '600', color: orgColor, marginBottom: '4px', fontFamily: fontDisplay }}>
                          {org.title}
                        </h3>
                        <p style={{ fontSize: '14px', color: colors.textMuted, fontFamily: fontBody }}>
                          {org.subtitle}
                        </p>
                      </div>
                      <span style={{
                        color: orgColor,
                        fontSize: '16px',
                        transform: expandedCards[`org-${orgKey}`] ? 'rotate(180deg)' : 'rotate(0)',
                        transition: 'transform 0.2s ease'
                      }}>
                        ▼
                      </span>
                    </div>
                    
                    {expandedCards[`org-${orgKey}`] && (
                      <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {org.items.map((item, idx) => (
                          <div key={idx} style={{
                            backgroundColor: colors.bgPrimary,
                            borderRadius: '8px',
                            padding: '12px'
                          }}>
                            <p style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px', fontFamily: fontBody }}>
                              {item.title}
                            </p>
                            <p style={{ fontSize: '13px', color: colors.textSecondary, fontFamily: fontBody }}>
                              {item.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* Overlap section - full width */}
            <div
              onClick={() => toggleCard('org-overlap')}
              style={{
                backgroundColor: colors.bgSurface,
                border: `1px solid ${expandedCards['org-overlap'] ? colors.green : colors.border}`,
                borderRadius: '16px',
                padding: '24px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: expandedCards['org-overlap'] ? '0 0 60px rgba(74, 222, 128, 0.15)' : 'none'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontSize: '20px', fontWeight: '600', color: colors.green, marginBottom: '4px', fontFamily: fontDisplay }}>
                    {orgData.overlap.title}
                  </h3>
                  <p style={{ fontSize: '14px', color: colors.textMuted, fontFamily: fontBody }}>
                    {orgData.overlap.subtitle}
                  </p>
                </div>
                <span style={{
                  color: colors.green,
                  fontSize: '16px',
                  transform: expandedCards['org-overlap'] ? 'rotate(180deg)' : 'rotate(0)',
                  transition: 'transform 0.2s ease'
                }}>
                  ▼
                </span>
              </div>
              
              {expandedCards['org-overlap'] && (
                <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  {orgData.overlap.items.map((item, idx) => (
                    <div key={idx} style={{
                      backgroundColor: colors.bgPrimary,
                      borderRadius: '8px',
                      padding: '16px',
                      textAlign: 'center'
                    }}>
                      <p style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: colors.green, fontFamily: fontBody }}>
                        {item.title}
                      </p>
                      <p style={{ fontSize: '13px', color: colors.textSecondary, fontFamily: fontBody }}>
                        {item.description}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Priorities View */}
        {activeTab === 'priorities' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Priority Levels */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {priorityData.map((priority) => {
                const priorityColor = priority.level === 1 ? colors.gold : priority.level === 2 ? '#3B82F6' : colors.green;
                return (
                  <div
                    key={priority.level}
                    onClick={() => toggleCard(`priority-${priority.level}`)}
                    style={{
                      backgroundColor: colors.bgSurface,
                      border: expandedCards[`priority-${priority.level}`] ? `1px solid ${colors.gold}` : `1px solid ${colors.border}`,
                      borderRadius: '16px',
                      padding: '24px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: expandedCards[`priority-${priority.level}`] ? '0 0 40px rgba(212, 168, 75, 0.1)' : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          backgroundColor: priorityColor,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '18px',
                          fontWeight: '700',
                          color: colors.bgPrimary,
                          flexShrink: 0,
                          fontFamily: fontBody
                        }}>
                          {priority.level}
                        </div>
                        <div>
                          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '4px', fontFamily: fontDisplay }}>
                            {priority.title}
                          </h3>
                          <p style={{ fontSize: '13px', color: colors.textMuted, marginBottom: '4px', fontFamily: fontBody }}>
                            {priority.timeframe}
                          </p>
                          <p style={{ fontSize: '14px', color: colors.gold, fontStyle: 'italic', fontFamily: fontDisplay }}>
                            "{priority.rationale}"
                          </p>
                        </div>
                      </div>
                      <span style={{
                        color: colors.gold,
                        fontSize: '16px',
                        transform: expandedCards[`priority-${priority.level}`] ? 'rotate(180deg)' : 'rotate(0)',
                        transition: 'transform 0.2s ease'
                      }}>
                        ▼
                      </span>
                    </div>
                    
                    {expandedCards[`priority-${priority.level}`] && (
                      <div style={{
                        marginTop: '20px',
                        marginLeft: '56px',
                        paddingTop: '16px',
                        borderTop: `1px solid ${colors.border}`
                      }}>
                        <ul style={{ margin: 0, paddingLeft: '20px' }}>
                          {priority.tasks.map((task, idx) => (
                            <li key={idx} style={{
                              color: '#d4d4d8',
                              fontSize: '14px',
                              lineHeight: '1.8',
                              fontFamily: fontBody
                            }}>
                              {task}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* Decision Tree */}
            <div style={{
              backgroundColor: colors.bgSurface,
              border: `1px solid ${colors.border}`,
              borderRadius: '16px',
              padding: '24px'
            }}>
              <h3 style={{
                fontSize: '11px',
                fontWeight: '600',
                color: colors.gold,
                marginBottom: '16px',
                textTransform: 'uppercase',
                letterSpacing: '0.2em',
                fontFamily: fontBody
              }}>
                When Conflicts Arise
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {decisionTree.map((item, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '12px',
                    backgroundColor: colors.bgPrimary,
                    borderRadius: '8px'
                  }}>
                    <span style={{ fontSize: '14px', color: colors.textSecondary, flex: 1, fontFamily: fontBody }}>
                      {item.question}
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: colors.textPrimary, fontFamily: fontBody }}>
                      → {item.answer}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Key Insight */}
            <div style={{
              backgroundColor: colors.bgElevated,
              border: `1px solid ${colors.gold}`,
              borderRadius: '16px',
              padding: '24px',
              textAlign: 'center',
              boxShadow: '0 0 60px rgba(212, 168, 75, 0.08)'
            }}>
              <p style={{ fontSize: '16px', color: '#e4e4e7', lineHeight: '1.6', fontFamily: fontBody }}>
                You're not splitting time 50/50. You're building <strong style={{ color: colors.gold }}>one integrated system</strong> where TradeBlock success directly enables 33 Strategies success.
              </p>
              <p style={{ fontSize: '14px', color: colors.textSecondary, marginTop: '12px', fontFamily: fontBody }}>
                When TradeBlock wins, 33 Strategies gets a proven product.<br />
                When 33 Strategies builds features, TradeBlock gets first access.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContractorOpportunity;
