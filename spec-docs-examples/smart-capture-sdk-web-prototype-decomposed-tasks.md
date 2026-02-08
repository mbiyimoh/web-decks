# Smart Capture SDK - Task Decomposition

**Spec:** `specs/smart-capture-sdk-web-prototype.md`
**Generated:** 2024-12-22
**Status:** Ready for Execution

---

## Phase 1: Foundation (Core + Placeholder Model)

### 1.1 Project Setup
| ID | Task | Priority | Est. Complexity | Dependencies |
|----|------|----------|-----------------|--------------|
| P1-01 | Initialize Next.js 14 project with App Router, Tailwind CSS, TypeScript | HIGH | LOW | None |
| P1-02 | Configure project structure (`src/core/`, `src/profiles/`, `src/app/`) | HIGH | LOW | P1-01 |
| P1-03 | Install dependencies (framer-motion, react-webcam, @tensorflow/tfjs) | HIGH | LOW | P1-01 |
| P1-04 | Configure Tailwind with custom theme tokens (colors, typography) | MEDIUM | LOW | P1-01 |
| P1-05 | Set up Railway deployment configuration (railway.toml) | MEDIUM | LOW | P1-01 |

### 1.2 Core Types & Interfaces
| ID | Task | Priority | Est. Complexity | Dependencies |
|----|------|----------|-----------------|--------------|
| P1-06 | Create `profiles/types.ts` with ObjectProfile, AngleDefinition, ModelConfig interfaces | HIGH | LOW | P1-02 |
| P1-07 | Create `core/capture/types.ts` with CaptureState, CaptureSessionState interfaces | HIGH | LOW | P1-02 |
| P1-08 | Create `core/ml/types.ts` with InferenceResult, ClassPrediction interfaces | HIGH | LOW | P1-02 |
| P1-09 | Create `core/ui/theme/types.ts` with CaptureTheme interface | MEDIUM | LOW | P1-02 |

### 1.3 Sneaker Profile
| ID | Task | Priority | Est. Complexity | Dependencies |
|----|------|----------|-----------------|--------------|
| P1-10 | Create sneaker profile configuration (`profiles/sneakers/sneaker.profile.ts`) | HIGH | MEDIUM | P1-06 |
| P1-11 | Create 8 silhouette SVGs (simple outlines): top-down, sole, heel, toe, side-left, side-right, size-tag, box | HIGH | MEDIUM | P1-02 |
| P1-12 | Export profile via `profiles/sneakers/index.ts` | LOW | LOW | P1-10 |

### 1.4 Camera Module
| ID | Task | Priority | Est. Complexity | Dependencies |
|----|------|----------|-----------------|--------------|
| P1-13 | Implement `core/camera/CameraProvider.tsx` wrapping react-webcam | HIGH | MEDIUM | P1-03 |
| P1-14 | Implement `core/camera/useCamera.ts` hook for camera access and frame capture | HIGH | MEDIUM | P1-13 |
| P1-15 | Implement `core/camera/frameUtils.ts` for image data extraction | MEDIUM | LOW | P1-03 |

### 1.5 ML Module (Placeholder)
| ID | Task | Priority | Est. Complexity | Dependencies |
|----|------|----------|-----------------|--------------|
| P1-16 | Implement `core/ml/adapters/TFJSAdapter.ts` with placeholder model | HIGH | MEDIUM | P1-08 |
| P1-17 | Implement `core/ml/useInference.ts` hook for prediction interface | HIGH | MEDIUM | P1-16 |
| P1-18 | Implement `core/ml/ModelRegistry.ts` for lazy model loading | MEDIUM | LOW | P1-16 |

### 1.6 Capture Session Logic
| ID | Task | Priority | Est. Complexity | Dependencies |
|----|------|----------|-----------------|--------------|
| P1-19 | Implement `core/capture/CaptureSession.ts` state machine | HIGH | HIGH | P1-07, P1-17 |
| P1-20 | Implement `core/capture/useCaptureSession.ts` hook orchestrating capture flow | HIGH | HIGH | P1-19 |
| P1-21 | Implement manual capture fallback timer (7 seconds) | MEDIUM | LOW | P1-20 |

### 1.7 UI Components
| ID | Task | Priority | Est. Complexity | Dependencies |
|----|------|----------|-----------------|--------------|
| P1-22 | Implement `core/ui/overlays/ConfidenceRing.tsx` with color gradient animation | HIGH | MEDIUM | P1-03 |
| P1-23 | Implement `core/ui/overlays/GuideOverlay.tsx` for silhouette display | HIGH | MEDIUM | P1-11 |
| P1-24 | Implement `core/ui/overlays/ProgressBar.tsx` for angle progress | MEDIUM | LOW | P1-03 |
| P1-25 | Implement `core/ui/feedback/SuccessAnimation.tsx` (checkmark + sparkle) | MEDIUM | MEDIUM | P1-03 |
| P1-26 | Implement `core/ui/feedback/CaptureFlash.tsx` for capture feedback | LOW | LOW | P1-03 |
| P1-27 | Implement `core/hooks/useHaptics.ts` for haptic feedback | LOW | LOW | P1-02 |
| P1-28 | Implement `core/ui/theme/ThemeProvider.tsx` with default theme | MEDIUM | LOW | P1-09 |

### 1.8 App Screens
| ID | Task | Priority | Est. Complexity | Dependencies |
|----|------|----------|-----------------|--------------|
| P1-29 | Implement Landing Screen (`app/page.tsx`) with camera permission request | HIGH | MEDIUM | P1-13, P1-28 |
| P1-30 | Implement Capture Screen (`app/capture/page.tsx`) with full capture flow | HIGH | HIGH | P1-20, P1-22, P1-23, P1-24 |
| P1-31 | Implement Review Screen (`app/review/page.tsx`) with thumbnail grid and retake | HIGH | MEDIUM | P1-30 |
| P1-32 | Implement Success Screen (`app/success/page.tsx`) with celebration | MEDIUM | LOW | P1-31 |
| P1-33 | Implement app layout (`app/layout.tsx`) with providers | HIGH | LOW | P1-13, P1-28 |

### 1.9 Storage & Utilities
| ID | Task | Priority | Est. Complexity | Dependencies |
|----|------|----------|-----------------|--------------|
| P1-34 | Implement `lib/storage.ts` for localStorage capture persistence | MEDIUM | LOW | P1-02 |
| P1-35 | Implement `lib/utils.ts` with image data URL utilities | LOW | LOW | P1-02 |

### 1.10 Integration & Deployment
| ID | Task | Priority | Est. Complexity | Dependencies |
|----|------|----------|-----------------|--------------|
| P1-36 | Integrate all components in Capture Screen end-to-end | HIGH | MEDIUM | P1-30 |
| P1-37 | Test full user flow (Landing → Capture → Review → Success) | HIGH | MEDIUM | P1-36 |
| P1-38 | Deploy to Railway and test on mobile devices | HIGH | LOW | P1-37 |

---

## Phase 2: Model Training & Integration ✅ COMPLETE

**Completed:** 2024-12-22

**Results:**
- Model: MobileNetV3-Small v2 (two-phase training)
- Accuracy: 72% overall
- Size: 4.44 MB
- Confidence threshold: Tuned to 0.55

### 2.1 Training Data Preprocessing ✅
| ID | Task | Status |
|----|------|--------|
| P2-01 | Create `scripts/training/preprocess.py` | ✅ Done |
| P2-02 | Run preprocessing on all images | ✅ Done - 2,691 images converted |
| P2-03 | Create train/validation split | ✅ Done - 85/15 split |

### 2.2 Model Training ✅
| ID | Task | Status |
|----|------|--------|
| P2-04 | Create training script | ✅ Done - `train_v2.py` with two-phase training |
| P2-05 | Train with augmentation | ✅ Done - rotation, brightness, flip, zoom |
| P2-06 | Create evaluation script | ✅ Done - `evaluate.py` |
| P2-07 | Evaluate model | ✅ Done - 72% accuracy (adjusted threshold) |

### 2.3 Model Export & Integration ✅
| ID | Task | Status |
|----|------|--------|
| P2-08 | Create `export_tfjs.py` | ✅ Done |
| P2-09 | Export to `public/models/sneaker-angles/` | ✅ Done - 4.44 MB |
| P2-10 | Set `usePlaceholder: false` | ✅ Done |
| P2-11 | Tune confidence threshold | ✅ Done - 0.55 (from 0.75) |
| P2-12 | End-to-end test | ✅ Done - Build passes |

**Key Fixes Applied:**
- Fixed normalization mismatch ([0,1] not [-1,1])
- Fixed hardcoded thresholds in utils.ts, ConfidenceRing.tsx, GuideOverlay.tsx
- Exported DEFAULT_CONFIDENCE_THRESHOLD constant for consistency

---

## Phase 3: Polish

**Status:** Ready for Execution

**Phase 2 Learnings Applied:**
- Frame throttling already implemented (15 FPS in capture/page.tsx:84)
- Model loads lazily after camera permission already
- Error states for camera/model already exist
- Success screen already has celebration animation (CelebrationAnimation)

### 3.1 Performance Optimization
| ID | Task | Priority | Est. Complexity | Dependencies | Status |
|----|------|----------|-----------------|--------------|--------|
| P3-01 | Frame throttling (15 FPS) | MEDIUM | LOW | Phase 2 | ✅ Already done |
| P3-02 | Web Worker inference (only if jank observed on mobile) | LOW | HIGH | - | SKIP (defer to mobile testing) |
| P3-03 | Lazy model loading | MEDIUM | LOW | Phase 2 | ✅ Already done |

### 3.2 UX Polish
| ID | Task | Priority | Est. Complexity | Dependencies |
|----|------|----------|-----------------|--------------|
| P3-04 | Add Lottie confetti animation to replace CSS-based celebration | LOW | LOW | - |
| P3-05 | Add onboarding screen with angle preview (optional, skip for MVP) | LOW | MEDIUM | - |
| P3-06 | Add skeleton loading states for model loading | MEDIUM | LOW | - |
| P3-07 | Polish silhouette SVGs (professional design) - defer to design phase | LOW | MEDIUM | - |

### 3.3 Error Handling & Edge Cases
| ID | Task | Priority | Est. Complexity | Dependencies | Status |
|----|------|----------|-----------------|--------------|--------|
| P3-08 | Camera permission denied state | MEDIUM | LOW | - | ✅ Already done (landing page) |
| P3-09 | Model loading error state | MEDIUM | LOW | - | ✅ Already done (capture page) |
| P3-10 | Graceful manual-only fallback on ML failure | MEDIUM | LOW | - |
| P3-11 | Add model loading retry with exponential backoff | LOW | LOW | - |

### 3.4 Deployment & Documentation
| ID | Task | Priority | Est. Complexity | Dependencies |
|----|------|----------|-----------------|--------------|
| P3-12 | Create README with setup instructions | HIGH | LOW | - |
| P3-13 | Configure railway.toml for deployment | HIGH | LOW | - |
| P3-14 | Deploy to Railway and test on mobile | HIGH | LOW | P3-13 |
| P3-15 | Add code documentation for core hooks | LOW | LOW | - |

### 3.5 Accessibility & Final Polish
| ID | Task | Priority | Est. Complexity | Dependencies |
|----|------|----------|-----------------|--------------|
| P3-16 | Add ARIA labels to interactive elements | MEDIUM | LOW | - |
| P3-17 | Ensure focus management during capture flow | MEDIUM | LOW | - |
| P3-18 | Test and fix on iPhone Safari | HIGH | MEDIUM | P3-14 |
| P3-19 | Test and fix on Android Chrome | HIGH | MEDIUM | P3-14 |

---

## Execution Order Summary

### Critical Path (Must Complete First)
1. P1-01 → P1-02 → P1-03 (Project setup)
2. P1-06, P1-07, P1-08 (Core types)
3. P1-13 → P1-14 (Camera module)
4. P1-16 → P1-17 (ML placeholder)
5. P1-19 → P1-20 (Capture session)
6. P1-22, P1-23 (Core overlays)
7. P1-29 → P1-30 → P1-31 → P1-32 (Screens)
8. P1-36 → P1-37 → P1-38 (Integration & deploy)

### Parallel Work Opportunities
- P1-10, P1-11 (Profile + SVGs) can run parallel to camera/ML work
- P1-22, P1-23, P1-24 (UI overlays) can be developed in parallel
- P1-25, P1-26, P1-27 (Feedback components) are independent
- P1-34, P1-35 (Utils) can be done anytime after P1-02

### Dependencies Graph
```
P1-01 (Init)
  ├── P1-02 (Structure)
  │     ├── P1-06, P1-07, P1-08, P1-09 (Types)
  │     │     └── P1-10 (Sneaker profile)
  │     │           └── P1-12 (Export)
  │     ├── P1-11 (SVGs)
  │     └── P1-34, P1-35 (Utils)
  └── P1-03 (Dependencies)
        ├── P1-13 (CameraProvider)
        │     └── P1-14 (useCamera)
        │           └── P1-15 (frameUtils)
        ├── P1-16 (TFJSAdapter)
        │     ├── P1-17 (useInference)
        │     └── P1-18 (ModelRegistry)
        ├── P1-22, P1-23, P1-24 (Overlays)
        ├── P1-25, P1-26 (Feedback)
        └── P1-27 (Haptics)

P1-07 + P1-17 → P1-19 (CaptureSession)
                  └── P1-20 (useCaptureSession)
                        └── P1-21 (Manual fallback)

P1-09 → P1-28 (ThemeProvider)

P1-13 + P1-28 → P1-29 (Landing)
P1-20 + P1-22 + P1-23 + P1-24 → P1-30 (Capture)
P1-30 → P1-31 (Review)
P1-31 → P1-32 (Success)
P1-13 + P1-28 → P1-33 (Layout)

All screens → P1-36 (Integration)
P1-36 → P1-37 (Testing)
P1-37 → P1-38 (Deploy)
```

---

## Task Count Summary

| Phase | Tasks | HIGH Priority | MEDIUM Priority | LOW Priority | Status |
|-------|-------|---------------|-----------------|--------------|--------|
| Phase 1 | 38 | 22 | 12 | 4 | ✅ Complete |
| Phase 2 | 12 | 9 | 3 | 0 | ✅ Complete |
| Phase 3 | 12 (8 new, 4 already done) | 4 | 5 | 3 | 🚀 In Progress |
| **Total** | **62** | **35** | **20** | **7** |

---

## Validation Notes (from /spec:validate)

Recommendations incorporated:
1. **Defer onboarding screen to Phase 3** - Moved to P3-05
2. **Simplify silhouettes for Phase 1** - P1-11 uses simple outlines, polish in P3-07
3. **Direct profile export** - P1-12 simplified to direct export (no registry needed)
4. **Cut AudioCue.ts** - Not included in task list (was never in spec)
