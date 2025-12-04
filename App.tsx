import React, { useState } from 'react';
import { generateAssessment } from './services/gemini';
import InputForm from './components/InputForm';
import ResultDisplay from './components/ResultDisplay';
import { AssessmentResult, AssessmentConfig } from './types';
import { BookOpen, Sparkles } from 'lucide-react';

const App: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (content: string, isPdf: boolean, config: AssessmentConfig) => {
    setLoading(true);
    setError(null);
    try {
      const data = await generateAssessment(content, isPdf, config);
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat membuat soal.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-12 print:bg-white print:pb-0">
      {/* Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary-600 p-2 rounded-lg text-white">
               <BookOpen className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-primary-800">
              EduAssess AI
            </h1>
          </div>
          <div className="text-xs text-slate-500 hidden sm:block">
            Powered by Google Gemini 2.5 Flash
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {/* Error Notification */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700 animate-fadeIn">
            <span className="font-bold">Error:</span> {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Input */}
          <div className={`lg:col-span-4 space-y-6 ${result ? 'hidden lg:block' : 'lg:col-start-4 lg:col-span-6'}`}>
            <div className="text-center mb-8 lg:text-left lg:mb-0">
              {!result && (
                <>
                  <h2 className="text-3xl font-bold text-slate-900 mb-3">Buat Soal Ujian dalam Hitungan Detik</h2>
                  <p className="text-slate-500 mb-8 text-lg">
                    Unggah materi pelajaran atau PDF, AI akan membuatkan kisi-kisi, soal, kunci jawaban, dan rubrik penilaian secara otomatis.
                  </p>
                </>
              )}
            </div>
            
            <InputForm isLoading={loading} onSubmit={handleGenerate} />
            
            {/* Features Info - Only show when no result */}
            {!result && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-12 text-center text-slate-600">
                <div className="p-4 bg-white rounded-lg border border-slate-100 shadow-sm">
                  <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold mb-1">Cerdas</h3>
                  <p className="text-xs">Menggunakan Gemini 2.5 Flash untuk analisis mendalam.</p>
                </div>
                <div className="p-4 bg-white rounded-lg border border-slate-100 shadow-sm">
                   <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold mb-1">Lengkap</h3>
                  <p className="text-xs">Soal, Kunci, Kisi-kisi, dan Rubrik dalam satu kali klik.</p>
                </div>
                <div className="p-4 bg-white rounded-lg border border-slate-100 shadow-sm">
                   <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold mb-1">Fleksibel</h3>
                  <p className="text-xs">Mendukung input teks langsung atau upload PDF.</p>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Result */}
          {result && (
            <div className="lg:col-span-8 animate-fadeIn">
              <ResultDisplay data={result} />
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default App;