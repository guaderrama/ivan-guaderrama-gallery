import { db, storage } from '@/shared/lib/firebase';
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import type { PDFCourse, CourseModule, QuizQuestion } from '../types';
import { extractTextFromPDF, generateCourseFromText } from './courseGeneratorService';

const PDF_COURSES_COLLECTION = 'pdf-courses';
const PDF_STORAGE_PATH = 'courses/pdfs';

export const pdfCoursesService = {
  async uploadPDFCourse(
    file: File,
    title: string,
    description?: string,
    processWithAI: boolean = true
  ): Promise<PDFCourse> {
    try {
      console.log('📚 [PDF_COURSES] Uploading PDF course:', title);

      // Upload PDF to Firebase Storage
      const fileName = `${Date.now()}_${file.name}`;
      const storageRef = ref(storage, `${PDF_STORAGE_PATH}/${fileName}`);

      await uploadBytes(storageRef, file);
      const pdfUrl = await getDownloadURL(storageRef);

      console.log('✅ [PDF_COURSES] PDF uploaded to:', pdfUrl);

      // Extract text and generate course with AI if enabled
      let generatedContent: {
        title: string;
        subtitle?: string;
        description: string;
        modules?: CourseModule[];
        quiz?: QuizQuestion[];
      } = {
        title,
        description: description || '',
      };

      if (processWithAI) {
        try {
          console.log('🤖 [PDF_COURSES] Processing PDF with AI...');

          // Extract text from PDF
          const pdfText = await extractTextFromPDF(file);

          if (pdfText.length > 100) {
            // Generate course structure from the text
            const generatedCourse = await generateCourseFromText(pdfText, title);

            generatedContent = {
              title: generatedCourse.title || title,
              subtitle: generatedCourse.subtitle,
              description: generatedCourse.description || description || '',
              modules: generatedCourse.modules,
              quiz: generatedCourse.quiz,
            };

            console.log('✅ [PDF_COURSES] AI processing complete!');
          } else {
            console.warn('⚠️ [PDF_COURSES] Not enough text extracted from PDF');
          }
        } catch (aiError) {
          console.error('⚠️ [PDF_COURSES] AI processing failed, saving without processing:', aiError);
          // Continue without AI processing
        }
      }

      // Save metadata to Firestore
      const courseData = {
        title: generatedContent.title,
        subtitle: generatedContent.subtitle || '',
        description: generatedContent.description,
        pdfUrl,
        pdfFileName: file.name,
        isProcessed: processWithAI && !!generatedContent.modules,
        modules: generatedContent.modules || [],
        quiz: generatedContent.quiz || [],
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, PDF_COURSES_COLLECTION), courseData);

      console.log('✅ [PDF_COURSES] Course metadata saved with ID:', docRef.id);

      return {
        id: docRef.id,
        title: generatedContent.title,
        subtitle: generatedContent.subtitle,
        description: generatedContent.description,
        pdfUrl,
        pdfFileName: file.name,
        isProcessed: courseData.isProcessed,
        modules: generatedContent.modules,
        quiz: generatedContent.quiz,
        createdAt: new Date(),
      };
    } catch (error) {
      console.error('❌ [PDF_COURSES] Error uploading PDF course:', error);
      throw new Error('Failed to upload PDF course');
    }
  },

  async getPDFCourses(): Promise<PDFCourse[]> {
    try {
      console.log('📚 [PDF_COURSES] Fetching PDF courses...');

      const q = query(
        collection(db, PDF_COURSES_COLLECTION),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const courses: PDFCourse[] = [];

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        courses.push({
          id: docSnap.id,
          title: data.title,
          subtitle: data.subtitle,
          description: data.description,
          pdfUrl: data.pdfUrl,
          pdfFileName: data.pdfFileName,
          isProcessed: data.isProcessed || false,
          modules: data.modules || [],
          quiz: data.quiz || [],
          createdAt: data.createdAt instanceof Timestamp
            ? data.createdAt.toDate()
            : new Date(),
        });
      });

      console.log('✅ [PDF_COURSES] Found', courses.length, 'PDF courses');
      return courses;
    } catch (error) {
      console.error('❌ [PDF_COURSES] Error fetching PDF courses:', error);
      throw new Error('Failed to fetch PDF courses');
    }
  },

  async deletePDFCourse(courseId: string, pdfUrl: string): Promise<void> {
    try {
      console.log('🗑️ [PDF_COURSES] Deleting PDF course:', courseId);

      // Delete from Firestore
      await deleteDoc(doc(db, PDF_COURSES_COLLECTION, courseId));

      // Delete PDF from Storage
      try {
        const storageRef = ref(storage, pdfUrl);
        await deleteObject(storageRef);
      } catch (storageError) {
        console.warn('⚠️ [PDF_COURSES] Could not delete PDF from storage:', storageError);
      }

      console.log('✅ [PDF_COURSES] Course deleted successfully');
    } catch (error) {
      console.error('❌ [PDF_COURSES] Error deleting PDF course:', error);
      throw new Error('Failed to delete PDF course');
    }
  },
};
