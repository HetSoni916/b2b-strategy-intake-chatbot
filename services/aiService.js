import { Groq } from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

// Initialize APIs
let groqClient = null;
let geminiClient = null;

if (process.env.GROQ_API_KEY) {
  try {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
    console.log('AI Service: Groq client initialized.');
  } catch (err) {
    console.error('AI Service: Failed to initialize Groq client:', err.message);
  }
}

if (process.env.GEMINI_API_KEY) {
  try {
    geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    console.log('AI Service: Gemini client initialized.');
  } catch (err) {
    console.error('AI Service: Failed to initialize Gemini client:', err.message);
  }
}

// Clean JSON response helper
function extractJSON(text) {
  try {
    let cleaned = text.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
    }
    return JSON.parse(cleaned);
  } catch (e) {
    console.warn('AI Service: Failed to parse JSON directly. Attempting regex extraction.', e);
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (innerErr) {
        throw new Error('Could not parse extracted JSON block: ' + innerErr.message);
      }
    }
    throw new Error('No JSON block found in response: ' + text);
  }
}

// Check if LLM keys are configured
function isAiConfigured() {
  return !!(
    (groqClient && process.env.GROQ_API_KEY) || 
    (geminiClient && process.env.GEMINI_API_KEY)
  );
}

// Static persona mock question database
const MOCK_QUESTIONS = {
  'SaaS Founder': [
    "Welcome! Let's kick off the discovery session. To help me understand SaaSFlow Inc, could you share a bit more about your project management software and who your primary target construction users are?",
    "That makes sense. How are your current customer acquisition channels set up, and how do you capture trial signups?",
    "Understood. Out of those trial signups, where do you feel the biggest drop-offs occur, and what is your conversion rate to paid plans?",
    "What specific barriers are stopping you and your co-founder from setting up automated email templates or calling active trial users immediately?",
    "If this follow-up bottleneck isn't resolved, what is the direct impact on your cash runway and overall growth plans?",
    "How does this stagnation in MRR affect your ability to hire key engineering staff or secure further capital?",
    "If we could automate your trial conversions to 10%, how would that change your development velocity and focus?",
    "What is the ultimate value of establishing a predictable B2B sales playbook for your team right now?"
  ],
  'Ecommerce Founder': [
    "Welcome Sarah. Can you start by describing your handcrafted ceramic decor lineup and how you currently retail them direct-to-consumer?",
    "Interesting. How do you drive traffic to your store, and what are your current marketing channels?",
    "With Meta costs increasing, what is the impact on your acquisition costs, and where is the profitability breaking down?",
    "Why do you think customers buy once but fail to recall your brand or purchase again? What loyalty elements are missing?",
    "If your CAC continues to climb while repeat purchases remain under 5%, what does that do to your operational stability?",
    "How does this dependence on Meta ads affect your ability to design new ceramics collections and scale the business?",
    "If we could raise your repeat purchases to 20% and establish a strong organic channel, how would that affect your margins?",
    "What would it mean for Bloom & Clay to have a dedicated brand community of recurring customers?"
  ],
  'Manufacturing Founder': [
    "Welcome Vikram. Can you describe Patel Precision Parts' manufacturing operations and the types of custom industrial orders you handle?",
    "How do you currently track orders, schedule shop-floor production, and monitor raw steel inventory?",
    "It sounds like inventory bottlenecks occur often. What is the biggest issue causing you to run out of raw materials?",
    "Why has the office purchasing desk been disconnected from real-time stock levels on the shop floor?",
    "When 20% of orders ship late, what is the impact on customer trust, and have you lost key accounts due to this?",
    "How does this constant delivery stress and rush shipping affect your margins and your team's production morale?",
    "If we digitize your stock levels so purchasing is automated, how would that improve your lead times and capacity?",
    "What would having a reliable, real-time inventory dashboard mean for your facility's expansion goals?"
  ],
  'Healthcare Startup Founder': [
    "Welcome Elena. Can you start by telling me more about MediLink AI's diagnostic scanner software and its core clinical value?",
    "Where do you stand regarding FDA regulatory clearances, and what pilot clinics are you currently speaking with?",
    "Since you are pre-revenue, what is the primary hurdle in locking in your first hospital network contract?",
    "Why is it difficult for your technical co-founders to navigate the procurement hierarchy of clinics?",
    "If you cannot secure a clinic pilot or commercial deal in 4 months, what happens to your runway and investor confidence?",
    "How does this commercial delay affect your ability to keep your engineering team together?",
    "If we could draft a repeatable clinic sales roadmap to secure $100k in ARR, what would that enable you to achieve?",
    "How critical is it for your team to finalize a structured Go-To-Market blueprint this month?"
  ],
  'Agency Founder': [
    "Welcome Marcus. Tell me about Apex Design Studio's design services and how you find your clients.",
    "How do you currently bid on projects, and what is your average contract price for websites?",
    "You mentioned a race to the bottom. What pricing pressure are you feeling, and why are clients negotiating down?",
    "What prevents you from packaging your designs into value-based retainers rather than project billing?",
    "If your margins stay below 10%, how does that affect your cash flow and your ability to pay competitive salaries?",
    "How does working 70-hour weeks affect your strategic focus and the quality of your agency's creative output?",
    "If we could shift your billing to monthly retainers of $3,000/mo, how would that stabilize your operations?",
    "What would a structured premium packaging strategy mean for your personal freedom and agency value?"
  ],
  'Fintech Founder': [
    "Welcome David. Can you outline PayGuard Secure's transaction monitoring APIs and your target bank clients?",
    "How does your compliance team verify flagged bank transactions, and what manual audits are required?",
    "You noted bank onboarding is taking 3 months. Where is the main friction point in your current onboarding audit sequence?",
    "Why are transaction monitoring rules triggering so many false positives, forcing manual compliance review?",
    "If this onboarding backlog continues to grow, how does that impact client contract cancellations?",
    "How does this manual audit scale constraint prevent you from signing larger community bank networks?",
    "If we could automate 80% of your compliance checks, what would that do to your team's throughput and cost structure?",
    "What is the strategic value of automating onboarding templates to support bank integrations in weeks?"
  ],
  'EdTech Founder': [
    "Welcome Emily. Tell me more about K12Code Lab's coding curriculum and the school districts you serve.",
    "How does your sales team approach school administrators, and what is your pricing structure per school?",
    "With sales cycles taking 9 to 12 months, what is the biggest friction point in getting superintendent buy-in?",
    "Why is it difficult to locate the key decision-makers who hold the budget within these districts?",
    "If your school sales remain lumpy and seasonal, how does that impact your winter cash reserves?",
    "How does this long sales cycle affect your ability to plan your product roadmap or scale operations?",
    "If we could shorten your district sales cycle to 3 months, how would that affect your annual growth plan?",
    "What value would a repeatable school sales playbook bring to K12Code Lab's stability?"
  ],
  'D2C Brand Founder': [
    "Welcome Chloe. Can you share details about Luxe Botanicals' vegan skincare products and your direct sales channel?",
    "What are your current customer acquisition costs on social media, and how are you driving brand awareness?",
    "You mentioned low customer retention. Why are buyers purchasing a single bottle and never returning?",
    "Why has it been challenging to build a brand identity that connects emotionally beyond social ads?",
    "If your LTV to CAC ratio remains at 1.1x, what does that mean for your long-term ad spend viability?",
    "How does this constant struggle to buy new traffic affect your inventory planning and brand valuation?",
    "If we could increase your brand retention rate to 40%, how would that improve your profitability and cash flow?",
    "What is the ultimate value of turning transactional buyers into subscription advocates for Luxe Botanicals?"
  ],
  'Marketplace Founder': [
    "Welcome Ryan. Can you describe GigSwap's freelance marketplace and how you attract videographers?",
    "How do you currently verify videographer portfolios, and how many jobs are being booked monthly?",
    "You face a classic chicken-and-egg launch bottleneck. Why are you failing to attract business owners to post jobs?",
    "What is preventing you from launching targeted outreach campaigns to local business buyers?",
    "If videographers begin deleting their profiles due to lack of jobs, what happens to your marketplace network?",
    "How does this transaction deficit affect your ability to fund further marketplace features?",
    "If we could unlock a repeatable local business acquisition channel, how would that accelerate your network effect?",
    "What would establishing a clear demand-side Go-To-Market blueprint mean for GigSwap's seed validation?"
  ],
  'AI Startup Founder': [
    "Welcome Jason. Can you explain DataSynthesize's synthetic data generation software and the models you use?",
    "How is your pricing structured, and what are your hosting and compute costs for enterprise clients?",
    "With gross margins under 20%, how are heavy data compute requests eating into your bottom line?",
    "Why has your team kept a flat-rate subscription instead of switching to consumption-based billing?",
    "If compute costs continue to outpace subscription revenues, how does that affect your cash burn?",
    "How does this scaling deficit affect your ability to buy more GPU computing clusters?",
    "If we transition your clients to usage-based credit packages, how would that improve your gross margins?",
    "What would a value-aligned pricing model mean for DataSynthesize's scalability and profitability?"
  ],
  'Logistics Founder': [
    "Welcome Tariq. Can you describe RouteFlow Logistics' delivery fleet and the businesses you serve?",
    "How do your dispatchers schedule routes every morning, and what communication tools do you use?",
    "With 15% late deliveries, where are the primary route planning errors and delays occurring?",
    "Why are dispatchers relying on spreadsheets rather than real-time routing optimization?",
    "If late deliveries continue, what are the penalty charges, and are you at risk of losing core contracts?",
    "How does this routing inefficiency and fuel waste affect your overall business profit margins?",
    "If we automate routing to decrease fuel consumption by 15%, how would that optimize your fleet capacity?",
    "What would a digital dispatch operation mean for your fleet scaling capacity?"
  ],
  'Real Estate Founder': [
    "Welcome Victoria. Tell me about Vance & Co Realty's brokerage business and your agent roster.",
    "How do you currently purchase leads, and how are they assigned to agents when they arrive?",
    "You mentioned leads are sitting in inboxes for hours. What is causing this follow-up delay among agents?",
    "Why has it been difficult to enforce a speed-to-lead follow-up policy among your independent agents?",
    "If 70% of premium leads go uncontacted, what is the direct financial waste of your ad budget?",
    "How does this lack of lead conversions affect agent retention and your brokerage's market position?",
    "If we could alert agents in 60 seconds and automate text follow-up, how would that increase closed sales?",
    "What is the value of establishing an automated lead routing system for your brokerage's growth?"
  ]
};

// Heuristic questions for organic visitors
const ORGANIC_MOCK_QUESTIONS = [
  "Welcome! Let's begin our B2B strategy intake. To start, could you explain what your primary B2B product or service is, and who your target audience is?",
  "Thank you. How are your team operations and customer delivery systems currently structured?",
  "What is the single biggest bottleneck or challenge preventing your company from scaling right now?",
  "Can you detail the specific operational, sales, or branding friction point that is costing you the most money or hours?",
  "If this bottleneck remains unresolved for the next 6 months, what will be the direct impact on your revenue and growth?",
  "How does this issue affect your overall team morale and long-term client satisfaction?",
  "If we could eliminate this friction point entirely, how would that relieve pressure on your daily operations?",
  "What would an optimized, high-growth state look like for your company once this blocker is resolved?"
];

// Map persona names to target buckets
const PERSONA_BUCKET_MAP = {
  'SaaS Founder': 'Sales',
  'Ecommerce Founder': 'Brand',
  'Manufacturing Founder': 'Ops',
  'Healthcare Startup Founder': 'GTM',
  'Agency Founder': 'Pricing',
  'Fintech Founder': 'Ops',
  'EdTech Founder': 'Sales',
  'D2C Brand Founder': 'Brand',
  'Marketplace Founder': 'GTM',
  'AI Founder': 'Pricing',
  'AI Startup Founder': 'Pricing',
  'Logistics Founder': 'Ops',
  'Real Estate Founder': 'Sales'
};

/**
 * Calls the available LLM (Groq first, fallback to Gemini, then Mock if keys are missing)
 */
async function callLLM({ systemPrompt, userPrompt, jsonMode = false }) {
  if (groqClient && process.env.GROQ_API_KEY) {
    try {
      console.log('Calling Groq LLM...');
      const response = await groqClient.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        response_format: jsonMode ? { type: 'json_object' } : undefined
      });
      return response.choices[0].message.content;
    } catch (err) {
      console.error('Groq LLM call failed, falling back to Gemini...', err.message);
    }
  }

  if (geminiClient && process.env.GEMINI_API_KEY) {
    try {
      console.log('Calling Gemini LLM...');
      let model;
      if (typeof geminiClient.getGenerativeModel === 'function') {
        model = geminiClient.getGenerativeModel({ model: 'gemini-1.5-flash' });
      } else {
        model = geminiClient.models.get('gemini-1.5-flash');
      }
      
      const contents = [
        { role: 'user', parts: [{ text: `${systemPrompt}\n\nUser Request:\n${userPrompt}` }] }
      ];
      
      const result = await model.generateContent({
        contents,
        generationConfig: jsonMode ? {
          responseMimeType: 'application/json'
        } : undefined
      });
      
      const responseText = result.response.text();
      return responseText;
    } catch (err) {
      console.error('Gemini LLM call failed.', err.message);
    }
  }

  throw new Error('No LLM API keys configured or active.');
}

/**
 * Generates the next question in the 8-question SPIN discovery flow
 */
export async function generateNextQuestion({ session, history }) {
  const currentIdx = session.currentQuestionIndex;

  // Smart Mock Fallback if API keys are missing
  if (!isAiConfigured()) {
    console.log(`AI Service: Running in offline Mock Mode for question generation index: ${currentIdx}`);
    const persona = session.personaName;
    if (persona && MOCK_QUESTIONS[persona]) {
      return MOCK_QUESTIONS[persona][currentIdx - 1] || 'Could you describe your operations?';
    }
    return ORGANIC_MOCK_QUESTIONS[currentIdx - 1] || 'Could you describe your operations?';
  }

  // AI Generation
  let spinPhase = '';
  let spinGuideline = '';
  if (currentIdx <= 2) {
    spinPhase = 'SITUATION';
    spinGuideline = 'Ask about facts, background context, operations, business model, and current tools or strategies.';
  } else if (currentIdx <= 4) {
    spinPhase = 'PROBLEM';
    spinGuideline = 'Focus on difficulties, obstacles, pain points, bottlenecks, or dissatisfaction. Probe where they are losing money or time.';
  } else if (currentIdx <= 6) {
    spinPhase = 'IMPLICATION';
    spinGuideline = 'Explore the consequences or effects of the identified problems. What happens if this is not resolved in 6 months?';
  } else {
    spinPhase = 'NEED-PAYOFF';
    spinGuideline = 'Get the founder to verbalize the benefits of a solution.';
  }

  const systemPrompt = `You are a Senior B2B Strategy Consultant.
Conduct a discovery intake chat with a founder using the SPIN framework.
Currently, you are generating Question #${currentIdx} of 8.

SPIN Framework Phase: ${spinPhase}
Guideline: ${spinGuideline}

RULES:
1. Ask exactly ONE question. Never bundle multiple questions.
2. Never repeat any question that has been asked previously.
3. Build on previous responses to create a branching conversation.
4. Output strictly as JSON:
{
  "question": "your next SPIN question here"
}`;

  const formattedHistory = history.map(msg => `${msg.role === 'user' ? 'Founder' : 'Consultant'}: ${msg.content}`).join('\n');
  const questionsAskedStr = session.questionsAsked.map((q, i) => `Question ${i + 1}: ${q}`).join('\n');

  const userPrompt = `FOUNDER CONTEXT:
Founder Name: ${session.founderName}
Company: ${session.companyName}
Target Persona: ${session.personaName || 'General Founder'}

QUESTIONS ALREADY ASKED:
${questionsAskedStr || 'None yet.'}

CONVERSATION TRANSCRIPT:
${formattedHistory || 'No conversation history. Welcome them and ask the first Situation question.'}

Generate Question #${currentIdx}. Return JSON structure only.`;

  try {
    const rawResult = await callLLM({ systemPrompt, userPrompt, jsonMode: true });
    const parsed = extractJSON(rawResult);
    return parsed.question || 'How are you currently handling operations and growth?';
  } catch (err) {
    console.error('LLM question generation failed, using mock backup:', err.message);
    const persona = session.personaName;
    if (persona && MOCK_QUESTIONS[persona]) {
      return MOCK_QUESTIONS[persona][currentIdx - 1];
    }
    return ORGANIC_MOCK_QUESTIONS[currentIdx - 1];
  }
}

/**
 * Classifies the chat transcript into one of the 5 engagement buckets
 */
export async function classifySession({ session, history }) {
  // Smart Mock Fallback
  if (!isAiConfigured()) {
    console.log(`AI Service: Running in offline Mock Mode for bucket classification`);
    const persona = session.personaName;
    if (persona && PERSONA_BUCKET_MAP[persona]) {
      return PERSONA_BUCKET_MAP[persona];
    }
    
    // Heuristic analysis of transcripts
    const text = history.map(h => h.content).join(' ').toLowerCase();
    if (text.includes('ad cost') || text.includes('organic') || text.includes('brand recall') || text.includes('retention')) return 'Brand';
    if (text.includes('conversion') || text.includes('leads') || text.includes('sales cycle') || text.includes('follow-up')) return 'Sales';
    if (text.includes('pricing') || text.includes('margins') || text.includes('retainer') || text.includes('billing')) return 'Pricing';
    if (text.includes('inventory') || text.includes('dispatch') || text.includes('compliance') || text.includes('operations')) return 'Ops';
    if (text.includes('gtm') || text.includes('launch') || text.includes('positioning') || text.includes('chicken-and-egg')) return 'GTM';
    return 'GTM'; // Default fallback
  }

  // AI Classification
  const systemPrompt = `You are an expert B2B business classifier.
Analyze the complete conversation history and categorize their primary business challenge into exactly ONE of the following 5 buckets:

- GTM: Go-To-Market issues, target customer mismatch, positioning, launch strategy, market entry.
- Sales: Sales pipeline leaks, low conversion rates, lack of sales process, close rates, outreach efficiency.
- Pricing: Margins are low, discounting too much, unclear pricing tiers, monetization challenges.
- Brand: Brand awareness, content marketing, trust issues, community building, PR, identity.
- Ops: Operational bottlenecks, delivery scaling issues, low productivity, team coordination, system/tool chaos.

RULES:
- Return exactly one of these strings: "GTM", "Sales", "Pricing", "Brand", "Ops".
- Output strictly as JSON:
{
  "bucket": "GTM" | "Sales" | "Pricing" | "Brand" | "Ops"
}`;

  const formattedHistory = history.map(msg => `${msg.role === 'user' ? 'Founder' : 'Consultant'}: ${msg.content}`).join('\n');
  const userPrompt = `FOUNDER CONTEXT:
Founder: ${session.founderName}
Company: ${session.companyName}
Target Persona: ${session.personaName || 'General Founder'}

CONVERSATION TRANSCRIPT:
${formattedHistory}

Determine the primary bottleneck. Return JSON structure only.`;

  try {
    const rawResult = await callLLM({ systemPrompt, userPrompt, jsonMode: true });
    const parsed = extractJSON(rawResult);
    const validBuckets = ['GTM', 'Sales', 'Pricing', 'Brand', 'Ops'];
    if (validBuckets.includes(parsed.bucket)) {
      return parsed.bucket;
    }
    const upper = (parsed.bucket || '').toUpperCase();
    if (upper === 'OPS' || upper === 'OPERATIONS') return 'Ops';
    if (upper === 'GTM') return 'GTM';
    if (upper === 'SALES') return 'Sales';
    if (upper === 'PRICING') return 'Pricing';
    if (upper === 'BRAND') return 'Brand';
    return 'GTM';
  } catch (err) {
    console.error('LLM classification failed, using heuristic backup:', err.message);
    const persona = session.personaName;
    if (persona && PERSONA_BUCKET_MAP[persona]) {
      return PERSONA_BUCKET_MAP[persona];
    }
    return 'GTM';
  }
}

/**
 * Generates the strategic engagement brief in Markdown format
 */
export async function generateStrategyBrief({ session, history, bucket }) {
  // Smart Mock Fallback Templates
  if (!isAiConfigured()) {
    console.log(`AI Service: Running in offline Mock Mode for brief generation`);
    return `# Executive Summary
${session.founderName}, founder of ${session.companyName}, has completed the B2B consultative strategy intake. The startup represents a highly focused ${session.personaName || 'innovative business'} solving core industry challenges. This document presents the strategic findings, operational analysis, and a recommended roadmap tailored specifically for their bottleneck.

# Company Overview
- **Founder**: ${session.founderName}
- **Company**: ${session.companyName}
- **Scale Profile**: Early/growth stage startup facing scalable distribution hurdles.
- **Identified Focus Area**: ${bucket} Strategy

# Key Challenges
- Inefficient operations and alignment causing friction in scaling.
- Primary bottleneck categorized in **${bucket}** causing customer leaks, margin compression, or growth caps.
- Lack of centralized dashboards, causing manual processes and operational delays.

# Business Analysis
A detailed review of ${session.companyName}'s discovery transcript shows that while the underlying product/market fit is strong, execution scaling is bottlenecked. The founder is currently playing the role of operator, developer, and sales director, resulting in massive personal time drains and team-level communications failure.

# Recommended Engagement
We recommend an immediate, dedicated **${bucket} Optimization Engagement**. This 8-week consulting accelerator focuses on standardizing ${bucket} procedures, building automated tool integrations, and aligning executive scorecards with client lifetime values.

# Strategic Recommendations
1. **Reposition the Core Thesis**: Shift from standard transactional delivery to premium, value-driven assets.
2. **Setup Smart Infrastructure**: Implement tracking dashboards (CRMs or analytics) to eliminate manual entry errors.
3. **Establish Standard Operations Playbook**: Document recurring team workflows to support quick, automated onboarding of staff.

# Next 3 Action Steps
1. Audit current daily manual tasks and assign a dollar-value cost to time spent.
2. Implement a single dashboard tracker to monitor the primary metric governing your **${bucket}** funnel.
3. Schedule a follow-up architecture review to wire up automated CRM/outreach alerts.`;
  }

  // AI Brief Generation
  const systemPrompt = `You are a Senior B2B Strategy Consultant.
Based on the discovery interview, compile a comprehensive 1-page business engagement brief in Markdown.

The brief must follow this structure:

# Executive Summary
# Company Overview
# Key Challenges
# Business Analysis
# Recommended Engagement
# Strategic Recommendations
# Next 3 Action Steps

Return Markdown content only. Do not add conversational prefixes/suffixes.`;

  const formattedHistory = history.map(msg => `${msg.role === 'user' ? 'Founder' : 'Consultant'}: ${msg.content}`).join('\n');
  const userPrompt = `FOUNDER CONTEXT:
Founder Name: ${session.founderName}
Company: ${session.companyName}
Engagement Bucket: ${bucket}

CONVERSATION TRANSCRIPT:
${formattedHistory}

Generate the brief. Return Markdown content only.`;

  try {
    return await callLLM({ systemPrompt, userPrompt, jsonMode: false });
  } catch (err) {
    console.error('LLM brief generation failed, using mock backup:', err.message);
    return `# Executive Summary
Fail-safe strategic intake brief for ${session.companyName} compiled via fallback template.`;
  }
}
