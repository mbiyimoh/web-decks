// data.ts — Mock data for Mission Control Dashboard
// Replace these with Supabase queries in production

import type { 
  IntentClient, 
  FunnelClient, 
  ClosedDeal, 
  TeamMember,
  Stage 
} from './types';

// ============ STAGES ============

export const stages: Stage[] = [
  { id: 'lead', name: 'Lead', short: 'LD' },
  { id: 'discovery', name: 'Discovery', short: 'DS' },
  { id: 'assessment', name: 'Assessment', short: 'AS' },
  { id: 'proposal', name: 'Proposal', short: 'PR' },
  { id: 'negotiation', name: 'Negotiation', short: 'NG' },
  { id: 'contract', name: 'Contract', short: 'CT' },
  { id: 'payment', name: 'Payment', short: 'PY' },
  { id: 'kickoff', name: 'Kickoff', short: 'KO' }
];

// ============ INTENT CLIENTS (Active Pipeline) ============

export const intentClients: IntentClient[] = [
  {
    id: 'tradeblock',
    name: 'TradeBlock',
    industry: 'Sneaker Tech',
    color: '#22c55e',
    value: 50000,
    currentStage: 'kickoff',
    stageIndex: 7,
    scores: { strategic: 9, value: 8, readiness: 9, timeline: 8, bandwidth: 7 },
    nextAction: 'Monthly check-in scheduled',
    nextActionDate: '2025-01-05',
    daysInStage: 25,
    contact: { name: 'Mbiyimoh Ghogomu', role: 'CEO' },
    proposalLink: 'https://proposals.33strategies.com/tradeblock',
    status: 'active',
    journey: {
      lead: { 
        complete: true, 
        date: '2024-05-15', 
        notes: 'Referral from sneaker community via Instagram DM',
        documents: ['Initial outreach email.pdf']
      },
      discovery: { 
        complete: true, 
        date: '2024-05-20', 
        notes: 'Initial call with Beems - discussed AI roadmap needs, current pain points with manual content creation',
        duration: '45 min',
        documents: ['Discovery call notes.md', 'Tradeblock_current_stack.pdf']
      },
      assessment: { 
        complete: true, 
        date: '2024-05-25', 
        notes: 'Full needs assessment completed - AI roadmap focus, marketing automation priority',
        documents: ['Needs assessment.pdf', 'Technical requirements.docx']
      },
      proposal: { 
        complete: true, 
        date: '2024-06-01', 
        notes: 'Retainer proposal sent - $50K/year with equity component option',
        link: 'https://proposals.33strategies.com/tradeblock',
        password: 'TB2024',
        documents: ['TradeBlock_Proposal_v2.pdf']
      },
      negotiation: { 
        complete: true, 
        date: '2024-06-05', 
        notes: 'Agreed on scope and 1.5% equity component, monthly retainer structure',
        documents: ['Term sheet draft.pdf', 'Equity discussion notes.md']
      },
      contract: { 
        complete: true, 
        date: '2024-06-08',
        signedDate: '2024-06-10',
        notes: 'MSA + SOW signed by both parties',
        documents: ['MSA_TradeBlock_signed.pdf', 'SOW_Phase1_signed.pdf']
      },
      payment: { 
        complete: true, 
        date: '2024-06-10', 
        method: 'Wire transfer',
        notes: 'First monthly retainer received, recurring billing set up',
        documents: ['Invoice_001.pdf', 'Payment confirmation.pdf']
      },
      kickoff: { 
        complete: true, 
        date: '2024-06-15', 
        notes: 'Project launched successfully - onboarding complete, SP33D access granted',
        documents: ['Kickoff deck.pdf', 'Onboarding checklist.md', 'Access credentials.txt']
      }
    }
  },
  {
    id: 'plya',
    name: 'PLYA',
    industry: 'Consumer App',
    color: '#f97316',
    value: 45000,
    currentStage: 'proposal',
    stageIndex: 3,
    scores: { strategic: 4, value: 9, readiness: 5, timeline: 5, bandwidth: 4 },
    nextAction: 'Follow up on proposal review',
    nextActionDate: '2025-01-08',
    daysInStage: 12,
    contact: { name: 'Alex Rivera', role: 'Founder' },
    proposalLink: 'https://proposals.33strategies.com/plya',
    status: 'active',
    journey: {
      lead: { 
        complete: true, 
        date: '2024-10-20', 
        notes: 'Inbound via website - consumer fitness app seeking AI transformation',
        documents: ['Initial inquiry.pdf']
      },
      discovery: { 
        complete: true, 
        date: '2024-11-03', 
        notes: 'Call with Alex Rivera - discussed athlete recruitment, content strategy needs',
        duration: '60 min',
        documents: ['PLYA_discovery_call.md', 'Product_overview.pdf']
      },
      assessment: { 
        complete: true, 
        date: '2024-11-12', 
        notes: 'Product deep-dive completed - identified 3 key AI integration opportunities',
        documents: ['Technical_assessment.pdf', 'Integration_opportunities.md', 'Competitive_analysis.pdf']
      },
      proposal: { 
        complete: false, 
        date: '2024-11-25', 
        notes: 'Custom build proposal sent - $45K with optional equity component (3.3% for 33% cash reduction)',
        link: 'https://proposals.33strategies.com/plya',
        password: 'PLYA33',
        documents: ['PLYA_Proposal_v1.pdf', 'Equity_option_terms.pdf']
      },
      negotiation: { complete: false },
      contract: { complete: false },
      payment: { complete: false },
      kickoff: { complete: false }
    }
  }
];

// ============ FUNNEL CLIENTS (Top of Funnel) ============

export const funnelClients: FunnelClient[] = [
  {
    id: 'scott',
    name: 'Scott Arnett',
    industry: 'Unknown',
    color: '#D4A84B',
    potentialValue: 25000,
    scores: { strategic: 5, value: 5, readiness: 5, timeline: 5, bandwidth: 5 },
    discoveryComplete: false,
    assessmentComplete: false,
    readinessPercent: 15,
    decision: 'pending',
    contact: { name: 'Scott Arnett', role: 'Unknown' },
    notes: 'New prospect - portal created, awaiting initial discovery',
    portalLink: 'https://33strategies.ai/client-portals/scott-arnett/mission-control',
    isNew: true,
    intakeMethod: 'portal',
    intakeDate: '2025-01-28',
    confidence: {
      overall: 'low',
      companyInfo: { score: 20, status: 'needs-research', notes: 'No company info available yet' },
      contactInfo: { score: 40, status: 'partial', notes: 'Name only, need role and contact details' },
      problemFit: { score: 10, status: 'unknown', notes: 'Discovery call needed' },
      budget: { score: 10, status: 'unknown', notes: 'No budget discussion yet' },
      timeline: { score: 10, status: 'unknown', notes: 'No timeline established' }
    },
    aiEnrichment: {
      status: 'pending',
      lastRun: null,
      suggestedActions: ['Schedule discovery call', 'Research LinkedIn profile', 'Identify company affiliation']
    }
  },
  {
    id: 'slam',
    name: 'SLAM Magazine',
    industry: 'Media',
    color: '#ef4444',
    potentialValue: 75000,
    scores: { strategic: 8, value: 7, readiness: 3, timeline: 4, bandwidth: 5 },
    discoveryComplete: false,
    assessmentComplete: false,
    readinessPercent: 25,
    decision: 'pending',
    contact: { name: 'Marcus Johnson', role: 'VP Digital' },
    notes: 'Iconic brand, early in discovery',
    confidence: {
      overall: 'medium',
      companyInfo: { score: 95, status: 'verified', notes: 'Well-known media brand, founded 1994' },
      contactInfo: { score: 70, status: 'partial', notes: 'Have VP contact, need decision-maker confirmation' },
      problemFit: { score: 40, status: 'needs-discovery', notes: 'Initial interest shown, needs deep-dive' },
      budget: { score: 30, status: 'estimated', notes: 'Estimated based on company size' },
      timeline: { score: 25, status: 'unknown', notes: 'No concrete timeline discussed' }
    },
    aiEnrichment: {
      status: 'complete',
      lastRun: '2024-12-10',
      findings: {
        companySize: '25-50 employees',
        revenue: 'Est. $5-10M annually',
        techStack: 'WordPress, social media heavy',
        competitors: 'ESPN, Bleacher Report, The Ringer',
        opportunities: ['Content automation', 'Social scheduling', 'Archive monetization']
      }
    }
  },
  {
    id: 'copyt',
    name: 'CoPyt',
    industry: 'Sneaker SaaS',
    color: '#3b82f6',
    potentialValue: 75000,
    scores: { strategic: 7, value: 6, readiness: 5, timeline: 6, bandwidth: 7 },
    discoveryComplete: true,
    assessmentComplete: true,
    readinessPercent: 72,
    decision: 'pending',
    contact: { name: 'Jordan Williams', role: 'CEO' },
    notes: 'Partnership model, revenue share. Techstars alum.',
    confidence: {
      overall: 'high',
      companyInfo: { score: 90, status: 'verified', notes: 'Techstars company, verified funding' },
      contactInfo: { score: 95, status: 'verified', notes: 'Direct founder contact established' },
      problemFit: { score: 85, status: 'validated', notes: 'Strong SP33D fit confirmed' },
      budget: { score: 70, status: 'discussed', notes: 'Partnership model preferred over cash' },
      timeline: { score: 60, status: 'flexible', notes: 'Q1-Q2 2025 target' }
    },
    aiEnrichment: {
      status: 'complete',
      lastRun: '2024-12-01',
      findings: {
        companySize: '5-10 employees',
        funding: '$405K Techstars Seed',
        techStack: 'React, Node.js, AWS',
        competitors: 'StockX tools, sole collector apps',
        opportunities: ['White-label SP33D', 'API integration', 'Revenue share model']
      }
    }
  },
  {
    id: 'premiumgoods',
    name: 'Premium Goods',
    industry: 'Retail',
    color: '#a855f7',
    potentialValue: 24000,
    scores: { strategic: 5, value: 6, readiness: 6, timeline: 7, bandwidth: 8 },
    discoveryComplete: false,
    assessmentComplete: false,
    readinessPercent: 8,
    decision: 'pending',
    contact: { name: 'Jennifer Ford', role: 'Owner' },
    notes: 'Warm referral, just started intake',
    confidence: {
      overall: 'low',
      companyInfo: { score: 60, status: 'partial', notes: 'Sneaker retail, need more details' },
      contactInfo: { score: 80, status: 'verified', notes: 'Referral contact confirmed' },
      problemFit: { score: 20, status: 'unknown', notes: 'Initial call needed' },
      budget: { score: 15, status: 'unknown', notes: 'Not discussed' },
      timeline: { score: 15, status: 'unknown', notes: 'Not discussed' }
    },
    aiEnrichment: {
      status: 'pending',
      lastRun: null,
      suggestedActions: ['Research store locations', 'Check social media presence', 'Schedule discovery call']
    }
  },
  {
    id: 'respira',
    name: 'Respira Global',
    industry: 'Wellness',
    color: '#14b8a6',
    potentialValue: 18000,
    scores: { strategic: 5, value: 5, readiness: 2, timeline: 2, bandwidth: 5 },
    discoveryComplete: true,
    assessmentComplete: true,
    readinessPercent: 45,
    decision: 'no',
    decisionReason: 'On hold - no marketing hire to execute',
    contact: { name: 'Sarah Kim', role: 'Founder' },
    notes: 'Good fit but blocked on execution capability',
    confidence: {
      overall: 'high',
      companyInfo: { score: 85, status: 'verified', notes: 'Wellness brand, verified' },
      contactInfo: { score: 90, status: 'verified', notes: 'Direct founder relationship' },
      problemFit: { score: 80, status: 'validated', notes: 'SP33D would solve their needs' },
      budget: { score: 75, status: 'discussed', notes: '$15-20K range confirmed' },
      timeline: { score: 20, status: 'blocked', notes: 'Waiting on marketing hire' }
    },
    aiEnrichment: {
      status: 'complete',
      lastRun: '2024-10-15',
      findings: {
        companySize: '5-10 employees',
        focus: 'Breathwork and wellness coaching',
        techStack: 'Squarespace, basic tools',
        blocker: 'No internal marketing resource',
        opportunities: ['SP33D for content', 'Reactivate after hire']
      }
    }
  },
  {
    id: 'cynthiarichard',
    name: 'Cynthia Richard',
    industry: 'Luxury Footwear',
    color: '#ec4899',
    potentialValue: 24000,
    scores: { strategic: 6, value: 6, readiness: 5, timeline: 6, bandwidth: 7 },
    discoveryComplete: false,
    assessmentComplete: false,
    readinessPercent: 20,
    decision: 'pending',
    contact: { name: 'Cynthia Richard', role: 'Founder' },
    notes: 'Luxury shoe brand - SP33D marketing automation fit. Family-run, daughters styled celebrities.',
    website: 'https://www.cynthiarichard.com/',
    productFocus: 'SP33D',
    isNew: true,
    intakeMethod: 'manual',
    intakeDate: '2025-01-28',
    confidence: {
      overall: 'medium',
      companyInfo: { score: 85, status: 'verified', notes: 'Website live, products verified, made in Italy & Brazil' },
      contactInfo: { score: 60, status: 'partial', notes: 'Have brand name, need direct contact info' },
      problemFit: { score: 70, status: 'estimated', notes: 'Strong social presence, review-driven - SP33D ideal' },
      budget: { score: 30, status: 'unknown', notes: 'Luxury price point suggests budget availability' },
      timeline: { score: 25, status: 'unknown', notes: 'Not discussed' }
    },
    aiEnrichment: {
      status: 'complete',
      lastRun: '2025-01-28',
      findings: {
        companyType: 'DTC Luxury Footwear Brand',
        products: 'Hidden wedge sneakers, luxury trainers, boots',
        manufacturing: 'Italy and Brazil',
        positioning: 'Empowering confidence through elegant footwear',
        familyBusiness: 'Rick and Cindy founders, daughters have celebrity styling experience',
        platform: 'Shopify-based ecommerce',
        strengths: 'Strong customer reviews, high repeat purchase rate',
        opportunities: ['Social media automation', 'Review request campaigns', 'Content calendar management']
      },
      suggestedActions: ['Schedule discovery call', 'Research Instagram following', 'Prepare SP33D demo for fashion/retail']
    }
  },
  {
    id: 'seicon',
    name: 'SEI-Con',
    industry: 'Sports Events',
    color: '#8b5cf6',
    potentialValue: 35000,
    scores: { strategic: 8, value: 7, readiness: 6, timeline: 7, bandwidth: 6 },
    discoveryComplete: false,
    assessmentComplete: false,
    readinessPercent: 25,
    decision: 'pending',
    contact: { name: 'Shawn Garrity', role: 'Executive' },
    notes: 'Sports Entertainment Innovation Conference - M33T networking perfect fit. Multiple events per year.',
    website: 'https://sei-con.org/',
    productFocus: 'M33T',
    isNew: true,
    intakeMethod: 'manual',
    intakeDate: '2025-01-28',
    confidence: {
      overall: 'high',
      companyInfo: { score: 95, status: 'verified', notes: 'Well-documented conference, USA Today Sports sponsor' },
      contactInfo: { score: 50, status: 'partial', notes: 'Public leadership known, need direct contact' },
      problemFit: { score: 90, status: 'strong', notes: 'Event networking is their core value prop - M33T perfect' },
      budget: { score: 50, status: 'estimated', notes: 'Major sponsors suggest budget for premium solutions' },
      timeline: { score: 70, status: 'known', notes: 'SEICon III July 2026, multiple events throughout year' }
    },
    aiEnrichment: {
      status: 'complete',
      lastRun: '2025-01-28',
      findings: {
        companyType: 'Conference/Events Organization',
        focus: 'Sports, Entertainment & Innovation thought leadership',
        partnerships: ['UNLV Sports Innovation Institute', 'Syracuse University Falk College', 'USA Today Sports', 'National Rugby League'],
        upcomingEvents: [
          'Business of Sport Conference - Feb 27, 2026 (Resorts World Las Vegas)',
          'Premium Experience Global Conference - Mar 16-18, 2026 (Manchester)',
          'GENEXSIS 2026 - Spring 2026 (Georgia)',
          'SEICon III - July 7-9, 2026 (Bellagio Las Vegas)'
        ],
        attendeeProfile: 'Industry executives, academics, investors, tech innovators',
        innovationHub: 'Startup showcase, 1:1 meetings, deal-making focus',
        keyValue: 'Breaking down silos between public/private sectors, academia, nonprofits'
      },
      suggestedActions: ['Position M33T for Innovation Hub networking', 'Propose multi-event partnership', 'Schedule discovery call before Feb 2026 event']
    }
  }
];

// ============ CLOSED DEALS ============

export const closedDeals: ClosedDeal[] = [
  {
    id: 'wsbc',
    name: 'WSBC',
    industry: 'Sports Events',
    color: '#3b82f6',
    value: 15000,
    stageReached: 'proposal',
    stageIndex: 3,
    closedDate: '2025-01-28',
    reason: 'Budget constraints - building in-house instead',
    reasonDetail: 'Have in-house developer who will attempt to build VIP bios and event features. Acknowledged value but cannot afford external resource investment at this time. Door left open for future collaboration.',
    contact: { name: 'Devin Mado', role: 'Conference Director' },
    journey: {
      lead: { 
        complete: true, 
        date: '2024-10-20', 
        notes: 'Inbound via website contact form - interested in event networking solutions',
        documents: ['Website inquiry.pdf']
      },
      discovery: { 
        complete: true, 
        date: '2024-10-22', 
        notes: 'Call with David Park - executive summit Feb 15, needs intelligent matchmaking',
        duration: '60 min',
        documents: ['WSBC_discovery_notes.md', 'Event_brief.pdf']
      },
      assessment: { 
        complete: true, 
        date: '2024-11-05', 
        notes: 'M33T configuration review, attendee list analysis (150 expected)',
        documents: ['Attendee_list.xlsx', 'M33T_config_spec.pdf']
      },
      proposal: { 
        complete: true, 
        date: '2024-12-15', 
        notes: 'Proposal sent - M33T event package at two tiers: $8K full platform, $3K landing page only',
        link: 'https://proposals.33strategies.com/wsbc',
        password: 'WSBC25',
        documents: ['WSBC_Proposal_M33T.pdf', 'WSBC_Two_Tier_Options.pdf']
      },
      negotiation: { 
        complete: true, 
        date: '2025-01-28',
        notes: 'Devin called - declining both options. Budget constraints, have in-house dev. Want to keep conversation going for future.',
        documents: ['WSBC_Decline_Voicemail_Transcript.md']
      },
      contract: { complete: false },
      payment: { complete: false },
      kickoff: { complete: false }
    },
    lessonsLearned: 'Price sensitivity higher than expected for non-tech orgs. Consider lighter-touch intro offerings or pilot programs for budget-conscious prospects.',
    reengageDate: '2025-06-01',
    reengageNotes: 'Check back after their Feb event to see how in-house solution worked'
  }
];

// ============ TEAM ============

export const team: TeamMember[] = [
  { 
    id: 'emily', 
    name: 'Emily', 
    role: 'Strategy', 
    color: '#f97316',
    utilization: 55,
    allocated: [
      { client: 'TradeBlock', percent: 10 },
      { client: 'PLYA', percent: 20 },
      { client: 'New Prospects', percent: 10 },
      { client: '33S Internal', percent: 15 }
    ]
  },
  { 
    id: 'beems', 
    name: 'Beems', 
    role: 'Engineering', 
    color: '#3b82f6',
    utilization: 75,
    allocated: [
      { client: 'TradeBlock', percent: 35 },
      { client: 'M33T Dev', percent: 20 },
      { client: 'Products', percent: 20 }
    ]
  },
  { 
    id: 'pm', 
    name: 'PM', 
    role: 'Operations', 
    color: '#a855f7',
    utilization: 55,
    allocated: [
      { client: 'TradeBlock', percent: 15 },
      { client: 'PLYA', percent: 20 },
      { client: 'Coordination', percent: 20 }
    ]
  },
  { 
    id: 'marketing', 
    name: 'Marketing', 
    role: 'Content', 
    color: '#22c55e',
    utilization: 70,
    allocated: [
      { client: 'SP33D Content', percent: 40 },
      { client: 'Client Onboarding', percent: 15 },
      { client: '33S Marketing', percent: 15 }
    ]
  }
];

// ============ COMPUTED VALUES ============

export function getPipelineStats() {
  const intentTotal = intentClients.reduce((sum, c) => sum + c.value, 0);
  const funnelTotal = funnelClients.reduce((sum, c) => sum + c.potentialValue, 0);
  
  return {
    intentCount: intentClients.length,
    intentValue: intentTotal,
    funnelCount: funnelClients.length,
    funnelValue: funnelTotal,
    totalPipeline: intentTotal + funnelTotal,
    closedCount: closedDeals.length,
    closedValue: closedDeals.reduce((sum, d) => sum + d.value, 0)
  };
}
