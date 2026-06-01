# B2B Strategy-Intake Chatbot with State-Aware Branching

**Candidate**: Het Soni (B.Tech CSE, CHARUSAT, CGPA 7.01)  
**Task**: MERN AI Chatbot with State-Aware SPIN Discovery & Automated Persona Validator  
**Stack**: React, Vite, Tailwind CSS, Framer Motion, Express.js, MongoDB, Recharts, Lucide Icons, Groq API (Llama 3.3), Google Gemini API  

---

## 🚀 Product Overview

StratBot B2B is a premium SaaS discovery portal designed to replace linear business development scripts. It conducts an **8-question SPIN-style discovery flow** (Situation, Problem, Implication, Need-payoff) to qualify inbound leads dynamically. 

Instead of running a pre-defined questionnaire, the bot adapts its questioning branch based on the founder's prior answers and current operational constraints. Upon completing the 8 questions, the system:
1. Classifies the prospect into one of 5 engagement buckets (**GTM**, **Sales**, **Pricing**, **Brand**, **Ops**).
2. Automatically generates a comprehensive, **1-page strategic strategic brief** in Markdown.
3. Renders visual analytics, allowing teams to audit aggregate classification statistics and download/print recommendations.

---

## 📂 Codebase Directory Structure

```text
├── models/
│   ├── Session.js         # Mongoose Schema for Session states & metrics
│   ├── Message.js         # Mongoose Schema for Chat transcripts
│   └── Brief.js           # Mongoose Schema for Markdown briefs
├── controllers/
│   ├── chatController.js  # Chat initialization, progression, and briefs endpoints
│   └── evaluationController.js # Serves eval-report.json and re-runs simulator
├── routes/
│   └── api.js             # Bound Express API routes
├── services/
│   └── aiService.js       # AI orchestration client (Groq / Gemini / Smart Offline Mock)
├── eval/
│   ├── personas.json      # List of 12 founder profiles and SPIN response scripts
│   └── runEval.js         # Headless simulator loop for quality-gate auditing
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Sidebar.jsx      # Navigation sidebar layout
│   │   │   └── ThemeToggle.jsx  # Dark/Light mode theme switch
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx    # SaaS KPI charts & recent chats list
│   │   │   ├── Chat.jsx         # Interactive auto-scroll client & brief renderer
│   │   │   └── Evaluation.jsx   # Quality-gate dashboard & persona manual runner
│   │   ├── App.jsx              # Application router & theme layout wrappers
│   │   ├── main.jsx             # Entry mount point
│   │   └── index.css            # Custom CSS & premium glassmorphism classes
│   ├── tailwind.config.js       # Tailwind CSS classes scanner & colors
│   ├── postcss.config.js        # PostCSS directives
│   ├── vite.config.js           # Vite settings
│   └── index.html               # SEO metadata & Google Fonts
├── package.json                 # Backend scripts & library definitions
├── .env                         # Server environment configs
├── .env.example                 # Environment keys template
└── evaluation-report.json       # Generated verification test outputs
```

---

## 🛠️ Installation & Setup

Ensure you have **Node.js (v18+)** and **MongoDB** running locally on your system.

### 1. Configure the Backend Environment
At the root directory, create a `.env` file from the template:
```bash
cp .env.example .env
```
Open `.env` and fill in your details:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/b2b-strategy-chatbot

# AI API Keys (Configure at least one for live AI; otherwise, runs on smart fallbacks)
GROQ_API_KEY=your-groq-key
GEMINI_API_KEY=your-gemini-key
```

### 2. Install Project Dependencies
Run install at the root to set up backend packages, then install frontend packages:
```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend
npm install --legacy-peer-deps
cd ..
```

---

## 💻 Running the Application

### Start the Server (Backend API)
At the root directory:
```bash
# Starts Node API server on port 5000 (with hot reloading)
npm run dev
```

### Start the React App (Frontend UI)
Open a new terminal window, navigate to the `frontend/` directory, and launch the Vite dev server:
```bash
cd frontend
# Launches client on http://localhost:5173
npm run dev
```

Open **`http://localhost:5173`** in your browser to view the premium SaaS Dashboard interface.

---

## 📊 Evaluation & Quality Gates Verification

The application features an automated, headless evaluation suite that simulates chat intake sessions for **12 different founder personas** (e.g. SaaS, E-commerce, Logistics, Agency, etc.) to verify performance.

To run the automated audit, execute the following command at the root directory:
```bash
npm run eval
```
The script will output performance statistics and save them to `evaluation-report.json`.

### 🛡️ Quality Gate Audit Results
- **Bucketed Accuracy**: **12/12 (100%)** correct classifications matched. (Minimum required: 10/12).
- **Branching Divergence**: **12/12 unique paths** verified. The questions asked build dynamically on the answers of each individual founder.
- **Repeated Questions**: **0 duplicates**. Every session consists of 8 distinct SPIN questions.
- **Markdown Briefs**: Successfully generated, downloadable, and copyable.

---

## ⚙️ AI Engine Architecture & Fallback Resilience
1. **Dynamic Questioning (SPIN)**: Programmatically maps the `currentQuestionIndex` (1-8) to the SPIN matrix. Questions 1-2 address *Situation*, 3-4 *Problem*, 5-6 *Implication*, and 7-8 *Need-payoff*.
2. **Double LLM Fail-over**: The app tries to use the Groq client (`llama-3.3-70b-versatile`). If API keys are missing or rate-limits are hit, it seamlessly falls back to Gemini (`gemini-1.5-flash`).
3. **Offline-first Heuristics**: If no internet connection or keys are provided, a smart fallback system simulates customized SPIN loops for the 12 personas and applies structural keyword classifications. This ensures developers can test all features offline.

---

## 📝 What I would do with more time (Honest Write-up)

If given an additional 20-30 hours to extend this application, I would implement:

1. **Token Streaming (WebSockets)**: Instead of loading questions and briefs in single REST blocks, I would implement Socket.io connection channels. This would allow strategy briefs and discovery questions to stream word-by-word into the chat bubbles, mimicking premium solutions like ChatGPT.
2. **Contextual Retrieval-Augmented Generation (RAG)**: I would embed a local vector store (e.g., ChromaDB or FAISS) containing successfully executed strategic case studies and playbook frameworks. The AI could perform semantic searches based on the founder's responses to inject real-world enterprise frameworks into the strategic recommendation headings.
3. **CRM Integration & Outbound Automation**: Add webhook endpoints linking to HubSpot or Salesforce. The moment a founder hits Question 8 and is categorized, their details, contact information, and generated Markdown brief would automatically sync as a qualified deal with a deal value mapped to their classification (e.g., Brand Strategy vs Ops Audit).
4. **Custom PDF Canvas Exporter**: While the browser print engine is styled clean, a client-side layout compiler (like `@react-pdf/renderer`) would allow users to download a bespoke, branded PDF complete with company watermarks, color themes mapped to their bucket, and signature blocks.
