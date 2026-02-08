# Task Breakdown: Brain Dump to Reviewable Recommendations
Generated: 2026-02-01
Source: specs/feat-braindump-reviewable-recommendations.md

## Overview
Transform the Clarity Canvas brain dump extraction from auto-save to a human-in-the-loop review experience with approve/reject/refine per recommendation.

## Phase 1: Foundation (shared utilities + types)

### Task 1.1: Extract key-matching utilities to shared module
**Description**: Move `buildKeyLookups()` and `fuzzyMatchKey()` from `extract/route.ts` to `lib/clarity-canvas/key-matching.ts` and add `CONTEXT_DELIMITER` constant.
**Size**: Small
**Priority**: High
**Dependencies**: None
**Can run parallel with**: Task 1.2

### Task 1.2: Add new types to `lib/clarity-canvas/types.ts`
**Description**: Add `RecommendationStatus`, `Recommendation`, `ExtractOnlyResponse`, `CommitRecommendationsRequest/Response`, `RefineRecommendationRequest/Response` types.
**Size**: Small
**Priority**: High
**Dependencies**: None
**Can run parallel with**: Task 1.1

## Phase 2: API Layer

### Task 2.1: Modify extract route to extract-only mode
**Description**: Switch model to gpt-4o, remove all DB writes, return `ExtractOnlyResponse`. Import key-matching from shared module.
**Size**: Medium
**Priority**: High
**Dependencies**: Task 1.1, Task 1.2

### Task 2.2: Create commit API endpoint
**Description**: Build `POST /api/clarity-canvas/commit` to persist approved recommendations to DB with fuzzy key matching, FieldSource creation, and score recalculation.
**Size**: Medium
**Priority**: High
**Dependencies**: Task 1.1, Task 1.2
**Can run parallel with**: Task 2.3

### Task 2.3: Create refine API endpoint
**Description**: Build `POST /api/clarity-canvas/refine` using gpt-4o-mini to refine a single recommendation based on user prompt.
**Size**: Small
**Priority**: High
**Dependencies**: Task 1.2
**Can run parallel with**: Task 2.2

## Phase 3: Frontend Components + Integration

### Task 3.1: Build RecommendationCard component
**Description**: Individual recommendation card with approve/reject/refine actions, inline refine flow, framer-motion animations, and 4 visual states (pending/approved/rejected/refined).
**Size**: Large
**Priority**: High
**Dependencies**: Task 1.2, Task 2.3

### Task 3.2: Build RecommendationReview component
**Description**: Review screen with executive summary, section-grouped recommendation cards, gaps section, commit footer, confirmation dialog, and approve-all with low-confidence warning.
**Size**: Large
**Priority**: High
**Dependencies**: Task 3.1, Task 2.2

### Task 3.3: Wire review step into ClarityCanvasClient
**Description**: Add `review` to FlowStep, add `extractionResult` and `brainDumpSourceType` state, update extraction handlers to transition to review instead of profile, render RecommendationReview.
**Size**: Medium
**Priority**: High
**Dependencies**: Task 3.2, Task 2.1
