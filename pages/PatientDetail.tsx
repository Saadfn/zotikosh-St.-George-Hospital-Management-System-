
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Calendar, 
  FileText, 
  Activity, 
  Thermometer, 
  Droplet, 
  Scale, 
  Plus,
  BrainCircuit,
  AlertTriangle,
  Loader2,
  CheckCircle
} from 'lucide-react';
import { mockPatients, mockRecords } from '../mockData';
import { analyzeMedicalRecord, AnalysisResult } from '../geminiService';

const PatientDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const patient = mockPatients.find(p => p.id === id);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  if (!patient) return <div>Patient not found</div>;

  const handleAiAnalysis = async () => {
    setAnalyzing(true);
    const result = await analyzeMedicalRecord(
      mockRecords[0].symptoms,
      patient.medicalHistory || "None provided"
    );
    setAnalysisResult(result);
    setAnalyzing(false);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20">
      <div className="flex items-center gap-4">
        <Link to="/patients" className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all text-slate-600">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Patient Profile</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Info Sidebar */}
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center">
            <img 
              src={`https://picsum.photos/seed/${patient.id}/120/120`} 
              className="w-24 h-24 rounded-full mx-auto border-4 border-blue-50 mb-4" 
              alt="" 
            />
            <h2 className="text-xl font-bold text-slate-900">{patient.user?.name}</h2>
            <p className="text-sm text-slate-500 font-medium">{patient.patientId}</p>
            <div className="flex items-center justify-center gap-2 mt-4">
              <span className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-full">{patient.gender}</span>
              <span className="px-3 py-1 bg-rose-50 text-rose-600 text-xs font-bold rounded-full">{patient.bloodGroup}</span>
            </div>
            <div className="mt-8 pt-8 border-t border-slate-100 text-left space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Date of Birth</span>
                <span className="text-slate-900 font-semibold">{patient.dateOfBirth}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Contact</span>
                <span className="text-slate-900 font-semibold">{patient.user?.phone}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Last Visit</span>
                <span className="text-slate-900 font-semibold">Oct 12, 2023</span>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100">
            <div className="flex items-center gap-2 text-amber-700 font-bold mb-3 uppercase tracking-wider text-xs">
              <AlertTriangle size={16} />
              Allergies & Risks
            </div>
            <p className="text-sm text-amber-800 leading-relaxed font-medium">
              {patient.allergies || "No allergies reported"}
            </p>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 text-center">
              <Thermometer className="mx-auto text-rose-500 mb-2" size={20} />
              <p className="text-xs text-slate-500 font-medium">Temp</p>
              <p className="text-lg font-bold text-slate-900">98.6°F</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 text-center">
              <Droplet className="mx-auto text-blue-500 mb-2" size={20} />
              <p className="text-xs text-slate-500 font-medium">BP</p>
              <p className="text-lg font-bold text-slate-900">120/80</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 text-center">
              <Activity className="mx-auto text-emerald-500 mb-2" size={20} />
              <p className="text-xs text-slate-500 font-medium">Heart Rate</p>
              <p className="text-lg font-bold text-slate-900">72 bpm</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 text-center">
              <Scale className="mx-auto text-amber-500 mb-2" size={20} />
              <p className="text-xs text-slate-500 font-medium">Weight</p>
              <p className="text-lg font-bold text-slate-900">165 lbs</p>
            </div>
          </div>

          {/* AI Medical Assistant */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-700 opacity-50"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-600 text-white rounded-lg shadow-lg shadow-blue-100">
                    <BrainCircuit size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">St. George Medical AI</h3>
                    <p className="text-xs text-slate-500">Advanced clinical analysis (Gemini 3 Pro)</p>
                  </div>
                </div>
                {!analysisResult && (
                  <button 
                    onClick={handleAiAnalysis}
                    disabled={analyzing}
                    className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-800 disabled:opacity-50 transition-all"
                  >
                    {analyzing ? <Loader2 className="animate-spin" size={16} /> : <Activity size={16} />}
                    {analyzing ? 'Analyzing Records...' : 'Analyze Latest Visit'}
                  </button>
                )}
              </div>

              {analysisResult ? (
                <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-500">
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${
                    analysisResult.riskLevel === 'HIGH' ? 'bg-rose-100 text-rose-600' : 
                    analysisResult.riskLevel === 'MEDIUM' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
                  }`}>
                    <AlertTriangle size={14} />
                    Risk Level: {analysisResult.riskLevel}
                  </div>
                  <p className="text-slate-600 text-sm leading-relaxed italic bg-slate-50 p-4 rounded-xl border border-slate-100">
                    "{analysisResult.summary}"
                  </p>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">AI Recommendations</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {analysisResult.suggestions.map((s, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 bg-blue-50/50 rounded-xl border border-blue-100/50">
                          <CheckCircle className="text-blue-500 shrink-0 mt-0.5" size={16} />
                          <p className="text-xs text-slate-700 font-medium">{s}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <button onClick={() => setAnalysisResult(null)} className="text-xs text-blue-600 font-bold hover:underline">Re-analyze latest data</button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-slate-500 text-sm">Analyze latest symptoms and medical history for smart insights.</p>
                </div>
              )}
            </div>
          </div>

          {/* Medical Records Tabs */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900">Medical History</h3>
              <button className="text-blue-600 text-sm font-bold flex items-center gap-1 hover:underline">
                <Plus size={16} /> New Record
              </button>
            </div>
            <div className="p-6 space-y-6">
              {mockRecords.map((record) => (
                <div key={record.id} className="relative pl-8 pb-8 border-l-2 border-slate-100 last:pb-0">
                  <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-blue-600 border-4 border-white"></div>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                      {new Date(record.createdAt).toLocaleDateString()}
                    </span>
                    <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                      {record.recordNo}
                    </span>
                  </div>
                  <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                    <h4 className="font-bold text-slate-900 mb-2">{record.chiefComplaint}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Diagnosis</p>
                        <p className="text-sm text-slate-700 font-medium">{record.diagnosis}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Doctor</p>
                        <p className="text-sm text-slate-700 font-medium">Dr. James Wilson</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDetail;
