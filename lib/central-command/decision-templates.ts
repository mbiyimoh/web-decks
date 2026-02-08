// decision-templates.ts — Decision bucket configuration for Central Command

import { GREEN, BLUE, GOLD, RED } from '@/components/portal/design-tokens';

export const DECISION_BUCKETS = {
  aggressive: {
    label: 'Aggressive Pursuit',
    description: 'High priority — pursue immediately with full attention',
    color: GREEN,
    defaultTemplate: `**Immediate Next Steps:**
1. Send intro email within 24 hours referencing [key pain point]
2. Propose discovery call for this week
3. Prepare 1-pager on how 33S addresses their [specific challenge]

**Key Talking Points:**
- Lead with [recommended approach from synthesis]
- Reference their [specific pain] and how we've solved similar problems
- Ask about [decision dynamics from synthesis]`,
  },
  slow_burn: {
    label: 'Slow Burn',
    description: 'Interested but not urgent — nurture over time',
    color: BLUE,
    defaultTemplate: `**Nurture Actions:**
1. Add to monthly value-share cadence
2. Send relevant case study that matches their [industry/challenge]
3. Re-engage in [timeframe based on timeline signals]

**Trigger Points to Watch:**
- Funding announcement
- Leadership change
- Competitive pressure mention`,
  },
  back_burner: {
    label: 'Back Burner',
    description: 'Not ready now — revisit later when circumstances change',
    color: GOLD,
    defaultTemplate: `**Back Burner Actions:**
1. Set reminder to check back in [3/6 months]
2. Note: Waiting for [specific trigger — budget cycle, decision-maker change, etc.]

**Reactivation Signals:**
- [What would make this worth revisiting]`,
  },
  explicit_no: {
    label: 'Explicit No',
    description: 'Not a fit — document why and move on',
    color: RED,
    defaultTemplate: `**Pass Reason:**
[Document why we're passing]

**Lessons Learned:**
- [What we learned from this evaluation]

**Potential Future Fit:**
- [Under what conditions might this change, or "Never"]`,
  },
} as const;

export type DecisionBucket = keyof typeof DECISION_BUCKETS;
