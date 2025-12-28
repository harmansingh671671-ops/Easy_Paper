import { useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

function FlashcardsViewer({ flashcards }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);

    if (!flashcards || flashcards.length === 0) {
        return <div className="text-gray-500 text-center py-8">No flashcards available.</div>;
    }

    const handleNext = () => {
        setIsFlipped(false); // Reset flip
        setTimeout(() => {
            setCurrentIndex((prev) => (prev + 1) % flashcards.length);
        }, 150); // Small delay for smooth transition if needed, though instant is fine.
    };

    const handlePrev = () => {
        setIsFlipped(false);
        setTimeout(() => {
            setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
        }, 150);
    };

    const currentCard = flashcards[currentIndex];

    return (
        <div className="flex flex-col items-center justify-center py-8">
            {/* Progress */}
            <div className="mb-4 text-sm font-medium text-gray-500">
                Card {currentIndex + 1} of {flashcards.length}
            </div>

            {/* Carousel Container */}
            <div className="flex items-center gap-8 w-full max-w-4xl justify-center">

                {/* Prev Button */}
                <button
                    onClick={handlePrev}
                    className="p-3 rounded-full hover:bg-gray-100 text-gray-500 hover:text-indigo-600 transition-colors"
                    title="Previous Card"
                >
                    <ArrowLeft size={32} />
                </button>

                {/* Card */}
                <div
                    className="relative w-full max-w-xl h-[400px] cursor-pointer group perspective-1000"
                    style={{ perspective: '1000px' }}
                    onClick={() => setIsFlipped(!isFlipped)}
                >
                    <div
                        className="relative w-full h-full transition-transform duration-500"
                        style={{
                            transformStyle: 'preserve-3d',
                            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
                        }}
                    >
                        {/* Front */}
                        <div
                            className="absolute inset-0 bg-white border-2 border-indigo-100 rounded-2xl p-8 flex flex-col items-center justify-center text-center shadow-lg hover:shadow-xl hover:border-indigo-300 transition-all backface-hidden"
                            style={{ backfaceVisibility: 'hidden' }}
                        >
                            <span className="text-sm font-bold text-indigo-500 uppercase tracking-widest mb-6">Term</span>
                            <h3 className="text-3xl font-bold text-gray-800 leading-tight">{currentCard.front}</h3>
                            <p className="mt-8 text-xs text-gray-400 font-medium">Click card to flip</p>
                        </div>

                        {/* Back */}
                        <div
                            className="absolute inset-0 bg-indigo-600 rounded-2xl p-8 flex flex-col items-center justify-center text-center shadow-xl text-white backface-hidden"
                            style={{
                                backfaceVisibility: 'hidden',
                                transform: 'rotateY(180deg)'
                            }}
                        >
                            <span className="text-sm font-bold text-indigo-200 uppercase tracking-widest mb-6">Definition</span>
                            <p className="text-xl font-medium leading-relaxed">{currentCard.back}</p>
                        </div>
                    </div>
                </div>

                {/* Next Button */}
                <button
                    onClick={handleNext}
                    className="p-3 rounded-full hover:bg-gray-100 text-gray-500 hover:text-indigo-600 transition-colors"
                    title="Next Card"
                >
                    <ArrowRight size={32} />
                </button>
            </div>

            <div className="mt-8 text-sm text-gray-400">
                Use arrows to navigate • Click card to flip
            </div>
        </div>
    );
}

export default FlashcardsViewer;
