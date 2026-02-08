# Smart Capture SDK: Object-Agnostic Angle Capture System

**Slug:** smart-capture-sdk
**Author:** Claude Code
**Date:** 2024-12-22
**Branch:** preflight/smart-capture-sdk
**Related:** New greenfield project
**Status:** DECISIONS LOCKED - Ready for Spec

---

## 1) Intent & Assumptions

**Task brief:** Build a reusable, object-agnostic smart capture system that guides users through capturing objects from predefined angles using real-time ML-powered recognition. The system should be architected as an extensible SDK where object types (sneakers, figurines, watches, etc.) are pluggable configurations. Sneakers will be the first "object profile" implementation. The end goal is a mobile-first micro-application that can be easily embedded into native apps via API in the future.

**Assumptions:**
- **Extensibility is paramount** - architecture must support adding new object types with minimal code changes
- Target: Web prototype first → Mobile-first micro-app MVP → Future API embedding
- Object profiles define: target angles, ML model, overlay guides, confidence thresholds
- Sneakers are the first object profile; figurines, watches, etc. will follow
- Training data is available for sneakers (custom model training is viable)
- Real-time on-device ML inference required (no cloud dependency)
- Delightful UX (Apple Face ID-inspired) applies universally across object types
- Future integration will be via clean API, but that work is out of scope for this project

**Out of scope:**
- Native app integration work (designed for, but not implemented)
- Object-specific features beyond angle capture (authentication, pricing, etc.)
- Cloud-based ML processing
- Multi-object capture in single frame
- Building object profiles beyond sneakers (architecture supports it, only sneakers implemented)

---

## 2) Pre-reading Log

This is a greenfield project with no existing codebase. The repository contains only Claude Code configuration files.

- `.claude/` directory: Contains agent configurations and slash commands for development workflow
- No `src/`, `app/`, or other application code directories exist
- No `package.json`, `tsconfig.json`, or other configuration files

**Key Implication:** Full architecture decisions need to be made from scratch, with extensibility as a first-class design goal.

---

## 3) Codebase Map

### Recommended Architecture: Smart Capture SDK

The architecture separates **core engine** (reusable) from **object profiles** (pluggable configurations).

```
src/
├── core/                           # Reusable SDK engine
│   ├── camera/                     # Camera abstraction layer
│   │   ├── CameraProvider.tsx      # Platform-agnostic camera context
│   │   ├── FrameProcessor.ts       # Frame extraction & preprocessing
│   │   └── useCameraStream.ts      # Hook for camera access
│   │
│   ├── ml/                         # ML inference engine
│   │   ├── ModelRegistry.ts        # Registry pattern for model management
│   │   ├── InferenceEngine.ts      # Unified inference API
│   │   ├── adapters/               # Platform-specific adapters
│   │   │   ├── TFLiteAdapter.ts    # React Native TFLite
│   │   │   ├── TFJSAdapter.ts      # Browser TensorFlow.js
│   │   │   └── MediaPipeAdapter.ts # MediaPipe integration
│   │   └── types.ts                # InferenceResult, BoundingBox, etc.
│   │
│   ├── capture/                    # Capture orchestration
│   │   ├── CaptureSession.ts       # State machine for capture flow
│   │   ├── AngleEvaluator.ts       # Maps inference → angle match
│   │   └── useCaptureSession.ts    # React hook for capture state
│   │
│   ├── ui/                         # Reusable UI components
│   │   ├── overlays/               # Camera overlay components
│   │   │   ├── GuideOverlay.tsx    # Renders object profile silhouette
│   │   │   ├── ProgressRing.tsx    # Circular angle progress indicator
│   │   │   └── ConfidenceMeter.tsx # Real-time confidence visualization
│   │   ├── feedback/               # Success/error feedback
│   │   │   ├── HapticFeedback.ts   # Haptic patterns abstraction
│   │   │   ├── SuccessAnimation.tsx# Lottie celebration animations
│   │   │   └── AudioCue.ts         # Optional audio feedback
│   │   └── themes/                 # Themeable design tokens
│   │       ├── defaultTheme.ts
│   │       └── ThemeProvider.tsx
│   │
│   └── hooks/                      # Shared React hooks
│       ├── useAngleDetection.ts    # Combines camera + ML + evaluation
│       ├── useHaptics.ts           # Cross-platform haptics
│       └── useAnimatedProgress.ts  # Reanimated progress animations
│
├── profiles/                       # Object profile configurations
│   ├── types.ts                    # ObjectProfile interface definition
│   ├── ProfileRegistry.ts          # Registry for object profiles
│   ├── sneakers/                   # Sneaker-specific implementation
│   │   ├── sneaker.profile.ts      # Sneaker angle definitions, thresholds
│   │   ├── model/                  # Sneaker ML model files
│   │   │   ├── sneaker-angles.tfjs/
│   │   │   └── labels.json
│   │   ├── assets/                 # Sneaker-specific assets
│   │   │   ├── silhouettes/        # SVG overlays for each angle
│   │   │   └── animations/         # Lottie files if custom
│   │   └── index.ts                # Profile export
│   │
│   └── _template/                  # Template for new object profiles
│       ├── template.profile.ts     # Copy and customize for new objects
│       └── README.md               # Instructions for adding profiles
│
├── app/                            # Application layer (micro-app)
│   ├── screens/                    # App screens
│   │   ├── CaptureScreen.tsx       # Main capture experience
│   │   ├── ReviewScreen.tsx        # Review captured images
│   │   └── OnboardingScreen.tsx    # First-time user guidance
│   ├── navigation/                 # Navigation setup
│   └── App.tsx                     # Entry point
│
└── api/                            # Future: Embeddable API surface
    ├── SmartCapture.ts             # Public API for embedding
    └── types.ts                    # Public type exports
```

### Object Profile Interface

```typescript
// profiles/types.ts
interface ObjectProfile {
  id: string;                        // e.g., "sneakers", "figurines"
  displayName: string;               // e.g., "Sneakers"

  // Angle definitions
  angles: AngleDefinition[];

  // ML model configuration
  model: {
    type: 'tflite' | 'tfjs' | 'mediapipe' | 'custom';
    path: string;                    // Model file path or URL
    inputSize: [number, number];     // Expected input dimensions
    labels?: string[];               // Class labels if applicable
  };

  // Detection configuration
  detection: {
    confidenceThreshold: number;     // 0-1, when to consider "detected"
    minFramesForCapture: number;     // Stability requirement
  };

  // UI customization
  ui: {
    overlays: Record<string, string>;// Angle ID → SVG path
    theme?: Partial<Theme>;          // Profile-specific theme overrides
    animations?: {
      success?: string;              // Custom Lottie path
      progress?: string;
    };
    hapticPattern?: HapticPattern;   // Custom haptic feedback
  };

  // Capture flow
  captureFlow: 'sequential' | 'freeform' | 'checklist';
  requiredAngles: string[];          // Angle IDs that must be captured
  optionalAngles?: string[];         // Nice-to-have angles
}

interface AngleDefinition {
  id: string;                        // e.g., "side-left", "top-down"
  displayName: string;               // e.g., "Left Side"
  description: string;               // Guidance text for user

  // How to detect this angle (classification-based for sneakers)
  detection: {
    type: 'classification';
    classIndex: number;
  };

  // Visual guide
  guideSvg: string;                  // Path to silhouette SVG
  guideInstructions: string;         // e.g., "Rotate shoe to show left side"
}
```

### Data Flow (Extensible)

```
┌─────────────────────────────────────────────────────────────────┐
│                      Smart Capture SDK                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐    ┌──────────────────┐    ┌──────────────┐  │
│  │    Camera    │───▶│  Frame Processor │───▶│   ML Engine  │  │
│  │   Provider   │    │                  │    │   (Registry) │  │
│  └──────────────┘    └──────────────────┘    └──────┬───────┘  │
│                                                      │          │
│                                                      ▼          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Object Profile                         │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │  │
│  │  │   Angles    │  │    Model    │  │   UI Config     │   │  │
│  │  │ Definitions │  │   Config    │  │   (overlays,    │   │  │
│  │  │             │  │             │  │   animations)   │   │  │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                  │
│                              ▼                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   Angle Evaluator                         │  │
│  │  (Maps inference result → angle match + confidence)       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                  │
│                              ▼                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   Capture Session                         │  │
│  │  (State machine: detecting → locked → capturing → done)   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                  │
│                              ▼                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                      UI Layer                             │  │
│  │  ┌──────────┐  ┌──────────────┐  ┌──────────────────┐    │  │
│  │  │ Overlays │  │   Progress   │  │     Feedback     │    │  │
│  │  │ (themed) │  │   (animated) │  │ (haptics+visual) │    │  │
│  │  └──────────┘  └──────────────┘  └──────────────────┘    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4) Root Cause Analysis

**N/A** - This is a new feature development, not a bug fix.

---

## 5) Research Findings

### Part A: Extensible Architecture Patterns

#### Registry Pattern for ML Models
**Industry Standard:** Used by MMDetection, Ultralytics YOLO, Hugging Face Transformers

The registry pattern enables:
- **Lazy loading:** Models load only when needed
- **Hot-swapping:** Switch object profiles without app restart (~2-3s swap time)
- **Version control:** Multiple model versions per object type
- **Memory management:** Unload unused models to free GPU memory

```typescript
// Example: Adding a new object profile takes ~5 minutes
import { ProfileRegistry } from '@smart-capture/core';
import { FigurineProfile } from './profiles/figurines';

ProfileRegistry.register('figurines', FigurineProfile);
```

**Sources:**
- [MMDetection Registry Pattern](https://mmdetection.readthedocs.io/en/latest/advanced_guides/customize_models.html)
- [Ultralytics Configuration-Driven Design](https://docs.ultralytics.com/usage/cfg/)

---

#### TypeScript Object Profiles
**Decision:** Use TypeScript modules for object profiles (type-safe, IDE support, custom logic support).

```typescript
// profiles/sneakers/sneaker.profile.ts
import { ObjectProfile } from '../types';

export const SneakerProfile: ObjectProfile = {
  id: 'sneakers',
  displayName: 'Sneakers',

  angles: [
    {
      id: 'top-down',
      displayName: 'Top View',
      description: 'Look down at the shoe from above',
      detection: { type: 'classification', classIndex: 0 },
      guideSvg: './assets/silhouettes/top-down.svg',
      guideInstructions: 'Hold the shoe flat and point camera straight down',
    },
    // ... more angles
  ],

  model: {
    type: 'tfjs',
    path: '/models/sneaker-angles/model.json',
    inputSize: [224, 224],
    labels: ['top-down', 'sole', 'heel', 'toe', 'side-left', 'side-right', 'size-tag', 'box'],
  },

  detection: {
    confidenceThreshold: 0.75,
    minFramesForCapture: 3,
  },

  captureFlow: 'sequential',
  requiredAngles: ['top-down', 'sole', 'heel', 'toe', 'side-left', 'side-right', 'size-tag'],
  optionalAngles: ['box'],

  ui: {
    overlays: {
      'top-down': './assets/silhouettes/top-down.svg',
      // ...
    },
    theme: {
      primaryColor: '#4A90D9',
      successColor: '#34C759',
    },
  },
};
```

---

### Part B: ML Approach for Angle Detection

#### Classification-Based (Selected for Sneakers)

Train a multi-class classifier where each class is an angle:
- **8 Classes:** `top-down`, `sole`, `heel`, `toe`, `side-left`, `side-right`, `size-tag`, `box`
- **Output:** Softmax probabilities
- **Architecture:** MobileNetV3-Small backbone (~4MB)
- **Target Accuracy:** >90% top-1 per angle

**Implementation:**
- Use TensorFlow/Keras for training
- Transfer learning from ImageNet weights
- Export to TFJS for web, TFLite for future mobile

---

### Part C: UI/UX Building Blocks

#### Themeable Design System
```typescript
interface CaptureTheme {
  primaryColor: string;       // Main brand color
  successColor: string;       // Angle locked/captured
  warningColor: string;       // Getting close
  errorColor: string;         // Object not detected
  backgroundColor: string;    // Overlay background
  gradientStops: [string, string, string]; // Blue → Yellow → Green
  transitionDuration: number;
}
```

---

### Part D: Platform Strategy

#### Web Prototype (This Project)
**Stack:**
- Next.js 14 (App Router)
- `react-webcam` for camera access
- TensorFlow.js for ML inference
- Framer Motion for animations
- Tailwind CSS for styling
- Railway for deployment

#### Future Mobile (Out of Scope)
- React Native with Expo
- `react-native-vision-camera`
- `react-native-fast-tflite`

---

## 6) Decisions (LOCKED)

### Core Architecture

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Profile Format** | TypeScript modules | Type-safe, IDE support, AI agents can work with it easily |
| **Model Hosting** | Bundled | Simpler for web prototype; hybrid for future mobile |

### Sneaker Profile

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Required Angles** | top-down, sole, heel, toe, side-left, side-right, size-tag (7) | Comprehensive coverage for authentication/listing |
| **Optional Angles** | box (1) | Nice to have but not critical |
| **Training Data** | Folder structure with images organized by angle | Standard ML format, easy to generate |
| **Angle Tolerance** | Loose (0.75 confidence threshold) | Configurable in profile; start forgiving, tighten if needed |

### UX

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Capture Flow** | Guided Sequential | Easier implementation; only match one angle at a time |
| **Fallback** | Allow manual capture after 7 seconds | Goal is to make capture easy, not gatekeep. Nudge toward correct angles. |

### Technical

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Platform** | Web-first prototype accessible on mobile browser | Fastest iteration; validates UX before React Native investment |
| **Performance** | <200ms latency, 30 FPS, <10MB model | Good UX baseline; optimize later |
| **Deployment** | Railway | Existing institutional knowledge |

---

## 7) Summary

### Architecture Summary

| Layer | Purpose | Reusability |
|-------|---------|-------------|
| **Core Engine** | Camera, ML inference, capture session, UI primitives | 100% reusable |
| **Object Profiles** | Angle definitions, model config, UI customization | Config-driven, pluggable |
| **App Shell** | Screens, navigation, branding | Per-deployment |

### Sneaker Angles (8 Total)

| ID | Display Name | Required | Description |
|----|--------------|----------|-------------|
| `top-down` | Top View | Yes | Looking down at the shoe from above |
| `sole` | Sole/Bottom | Yes | Bottom of shoe, sole facing camera |
| `heel` | Heel | Yes | Back of the shoe |
| `toe` | Toe Box | Yes | Front of the shoe |
| `side-left` | Left Side | Yes | Left side profile |
| `side-right` | Right Side | Yes | Right side profile |
| `size-tag` | Size Tag | Yes | Inside size tag |
| `box` | Shoe Box | No | Optional box photo |

### Implementation Order

1. **Phase 1:** Web prototype with full UX, placeholder model
2. **Phase 2:** Train and integrate real sneaker angle model
3. **Phase 3:** (Future) Port to React Native
4. **Phase 4:** (Future) Polish and API design for embedding

### Next Steps

1. Create training data requirements document for data agent
2. Create implementation spec
3. Receive training data
4. Begin implementation
