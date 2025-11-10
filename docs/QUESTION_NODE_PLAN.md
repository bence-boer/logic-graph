# Question Node & Statement State Implementation Plan

This document captures the implementation plan for adding a new node type `question` with active/resolved states, adding settled/debated states for axiom statement nodes, and the related UI and architecture changes to keep the project modular and extensible.

---

## Overview

This plan introduces:

1. **Question nodes** - A new node type with active/resolved states and answer linking
2. **Statement node states** - Settled/debated states for axiom nodes (statements without reasons)
3. **Extensible architecture** - A modular system that can accommodate future node types and state variations

---

## Phase 1: Type System Foundation

### 1.1 Core Type Definitions (`src/lib/types/graph.ts`)

**Changes:**
- Add `NodeType` enum (STATEMENT, QUESTION)
- Add `QuestionState` enum (ACTIVE, RESOLVED)
- Add `StatementState` enum (DEBATED, SETTLED)
- Add optional fields to `LogicNode`:
  - `type?: NodeType` (default: STATEMENT for backward compatibility)
  - `question_state?: QuestionState` (only for question nodes)
  - `statement_state?: StatementState` (only for statement nodes)
  - `answered_by?: string` (node ID - only one answer per question)
- Update validation to handle new fields
- Update imports to ensure IDs are always generated during normalization

**Rationale:**
- Optional fields maintain backward compatibility with existing graphs
- Enums provide type safety and clarity
- Single `answered_by` field enforces "one answer" constraint at the data level

---

### 1.2 Connection Type Extension (`src/lib/types/graph.ts`)

**Changes:**
- Add `ConnectionType.ANSWER` to the enum
- This represents a special type of connection between a question and its answer

**Rationale:**
- Answers are conceptually different from implications and contradictions
- Separating them allows for special handling in UI and logic
- Maintains consistency with existing connection architecture

---

## Phase 2: Utility Layer - Node Classification and State Management

### 2.1 Node Type Utilities (`src/lib/utils/node-classification.ts` - NEW FILE)

**Purpose:** Centralize all node type and state classification logic

**Functions to implement:**
- Type guards: `is_question_node(node)`, `is_statement_node(node)`
- Question state helpers: `is_active_question(node)`, `is_resolved_question(node)`, `get_question_state(node)`
- Statement state helpers: `is_axiom_node(node_id, connections)`, `is_settled_statement(node)`, `is_debated_statement(node)`, `get_statement_state(node)`
- Answer queries: `has_answer(node)`, `get_answer_node_id(node)`

**Rationale:**
- Consolidates all type/state checks in one place
- Easy to test in isolation
- Prevents duplication across components
- Makes it easy to add new node types in the future

---

### 2.2 Answer Management Utilities (`src/lib/utils/answer-management.ts` - NEW FILE)

**Purpose:** Handle all answer-related operations

**Functions to implement:**
- Linking: `link_answer(question_node_id, answer_node_id)`, `unlink_answer(question_node_id)`, `can_link_as_answer(question_node_id, answer_node_id)`
- Quick Actions: `create_and_link_answer(question_node_id, statement, details?)`
- Queries: `get_linked_answers(question_node_id, connections)`, `get_questions_for_statement(statement_node_id, connections)`

**Rationale:**
- Encapsulates complex answer linking logic
- Validates constraints (one answer per question)
- Handles connection creation/deletion automatically
- Provides reusable building blocks for UI components

---

### 2.3 Node Connection Utilities Update (`src/lib/utils/node-connections.ts`)

**Changes:**
- Add `get_node_answers()` function (for questions)
- Add `get_node_questions()` function (for statements)
- Follow same pattern as existing `get_node_reasons()`, `get_node_consequences()`, etc.

**Rationale:**
- Maintains consistency with existing connection query patterns
- Makes answer connections first-class citizens alongside other connection types

---

### 2.4 Validation Updates (`src/lib/utils/validation.ts`)

**Changes:**
- Add `validate_question_node()` function
  - Ensures question nodes have valid state
  - Validates answer references point to statement nodes
- Add `validate_statement_node()` function
  - Ensures statement nodes have valid state if set
- Update `validate_node()` to call type-specific validators
- Update `validate_connection()` to handle ANSWER connection type

**Rationale:**
- Ensures data integrity at all entry points
- Prevents invalid states from being created
- Provides clear error messages for debugging

---

## Phase 3: Visual Rendering - Node Appearance System

### 3.1 Node Styling Strategy (`src/lib/utils/node-styling.ts` - NEW FILE)

**Purpose:** Centralize all node visual appearance logic

**Function to implement:**
- `get_node_style(node, connections, is_selected, is_pinned, is_connected, is_hovered)` returning an object with background, border_color, border_width, text_color

**Styling Rules (high level):**
- Question nodes - ACTIVE
  - border: amber (e.g., `#f59e0b`) at all times
  - background: default node background
  - text: default

- Question nodes - RESOLVED
  - border: very light
  - background: very light (white/near-white)
  - text: black

- Statement nodes - DEBATED (axiom with no reason)
  - regular border

- Statement nodes - SETTLED
  - border: white

- Overrides for pinned/selected/hover states similar to current behavior

**Rationale:**
- Single source of truth for all styling logic
- Easy to adjust colors and styling in one place
- Testable in isolation
- Can be extended for future node types

---

### 3.2 Node Renderer Updates (`src/lib/components/graph/canvas/node-renderer.ts`)

**Changes:**
- Import `get_node_style()` utility
- Pass `connections` array to styling function
- Apply returned styles to node elements
- Update styling logic to use the centralized function

**Rationale:**
- Keeps renderer focused on D3/DOM manipulation
- Delegates styling decisions to utility layer
- Maintains separation of concerns

---

## Phase 4: Store Layer - State Management

### 4.1 Graph Store Updates (`src/lib/stores/graph.svelte.ts`)

**Changes:**
- Add `set_question_state(node_id, state)`
- Add `set_statement_state(node_id, state)`
- Add `set_answer(question_node_id, answer_node_id | null)`
- Add `toggle_statement_state(node_id)` (settled ↔ debated)
- Update `add_node()` to accept optional `type` parameter
- Ensure all mutations call `update_modified()`

**Rationale:**
- Provides type-safe state mutation methods
- Centralizes all state changes through the store
- Maintains existing patterns and conventions
- Makes state changes trackable and debuggable

---

## Phase 5: UI Components - Forms and Interactions

### 5.1 Create Question Form (`src/lib/components/panels/right-panel/CreateQuestionForm.svelte` - NEW FILE)

**Purpose:** Dedicated form for creating question nodes

**Features:**
- Statement input (question text)
- Details input (optional)
- Initial state selector (always starts as ACTIVE by default, but can be changed)
- Optional: Link to existing statement as immediate answer
- Uses same form structure as `CreateNodeForm.svelte`

**Rationale:**
- Keeps question creation separate from statement creation
- Provides question-specific UI elements
- Maintains consistency with existing form patterns

---

### 5.2 Edit Question Form (`src/lib/components/panels/right-panel/EditQuestionForm/` - NEW DIRECTORY)

**Structure:**
```
EditQuestionForm/
├── index.ts
├── EditQuestionForm.svelte (main orchestrator)
├── QuestionHeader.svelte (question-specific header with state badge)
├── BasicQuestionFields.svelte (statement, details)
├── QuestionStateControl.svelte (toggle active/resolved)
├── AnswerSection.svelte (manage answer)
└── LinkedStatementsSection.svelte (non-answer connections)
```

**AnswerSection.svelte features:**
- Shows current answer (if any) with special styling
- "Link Answer" button → opens selection dropdown
- "Quick Answer" button → creates new statement and links as answer
- "Mark as Answer" button next to non-answer linked statements
- "Unlink Answer" button next to current answer
- Confirmation dialog when replacing existing answer

**Rationale:**
- Follows existing pattern of `EditNodeForm/` directory structure
- Separates concerns into focused sub-components
- Each component stays under 100 lines
- Reuses patterns from existing connection sections

---

### 5.3 Edit Statement Form Updates (`src/lib/components/panels/right-panel/EditNodeForm/`)

**New Components:**
```
EditNodeForm/
├── ... (existing files)
├── StatementStateControl.svelte (NEW - toggle settled/debated for axioms)
└── QuestionsSection.svelte (NEW - shows questions this statement answers)
```

**EditNodeForm.svelte updates:**
- Import `is_axiom_node()` utility
- Conditionally render `StatementStateControl` only for axiom nodes
- Add `QuestionsSection` after contradictions section
- Follow same pattern as other connection sections

**QuestionsSection.svelte features:**
- Lists all questions where this statement is the answer
- Each item shows the question text
- Click to navigate to question
- Shows count badge

**Rationale:**
- Minimal changes to existing statement form
- Keeps new features isolated in new components
- Maintains existing component structure and patterns

---

### 5.4 Right Panel Router Updates (`src/lib/components/panels/RightPanel.svelte`)

**Changes:**
- Add `RightPanelModeType.CREATE_QUESTION`
- Add `RightPanelModeType.EDIT_QUESTION`
- Add conditional rendering for question forms

**Rationale:**
- Makes questions first-class citizens in the panel system
- Maintains existing router pattern
- Allows for question-specific UI flows

---

### 5.5 Floating Toolbar Updates (`src/lib/components/panels/FloatingToolbar/EditActions.svelte`)

**Changes:**
- Add "New Question" button alongside "New Statement"
- Opens `CREATE_QUESTION` panel mode
- Uses question mark icon (from lucide-svelte)

**Rationale:**
- Makes question creation easily discoverable
- Follows existing toolbar pattern
- Maintains visual consistency

---

## Phase 6: UI Store Updates

### 6.1 UI Store Extensions (`src/lib/stores/ui.svelte.ts`)

**Changes:**
- Add `open_create_question_form()` method
- Add `open_edit_question_form(node_id)` method
- Update panel mode state to handle question modes

**Rationale:**
- Provides programmatic access to question forms
- Maintains consistency with existing form opening methods
- Centralizes UI state management

---

## Phase 7: Testing Strategy

### 7.1 Unit Tests

**Files to create:**
- `src/lib/utils/node-classification.spec.ts`
- `src/lib/utils/answer-management.spec.ts`
- `src/lib/utils/node-styling.spec.ts`
- Update `src/lib/utils/validation.spec.ts` (if exists)

**Coverage targets:**
- Node classification: 95%+
- Answer management: 90%+
- Validation: 90%+
- Styling: 85%+

**Rationale:**
- Utilities are pure functions → easy to test
- High test coverage prevents regressions
- Tests document expected behavior

---

### 7.2 Component Tests

**Files to create:**
- `src/lib/components/panels/right-panel/CreateQuestionForm.spec.ts`
- `src/lib/components/panels/right-panel/EditQuestionForm/EditQuestionForm.spec.ts`
- `src/lib/components/panels/right-panel/EditQuestionForm/AnswerSection.spec.ts`

**Test scenarios:**
- Creating questions with various initial states
- Linking/unlinking answers
- Quick answer creation
- Answer replacement confirmation
- State transitions

**Rationale:**
- Ensures UI components work correctly
- Catches integration issues
- Documents component usage

---

## Phase 8: Migration and Backward Compatibility

### 8.1 Graph Import Normalization (`src/lib/utils/import.ts`)

**Changes:**
- Add `normalize_node_types()` function
  - Sets `type: NodeType.STATEMENT` for nodes without type field
  - Ensures all nodes have a valid type
- Call normalization during graph import
- Add migration path for old graphs

**Rationale:**
- Existing graphs will continue to work
- No manual migration required
- Graceful handling of legacy data

---

### 8.2 Validation Updates

**Changes:**
- Make new fields optional in validation
- Provide sensible defaults for missing fields
- Add warnings (not errors) for legacy data

**Rationale:**
- Don't break existing functionality
- Guide users to use new features without forcing them
- Allows gradual adoption

---

## Phase 9: Documentation

### 9.1 Code Documentation

**Requirements:**
- JSDoc for all new utility functions
- JSDoc for all new components (at file level)
- Inline comments for complex logic
- Examples in JSDoc comments

**Rationale:**
- Self-documenting code
- Easier onboarding for future developers
- Clear API contracts

---

### 9.2 User Documentation

**Files to update:**
- `README.md` - Add section on node types
- Create `docs/NODE_TYPES.md` - Detailed guide on question vs statement nodes
- Create `docs/ANSWER_MANAGEMENT.md` - Guide on linking answers

**Rationale:**
- Users need to understand new features
- Reduces support burden
- Encourages feature adoption

---

## Implementation Order

**Priority 1 (Foundation):**
1. Phase 1: Type System Foundation
2. Phase 2: Utility Layer
3. Phase 8.1: Import Normalization

**Priority 2 (Core Features):**
4. Phase 3: Visual Rendering
5. Phase 4: Store Layer

**Priority 3 (User Interface):**
6. Phase 5.1-5.2: Question Forms
7. Phase 5.3: Statement Form Updates
8. Phase 5.4-5.5: Panel Router and Toolbar

**Priority 4 (Quality):**
9. Phase 6: UI Store Updates
10. Phase 7: Testing
11. Phase 9: Documentation

---

## Potential Challenges and Mitigations

### Challenge 1: Component Size
**Risk:** Edit forms might exceed line limits with all new features

**Mitigation:**
- Use directory structure for complex components
- Extract sub-components aggressively
- Keep main form as orchestrator only

### Challenge 2: Styling Complexity
**Risk:** Node styling logic could become unwieldy

**Mitigation:**
- Centralize in `node-styling.ts`
- Use clear priority rules
- Document styling precedence

### Challenge 3: State Transitions
**Risk:** Complex state transition rules might be unclear

**Mitigation:**
- Document state machine in utilities
- Add validation at transition points
- Provide clear error messages

### Challenge 4: Answer Constraint Enforcement
**Risk:** Multiple answers could be created accidentally

**Mitigation:**
- Enforce at data layer (`answered_by` field)
- Validate before linking
- Show confirmation dialog when replacing

---

## Success Criteria

### Functional Requirements Met
- ✅ Question nodes can be created
- ✅ Questions have active/resolved states
- ✅ Answers can be linked/unlinked
- ✅ Only one answer per question (enforced)
- ✅ Quick answer creation works
- ✅ Confirmation dialog on answer replacement
- ✅ Active questions have amber borders
- ✅ Resolved questions are white/light with black text
- ✅ Axiom statements can be settled/debated
- ✅ Settled axioms have white borders
- ✅ Questions section appears in statement edit forms

### Technical Requirements Met
- ✅ No component exceeds line limits
- ✅ All utilities have JSDoc
- ✅ No `any` types used
- ✅ Test coverage targets met
- ✅ Backward compatibility maintained
- ✅ Architecture is extensible

### Quality Requirements Met
- ✅ Code follows project conventions
- ✅ Naming is consistent
- ✅ Performance is acceptable
- ✅ No tech debt introduced

---

## Conclusion

This plan provides a clear, structured approach to implementing question nodes and statement states while maintaining code quality and extensibility. The modular architecture ensures that future additions (new node types, states, or connection types) can be added with minimal refactoring.

The plan prioritizes:
1. **Type safety** - Everything is properly typed
2. **Separation of concerns** - Logic is separated from presentation
3. **Testability** - Pure functions and isolated components
4. **Maintainability** - Clear patterns and documentation
5. **Extensibility** - Easy to add new features

By following this plan, the codebase will remain clean, maintainable, and aligned with the tech debt prevention rules.
