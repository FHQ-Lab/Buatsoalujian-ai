import React, { useState, useRef } from 'react';
import { AssessmentConfig, InputMode } from '../types';
import { Upload, FileText, X, AlertCircle } from 'lucide-react';

interface InputFormProps {
  isLoading: boolean;
  onSubmit: (content: string, isPdf: boolean, config: AssessmentConfig) => void;
}

const InputForm: React.FC<InputFormProps> = ({ isLoading, onSubmit }) => {
  const [mode, setMode] = useState<InputMode>('text');
  const [textContent, setTextContent] = useState('');
  const [pdfFile, setPdfFile] = useState<{ name: string; base64: string } | null>(null);
  
  const [config, setConfig] = useState<AssessmentConfig>({
    gradeLevel: 'SMA',
    subject: 'Umum',
    topic: 'Umum',
    questionCount: 10,
    questionType: 'pilihan_ganda',
    difficulty: 'sedang'
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        alert('Mohon unggah file PDF.');
        return;
      }
      // Max 10MB approx
      if (file.size > 10 * 1024 * 1024) {
        alert('Ukuran file terlalu besar (Maks 10MB).');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setPdfFile({ name: file.name, base64: result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTypeChange = (newType: string) => {
    let newCount = config.questionCount;
    
    // Smart default: If switching to Essay, user likely wants fewer questions.
    // If switching to PG/Mixed, suggest at least 10 as per guidelines.
    if (newType === 'esai' && config.questionCount > 5) {
        newCount = 5;
    } else if ((newType === 'pilihan_ganda' || newType === 'campuran') && config.questionCount < 10) {
        newCount = 10;
    }

    setConfig({ 
        ...config, 
        questionType: newType as any,
        questionCount: newCount 
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === 'text' && !textContent.trim()) {
      alert('Mohon isi materi teks.');
      return;
    }
    if (mode === 'file' && !pdfFile) {
      alert('Mohon unggah file PDF.');
      return;
    }

    const content = mode === 'file' && pdfFile ? pdfFile.base64 : textContent;
    onSubmit(content, mode === 'file', config);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-slate-50">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary-600" />
          Konfigurasi Soal
        </h2>
        <p className="text-sm text-slate-500 mt-1">Atur parameter untuk pembuatan soal otomatis.</p>
      </div>
      
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Configuration Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Jenjang Pendidikan</label>
            <select 
              value={config.gradeLevel}
              onChange={(e) => setConfig({ ...config, gradeLevel: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
            >
              <option value="SD">SD / MI</option>
              <option value="SMP">SMP / MTs</option>
              <option value="SMA">SMA / SMK / MA</option>
              <option value="Mahasiswa">Mahasiswa / Umum</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mata Pelajaran</label>
            <input 
              type="text" 
              value={config.subject}
              onChange={(e) => setConfig({ ...config, subject: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
              placeholder="Contoh: Biologi"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Topik / Bab</label>
            <input 
              type="text" 
              value={config.topic}
              onChange={(e) => setConfig({ ...config, topic: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
              placeholder="Contoh: Fotosintesis"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tingkat Kesulitan & Taxonomi</label>
            <select 
              value={config.difficulty}
              onChange={(e) => setConfig({ ...config, difficulty: e.target.value as any })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
            >
              <option value="mudah">Mudah (C1-C2)</option>
              <option value="sedang">Sedang (C3)</option>
              <option value="sulit">Sulit (C4-C5)</option>
              <option value="HOTS">HOTS (C4-C6)</option>
              <optgroup label="Campuran (Mixed)">
                <option value="campuran_c1_c3">Campuran C1-C3 (40-30-30)</option>
                <option value="campuran_c3_c6">Campuran C3-C6 (30-30-20-20)</option>
                <option value="campuran_c1_c6">Campuran Lengkap (C1-C6 Seimbang)</option>
              </optgroup>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tipe Soal</label>
            <select 
              value={config.questionType}
              onChange={(e) => handleTypeChange(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
            >
              <option value="pilihan_ganda">Pilihan Ganda</option>
              <option value="esai">Esai / Uraian</option>
              <option value="campuran">Campuran (PG & Esai)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Jumlah Soal</label>
            <input 
              type="number" 
              min={1} 
              max={50}
              value={config.questionCount}
              onChange={(e) => setConfig({ ...config, questionCount: parseInt(e.target.value) || 10 })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
            />
            <p className="text-xs text-slate-400 mt-1">
              {config.questionType === 'campuran' && 'Minimal 3 soal Esai akan disertakan.'}
              {config.questionType === 'pilihan_ganda' && 'Disarankan minimal 10 soal.'}
            </p>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-4">
          <label className="block text-sm font-medium text-slate-700 mb-3">Sumber Materi</label>
          <div className="flex gap-4 mb-4">
            <button
              type="button"
              onClick={() => setMode('text')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                mode === 'text' 
                  ? 'bg-primary-50 text-primary-700 border border-primary-200' 
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              Input Teks
            </button>
            <button
              type="button"
              onClick={() => setMode('file')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                mode === 'file' 
                  ? 'bg-primary-50 text-primary-700 border border-primary-200' 
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              Upload PDF
            </button>
          </div>

          {mode === 'text' ? (
            <textarea
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              placeholder="Tempel materi pelajaran di sini..."
              className="w-full h-40 px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm resize-none"
            />
          ) : (
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:border-primary-400 transition-colors bg-slate-50">
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={handleFileChange}
              />
              {!pdfFile ? (
                <>
                  <Upload className="w-10 h-10 text-slate-400 mb-3" />
                  <p className="text-sm text-slate-600 font-medium">Klik untuk unggah PDF</p>
                  <p className="text-xs text-slate-400 mt-1">Maksimal 10MB</p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-4 px-4 py-2 bg-white border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Pilih File
                  </button>
                </>
              ) : (
                <div className="w-full">
                  <div className="flex items-center justify-between bg-white p-3 rounded border border-slate-200">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="bg-red-100 p-2 rounded">
                        <FileText className="w-5 h-5 text-red-600" />
                      </div>
                      <span className="text-sm font-medium text-slate-700 truncate">{pdfFile.name}</span>
                    </div>
                    <button 
                      type="button"
                      onClick={() => {
                        setPdfFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="text-slate-400 hover:text-red-500"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading || (mode === 'text' && !textContent) || (mode === 'file' && !pdfFile)}
          className={`w-full py-3 px-4 rounded-xl text-white font-semibold text-sm shadow-sm transition-all flex items-center justify-center gap-2 ${
            isLoading 
              ? 'bg-primary-400 cursor-not-allowed' 
              : 'bg-primary-600 hover:bg-primary-700 active:scale-[0.99]'
          }`}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Sedang Memproses... (Gemini AI)
            </>
          ) : (
            <>
              Generate Assessment
            </>
          )}
        </button>
        
        <div className="bg-blue-50 p-3 rounded-lg flex gap-3 items-start text-xs text-blue-700">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <p>
            AI akan membuatkan paket lengkap sesuai Tingkat Kesulitan. 
            {config.gradeLevel === 'SD' || config.gradeLevel === 'SMP' ? ' Pilihan Ganda format A-D.' : ' Pilihan Ganda format A-E.'}
          </p>
        </div>
      </form>
    </div>
  );
};

export default InputForm;