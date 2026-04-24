import React, { useState } from 'react';
import { 
  Upload, 
  FileText, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Database, 
  TrendingUp,
  X,
  Target,
  BarChart,
  Lightbulb,
  FileJson,
  FileSpreadsheet,
  File as FileIcon,
  AlertTriangle,
  Search,
  PieChart as PieChartIcon,
  BarChart2,
  TrendingDown,
  ShieldCheck,
  Zap,
  ArrowRight
} from 'lucide-react';
import { geminiService } from '../../services/geminiService';
import Mascot from '../../components/Mascot';
import { toast } from 'sonner';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import * as pdfjs from 'pdfjs-dist';
import { cn } from '../../lib/utils';
import { 
  ResponsiveContainer, 
  BarChart as RechartsBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  PieChart as RechartsPieChart, 
  Pie, 
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export default function DataAnalyser() {
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const parseFile = async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    try {
      if (ext === 'csv') {
        return new Promise((resolve) => {
          Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => resolve(results.data.slice(0, 100))
          });
        });
      } else if (ext === 'json') {
        const text = await file.text();
        return JSON.parse(text).slice(0, 50);
      } else if (ext === 'xlsx') {
        const buffer = await file.arrayBuffer();
        const wb = XLSX.read(buffer, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        return XLSX.utils.sheet_to_json(ws).slice(0, 100);
      } else if (ext === 'pdf') {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        let text = "";
        for (let i = 1; i <= Math.min(pdf.numPages, 3); i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map((item: any) => item.str).join(" ");
        }
        return text.slice(0, 2000);
      }
    } catch (err) {
      console.error("Parse error:", err);
      return null;
    }
    return null;
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setAnalyzing(true);
    setError('');
    
    try {
      const ext = file.name.split('.').pop()?.toLowerCase();
      let parsedContent = { columns: [] as string[], rows: [] as any[], rowCount: 0, columnCount: 0 };

      if (ext === 'csv') {
        const Papa = (await import('papaparse')).default;
        parsedContent = await new Promise((resolve, reject) => {
          Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (r) => resolve({
              columns: r.meta.fields || [],
              rows: r.data.slice(0, 60),
              rowCount: r.data.length,
              columnCount: r.meta.fields?.length || 0
            }),
            error: (e) => reject(new Error(e.message))
          });
        });
      } else if (ext === 'json') {
        const text = await file.text();
        const parsed = JSON.parse(text);
        const rows = Array.isArray(parsed) ? parsed : [parsed];
        parsedContent = {
          columns: Object.keys(rows[0] || {}),
          rows: rows.slice(0, 60),
          rowCount: rows.length,
          columnCount: Object.keys(rows[0] || {}).length
        };
      } else if (ext === 'xlsx' || ext === 'xls') {
        const XLSX = await import('xlsx');
        const buffer = await file.arrayBuffer();
        const wb = XLSX.read(buffer, { type: 'array' });
        const rows: any[] = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
        parsedContent = {
          columns: Object.keys(rows[0] || {}),
          rows: rows.slice(0, 60),
          rowCount: rows.length,
          columnCount: Object.keys(rows[0] || {}).length
        };
      } else if (ext === 'pdf') {
        parsedContent = { columns: [], rows: [], rowCount: 0, columnCount: 0 };
      }

      // Perform Deep Analysis using Gemini Service
      const result = await geminiService.analyzeDeeply({
        fileName: file.name,
        columns: parsedContent.columns,
        rowCount: parsedContent.rowCount,
        columnCount: parsedContent.columnCount,
        sampleData: parsedContent.rows
      });

      setResult(result);
      toast.success("AI deep analysis complete!");
    } catch (err: any) {
      console.error('Data analyser error:', err);
      setError(err.message || 'Failed to analyze document.');
      toast.error("Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  };

  const reset = () => {
    setFile(null as any);
    setResult(null);
    setError('');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <TrendingUp className="text-[#1A6B5A]" size={24} />
            Pulse Data Analyser
          </h2>
          <p className="text-sm text-text-muted">Instant AI-powered humanitarian deep-dives</p>
        </div>
        {result && (
          <button 
            onClick={reset}
            className="bg-primary/10 text-primary px-4 py-2 rounded-xl text-sm font-bold hover:bg-primary/20 transition-all flex items-center gap-2"
          >
            <ArrowRight className="rotate-180" size={16} />
            Back to Upload
          </button>
        )}
      </div>

      {!result ? (
        <div className="max-w-3xl mx-auto py-12">
          <div className="bg-[#1A6B5A] text-white p-10 rounded-[2.5rem] shadow-2xl mb-12 flex items-center gap-8 relative overflow-hidden group border-4 border-white/10">
            <div className="relative z-10 w-2/3">
              <div className="flex items-center gap-2 mb-4 bg-white/10 w-fit px-3 py-1 rounded-full border border-white/20">
                <Zap size={14} className="text-yellow-400" />
                <span className="text-[10px] font-black uppercase tracking-widest">Enhanced with Gemini 1.5</span>
              </div>
              <h3 className="text-3xl font-black mb-4 leading-tight">Humanitarian Insight Engine</h3>
              <p className="text-sm text-white/80 leading-relaxed max-w-md">
                Upload raw research data (CSV, JSON, XLSX) or field reports (PDF). Our AI identifies resource gaps, predicts trends, and recommends immediate NGO actions.
              </p>
            </div>
            <div className="absolute top-0 right-0 p-10 opacity-10 blur-[2px] group-hover:opacity-30 group-hover:scale-110 transition-all duration-700">
               <Database size={200} />
            </div>
            <Mascot size={150} className="absolute -right-8 -bottom-8 opacity-20 filter drop-shadow-2xl" />
          </div>

          <div 
            className={cn(
              "border-2 border-dashed rounded-[2rem] p-16 text-center transition-all bg-surface/50 relative overflow-hidden",
              file ? "border-primary bg-primary/5" : "border-[#1A6B5A]/40 hover:border-primary/60 hover:bg-white/50"
            )}
          >
            <input 
              type="file" 
              accept=".csv,.json,.xlsx,.pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null as any)}
              className="absolute inset-0 opacity-0 cursor-pointer z-10"
              id="data-upload-main"
            />
            <div className="space-y-6">
              <div className="w-20 h-20 bg-white shadow-xl border border-gray-100 rounded-3xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                <Upload className="text-primary" size={40} />
              </div>
              <div>
                <h3 className="text-xl font-black mb-2">{file ? (file as any).name : 'Drop humanitarian data here'}</h3>
                <p className="text-text-muted text-sm px-12">Support for CSV surveys, JSON exports, Excel reports and PDF field studies.</p>
              </div>
              
              <div className="flex justify-center gap-3">
                <span className="px-3 py-1 bg-white border border-gray-100 rounded-full text-[10px] font-black text-text-muted uppercase tracking-widest flex items-center gap-1">
                  <FileSpreadsheet size={12} className="text-green-600" /> CSV/XLSX
                </span>
                <span className="px-3 py-1 bg-white border border-gray-100 rounded-full text-[10px] font-black text-text-muted uppercase tracking-widest flex items-center gap-1">
                  <FileText size={12} className="text-red-600" /> PDF
                </span>
                <span className="px-3 py-1 bg-white border border-gray-100 rounded-full text-[10px] font-black text-text-muted uppercase tracking-widest flex items-center gap-1">
                   <FileJson size={12} className="text-yellow-600" /> JSON
                </span>
              </div>
            </div>

            {error && (
              <div className="mt-8 flex items-center justify-center gap-2 text-critical bg-critical/10 p-4 rounded-2xl animate-in shake duration-500">
                <AlertCircle size={20} />
                <span className="font-bold text-sm">{error}</span>
              </div>
            )}
          </div>

          <button 
            onClick={handleAnalyze}
            disabled={!file || analyzing}
            className="w-full mt-8 bg-[#1A6B5A] text-white py-5 rounded-3xl font-black text-lg hover:bg-[#134d41] transition-all shadow-2xl active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 group"
          >
            {analyzing ? <Loader2 className="animate-spin" size={24} /> : <Target size={24} className="group-hover:scale-125 transition-transform" />}
            {analyzing ? 'AI Analyser is processing...' : 'Run Deep Analysis'}
          </button>
        </div>
      ) : (
        <div className="space-y-8 pb-20 max-w-6xl mx-auto">
           {/* Top Insight Grid */}
           <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {result.criticalInsights.map((insight: string, i: number) => (
                <div key={i} className="bg-surface p-5 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group hover:border-primary/40 transition-all">
                  <div className="w-8 h-8 bg-[#1A6B5A] text-white rounded-xl flex items-center justify-center font-black text-xs mb-3 shadow-lg">
                    {i + 1}
                  </div>
                  <p className="text-xs font-bold text-text-primary leading-relaxed">{insight}</p>
                  <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-10 transition-opacity">
                    <Database size={40} className="text-primary" />
                  </div>
                </div>
              ))}
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             <div className="lg:col-span-2 space-y-8">
               {/* Summary & Recommendations */}
               <div className="bg-surface p-10 rounded-[2.5rem] border border-gray-100 shadow-sm relative isolate">
                  <div className="absolute top-0 right-0 p-10 opacity-5 -z-10">
                    <Mascot size={200} />
                  </div>
                  
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-inner">
                      <ShieldCheck size={28} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black uppercase tracking-tight text-gray-900">Analysis Summary</h3>
                      <div className="flex gap-2 mt-1">
                         {result.deepChartData?.labels.slice(0, 2).map((l: string, i: number) => (
                            <span key={i} className="px-2 py-0.5 bg-gray-100 text-[9px] font-black text-text-muted rounded-full">#{l.toUpperCase()}</span>
                         ))}
                      </div>
                    </div>
                  </div>

                  <p className="text-lg leading-relaxed text-text-primary font-bold mb-10 italic border-l-4 border-amber-400 pl-6 bg-amber-50/30 py-4 rounded-r-2xl">
                    "{result.executiveSummary}"
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] flex items-center gap-2">
                           <TrendingUp size={14} className="text-primary" /> Trends & Anomalies
                        </h4>
                        <div className="space-y-3">
                           {result.resourceGaps.map((gap: string, i: number) => (
                             <div key={i} className="flex gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100 group hover:bg-white transition-colors">
                                <div className="shrink-0 mt-1">
                                  <AlertTriangle size={16} className="text-amber-500" />
                                </div>
                                <p className="text-xs font-bold leading-relaxed">{gap}</p>
                             </div>
                           ))}
                        </div>
                     </div>
                     <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] flex items-center gap-2">
                           <CheckCircle2 size={14} className="text-[#1A6B5A]" /> Recommended Actions
                        </h4>
                        <div className="space-y-3">
                           {result.recommendedActions.slice(0, 3).map((act: any, i: number) => (
                             <div key={i} className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-primary/10 hover:bg-white transition-colors">
                                <p className="text-xs font-bold text-primary">{act.action}</p>
                                <span className={cn(
                                   "px-2 py-0.5 rounded text-[8px] font-black uppercase",
                                   act.priority === 'High' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                                )}>{act.priority}</span>
                             </div>
                           ))}
                        </div>
                     </div>
                  </div>
               </div>

               {/* Large Primary Chart */}
               {result.deepChartData && (
                 <div className="bg-surface p-10 rounded-[2.5rem] border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-center mb-10">
                      <h4 className="font-black text-sm uppercase tracking-widest flex items-center gap-2">
                        <BarChart2 size={20} className="text-primary" />
                        Situation Visualisation
                      </h4>
                      <p className="text-[10px] font-bold text-text-muted italic bg-gray-50 px-3 py-1 rounded-full">AI Suggested Model: {result.deepChartData.chartType.toUpperCase()}</p>
                    </div>
                    <div className="h-80 w-full">
                       <ResponsiveContainer width="100%" height="100%">
                          {result.deepChartData.chartType === 'bar' ? (
                            <RechartsBarChart data={result.deepChartData.labels.map((l:any, i:any) => ({ name: l, value: result.deepChartData.values[i] }))}>
                               <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                               <XAxis dataKey="name" fontSize={10} fontStyle="bold" axisLine={false} tickLine={false} />
                               <YAxis fontSize={10} axisLine={false} tickLine={false} />
                               <Tooltip 
                                  contentStyle={{ backgroundColor: '#1A6B5A', borderRadius: '12px', border: 'none', color: '#fff' }}
                                  itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                                />
                               <Bar dataKey="value" fill="#1A6B5A" radius={[8, 8, 0, 0]} />
                            </RechartsBarChart>
                          ) : (
                            <RechartsPieChart>
                               <Pie 
                                  data={result.deepChartData.labels.map((l:any, i:any) => ({ name: l, value: result.deepChartData.values[i] }))}
                                  dataKey="value"
                                  cx="50%" cy="50%"
                                  outerRadius={100}
                                  label={({ name }) => name}
                                >
                                   {['#1A6B5A','#F4A026','#185FA5','#6e40c9','#a12d2d'].map((c, i) => <Cell key={i} fill={c} />)}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36}/>
                            </RechartsPieChart>
                          )}
                       </ResponsiveContainer>
                    </div>
                 </div>
               )}
             </div>

             <div className="space-y-8">
               {/* Vulnerability & Gaps */}
               <div className="bg-surface p-8 rounded-[2rem] border border-gray-100 shadow-sm relative isolate">
                   <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-amber-100 text-amber-700 rounded-xl">
                        <AlertTriangle size={20} />
                      </div>
                      <h4 className="font-black text-sm uppercase tracking-tight">Risk Assessment</h4>
                   </div>
                   <div className="space-y-6">
                      <div>
                        <p className="text-[10px] font-black text-text-muted uppercase mb-2 tracking-widest">Target Groups</p>
                        <p className="text-xs font-bold leading-relaxed text-text-primary">
                          {result.vulnerabilityAnalysis}
                        </p>
                      </div>
                      <div className="pt-6 border-t border-gray-100">
                         <p className="text-[10px] font-black text-text-muted uppercase mb-3 tracking-widest">Volunteer Action Plan</p>
                         <p className="text-xs font-medium leading-relaxed bg-primary/5 p-4 rounded-xl border border-primary/10">
                           {result.volunteerImpactEstimate}
                         </p>
                      </div>
                   </div>
               </div>

               {/* Secondary Chart (Mini) */}
               <div className="bg-gray-900 text-white p-8 rounded-[2rem] shadow-2xl relative isolate overflow-hidden">
                  <div className="flex items-center gap-3 mb-6">
                     <TrendingDown size={20} className="text-amber-400" />
                     <h4 className="font-black text-xs uppercase tracking-[0.2em]">Pulse Projection</h4>
                  </div>
                  <p className="text-xs text-white/80 leading-relaxed italic mb-8 border-l-2 border-primary pl-4">
                    {result.predictedTrend}
                  </p>
                  
                  <div className="h-40 w-full opacity-50">
                     <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={result.deepChartData?.labels.map((l:any, i:any) => ({ name: l, value: result.deepChartData.values[i] }))}>
                           <Line type="monotone" dataKey="value" stroke="#1A6B5A" strokeWidth={3} dot={false} />
                        </LineChart>
                     </ResponsiveContainer>
                  </div>
                  
                  <div className="mt-8 flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/10">
                     <div>
                        <p className="text-[8px] font-black text-white/50 uppercase mb-1">AI Precision</p>
                        <p className="text-sm font-black text-primary">High Confidence</p>
                     </div>
                     <div className="text-right">
                        <p className="text-xl font-black">{result.confidenceScore}%</p>
                     </div>
                  </div>
               </div>

               {/* Tags */}
               <div className="bg-surface p-6 rounded-3xl border border-gray-100 shadow-sm">
                  <h4 className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-4">Semantic Identifiers</h4>
                  <div className="flex flex-wrap gap-2">
                     {result.deepChartData?.labels.map((l: string, i: number) => (
                        <span key={i} className="px-3 py-1 bg-gray-50 text-[10px] font-black text-gray-400 rounded-lg uppercase tracking-tighter shadow-sm border border-gray-100">#{l}</span>
                     ))}
                  </div>
               </div>
             </div>
           </div>
        </div>
      )}
    </div>
  );
}
