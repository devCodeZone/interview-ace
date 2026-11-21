import type { Level, Question, QuestionKind } from "../types";

const ALL: Level[] = ["junior", "mid", "senior", "lead"];
const MIDUP: Level[] = ["mid", "senior", "lead"];
const SENIOR: Level[] = ["senior", "lead"];
const JRMID: Level[] = ["junior", "mid"];

let n = 0;
function q(topic: string, kind: QuestionKind, levels: Level[], question: string, points: string[], ideal?: string): Question {
  n += 1;
  return { id: `b${n}`, topic, kind, levels, question, points, ideal, source: "bank" };
}

export const QUESTIONS: Question[] = [
  // ---------------- JavaScript ----------------
  q("JavaScript", "theory", ALL, "Explain closures in JavaScript with a practical example.", ["function remembers its lexical scope", "inner function accesses outer variables after outer returns", "use cases: data privacy, factories, memoization, event handlers", "pitfall: loops with var"], "A closure is a function bundled with references to its surrounding lexical scope, so it keeps access to outer variables even after the outer function has returned. Example: a counter factory returning increment(). Used for private state, memoize, debounce. Classic pitfall: var in loops sharing one binding."),
  q("JavaScript", "theory", ALL, "Explain the event loop: call stack, microtasks and macrotasks. What does this print: console.log(1); setTimeout(()=>console.log(2)); Promise.resolve().then(()=>console.log(3)); console.log(4)?", ["call stack runs synchronous code first", "microtask queue (promises, queueMicrotask) drains before next macrotask", "macrotasks: setTimeout, I/O, events", "output 1 4 3 2"], "Sync code runs on the call stack (1, 4). After the stack empties, all microtasks run (promise then → 3), then the next macrotask (setTimeout → 2). Output: 1 4 3 2."),
  q("JavaScript", "theory", ALL, "What is the difference between var, let and const? What is the temporal dead zone?", ["var is function scoped, let/const block scoped", "var hoisted and initialised undefined", "let/const hoisted but in TDZ until declaration", "const prevents reassignment not mutation"]),
  q("JavaScript", "theory", ALL, "Explain 'this' in JavaScript in different contexts, and how call, apply and bind differ.", ["this depends on call site", "method call → object, plain call → undefined (strict) / global", "arrow functions capture lexical this", "new binds to new instance", "call (args list), apply (array), bind returns new function"]),
  q("JavaScript", "theory", MIDUP, "How does prototypal inheritance work? How are ES6 classes related to prototypes?", ["every object has [[Prototype]]", "property lookup walks the prototype chain", "Object.create", "class is syntactic sugar over constructor functions + prototype", "extends sets up prototype chain, super"]),
  q("JavaScript", "theory", ALL, "What is the difference between == and ===? Give tricky examples.", ["=== no type coercion", "== coerces types", "null == undefined true", "NaN !== NaN, use Number.isNaN / Object.is", "prefer ==="]),
  q("JavaScript", "theory", MIDUP, "Explain Promises, async/await, and how you handle errors and run tasks in parallel.", ["promise states pending/fulfilled/rejected", "async/await is sugar over promises", "try/catch with await", "Promise.all, allSettled, race, any", "avoid sequential awaits when independent"]),
  q("JavaScript", "theory", MIDUP, "What is debouncing vs throttling? Where would you use each?", ["debounce: run after inactivity period", "throttle: run at most once per interval", "debounce for search input / resize end", "throttle for scroll / mousemove", "leading/trailing options"]),
  q("JavaScript", "theory", MIDUP, "Shallow copy vs deep copy — how do you deep clone an object safely?", ["spread/Object.assign are shallow", "structuredClone for deep clone", "JSON method loses functions, dates, undefined, circular refs", "handle circular references with WeakMap in custom clone"]),
  q("JavaScript", "theory", MIDUP, "How does garbage collection work in JS and what commonly causes memory leaks in frontend apps?", ["mark-and-sweep reachability", "leaks: forgotten event listeners, timers, detached DOM nodes", "closures holding large objects", "global variables / caches without limits", "use DevTools memory snapshots", "WeakMap/WeakRef"]),
  q("JavaScript", "theory", SENIOR, "Explain generators and iterators. Where have you seen them used in real code?", ["iterator protocol next() {value, done}", "function* and yield", "lazy sequences", "Symbol.iterator", "redux-saga / async iteration for streams"]),
  q("JavaScript", "theory", JRMID, "What are ES modules vs CommonJS? What is tree shaking?", ["import/export static vs require dynamic", "ESM enables static analysis", "tree shaking removes unused exports", "side effects flag", "dynamic import() for code splitting"]),

  // ---------------- TypeScript ----------------
  q("TypeScript", "theory", ALL, "What is the difference between interface and type in TypeScript?", ["both describe shapes", "interface supports declaration merging and extends", "type supports unions, intersections, mapped/conditional types", "pick consistently; interface for public object contracts"]),
  q("TypeScript", "theory", MIDUP, "Explain generics with an example, and what generic constraints are.", ["reusable type-safe functions/components", "type parameter <T>", "constraints with extends", "inference from arguments", "example: function getProp<T, K extends keyof T>(o: T, k: K): T[K]"]),
  q("TypeScript", "theory", MIDUP, "What are utility types like Partial, Pick, Omit, Record, and how would you write your own mapped type?", ["Partial makes optional", "Pick/Omit select keys", "Record<K,V>", "mapped type { [K in keyof T]: ... }", "modifiers readonly / ?"]),
  q("TypeScript", "theory", SENIOR, "What are discriminated unions and how do they help model UI state?", ["common literal 'kind'/'status' field", "narrowing via switch", "exhaustive check with never", "model loading/success/error states without impossible combinations"]),
  q("TypeScript", "theory", MIDUP, "unknown vs any vs never — when would you use each?", ["any disables checking", "unknown must be narrowed before use", "never for impossible values / exhaustive checks", "prefer unknown for external data"]),

  // ---------------- React ----------------
  q("React", "theory", ALL, "What is the virtual DOM and how does React's reconciliation work?", ["in-memory UI tree", "diffing previous vs next tree", "same type → update, different type → remount", "keys identify list items", "Fiber enables interruptible rendering"]),
  q("React", "theory", ALL, "Why are keys important in lists? What goes wrong if you use the index as key?", ["keys give stable identity", "index keys break on reorder/insert/delete", "state attached to wrong item", "unnecessary re-renders", "use stable unique ids"]),
  q("React", "theory", ALL, "Explain useEffect: dependency array, cleanup, and common mistakes.", ["runs after render/commit", "deps control re-run", "cleanup on unmount and before re-run", "missing deps → stale closures", "don't use effects for derived state", "StrictMode double-invokes in dev"]),
  q("React", "theory", MIDUP, "When do useMemo, useCallback and React.memo actually help, and when are they a waste?", ["memo skips re-render if props equal", "useCallback stabilises function identity", "useMemo caches expensive computations", "only helps with referential equality or heavy compute", "profile first; React Compiler auto-memoizes"]),
  q("React", "theory", MIDUP, "How do you identify and fix unnecessary re-renders in a large React app?", ["React DevTools Profiler", "why-did-you-render / highlight updates", "lift state down / colocate state", "split context", "memoization", "virtualize long lists"]),
  q("React", "theory", MIDUP, "Context API vs Redux vs Zustand vs React Query — how do you choose?", ["server state vs client state", "React Query/SWR for server cache", "Context for low-frequency global values", "Context re-render issue", "Redux Toolkit/Zustand for complex client state", "devtools & team familiarity"]),
  q("React", "theory", SENIOR, "What are React Server Components and how do they differ from SSR?", ["RSC run only on server, ship no JS", "can access data sources directly", "SSR renders HTML for client components too and hydrates", "'use client' boundary", "serialisable props", "smaller bundles"]),
  q("React", "theory", SENIOR, "Explain concurrent rendering features: useTransition, useDeferredValue and Suspense.", ["rendering can be interrupted", "useTransition marks non-urgent updates", "useDeferredValue defers a value", "Suspense for loading boundaries / data", "keeps input responsive"]),
  q("React", "theory", MIDUP, "What are custom hooks? Give an example you have written in production.", ["reuse stateful logic", "name starts with use", "follow rules of hooks", "example: useDebounce, useFetch, useMediaQuery", "testability"]),
  q("React", "theory", MIDUP, "Controlled vs uncontrolled components — how do you build large forms efficiently?", ["controlled: state drives value", "uncontrolled: refs/DOM holds value", "React Hook Form uses uncontrolled for perf", "schema validation (zod/yup)", "React 19 form actions"]),
  q("React", "theory", SENIOR, "What is new in React 19 (Actions, useActionState, useOptimistic, use, the React Compiler)?", ["Actions for async transitions", "useActionState / useFormStatus", "useOptimistic", "use() to read promises/context", "ref as prop", "React Compiler auto memoization"]),
  q("React", "theory", MIDUP, "How do error boundaries work and what can't they catch?", ["class component with getDerivedStateFromError / componentDidCatch", "catch render/lifecycle errors in children", "don't catch event handler, async, SSR errors", "fallback UI + logging"]),
  q("React", "design", SENIOR, "How would you design a reusable component library / design system for multiple product teams?", ["design tokens", "accessible primitives", "composition over configuration", "versioning & changelog (semver)", "Storybook docs + visual regression", "theming", "tree-shakeable packaging"]),

  // ---------------- Next.js ----------------
  q("Next.js", "theory", ALL, "Compare SSR, SSG, ISR and CSR. When would you use each in Next.js?", ["SSG at build time", "ISR revalidates static pages", "SSR per request", "CSR in browser", "trade-offs: freshness, TTFB, SEO, cost"]),
  q("Next.js", "theory", MIDUP, "Explain the App Router: layouts, server vs client components, loading and error files.", ["file-system routing in app/", "nested layouts persist", "server components by default", "'use client' for interactivity", "loading.tsx uses Suspense", "error.tsx boundaries"]),
  q("Next.js", "theory", SENIOR, "How does caching and revalidation work in modern Next.js (fetch cache, revalidatePath/Tag, 'use cache')?", ["request vs data vs full route cache", "revalidate time-based", "on-demand revalidateTag/revalidatePath", "dynamic APIs opt out", "'use cache' directive in newer versions"]),
  q("Next.js", "theory", MIDUP, "What causes hydration mismatches and how do you fix them?", ["server HTML differs from client render", "Date/Math.random/window in render", "invalid HTML nesting", "browser extensions", "useEffect for client-only values", "suppressHydrationWarning sparingly"]),
  q("Next.js", "theory", MIDUP, "What are Server Actions and Route Handlers? When would you use each?", ["server actions: 'use server' functions called from forms/components", "route handlers: route.ts HTTP endpoints", "actions for mutations from your UI", "handlers for webhooks/public APIs", "validate & authorise on server"]),
  q("Next.js", "theory", MIDUP, "How do you optimise images, fonts and scripts in Next.js?", ["next/image responsive & lazy", "priority for LCP image", "next/font self-hosting avoids layout shift", "next/script strategies", "bundle analysis"]),
  q("Next.js", "theory", SENIOR, "How would you implement authentication and protected routes in Next.js?", ["middleware/proxy for redirects", "HttpOnly cookies / sessions", "check auth in server components and actions", "Auth.js / Clerk", "don't rely on client-only checks"]),

  // ---------------- Angular ----------------
  q("Angular", "theory", ALL, "Explain Angular change detection, zone.js, OnPush, and Signals.", ["zone.js triggers CD after async events", "default strategy checks whole tree", "OnPush checks on input ref change/events/async pipe", "Signals give fine-grained reactivity", "zoneless Angular"]),
  q("Angular", "theory", MIDUP, "What is the difference between Observables and Promises? Explain switchMap, mergeMap and concatMap.", ["observable lazy, multiple values, cancellable", "promise eager, single value", "switchMap cancels previous (search)", "mergeMap parallel", "concatMap sequential order", "unsubscribe / takeUntilDestroyed"]),
  q("Angular", "theory", MIDUP, "How does dependency injection work in Angular? What are providedIn and hierarchical injectors?", ["injector tree", "providedIn: 'root' singleton tree-shakeable", "component-level providers", "inject() function", "injection tokens"]),
  q("Angular", "theory", SENIOR, "Standalone components vs NgModules — how would you migrate a large Angular app?", ["standalone removes NgModule boilerplate", "migration schematics", "lazy load routes with loadComponent", "incremental migration", "shared imports"]),
  q("Angular", "theory", MIDUP, "How do you improve performance of a slow Angular application?", ["OnPush / signals", "trackBy in ngFor / @for track", "lazy loading modules", "pure pipes", "avoid function calls in templates", "@defer blocks", "bundle budgets"]),

  // ---------------- HTML & CSS ----------------
  q("HTML & CSS", "theory", ALL, "Explain the CSS box model and box-sizing.", ["content, padding, border, margin", "content-box default", "border-box includes padding & border", "margin collapsing"]),
  q("HTML & CSS", "theory", ALL, "Flexbox vs Grid — when do you use which?", ["flex is one-dimensional", "grid is two-dimensional", "grid for page layouts", "flex for components/alignment", "can combine"]),
  q("HTML & CSS", "theory", MIDUP, "How does CSS specificity work, and how do you manage CSS at scale?", ["inline > id > class/attr/pseudo-class > element", "!important overrides", "cascade layers @layer", "BEM / CSS modules / Tailwind / CSS-in-JS", "design tokens"]),
  q("HTML & CSS", "theory", ALL, "What is semantic HTML and why does it matter?", ["meaningful elements (header, nav, main, button)", "accessibility for screen readers", "SEO", "built-in keyboard behavior", "maintainability"]),
  q("HTML & CSS", "theory", MIDUP, "What are container queries, :has(), and other modern CSS features you use?", ["container queries size by parent", ":has parent selector", "CSS nesting", "subgrid", "view transitions", "clamp() fluid typography"]),

  // ---------------- Performance ----------------
  q("Performance", "theory", ALL, "What are Core Web Vitals (LCP, INP, CLS) and how do you improve each?", ["LCP loading of main content <2.5s", "INP responsiveness <200ms", "CLS visual stability <0.1", "optimise images/server for LCP", "break long tasks for INP", "reserve space for CLS"]),
  q("Performance", "theory", MIDUP, "How do you reduce JavaScript bundle size?", ["code splitting & lazy loading", "tree shaking", "analyse bundle", "replace heavy libraries", "dynamic import", "server components / less client JS"]),
  q("Performance", "theory", SENIOR, "A page in production became slow after a release. How do you investigate end-to-end?", ["check RUM / monitoring data", "compare releases / bisect", "Lighthouse & Performance panel", "network waterfall", "long tasks", "fix, measure, add perf budgets in CI"]),
  q("Performance", "theory", MIDUP, "How would you render a list of 100,000 rows smoothly?", ["virtualisation/windowing", "pagination", "stable keys and memo rows", "web workers for heavy compute", "avoid layout thrashing"]),

  // ---------------- Browser & Web ----------------
  q("Browser & Web", "theory", MIDUP, "Explain the critical rendering path and how render-blocking resources affect it.", ["DOM + CSSOM → render tree", "layout, paint, composite", "CSS is render-blocking", "sync scripts block parsing", "defer/async", "preload critical resources"]),
  q("Browser & Web", "theory", ALL, "localStorage vs sessionStorage vs cookies vs IndexedDB?", ["localStorage persistent ~5MB sync", "sessionStorage per tab", "cookies sent with requests, small", "IndexedDB async large structured data", "never store tokens in localStorage carelessly"]),
  q("Browser & Web", "theory", MIDUP, "What is CORS and how does a preflight request work?", ["same-origin policy", "server sends Access-Control-Allow-Origin", "preflight OPTIONS for non-simple requests", "credentials need explicit allow", "fixed on server not client"]),
  q("Browser & Web", "theory", SENIOR, "HTTP/2 vs HTTP/3, and caching headers (Cache-Control, ETag) — how do they affect frontend delivery?", ["multiplexing", "HTTP/3 over QUIC/UDP", "Cache-Control max-age, immutable", "ETag revalidation 304", "hashed filenames for long caching", "CDN"]),

  // ---------------- Security ----------------
  q("Security", "theory", MIDUP, "What is XSS, its types, and how do you prevent it in React/Angular apps?", ["stored, reflected, DOM-based", "frameworks escape by default", "avoid dangerouslySetInnerHTML / bypassSecurityTrust", "sanitise with DOMPurify", "CSP"]),
  q("Security", "theory", SENIOR, "Where should you store auth tokens in a SPA, and why?", ["HttpOnly Secure SameSite cookies preferred", "localStorage vulnerable to XSS", "in-memory access token + refresh cookie", "CSRF protection with cookies", "short-lived tokens"]),

  // ---------------- Testing ----------------
  q("Testing", "theory", ALL, "How do you unit test a React component? What do you mock?", ["React Testing Library", "test behavior not implementation", "query by role/label", "user-event", "mock network with MSW", "Jest/Vitest"]),
  q("Testing", "theory", SENIOR, "How do you set up quality gates in CI for a frontend monorepo?", ["lint & type-check", "unit + integration tests", "e2e on critical paths", "visual regression", "bundle/perf budgets", "affected-only builds (Nx/Turborepo)"]),

  // ---------------- State Management ----------------
  q("State Management", "theory", MIDUP, "Explain Redux data flow and what Redux Toolkit improves.", ["single store", "actions → reducers → new state", "immutability", "RTK: createSlice, Immer, configureStore", "RTK Query for server state"]),
  q("State Management", "theory", SENIOR, "How do you decide where state should live in a large application?", ["local first, lift only as needed", "URL state for shareable filters", "server cache separate", "global only for truly global", "avoid duplicate sources of truth"]),

  // ---------------- Frontend System Design ----------------
  q("Frontend System Design", "design", SENIOR, "Design a news feed (like LinkedIn) frontend: data loading, pagination, real-time updates and performance.", ["requirements & scope first", "component architecture", "cursor pagination + infinite scroll", "normalised cache", "optimistic likes/comments", "virtualisation", "real-time via WebSocket/SSE", "accessibility & error states"]),
  q("Frontend System Design", "design", SENIOR, "Design a frontend for a video streaming platform like Netflix/Hotstar.", ["SSR for landing / SEO", "adaptive bitrate (HLS/DASH)", "prefetch next rows", "image lazy loading", "player state", "offline/low network handling"]),
  q("Frontend System Design", "design", ["lead"], "As a lead, how would you plan migrating a legacy AngularJS/jQuery app to React or Next.js without stopping feature delivery?", ["strangler fig pattern", "micro-frontends or route-by-route", "shared auth/session", "design system first", "feature flags", "metrics and rollback plan", "team upskilling"]),
  q("Frontend System Design", "design", SENIOR, "Design a notification / toast system used across a large app.", ["global provider/store", "queue & max visible", "auto-dismiss & pause on hover", "aria-live region", "types & actions", "imperative API (toast())"]),

  // ---------------- Accessibility ----------------
  q("Accessibility", "theory", ALL, "How do you make a web app accessible? What WCAG guidelines do you follow?", ["WCAG 2.2 AA", "semantic HTML", "keyboard navigation & visible focus", "color contrast", "alt text & labels", "ARIA only when needed", "test with screen readers / axe"]),
  q("Accessibility", "theory", MIDUP, "How do you build an accessible modal dialog?", ["role=dialog / native <dialog>", "aria-modal and labelledby", "focus trap", "return focus on close", "Escape to close", "inert background"]),

  // ---------------- Adobe Target ----------------
  q("Adobe Target & Personalization", "theory", MIDUP, "Explain the difference between A/B Test, Experience Targeting, Multivariate Test, Auto-Target and Automated Personalization in Adobe Target.", ["A/B: split traffic between experiences", "XT: rule-based audiences", "MVT: combinations of elements", "Auto-Target: ML picks best experience per visitor", "AP: ML personalises offers per element"]),
  q("Adobe Target & Personalization", "theory", MIDUP, "at.js vs Adobe Experience Platform Web SDK (alloy.js) — how do you migrate?", ["at.js legacy Target library", "Web SDK unified for Target, Analytics, AEP", "datastreams configuration", "decision scopes / surfaces", "flicker handling", "parallel run & validate with debugger"]),
  q("Adobe Target & Personalization", "theory", SENIOR, "How do you implement personalization in a React/Next.js SPA with Adobe Target — view changes, route changes and SSR?", ["triggerView / sendEvent on route change", "Views in VEC for SPA", "server-side decisioning for SSR to avoid flicker", "hybrid mode", "mbox/scope parameters", "QA with preview links"]),
  q("Adobe Target & Personalization", "theory", MIDUP, "What are mboxes, profile parameters and audiences in Adobe Target?", ["mbox = location/request for content", "profile attributes persisted per visitor", "audiences built from rules", "custom code / response tokens", "reporting via A4T"]),
  q("Adobe Target & Personalization", "behavioral", SENIOR, "Tell me about an A/B test or personalization campaign you delivered. How did you measure success?", ["hypothesis", "primary metric & sample size", "implementation details", "QA process", "result & statistical significance", "business impact"]),

  // ---------------- AI in Frontend ----------------
  q("AI in Frontend", "theory", MIDUP, "How would you integrate an LLM (Claude/Gemini/OpenAI) into a frontend app safely?", ["call model from server, never expose keys", "stream tokens to UI", "rate limiting & cost control", "input validation / prompt injection awareness", "loading/error UX", "store conversation state"]),
  q("AI in Frontend", "theory", SENIOR, "What is an AI agent and how would you design the UI for one (tool calls, approvals, streaming)?", ["agent loop: model plans and calls tools", "show steps/progress transparently", "human approval for risky actions", "streaming partial output", "undo/cancel", "observability"]),
  q("AI in Frontend", "behavioral", ALL, "How do you use AI tools (Copilot, Claude, Cursor) in your daily development, and how do you make sure AI-generated code is correct?", ["concrete workflows", "review & tests", "security/licensing awareness", "productivity gain examples", "knowing when not to use it"]),

  // ---------------- Behavioral / HR ----------------
  q("Behavioral / HR", "behavioral", ALL, "Tell me about yourself.", ["current role & years of experience", "key skills/tech stack", "1–2 achievements with impact", "why you are looking / what you want next", "concise (1–2 minutes)"], "Structure: present (role, experience, stack) → past highlights (1–2 measurable achievements) → future (what you want and why this company). Keep it under two minutes."),
  q("Behavioral / HR", "behavioral", ALL, "Why are you looking for a change, and why should we hire you?", ["positive framing, no badmouthing", "growth / stability / impact reasons", "match your skills to the job", "unique value", "long-term intent"]),
  q("Behavioral / HR", "behavioral", ALL, "What is your biggest strength and one weakness you are working on?", ["strength with evidence", "real weakness, not a humblebrag", "steps you are taking", "progress made"]),
  q("Behavioral / HR", "behavioral", ALL, "Describe a time you missed a deadline or made a mistake in production. What did you learn?", ["STAR", "ownership", "communication", "fix & prevention", "learning"]),
  q("Behavioral / HR", "behavioral", MIDUP, "Tell me about the most challenging technical problem you solved.", ["context & why hard", "your specific actions", "alternatives considered", "outcome with numbers", "what you'd do differently"]),
  q("Behavioral / HR", "behavioral", ALL, "Where do you see yourself in 5 years?", ["realistic growth path", "aligned with company", "technical vs leadership direction", "learning goals"]),
  q("Behavioral / HR", "behavioral", ALL, "What are your salary expectations and notice period?", ["researched market range", "anchor with reason", "flexibility on total package", "clear availability/notice"]),

  // ---------------- Managerial / Leadership ----------------
  q("Managerial / Leadership", "behavioral", SENIOR, "How do you mentor junior developers and conduct code reviews?", ["regular 1:1s / pairing", "review for correctness, readability, learning", "kind and specific feedback", "checklists & standards", "grow ownership"]),
  q("Managerial / Leadership", "behavioral", SENIOR, "How do you handle a conflict between two team members over a technical approach?", ["listen to both", "focus on goals & data", "time-boxed spike/POC", "decide & document (ADR)", "disagree and commit"]),
  q("Managerial / Leadership", "behavioral", SENIOR, "How do you balance tech debt with feature delivery?", ["make debt visible (backlog)", "quantify impact", "allocate % capacity", "boy-scout rule", "tie to business outcomes"]),
  q("Managerial / Leadership", "behavioral", ["lead"], "With 10+ years of experience, how do you influence architecture decisions across teams without direct authority?", ["RFCs / ADRs", "prototypes & data", "build alliances", "align with business goals", "communicate trade-offs", "follow up on outcomes"]),
  q("Managerial / Leadership", "behavioral", SENIOR, "A stakeholder wants a feature in 1 week that your team estimates at 3 weeks. What do you do?", ["understand the real need", "propose MVP / phased scope", "show trade-offs & risks", "negotiate with data", "agree and communicate plan"]),
];

export const TOPICS = Array.from(new Set(QUESTIONS.map((x) => x.topic)));
