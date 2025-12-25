import api from './api';

const teacherService = {
    // Papers
    createPaper: async (title, category, totalMarks, durationMinutes, instructions, questions) => {
        const response = await api.post('/teacher/papers', {
            title,
            category,
            total_marks: totalMarks,
            duration_minutes: durationMinutes,
            instructions,
            questions
        });
        return response.data;
    },

    getPapers: async () => {
        const response = await api.get('/teacher/papers');
        return response.data;
    }
};

export default teacherService;
