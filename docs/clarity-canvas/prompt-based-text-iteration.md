  ---
  Technical Summary: Prompt-Based Text Editing via LLM Refinement

  Core Concept

  Instead of a traditional "edit text in a textarea" flow, the user describes what they want changed in natural language, and an LLM applies the edit. The system maintains a version history so users can
  browse/restore previous iterations.

  ---
  Architecture (3 layers)

  1. Data Model

  You need three fields on the entity being edited:

  | Field           | Type    | Purpose                                          |
  |-----------------|---------|--------------------------------------------------|
  | message         | String? | Current active text                              |
  | messageVersions | Json?   | Array of { version, content, source, createdAt } |
  | messageSource   | String? | 'generated' / 'manual' / 'refined'               |

  Version history is capped at 10 entries (.slice(-10)), each tagged with how it was produced.

  2. Backend — Two Endpoints

  Generate (POST /opening-message/preview):
  - Gathers domain context (documents, profile data, audience info)
  - Builds a rich prompt with specifics ("reference actual section names")
  - Calls gpt-4o with temperature: 0.7, max_tokens: 400
  - Enforces character limit in 3 stages: (1) system instruction, (2) condensation re-prompt at temp: 0.3, (3) truncation at last sentence boundary

  Refine (POST /opening-message/refine-preview):
  - Takes { currentMessage, prompt } in the request body
  - Simple system prompt: "You refine opening messages. Keep markdown. Stay under 900 chars."
  - User message: "Current message:\n{currentMessage}\n\nRefinement request: {prompt}"
  - gpt-4o, temperature: 0.7, max_tokens: 500
  - Returns the refined text; client adds it to version history

  The refinement prompt pattern is the key portable piece:

  System: You are an expert at refining [THING].
          Maintain formatting. Keep it concise.
          Stay under [LIMIT] characters.

  User:   Current [THING]:
          {currentText}

          Refinement request: {userPrompt}

  3. Frontend — Component State Machine

  The UI has 4 states:

  EMPTY → (Generate / Write Custom) → PREVIEW → (Edit / Refine / Regenerate) → PREVIEW
                                          ↕
                                      EDIT MODE (textarea)
                                          ↕
                                      HISTORY (restore any version)

  Key behaviors:
  - Generate: calls generate endpoint, adds version with source: 'generated'
  - Refine input: always-visible text field below the preview ("Make it more formal…"). Calls refine endpoint, adds version with source: 'refined'
  - Manual edit: textarea fallback for direct changes, adds version with source: 'manual'
  - Version history: horizontal pill buttons labeled v1 (AI), v2 (R), v3 (M) — click to restore. Current version highlighted
  - Character counter: live count with red border when over limit

  ---
  Two-Phase Persistence Pattern

  This system uses a smart split between client-managed and server-managed state:

  | Phase                  | Storage          | When                    |
  |------------------------|------------------|-------------------------|
  | Preview (before save)  | React state only | During creation wizard  |
  | Persisted (after save) | Database         | After entity is created |

  Preview endpoints return text without writing to DB. The client accumulates versions in local state. On save, both the final message and full version array are sent to the backend in one write.

  After the entity exists, subsequent generate/refine calls update the DB directly and return the updated version array.

  ---
  Portable Recipe (for your other project)

  To add prompt-based editing to any text field:

  1. Add 3 DB fields: content, contentVersions (JSON array), contentSource
  2. Create 2 endpoints:
    - POST /generate — gathers domain context, calls LLM, returns text
    - POST /refine — takes { currentContent, prompt }, calls LLM with the refinement template above, returns text
  3. Build the UI component with:
    - Preview display (renders markdown)
    - Refine input (text field + "Apply" button)
    - Version history (pill buttons, restore on click)
    - Manual edit fallback (textarea)
  4. Version utility function:
  function addVersion(existing: Version[] | null, content: string, source: string) {
    const versions = existing || []
    return [...versions, {
      version: versions.length + 1,
      content, source,
      createdAt: new Date().toISOString()
    }].slice(-10)
  }
  5. Character limit enforcement (3 tiers): system instruction → condensation re-prompt → hard truncate at sentence boundary

  The domain-specific part is only in the generate endpoint (what context you feed the LLM). The refine endpoint and the entire frontend component are fully generic and portable.
