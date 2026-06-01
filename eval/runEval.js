import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

import Session from '../models/Session.js';
import Message from '../models/Message.js';
import Brief from '../models/Brief.js';
import * as aiService from '../services/aiService.js';

dotenv.config();

const personasPath = path.join(process.cwd(), 'eval', 'personas.json');
const reportPath = path.join(process.cwd(), 'evaluation-report.json');

async function runEvaluation({ disconnectAfter = true } = {}) {
  console.log('=== Starting Automated Persona Evaluation ===');

  // 1. Connect to MongoDB
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/b2b-strategy-chatbot';
  console.log(`Connecting to database: ${mongoUri}`);
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB successfully.');
  } catch (err) {
    console.error('Failed to connect to MongoDB. Make sure your local MongoDB instance is running!', err.message);
    process.exit(1);
  }

  // 2. Load personas
  let personas;
  try {
    const rawPersonas = fs.readFileSync(personasPath, 'utf8');
    personas = JSON.parse(rawPersonas);
    console.log(`Loaded ${personas.length} personas for evaluation.`);
  } catch (err) {
    console.error(`Failed to read personas.json at ${personasPath}:`, err.message);
    await mongoose.disconnect();
    process.exit(1);
  }

  // Clear previous evaluation test data (sessions marked with personaName != null)
  console.log('Cleaning old evaluation sessions from the database...');
  await Session.deleteMany({ personaName: { $ne: null } });
  
  const bucketResults = [];
  const allQuestionPaths = {};
  let correctCount = 0;
  let totalRepeatedQuestions = 0;

  // 3. Simulate chats for each persona
  for (let idx = 0; idx < personas.length; idx++) {
    const p = personas[idx];
    console.log(`\n--------------------------------------------------`);
    console.log(`Simulating Persona #${idx + 1}: ${p.persona} - ${p.name} (${p.company})`);
    console.log(`Expected Bucket: ${p.expectedBucket}`);
    console.log(`--------------------------------------------------`);

    const sessionId = `eval_session_${p.id}_${Date.now()}`;
    
    // Create the session
    const session = new Session({
      sessionId,
      founderName: p.name,
      companyName: p.company,
      personaName: p.persona,
      currentQuestionIndex: 1,
      status: 'active'
    });

    const questionsAsked = [];
    const chatHistory = [];

    // SPIN Chat loop
    for (let questionNum = 1; questionNum <= 8; questionNum++) {
      session.currentQuestionIndex = questionNum;

      // AI Generates a question
      console.log(`[AI] Generating question ${questionNum}/8...`);
      const question = await aiService.generateNextQuestion({
        session,
        history: chatHistory
      });

      console.log(`Question Asked: "${question}"`);
      questionsAsked.push(question);
      session.questionsAsked.push(question);

      // Record Assistant message
      const assistantMsg = { role: 'assistant', content: question };
      chatHistory.push(assistantMsg);

      // Save to DB (optional, but good for persistence)
      const assistantMessageDoc = new Message({
        sessionId,
        role: 'assistant',
        content: question
      });
      await assistantMessageDoc.save();

      // Simulate User answering
      const userAnswerText = p.answers[questionNum - 1];
      console.log(`[User Response]: "${userAnswerText}"`);

      // Record User message
      const userMsg = { role: 'user', content: userAnswerText };
      chatHistory.push(userMsg);

      const userMessageDoc = new Message({
        sessionId,
        role: 'user',
        content: userAnswerText
      });
      await userMessageDoc.save();
    }

    // Save final questions to session
    session.currentQuestion = '';
    session.status = 'completed';
    await session.save();

    // Classify Bucket
    console.log('[AI] Running bucket classification...');
    const predictedBucket = await aiService.classifySession({
      session,
      history: chatHistory
    });
    console.log(`Predicted Bucket: ${predictedBucket} | Expected: ${p.expectedBucket}`);

    session.bucket = predictedBucket;
    await session.save();

    // Generate Brief
    console.log('[AI] Generating strategy brief...');
    const briefMarkdown = await aiService.generateStrategyBrief({
      session,
      history: chatHistory,
      bucket: predictedBucket
    });

    const briefDoc = new Brief({
      sessionId,
      markdown: briefMarkdown,
      bucket: predictedBucket
    });
    await briefDoc.save();

    console.log('Strategy brief successfully generated.');

    // Analyze results for this persona
    const isMatch = predictedBucket.toLowerCase() === p.expectedBucket.toLowerCase();
    if (isMatch) {
      correctCount++;
    }

    // Check for duplicate questions (strict string comparison, lowercase, trim)
    const uniqueQuestions = new Set(questionsAsked.map(q => q.toLowerCase().trim()));
    const duplicatesCount = questionsAsked.length - uniqueQuestions.size;
    if (duplicatesCount > 0) {
      console.warn(`⚠️ Warning: Detected ${duplicatesCount} repeated questions for persona ${p.persona}`);
      totalRepeatedQuestions += duplicatesCount;
    }

    bucketResults.push({
      persona: p.persona,
      founder: p.name,
      company: p.company,
      expected: p.expectedBucket,
      predicted: predictedBucket,
      match: isMatch,
      repeatedQuestionsCount: duplicatesCount
    });

    allQuestionPaths[p.id] = questionsAsked;
  }

  // 4. Analyze Branching
  // We compare the question sets of all personas to verify that branching actually happened.
  // If the path was static, then all personas would have the exact same list of questions.
  // We check pairwise overlaps.
  let isBranchingDemonstrated = true;
  let uniquePathsCount = 0;
  const pathFingerprints = new Set();

  for (const [id, path] of Object.entries(allQuestionPaths)) {
    const fingerprint = path.join('|').toLowerCase();
    pathFingerprints.add(fingerprint);
  }
  uniquePathsCount = pathFingerprints.size;

  // We need branching on at least 4 personas (different question paths).
  // If unique paths count is >= 4, branching is clearly demonstrated!
  isBranchingDemonstrated = uniquePathsCount >= 4;

  const accuracy = correctCount / personas.length;
  // Criteria: accuracy >= 10/12 (approx 0.833) and branching demonstrated, no repeated questions (or low/zero)
  const passed = correctCount >= 10 && isBranchingDemonstrated;

  const report = {
    accuracy,
    passed,
    metrics: {
      totalPersonas: personas.length,
      correctClassifications: correctCount,
      incorrectClassifications: personas.length - correctCount,
      totalRepeatedQuestions,
      uniquePathsCount
    },
    bucketResults,
    branchingResults: {
      divergentPaths: isBranchingDemonstrated,
      uniqueQuestionPathsCount: uniquePathsCount,
      pathDetails: Object.fromEntries(
        Object.entries(allQuestionPaths).map(([id, path]) => [id, path.slice(0, 3)]) // log first 3 questions for brevity
      )
    }
  };

  // Save report
  try {
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
    console.log(`\n==================================================`);
    console.log(`Evaluation Completed! Report written to: ${reportPath}`);
    console.log(`Accuracy: ${(accuracy * 100).toFixed(1)}% (${correctCount}/${personas.length})`);
    console.log(`Branching Demonstrated: ${isBranchingDemonstrated} (${uniquePathsCount} unique paths)`);
    console.log(`Repeated Questions Count: ${totalRepeatedQuestions}`);
    console.log(`Status: ${passed ? 'PASSED' : 'FAILED'}`);
    console.log(`==================================================`);
  } catch (err) {
    console.error('Failed to write evaluation-report.json:', err.message);
  }

  // 5. Disconnect DB
  if (disconnectAfter) {
    await mongoose.disconnect();
    console.log('Database connection closed.');
  } else {
    console.log('Database connection kept alive (Express session).');
  }
}

// Check if run directly
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('runEval.js')) {
  runEvaluation();
}

export { runEvaluation };
