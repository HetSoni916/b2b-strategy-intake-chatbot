import fs from 'fs';
import path from 'path';
import { runEvaluation } from '../eval/runEval.js';

const reportPath = path.join(process.cwd(), 'evaluation-report.json');

// GET /api/evaluation
export const getEvaluationReport = async (req, res) => {
  try {
    if (fs.existsSync(reportPath)) {
      const data = fs.readFileSync(reportPath, 'utf8');
      const report = JSON.parse(data);
      return res.json(report);
    } else {
      // If report doesn't exist, return a status indicating it has not been run
      return res.json({
        accuracy: 0,
        passed: false,
        metrics: {
          totalPersonas: 12,
          correctClassifications: 0,
          incorrectClassifications: 12,
          totalRepeatedQuestions: 0,
          uniquePathsCount: 0
        },
        bucketResults: [],
        branchingResults: {
          divergentPaths: false,
          uniqueQuestionPathsCount: 0,
          pathDetails: {}
        },
        notRunYet: true
      });
    }
  } catch (error) {
    console.error('Error fetching evaluation report:', error);
    return res.status(500).json({ error: 'Failed to fetch evaluation report: ' + error.message });
  }
};

// POST /api/evaluation/run
export const triggerEvaluationRun = async (req, res) => {
  try {
    // Run evaluation in background to avoid client timeout
    // We respond immediately and let it execute
    console.log('Triggering automated evaluation run...');
    
    // We execute it asynchronously
    runEvaluation({ disconnectAfter: false })
      .then(() => {
        console.log('Background evaluation run completed.');
      })
      .catch((err) => {
        console.error('Background evaluation run failed:', err);
      });

    return res.json({
      message: 'Evaluation simulation triggered. This process takes 1-2 minutes to call the LLMs and update findings. Please refresh the dashboard in a moment.'
    });
  } catch (error) {
    console.error('Error triggering evaluation run:', error);
    return res.status(500).json({ error: 'Failed to start evaluation run: ' + error.message });
  }
};
