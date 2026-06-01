import Session from '../models/Session.js';
import Message from '../models/Message.js';
import Brief from '../models/Brief.js';
import * as aiService from '../services/aiService.js';

// Helper to generate a simple UUID/Session ID
function generateId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// POST /api/chat/start
export const startSession = async (req, res) => {
  try {
    const { founderName, companyName, personaName } = req.body;

    if (!founderName) {
      return res.status(400).json({ error: 'Founder name is required' });
    }

    const sessionId = generateId();

    const newSession = new Session({
      sessionId,
      founderName,
      companyName: companyName || 'Stealth Startup',
      personaName: personaName || null,
      currentQuestionIndex: 1,
      status: 'active'
    });

    // Generate first question
    const firstQuestion = await aiService.generateNextQuestion({
      session: newSession,
      history: []
    });

    newSession.currentQuestion = firstQuestion;
    newSession.questionsAsked.push(firstQuestion);
    await newSession.save();

    // Store first question message
    const assistantMessage = new Message({
      sessionId,
      role: 'assistant',
      content: firstQuestion
    });
    await assistantMessage.save();

    return res.status(201).json({
      sessionId,
      founderName: newSession.founderName,
      companyName: newSession.companyName,
      currentQuestion: firstQuestion,
      currentQuestionIndex: 1,
      status: 'active',
      messages: [assistantMessage]
    });
  } catch (error) {
    console.error('Error starting session:', error);
    return res.status(500).json({ error: 'Failed to start chat session: ' + error.message });
  }
};

// POST /api/chat/message
export const handleMessage = async (req, res) => {
  try {
    const { sessionId, content } = req.body;

    if (!sessionId || !content) {
      return res.status(400).json({ error: 'sessionId and message content are required' });
    }

    const session = await Session.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.status === 'completed') {
      return res.status(400).json({ error: 'Session is already completed' });
    }

    // 1. Save user response
    const userMessage = new Message({
      sessionId,
      role: 'user',
      content
    });
    await userMessage.save();

    // Get current transcript for history context
    const history = await Message.find({ sessionId }).sort({ timestamp: 1 });

    // 2. Increment question counter
    session.currentQuestionIndex += 1;

    if (session.currentQuestionIndex <= 8) {
      // 3. Generate and save next question
      const nextQuestion = await aiService.generateNextQuestion({
        session,
        history
      });

      session.currentQuestion = nextQuestion;
      session.questionsAsked.push(nextQuestion);
      await session.save();

      const assistantMessage = new Message({
        sessionId,
        role: 'assistant',
        content: nextQuestion
      });
      await assistantMessage.save();

      return res.json({
        sessionId,
        currentQuestion: nextQuestion,
        currentQuestionIndex: session.currentQuestionIndex,
        status: 'active',
        message: assistantMessage
      });
    } else {
      // Chat is finished!
      session.status = 'completed';
      session.currentQuestion = '';
      await session.save();

      // Update full history (including newest inputs)
      const fullHistory = await Message.find({ sessionId }).sort({ timestamp: 1 });

      // 4. Classify bucket
      const bucket = await aiService.classifySession({
        session,
        history: fullHistory
      });

      session.bucket = bucket;
      await session.save();

      // 5. Generate strategy brief
      const briefMarkdown = await aiService.generateStrategyBrief({
        session,
        history: fullHistory,
        bucket
      });

      // 6. Save Brief document
      const brief = new Brief({
        sessionId,
        markdown: briefMarkdown,
        bucket
      });
      await brief.save();

      return res.json({
        sessionId,
        currentQuestionIndex: 8,
        status: 'completed',
        bucket,
        briefMarkdown,
        briefId: brief._id
      });
    }
  } catch (error) {
    console.error('Error handling message:', error);
    return res.status(500).json({ error: 'Failed to process message: ' + error.message });
  }
};

// POST /api/chat/resume
export const resumeSession = async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    const session = await Session.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const messages = await Message.find({ sessionId }).sort({ timestamp: 1 });
    const brief = await Brief.findOne({ sessionId });

    return res.json({
      session,
      messages,
      brief: brief ? brief.markdown : null
    });
  } catch (error) {
    console.error('Error resuming session:', error);
    return res.status(500).json({ error: 'Failed to resume session: ' + error.message });
  }
};

// POST /api/classify
export const reclassifySession = async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    const session = await Session.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const history = await Message.find({ sessionId }).sort({ timestamp: 1 });
    const bucket = await aiService.classifySession({ session, history });

    session.bucket = bucket;
    await session.save();

    // Check if brief exists, update its bucket too
    const brief = await Brief.findOne({ sessionId });
    if (brief) {
      brief.bucket = bucket;
      await brief.save();
    }

    return res.json({ sessionId, bucket });
  } catch (error) {
    console.error('Error reclassifying session:', error);
    return res.status(500).json({ error: 'Failed to classify session: ' + error.message });
  }
};

// POST /api/generate-brief
export const forceGenerateBrief = async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    const session = await Session.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const history = await Message.find({ sessionId }).sort({ timestamp: 1 });
    
    // Ensure bucket is set
    let bucket = session.bucket;
    if (bucket === 'Unclassified') {
      bucket = await aiService.classifySession({ session, history });
      session.bucket = bucket;
      await session.save();
    }

    const briefMarkdown = await aiService.generateStrategyBrief({ session, history, bucket });

    // Update or Insert Brief
    let brief = await Brief.findOne({ sessionId });
    if (brief) {
      brief.markdown = briefMarkdown;
      brief.bucket = bucket;
      brief.generatedAt = new Date();
      await brief.save();
    } else {
      brief = new Brief({
        sessionId,
        markdown: briefMarkdown,
        bucket
      });
      await brief.save();
    }

    return res.json({ sessionId, bucket, briefMarkdown });
  } catch (error) {
    console.error('Error forced brief generation:', error);
    return res.status(500).json({ error: 'Failed to generate brief: ' + error.message });
  }
};

// GET /api/brief/:id
export const getBrief = async (req, res) => {
  try {
    const { id } = req.params; // Supports either sessionId or Brief _id
    let brief = await Brief.findOne({ sessionId: id });
    if (!brief) {
      // Fallback try _id lookup
      try {
        brief = await Brief.findById(id);
      } catch (err) {
        // Not a valid ObjectId format, ignore
      }
    }

    if (!brief) {
      return res.status(404).json({ error: 'Strategy Brief not found' });
    }

    return res.json(brief);
  } catch (error) {
    console.error('Error fetching brief:', error);
    return res.status(500).json({ error: 'Failed to get brief: ' + error.message });
  }
};

// GET /api/sessions
export const listSessions = async (req, res) => {
  try {
    const sessions = await Session.find().sort({ createdAt: -1 });
    
    // Enrich sessions with brief details if available
    const enriched = await Promise.all(
      sessions.map(async (sess) => {
        const brief = await Brief.findOne({ sessionId: sess.sessionId }).select('_id');
        return {
          ...sess.toObject(),
          briefId: brief ? brief._id : null
        };
      })
    );

    return res.json(enriched);
  } catch (error) {
    console.error('Error listing sessions:', error);
    return res.status(500).json({ error: 'Failed to list sessions: ' + error.message });
  }
};

// DELETE /api/sessions/:id
export const deleteSession = async (req, res) => {
  try {
    const { id } = req.params;
    const session = await Session.findOneAndDelete({ sessionId: id });
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // Clean up related messages and briefs
    await Message.deleteMany({ sessionId: id });
    await Brief.deleteOne({ sessionId: id });

    return res.json({ message: 'Session deleted successfully' });
  } catch (error) {
    console.error('Error deleting session:', error);
    return res.status(500).json({ error: 'Failed to delete session: ' + error.message });
  }
};
