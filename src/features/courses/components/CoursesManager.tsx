import React, { useState } from 'react';
import { coursesData } from '../constants';
import { Course } from '../types';
import { BookOpenIcon, ExpandIcon, UndoIcon, DownloadIcon, TrophyIcon } from '@/shared/components/Icons';
import Loader from '@/shared/components/Loader';

const CoursesManager: React.FC = () => {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Quiz State
  const [quizState, setQuizState] = useState<'idle' | 'playing' | 'finished'>('idle');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const handleSelectCourse = (course: Course) => {
    setSelectedCourse(course);
    setQuizState('idle'); // Reset quiz when opening a course
    setScore(0);
    setCurrentQuestionIndex(0);
  };

  const handleBackToList = () => {
    setSelectedCourse(null);
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('course-pdf-content');
    if (!element || !selectedCourse) return;

    setIsDownloading(true);

    const opt = {
      margin:       [10, 10, 10, 10], // top, left, bottom, right in mm
      filename:     `${selectedCourse.title.replace(/\s+/g, '_')}_Curso.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, letterRendering: true, logging: false },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
    };

    try {
      // @ts-ignore
      if (window.html2pdf) {
        // @ts-ignore
        await window.html2pdf().set(opt).from(element).save();
      } else {
        // Fallback in case script didn't load
        window.print();
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Hubo un error generando el archivo. Se abrirá el diálogo de impresión como alternativa.");
      window.print();
    } finally {
      setIsDownloading(false);
    }
  };

  // --- Quiz Logic ---
  const startQuiz = () => {
      setQuizState('playing');
      setCurrentQuestionIndex(0);
      setScore(0);
      setSelectedAnswer(null);
      setShowFeedback(false);
      // Scroll to quiz section
      setTimeout(() => {
        const quizSection = document.getElementById('quiz-section');
        quizSection?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
  };

  const handleAnswerClick = (index: number) => {
      if (showFeedback || !selectedCourse?.quiz) return;
      
      setSelectedAnswer(index);
      setShowFeedback(true);
      
      if (index === selectedCourse.quiz[currentQuestionIndex].correctAnswer) {
          setScore(prev => prev + 1);
      }
  };

  const nextQuestion = () => {
      if (!selectedCourse?.quiz) return;

      if (currentQuestionIndex < selectedCourse.quiz.length - 1) {
          setCurrentQuestionIndex(prev => prev + 1);
          setSelectedAnswer(null);
          setShowFeedback(false);
      } else {
          setQuizState('finished');
      }
  };

  const restartQuiz = () => {
      setQuizState('idle');
      setScore(0);
      setCurrentQuestionIndex(0);
      setSelectedAnswer(null);
      setShowFeedback(false);
  };

  const getScoreMessage = () => {
      if (!selectedCourse?.quiz) return "";
      const percentage = (score / selectedCourse.quiz.length) * 100;
      if (percentage === 100) return "¡INCREÍBLE! ¡Eres un Maestro!";
      if (percentage >= 80) return "¡Excelente trabajo!";
      if (percentage >= 60) return "¡Bien hecho!";
      return "Sigue practicando.";
  };

  return (
    <div className="p-1 min-h-[60vh] course-container">
      {!selectedCourse ? (
        // --- View 1: List of Courses ---
        <div>
          <div className="mb-8">
            <h2 className="text-3xl font-bold font-serif text-gray-900">Cursos Disponibles</h2>
            <p className="text-gray-500 mt-2">Capacitación y desarrollo personal para potenciar tus ventas.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {coursesData.map((course) => (
              <div 
                key={course.id} 
                onClick={() => handleSelectCourse(course)}
                className="group relative bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col"
              >
                <div className="h-48 bg-gradient-to-r from-gray-800 to-gray-900 flex items-center justify-center p-6 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-20">
                         {/* Abstract Pattern */}
                        <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                            <path d="M0 100 L100 0 L100 100 Z" fill="white" />
                        </svg>
                    </div>
                    <div className="relative z-10 text-center">
                         <h3 className="text-2xl font-black font-serif text-white tracking-wider mb-2">{course.title.toUpperCase()}</h3>
                         <p className="text-gray-300 font-medium">{course.author}</p>
                    </div>
                </div>
                
                <div className="p-6 flex flex-col flex-grow">
                  <h4 className="text-xl font-bold text-gray-900 mb-2">{course.subtitle}</h4>
                  <p className="text-gray-600 line-clamp-3 mb-4 flex-grow">{course.description}</p>
                  
                  <div className="flex justify-between items-center mt-auto pt-4 border-t border-gray-100">
                    <span className="text-sm font-semibold text-gray-500 flex items-center gap-1">
                        <BookOpenIcon className="h-4 w-4" />
                        {course.modules.length} Módulos
                    </span>
                    <button className="text-blue-600 font-bold text-sm flex items-center gap-1 group-hover:underline">
                        Ver Curso <ExpandIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        // --- View 2: Course Details ---
        <div className="animate-fade-in print-content">
            <div className="flex justify-between items-center mb-6 print:hidden">
                <button 
                    onClick={handleBackToList}
                    className="flex items-center text-gray-500 hover:text-gray-800 transition-colors font-medium"
                >
                    <UndoIcon className="h-5 w-5 mr-2" />
                    Volver a la lista
                </button>

                <button 
                    onClick={handleDownloadPDF}
                    disabled={isDownloading}
                    className="flex items-center bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors shadow-sm font-bold text-sm disabled:bg-gray-400 disabled:cursor-wait"
                >
                    {isDownloading ? <Loader /> : <DownloadIcon className="h-5 w-5 mr-2" />}
                    {isDownloading ? 'Generando PDF...' : 'Descargar PDF'}
                </button>
            </div>

            <div id="course-pdf-content" className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden print:shadow-none print:border-none print:rounded-none">
                <div className="bg-gray-900 text-white p-8 md:p-12 text-center print:bg-white print:text-black print:p-0 print:mb-8 print:border-b-2 print:border-black">
                    <span className="uppercase tracking-widest text-xs font-bold text-gray-400 mb-2 block print:text-gray-600">{selectedCourse.author}</span>
                    <h1 className="text-3xl md:text-5xl font-black font-serif mb-4">{selectedCourse.title}</h1>
                    <p className="text-xl text-gray-300 max-w-2xl mx-auto italic print:text-gray-700">{selectedCourse.subtitle}</p>
                </div>
                
                <div className="p-6 md:p-10 print:p-0">
                    <p className="text-lg text-gray-700 leading-relaxed mb-10 max-w-4xl mx-auto text-center border-b pb-8 print:text-justify print:mb-8">
                        {selectedCourse.description}
                    </p>

                    {/* Introductory Quotes Section */}
                    {selectedCourse.quotes && selectedCourse.quotes.length > 0 && (
                        <div className="max-w-4xl mx-auto mb-16 avoid-break print:mb-12">
                            <h3 className="text-center font-bold font-serif text-2xl text-gray-800 mb-8 print:text-black">Filosofía del Curso</h3>
                            <div className="grid gap-6">
                                {selectedCourse.quotes.map((quote, i) => (
                                    <div key={i} className={`text-center p-6 rounded-xl ${quote.highlight ? 'bg-gray-900 text-white' : 'bg-gray-50 border border-gray-200'} print:bg-white print:border print:border-gray-300 print:text-black`}>
                                        <p className={`font-serif text-xl md:text-2xl leading-relaxed italic ${quote.highlight ? 'text-white' : 'text-gray-700'} print:text-black`}>
                                            "{quote.text}"
                                        </p>
                                        {quote.author && (
                                            <p className={`mt-4 text-sm font-bold uppercase tracking-widest ${quote.highlight ? 'text-gray-400' : 'text-gray-500'} print:text-gray-600`}>
                                                — {quote.author}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="space-y-12 max-w-5xl mx-auto">
                        {selectedCourse.modules.map((module, index) => (
                            <div key={module.id} className="relative module-section">
                                {/* Connector Line (Hide in print/pdf) */}
                                {index < selectedCourse.modules.length - 1 && (
                                    <div className="absolute left-8 top-16 bottom-0 w-0.5 bg-gray-200 -z-10 hidden md:block print:hidden" style={{ height: 'calc(100% + 3rem)' }}></div>
                                )}
                                
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8 print:shadow-none print:border-none print:mb-12">
                                    {/* Module Header */}
                                    <div className="p-6 md:p-8 border-b border-gray-100 bg-gray-50 print:bg-white print:border-b-2 print:border-black print:px-0 print:pb-4">
                                        <div className="flex items-start gap-4">
                                            <div className="bg-gray-900 text-white font-bold rounded-lg w-12 h-12 flex items-center justify-center flex-shrink-0 text-xl shadow-md print:bg-black print:text-white print:shadow-none">
                                                {index + 1}
                                            </div>
                                            <div>
                                                <h3 className="text-2xl font-bold text-gray-900 mb-2">{module.title}</h3>
                                                {module.description && (
                                                    <p className="text-gray-600 text-lg leading-relaxed print:text-black">{module.description}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-6 md:p-8 space-y-8 print:px-0">
                                        {/* Key Points */}
                                        <div className="avoid-break">
                                            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 print:text-black print:border-b">Puntos Clave</h4>
                                            <div className="grid gap-3">
                                                {module.keyPoints.map((point, i) => (
                                                    <div key={i} className="flex gap-3 items-start">
                                                        <div className="h-2 w-2 rounded-full bg-blue-500 mt-2 flex-shrink-0 print:bg-black"></div>
                                                        <p className="text-gray-800 font-medium">{point}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Quote inside Module */}
                                        {module.quote && (
                                            <div className="relative pl-6 py-2 border-l-4 border-blue-500 bg-blue-50 rounded-r-lg p-4 avoid-break print:bg-gray-50 print:border-black">
                                                <p className="text-xl font-serif italic text-blue-900 print:text-black">"{module.quote.text}"</p>
                                                {(module.quote.author || module.quote.source) && (
                                                    <p className="text-blue-700 text-sm mt-2 font-bold uppercase tracking-wide print:text-gray-700">
                                                        — {module.quote.author || module.quote.source}
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        {/* Scientific Evidence / Case Studies */}
                                        {module.examples && module.examples.length > 0 && (
                                            <div className="mt-8 avoid-break">
                                                <h4 className="flex items-center text-sm font-bold text-indigo-600 uppercase tracking-widest mb-4 print:text-black print:border-b">
                                                    <span className="bg-indigo-100 p-1 rounded mr-2 print:hidden">🧬</span> Evidencia Científica & Casos de Estudio
                                                </h4>
                                                <div className="grid md:grid-cols-2 gap-4 print:block print:space-y-4">
                                                    {module.examples.map((example, i) => (
                                                        <div key={i} className="bg-indigo-50/50 border border-indigo-100 rounded-lg p-5 hover:shadow-md transition-shadow print:shadow-none print:border-gray-300 print:bg-white">
                                                            <h5 className="font-bold text-indigo-900 mb-2 print:text-black">{example.title}</h5>
                                                            <div className="text-sm text-gray-700 space-y-2">
                                                                <p><span className="font-semibold text-indigo-700 print:text-black">El Estudio:</span> {example.content}</p>
                                                                <p><span className="font-semibold text-indigo-700 print:text-black">Resultado:</span> {example.result}</p>
                                                                <div className="mt-3 pt-3 border-t border-indigo-100 print:border-gray-200">
                                                                    <p className="text-indigo-800 font-medium italic print:text-black">💡 Lección: {example.lesson}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Practical Activities */}
                                        {module.activities && module.activities.length > 0 && (
                                            <div className="mt-8 avoid-break">
                                                <h4 className="flex items-center text-sm font-bold text-green-600 uppercase tracking-widest mb-4 print:text-black print:border-b">
                                                    <span className="bg-green-100 p-1 rounded mr-2 print:hidden">⚡</span> Taller Práctico
                                                </h4>
                                                <div className="grid gap-4 print:block print:space-y-4">
                                                    {module.activities.map((activity, i) => (
                                                        <div key={i} className="bg-green-50/50 border border-green-100 rounded-lg p-5 print:shadow-none print:border-gray-300 print:bg-white">
                                                            <h5 className="font-bold text-green-900 mb-1 print:text-black">{activity.title}</h5>
                                                            <p className="text-sm text-green-700 mb-4 print:text-gray-700">{activity.description}</p>
                                                            <ul className="space-y-2">
                                                                {activity.steps.map((step, stepIndex) => (
                                                                    <li key={stepIndex} className="flex items-start gap-3 text-sm text-gray-700">
                                                                        <input type="checkbox" className="mt-1 h-4 w-4 text-green-600 rounded border-gray-300 focus:ring-green-500 print:border-black" />
                                                                        <span>{step}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* --- QUIZ SECTION --- */}
                    {selectedCourse.quiz && selectedCourse.quiz.length > 0 && (
                        <div id="quiz-section" className="mt-16 max-w-4xl mx-auto print:hidden avoid-break">
                            <div className="bg-gray-900 text-white rounded-2xl shadow-xl overflow-hidden">
                                {quizState === 'idle' && (
                                    <div className="p-10 text-center">
                                        <TrophyIcon className="h-16 w-16 mx-auto text-yellow-400 mb-4" />
                                        <h2 className="text-3xl font-black font-serif mb-2">Quiz de Conocimiento</h2>
                                        <p className="text-gray-300 mb-8">Pon a prueba lo que aprendiste en este curso. ¿Listo para el reto?</p>
                                        <button 
                                            onClick={startQuiz}
                                            className="bg-white text-gray-900 font-bold py-3 px-8 rounded-full hover:bg-yellow-400 transition-all transform hover:scale-105 shadow-lg text-lg"
                                        >
                                            Comenzar Quiz
                                        </button>
                                    </div>
                                )}

                                {quizState === 'playing' && (
                                    <div className="p-8">
                                        <div className="flex justify-between items-center mb-6">
                                            <span className="text-sm font-bold bg-gray-800 px-3 py-1 rounded-full">
                                                Pregunta {currentQuestionIndex + 1} de {selectedCourse.quiz.length}
                                            </span>
                                            <span className="text-yellow-400 font-bold">Puntos: {score}</span>
                                        </div>

                                        <h3 className="text-xl md:text-2xl font-bold mb-8 leading-relaxed">
                                            {selectedCourse.quiz[currentQuestionIndex].question}
                                        </h3>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                            {selectedCourse.quiz[currentQuestionIndex].options.map((option, idx) => {
                                                const isSelected = selectedAnswer === idx;
                                                const isCorrect = idx === selectedCourse.quiz![currentQuestionIndex].correctAnswer;
                                                let btnClass = "p-4 rounded-xl text-left font-semibold transition-all duration-200 border-2 ";
                                                
                                                if (showFeedback) {
                                                    if (isCorrect) btnClass += "bg-green-500 border-green-500 text-white";
                                                    else if (isSelected) btnClass += "bg-red-500 border-red-500 text-white";
                                                    else btnClass += "bg-gray-800 border-gray-700 text-gray-400 opacity-50";
                                                } else {
                                                    btnClass += "bg-white text-gray-900 border-white hover:bg-gray-100 hover:scale-[1.02]";
                                                }

                                                return (
                                                    <button
                                                        key={idx}
                                                        onClick={() => handleAnswerClick(idx)}
                                                        disabled={showFeedback}
                                                        className={btnClass}
                                                    >
                                                        {option}
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {showFeedback && (
                                            <div className="animate-fade-in mt-4 p-4 bg-gray-800 rounded-lg border-l-4 border-yellow-400">
                                                <p className="font-bold text-white mb-1">
                                                    {selectedAnswer === selectedCourse.quiz[currentQuestionIndex].correctAnswer ? "¡Correcto!" : "Incorrecto"}
                                                </p>
                                                <p className="text-sm text-gray-300">
                                                    {selectedCourse.quiz[currentQuestionIndex].explanation}
                                                </p>
                                                <div className="mt-4 text-right">
                                                    <button 
                                                        onClick={nextQuestion}
                                                        className="bg-yellow-400 text-gray-900 font-bold py-2 px-6 rounded-lg hover:bg-yellow-300 transition-colors"
                                                    >
                                                        {currentQuestionIndex < selectedCourse.quiz.length - 1 ? "Siguiente" : "Ver Resultados"}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {quizState === 'finished' && (
                                    <div className="p-10 text-center animate-fade-in">
                                        <div className="mb-6">
                                            {score === selectedCourse.quiz.length ? (
                                                <span className="text-6xl">🏆</span>
                                            ) : score > selectedCourse.quiz.length / 2 ? (
                                                <span className="text-6xl">🌟</span>
                                            ) : (
                                                <span className="text-6xl">📚</span>
                                            )}
                                        </div>
                                        <h2 className="text-3xl font-black font-serif mb-2">Quiz Completado</h2>
                                        <p className="text-xl text-yellow-400 font-bold mb-4">{getScoreMessage()}</p>
                                        
                                        <div className="bg-gray-800 rounded-xl p-6 mb-8 max-w-sm mx-auto">
                                            <p className="text-gray-400 text-sm uppercase tracking-widest mb-1">Tu Puntuación</p>
                                            <p className="text-4xl font-black text-white">{score} / {selectedCourse.quiz.length}</p>
                                        </div>

                                        <button 
                                            onClick={restartQuiz}
                                            className="bg-white text-gray-900 font-bold py-3 px-8 rounded-full hover:bg-gray-100 transition-colors"
                                        >
                                            Intentar de Nuevo
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}

      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.4s ease-out forwards; }
        
        @media print {
            /* Global Reset for Print */
            body, #root, .min-h-screen {
                background-color: white !important;
                height: auto !important;
                overflow: visible !important;
                margin: 0 !important;
                padding: 0 !important;
            }
            
            /* Hide everything that isn't the course content */
            body > *:not(#root) { display: none !important; }
            
            /* Specific layout adjustments for PDF output */
            .course-container {
                padding: 0 !important;
                width: 100% !important;
            }
            
            .module-section {
                page-break-before: always;
                margin-top: 2cm;
            }

            .module-section:first-child {
                page-break-before: auto;
                margin-top: 0;
            }
            
            .avoid-break {
                page-break-inside: avoid;
            }

            /* Ensure background colors print */
            * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
        }
      `}</style>
    </div>
  );
};

export default CoursesManager;
