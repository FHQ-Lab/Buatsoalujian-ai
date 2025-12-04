import { GoogleGenAI, Schema, Type } from "@google/genai";
import { AssessmentConfig, AssessmentResult } from "../types";

const getDifficultyInstruction = (diff: string) => {
  switch (diff) {
    case 'mudah': return 'Semua soal harus Level C1 (Mengingat) atau C2 (Memahami).';
    case 'sedang': return 'Semua soal harus Level C3 (Menerapkan/Aplikasi).';
    case 'sulit': return 'Semua soal harus Level C4 (Menganalisis) atau C5 (Mengevaluasi).';
    case 'HOTS': return 'Semua soal harus Level C4, C5, atau C6 (Analisis/Evaluasi/Kreasi).';
    case 'campuran_c1_c3': return 'Komposisi Soal: 40% C1, 30% C2, 30% C3.';
    case 'campuran_c3_c6': return 'Komposisi Soal: 30% C3, 30% C4, 20% C5, 20% C6.';
    case 'campuran_c1_c6': return 'Komposisi Soal: Distribusi merata (seimbang) untuk setiap level dari C1 sampai C6.';
    default: return 'Level C3 (Sedang).';
  }
};

const assessmentSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "Judul Ujian/Assessment" },
    summary: { type: Type.STRING, description: "Ringkasan singkat materi (maks 2 paragraf)" },
    questions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          number: { type: Type.INTEGER },
          text: { type: Type.STRING },
          type: { type: Type.STRING, enum: ["pilihan_ganda", "esai"] },
          options: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Array of option texts only. DO NOT include A/B/C prefixes." }
        },
        required: ["number", "text", "type"]
      }
    },
    answerKeys: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          questionNumber: { type: Type.INTEGER },
          answer: { type: Type.STRING, description: "The correct answer (e.g., 'A' or the essay answer)" },
          explanation: { type: Type.STRING }
        },
        required: ["questionNumber", "answer", "explanation"]
      }
    },
    grid: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          basicCompetency: { type: Type.STRING, description: "Kompetensi Dasar" },
          material: { type: Type.STRING, description: "Materi Pokok" },
          indicator: { type: Type.STRING, description: "Indikator Soal" },
          questionNumber: { type: Type.INTEGER },
          cognitiveLevel: { type: Type.STRING, description: "Level Kognitif (e.g., C1, C2, C3, C4, C5, C6)" },
          questionForm: { type: Type.STRING, description: "Bentuk Soal" }
        },
        required: ["basicCompetency", "material", "indicator", "questionNumber", "cognitiveLevel", "questionForm"]
      }
    },
    rubric: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          questionNumber: { type: Type.INTEGER, description: "Number reference or 0 for general rubric" },
          criteria: { type: Type.STRING },
          maxScore: { type: Type.INTEGER },
          levels: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                score: { type: Type.INTEGER },
                description: { type: Type.STRING }
              },
              required: ["score", "description"]
            }
          }
        },
        required: ["criteria", "maxScore", "levels"]
      }
    }
  },
  required: ["title", "summary", "questions", "answerKeys", "grid", "rubric"]
};

export const generateAssessment = async (
  content: string,
  isPdf: boolean,
  config: AssessmentConfig
): Promise<AssessmentResult> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key not found in environment variables");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const modelId = "gemini-2.5-flash";

  // Determine option logic based on grade level
  const isLowerGrade = ['SD', 'SMP'].includes(config.gradeLevel);
  // Instruction for consistency
  const optionFormat = isLowerGrade ? "4 opsi (A-D)" : "5 opsi (A-E)";
  const optionCount = isLowerGrade ? 4 : 5;

  // Construct specific instructions based on Question Type
  let structureInstruction = "";
  
  if (config.questionType === 'pilihan_ganda') {
    structureInstruction = `
    - Buat total ${config.questionCount} soal berbentuk PILIHAN GANDA.
    - OPSI JAWABAN: Wajib menggunakan ${optionFormat} (${optionCount} pilihan) secara KONSISTEN untuk setiap soal.
    - DILARANG mencampur jumlah opsi (misal sebagian A-D, sebagian A-E). Semua harus sama.
    `;
  } else if (config.questionType === 'esai') {
    structureInstruction = `
    - Buat total ${config.questionCount} soal berbentuk ESAI/URAIAN.
    - Soal harus menilai kemampuan analisis, evaluasi, dan penalaran (HOTS).
    - JANGAN buat soal hafalan sederhana.
    `;
  } else if (config.questionType === 'campuran') {
    structureInstruction = `
    - Buat total ${config.questionCount} soal.
    - KOMPOSISI:
      1. Wajib ada minimal 3 soal ESAI (untuk menguji analisis/penalaran), kecuali jika total soal < 3.
      2. Sisanya adalah soal PILIHAN GANDA.
    - Untuk soal Pilihan Ganda, wajib gunakan format ${optionFormat} secara KONSISTEN.
    `;
  }

  const diffInstruction = getDifficultyInstruction(config.difficulty);

  const promptText = `
    Bertindaklah sebagai Ahli Kurikulum dan Pembuat Soal Pendidikan Indonesia Profesional.
    Tugas: Buatlah perangkat asesmen lengkap berdasarkan ${isPdf ? "dokumen PDF yang dilampirkan" : "teks berikut"}.
    
    Konteks Pengguna:
    - Jenjang: ${config.gradeLevel}
    - Mata Pelajaran: ${config.subject}
    - Topik: ${config.topic}
    - Tingkat Kesulitan & Distribusi Kognitif: ${diffInstruction}
    
    Instruksi Pembuatan Soal:
    ${structureInstruction}
    
    Instruksi Detail Output:
    1. **Ringkasan Materi**: Buat ringkasan padat dari konten (maks 2 paragraf).
    2. **Soal Ujian**:
       - Bahasa Indonesia baku.
       - PASTIKAN DISTRIBUSI LEVEL KOGNITIF (C1-C6) SESUAI INSTRUKSI DI ATAS.
       - Untuk Pilihan Ganda: HANYA tulis teks opsinya di dalam array JSON (contoh: ["Jawaban 1", "Jawaban 2"]). JANGAN tulis prefix "A.", "B." secara manual di dalam teks.
    3. **Kunci Jawaban**: Sertakan jawaban yang benar (Huruf untuk PG, Inti jawaban untuk Esai) dan pembahasan detail.
    4. **Kisi-Kisi**: Format standar (KD, Materi, Indikator, Level Kognitif). Pastikan kolom "cognitiveLevel" sesuai dengan soal yang dibuat (misal C1, C4, C6).
    5. **Rubrik**: Pedoman penskoran yang jelas.

    Pastikan output adalah JSON valid sesuai skema yang diberikan.
    
    ${!isPdf ? `KONTEN MATERI:\n${content}` : ""}
  `;

  const parts: any[] = [{ text: promptText }];

  if (isPdf) {
    const base64Data = content.replace(/^data:application\/pdf;base64,/, "");
    parts.push({
      inlineData: {
        mimeType: "application/pdf",
        data: base64Data
      }
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: assessmentSchema,
        temperature: 0.4, 
      },
    });

    if (!response.text) {
      throw new Error("No response generated");
    }

    return JSON.parse(response.text) as AssessmentResult;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};