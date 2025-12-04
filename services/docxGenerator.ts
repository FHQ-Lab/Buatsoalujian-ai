import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  Table, 
  TableRow, 
  TableCell, 
  BorderStyle, 
  WidthType, 
  HeadingLevel, 
  AlignmentType,
  UnderlineType
} from "docx";
import { AssessmentResult } from "../types";

const BORDER_STYLE = {
  style: BorderStyle.SINGLE,
  size: 1,
  color: "000000",
};

const TABLE_BORDERS = {
  top: BORDER_STYLE,
  bottom: BORDER_STYLE,
  left: BORDER_STYLE,
  right: BORDER_STYLE,
  insideHorizontal: BORDER_STYLE,
  insideVertical: BORDER_STYLE,
};

export const generateDocx = async (data: AssessmentResult): Promise<Blob> => {
  const sections = [];

  // --- Header & Summary ---
  const headerChildren = [
    new Paragraph({
      text: data.title,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Ringkasan Materi:", bold: true }),
      ],
      spacing: { after: 100 },
    }),
    new Paragraph({
      text: data.summary,
      spacing: { after: 400 },
    }),
    new Paragraph({
      text: "SOAL UJIAN",
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { before: 400, after: 200 },
    }),
  ];

  // --- Questions ---
  const questionsChildren = data.questions.flatMap((q) => {
    const questionParagraph = new Paragraph({
      children: [
        new TextRun({ text: `${q.number}. `, bold: true }),
        new TextRun({ text: q.text }),
      ],
      spacing: { after: 100 },
    });

    const elements = [questionParagraph];

    if (q.type === 'pilihan_ganda' && q.options) {
      q.options.forEach((opt, idx) => {
        elements.push(
          new Paragraph({
            text: `${String.fromCharCode(65 + idx)}. ${opt}`,
            indent: { left: 720 }, // Indent options
            spacing: { after: 50 },
          })
        );
      });
      elements.push(new Paragraph({ text: "", spacing: { after: 200 } })); // Space after question
    } else if (q.type === 'esai') {
      // Add empty lines for essay answers
      elements.push(new Paragraph({ text: "", spacing: { after: 800 } }));
      elements.push(new Paragraph({ text: "", spacing: { after: 800 } }));
    }

    return elements;
  });

  // --- Answer Keys ---
  const keysHeader = new Paragraph({
    text: "KUNCI JAWABAN & PEMBAHASAN",
    heading: HeadingLevel.HEADING_1,
    pageBreakBefore: true,
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
  });

  const keysChildren = data.answerKeys.flatMap((k) => [
    new Paragraph({
      children: [
        new TextRun({ text: `No. ${k.questionNumber}: `, bold: true }),
        new TextRun({ text: k.answer, bold: true, color: "1d4ed8" }),
      ],
      spacing: { before: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Pembahasan: ", italics: true }),
        new TextRun({ text: k.explanation }),
      ],
      spacing: { after: 200 },
    }),
  ]);

  // --- Grid (Kisi-Kisi) ---
  const gridHeader = new Paragraph({
    text: "KISI-KISI SOAL",
    heading: HeadingLevel.HEADING_1,
    pageBreakBefore: true,
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
  });

  const gridRows = [
    new TableRow({
      tableHeader: true,
      children: [
        "No", "Kompetensi Dasar", "Materi", "Indikator Soal", "Level", "Bentuk"
      ].map((text) => 
        new TableCell({
          children: [new Paragraph({ text, bold: true, alignment: AlignmentType.CENTER })],
          shading: { fill: "f3f4f6" },
          verticalAlign: AlignmentType.CENTER,
        })
      ),
    }),
    ...data.grid.map((item) => 
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ text: item.questionNumber.toString(), alignment: AlignmentType.CENTER })] }),
          new TableCell({ children: [new Paragraph(item.basicCompetency)] }),
          new TableCell({ children: [new Paragraph(item.material)] }),
          new TableCell({ children: [new Paragraph(item.indicator)] }),
          new TableCell({ children: [new Paragraph({ text: item.cognitiveLevel, alignment: AlignmentType.CENTER })] }),
          new TableCell({ children: [new Paragraph({ text: item.questionForm, alignment: AlignmentType.CENTER })] }),
        ],
      })
    ),
  ];

  const gridTable = new Table({
    rows: gridRows,
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: TABLE_BORDERS,
  });

  // --- Rubric ---
  const rubricHeader = new Paragraph({
    text: "RUBRIK PENILAIAN",
    heading: HeadingLevel.HEADING_1,
    pageBreakBefore: true,
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
  });

  const rubricChildren: (Paragraph | Table)[] = [];
  
  data.rubric.forEach((item) => {
    rubricChildren.push(
      new Paragraph({
        children: [
          new TextRun({ text: item.questionNumber === 0 ? "Rubrik Umum" : `Soal No. ${item.questionNumber}`, bold: true, size: 24 }),
          new TextRun({ text: ` (Max Skor: ${item.maxScore})`, color: "64748b" }),
        ],
        spacing: { before: 300, after: 100 },
      })
    );
    
    rubricChildren.push(
        new Paragraph({
            text: item.criteria,
            italics: true,
            spacing: { after: 100 }
        })
    );

    const levelsRows = [
      new TableRow({
        tableHeader: true,
        children: [
          new TableCell({ 
            children: [new Paragraph({ text: "Skor", bold: true, alignment: AlignmentType.CENTER })],
            width: { size: 15, type: WidthType.PERCENTAGE },
            shading: { fill: "f3f4f6" }
          }),
          new TableCell({ 
            children: [new Paragraph({ text: "Deskripsi", bold: true })],
            shading: { fill: "f3f4f6" }
          }),
        ],
      }),
      ...item.levels.map(level => 
        new TableRow({
          children: [
            new TableCell({ 
                children: [new Paragraph({ text: level.score.toString(), alignment: AlignmentType.CENTER })],
                verticalAlign: AlignmentType.CENTER
            }),
            new TableCell({ children: [new Paragraph(level.description)] }),
          ]
        })
      )
    ];

    rubricChildren.push(
      new Table({
        rows: levelsRows,
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: TABLE_BORDERS,
      })
    );
  });

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          ...headerChildren,
          ...questionsChildren,
          keysHeader,
          ...keysChildren,
          gridHeader,
          gridTable,
          rubricHeader,
          ...rubricChildren
        ],
      },
    ],
  });

  return await Packer.toBlob(doc);
};