import { GoogleGenAI } from "@google/genai";
import type { CourseModule, QuizQuestion } from '../types';

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY as string });
const model = 'gemini-2.0-flash';

export interface GeneratedCourse {
  title: string;
  subtitle: string;
  description: string;
  modules: CourseModule[];
  quiz: QuizQuestion[];
}

export async function generateCourseFromText(pdfText: string, originalTitle: string): Promise<GeneratedCourse> {
  const prompt = `
Eres un experto en diseño instruccional y creación de cursos de capacitación empresarial.
Tu tarea es analizar el siguiente texto extraído de un PDF y transformarlo en un curso estructurado.

TEXTO DEL PDF:
"""
${pdfText.slice(0, 15000)}
"""

INSTRUCCIONES:
1. Analiza el contenido y crea un curso estructurado con módulos claros
2. Extrae los puntos clave de cada sección
3. Genera un quiz de 5-7 preguntas estilo Kahoot (divertido, interactivo)

RESPONDE EXACTAMENTE en el siguiente formato JSON (sin markdown, solo JSON puro):
{
  "title": "Título atractivo del curso (máximo 5 palabras)",
  "subtitle": "Subtítulo descriptivo",
  "description": "Descripción del curso en 2-3 oraciones",
  "modules": [
    {
      "id": "mod1",
      "title": "Título del Módulo",
      "description": "Descripción breve del módulo",
      "keyPoints": ["Punto clave 1", "Punto clave 2", "Punto clave 3"]
    }
  ],
  "quiz": [
    {
      "id": 1,
      "question": "¿Pregunta interesante sobre el contenido?",
      "options": ["Opción A", "Opción B", "Opción C", "Opción D"],
      "correctAnswer": 0,
      "explanation": "Explicación de por qué esta es la respuesta correcta"
    }
  ]
}

REGLAS IMPORTANTES:
- Crea entre 3-6 módulos dependiendo del contenido
- Cada módulo debe tener 3-5 puntos clave
- Las preguntas del quiz deben cubrir los conceptos más importantes
- Usa español para todo el contenido
- Las opciones del quiz deben ser plausibles pero solo una correcta
- El correctAnswer es el índice (0-3) de la respuesta correcta
- Mantén un tono profesional pero accesible

Si el título original era "${originalTitle}", puedes usarlo como referencia pero mejóralo si es necesario.
`;

  try {
    console.log('🤖 [COURSE_GEN] Generating course from PDF text...');

    const response = await ai.models.generateContent({
      model,
      contents: { parts: [{ text: prompt }] },
    });

    const responseText = response.text;
    console.log('🤖 [COURSE_GEN] Raw response:', responseText.substring(0, 500));

    // Clean up the response - remove markdown code blocks if present
    let jsonText = responseText.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.slice(7);
    }
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.slice(3);
    }
    if (jsonText.endsWith('```')) {
      jsonText = jsonText.slice(0, -3);
    }
    jsonText = jsonText.trim();

    const course = JSON.parse(jsonText) as GeneratedCourse;

    console.log('✅ [COURSE_GEN] Course generated successfully:', course.title);
    console.log('📚 [COURSE_GEN] Modules:', course.modules.length);
    console.log('❓ [COURSE_GEN] Quiz questions:', course.quiz.length);

    return course;
  } catch (error) {
    console.error('❌ [COURSE_GEN] Error generating course:', error);
    throw new Error('Failed to generate course from PDF content');
  }
}

export async function extractTextFromPDF(file: File): Promise<string> {
  // Use PDF.js to extract text from the PDF
  const pdfjsLib = await import('pdfjs-dist');

  // Set worker source
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let fullText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: { str: string }) => item.str)
      .join(' ');
    fullText += pageText + '\n\n';
  }

  console.log('📄 [PDF_EXTRACT] Extracted', fullText.length, 'characters from', pdf.numPages, 'pages');

  return fullText;
}
