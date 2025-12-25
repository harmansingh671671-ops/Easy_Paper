import { useState } from 'react';
import { useProfile } from '../App';
import teacherService from '../services/teacherService';
import questionService from '../services/questionService';
import QuestionLibrary from './QuestionLibrary';
import { ArrowLeft, Save, FileText, CheckCircle } from 'lucide-react';

function TeacherPaperCreator({ onBack }) {
    const { profile } = useProfile();
    const [step, setStep] = useState(1); // 1: Select Questions, 2: Configure & Generate
    const [selectedQuestions, setSelectedQuestions] = useState([]);
    const [paperDetails, setPaperDetails] = useState({
        title: '',
        duration: 60,
        instructions: 'All questions are compulsory.\nFigures to the right indicate full marks.',
        totalMarks: 0
    });
    const [loading, setLoading] = useState(false);

    const toggleQuestionSelection = (question) => {
        if (selectedQuestions.find(q => q.id === question.id)) {
            setSelectedQuestions(prev => prev.filter(q => q.id !== question.id));
        } else {
            setSelectedQuestions(prev => [...prev, question]);
        }
    };

    const calculateTotalMarks = () => {
        return selectedQuestions.reduce((sum, q) => sum + (q.marks || 1), 0);
    };

    const handleGenerate = async () => {
        if (!paperDetails.title) {
            alert("Please enter a paper title");
            return;
        }
        setLoading(true);
        try {
            // 1. Create Paper in DB
            const paperData = {
                title: paperDetails.title,
                category: profile.category,
                questions: selectedQuestions.map(q => ({ id: q.id, marks: q.marks })),
                total_marks: calculateTotalMarks(),
                duration_minutes: parseInt(paperDetails.duration),
                instructions: paperDetails.instructions
            };

            await teacherService.createPaper(
                paperData.title,
                paperData.category,
                paperData.total_marks,
                paperData.duration_minutes,
                paperData.instructions,
                paperData.questions
            );

            // 2. Generate PDF
            const pdfBlob = await questionService.generatePdf({
                title: paperDetails.title,
                question_ids: selectedQuestions.map(q => q.id)
            });

            // 3. Download PDF
            const url = window.URL.createObjectURL(new Blob([pdfBlob]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${paperDetails.title.replace(/\s+/g, '_')}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();

            alert("Paper created and downloaded successfully!");
            onBack();
        } catch (err) {
            console.error(err);
            alert("Failed to generate paper");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-gray-600 hover:text-indigo-600"
                >
                    <ArrowLeft size={20} />
                    Back to Dashboard
                </button>
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <p className="text-sm text-gray-500">Selected Questions</p>
                        <p className="text-xl font-bold text-indigo-600">{selectedQuestions.length}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-gray-500">Total Marks</p>
                        <p className="text-xl font-bold text-green-600">{calculateTotalMarks()}</p>
                    </div>
                </div>
            </div>

            {step === 1 && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm">
                        <h2 className="text-xl font-bold">Step 1: Select Questions</h2>
                        <button
                            onClick={() => setStep(2)}
                            disabled={selectedQuestions.length === 0}
                            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                            Next: Configure Paper
                        </button>
                    </div>
                    <QuestionLibrary
                        showCreateButton={false}
                        enableSelection={true}
                        selectedIds={selectedQuestions.map(q => q.id)}
                        onToggleSelection={toggleQuestionSelection}
                    />
                </div>
            )}

            {step === 2 && (
                <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-sm">
                    <h2 className="text-xl font-bold mb-6">Step 2: Configure Paper</h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Paper Title</label>
                            <input
                                type="text"
                                value={paperDetails.title}
                                onChange={e => setPaperDetails({ ...paperDetails, title: e.target.value })}
                                className="w-full px-4 py-2 border rounded-lg"
                                placeholder="e.g. Physics Mid-Term 2024"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                                <input
                                    type="number"
                                    value={paperDetails.duration}
                                    onChange={e => setPaperDetails({ ...paperDetails, duration: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
                            <textarea
                                value={paperDetails.instructions}
                                onChange={e => setPaperDetails({ ...paperDetails, instructions: e.target.value })}
                                rows={4}
                                className="w-full px-4 py-2 border rounded-lg font-mono text-sm"
                            />
                        </div>

                        <div className="pt-6">
                            <button
                                onClick={handleGenerate}
                                disabled={loading}
                                className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                            >
                                {loading ? 'Generating...' : (
                                    <>
                                        <Save size={20} />
                                        Generate & Download Paper
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default TeacherPaperCreator;
