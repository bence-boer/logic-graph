# Architecture Redesign and Implementation Plan

**Generated:** November 11, 2025  
**Based on:** MISSING_BEHAVIORS.md analysis and current codebase examination

---

## Executive Summary

This document outlines a comprehensive architectural redesign to implement the 62 missing behaviors identified in `MISSING_BEHAVIORS.md`. Rather than implementing each feature in isolation, we propose a unified event-driven architecture that centralizes interaction handling, state management, and behavior composition.

**Key Goals:**

1. **Unify interaction patterns** - Single source of truth for all user interactions
2. **Declarative behavior composition** - Define behaviors through configuration, not imperative code
3. **Eliminate code duplication** - Central abstractions for common patterns
4. **Improve maintainability** - Clear separation of concerns and data flow
5. **Enable extensibility** - Easy to add new interactions and behaviors

---

## Current Architecture Analysis

### Strengths

- ✅ Clean store separation (graph, ui, selection, toast, loading)
- ✅ Type-safe graph data model
- ✅ Extracted utility functions for calculations
- ✅ Component-based UI structure
- ✅ D3 force simulation integration

### Weaknesses

- ❌ **Scattered interaction handling** - Events handled in components, canvas, forms
- ❌ **Imperative state updates** - Direct store mutations throughout codebase
- ❌ **Duplicated patterns** - Form validation, connection creation, node updates repeated
- ❌ **No unified command/action layer** - Actions mixed with UI logic
- ❌ **Limited undo/redo capability** - No history tracking infrastructure
- ❌ **Inconsistent feedback** - Toast messages hardcoded, no centralized notification strategy
- ❌ **No animation framework** - Animations would require per-component implementation
- ❌ **Keyboard shortcuts scattered** - Defined separately from actual actions
- ❌ **No gesture abstraction** - Touch/mouse events handled separately

---

## New Architecture: Event-Driven Command System

### Core Concept

All user interactions flow through a centralized **Command System** that:

1. Receives interaction events (click, key, gesture)
2. Maps events to commands (semantic actions)
3. Validates commands against current state
4. Executes commands with side effects
5. Records history for undo/redo
6. Emits feedback (toasts, animations, state changes)

### Architecture Layers

```
┌──────────────────────────────────────────────────────────────┐
│                    Presentation Layer                         │
│  (Components, Canvas, Forms - Pure Presentational)            │
│  - Emit interaction events                                    │
│  - Subscribe to state changes                                 │
│  - Declarative rendering only                                 │
└───────────────────────────┬──────────────────────────────────┘
                            │
                            │ Interaction Events
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                   Interaction Layer                           │
│  - Event Router (maps events to commands)                     │
│  - Gesture Manager (unified touch/mouse/keyboard)             │
│  - Interaction Contexts (canvas, form, panel)                 │
└───────────────────────────┬──────────────────────────────────┘
                            │
                            │ Commands
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                     Command Layer                             │
│  - Command Registry (all available commands)                  │
│  - Command Validator (can execute? preconditions)             │
│  - Command Executor (performs action)                         │
│  - Command History (undo/redo stack)                          │
└───────────────────────────┬──────────────────────────────────┘
                            │
                            │ State Mutations
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                      Domain Layer                             │
│  - Stores (graph, ui, selection)                              │
│  - Domain Logic (validation, calculations)                    │
│  - Side Effect Handlers (toasts, animations)                  │
└──────────────────────────────────────────────────────────────┘
```

---

## Domain Model: Commands

### Command Interface

```typescript
interface Command<PayloadData = void, ResultData = void> {
    /** Unique command identifier */
    type: string;

    /** Command category for grouping */
    category: CommandCategory;

    /** Human-readable description */
    description: string;

    /** Input validation schema */
    validate?: (payload: PayloadData, context: CommandContext) => ValidationResult;

    /** Execute the command */
    execute: (payload: PayloadData, context: CommandContext) => Promise<CommandResult<ResultData>>;

    /** Undo the command (optional) */
    undo?: (result: ResultData, context: CommandContext) => Promise<void>;

    /** Metadata for UI, keyboard shortcuts, etc. */
    metadata: CommandMetadata;
}

enum CommandCategory {
    GraphMutation = 'graph_mutation', // Create, update, delete nodes/connections
    Navigation = 'navigation', // Pan, zoom, recenter
    Selection = 'selection', // Select, deselect
    UiControl = 'ui_control', // Open/close panels, modals
    FileOperation = 'file_operation', // Import, export
    ViewControl = 'view_control' // Layout, filter, search
}

interface CommandContext {
    /** Current graph state */
    graph: LogicGraph;

    /** Current selection */
    selection: Selection | null;

    /** Current UI state */
    ui: UIState;

    /** User preferences */
    preferences: UserPreferences;

    /** Abort signal for cancellable commands */
    signal?: AbortSignal;
}

interface CommandResult<ResultData = void> {
    /** Was the command successful? */
    success: boolean;

    /** Result data (for undo, for chaining) */
    data?: ResultData;

    /** Error message if failed */
    error?: string;

    /** Side effects to emit */
    effects?: CommandEffect[];
}

enum CommandEffectType {
    Toast = 'toast',
    Animation = 'animation',
    Sound = 'sound',
    Navigation = 'navigation'
}

interface CommandEffect<EffectPayload = Record<string, never>> {
    type: CommandEffectType;
    payload: EffectPayload;
}
```

### Command Registry

All commands are registered in a central registry:

```typescript
const COMMAND_REGISTRY: Record<string, Command> = {
    // Graph mutation commands
    'graph.node.create': CreateNodeCommand,
    'graph.node.update': UpdateNodeCommand,
    'graph.node.delete': DeleteNodeCommand,
    'graph.node.pin': PinNodeCommand,
    'graph.node.unpin': UnpinNodeCommand,
    'graph.connection.create': CreateConnectionCommand,
    'graph.connection.delete': DeleteConnectionCommand,
    'graph.answer.link': LinkAnswerCommand,
    'graph.answer.unlink': UnlinkAnswerCommand,

    // Navigation commands
    'nav.pan': PanCanvasCommand,
    'nav.zoom.in': ZoomInCommand,
    'nav.zoom.out': ZoomOutCommand,
    'nav.zoom.reset': ResetZoomCommand,
    'nav.recenter': RecenterViewCommand,
    'nav.node.focus': FocusNodeCommand,

    // Selection commands
    'selection.set': SetSelectionCommand,
    'selection.clear': ClearSelectionCommand,
    'selection.toggle': ToggleSelectionCommand,

    // UI control commands
    'ui.panel.left.toggle': ToggleLeftPanelCommand,
    'ui.panel.right.open': OpenRightPanelCommand,
    'ui.panel.right.close': CloseRightPanelCommand,
    'ui.modal.help.open': OpenHelpModalCommand,
    'ui.modal.export.open': OpenExportModalCommand,
    'ui.modal.import.open': OpenImportModalCommand,

    // File operation commands
    'file.import': ImportGraphCommand,
    'file.export': ExportGraphCommand,
    'file.new': NewGraphCommand,
    'file.clear': ClearGraphCommand,
    'file.sample.load': LoadSampleDataCommand,

    // History commands
    'history.undo': UndoCommand,
    'history.redo': RedoCommand
};
```

---

## Interaction System: Event → Command Mapping

### Interaction Definitions

Interactions are declaratively defined mappings from user events to commands:

```typescript
interface InteractionDefinition<EventData = MouseEvent | KeyboardEvent | TouchEvent> {
    /** Unique interaction ID */
    id: string;

    /** Which contexts this interaction is active in */
    contexts: InteractionContext[];

    /** Event matcher */
    matcher: EventMatcher;

    /** Command to execute */
    command: string;

    /** Payload mapper (extract data from event) */
    payload_mapper?: (event: EventData) => CommandPayload;

    /** Preconditions (can this interaction fire?) */
    preconditions?: InteractionPrecondition[];

    /** Priority (higher = checked first) */
    priority?: number;
}

type CommandPayload = Record<
    string,
    string | number | boolean | null | CommandPayload | CommandPayload[]
>;

enum InteractionContext {
    Canvas = 'canvas', // On graph canvas
    Node = 'node', // On specific node
    Connection = 'connection', // On specific connection
    PanelLeft = 'panel.left', // In left panel
    PanelRight = 'panel.right', // In right panel
    Form = 'form', // In any form
    Modal = 'modal', // In any modal
    Global = 'global' // Anywhere in app
}

enum EventMatcherType {
    Click = 'click',
    DoubleClick = 'dblclick',
    KeyDown = 'keydown',
    Gesture = 'gesture',
    Hover = 'hover',
    Drag = 'drag'
}

interface EventMatcher {
    type: EventMatcherType;

    /** For keyboard events */
    key?: string;
    modifiers?: KeyModifiers;

    /** For gesture events */
    gesture?: GestureType;

    /** For pointer events */
    button?: number;

    /** CSS selector for target element (optional) */
    target?: string;
}

enum GestureType {
    Tap = 'tap',
    DoubleTap = 'double_tap',
    LongPress = 'long_press',
    SwipeLeft = 'swipe_left',
    SwipeRight = 'swipe_right',
    PinchIn = 'pinch_in',
    PinchOut = 'pinch_out',
    Pan = 'pan'
}

enum InteractionPreconditionType {
    HasSelection = 'has_selection',
    NoSelection = 'no_selection',
    MinNodes = 'min_nodes',
    Custom = 'custom'
}

interface InteractionPrecondition<ContextData = InteractionContext> {
    type: InteractionPreconditionType;
    value?: number | string | boolean;
    check?: (context: ContextData) => boolean;
}
```

### Example Interaction Definitions

```typescript
const INTERACTIONS: InteractionDefinition[] = [
    // Double-click node to pin/unpin
    {
        id: 'node.pin_toggle',
        contexts: [InteractionContext.Node],
        matcher: { type: EventMatcherType.DoubleClick },
        command: 'graph.node.pin.toggle',
        payload_mapper: (event: MouseEvent) => ({
            node_id: (event.target as HTMLElement).dataset.nodeId
        }),
        priority: 10
    },

    // Long press on mobile to pin
    {
        id: 'node.pin_toggle.mobile',
        contexts: [InteractionContext.Node],
        matcher: { type: EventMatcherType.Gesture, gesture: GestureType.LongPress },
        command: 'graph.node.pin.toggle',
        payload_mapper: (event: TouchEvent) => ({
            node_id: (event.target as HTMLElement).dataset.nodeId
        }),
        priority: 10
    },

    // Keyboard: A key to add statement
    {
        id: 'keyboard.add_statement',
        contexts: [InteractionContext.Global],
        matcher: { type: EventMatcherType.KeyDown, key: 'a' },
        command: 'ui.panel.right.open',
        payload_mapper: () => ({ mode: 'create_statement' }),
        preconditions: [{ type: InteractionPreconditionType.Custom }], // no_modal
        priority: 5
    },

    // Keyboard: Q key to add question
    {
        id: 'keyboard.add_question',
        contexts: [InteractionContext.Global],
        matcher: { type: EventMatcherType.KeyDown, key: 'q' },
        command: 'ui.panel.right.open',
        payload_mapper: () => ({ mode: 'create_question' }),
        preconditions: [{ type: InteractionPreconditionType.Custom }], // no_modal
        priority: 5
    },

    // Keyboard: + to zoom in
    {
        id: 'keyboard.zoom_in',
        contexts: [InteractionContext.Canvas, InteractionContext.Global],
        matcher: { type: EventMatcherType.KeyDown, key: '+' },
        command: 'nav.zoom.in',
        priority: 5
    },

    // Keyboard: - to zoom out
    {
        id: 'keyboard.zoom_out',
        contexts: [InteractionContext.Canvas, InteractionContext.Global],
        matcher: { type: EventMatcherType.KeyDown, key: '-' },
        command: 'nav.zoom.out',
        priority: 5
    },

    // Keyboard: 0 to reset zoom
    {
        id: 'keyboard.zoom_reset',
        contexts: [InteractionContext.Canvas, InteractionContext.Global],
        matcher: { type: EventMatcherType.KeyDown, key: '0' },
        command: 'nav.zoom.reset',
        priority: 5
    },

    // Keyboard: F to recenter
    {
        id: 'keyboard.recenter',
        contexts: [InteractionContext.Global],
        matcher: { type: EventMatcherType.KeyDown, key: 'f' },
        command: 'nav.recenter',
        priority: 5
    },

    // Keyboard: Space + drag to pan
    {
        id: 'keyboard.pan_mode',
        contexts: [InteractionContext.Canvas],
        matcher: { type: EventMatcherType.Drag, modifiers: { space: true } },
        command: 'nav.pan',
        payload_mapper: (event: DragEvent) => ({
            delta: { x: event.movementX, y: event.movementY }
        }),
        priority: 10
    },

    // Click canvas to deselect
    {
        id: 'canvas.deselect',
        contexts: [InteractionContext.Canvas],
        matcher: { type: EventMatcherType.Click, target: 'svg' }, // Direct SVG, not child
        command: 'selection.clear',
        priority: 1
    },

    // Click node to select
    {
        id: 'node.select',
        contexts: [InteractionContext.Node],
        matcher: { type: EventMatcherType.Click },
        command: 'selection.set',
        payload_mapper: (event: MouseEvent) => ({
            type: 'node',
            id: (event.target as HTMLElement).dataset.nodeId
        }),
        priority: 5
    },

    // Enter in single-line input to submit form
    {
        id: 'form.submit.enter',
        contexts: [InteractionContext.Form],
        matcher: { type: EventMatcherType.KeyDown, key: 'Enter', target: 'input[type="text"]' },
        command: 'form.submit',
        priority: 5
    },

    // Ctrl+Enter in textarea to submit form
    {
        id: 'form.submit.ctrl_enter',
        contexts: [InteractionContext.Form],
        matcher: {
            type: EventMatcherType.KeyDown,
            key: 'Enter',
            modifiers: { ctrl: true },
            target: 'textarea'
        },
        command: 'form.submit',
        priority: 5
    },

    // Escape in input to blur
    {
        id: 'input.blur',
        contexts: [InteractionContext.Form],
        matcher: { type: EventMatcherType.KeyDown, key: 'Escape', target: 'input, textarea' },
        command: 'form.blur',
        priority: 10
    }
];
```

---

## State Management: Enhanced Stores

### History Store (NEW)

Enables undo/redo functionality:

```typescript
interface HistoryStore {
    /** Stack of executed commands (for undo) */
    readonly past: CommandHistoryEntry[];

    /** Stack of undone commands (for redo) */
    readonly future: CommandHistoryEntry[];

    /** Maximum history size */
    readonly max_size: number;

    /** Can we undo? */
    readonly can_undo: boolean;

    /** Can we redo? */
    readonly can_redo: boolean;

    /** Record a command execution */
    record<PayloadData, ResultData>(
        command: string,
        payload: PayloadData,
        result: ResultData
    ): void;

    /** Undo last command */
    undo(): Promise<void>;

    /** Redo last undone command */
    redo(): Promise<void>;

    /** Clear history */
    clear(): void;
}

interface CommandHistoryEntry<PayloadData = CommandPayload, ResultData = CommandPayload> {
    command: string;
    payload: PayloadData;
    result: ResultData;
    timestamp: number;
}
```

### Animation Store (NEW)

Centralized animation management:

```typescript
interface AnimationStore {
    /** Active animations */
    readonly animations: Map<string, Animation>;

    /** Animation presets */
    readonly presets: Record<AnimationType, AnimationConfig>;

    /** Start an animation */
    start(target: string, type: AnimationType, config?: Partial<AnimationConfig>): string;

    /** Stop an animation */
    stop(animation_id: string): void;

    /** Stop all animations for a target */
    stop_all(target: string): void;
}

enum AnimationType {
    FadeIn = 'fade_in',
    FadeOut = 'fade_out',
    GrowIn = 'grow_in',
    ShrinkOut = 'shrink_out',
    SlideIn = 'slide_in',
    SlideOut = 'slide_out',
    Pulse = 'pulse',
    Shake = 'shake'
}

interface AnimationConfig {
    duration: number;
    easing: EasingFunction;
    delay?: number;
    on_complete?: () => void;
}
```

### Gesture Store (NEW)

Unified gesture recognition:

```typescript
interface GestureStore {
    /** Current active gesture (if any) */
    readonly active_gesture: ActiveGesture | null;

    /** Gesture recognizers */
    readonly recognizers: GestureRecognizer[];

    /** Register a gesture handler */
    on_gesture(gesture: GestureType, handler: GestureHandler): UnsubscribeFn;

    /** Process pointer/touch events */
    process_event(event: PointerEvent | TouchEvent): void;
}

interface ActiveGesture {
    type: GestureType;
    start_time: number;
    start_position: Point;
    current_position: Point;
    data: GestureData;
}

type GestureData = Record<string, string | number | boolean | Point | Point[]>;
```

### Notification Store (Enhanced Toast Store)

Richer notification system:

```typescript
interface NotificationStore {
    /** Active notifications */
    readonly notifications: Notification[];

    /** Notification presets by command */
    readonly presets: Record<string, NotificationPreset>;

    /** Show a notification */
    show(config: NotificationConfig): string;

    /** Dismiss a notification */
    dismiss(id: string): void;

    /** Show success notification for command */
    success_for_command<ResultData extends CommandPayload>(command: string, data: ResultData): void;

    /** Show error notification for command */
    error_for_command(command: string, error: string): void;
}

interface NotificationPreset<ResultData extends CommandPayload = CommandPayload> {
    message_template: string | ((data: ResultData) => string);
    type: 'success' | 'error' | 'info' | 'warning';
    duration?: number;
    action?: NotificationAction;
}

interface NotificationAction<ActionPayload extends CommandPayload = CommandPayload> {
    label: string;
    command: string;
    payload?: ActionPayload;
}
```

---

## Form System: Declarative Form Definition

### Form Configuration

Forms are defined declaratively, not as components:

```typescript
interface FormDefinition<
    FormData extends Record<string, FormFieldValue> = Record<string, FormFieldValue>
> {
    /** Unique form ID */
    id: string;

    /** Form title */
    title: string;

    /** Field definitions */
    fields: FormField[];

    /** Validation schema */
    validation: ValidationSchema<FormData>;

    /** Submit command */
    submit_command: string;

    /** Payload mapper (transform form data to command payload) */
    payload_mapper: (data: FormData) => CommandPayload;

    /** Initial data provider (for edit forms) */
    initial_data?: (context: FormContext) => FormData;

    /** Sections for grouping fields */
    sections?: FormSection[];

    /** Actions (buttons) */
    actions: FormAction<FormData>[];
}

type FormFieldValue = string | number | boolean | null | string[] | number[];

interface FormField {
    name: string;
    label: string;
    type: FieldType;
    placeholder?: string;
    required?: boolean;
    disabled?: <FormData extends Record<string, FormFieldValue>>(data: FormData) => boolean;
    visible?: <FormData extends Record<string, FormFieldValue>>(data: FormData) => boolean;
    options?: FieldOption[];
    max_length?: number;
    validation?: FieldValidator[];
}

enum FieldType {
    Text = 'text',
    Textarea = 'textarea',
    Select = 'select',
    MultiSelect = 'multi_select',
    Checkbox = 'checkbox',
    Radio = 'radio',
    Number = 'number',
    Date = 'date',
    Custom = 'custom'
}

enum FormActionVariant {
    Primary = 'primary',
    Secondary = 'secondary',
    Danger = 'danger'
}

interface FormAction<
    FormData extends Record<string, FormFieldValue> = Record<string, FormFieldValue>
> {
    label: string;
    variant: FormActionVariant;
    command: string;
    payload_mapper?: (data: FormData) => CommandPayload;
    disabled?: (data: FormData) => boolean;
    visible?: (data: FormData) => boolean;
}
```

### Example Form Definitions

```typescript
interface CreateStatementFormData extends Record<string, FormFieldValue> {
    statement: string;
    details: string;
}

const FORM_DEFINITIONS: Record<string, FormDefinition> = {
    'form.create_statement': {
        id: 'form.create_statement',
        title: 'Create Statement',
        fields: [
            {
                name: 'statement',
                label: 'Statement',
                type: FieldType.Text,
                placeholder: 'Enter a logical statement',
                required: true,
                max_length: 100,
                validation: [
                    { type: 'required', message: 'Statement is required' },
                    { type: 'max_length', value: 100, message: 'Maximum 100 characters' }
                ]
            },
            {
                name: 'details',
                label: 'Details',
                type: FieldType.Textarea,
                placeholder: 'Additional context (optional)',
                max_length: 500,
                validation: [{ type: 'max_length', value: 500, message: 'Maximum 500 characters' }]
            }
        ],
        validation: NODE_VALIDATION_SCHEMA,
        submit_command: 'graph.node.create',
        payload_mapper: (data: CreateStatementFormData) => ({
            type: NodeType.STATEMENT,
            statement: data.statement,
            details: data.details
        }),
        actions: [
            {
                label: 'Cancel',
                variant: FormActionVariant.Secondary,
                command: 'ui.panel.right.close'
            },
            {
                label: 'Create',
                variant: FormActionVariant.Primary,
                command: 'form.submit'
            }
        ]
    } satisfies FormDefinition<CreateStatementFormData>,

    'form.edit_statement': {
        id: 'form.edit_statement',
        title: 'Edit Statement',
        fields: [
            {
                name: 'statement',
                label: 'Statement',
                type: FieldType.Text,
                required: true,
                max_length: 100
            },
            {
                name: 'details',
                label: 'Details',
                type: FieldType.Textarea,
                max_length: 500
            },
            {
                name: 'is_settled',
                label: 'Axiom State',
                type: FieldType.Checkbox,
                visible: <EditStatementFormData>(data: EditStatementFormData) =>
                    is_axiom(data.node_id)
            }
        ],
        validation: NODE_VALIDATION_SCHEMA,
        submit_command: 'graph.node.update',
        payload_mapper: (data: EditStatementFormData) => ({
            node_id: data.node_id,
            statement: data.statement,
            details: data.details,
            statement_state: data.is_settled ? StatementState.SETTLED : StatementState.DEBATED
        }),
        initial_data: (context: FormContext) => {
            const node = get_node_by_id(context.node_id);
            return {
                node_id: context.node_id,
                statement: node.statement,
                details: node.details || '',
                is_settled: node.statement_state === StatementState.SETTLED
            };
        },
        sections: [
            {
                id: 'basic',
                title: 'Basic Information',
                fields: ['statement', 'details']
            },
            {
                id: 'state',
                title: 'Axiom State',
                fields: ['is_settled'],
                visible: <EditStatementFormData>(data: EditStatementFormData) =>
                    is_axiom(data.node_id)
            },
            {
                id: 'connections',
                title: 'Connections',
                component: 'ConnectionsSectionComponent' // Custom section
            }
        ],
        actions: [
            {
                label: 'Delete',
                variant: FormActionVariant.Danger,
                command: 'graph.node.delete',
                payload_mapper: (data: EditStatementFormData) => ({ node_id: data.node_id })
            },
            {
                label: 'Pin',
                variant: FormActionVariant.Secondary,
                command: 'graph.node.pin.toggle',
                payload_mapper: (data: EditStatementFormData) => ({ node_id: data.node_id }),
                visible: (data: EditStatementFormData) => !is_pinned(data.node_id)
            },
            {
                label: 'Unpin',
                variant: FormActionVariant.Secondary,
                command: 'graph.node.unpin',
                payload_mapper: (data: EditStatementFormData) => ({ node_id: data.node_id }),
                visible: (data: EditStatementFormData) => is_pinned(data.node_id)
            },
            {
                label: 'Close',
                variant: FormActionVariant.Secondary,
                command: 'ui.panel.right.close'
            },
            {
                label: 'Save',
                variant: FormActionVariant.Primary,
                command: 'form.submit',
                disabled: (data: EditStatementFormData) => !has_changes(data)
            }
        ]
    } satisfies FormDefinition<EditStatementFormData>
};

interface EditStatementFormData extends Record<string, FormFieldValue> {
    node_id: string;
    statement: string;
    details: string;
    is_settled: boolean;
}
```

---

## File Structure: New Organization

```
src/lib/
├── commands/                      # Command layer
│   ├── index.ts                  # Command registry
│   ├── types.ts                  # Command interfaces
│   ├── executor.ts               # Command execution engine
│   ├── validator.ts              # Command validation
│   ├── history.ts                # Command history/undo-redo
│   ├── graph/                    # Graph mutation commands
│   │   ├── create-node.ts
│   │   ├── update-node.ts
│   │   ├── delete-node.ts
│   │   ├── pin-node.ts
│   │   ├── create-connection.ts
│   │   ├── delete-connection.ts
│   │   └── answer-management.ts
│   ├── navigation/               # Navigation commands
│   │   ├── pan.ts
│   │   ├── zoom.ts
│   │   ├── recenter.ts
│   │   └── focus-node.ts
│   ├── selection/                # Selection commands
│   │   ├── set-selection.ts
│   │   ├── clear-selection.ts
│   │   └── toggle-selection.ts
│   ├── ui/                       # UI control commands
│   │   ├── panels.ts
│   │   └── modals.ts
│   └── file/                     # File operation commands
│       ├── import.ts
│       ├── export.ts
│       └── new-graph.ts
│
├── interactions/                  # Interaction layer
│   ├── index.ts                  # Interaction registry
│   ├── types.ts                  # Interaction interfaces
│   ├── router.ts                 # Event → Command router
│   ├── gesture-manager.ts        # Unified gesture recognition
│   ├── keyboard-handler.ts       # Keyboard event handling
│   ├── definitions/              # Interaction definitions
│   │   ├── canvas.ts            # Canvas interactions
│   │   ├── nodes.ts             # Node interactions
│   │   ├── keyboard.ts          # Keyboard shortcuts
│   │   ├── forms.ts             # Form interactions
│   │   └── gestures.ts          # Touch gestures
│   └── contexts.ts               # Interaction contexts
│
├── forms/                         # Form system
│   ├── index.ts                  # Form registry
│   ├── types.ts                  # Form interfaces
│   ├── engine.ts                 # Form rendering engine
│   ├── validation.ts             # Form validation
│   ├── definitions/              # Form definitions
│   │   ├── create-statement.ts
│   │   ├── edit-statement.ts
│   │   ├── create-question.ts
│   │   ├── edit-question.ts
│   │   └── create-connection.ts
│   └── sections/                 # Custom form sections
│       ├── connections-section.ts
│       ├── questions-section.ts
│       └── answer-section.ts
│
├── stores/                        # Enhanced stores
│   ├── graph.svelte.ts           # (existing)
│   ├── ui.svelte.ts              # (existing)
│   ├── selection.svelte.ts       # (existing)
│   ├── history.svelte.ts         # NEW: Command history
│   ├── animation.svelte.ts       # NEW: Animation management
│   ├── gesture.svelte.ts         # NEW: Gesture recognition
│   ├── notification.svelte.ts    # Enhanced toast store
│   └── loading.svelte.ts         # (existing)
│
├── components/                    # Pure presentational components
│   ├── graph/
│   │   ├── GraphCanvas.svelte    # Simplified - just rendering
│   │   ├── canvas/
│   │   │   ├── node-renderer.ts  # (existing)
│   │   │   └── link-renderer.ts  # (existing)
│   │   └── overlays/             # NEW: Visual overlays
│   │       ├── PinIndicator.svelte
│   │       ├── AnswerCheckmark.svelte
│   │       └── SelectionHighlight.svelte
│   ├── panels/
│   │   ├── FloatingToolbar.svelte
│   │   ├── LeftPanel.svelte
│   │   ├── RightPanel.svelte     # Generic panel container
│   │   └── SearchPanel.svelte
│   ├── forms/
│   │   ├── DynamicForm.svelte    # Renders from FormDefinition
│   │   ├── FormField.svelte      # Generic field renderer
│   │   └── FormSection.svelte    # Generic section renderer
│   └── ui/                        # (existing reusable components)
│
├── utils/                         # Pure utility functions
│   ├── graph-helpers.ts          # (existing)
│   ├── node-connections.ts       # (existing)
│   ├── node-styling.ts           # (existing)
│   ├── validation.ts             # (existing)
│   ├── d3/
│   │   ├── simulation.ts         # (existing)
│   │   └── interactions.ts       # DEPRECATED - move to commands
│   └── animations/               # NEW: Animation utilities
│       ├── easing.ts
│       ├── transitions.ts
│       └── presets.ts
│
└── types/                         # Type definitions
    ├── graph.ts                  # (existing)
    ├── ui.ts                     # (existing)
    ├── commands.ts               # NEW: Command types
    ├── interactions.ts           # NEW: Interaction types
    ├── forms.ts                  # NEW: Form types
    └── animations.ts             # NEW: Animation types
```

---

## Implementation Plan

### Phase 1: Foundation (Week 1-2)

**Goal:** Establish command and interaction infrastructure

#### Tasks:

1. **Create command types and interfaces**
    - Define `Command`, `CommandContext`, `CommandResult` interfaces
    - Create `CommandCategory` enum
    - Add command metadata types

2. **Implement command executor**
    - Create `CommandExecutor` class
    - Implement validation before execution
    - Add error handling and logging
    - Create command registry

3. **Create history store**
    - Implement undo/redo stack
    - Add command recording
    - Implement undo/redo operations
    - Add history size limits

4. **Define interaction types**
    - Create `InteractionDefinition` interface
    - Define `EventMatcher` types
    - Create `InteractionContext` enum
    - Add precondition types

5. **Implement interaction router**
    - Create event listener setup
    - Implement event → command mapping
    - Add priority-based matching
    - Implement precondition checking

#### Deliverables:

- ✅ Command system fully typed
- ✅ Basic command execution working
- ✅ History store with undo/redo
- ✅ Interaction router processing events
- ✅ Unit tests for core systems

#### Files to Create:

- `src/lib/commands/types.ts`
- `src/lib/commands/executor.ts`
- `src/lib/commands/validator.ts`
- `src/lib/commands/index.ts`
- `src/lib/stores/history.svelte.ts`
- `src/lib/interactions/types.ts`
- `src/lib/interactions/router.ts`
- `src/lib/interactions/index.ts`

---

### Phase 2: Core Commands (Week 3-4)

**Goal:** Implement all graph mutation and navigation commands

#### Tasks:

1. **Graph mutation commands**
    - `graph.node.create` - Create statement/question nodes
    - `graph.node.update` - Update node properties
    - `graph.node.delete` - Delete node with confirmation
    - `graph.node.pin` - Pin node at current position
    - `graph.node.unpin` - Unpin node
    - `graph.node.pin.toggle` - Toggle pin state
    - `graph.connection.create` - Create connection
    - `graph.connection.delete` - Delete connection
    - `graph.answer.link` - Link answer to question
    - `graph.answer.unlink` - Unlink answer

2. **Navigation commands**
    - `nav.pan` - Pan canvas
    - `nav.zoom.in` - Zoom in one step
    - `nav.zoom.out` - Zoom out one step
    - `nav.zoom.reset` - Reset zoom to 100%
    - `nav.recenter` - Recenter view to fit all nodes
    - `nav.node.focus` - Focus and center on specific node

3. **Selection commands**
    - `selection.set` - Set selection
    - `selection.clear` - Clear selection
    - `selection.toggle` - Toggle selection

4. **Add undo support to commands**
    - Implement `undo` function for reversible commands
    - Store necessary data in command results
    - Test undo/redo for each command

#### Deliverables:

- ✅ All core commands implemented
- ✅ Undo/redo working for reversible commands
- ✅ Commands integrated with stores
- ✅ Notifications for command results
- ✅ Unit tests for all commands

#### Files to Create:

- `src/lib/commands/graph/*.ts` (10 files)
- `src/lib/commands/navigation/*.ts` (6 files)
- `src/lib/commands/selection/*.ts` (3 files)

---

### Phase 3: Interaction Definitions (Week 5)

**Goal:** Define all user interactions declaratively

#### Tasks:

1. **Canvas interactions**
    - Click empty space → deselect
    - Click node → select
    - Double-click node → pin/unpin
    - Hover node → highlight connections
    - Drag node → move (with pin on release if dragged)
    - Scroll → zoom
    - Click connection → select

2. **Keyboard shortcuts**
    - A → Create statement
    - Q → Create question
    - C → Create connection
    - F → Recenter view
    - +/= → Zoom in
    -   - → Zoom out
    - 0 → Reset zoom
    - Delete/Backspace → Delete selected
    - Escape → Clear selection / close panel
    - Ctrl+S → Save
    - Ctrl+O → Open
    - Ctrl+Z → Undo
    - Ctrl+Shift+Z → Redo
    - Ctrl+K → Focus search
    - Space+Drag → Pan mode

3. **Mobile gestures**
    - Long press node → pin/unpin
    - Pinch → zoom
    - Two-finger drag → pan
    - Swipe → (future: navigate history)

4. **Form interactions**
    - Enter in input → submit
    - Ctrl+Enter in textarea → submit
    - Escape in input → blur

#### Deliverables:

- ✅ All interactions defined declaratively
- ✅ Interaction router handling all events
- ✅ Keyboard shortcuts working
- ✅ Mobile gestures working
- ✅ No hardcoded event handlers in components

#### Files to Create:

- `src/lib/interactions/definitions/canvas.ts`
- `src/lib/interactions/definitions/keyboard.ts`
- `src/lib/interactions/definitions/gestures.ts`
- `src/lib/interactions/definitions/forms.ts`

---

### Phase 4: Gesture System (Week 6)

**Goal:** Unified gesture recognition for touch and mouse

#### Tasks:

1. **Create gesture store**
    - Implement gesture recognizers
    - Track active gestures
    - Emit gesture events

2. **Implement recognizers**
    - Tap (single touch)
    - Double tap (rapid two taps)
    - Long press (hold > 500ms)
    - Pan (drag movement)
    - Pinch (two-finger zoom)
    - Swipe (fast directional movement)

3. **Integrate with interaction router**
    - Convert gestures to interaction events
    - Map gestures to commands
    - Add mobile-specific interactions

4. **Test on mobile devices**
    - Test all gestures on touch devices
    - Verify no conflicts with browser gestures
    - Add haptic feedback where appropriate

#### Deliverables:

- ✅ Gesture store implemented
- ✅ All gesture recognizers working
- ✅ Mobile interactions functional
- ✅ No conflicts with browser defaults
- ✅ Unit tests for gesture recognition

#### Files to Create:

- `src/lib/stores/gesture.svelte.ts`
- `src/lib/interactions/gesture-manager.ts`
- `src/lib/interactions/recognizers/*.ts` (6 files)

---

### Phase 5: Animation System (Week 7)

**Goal:** Centralized animation management

#### Tasks:

1. **Create animation store**
    - Track active animations
    - Animation presets
    - Start/stop animations

2. **Implement animation utilities**
    - Easing functions
    - Transition helpers
    - Animation composition

3. **Define animation presets**
    - `fade_in` - Node creation
    - `fade_out` - Node deletion
    - `grow_in` - Node emphasis
    - `shrink_out` - Node deemphasis
    - `slide_in` - Panel opening
    - `pulse` - Selection feedback
    - `shake` - Error feedback

4. **Integrate animations with commands**
    - Node creation → fade_in + grow_in
    - Node deletion → fade_out + shrink_out
    - Connection creation → line draw animation
    - Selection change → pulse
    - Error → shake

5. **D3 integration**
    - Animate canvas transforms (pan, zoom)
    - Smooth node position transitions
    - Animated layout changes

#### Deliverables:

- ✅ Animation store implemented
- ✅ All presets defined
- ✅ Commands emit animation effects
- ✅ D3 transitions smooth
- ✅ Performance optimized (60fps)

#### Files to Create:

- `src/lib/stores/animation.svelte.ts`
- `src/lib/utils/animations/easing.ts`
- `src/lib/utils/animations/transitions.ts`
- `src/lib/utils/animations/presets.ts`

---

### Phase 6: Form System (Week 8-9)

**Goal:** Declarative form definitions and rendering

#### Tasks:

1. **Create form types**
    - `FormDefinition` interface
    - `FormField` interface
    - `FormSection` interface
    - `FormAction` interface

2. **Implement form engine**
    - Dynamic form renderer
    - Field validation
    - Data binding
    - Submit handling

3. **Define all forms**
    - Create statement form
    - Edit statement form
    - Create question form
    - Edit question form
    - Create connection form
    - Edit connection form

4. **Create custom form sections**
    - Connections section (reasons, consequences, contradictions)
    - Questions section (for statements)
    - Answer section (for questions)
    - Linked statements section (for questions)

5. **Implement form commands**
    - `form.submit` - Validate and submit form
    - `form.reset` - Reset form to initial state
    - `form.blur` - Blur active field
    - `form.field.update` - Update field value

6. **Add form state tracking**
    - Dirty state (has unsaved changes)
    - Validation state
    - Submitting state

#### Deliverables:

- ✅ Form system fully functional
- ✅ All forms defined declaratively
- ✅ Form validation working
- ✅ Forms integrated with commands
- ✅ Form state tracking working
- ✅ No imperative form logic in components

#### Files to Create:

- `src/lib/forms/types.ts`
- `src/lib/forms/engine.ts`
- `src/lib/forms/validation.ts`
- `src/lib/forms/definitions/*.ts` (6 files)
- `src/lib/forms/sections/*.ts` (4 files)
- `src/lib/components/forms/DynamicForm.svelte`
- `src/lib/components/forms/FormField.svelte`
- `src/lib/components/forms/FormSection.svelte`

---

### Phase 7: Visual Enhancements (Week 10)

**Goal:** Implement missing visual indicators and polish

#### Tasks:

1. **Pin indicator**
    - Small pin icon on pinned nodes
    - Show/hide based on pin state
    - Animate on pin/unpin

2. **Answer checkmark**
    - Green checkmark on answered questions
    - Position in node corner
    - Animate on link/unlink

3. **Node resize on text change**
    - Recalculate dimensions when statement changes
    - Update collision force in simulation
    - Smooth transition

4. **Hover effects**
    - Cursor changes (pointer on interactive elements)
    - Border glow on hover
    - Connected node highlighting

5. **Selection feedback**
    - Selection outline
    - Pulse animation on select
    - Clear visual distinction

6. **Loading states**
    - Loading overlay during export
    - Progress indicators for long operations
    - Skeleton loaders for async data

#### Deliverables:

- ✅ Pin indicator on canvas
- ✅ Answer checkmark on canvas
- ✅ Node dimensions update correctly
- ✅ All hover effects working
- ✅ Selection clearly visible
- ✅ Loading states consistent

#### Files to Create:

- `src/lib/components/graph/overlays/PinIndicator.svelte`
- `src/lib/components/graph/overlays/AnswerCheckmark.svelte`
- `src/lib/components/graph/overlays/SelectionHighlight.svelte`

---

### Phase 8: Enhanced Notifications (Week 11)

**Goal:** Rich, context-aware notifications

#### Tasks:

1. **Enhance notification store**
    - Notification presets by command
    - Template-based messages
    - Action buttons in notifications

2. **Define notification presets**
    - Success messages for each command
    - Error messages with helpful hints
    - Info messages for state changes
    - Warning messages for destructive actions

3. **Add notification actions**
    - "Undo" action after deletions
    - "View" action after creation
    - "Retry" action after errors

4. **Notification animations**
    - Slide in from top
    - Auto-dismiss with progress bar
    - Dismiss on interaction

5. **Notification grouping**
    - Group similar notifications
    - "X more items" summary
    - Expandable notification list

#### Deliverables:

- ✅ Enhanced notification system
- ✅ All commands have presets
- ✅ Action buttons working
- ✅ Animations smooth
- ✅ Notification grouping working

#### Files to Update:

- `src/lib/stores/notification.svelte.ts` (formerly toast)
- `src/lib/components/ui/NotificationContainer.svelte` (formerly ToastContainer)

---

### Phase 9: Recenter View Improvement (Week 12)

**Goal:** Proper recenter calculation and animation

#### Tasks:

1. **Implement bounding box calculation**
    - Calculate min/max x,y of all nodes
    - Account for node dimensions
    - Add padding margin

2. **Calculate target transform**
    - Determine scale to fit all nodes
    - Calculate pan to center
    - Respect zoom limits

3. **Animate transition**
    - Smooth zoom and pan transition
    - Duration ~500ms
    - Easing function for natural feel

4. **Handle edge cases**
    - Empty graph (no nodes)
    - Single node
    - Very spread out nodes

#### Deliverables:

- ✅ Recenter correctly fits all nodes
- ✅ Animation smooth and natural
- ✅ Edge cases handled
- ✅ Command `nav.recenter` fully functional

#### Files to Update:

- `src/lib/commands/navigation/recenter.ts`
- `src/lib/components/graph/GraphCanvas.svelte`

---

### Phase 10: Question State Logic (Week 13)

**Goal:** Automatic question state management

#### Tasks:

1. **Auto-resolve on answer link**
    - When answer linked to active question → mark resolved
    - Visual update (color change)
    - Notification

2. **Revert to active on answer unlink**
    - When answer unlinked from resolved question → mark active (optional behavior)
    - Configurable setting
    - Notification

3. **Question state toggle**
    - Manual override of auto-resolution
    - Toggle between active/resolved
    - Respect manual state (don't auto-change if manually set)

4. **Visual state indicators**
    - Active: amber border
    - Resolved: gray background
    - Answered: green checkmark
    - Clear visual distinction

#### Deliverables:

- ✅ Auto-resolution working
- ✅ State toggle working
- ✅ Visual states correct
- ✅ Notifications appropriate

#### Files to Update:

- `src/lib/commands/graph/answer-management.ts`
- `src/lib/utils/node-styling.ts`

---

### Phase 11: Connection Management UX (Week 14)

**Goal:** Improve connection creation and management

#### Tasks:

1. **Add connection interface improvements**
    - "Link Existing" / "Create New" mode toggle
    - Better visual feedback
    - Collapsible sections

2. **Connection type filtering**
    - Auto-filter dropdowns by connection type
    - Answer: source=question, target=statement
    - Clear validation messages

3. **Connection section improvements**
    - Remove connection confirmation modal (not browser alert)
    - Navigate to connected node (explicit buttons)
    - Visual connection type indicators

4. **Create & Link workflow**
    - Single action to create node + link
    - Immediate visual feedback
    - Animation of new node appearing

#### Deliverables:

- ✅ Connection UI improved
- ✅ Type-based filtering working
- ✅ Navigation buttons clear
- ✅ Create & Link efficient

#### Files to Update:

- `src/lib/forms/sections/connections-section.ts`
- `src/lib/commands/graph/create-connection.ts`

---

### Phase 12: Component Refactoring (Week 15)

**Goal:** Simplify components to pure presentation

#### Tasks:

1. **Refactor GraphCanvas**
    - Remove event handlers (move to interaction layer)
    - Remove action logic (move to commands)
    - Pure rendering only
    - Subscribe to animation store for visual updates

2. **Refactor forms**
    - Replace custom forms with `DynamicForm`
    - Remove validation logic (use form engine)
    - Remove submit handlers (use form commands)

3. **Refactor panels**
    - Remove action logic
    - Pure presentation of state
    - Event emission only

4. **Remove deprecated utils**
    - Move `d3/interactions.ts` logic to commands
    - Remove `edit-node-actions.ts` (replaced by commands)
    - Remove `keyboard.ts` (replaced by interaction definitions)

5. **Update all components**
    - Remove hardcoded event handlers
    - Use command dispatch instead
    - Simplify component logic

#### Deliverables:

- ✅ All components simplified
- ✅ No business logic in components
- ✅ All interactions through command system
- ✅ Deprecated code removed
- ✅ Tests updated

#### Files to Update:

- `src/lib/components/graph/GraphCanvas.svelte`
- All form components
- All panel components
- Remove deprecated utility files

---

### Phase 13: Testing & Documentation (Week 16)

**Goal:** Comprehensive testing and documentation

#### Tasks:

1. **Unit tests**
    - Test all commands
    - Test interaction routing
    - Test form validation
    - Test gesture recognition
    - Test animation system

2. **Integration tests**
    - Test complete user flows
    - Test undo/redo
    - Test form submission
    - Test keyboard shortcuts

3. **Documentation**
    - Architecture documentation
    - Command catalog
    - Interaction catalog
    - Form definition guide
    - Contributing guide

4. **Performance testing**
    - Large graph performance
    - Animation frame rate
    - Gesture responsiveness
    - Undo/redo performance

#### Deliverables:

- ✅ 90% unit test coverage
- ✅ Integration tests passing
- ✅ Documentation complete
- ✅ Performance benchmarks met
- ✅ No regressions from original implementation

#### Files to Create:

- `src/lib/commands/**/*.spec.ts`
- `src/lib/interactions/**/*.spec.ts`
- `src/lib/forms/**/*.spec.ts`
- `docs/ARCHITECTURE.md`
- `docs/COMMANDS.md`
- `docs/INTERACTIONS.md`
- `docs/FORMS.md`

---

### Phase 14: Polish & Bug Fixes (Week 17-18)

**Goal:** Final polish and bug fixes

#### Tasks:

1. **User experience polish**
    - Smooth all animations
    - Consistent timing
    - Clear feedback for all actions
    - Helpful error messages

2. **Accessibility**
    - Keyboard navigation complete
    - Screen reader support
    - Focus management
    - ARIA labels

3. **Mobile optimization**
    - Touch targets sized appropriately
    - Gestures conflict-free
    - Mobile-specific interactions
    - Responsive layout

4. **Bug fixes**
    - Fix any discovered bugs
    - Address edge cases
    - Performance optimizations
    - Memory leak fixes

5. **Final testing**
    - Manual testing of all features
    - Cross-browser testing
    - Mobile device testing
    - Accessibility audit

#### Deliverables:

- ✅ All 62 missing behaviors implemented
- ✅ No known bugs
- ✅ Smooth and polished UX
- ✅ Accessible and mobile-friendly
- ✅ Production-ready

---

## Migration Strategy

### Backward Compatibility

**NOT a priority** - We're doing a clean architecture redesign. However, to minimize disruption:

1. **Data compatibility**
    - Graph JSON format remains unchanged
    - Users can import old graphs

2. **Gradual migration**
    - Phase 1-5: Build new systems alongside old
    - Phase 6-12: Replace old components with new
    - Phase 13-14: Remove old code

3. **Feature flags (optional)**
    - Toggle between old and new implementations during development
    - Useful for A/B testing

### Breaking Changes

**Accept these for better design:**

1. **Component API changes**
    - Old event handlers removed
    - New command dispatch required
    - Props may change

2. **Store API changes**
    - History store required
    - Animation store required
    - Gesture store required

3. **Utility function changes**
    - Some utilities deprecated
    - New command-based APIs

---

## Success Metrics

### Functional Metrics

- ✅ All 62 missing behaviors implemented
- ✅ 90% unit test coverage
- ✅ Zero high-priority bugs
- ✅ All interactions working on desktop and mobile

### Code Quality Metrics

- ✅ No code duplication (DRY)
- ✅ Clear separation of concerns
- ✅ All components < 150 lines
- ✅ All functions < 50 lines
- ✅ Zero `any` types

### Performance Metrics

- ✅ 60fps animations
- ✅ < 100ms command execution
- ✅ < 500ms undo/redo
- ✅ Supports 1000+ node graphs

### User Experience Metrics

- ✅ Consistent interaction patterns
- ✅ Clear feedback for all actions
- ✅ Smooth animations throughout
- ✅ Accessible to keyboard and screen reader users

---

## Future Enhancements (Post-Implementation)

### Potential Additions

1. **Multi-user collaboration** - Command system enables conflict resolution
2. **Plugin system** - Commands can be added dynamically
3. **Command palette** - Fuzzy search for all commands
4. **Macro recording** - Record and replay command sequences
5. **AI assistance** - Commands can be suggested/executed by AI
6. **Graph templates** - Predefined command sequences
7. **Advanced layouts** - New layout commands
8. **Conditional formatting** - Rules engine on top of styling
9. **Export formats** - More formats as export commands
10. **Graph diff/merge** - Compare graphs via command history

---

## Conclusion

This architecture redesign transforms the Logic Graph application from an imperative, component-heavy structure to a declarative, event-driven system. By centralizing interactions, commands, and behaviors, we:

1. **Eliminate duplication** - Common patterns defined once
2. **Enable extensibility** - New features are new commands/interactions
3. **Improve testability** - Pure functions and clear contracts
4. **Enhance maintainability** - Clear separation of concerns
5. **Support advanced features** - Undo/redo, animations, gestures built-in

The phased implementation plan allows for incremental progress while maintaining a working application throughout. The new architecture is designed for the future, not just to fix current gaps.

**Total estimated time:** 18 weeks (~4.5 months) for complete implementation and polish.

---

**End of Document**
