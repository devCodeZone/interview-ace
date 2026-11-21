# InterviewAce — AI mock interviews for frontend developers

Upload your resume and an AI panel reads it like a recruiter would, then interviews you live:

- **Resume-based interviews**: experience level (e.g. 10+ yrs → lead-level depth), skills, projects and likely rounds are detected from your resume.
- **Company-wise mocks**: Google, Microsoft, Amazon, Atlassian, Flipkart, Walmart, Adobe, Uber, Salesforce, PayPal, Swiggy, Zomato, Razorpay, Publicis Sapient, TCS, Infosys, Accenture, AmEx, Paytm/PhonePe, Deloitte, each with its reported round pattern.
- **Topic-wise drills**: JavaScript, TypeScript, React, Next.js, Angular, HTML/CSS, performance, security, testing, system design, accessibility, Adobe Target, AI in frontend, HR, managerial.
- **Live interview room**: questions shown on screen and read aloud, you answer by voice (Web Speech API), optional camera self-view, a timer, and AI follow-up questions.
- **Coding tests**: auto-tested JS problems (debounce, throttle, Promise.all, LRU…) run in a sandboxed Web Worker, plus machine-coding tasks reviewed by the AI.
- **Live market research**: Gemini + Google Search grounding pulls recently reported questions for a company/role.
- **Debrief report**: overall score, Strong Hire / Hire / Borderline / Not Yet verdict, topic scores, model answers, likely next-round questions and a study plan.

Works fully **offline** (built-in bank + keyword scoring) without a key. Add a free Gemini key for the AI interviewer.

## Run locally
```bash
npm install
cp .env.example .env.local   # optional: add GEMINI_API_KEY
npm run dev                  # http://localhost:3000
```
Use Chrome or Edge for voice answers.

## Deploy (Vercel)
Import the GitHub repo in Vercel (framework: Next.js). Optionally add `GEMINI_API_KEY` in Project → Settings → Environment Variables so AI works for every visitor; otherwise each user can paste their own key in **Settings**.

Stack: Next.js 16 (App Router) · React 19 · Tailwind CSS 4 · CodeMirror · pdf.js · mammoth · Google Gemini API.
