import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  Play, RefreshCw, BarChart2, CheckCircle2, XCircle, AlertTriangle, 
  HelpCircle, ChevronRight, Award, Compass, MessageSquareDot, HelpCircle as HelpIcon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_BASE = 'http://localhost:5000/api';

const BUCKET_COLORS = {
  GTM: '#3b82f6',
  Sales: '#10b981',
  Pricing: '#f59e0b',
  Brand: '#ec4899',
  Ops: '#8b5cf6',
  Unclassified: '#9ca3af'
};

export default function Evaluation() {
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [runningEval, setRunningEval] = useState(false);
  const [evalMessage, setEvalMessage] = useState('');
  const [personas, setPersonas] = useState([]);
  const [simulatingPersonaId, setSimulatingPersonaId] = useState(null);

  // Fetch report
  const fetchReport = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/evaluation`);
      setReport(res.data);
    } catch (err) {
      console.error('Error fetching report:', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // Fetch personas to populate dropdown/cards
  const fetchPersonas = async () => {
    try {
      // We can fetch from local static file or we know they are in personas.json.
      // Let's import/fetch them. We can also fetch the personas via a public folder,
      // or we can read them from a hardcoded list matching eval/personas.json since it matches perfectly.
      // Let's fetch them from a file, or define the metadata directly here to save an API request.
      const res = await axios.get('http://localhost:5000/api/sessions');
      // Set default personas list
      setPersonas([
        { id: 'saas_founder', name: 'Alex Chen', company: 'SaaSFlow Inc', type: 'SaaS Founder', bucket: 'Sales' },
        { id: 'ecommerce_founder', name: 'Sarah Jenkins', company: 'Bloom & Clay', type: 'Ecommerce Founder', bucket: 'Brand' },
        { id: 'manufacturing_founder', name: 'Vikram Patel', company: 'Patel Precision Parts', type: 'Manufacturing Founder', bucket: 'Ops' },
        { id: 'healthcare_founder', name: 'Elena Rostova', company: 'MediLink AI', type: 'Healthcare Startup Founder', bucket: 'GTM' },
        { id: 'agency_founder', name: 'Marcus Sterling', company: 'Apex Design Studio', type: 'Agency Founder', bucket: 'Pricing' },
        { id: 'fintech_founder', name: 'David Kross', company: 'PayGuard Secure', type: 'Fintech Founder', bucket: 'Ops' },
        { id: 'edtech_founder', name: 'Emily Watson', company: 'K12Code Lab', type: 'EdTech Founder', bucket: 'Sales' },
        { id: 'd2c_brand_founder', name: 'Chloe Bennett', company: 'Luxe Botanicals', type: 'D2C Brand Founder', bucket: 'Brand' },
        { id: 'marketplace_founder', name: 'Ryan Miller', company: 'GigSwap', type: 'Marketplace Founder', bucket: 'GTM' },
        { id: 'ai_founder', name: 'Jason Tang', company: 'DataSynthesize', type: 'AI Founder', bucket: 'Pricing' },
        { id: 'logistics_founder', name: 'Tariq Mahmood', company: 'RouteFlow Logistics', type: 'Logistics Founder', bucket: 'Ops' },
        { id: 'realestate_founder', name: 'Victoria Vance', company: 'Vance & Co Realty', type: 'Real Estate Founder', bucket: 'Sales' }
      ]);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchReport();
    fetchPersonas();
  }, []);

  // Poll for report updates while evaluation runs
  useEffect(() => {
    let interval;
    if (runningEval) {
      interval = setInterval(() => {
        fetchReport(false);
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [runningEval]);

  // If report exists and passed condition or stopped running, turn off spinner
  useEffect(() => {
    if (report && !report.notRunYet && runningEval) {
      // Check if accuracy is updated or if message has been visible
      setRunningEval(false);
      setEvalMessage('Evaluation run finished and loaded.');
    }
  }, [report]);

  const handleRunEvaluation = async () => {
    setRunningEval(true);
    setEvalMessage('Initializing persona simulations. Standard run loops all 12 founders (96 LLM interactions)...');
    try {
      const res = await axios.post(`${API_BASE}/evaluation/run`);
      setEvalMessage(res.data.message);
    } catch (err) {
      console.error('Error starting evaluation:', err);
      setEvalMessage('Failed to trigger evaluation. Make sure server is online.');
      setRunningEval(false);
    }
  };

  // Simulates a single persona in the chat by starting it programmatically
  const handleSimulateSingle = async (personaId) => {
    setSimulatingPersonaId(personaId);
    try {
      // Find the persona config
      const matchingPersona = personas.find(p => p.id === personaId);
      if (!matchingPersona) return;

      const res = await axios.post(`${API_BASE}/chat/start`, {
        founderName: matchingPersona.name,
        companyName: matchingPersona.company,
        personaName: matchingPersona.type
      });

      // Now, instead of running the whole loop in background,
      // let's redirect the user to the Chat page with this session ID!
      // Since it's started, the user can chat with it or resume it!
      // Wait, even better, we let them click "Play / Simulate" and we navigate
      // to the chat page, pre-populating the chat so they can watch or participate.
      navigate(`/chat?sessionId=${res.data.sessionId}`);
    } catch (err) {
      alert('Failed to launch simulation: ' + err.message);
    } finally {
      setSimulatingPersonaId(null);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
            Automated Evaluation Suite
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            System validator checking classification gates (10/12 matches) and state-aware branching.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchReport(true)}
            className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition shadow-sm"
          >
            <RefreshCw className="h-4 w-4" />
            Reload Report
          </button>
          <button
            onClick={handleRunEvaluation}
            disabled={runningEval}
            className="flex items-center gap-2 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:bg-brand-400 text-white px-4 py-2 text-sm font-medium transition shadow-md cursor-pointer"
          >
            <Play className="h-4 w-4" />
            {runningEval ? 'Simulating All...' : 'Run Full Evaluation'}
          </button>
        </div>
      </div>

      {evalMessage && (
        <div className="rounded-xl border border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-900 p-4 text-sm text-blue-600 dark:text-blue-400 flex items-center gap-3 animate-pulse-subtle">
          <RefreshCw className="h-4 w-4 animate-spin" />
          {evalMessage}
        </div>
      )}

      {/* Aggregate Stats */}
      {report && (
        <div className="grid gap-6 md:grid-cols-4">
          <div className="glass-panel rounded-2xl p-6">
            <span className="text-sm font-medium text-gray-500">Evaluation Status</span>
            <div className="mt-4 flex items-center gap-2">
              {report.passed ? (
                <>
                  <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                  <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">PASSED</span>
                </>
              ) : (
                <>
                  <XCircle className="h-8 w-8 text-red-500" />
                  <span className="text-2xl font-bold text-red-600 dark:text-red-400">FAILED</span>
                </>
              )}
            </div>
            <p className="text-[10px] text-gray-400 mt-2">Requires ≥ 83.3% accuracy & branching verified</p>
          </div>

          <div className="glass-panel rounded-2xl p-6">
            <span className="text-sm font-medium text-gray-500">Classification Accuracy</span>
            <div className="mt-4">
              <span className="text-3xl font-bold">{(report.accuracy * 100).toFixed(1)}%</span>
              <p className="text-[10px] text-gray-400 mt-2">
                {report.metrics?.correctClassifications || 0} of {report.metrics?.totalPersonas || 12} correctly bucketed
              </p>
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-6">
            <span className="text-sm font-medium text-gray-500">Branching Divergence</span>
            <div className="mt-4 flex items-center gap-2">
              {report.branchingResults?.divergentPaths ? (
                <>
                  <Compass className="h-6 w-6 text-brand-500" />
                  <span className="text-xl font-bold">Divergent ({report.branchingResults?.uniqueQuestionPathsCount || 0} paths)</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-6 w-6 text-yellow-500" />
                  <span className="text-xl font-bold">Static / Low</span>
                </>
              )}
            </div>
            <p className="text-[10px] text-gray-400 mt-2">Checks if chatbot adaptively deviates questions</p>
          </div>

          <div className="glass-panel rounded-2xl p-6">
            <span className="text-sm font-medium text-gray-500">Repeated Questions</span>
            <div className="mt-4 flex items-center gap-2">
              {report.metrics?.totalRepeatedQuestions === 0 ? (
                <>
                  <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                  <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">0 Duplicates</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-6 w-6 text-red-500" />
                  <span className="text-xl font-bold text-red-500">{report.metrics?.totalRepeatedQuestions} Repeats</span>
                </>
              )}
            </div>
            <p className="text-[10px] text-gray-400 mt-2">Hard gate: 0 repeated questions in transcripts</p>
          </div>
        </div>
      )}

      {/* Split layout: Persona Playbook & Report Details */}
      <div className="grid gap-8 lg:grid-cols-12">
        {/* Persona Simulator Selection Grid */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-panel rounded-2xl p-6">
            <h2 className="text-lg font-bold tracking-tight mb-2">Persona Playthroughs</h2>
            <p className="text-xs text-gray-500 mb-6">
              Launch a manual walkthrough for any of the 12 pre-configured profiles.
            </p>

            <div className="space-y-3">
              {personas.map((p) => (
                <div 
                  key={p.id} 
                  className="flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white/20 dark:bg-gray-900/20 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition duration-200"
                >
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100">{p.type}</h4>
                    <p className="text-[10px] text-gray-400 mt-0.5">{p.name} - {p.company}</p>
                  </div>
                  <button
                    onClick={() => handleSimulateSingle(p.id)}
                    disabled={simulatingPersonaId !== null}
                    className="flex items-center gap-1 text-[10px] font-semibold text-brand-600 dark:text-brand-400 hover:underline shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    Simulate
                    <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Detailed Evaluation Table */}
        <div className="lg:col-span-8 glass-panel rounded-2xl overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold tracking-tight">Validation Audit Logs</h2>
              <p className="text-xs text-gray-500 mt-0.5">Bucket match accuracy audit and duplicate question check per run</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-20 text-center text-sm text-gray-500 dark:text-gray-400">
                <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-brand-500" />
                Loading evaluation reports...
              </div>
            ) : !report || report.notRunYet ? (
              <div className="py-20 text-center text-sm text-gray-500 dark:text-gray-400 px-6">
                <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto mb-3" />
                <h4 className="font-semibold text-gray-900 dark:text-gray-100">No Evaluation Report Found</h4>
                <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                  To complete the quality gate audit, run the full 12-persona evaluation using the button in the top right.
                </p>
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 border-b border-gray-200 dark:border-gray-800">
                    <th className="px-6 py-3 font-semibold">Founder Profile</th>
                    <th className="px-6 py-3 font-semibold">Expected Bucket</th>
                    <th className="px-6 py-3 font-semibold">Classified Bucket</th>
                    <th className="px-6 py-3 font-semibold">Repeated Qs</th>
                    <th className="px-6 py-3 font-semibold text-right">Audit Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {report.bucketResults?.map((res, index) => (
                    <tr key={index} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900 dark:text-gray-100">{res.persona}</div>
                        <div className="text-[10px] text-gray-400 mt-0.5">{res.founder} ({res.company})</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold uppercase text-gray-600 dark:text-gray-400">{res.expected}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span 
                          className="font-bold uppercase px-1.5 py-0.2 rounded border"
                          style={{
                            backgroundColor: `${BUCKET_COLORS[res.predicted]}15`,
                            borderColor: `${BUCKET_COLORS[res.predicted]}40`,
                            color: BUCKET_COLORS[res.predicted]
                          }}
                        >
                          {res.predicted}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {res.repeatedQuestionsCount === 0 ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">0 repeats</span>
                        ) : (
                          <span className="text-red-500 font-bold">{res.repeatedQuestionsCount} repeats</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {res.match ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                            <CheckCircle2 className="h-4 w-4" /> Match
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-500 font-bold">
                            <XCircle className="h-4 w-4" /> Mismatch
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
