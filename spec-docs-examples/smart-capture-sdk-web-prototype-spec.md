# Smart Capture SDK - Web Prototype Specification

**Version:** 1.1
**Date:** 2024-12-22
**Status:** Phase 2 Complete (Real Model Trained)
**Ideation Doc:** `docs/ideation/sneaker-angle-capture-system.md`
**Training Data:** `training-data/sneaker-training-data/` (2,691 images, 4.4GB)

---

## 1. Overview

### 1.1 Purpose
Build a web-based prototype of the Smart Capture SDK that demonstrates the full user experience of guided, ML-powered angle capture for sneakers. The prototype must be accessible via mobile browser to validate the UX before investing in React Native.

### 1.2 Goals
1. Deliver a delightful, Apple Face ID-inspired capture experience
2. Validate ML angle detection accuracy with real training data
3. Build with extensibility in mind (object profiles are pluggable)
4. Deploy to Railway for easy testing on mobile devices

### 1.3 Non-Goals (This Phase)
- React Native implementation
- Production-grade performance optimization
- Multiple object profiles (only sneakers)
- Native app embedding API

---

## 2. User Experience

### 2.1 User Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Landing    │────▶│  Onboarding │────▶│   Capture   │────▶│   Review    │
│   Screen    │     │   (brief)   │     │   Screen    │     │   Screen    │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                                              │
                                              ▼
                                        ┌───────────┐
                                        │  Success  │
                                        │  Screen   │
                                        └───────────┘
```

### 2.2 Screen Specifications

#### 2.2.1 Landing Screen
**Purpose:** Entry point, request camera permission

**Elements:**
- Hero text: "Capture Your Sneakers"
- Subtitle: "Take perfect photos from every angle"
- "Get Started" button
- Brief value prop (3 bullet points)

**Behavior:**
- On "Get Started" click → request camera permission
- If granted → navigate to Onboarding
- If denied → show permission denied state with instructions

---

#### 2.2.2 Onboarding Screen (Brief)
**Purpose:** Set expectations for the capture experience

**Elements:**
- Animated preview showing the capture flow (Lottie or video)
- Text: "We'll guide you through 7 angles"
- "Start Capturing" button
- "Skip" link (for returning users)

**Behavior:**
- Show for ~3-5 seconds or until user taps
- Navigate to Capture Screen

---

#### 2.2.3 Capture Screen (Core Experience)
**Purpose:** Guide user through capturing each angle

**Layout:**
```
┌────────────────────────────────────┐
│  Progress Bar (1 of 7)             │
├────────────────────────────────────┤
│                                    │
│         Camera Feed                │
│     ┌─────────────────┐            │
│     │                 │            │
│     │   Silhouette    │            │
│     │    Overlay      │            │
│     │                 │            │
│     └─────────────────┘            │
│                                    │
│     [ Confidence Ring ]            │
│                                    │
├────────────────────────────────────┤
│  "Show the TOP of the shoe"        │
│                                    │
│  [ Manual Capture Button ]         │
│  (appears after 7 seconds)         │
└────────────────────────────────────┘
```

**Elements:**
1. **Progress Indicator:** Shows current angle (e.g., "1 of 7") and completion status
2. **Camera Feed:** Full-screen video from device camera
3. **Silhouette Overlay:** SVG outline showing target angle position
4. **Confidence Ring:** Circular progress that fills as confidence increases
   - Color gradient: Blue (0%) → Yellow (50%) → Green (100%)
5. **Instruction Text:** Dynamic text for current angle
6. **Manual Capture Button:** Appears after 7 seconds if auto-capture hasn't triggered

**Behavior:**

*Detection Loop (runs every frame):*
1. Capture frame from camera
2. Run ML inference → get class probabilities
3. Check if current target angle exceeds confidence threshold (0.55)
4. Update confidence ring animation
5. If confidence > threshold for 3+ consecutive frames → auto-capture

*Auto-Capture Flow:*
1. Freeze frame briefly (100ms)
2. Play success animation (checkmark + sparkle)
3. Trigger haptic feedback (if available)
4. Save captured image
5. Transition to next angle (or Review if complete)

*Manual Capture Flow:*
1. After 5 seconds without auto-capture, show "Capture Anyway" button
2. On tap → capture current frame regardless of confidence
3. Show subtle "captured manually" indicator
4. Proceed to next angle

*Skip/Back:*
- Allow skipping optional angles (just "box")
- Allow going back to re-capture previous angles

---

#### 2.2.4 Review Screen
**Purpose:** Let user review and retake photos

**Layout:**
```
┌────────────────────────────────────┐
│  Review Your Photos                │
├────────────────────────────────────┤
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐  │
│  │ Top │ │Sole │ │Heel │ │ Toe │  │
│  │  ✓  │ │  ✓  │ │  ✓  │ │  ✓  │  │
│  └─────┘ └─────┘ └─────┘ └─────┘  │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐  │
│  │Left │ │Right│ │ Tag │ │ Box │  │
│  │  ✓  │ │  ✓  │ │  ✓  │ │  ○  │  │
│  └─────┘ └─────┘ └─────┘ └─────┘  │
├────────────────────────────────────┤
│  Tap any photo to retake           │
│                                    │
│  [ Done - Save Photos ]            │
└────────────────────────────────────┘
```

**Elements:**
- Grid of captured images with angle labels
- Checkmark overlay on captured angles
- Empty state for skipped optional angles
- Tap to retake functionality
- "Done" button

**Behavior:**
- Tap image → go back to Capture Screen for that specific angle
- "Done" → save images locally / show Success Screen

---

#### 2.2.5 Success Screen
**Purpose:** Celebrate completion

**Elements:**
- Celebration animation (confetti or similar)
- "All Done!" message
- Summary: "7 photos captured"
- "Start New Session" button
- "Download Photos" button (saves to device)

---

### 2.3 Visual Design

#### Color Palette
| Token | Value | Usage |
|-------|-------|-------|
| `primary` | `#4A90D9` | Buttons, links, active states |
| `success` | `#34C759` | Captured states, high confidence |
| `warning` | `#FFCC00` | Medium confidence |
| `detecting` | `#007AFF` | Low confidence, detecting |
| `error` | `#FF3B30` | Errors, denied states |
| `background` | `#000000` | Camera background |
| `surface` | `#1C1C1E` | Cards, overlays |
| `text` | `#FFFFFF` | Primary text |
| `textSecondary` | `#8E8E93` | Secondary text |

#### Animation Guidelines
- **Transitions:** 200-300ms ease-out
- **Confidence ring:** Smooth 60fps animation
- **Success flash:** 100ms white overlay fade
- **Celebrations:** Lottie animations, 1-2 seconds

#### Typography
- **Headings:** System font, bold, 24-32px
- **Body:** System font, regular, 16-18px
- **Instructions:** System font, medium, 18-20px

---

## 3. Technical Architecture

### 3.1 Project Structure

```
smart-image-capture/
├── src/
│   ├── core/                    # Reusable SDK core
│   │   ├── camera/
│   │   │   ├── CameraProvider.tsx
│   │   │   ├── useCamera.ts
│   │   │   └── frameUtils.ts
│   │   │
│   │   ├── ml/
│   │   │   ├── ModelRegistry.ts
│   │   │   ├── useInference.ts
│   │   │   ├── adapters/
│   │   │   │   └── TFJSAdapter.ts
│   │   │   └── types.ts
│   │   │
│   │   ├── capture/
│   │   │   ├── CaptureSession.ts
│   │   │   ├── useCaptureSession.ts
│   │   │   └── types.ts
│   │   │
│   │   ├── ui/
│   │   │   ├── overlays/
│   │   │   │   ├── GuideOverlay.tsx
│   │   │   │   ├── ConfidenceRing.tsx
│   │   │   │   └── ProgressBar.tsx
│   │   │   ├── feedback/
│   │   │   │   ├── SuccessAnimation.tsx
│   │   │   │   ├── HapticFeedback.ts
│   │   │   │   └── CaptureFlash.tsx
│   │   │   └── theme/
│   │   │       ├── ThemeProvider.tsx
│   │   │       ├── defaultTheme.ts
│   │   │       └── types.ts
│   │   │
│   │   └── hooks/
│   │       ├── useAngleDetection.ts
│   │       └── useHaptics.ts
│   │
│   ├── profiles/
│   │   ├── types.ts
│   │   ├── ProfileRegistry.ts
│   │   └── sneakers/
│   │       ├── sneaker.profile.ts
│   │       ├── assets/
│   │       │   └── silhouettes/
│   │       │       ├── top-down.svg
│   │       │       ├── sole.svg
│   │       │       ├── heel.svg
│   │       │       ├── toe.svg
│   │       │       ├── side-left.svg
│   │       │       ├── side-right.svg
│   │       │       ├── size-tag.svg
│   │       │       └── box.svg
│   │       └── index.ts
│   │
│   ├── app/                     # Next.js app layer
│   │   ├── page.tsx             # Landing
│   │   ├── onboarding/
│   │   │   └── page.tsx
│   │   ├── capture/
│   │   │   └── page.tsx
│   │   ├── review/
│   │   │   └── page.tsx
│   │   ├── success/
│   │   │   └── page.tsx
│   │   ├── layout.tsx
│   │   └── globals.css
│   │
│   └── lib/
│       ├── storage.ts           # Local storage for captures
│       └── utils.ts
│
├── public/
│   ├── models/
│   │   └── sneaker-angles/      # TFJS model files
│   │       ├── model.json
│   │       └── weights.bin
│   └── animations/
│       ├── success.json         # Lottie files
│       └── confetti.json
│
├── training/                    # Model training (separate workflow)
│   ├── preprocess.py           # Convert HEIC/WebP/etc to JPEG
│   ├── train.py                # Train MobileNetV3 classifier
│   ├── export_tfjs.py          # Export to TensorFlow.js format
│   ├── evaluate.py             # Test model accuracy per class
│   └── requirements.txt
│
├── training-data/               # Training images (gitignored, 4.4GB)
│   └── sneaker-training-data/
│       ├── top-down/           # 299 images
│       ├── sole/               # 299 images
│       ├── heel/               # 299 images
│       ├── toe/                # 299 images
│       ├── side-left/          # 299 images
│       ├── side-right/         # 299 images
│       ├── size-tag/           # 299 images
│       └── box/                # 598 images
│
├── docs/
│   ├── ideation/
│   └── data-requirements/
│
├── specs/
│   └── smart-capture-sdk-web-prototype.md
│
├── package.json
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

### 3.2 Technology Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Framework | Next.js 14 (App Router) | Fast iteration, good DX, easy deployment |
| Styling | Tailwind CSS | Rapid UI development, mobile-first |
| Animation | Framer Motion | Smooth, declarative animations |
| Camera | react-webcam | Simple, well-maintained |
| ML Inference | TensorFlow.js | Browser-native ML, good performance |
| State | React Context + useReducer | Simple, no extra deps for this scale |
| Haptics | Navigator Vibrate API | Native browser API, works on mobile |
| Storage | localStorage | Simple, sufficient for prototype |
| Deployment | Railway | Existing infrastructure |

### 3.3 Core Interfaces

```typescript
// profiles/types.ts

export interface ObjectProfile {
  id: string;
  displayName: string;
  angles: AngleDefinition[];
  model: ModelConfig;
  detection: DetectionConfig;
  captureFlow: 'sequential' | 'freeform' | 'checklist';
  requiredAngles: string[];
  optionalAngles?: string[];
  ui: UIConfig;
}

export interface AngleDefinition {
  id: string;
  displayName: string;
  description: string;
  detection: {
    type: 'classification';
    classIndex: number;
  };
  guideSvg: string;
  guideInstructions: string;
}

export interface ModelConfig {
  type: 'tfjs' | 'tflite' | 'mediapipe';
  path: string;
  inputSize: [number, number];
  labels: string[];
}

export interface DetectionConfig {
  confidenceThreshold: number;  // 0-1
  minFramesForCapture: number;  // Consecutive frames needed
  manualCaptureDelay: number;   // Seconds before manual button appears
}

export interface UIConfig {
  overlays: Record<string, string>;
  theme?: Partial<CaptureTheme>;
  animations?: {
    success?: string;
    celebration?: string;
  };
}

// core/capture/types.ts

export type CaptureState =
  | { status: 'idle' }
  | { status: 'detecting'; confidence: number; framesAtThreshold: number }
  | { status: 'locked'; confidence: number }
  | { status: 'capturing' }
  | { status: 'captured'; imageData: string };

export interface CaptureSessionState {
  currentAngleIndex: number;
  captures: Map<string, CapturedImage>;
  sessionStartTime: Date;
}

export interface CapturedImage {
  angleId: string;
  imageDataUrl: string;
  confidence: number;
  wasManual: boolean;
  timestamp: Date;
}

// core/ml/types.ts

export interface InferenceResult {
  predictions: ClassPrediction[];
  inferenceTime: number;
}

export interface ClassPrediction {
  classIndex: number;
  className: string;
  confidence: number;
}
```

### 3.4 Key Components

#### 3.4.1 CameraProvider
```typescript
// core/camera/CameraProvider.tsx

interface CameraContextValue {
  videoRef: RefObject<HTMLVideoElement>;
  isReady: boolean;
  error: Error | null;
  captureFrame: () => ImageData | null;
}

// Wraps react-webcam with frame capture utilities
// Handles permissions, errors, and camera lifecycle
```

#### 3.4.2 useInference Hook
```typescript
// core/ml/useInference.ts

interface UseInferenceOptions {
  modelPath: string;
  inputSize: [number, number];
  labels: string[];
}

interface UseInferenceReturn {
  isLoading: boolean;
  error: Error | null;
  predict: (imageData: ImageData) => Promise<InferenceResult>;
}

// Loads TFJS model, provides prediction function
// Handles model lifecycle and cleanup
```

#### 3.4.3 useCaptureSession Hook
```typescript
// core/capture/useCaptureSession.ts

interface UseCaptureSessionOptions {
  profile: ObjectProfile;
  onAngleCapture: (capture: CapturedImage) => void;
  onSessionComplete: (captures: CapturedImage[]) => void;
}

interface UseCaptureSessionReturn {
  state: CaptureSessionState;
  currentAngle: AngleDefinition;
  captureState: CaptureState;
  processFrame: (imageData: ImageData) => void;
  manualCapture: () => void;
  retakeAngle: (angleId: string) => void;
  skipAngle: () => void;
  goBack: () => void;
}

// Orchestrates the entire capture flow
// State machine for detection → capture transitions
```

#### 3.4.4 ConfidenceRing Component
```typescript
// core/ui/overlays/ConfidenceRing.tsx

interface ConfidenceRingProps {
  confidence: number;  // 0-1
  isLocked: boolean;
  size?: number;
  strokeWidth?: number;
}

// Animated SVG circle that fills based on confidence
// Color interpolation: blue → yellow → green
// Framer Motion for smooth animations
```

#### 3.4.5 GuideOverlay Component
```typescript
// core/ui/overlays/GuideOverlay.tsx

interface GuideOverlayProps {
  svgPath: string;
  isActive: boolean;
  confidence: number;
}

// Renders the silhouette SVG
// Opacity/color changes based on confidence
// Subtle pulse animation when detecting
```

---

## 4. ML Model Integration

### 4.1 Model Specification

| Property | Value |
|----------|-------|
| Architecture | MobileNetV3-Small |
| Input Size | 224 x 224 x 3 |
| Output | 8 classes (softmax) |
| Format | TensorFlow.js (model.json + weights.bin) |
| Size Target | < 10MB |

### 4.2 Class Labels (Order Matters)

```typescript
const SNEAKER_ANGLE_LABELS = [
  'top-down',    // index 0
  'sole',        // index 1
  'heel',        // index 2
  'toe',         // index 3
  'side-left',   // index 4
  'side-right',  // index 5
  'size-tag',    // index 6
  'box',         // index 7
];
```

### 4.3 Inference Pipeline

```
Camera Frame (any size)
        │
        ▼
┌──────────────────┐
│  Resize to       │
│  224 x 224       │
└──────────────────┘
        │
        ▼
┌──────────────────┐
│  Normalize       │
│  [0, 255] → [0, 1]  │
└──────────────────┘
        │
        ▼
┌──────────────────┐
│  TFJS Model      │
│  Inference       │
└──────────────────┘
        │
        ▼
┌──────────────────┐
│  Softmax Output  │
│  8 probabilities │
└──────────────────┘
        │
        ▼
┌──────────────────┐
│  Find Target     │
│  Angle Conf      │
└──────────────────┘
```

### 4.4 Placeholder Model

Until real training data is provided, use a **placeholder model** that:
1. Returns random confidence values (for UI testing)
2. Has correct input/output shape
3. Can be swapped for real model without code changes

```typescript
// Placeholder implementation
class PlaceholderModel {
  async predict(imageData: ImageData): Promise<number[]> {
    // Simulate inference delay
    await new Promise(r => setTimeout(r, 50));

    // Return random probabilities that sum to 1
    const raw = Array(8).fill(0).map(() => Math.random());
    const sum = raw.reduce((a, b) => a + b);
    return raw.map(v => v / sum);
  }
}
```

### 4.5 Training Data (AVAILABLE)

Training data has been collected and is ready for model training.

**Location:** `training-data/sneaker-training-data/`

**Dataset Summary:**
| Folder | Count | Format Distribution |
|--------|-------|---------------------|
| `top-down/` | 299 | Mixed (JPEG, HEIC, PNG) |
| `sole/` | 299 | Mixed |
| `heel/` | 299 | Mixed |
| `toe/` | 299 | Mixed |
| `side-left/` | 299 | Mixed |
| `side-right/` | 299 | Mixed |
| `size-tag/` | 299 | Mixed |
| `box/` | 598 | Mixed |
| **Total** | **2,691** | 1,674 JPG, 841 HEIC, 156 PNG, 10 WebP, 9 DNG, 1 AVIF |

**Preprocessing Required:**
The training pipeline must convert all images to a consistent format:
1. Convert HEIC, WebP, DNG, AVIF to JPEG/PNG
2. Resize to 224x224 (or preserve aspect ratio with padding)
3. Normalize pixel values

**Training Pipeline:**
1. Run preprocessing script to normalize formats
2. Split data: 80% train, 10% validation, 10% test
3. Train MobileNetV3-Small with transfer learning
4. Export to TFJS format
5. Place in `public/models/sneaker-angles/`

**Database Angle Mapping (for reference):**
| Database `type` | Training Folder |
|-----------------|-----------------|
| `top` | `top-down/` |
| `bottom` | `sole/` |
| `back` | `heel/` |
| `front` | `toe/` |
| `inner` | `side-left/` |
| `outer` | `side-right/` |
| `sizeLabel` | `size-tag/` |
| `boxFront`, `boxBack` | `box/` |

---

## 5. State Management

### 5.1 Application State

```typescript
// Global app state (React Context)

interface AppState {
  // Current profile
  profile: ObjectProfile;

  // Capture session
  session: {
    isActive: boolean;
    currentAngleIndex: number;
    captures: Map<string, CapturedImage>;
    startTime: Date | null;
  };

  // UI state
  ui: {
    showOnboarding: boolean;
    manualCaptureEnabled: boolean;
  };
}
```

### 5.2 Capture State Machine

```
                    ┌─────────┐
                    │  IDLE   │
                    └────┬────┘
                         │ start session
                         ▼
              ┌──────────────────────┐
              │     DETECTING        │◀──────────────┐
              │  (confidence < 0.75) │               │
              └──────────┬───────────┘               │
                         │ confidence >= 0.75        │
                         ▼                           │
              ┌──────────────────────┐               │
              │      LOCKED          │               │
              │  (3 frames stable)   │               │
              └──────────┬───────────┘               │
                         │ frames >= 3 OR manual     │ confidence drops
                         ▼                           │
              ┌──────────────────────┐               │
              │     CAPTURING        │               │
              │  (freeze + animate)  │               │
              └──────────┬───────────┘               │
                         │ complete                  │
                         ▼                           │
              ┌──────────────────────┐               │
              │     CAPTURED         │───────────────┘
              │  (save + next angle) │   next angle
              └──────────────────────┘
```

---

## 6. Performance Requirements

### 6.1 Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| Frame processing | < 200ms | Time from frame capture to UI update |
| Model inference | < 150ms | TFJS prediction time |
| Camera FPS | 15 | Frames per second to process (throttled) |
| Time to interactive | < 3s | Landing page load to camera ready |
| Model load time | < 2s | Time to load TFJS model |

### 6.2 Optimization Strategies

1. **Throttle inference:** Process every 2nd or 3rd frame (10-15 FPS effective)
2. **Web Workers:** Run inference off main thread if needed
3. **Model quantization:** Use int8 if size/speed becomes issue
4. **Lazy loading:** Load model after camera permission granted

---

## 7. Error Handling

### 7.1 Error States

| Error | User Message | Recovery |
|-------|--------------|----------|
| Camera permission denied | "Camera access is required" | Show instructions to enable |
| Camera not found | "No camera detected" | Suggest trying another device |
| Model load failed | "Having trouble loading" | Retry button |
| Inference timeout | (silent) | Skip frame, continue |
| Storage full | "Cannot save photos" | Suggest clearing space |

### 7.2 Graceful Degradation

If ML inference fails repeatedly:
1. Show warning toast
2. Enable manual-only capture mode
3. Continue capturing without auto-detection

---

## 8. Testing Strategy

### 8.1 Manual Testing Checklist

- [ ] Camera permission flow (grant, deny, revoke)
- [ ] All 8 angles capture correctly
- [ ] Confidence ring animates smoothly
- [ ] Auto-capture triggers at threshold
- [ ] Manual capture works after 7 seconds
- [ ] Review screen shows all captures
- [ ] Retake flow works
- [ ] Skip optional angle works
- [ ] Success screen celebration plays
- [ ] Works on mobile Safari
- [ ] Works on mobile Chrome
- [ ] Works on desktop (for development)

### 8.2 Device Testing

Priority devices:
1. iPhone (Safari) - primary target
2. Android (Chrome) - secondary target
3. Desktop Chrome - development

---

## 9. Deployment

### 9.1 Railway Configuration

```yaml
# railway.toml
[build]
  builder = "nixpacks"

[deploy]
  startCommand = "npm start"
  healthcheckPath = "/"
  healthcheckTimeout = 300

[[services]]
  name = "smart-capture-web"

[services.env]
  NODE_ENV = "production"
```

### 9.2 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_MODEL_PATH` | Path to TFJS model | Yes |
| `NEXT_PUBLIC_GA_ID` | Google Analytics (optional) | No |

### 9.3 Deployment Checklist

- [ ] Model files in `public/models/`
- [ ] Environment variables set
- [ ] HTTPS enabled (required for camera)
- [ ] Test on mobile device via Railway URL

---

## 10. Implementation Phases

### Phase 1: Foundation (Core + Placeholder)
**Goal:** Full UX flow working with placeholder model

**Tasks:**
1. Initialize Next.js project with Tailwind
2. Create project structure
3. Implement CameraProvider with react-webcam
4. Build placeholder model adapter
5. Create ObjectProfile types and sneaker profile
6. Build ConfidenceRing component
7. Build GuideOverlay component
8. Create silhouette SVGs for all 8 angles
9. Implement useCaptureSession hook
10. Build all screens (Landing → Success)
11. Add Framer Motion animations
12. Add haptic feedback
13. Deploy to Railway

**Deliverable:** Working prototype with fake ML, full UX testable on mobile

### Phase 2: Model Training & Integration ✅ COMPLETE
**Goal:** Real ML model trained and integrated

**Status:** ✅ Completed 2024-12-22

**Results:**
- Model: MobileNetV3-Small v2 (two-phase training)
- Accuracy: 72% overall (val_accuracy)
- Size: 4.44 MB (TFJS export)
- Location: `public/models/sneaker-angles/`

**Key Learnings Applied:**
1. **Normalization:** Must use `[0,1]` range (divide by 255), not `[-1,1]`
2. **Confidence threshold:** Lowered to 0.55 (from 0.75) for 72% model
3. **Frame rate:** 15 FPS is sufficient for smooth UX
4. **Manual capture delay:** 5s works better than 7s

**Training Scripts Created:**
- `scripts/training/preprocess.py` - HEIC → JPEG conversion
- `scripts/training/split_dataset.py` - Train/val split
- `scripts/training/train_v2.py` - Two-phase training
- `scripts/training/evaluate.py` - Per-class metrics
- `scripts/training/export_tfjs.py` - TFJS export

**Deliverable:** ✅ Working prototype with real ML detection

### Phase 3: Polish
**Goal:** Production-ready prototype

**Tasks:**
1. Performance optimization
2. Error handling edge cases
3. Loading states and transitions
4. Accessibility improvements
5. Final visual polish
6. Documentation

**Deliverable:** Polished prototype ready for user testing

---

## 11. Success Criteria

### 11.1 Functional
- [ ] User can complete full 7-angle capture session
- [ ] Auto-capture triggers correctly when angle matches
- [ ] Manual capture fallback works after 7 seconds
- [ ] Review and retake flow works
- [ ] Works on iPhone Safari
- [ ] Works on Android Chrome

### 11.2 Quality
- [ ] UI feels responsive (< 200ms feedback)
- [ ] Animations are smooth (60fps)
- [ ] No visual glitches during capture
- [ ] Clear user guidance throughout

### 11.3 Technical
- [ ] Model accuracy > 70% overall (current: 72% with MobileNetV3-Small v2)
- [ ] False positive rate < 10%
- [ ] Page loads in < 3 seconds
- [ ] Model loads in < 2 seconds

---

## 12. Open Questions / Dependencies

### 12.1 Resolved
- ~~**Training Data:**~~ ✅ **RESOLVED** - 2,691 images collected in `training-data/sneaker-training-data/`

### 12.2 To Be Determined
- Final silhouette designs (can start with simple outlines)
- Exact Lottie animations (can use placeholder or LottieFiles)
- Brand colors (using defaults, can adjust)

### 12.3 Implementation Notes
- Training data contains mixed formats (HEIC, PNG, WebP, DNG, AVIF) - preprocessing script needed
- Box angle has 2x images (598) compared to other angles (299 each) - may need to balance or weight during training

### 12.4 Future Considerations
- Offline mode (service worker)
- Image upload flow (alternative to camera)
- Analytics/telemetry
- A/B testing framework

---

## 13. References

- Ideation Document: `docs/ideation/sneaker-angle-capture-system.md`
- Training Data Spec: `docs/data-requirements/sneaker-training-data-spec.md`
- TensorFlow.js Docs: https://www.tensorflow.org/js
- Framer Motion: https://www.framer.com/motion/
- react-webcam: https://github.com/mozmorris/react-webcam
