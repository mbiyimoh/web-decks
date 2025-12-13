import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Calendar, Zap, Gift, Brain, DollarSign, Check, Clock, Target } from 'lucide-react';

// Collapsible section component with progressive disclosure
const UpdateSection = ({ icon: Icon, title, status, statusColor, summary, children, defaultOpen = false, showDemo = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  const statusColors = {
    green: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    yellow: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    blue: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
    purple: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
  };
  
  return (
    <div className="border border-zinc-800/60 rounded-2xl overflow-hidden bg-gradient-to-br from-zinc-900/80 to-zinc-950/80 backdrop-blur-sm">
      {/* Always visible header */}
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1">
            <div className="w-10 h-10 rounded-xl bg-zinc-800/80 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Icon className="w-5 h-5 text-zinc-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap mb-2">
                <h3 className="text-lg font-semibold text-white">{title}</h3>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${statusColors[statusColor]}`}>
                  {status}
                </span>
                {showDemo && (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gradient-to-r from-pink-500/20 to-orange-500/20 text-orange-300 border border-orange-500/30 animate-pulse">
                    ✨ show & tell!
                  </span>
                )}
              </div>
              <p className="text-zinc-400 text-sm leading-relaxed">{summary}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* View more toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-3 flex items-center justify-center gap-2 text-xs font-medium text-zinc-500 hover:text-zinc-300 transition-colors border-t border-zinc-800/40 hover:bg-zinc-800/30"
      >
        {isOpen ? (
          <>
            <span>View less</span>
            <ChevronUp className="w-4 h-4" />
          </>
        ) : (
          <>
            <span>View more details</span>
            <ChevronDown className="w-4 h-4" />
          </>
        )}
      </button>
      
      {/* Expandable content */}
      <div className={`overflow-hidden transition-all duration-300 ease-out ${isOpen ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-6 pb-6 pt-2 border-t border-zinc-800/40">
          {children}
        </div>
      </div>
    </div>
  );
};

// Bullet point component
const Bullet = ({ children, icon: Icon = Check }) => (
  <div className="flex items-start gap-3 text-sm">
    <Icon className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
    <span className="text-zinc-300">{children}</span>
  </div>
);

// Metric card
const Metric = ({ label, value, subtext }) => (
  <div className="bg-zinc-800/40 rounded-xl p-4 border border-zinc-700/30">
    <div className="text-2xl font-bold text-white mb-1">{value}</div>
    <div className="text-xs text-zinc-500 uppercase tracking-wide">{label}</div>
    {subtext && <div className="text-xs text-zinc-400 mt-1">{subtext}</div>}
  </div>
);

export default function BoardUpdate() {
  return (
    <div className="min-h-screen bg-black text-white font-sans">
      {/* Subtle gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-zinc-950 via-black to-zinc-950 pointer-events-none" />
      <div className="fixed inset-0 opacity-30 pointer-events-none" style={{
        backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.08) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(168, 85, 247, 0.06) 0%, transparent 50%)'
      }} />
      
      <div className="relative max-w-2xl mx-auto px-6 py-12">
        {/* Header */}
        <header className="mb-12">
          <div className="flex items-center gap-2 text-zinc-500 text-sm mb-4">
            <Calendar className="w-4 h-4" />
            <span>December 2025 Check-In</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3 bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
            Tradeblock Update
          </h1>
          <p className="text-zinc-400 text-lg">
            Quick sync on what's in motion heading into year-end.
          </p>
        </header>
        
        {/* Update sections */}
        <div className="space-y-4">
          
          {/* 1. Marketing Automation */}
          <UpdateSection
            icon={Zap}
            title="Marketing Automation Tool"
            status="~2 weeks to live"
            statusColor="yellow"
            summary="Finishing front-end and building out the content blocks. First live campaigns running by mid-December."
          >
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Metric label="Campaign creation" value="8h → 45m" subtext="94% faster" />
                <Metric label="Phase 2 status" value="Completing" subtext="of 3-phase AI roadmap" />
              </div>
              
              <div className="space-y-2 mt-4">
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-3">Current focus:</p>
                <Bullet>Polishing the drag-drop campaign builder UI</Bullet>
                <Bullet>"Post blocks" creation — reusable content modules (product drops, trade alerts, engagement hooks) that marketing can mix-and-match</Bullet>
                <Bullet>Onboarding Tradeblock as the first production user of the tool</Bullet>
                <Bullet icon={Target}>Goal: First live campaign running on top of the tool within 2 weeks</Bullet>
              </div>
              
              <div className="bg-zinc-800/30 rounded-lg p-3 mt-4 border border-zinc-700/30">
                <p className="text-xs text-zinc-400">
                  <span className="text-emerald-400">Why it matters:</span> Proves Phase 2 of the AI roadmap in production. 
                  Demonstrable results (8hr → 45min) for investor conversations in Q1.
                </p>
              </div>
            </div>
          </UpdateSection>
          
          {/* 2. 2025 Wrapped */}
          <UpdateSection
            icon={Gift}
            title="Tradeblock 2025 Wrapped"
            status="Ready to roll"
            statusColor="green"
            summary="Spotify Wrapped-style year-in-review for every trader. Designed and built largely with AI."
            showDemo={true}
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-3">Experience overview:</p>
                <Bullet>IG story-style vertical flow with 6 personalized insight screens</Bullet>
                <Bullet>Stats: total trades, value moved, geographic reach, silhouette preferences, trade partners</Bullet>
                <Bullet>"Power Trader" classification with speedometer visualization</Bullet>
                <Bullet>Native share cards optimized for Twitter/IG stories</Bullet>
              </div>
              
              <div className="bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 rounded-lg p-4 border border-violet-500/20 mt-4">
                <p className="text-sm text-zinc-300 mb-2">
                  <span className="font-medium text-violet-400">Design direction:</span> Premium, minimalist. Pure black backgrounds, single neon accent (#BFFF00), smooth deliberate animations.
                </p>
                <p className="text-xs text-zinc-500">
                  Explicitly not "Spotify Wrapped energy" — more luxury portfolio aesthetic.
                </p>
              </div>
              
              <div className="space-y-2 mt-4">
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-3">Deliverables:</p>
                <Bullet>Native app story viewer (reusable component for future features)</Bullet>
                <Bullet>Mobile-first web experience with shareable URLs per insight</Bullet>
                <Bullet>Server-side share card image generation</Bullet>
              </div>
              
              <div className="bg-zinc-800/30 rounded-lg p-3 mt-4 border border-zinc-700/30">
                <p className="text-xs text-zinc-400">
                  <span className="text-emerald-400">AI demonstration:</span> Entire feature spec'd, designed, and prototyped using Claude. 
                  Good case study for the "AI-native" thesis.
                </p>
              </div>
            </div>
          </UpdateSection>
          
          {/* 3. Core Product AI */}
          <UpdateSection
            icon={Brain}
            title="AI in Core Product"
            status="Iterating"
            statusColor="purple"
            summary="Three workstreams: AI-guided trade targeting, Advanced Analytics, and TradeblockGPT. All in active development."
            showDemo={true}
          >
            <div className="space-y-5">
              
              {/* Advanced Analytics */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-amber-400" />
                  <p className="text-sm font-medium text-white">Advanced Analytics</p>
                  <span className="text-xs text-zinc-500">(Ships before GPT)</span>
                </div>
                <div className="pl-4 border-l border-zinc-800 space-y-2">
                  <Bullet>Subscription product monetizing the data infrastructure we've built</Bullet>
                  <Bullet>Per-shoe intelligence: Desirability ratio, tradeability scores, momentum, success rates</Bullet>
                  <Bullet>Philosophy: Every metric answers "what should I do?" — actionable, not vanity</Bullet>
                  <Bullet>Near-zero marginal cost (infrastructure already exists)</Bullet>
                </div>
              </div>
              
              {/* AI-Guided Trading */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-sky-400" />
                  <p className="text-sm font-medium text-white">AI-Guided Trade Targeting</p>
                </div>
                <div className="pl-4 border-l border-zinc-800 space-y-2">
                  <Bullet>Shifts offer creation from "broadcast" → "targeting" problem</Bullet>
                  <Bullet>Tiered partner recommendations: who's most likely to accept your offer and why</Bullet>
                  <Bullet>Intent-aware: Acquire mode vs. Trade Away mode show different data</Bullet>
                </div>
              </div>
              
              {/* TradeblockGPT */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <p className="text-sm font-medium text-white">TradeblockGPT</p>
                  <span className="text-xs text-zinc-500">(Phase 3, in beta)</span>
                </div>
                <div className="pl-4 border-l border-zinc-800 space-y-2">
                  <Bullet>The flagship AI feature completing the core roadmap</Bullet>
                  <Bullet>Chat interface with live trader profile that updates in real-time</Bullet>
                  <Bullet>Key principle: "Behavior {'>'} Statements" — surface patterns users didn't know about themselves</Bullet>
                </div>
              </div>
              
              <div className="bg-zinc-800/30 rounded-lg p-3 mt-4 border border-zinc-700/30">
                <p className="text-xs text-zinc-400">
                  <span className="text-emerald-400">Sequencing:</span> Advanced Analytics launches first as revenue + foundation. 
                  TradeblockGPT is the headline, but analytics proves the data layer.
                </p>
              </div>
            </div>
          </UpdateSection>
          
          {/* 4. Fundraising */}
          <UpdateSection
            icon={DollarSign}
            title="Fundraising"
            status="Q1 2026"
            statusColor="blue"
            summary="Holiday pause makes sense. Resuming hard at top of year with production proof points in hand."
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-3">Why wait until January:</p>
                <Bullet icon={Clock}>December timing is historically weak for fundraising</Bullet>
                <Bullet>Marketing tool will have real production usage to demo</Bullet>
                <Bullet>2025 Wrapped showcases AI-native design/build capabilities</Bullet>
                <Bullet>More progress on core product AI to present</Bullet>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mt-4">
                <Metric label="Burn reduction" value="83%" subtext="$140K → $24K monthly" />
                <Metric label="Target raise" value="$500K" subtext="Internal round" />
              </div>
              
              <div className="bg-zinc-800/30 rounded-lg p-3 mt-4 border border-zinc-700/30">
                <p className="text-xs text-zinc-400">
                  <span className="text-emerald-400">The pitch:</span> By Q1, we'll have Phase 1 complete (Operator Essentials), 
                  Phase 2 in production (Marketing), and Phase 3 in beta (TradeblockGPT). 
                  Full AI roadmap visible with receipts.
                </p>
              </div>
            </div>
          </UpdateSection>
          
        </div>
        
        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-zinc-800/50">
          <div className="text-center">
            <p className="text-zinc-500 text-sm mb-2">Questions? Let's discuss.</p>
            <p className="text-zinc-600 text-xs">Prepared for board check-in • December 2025</p>
          </div>
        </footer>
        
      </div>
    </div>
  );
}
