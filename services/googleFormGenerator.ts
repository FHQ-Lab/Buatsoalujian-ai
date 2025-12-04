import { AssessmentResult } from "../types";

export const generateGoogleAppsScript = (data: AssessmentResult): string => {
  // Helper to ensure string literals are safe for GAS execution.
  // We use JSON.stringify because it produces a valid JS string literal (including quotes)
  // and handles escaping of special characters (\n, ", ', unicode) automatically and correctly.
  const safeJsonString = (str: string) => {
    let json = JSON.stringify(str);
    // Extra safety: JSON allows U+2028/U+2029 (Line separators), but older JS engines treat them as line breaks.
    // We escape them to be 100% safe.
    return json.replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
  };

  // Start building the script string
  // We avoid template literals for the GAS code itself to prevent confusion, 
  // but use them here in TS to construct the string.
  let script = `/**
 * @OnlyCurrentDoc
 * 
 * SCRIPT GENERATOR SOAL GOOGLE FORM (EduAssess AI)
 * 
 * INSTRUKSI PENGGUNAAN:
 * 1. Buka Google Form baru (https://form.new)
 * 2. Klik titik tiga (More) di pojok kanan atas -> Script Editor (Editor Skrip).
 * 3. Hapus semua kode yang ada (misal: function myFunction() {...}).
 * 4. Copy & Paste seluruh kode ini ke dalam editor.
 * 5. Simpan proyek (File -> Save) dengan nama "Generator Soal".
 * 6. Pilih fungsi 'createEduAssessQuiz' di dropdown toolbar atas.
 * 7. Klik tombol 'Run' (Jalankan).
 * 8. Berikan izin akses (Review Permissions -> Allow) jika diminta.
 * 9. Cek Google Form Anda, soal akan muncul otomatis.
 */

function createEduAssessQuiz() {
  try {
    var form = FormApp.getActiveForm();
    
    // --- 1. KONFIGURASI FORM ---
    form.setTitle(${safeJsonString(data.title)});
    form.setDescription(${safeJsonString(data.summary)});
    form.setIsQuiz(true);
    
    // Opsional: Hapus item lama jika ingin form bersih sebelum generate
    // var items = form.getItems();
    // for (var i = 0; i < items.length; i++) {
    //   form.deleteItem(items[i]);
    // }

    // --- 2. INPUT SOAL ---
`;

  data.questions.forEach((q) => {
    // Generate a safe variable name based on question number
    const itemVar = 'item_' + q.number;
    
    // Find answer key details
    const key = data.answerKeys.find(k => k.questionNumber === q.number);
    const correctAnswer = key ? key.answer.trim() : "";
    const explanation = key ? key.explanation : "";
    
    script += `\n    // --- Soal No. ${q.number} ---`;
    
    if (q.type === 'pilihan_ganda' && q.options) {
      // --- Multiple Choice Item ---
      script += `
    var ${itemVar} = form.addMultipleChoiceItem();
    ${itemVar}.setTitle(${safeJsonString(q.number + ". " + q.text)});
    ${itemVar}.setPoints(10);
    
    ${itemVar}.setChoices([
`;
      
      // Determine correct index safely
      let correctIndex = -1;
      
      // 1. Try to match by Letter (A, B, C, D, E)
      if (/^[A-E]$/i.test(correctAnswer)) {
        correctIndex = correctAnswer.toUpperCase().charCodeAt(0) - 65;
      } 
      // 2. Fallback: Try to match by Text content
      else {
         const ansLower = correctAnswer.toLowerCase();
         correctIndex = q.options.findIndex(function(opt) {
            return opt.toLowerCase().indexOf(ansLower) !== -1;
         });
      }

      // Generate choices
      q.options.forEach((opt, idx) => {
        const isCorrect = idx === correctIndex ? 'true' : 'false';
        script += `      ${itemVar}.createChoice(${safeJsonString(opt)}, ${isCorrect}),\n`;
      });

      script += `    ]);\n`;
      
      // Add Feedback/Explanation if available
      if (explanation) {
        script += `    var feedback_${q.number} = FormApp.createFeedback()
        .setText(${safeJsonString(explanation)})
        .build();
    ${itemVar}.setFeedbackForCorrect(feedback_${q.number});
    ${itemVar}.setFeedbackForIncorrect(feedback_${q.number});\n`;
      }

    } else {
      // --- Essay / Paragraph Item ---
      script += `
    var ${itemVar} = form.addParagraphTextItem();
    ${itemVar}.setTitle(${safeJsonString(q.number + ". " + q.text)});
`;
      // Essay feedback (General Feedback)
      if (explanation || correctAnswer) {
        // Combine answer key and explanation for the feedback text
        const combinedFeedback = "Kunci Jawaban: " + correctAnswer + "\n\nPembahasan: " + explanation;
        
        script += `    var feedback_${q.number} = FormApp.createFeedback()
        .setText(${safeJsonString(combinedFeedback)})
        .build();
    ${itemVar}.setGeneralFeedback(feedback_${q.number});\n`;
      }
    }
  });

  script += `
    Logger.log('Proses selesai. Cek Google Form Anda.');
  } catch (e) {
    Logger.log('Terjadi Error: ' + e.toString());
    FormApp.getUi().alert('Error: ' + e.toString());
  }
}
`;

  return script;
};