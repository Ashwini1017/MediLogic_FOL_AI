
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Activity, 
  Search, 
  ChevronRight, 
  AlertCircle, 
  HelpCircle, 
  CheckCircle2, 
  Info,
  Layers,
  Zap,
  RotateCcw,
  Stethoscope,
  Terminal
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { GoogleGenAI } from "@google/genai";

import { knowledgeBase } from './data/knowledgeBase';
import { FOLDiagnosticEngine } from './engine/folEngine';
import { DiagnosticResult, UncertaintyReport, Symptom } from './types';

const engine = new FOLDiagnosticEngine(knowledgeBase);

const App: React.FC = () => {
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [uncertainty, setUncertainty] = useState<UncertaintyReport | null>(null);
  const [activeTab, setActiveTab] = useState<'diagnosis' | 'logic' | 'knowledge'>('diagnosis');
  const [explaining, setExplaining] = useState<boolean>(false);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);

  // Initialize engine results
  useEffect(() => {
    const res = engine.forwardChain(selectedSymptoms);
    const unc = engine.analyzeUncertainty(res, selectedSymptoms);
    setResults(res);
    setUncertainty(unc);
  }, [selectedSymptoms]);

  const toggleSymptom = (id: string) => {
    setSelectedSymptoms(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const resetAll = () => {
    setSelectedSymptoms([]);
    setAiExplanation(null);
  };

  const handleAiExplain = async () => {
    setExplaining(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `
        As a senior clinical diagnostic AI using First-Order Logic (FOL), explain the current diagnostic findings.
        
        Selected Symptoms: ${selectedSymptoms.map(id => knowledgeBase.symptoms.find(s => s.id === id)?.name).join(', ')}
        Top Diagnosis: ${results[0]?.diseaseName} (Confidence: ${results[0]?.confidence}%)
        
        Logic Trace for top diagnosis:
        ${results[0]?.trace.join('\n')}
        
        Uncertainty Report:
        - Noise (irrelevant symptoms): ${uncertainty?.noise.join(', ') || 'None'}
        - Conflicts: ${uncertainty?.conflicting.map(c => c.diseaseName + " inhibited by " + c.conflicting.join(', ')).join('; ') || 'None'}
        - Ambiguity: ${uncertainty?.ambiguous.length ? 'Multiple possibilities detected' : 'Clear logic path'}
        
        Provide a concise, professional summary that bridges formal logic with clinical reasoning.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      setAiExplanation(response.text);
    } catch (error) {
      console.error("AI Explanation Error:", error);
      setAiExplanation("Failed to generate AI explanation. Please check your logic trace.");
    } finally {
      setExplaining(false);
    }
  };

  const chartData = results.slice(0, 5).map(r => ({
    name: r.diseaseName,
    confidence: r.confidence,
    fullMatch: r.satisfied
  }));

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans">
      {/* Header */}
      <header className="bg-indigo-700 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Activity className="h-8 w-8 text-indigo-200" />
            <h1 className="text-xl font-bold tracking-tight">MediLogic FOL AI</h1>
          </div>
          <div className="flex space-x-1 bg-indigo-800/50 rounded-lg p-1">
            <button 
              onClick={() => setActiveTab('diagnosis')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === 'diagnosis' ? 'bg-indigo-600 shadow-sm' : 'hover:bg-indigo-700/50'}`}
            >
              Diagnosis
            </button>
            <button 
              onClick={() => setActiveTab('logic')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === 'logic' ? 'bg-indigo-600 shadow-sm' : 'hover:bg-indigo-700/50'}`}
            >
              Logic Trace
            </button>
            <button 
              onClick={() => setActiveTab('knowledge')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === 'knowledge' ? 'bg-indigo-600 shadow-sm' : 'hover:bg-indigo-700/50'}`}
            >
              KB Explorer
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Sidebar: Symptom Input */}
        <aside className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 overflow-hidden">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-800 flex items-center">
                <Search className="w-5 h-5 mr-2 text-indigo-500" />
                Symptoms
              </h2>
              <button 
                onClick={resetAll}
                className="text-xs font-semibold text-slate-500 hover:text-indigo-600 flex items-center transition"
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Reset
              </button>
            </div>
            <p className="text-sm text-slate-500 mb-6 italic">Select symptoms to begin FOL inference.</p>
            
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {knowledgeBase.symptoms.map(symptom => (
                <button
                  key={symptom.id}
                  onClick={() => toggleSymptom(symptom.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border text-left transition-all group ${
                    selectedSymptoms.includes(symptom.id) 
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700 ring-1 ring-indigo-200' 
                      : 'bg-white border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-sm font-medium">{symptom.name}</span>
                  {selectedSymptoms.includes(symptom.id) ? (
                    <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-slate-300 group-hover:border-indigo-400" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Uncertainty Widget */}
          {selectedSymptoms.length > 0 && uncertainty && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-800 flex items-center mb-4">
                <AlertCircle className="w-5 h-5 mr-2 text-amber-500" />
                Uncertainty Report
              </h2>
              <div className="space-y-4">
                {uncertainty.noise.length > 0 && (
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center">
                      <Zap className="w-3 h-3 mr-1" /> Noise Detected
                    </p>
                    <p className="text-xs text-slate-600">
                      Irrelevant logic: {uncertainty.noise.join(', ')}
                    </p>
                  </div>
                )}
                {uncertainty.conflicting.length > 0 && (
                  <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                    <p className="text-xs font-bold text-red-500 uppercase tracking-wider mb-1 flex items-center">
                      <AlertCircle className="w-3 h-3 mr-1" /> Logic Conflicts
                    </p>
                    <p className="text-xs text-red-700">
                      Contradictions found in {uncertainty.conflicting.length} rules.
                    </p>
                  </div>
                )}
                {uncertainty.ambiguous.length > 0 && (
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <p className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-1 flex items-center">
                      <HelpCircle className="w-3 h-3 mr-1" /> Ambiguity
                    </p>
                    <p className="text-xs text-blue-700">
                      Similar confidence scores for {uncertainty.ambiguous.map(a => a.diseaseName).join(' & ')}.
                    </p>
                  </div>
                )}
                {selectedSymptoms.length > 0 && !uncertainty.ambiguous.length && !uncertainty.conflicting.length && (
                  <div className="flex items-center text-xs text-emerald-600 font-medium">
                    <CheckCircle2 className="w-4 h-4 mr-2" /> Consistent Logic Model
                  </div>
                )}
              </div>
            </div>
          )}
        </aside>

        {/* Main Content Area */}
        <section className="lg:col-span-8">
          {selectedSymptoms.length === 0 ? (
            <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-20 text-center space-y-4">
              <div className="bg-indigo-50 p-6 rounded-full">
                <Stethoscope className="w-16 h-16 text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-700">Awaiting Patient Data</h3>
              <p className="text-slate-500 max-w-xs">Select symptoms from the sidebar to trigger First-Order Logic inference and ranked diagnosis.</p>
            </div>
          ) : (
            <>
              {activeTab === 'diagnosis' && (
                <div className="space-y-6 animate-in fade-in duration-500">
                  {/* Results Chart */}
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
                      <Layers className="w-5 h-5 mr-2 text-indigo-500" />
                      Ranked Diagnostics (Confidence %)
                    </h2>
                    <div className="h-[250px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 40 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                          <XAxis type="number" domain={[0, 100]} hide />
                          <YAxis 
                            dataKey="name" 
                            type="category" 
                            width={120} 
                            style={{ fontSize: '12px', fontWeight: 600 }}
                          />
                          <Tooltip 
                            cursor={{ fill: '#f8fafc' }}
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                return (
                                  <div className="bg-white p-3 border border-slate-200 shadow-xl rounded-lg">
                                    <p className="text-sm font-bold text-slate-800">{payload[0].payload.name}</p>
                                    <p className="text-xs text-indigo-600 font-bold">Confidence: {payload[0].value}%</p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Bar dataKey="confidence" radius={[0, 4, 4, 0]} barSize={30}>
                            {chartData.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={entry.fullMatch ? '#4f46e5' : '#94a3b8'} 
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Top Match Detail */}
                  {results.length > 0 && (
                    <div className="bg-white rounded-xl shadow-md border-l-4 border-indigo-600 p-8">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <span className="inline-block px-2 py-1 rounded bg-indigo-100 text-indigo-700 text-[10px] font-bold uppercase tracking-wider mb-2">Primary Logical Inference</span>
                          <h2 className="text-3xl font-bold text-slate-900">{results[0].diseaseName}</h2>
                        </div>
                        <div className="text-right">
                          <p className="text-4xl font-black text-indigo-600 leading-none">{results[0].confidence}%</p>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Confidence</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                          <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center">
                            <Info className="w-4 h-4 mr-1.5 text-indigo-500" />
                            Clinical Reasoning
                          </h4>
                          <p className="text-slate-600 text-sm leading-relaxed mb-4">
                            {results[0].reason}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {results[0].missingRequired.map(s => (
                              <span key={s} className="px-2 py-1 bg-amber-50 text-amber-700 text-xs rounded border border-amber-200 flex items-center">
                                <AlertCircle className="w-3 h-3 mr-1" /> Missing: {s}
                              </span>
                            ))}
                            {results[0].conflicting.map(s => (
                              <span key={s} className="px-2 py-1 bg-red-50 text-red-700 text-xs rounded border border-red-200 flex items-center">
                                <Zap className="w-3 h-3 mr-1" /> Conflict: {s}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                           <h4 className="text-sm font-bold text-slate-800 mb-3">AI Clinical Insight</h4>
                           {aiExplanation ? (
                             <div className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                               {aiExplanation}
                             </div>
                           ) : (
                             <div className="flex flex-col items-center justify-center py-4 text-center">
                               <button 
                                 onClick={handleAiExplain}
                                 disabled={explaining}
                                 className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-lg transition-all shadow-sm flex items-center"
                               >
                                 {explaining ? (
                                   <>
                                     <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2" />
                                     Analyzing Logic...
                                   </>
                                 ) : (
                                   <>
                                     <Zap className="w-3 h-3 mr-2" />
                                     Generate AI Synthesis
                                   </>
                                 )}
                               </button>
                               <p className="text-[10px] text-slate-400 mt-2">Bridges FOL traces with human-readable reasoning</p>
                             </div>
                           )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Other Possible Matches */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest px-1">Alternative Inferences</h3>
                    {results.slice(1, 4).map((res) => (
                      <div key={res.diseaseId} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between hover:border-indigo-300 transition-colors shadow-sm">
                        <div className="flex items-center space-x-4">
                          <div className={`p-2 rounded-lg ${res.confidence > 50 ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-400'}`}>
                            <Activity className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-800">{res.diseaseName}</h4>
                            <p className="text-xs text-slate-500 line-clamp-1">{res.reason}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="text-sm font-bold text-slate-700">{res.confidence}%</p>
                            <p className="text-[10px] font-medium text-slate-400">Match</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-300" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'logic' && (
                <div className="bg-slate-900 rounded-2xl shadow-2xl p-8 font-mono text-emerald-400 overflow-hidden relative">
                  <div className="absolute top-4 right-6 flex space-x-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/50" />
                    <div className="w-3 h-3 rounded-full bg-amber-500/50" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
                  </div>
                  <h2 className="text-lg font-bold text-slate-200 mb-6 flex items-center">
                    <Terminal className="w-5 h-5 mr-2" />
                    First-Order Logic Trace (Inference Engine)
                  </h2>
                  
                  <div className="space-y-8">
                    {results.map((res, i) => (
                      <div key={res.diseaseId} className="space-y-3">
                        <div className="flex items-center space-x-2 text-indigo-400 text-sm font-bold">
                          <ChevronRight className="w-4 h-4" />
                          <span>EXAMINING GOAL: {res.diseaseName}</span>
                          <span className="text-xs px-1.5 py-0.5 rounded bg-indigo-900/50 text-indigo-300">RULE_REF: {knowledgeBase.rules.find(r => r.conclusion === res.diseaseId)?.id}</span>
                        </div>
                        <div className="pl-6 border-l border-slate-800 space-y-1.5">
                          {res.trace.map((step, idx) => (
                            <div key={idx} className="flex items-start space-x-3 text-xs leading-relaxed">
                              <span className="text-slate-600">[{idx.toString().padStart(2, '0')}]</span>
                              <p className={step.includes('invalidated') ? 'text-rose-400' : 'text-emerald-500/80'}>
                                {step}
                              </p>
                            </div>
                          ))}
                          <div className="pt-2 text-[10px] text-slate-500 italic">
                            Status: {res.satisfied ? 'SATISFIED' : 'NOT SATISFIED'} | Conclusion Score: {res.confidence/100}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'knowledge' && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 space-y-8">
                  <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
                    <HelpCircle className="w-6 h-6 mr-2 text-indigo-500" />
                    Knowledge Base (JSON Representation)
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Disease Schemas</h3>
                      {knowledgeBase.diseases.map(d => (
                        <div key={d.id} className="p-4 rounded-lg bg-slate-50 border border-slate-100">
                          <p className="text-sm font-bold text-slate-800">{d.name} <span className="text-xs font-normal text-slate-400 ml-2">({d.id})</span></p>
                          <p className="text-xs text-slate-500 mt-1">{d.description}</p>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Logic Rule Definitions</h3>
                      {knowledgeBase.rules.map(r => (
                        <div key={r.id} className="p-4 rounded-lg bg-indigo-50/30 border border-indigo-100">
                          <div className="flex justify-between">
                            <p className="text-xs font-bold text-indigo-600 mb-2">{r.id}</p>
                            <span className="text-[10px] font-bold text-slate-400">TARGET: {r.conclusion}</span>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] text-slate-600"><strong className="text-slate-800">REQ:</strong> {r.requirements.join(' ∧ ')}</p>
                            {r.optional && <p className="text-[10px] text-slate-600"><strong className="text-slate-800">OPT:</strong> {r.optional.join(' ∨ ')}</p>}
                            {r.exclusions && <p className="text-[10px] text-slate-600"><strong className="text-slate-800">NOT:</strong> {r.exclusions.join(', ')}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center text-slate-400 text-xs font-medium space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <span>FOL Diagnostic Engine v2.4</span>
            <span className="h-3 w-[1px] bg-slate-200" />
            <span>AI Reasoning Enabled</span>
          </div>
          <div className="text-center md:text-right">
            Designed for clinical decision support. Bridging discrete logic and generative intelligence.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
