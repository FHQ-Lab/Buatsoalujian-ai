import React, { useState, useRef } from 'react';
import { AssessmentResult } from '../types';
import { CheckCircle, FileText, Grid, List, Award, Printer, Copy, Download, FileDown, Code } from 'lucide-react';
import { generateDocx } from '../services/docxGenerator';
import { generateGoogleAppsScript } from '../services/googleFormGenerator';

interface ResultDisplayProps {
  data: AssessmentResult;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ data }) => {
  const [activeTab, setActiveTab] = useState<'soal' | 'kunci' | 'kisi' | 'rubrik'>('soal');
  const [isDownloading, setIsDownloading] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleCopy = () => {
    // Simple copy for text representation
    const text = document.getElementById('printable-content')?.innerText || '';
    navigator.clipboard.writeText(text).then(() => {
      alert('Konten berhasil disalin ke clipboard!');
    });
  };

  const handleDownloadDocx = async () => {
    setIsDownloading(true);
    try {
        const blob = await generateDocx(data);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${data.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_soal.docx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    } catch (error) {
        console.error("Error generating docx:", error);
        alert("Gagal membuat file Word.");
    } finally {
        setIsDownloading(false);
    }
  };

  const handleDownloadPdf = () => {
    // @ts-ignore
    if (!window.html2pdf) {
      alert("Library PDF belum siap, gunakan tombol Print -> Save as PDF.");
      window.print();
      return;
    }

    const element = contentRef.current;
    if (!element) return;

    // Show all tabs temporarily for PDF generation if needed, 
    // but usually users want what is visible. 
    // For a full report, we might need to clone and show everything.
    // For now, let's just generate the active view or rely on Print CSS.
    
    // Better strategy: Use html2pdf on the specific ID, but ensure styling.
    const opt = {
      margin:       10,
      filename:     `${data.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // @ts-ignore
    window.html2pdf().from(element).set(opt).save();
  };

  const handleDownloadScript = () => {
    const scriptContent = generateGoogleAppsScript(data);
    const blob = new Blob([scriptContent], { type: "text/plain;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `google_forms_script.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    alert("Script diunduh! Buka file .txt, copy isinya, dan paste di Google Apps Script editor pada Google Form Anda.");
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full min-h-[600px]">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 no-print">
        <div>
          <h2 className="text-lg font-bold text-slate-800">{data.title}</h2>
          <p className="text-xs text-slate-500">Dibuat oleh EduAssess AI</p>
        </div>
        <div className="flex gap-2 flex-wrap">
           <button onClick={handleCopy} className="p-2 text-slate-600 hover:bg-white hover:shadow-sm rounded-lg border border-transparent hover:border-slate-200 transition-all" title="Salin Teks">
            <Copy className="w-5 h-5" />
          </button>
          
          <button 
            onClick={handleDownloadScript} 
            className="flex items-center gap-2 px-3 py-2 bg-green-600 border border-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium shadow-sm transition-all"
            title="Download Script untuk Import ke Google Forms"
          >
            <Code className="w-4 h-4" />
            G-Forms
          </button>

          <button 
            onClick={handleDownloadPdf} 
            className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium shadow-sm transition-all"
          >
            <FileDown className="w-4 h-4" />
            PDF
          </button>

          <button 
            onClick={handleDownloadDocx} 
            disabled={isDownloading}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 border border-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium shadow-sm transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isDownloading ? (
                 <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
            ) : (
                <FileText className="w-4 h-4" />
            )}
            Word (.docx)
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-slate-200 no-print">
        <button
          onClick={() => setActiveTab('soal')}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
            activeTab === 'soal' 
              ? 'border-primary-500 text-primary-600 bg-primary-50/50' 
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          }`}
        >
          <FileText className="w-4 h-4" /> Soal Ujian
        </button>
        <button
          onClick={() => setActiveTab('kunci')}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
            activeTab === 'kunci' 
              ? 'border-primary-500 text-primary-600 bg-primary-50/50' 
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          }`}
        >
          <CheckCircle className="w-4 h-4" /> Kunci & Pembahasan
        </button>
        <button
          onClick={() => setActiveTab('kisi')}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
            activeTab === 'kisi' 
              ? 'border-primary-500 text-primary-600 bg-primary-50/50' 
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Grid className="w-4 h-4" /> Kisi-Kisi
        </button>
        <button
          onClick={() => setActiveTab('rubrik')}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
            activeTab === 'rubrik' 
              ? 'border-primary-500 text-primary-600 bg-primary-50/50' 
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Award className="w-4 h-4" /> Rubrik Penilaian
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-8 overflow-y-auto bg-white" id="printable-content" ref={contentRef}>
        
        {/* Ringkasan (Always visible in print, conditioned in tabs) */}
        <div className={`mb-8 p-4 bg-slate-50 rounded-lg border border-slate-100 ${activeTab !== 'soal' ? 'hidden print:block' : ''}`}>
           <h3 className="text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Ringkasan Materi</h3>
           <p className="text-slate-600 text-sm leading-relaxed">{data.summary}</p>
        </div>

        {/* Tab: Soal */}
        <div className={`${activeTab === 'soal' ? 'block' : 'hidden'} print:block print:mb-8`}>
          <div className="print:hidden mb-4 pb-2 border-b border-slate-100">
             <h3 className="font-bold text-xl text-slate-800">Soal Ujian</h3>
          </div>
          <div className="print:block hidden mb-4 text-center border-b-2 border-black pb-4">
             <h1 className="font-bold text-xl uppercase">{data.title}</h1>
             <p>Mata Pelajaran: _____________ | Kelas: _____________ | Waktu: _____________</p>
          </div>
          
          <div className="space-y-6">
            {data.questions.map((q) => (
              <div key={q.number} className="break-inside-avoid">
                <div className="flex gap-2">
                  <span className="font-bold text-slate-800 w-6 shrink-0">{q.number}.</span>
                  <div className="flex-1">
                    <p className="text-slate-800 font-medium mb-3">{q.text}</p>
                    {q.type === 'pilihan_ganda' && q.options && (
                      <div className="space-y-1.5 ml-1">
                        {q.options.map((opt, idx) => (
                          <div key={idx} className="flex gap-2 items-start text-sm text-slate-700">
                             <span className="font-medium text-slate-500 min-w-[20px]">{String.fromCharCode(65 + idx)}.</span>
                             <span>{opt}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {q.type === 'esai' && (
                      <div className="h-24 w-full border border-slate-200 rounded mt-2 bg-slate-50 print:bg-white print:border-black/20"></div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tab: Kunci */}
        <div className={`${activeTab === 'kunci' ? 'block' : 'hidden'} print:block print:break-before-page`}>
          <div className="mb-6 pb-2 border-b border-slate-100">
             <h3 className="font-bold text-xl text-slate-800 print:text-black">Kunci Jawaban & Pembahasan</h3>
          </div>
          <div className="space-y-4">
            {data.answerKeys.map((k) => (
              <div key={k.questionNumber} className="p-4 bg-green-50/50 rounded-lg border border-green-100 print:bg-transparent print:border-slate-200 break-inside-avoid">
                <div className="flex items-center gap-2 mb-2">
                   <span className="font-bold text-green-700 print:text-black">No. {k.questionNumber}</span>
                   <span className="px-2 py-0.5 bg-green-200 text-green-800 text-xs font-bold rounded print:border print:border-black print:bg-transparent print:text-black">
                      Jawaban: {k.answer}
                   </span>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed"><span className="font-semibold text-slate-900">Pembahasan:</span> {k.explanation}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tab: Kisi-Kisi */}
        <div className={`${activeTab === 'kisi' ? 'block' : 'hidden'} print:block print:break-before-page`}>
          <div className="mb-6 pb-2 border-b border-slate-100">
             <h3 className="font-bold text-xl text-slate-800 print:text-black">Kisi-Kisi Soal</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-600 border-collapse border border-slate-300">
              <thead className="bg-slate-100 text-slate-800 font-semibold print:bg-gray-200">
                <tr>
                  <th className="border border-slate-300 px-4 py-2 w-16 text-center">No</th>
                  <th className="border border-slate-300 px-4 py-2">Kompetensi Dasar</th>
                  <th className="border border-slate-300 px-4 py-2">Materi</th>
                  <th className="border border-slate-300 px-4 py-2">Indikator Soal</th>
                  <th className="border border-slate-300 px-4 py-2 w-20 text-center">Level</th>
                  <th className="border border-slate-300 px-4 py-2 w-20 text-center">Bentuk</th>
                </tr>
              </thead>
              <tbody>
                {data.grid.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="border border-slate-300 px-4 py-2 text-center">{item.questionNumber}</td>
                    <td className="border border-slate-300 px-4 py-2">{item.basicCompetency}</td>
                    <td className="border border-slate-300 px-4 py-2">{item.material}</td>
                    <td className="border border-slate-300 px-4 py-2">{item.indicator}</td>
                    <td className="border border-slate-300 px-4 py-2 text-center">{item.cognitiveLevel}</td>
                    <td className="border border-slate-300 px-4 py-2 text-center capitalize">{item.questionForm}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tab: Rubrik */}
        <div className={`${activeTab === 'rubrik' ? 'block' : 'hidden'} print:block print:break-before-page`}>
          <div className="mb-6 pb-2 border-b border-slate-100">
             <h3 className="font-bold text-xl text-slate-800 print:text-black">Rubrik Penilaian</h3>
          </div>
          <div className="grid gap-6">
            {data.rubric.map((item, idx) => (
              <div key={idx} className="border border-slate-200 rounded-lg overflow-hidden break-inside-avoid">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center print:bg-gray-100">
                  <span className="font-semibold text-slate-800">
                    {item.questionNumber === 0 ? "Rubrik Umum" : `Nomor Soal: ${item.questionNumber}`}
                  </span>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Maks Skor: {item.maxScore}</span>
                </div>
                <div className="p-4">
                  <p className="text-sm font-medium text-slate-700 mb-3">{item.criteria}</p>
                  <table className="w-full text-sm border-collapse border border-slate-200">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 print:bg-gray-50">
                        <th className="border border-slate-200 px-3 py-2 w-20 text-center">Skor</th>
                        <th className="border border-slate-200 px-3 py-2 text-left">Deskripsi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {item.levels.map((level, lIdx) => (
                        <tr key={lIdx}>
                          <td className="border border-slate-200 px-3 py-2 text-center font-semibold text-primary-700 print:text-black">{level.score}</td>
                          <td className="border border-slate-200 px-3 py-2 text-slate-600">{level.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ResultDisplay;