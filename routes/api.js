import express from 'express';
import {
  startSession,
  handleMessage,
  resumeSession,
  reclassifySession,
  forceGenerateBrief,
  getBrief,
  listSessions,
  deleteSession
} from '../controllers/chatController.js';
import {
  getEvaluationReport,
  triggerEvaluationRun
} from '../controllers/evaluationController.js';

const router = express.Router();

// Chat Operations
router.post('/chat/start', startSession);
router.post('/chat/message', handleMessage);
router.post('/chat/resume', resumeSession);
router.post('/classify', reclassifySession);
router.post('/generate-brief', forceGenerateBrief);
router.get('/brief/:id', getBrief);
router.get('/sessions', listSessions);
router.delete('/sessions/:id', deleteSession);

// Evaluation Operations
router.get('/evaluation', getEvaluationReport);
router.post('/evaluation/run', triggerEvaluationRun);

export default router;
