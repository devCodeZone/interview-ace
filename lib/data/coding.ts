import type { CodingProblem, Level } from "../types";

const ALL: Level[] = ["junior", "mid", "senior", "lead"];
const MIDUP: Level[] = ["mid", "senior", "lead"];
const SENIOR: Level[] = ["senior", "lead"];

/** Tests run in a Web Worker. Helpers available: assert(cond, msg), deepEqual(actual, expected, msg), sleep(ms). */
export const CODING: CodingProblem[] = [
  {
    id: "debounce", title: "Implement debounce", kind: "js", difficulty: "medium",
    topics: ["JavaScript"], companies: ["Flipkart", "Atlassian", "Swiggy", "Microsoft", "Uber"], levels: ALL,
    prompt: "Write `debounce(fn, wait)` that returns a function which delays calling `fn` until `wait` ms have passed since the last call. The latest arguments and `this` must be used.",
    starter: "function debounce(fn, wait) {\n  // your code\n}\n",
    tests: [
      { name: "calls once after rapid calls", code: "let c=0; const d=debounce(()=>c++,30); d();d();d(); await sleep(60); assert(c===1,'expected 1 call, got '+c);" },
      { name: "uses latest args", code: "let v; const d=debounce((x)=>v=x,20); d(1);d(2);d(3); await sleep(50); assert(v===3,'expected 3, got '+v);" },
      { name: "preserves this", code: "const o={n:5,f:debounce(function(){this.got=this.n},10)}; o.f(); await sleep(30); assert(o.got===5,'this not preserved');" },
    ],
    hints: ["Store a timer id in a closure", "clearTimeout on each call"],
  },
  {
    id: "throttle", title: "Implement throttle", kind: "js", difficulty: "medium",
    topics: ["JavaScript"], companies: ["Flipkart", "Google", "Walmart Global Tech"], levels: MIDUP,
    prompt: "Write `throttle(fn, wait)` so `fn` runs immediately on the first call and then at most once every `wait` ms (leading edge). Extra calls within the window are ignored.",
    starter: "function throttle(fn, wait) {\n  // your code\n}\n",
    tests: [
      { name: "runs immediately", code: "let c=0; const t=throttle(()=>c++,50); t(); assert(c===1,'first call should run immediately');" },
      { name: "ignores calls in window", code: "let c=0; const t=throttle(()=>c++,50); t();t();t(); assert(c===1,'expected 1, got '+c);" },
      { name: "runs again after window", code: "let c=0; const t=throttle(()=>c++,30); t(); await sleep(45); t(); assert(c===2,'expected 2, got '+c);" },
    ],
  },
  {
    id: "flatten", title: "Flatten a nested array (with depth)", kind: "js", difficulty: "easy",
    topics: ["JavaScript"], companies: ["Publicis Sapient", "TCS", "Infosys", "Adobe", "Amazon"], levels: ALL,
    prompt: "Write `flatten(arr, depth = Infinity)` without using Array.prototype.flat.",
    starter: "function flatten(arr, depth = Infinity) {\n  // your code\n}\n",
    tests: [
      { name: "deep flatten", code: "deepEqual(flatten([1,[2,[3,[4]]],5]), [1,2,3,4,5]);" },
      { name: "depth 1", code: "deepEqual(flatten([1,[2,[3]]],1), [1,2,[3]]);" },
      { name: "empty", code: "deepEqual(flatten([]), []);" },
    ],
  },
  {
    id: "deepclone", title: "Deep clone with circular references", kind: "js", difficulty: "medium",
    topics: ["JavaScript"], companies: ["Atlassian", "Microsoft", "PayPal"], levels: MIDUP,
    prompt: "Write `deepClone(value)` that deep-copies objects, arrays and Dates, and supports circular references. Do not use structuredClone or JSON.",
    starter: "function deepClone(value, seen = new WeakMap()) {\n  // your code\n}\n",
    tests: [
      { name: "nested copy is independent", code: "const a={x:{y:[1,2]}}; const b=deepClone(a); b.x.y.push(3); deepEqual(a.x.y,[1,2]);" },
      { name: "dates", code: "const d=new Date(0); const c=deepClone({d}); assert(c.d instanceof Date && c.d!==d && c.d.getTime()===0,'date not cloned');" },
      { name: "circular", code: "const a={n:1}; a.self=a; const b=deepClone(a); assert(b.self===b && b!==a,'circular not handled');" },
    ],
  },
  {
    id: "promiseall", title: "Polyfill Promise.all", kind: "js", difficulty: "medium",
    topics: ["JavaScript"], companies: ["Flipkart", "Walmart Global Tech", "Microsoft", "Razorpay"], levels: MIDUP,
    prompt: "Write `promiseAll(items)` that behaves like Promise.all: resolves to results in input order, rejects on first rejection, accepts non-promise values.",
    starter: "function promiseAll(items) {\n  // your code\n}\n",
    tests: [
      { name: "keeps order", code: "const r=await promiseAll([sleep(30).then(()=>1), 2, Promise.resolve(3)]); deepEqual(r,[1,2,3]);" },
      { name: "rejects", code: "let e; try{ await promiseAll([Promise.resolve(1), Promise.reject('x')]); }catch(err){ e=err } assert(e==='x','should reject with x');" },
      { name: "empty", code: "deepEqual(await promiseAll([]), []);" },
    ],
  },
  {
    id: "curry", title: "Implement curry", kind: "js", difficulty: "medium",
    topics: ["JavaScript"], companies: ["Swiggy", "Zomato", "Paytm / PhonePe", "Publicis Sapient"], levels: ALL,
    prompt: "Write `curry(fn)` so `curry(sum3)(1)(2)(3)`, `curry(sum3)(1,2)(3)` and `curry(sum3)(1)(2,3)` all work, based on fn.length.",
    starter: "function curry(fn) {\n  // your code\n}\n",
    tests: [
      { name: "one by one", code: "const s=curry((a,b,c)=>a+b+c); assert(s(1)(2)(3)===6);" },
      { name: "mixed", code: "const s=curry((a,b,c)=>a+b+c); assert(s(1,2)(3)===6 && s(1)(2,3)===6 && s(1,2,3)===6);" },
    ],
  },
  {
    id: "memoize", title: "Memoize a function", kind: "js", difficulty: "easy",
    topics: ["JavaScript", "Performance"], companies: ["Adobe", "Accenture", "Deloitte"], levels: ALL,
    prompt: "Write `memoize(fn)` that caches results by arguments (assume JSON-serialisable args).",
    starter: "function memoize(fn) {\n  // your code\n}\n",
    tests: [
      { name: "caches", code: "let c=0; const m=memoize((a,b)=>{c++; return a+b}); m(1,2); m(1,2); assert(c===1,'expected 1 call, got '+c);" },
      { name: "different args", code: "let c=0; const m=memoize((a)=>{c++; return a*2}); assert(m(2)===4 && m(3)===6 && c===2);" },
    ],
  },
  {
    id: "emitter", title: "Build an EventEmitter", kind: "js", difficulty: "medium",
    topics: ["JavaScript"], companies: ["Atlassian", "Uber", "Google"], levels: MIDUP,
    prompt: "Implement `class EventEmitter` with `on(event, cb)` (returns an unsubscribe function), `once(event, cb)`, `off(event, cb)` and `emit(event, ...args)`.",
    starter: "class EventEmitter {\n  // your code\n}\n",
    tests: [
      { name: "on/emit", code: "const e=new EventEmitter(); let v=0; e.on('a',(x)=>v+=x); e.emit('a',2); e.emit('a',3); assert(v===5);" },
      { name: "unsubscribe", code: "const e=new EventEmitter(); let v=0; const un=e.on('a',()=>v++); un(); e.emit('a'); assert(v===0);" },
      { name: "once", code: "const e=new EventEmitter(); let v=0; e.once('a',()=>v++); e.emit('a'); e.emit('a'); assert(v===1);" },
      { name: "off", code: "const e=new EventEmitter(); let v=0; const f=()=>v++; e.on('a',f); e.off('a',f); e.emit('a'); assert(v===0);" },
    ],
  },
  {
    id: "lru", title: "LRU Cache", kind: "js", difficulty: "medium",
    topics: ["JavaScript", "Performance"], companies: ["Amazon", "Microsoft", "Walmart Global Tech", "Salesforce"], levels: MIDUP,
    prompt: "Implement `class LRUCache` with `constructor(capacity)`, `get(key)` (returns -1 if missing) and `put(key, value)`, evicting the least recently used key when over capacity. O(1) operations.",
    starter: "class LRUCache {\n  constructor(capacity) {\n  }\n  get(key) {\n  }\n  put(key, value) {\n  }\n}\n",
    tests: [
      { name: "basic", code: "const c=new LRUCache(2); c.put(1,1); c.put(2,2); assert(c.get(1)===1); c.put(3,3); assert(c.get(2)===-1,'2 should be evicted');" },
      { name: "update moves to recent", code: "const c=new LRUCache(2); c.put(1,1); c.put(2,2); c.put(1,10); c.put(3,3); assert(c.get(1)===10 && c.get(2)===-1);" },
    ],
  },
  {
    id: "getpath", title: "Implement lodash.get", kind: "js", difficulty: "easy",
    topics: ["JavaScript"], companies: ["Flipkart", "Razorpay", "American Express"], levels: ALL,
    prompt: "Write `get(obj, path, defaultValue)` where path can be 'a.b[0].c' or ['a','b','0','c'].",
    starter: "function get(obj, path, defaultValue) {\n  // your code\n}\n",
    tests: [
      { name: "string path", code: "assert(get({a:{b:[{c:7}]}},'a.b[0].c')===7);" },
      { name: "array path", code: "assert(get({a:{b:2}},['a','b'])===2);" },
      { name: "default", code: "assert(get({a:1},'x.y','d')==='d');" },
    ],
  },
  {
    id: "retry", title: "Retry with exponential backoff", kind: "js", difficulty: "hard",
    topics: ["JavaScript", "Browser & Web"], companies: ["Atlassian", "Uber", "Razorpay", "PayPal"], levels: SENIOR,
    prompt: "Write `retry(fn, retries, baseDelay)` that calls async `fn`; on failure waits baseDelay * 2^attempt ms and tries again, up to `retries` retries. Resolve with the first success or reject with the last error.",
    starter: "async function retry(fn, retries = 3, baseDelay = 100) {\n  // your code\n}\n",
    tests: [
      { name: "succeeds after failures", code: "let n=0; const r=await retry(async()=>{ if(++n<3) throw new Error('x'); return 'ok' },3,5); assert(r==='ok' && n===3);" },
      { name: "gives up", code: "let n=0, e; try{ await retry(async()=>{ n++; throw new Error('fail') },2,5) }catch(err){ e=err } assert(e && e.message==='fail' && n===3,'expected 3 attempts, got '+n);" },
    ],
  },
  {
    id: "groupby", title: "groupBy utility", kind: "js", difficulty: "easy",
    topics: ["JavaScript"], companies: ["TCS", "Infosys", "Accenture", "Deloitte"], levels: ["junior", "mid"],
    prompt: "Write `groupBy(arr, keyOrFn)` returning an object of arrays grouped by a property name or by the result of a function.",
    starter: "function groupBy(arr, keyOrFn) {\n  // your code\n}\n",
    tests: [
      { name: "by fn", code: "deepEqual(groupBy([1.1,1.5,2.3],Math.floor),{1:[1.1,1.5],2:[2.3]});" },
      { name: "by key", code: "deepEqual(groupBy([{t:'a'},{t:'b'},{t:'a'}],'t'),{a:[{t:'a'},{t:'a'}],b:[{t:'b'}]});" },
    ],
  },
  {
    id: "deepequal", title: "Deep equality check", kind: "js", difficulty: "medium",
    topics: ["JavaScript"], companies: ["Google", "Microsoft", "Adobe"], levels: MIDUP,
    prompt: "Write `isEqual(a, b)` that deeply compares primitives, arrays and plain objects.",
    starter: "function isEqual(a, b) {\n  // your code\n}\n",
    tests: [
      { name: "objects", code: "assert(isEqual({a:[1,{b:2}]},{a:[1,{b:2}]}) && !isEqual({a:1},{a:2}));" },
      { name: "different keys", code: "assert(!isEqual({a:1},{a:1,b:2}));" },
      { name: "NaN", code: "assert(isEqual(NaN,NaN));" },
    ],
  },
  {
    id: "pipe", title: "compose and pipe", kind: "js", difficulty: "easy",
    topics: ["JavaScript"], companies: ["Publicis Sapient", "Swiggy", "Zomato"], levels: ALL,
    prompt: "Write `pipe(...fns)` (left-to-right) and `compose(...fns)` (right-to-left).",
    starter: "function pipe(...fns) {\n}\nfunction compose(...fns) {\n}\n",
    tests: [
      { name: "pipe", code: "assert(pipe(x=>x+1,x=>x*2)(3)===8);" },
      { name: "compose", code: "assert(compose(x=>x+1,x=>x*2)(3)===7);" },
    ],
  },
  // ---------- Machine coding (AI / self review) ----------
  {
    id: "mc-autocomplete", title: "Machine coding: Autocomplete search (React)", kind: "machine", difficulty: "hard",
    topics: ["React", "Frontend System Design"], companies: ["Google", "Flipkart", "Walmart Global Tech", "Microsoft"], levels: MIDUP,
    prompt: "Build a React autocomplete component: debounced input, fetch suggestions from `fakeApi(query)` (returns a Promise of strings), show loading state, keyboard navigation (↑ ↓ Enter Esc), highlight the matched text, and ignore stale responses.",
    starter: "import { useEffect, useState } from 'react';\n\nconst fakeApi = (q) => new Promise(r => setTimeout(() => r(['React','Redux','Remix','Recoil','Rust'].filter(x => x.toLowerCase().includes(q.toLowerCase()))), 300));\n\nexport default function Autocomplete() {\n  // your code\n  return null;\n}\n",
    tests: [],
  },
  {
    id: "mc-productlist", title: "Machine coding: Product list + details panel", kind: "machine", difficulty: "medium",
    topics: ["React", "State Management"], companies: ["Flipkart", "Amazon", "Swiggy"], levels: ALL,
    prompt: "Build a product list; clicking a product opens its details on the right. Include search filter, loading and error states, and keep the selected product in the URL (?id=) so refresh preserves it.",
    starter: "export default function ProductsPage() {\n  // your code\n  return null;\n}\n",
    tests: [],
  },
  {
    id: "mc-kanban", title: "Machine coding: Kanban board", kind: "machine", difficulty: "hard",
    topics: ["React", "Frontend System Design"], companies: ["Atlassian", "Microsoft", "Salesforce"], levels: SENIOR,
    prompt: "Build a Kanban board with 3 columns (Todo, In progress, Done). Add cards, move cards between columns (drag-and-drop or buttons), persist to localStorage and make it keyboard accessible.",
    starter: "export default function Board() {\n  // your code\n  return null;\n}\n",
    tests: [],
  },
  {
    id: "mc-angular-search", title: "Machine coding: Angular type-ahead with RxJS", kind: "machine", difficulty: "medium",
    topics: ["Angular"], companies: ["Publicis Sapient", "TCS", "Infosys", "Accenture"], levels: MIDUP,
    prompt: "Write an Angular standalone component with a search box that uses RxJS (debounceTime, distinctUntilChanged, switchMap) to call a search service and render results with loading/error handling.",
    starter: "import { Component } from '@angular/core';\n\n@Component({\n  selector: 'app-search',\n  standalone: true,\n  template: ``\n})\nexport class SearchComponent {\n  // your code\n}\n",
    tests: [],
  },
];

export const getCoding = (id?: string) => CODING.find((c) => c.id === id);
