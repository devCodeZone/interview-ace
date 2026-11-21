import type { Company } from "../types";

/**
 * Interview patterns compiled from publicly shared candidate reports
 * (Glassdoor, LeetCode Discuss, Blind, AmbitionBox, Medium write-ups) for
 * frontend / UI engineer roles. Patterns change — use "Live market research"
 * in the app to refresh with the latest reports.
 */
export const COMPANIES: Company[] = [
  {
    name: "Google",
    type: "Product",
    rounds: ["Phone screen (DSA)", "2–3 coding rounds (DSA in JS)", "Frontend domain round", "System design (UI)", "Googleyness & leadership"],
    focus: ["JavaScript", "Browser & Web", "Performance", "Frontend System Design", "Accessibility"],
    notes: "Heavy on DSA written in JavaScript and deep browser knowledge. Clean, tested code and talking through complexity matter.",
    prompts: [
      { q: "Design an autocomplete / typeahead widget for a search page used by millions. Cover API calls, caching, keyboard navigation and accessibility.", topic: "Frontend System Design", kind: "design", points: ["debounce input", "cache results (LRU/map)", "cancel stale requests / race conditions", "keyboard navigation + ARIA combobox", "highlight match", "loading/error/empty states"] },
      { q: "What happens from the moment you type a URL in the browser until the page is interactive?", topic: "Browser & Web", kind: "theory", points: ["DNS lookup", "TCP/TLS handshake", "HTTP request/response", "HTML parsing & DOM/CSSOM", "render tree, layout, paint, composite", "JS parsing/execution and blocking scripts"] },
    ],
  },
  {
    name: "Microsoft",
    type: "Product",
    rounds: ["Online assessment", "2 coding rounds (DSA + JS)", "Frontend design / LLD", "Hiring manager (AA) round"],
    focus: ["JavaScript", "TypeScript", "React", "Frontend System Design", "Accessibility"],
    notes: "DSA medium plus project deep-dive. Accessibility and TypeScript are commonly probed for Office/Teams web teams.",
    prompts: [
      { q: "How would you make a complex data grid fully keyboard and screen-reader accessible?", topic: "Accessibility", kind: "theory", points: ["role=grid semantics", "roving tabindex", "arrow key navigation", "aria-rowcount/colcount for virtualization", "focus management", "announce updates with live regions"] },
      { q: "Design the frontend for a collaborative document editor like Word Online.", topic: "Frontend System Design", kind: "design", points: ["real-time sync (WebSocket)", "conflict resolution (OT/CRDT)", "offline support", "presence/cursors", "virtualized rendering", "autosave & versioning"] },
    ],
  },
  {
    name: "Amazon",
    type: "Product",
    rounds: ["Online assessment", "Phone screen", "Loop: 3–4 rounds mixing coding, frontend design and Leadership Principles", "Bar raiser"],
    focus: ["JavaScript", "Frontend System Design", "Performance", "Behavioral / HR"],
    notes: "Every round includes Leadership Principle questions — prepare STAR stories (Ownership, Dive Deep, Customer Obsession, Disagree & Commit).",
    prompts: [
      { q: "Tell me about a time you disagreed with your manager or a senior stakeholder on a technical decision. What did you do?", topic: "Behavioral / HR", kind: "behavioral", points: ["STAR structure", "data used to argue", "respectful escalation", "disagree and commit", "measurable outcome"] },
      { q: "Design the product detail page of an e-commerce site that must load fast on 3G mobile.", topic: "Frontend System Design", kind: "design", points: ["SSR/streaming for LCP", "image optimisation & responsive images", "code splitting / lazy load below-fold", "CDN & caching", "critical CSS", "measure Core Web Vitals"] },
    ],
  },
  {
    name: "Atlassian",
    type: "Product",
    rounds: ["Karat / initial coding screen", "Browser coding (build a UI in any framework)", "JavaScript round (build a utility module)", "Frontend system design", "Values round", "Manager round"],
    focus: ["JavaScript", "React", "Frontend System Design", "Behavioral / HR"],
    notes: "Candidates report a browser-coding round building a small UI, a pure-JS round (e.g. API calls with caching), system design, and a values interview.",
    prompts: [
      { q: "Write a JavaScript module that fetches data from an API, caches responses with an expiry, and de-duplicates concurrent requests for the same key.", topic: "JavaScript", kind: "theory", points: ["Map-based cache with timestamps", "TTL expiry", "store in-flight promises to dedupe", "error handling doesn't poison cache", "cache invalidation API"] },
      { q: "Design the frontend of a Kanban board like Jira/Trello with drag-and-drop and real-time updates.", topic: "Frontend System Design", kind: "design", points: ["normalised state", "optimistic updates + rollback", "drag-and-drop accessibility", "virtualisation for large boards", "WebSocket updates", "permissions"] },
    ],
  },
  {
    name: "Flipkart",
    type: "E-commerce",
    rounds: ["Machine coding (1.5–2 hrs, working UI)", "Machine coding review", "PS/DS (DSA)", "UI tech depth", "Product sense", "Hiring manager"],
    focus: ["JavaScript", "React", "Performance", "Browser & Web", "Frontend System Design"],
    notes: "Machine coding + code review is the backbone; JS fundamentals, browser internals and performance carry heavy weight.",
    prompts: [
      { q: "In a machine-coding round, how do you structure a product list + details panel app in 90 minutes so it is extensible and reviewable?", topic: "React", kind: "theory", points: ["component breakdown", "state location / lifting state", "mock API layer", "folder structure", "handle loading/error", "prioritise working core first then polish"] },
      { q: "Explain event delegation and how you'd use it for a product grid with thousands of items.", topic: "JavaScript", kind: "theory", points: ["event bubbling", "single listener on parent", "event.target / closest()", "memory/performance benefit", "dynamic elements"] },
    ],
  },
  {
    name: "Walmart Global Tech",
    type: "Global Capability Centre",
    rounds: ["Online assessment / DSA", "Frontend technical (JS + React)", "System design (HLD)", "Hiring manager"],
    focus: ["JavaScript", "React", "Frontend System Design", "Performance"],
    notes: "Reports mention HLD questions like designing Google Docs, plus React and JS depth.",
    prompts: [
      { q: "How would you design a micro-frontend architecture for a large retail site with many teams?", topic: "Frontend System Design", kind: "design", points: ["Module Federation / build-time vs run-time integration", "shared design system", "independent deploys", "routing/shell app", "shared state boundaries", "performance cost of duplication"] },
    ],
  },
  {
    name: "Adobe",
    type: "Product",
    rounds: ["Online test", "2 technical rounds (JS + DSA)", "Frontend design", "Director/Manager round"],
    focus: ["JavaScript", "React", "Performance", "Adobe Target & Personalization"],
    notes: "Experience Cloud teams value personalization / A/B testing knowledge (Adobe Target, Analytics, AEM).",
    prompts: [
      { q: "How do you prevent flicker when running client-side A/B tests with Adobe Target?", topic: "Adobe Target & Personalization", kind: "theory", points: ["pre-hiding snippet", "load at.js / Web SDK synchronously in head or with prehiding", "body hiding timeout", "server-side / hybrid delivery", "measure impact on LCP"] },
    ],
  },
  {
    name: "Uber",
    type: "Product",
    rounds: ["Phone screen (DSA)", "Frontend coding", "Frontend system design", "Bar-raiser / behavioural"],
    focus: ["JavaScript", "React", "Frontend System Design", "Performance"],
    notes: "Real-time UIs (maps, live tracking) show up in design rounds.",
    prompts: [
      { q: "Design a live ride-tracking screen that shows the driver moving on a map in real time.", topic: "Frontend System Design", kind: "design", points: ["WebSocket/SSE updates", "interpolate/animate positions", "throttle renders", "reconnection & backoff", "battery/network considerations", "map tile caching"] },
    ],
  },
  {
    name: "Salesforce",
    type: "Product",
    rounds: ["Online assessment", "Technical rounds (DSA + JS)", "Bar raiser (project + behavioural)", "Hiring manager"],
    focus: ["JavaScript", "TypeScript", "Frontend System Design", "AI in Frontend"],
    notes: "Recent reports show hiring managers asking about AI tooling (e.g. MCP tools) — be ready to discuss AI in your workflow.",
    prompts: [
      { q: "Have you built or integrated AI tools (LLM APIs, agents, MCP tools) into a frontend product? Walk me through the architecture.", topic: "AI in Frontend", kind: "behavioral", points: ["where the model is called (server-side, keys hidden)", "streaming responses to UI", "prompt/context design", "guardrails & error states", "cost/latency trade-offs", "evaluation of output quality"] },
    ],
  },
  {
    name: "PayPal",
    type: "Fintech",
    rounds: ["Online test", "JS + React technical", "System design", "Managerial"],
    focus: ["JavaScript", "React", "Security", "Testing"],
    notes: "Security (XSS, CSRF, CSP) and testing discipline matter in payments.",
    prompts: [
      { q: "How do you protect a payments frontend against XSS and CSRF?", topic: "Security", kind: "theory", points: ["escape/sanitise output", "Content-Security-Policy", "HttpOnly, Secure, SameSite cookies", "CSRF tokens", "avoid dangerouslySetInnerHTML", "dependency auditing"] },
    ],
  },
  {
    name: "Swiggy",
    type: "E-commerce",
    rounds: ["Machine coding", "JS/React deep-dive", "Frontend system design", "Hiring manager"],
    focus: ["JavaScript", "React", "Performance", "Frontend System Design"],
    notes: "Mobile-web performance and machine coding are common themes.",
    prompts: [
      { q: "How would you implement infinite scroll for a restaurant listing without killing performance?", topic: "Performance", kind: "theory", points: ["IntersectionObserver", "pagination/cursor API", "list virtualisation", "skeleton loaders", "preserve scroll on back navigation", "image lazy-loading"] },
    ],
  },
  {
    name: "Zomato",
    type: "E-commerce",
    rounds: ["Machine coding", "JS & React", "System design", "Culture fit"],
    focus: ["JavaScript", "React", "Performance"],
    notes: "Practical UI building with clean state management.",
    prompts: [
      { q: "Build (or describe) a star-rating component that is reusable, accessible and supports half stars.", topic: "React", kind: "theory", points: ["controlled vs uncontrolled props", "keyboard support", "radio group semantics / aria", "hover preview", "half-star rendering"] },
    ],
  },
  {
    name: "Razorpay",
    type: "Fintech",
    rounds: ["Machine coding", "JS fundamentals", "Frontend system design", "Hiring manager"],
    focus: ["JavaScript", "React", "Security", "Frontend System Design"],
    notes: "Checkout SDK style questions — embeddable widgets, iframes and postMessage.",
    prompts: [
      { q: "Design an embeddable checkout widget that merchants add with one script tag.", topic: "Frontend System Design", kind: "design", points: ["iframe isolation", "postMessage with origin checks", "small bundle / async loader", "versioning", "theming via config", "PCI considerations"] },
    ],
  },
  {
    name: "Publicis Sapient",
    type: "Service / Consulting",
    rounds: ["Technical round 1 (JS + framework)", "Technical round 2 (architecture / project deep-dive)", "Managerial / client-fit", "HR"],
    focus: ["JavaScript", "React", "Angular", "Next.js", "Adobe Target & Personalization", "Managerial / Leadership"],
    notes: "Client-facing roles: expect architecture of your current project, estimation, and personalization/martech for digital transformation clients.",
    prompts: [
      { q: "Explain the architecture of your current project end-to-end and the trade-offs you would change if you rebuilt it today.", topic: "Managerial / Leadership", kind: "behavioral", points: ["clear high-level diagram in words", "your ownership", "tech choices with reasons", "pain points", "what you'd change and why", "business impact"] },
    ],
  },
  {
    name: "TCS",
    type: "Service / Consulting",
    rounds: ["Technical interview (fundamentals + project)", "Managerial round", "HR round"],
    focus: ["JavaScript", "Angular", "React", "Behavioral / HR", "AI in Frontend"],
    notes: "Fundamentals, project explanation, willingness to relocate/shift; newer digital/AI programs probe GenAI awareness.",
    prompts: [
      { q: "Why do you want to join TCS, and how do you see AI changing frontend development in the next two years?", topic: "Behavioral / HR", kind: "behavioral", points: ["company-specific reasons", "long-term growth", "concrete AI examples (copilots, gen UI)", "learning mindset", "client value"] },
    ],
  },
  {
    name: "Infosys",
    type: "Service / Consulting",
    rounds: ["Technical round", "Techno-managerial", "HR"],
    focus: ["JavaScript", "Angular", "React", "Behavioral / HR"],
    notes: "Fundamentals, project discussion, SDLC/Agile awareness.",
    prompts: [
      { q: "Explain how you handle a production bug reported by a client late at night.", topic: "Managerial / Leadership", kind: "behavioral", points: ["triage severity", "reproduce & logs", "hotfix vs rollback", "communicate with stakeholders", "RCA and prevention"] },
    ],
  },
  {
    name: "Accenture",
    type: "Service / Consulting",
    rounds: ["Technical round", "Managerial round", "HR"],
    focus: ["JavaScript", "React", "Angular", "Managerial / Leadership"],
    notes: "Project depth and client communication are weighted alongside fundamentals.",
    prompts: [
      { q: "How do you estimate a new frontend feature for a client and communicate risk?", topic: "Managerial / Leadership", kind: "behavioral", points: ["break into tasks", "unknowns and spikes", "buffer for risk", "assumptions documented", "communicate early and with options"] },
    ],
  },
  {
    name: "American Express",
    type: "Fintech",
    rounds: ["Online assessment", "Technical (JS + React)", "System design", "Behavioural"],
    focus: ["JavaScript", "React", "Security", "Testing", "Accessibility"],
    notes: "Strong emphasis on testing, accessibility and secure coding.",
    prompts: [
      { q: "What is your testing strategy for a React application — what do you unit test, integration test and e2e test?", topic: "Testing", kind: "theory", points: ["testing pyramid/trophy", "React Testing Library user-centric tests", "mock network (MSW)", "e2e with Playwright/Cypress for critical flows", "coverage is not the goal", "CI integration"] },
    ],
  },
  {
    name: "Paytm / PhonePe",
    type: "Fintech",
    rounds: ["Machine coding / JS", "React & performance", "System design", "Hiring manager"],
    focus: ["JavaScript", "React", "Performance", "Security"],
    notes: "Low-end Android performance and PWA concepts come up.",
    prompts: [
      { q: "How would you make a web app work offline as a PWA?", topic: "Browser & Web", kind: "theory", points: ["service worker", "cache strategies (cache-first, network-first, stale-while-revalidate)", "web app manifest", "background sync", "update/versioning of SW"] },
    ],
  },
  {
    name: "Deloitte",
    type: "Service / Consulting",
    rounds: ["Technical round", "Case / managerial round", "HR"],
    focus: ["JavaScript", "React", "Angular", "Managerial / Leadership"],
    notes: "Consulting style: communicating clearly with business stakeholders is assessed.",
    prompts: [
      { q: "Explain a technical concept (e.g., server-side rendering) to a non-technical client stakeholder.", topic: "Managerial / Leadership", kind: "behavioral", points: ["simple analogy", "business benefit (SEO, speed)", "no jargon", "check understanding", "tie to their goals"] },
    ],
  },
];

export const COMPANY_NAMES = COMPANIES.map((c) => c.name);
export const getCompany = (name?: string) => COMPANIES.find((c) => c.name === name);
