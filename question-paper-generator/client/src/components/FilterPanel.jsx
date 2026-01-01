import React, { useMemo } from 'react';
import { Search, X, Plus } from 'lucide-react';
import { useProfile } from '../App';

const FilterPanel = ({ filters, onFilterChange, onClearFilters, openCreateModal }) => {
  const { profile } = useProfile();

  // Define base subjects
  const allSubjects = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English'];

  // Logic to filter subjects based on exam/category
  const visibleSubjects = useMemo(() => {
    // Determine exam from profile (if student) or filter (if teacher selecting manually)
    // Actually, for teacher, we might want to respect their selected 'Target Exam' if they set one, 
    // OR if they selected 'Competition' category. 
    // User requirement: "For Teacher... subjects will be removed... respective to there EXAMS"

    let targetExam = profile?.target_exam;

    // If usage context implies we should look at current filter selection for teacher?
    // User said "Show questions the user of only his grade or exam". 
    // For student this is fixed in profile. For teacher, they might want to toggle?
    // User said "For Teacher... subjects will be removed for teacher as well in the competition category respective to there EXAMS"
    // This implies if a teacher is a "JEE Teacher", they see JEE subjects.

    // Let's use profile.target_exam as primary source for 'Competition' category users.
    if (profile?.category === 'competition' || filters.category === 'competition') {
      const exam = profile?.target_exam || filters.exam; // Fallback to filter if profile not set (though user said remove others)

      if (exam === 'JEE') {
        return ['Mathematics', 'Physics', 'Chemistry'];
      }
      if (exam === 'NEET') {
        return ['Biology', 'Physics', 'Chemistry'];
      }
      // NDA and Others: keep all
    }
    return allSubjects;
  }, [profile, filters.category, filters.exam]);

  const classes = ['8', '9', '10', '11', '12'];
  const difficulties = ['EASY', 'MEDIUM', 'HARD'];
  const types = ['MCQ', 'LONG', 'TRUE_FALSE', 'FILL_BLANK'];
  const sources = ['JEE 2022', 'JEE Main 2022', 'CBSE 2023', 'Board Exam', 'Board Exam 2023', 'NCERT', 'Sample', 'Sample Paper', 'Practice', 'Practice Set', 'Quick Quiz', 'Quick Test', 'Chemistry Test', 'Grammar Test', 'Science Quiz', 'Physics Quiz', 'Chemistry Practical', 'Class Test'];

  const isStudent = profile?.role === 'student';

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">Filters</h2>
        <div className="flex items-center gap-4">
          <button
            onClick={onClearFilters}
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800"
          >
            <X size={16} />
            Clear All
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Search Questions
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search in question text..."
            value={filters.search || ''}
            onChange={(e) => onFilterChange('search', e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Subject Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Subject
          </label>
          <select
            value={filters.subject || ''}
            onChange={(e) => onFilterChange('subject', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">All Subjects</option>
            {visibleSubjects.map((subject) => (
              <option key={subject} value={subject}>
                {subject}
              </option>
            ))}
          </select>
        </div>

        {/* Dynamic Filters based on Category - HIDDEN FOR STUDENTS as per requirement */}
        {!isStudent && filters.category === 'school' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Grade
            </label>
            <select
              value={filters.grade || ''}
              onChange={(e) => onFilterChange('grade', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Grades</option>
              {['12th', '11th', '10th', '9th', '8th', '7th', '6th', '5th', '4th', '3rd', '2nd', '1st']
                .filter(grade => !profile?.selected_grades?.length || profile.selected_grades.includes(grade))
                .map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
            </select>
          </div>
        )}

        {!isStudent && filters.category === 'college' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Year
            </label>
            <select
              value={filters.year || ''}
              onChange={(e) => onFilterChange('year', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Years</option>
              {['1st Year', '2nd Year', '3rd Year', '4th Year']
                .filter(year => !profile?.selected_years?.length || profile.selected_years.includes(year))
                .map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
            </select>
          </div>
        )}

        {!isStudent && filters.category === 'competition' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Exam
            </label>
            <select
              value={filters.exam || ''}
              onChange={(e) => onFilterChange('exam', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Exams</option>
              {['JEE', 'NEET', 'NDA', 'Other']
                // For teachers, relying on manual selection mostly, but if they have target_exam set we could restrict? 
                // Usually teachers teach specific exams. But model has target_exam as string.
                // If we want to support multi-exam for teachers, we'd need list. 
                // For now assuming target_exam is single or we don't restrict strictly unless requested.
                // User said "classes, years he has selected". Didn't explicitly say exams, but implied.
                // Let's safe filter if target_exam is present, but it's single string in profile model currently?
                // Actually profile model has target_exam: str.
                // So let's leave exam unrestricted or restrict to single if set.
                .map((e) => (
                  <option key={e} value={e}>{e}</option>
                ))}
            </select>
          </div>
        )}

        {/* Existing Filters - Hide Class if School Category is selected to avoid confusion */}
        {/* Also hide for students if they are restricted */}
        {filters.category !== 'school' && !isStudent && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Class (Legacy)
            </label>
            <select
              value={filters.class_grade || ''}
              onChange={(e) => onFilterChange('class_grade', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Classes</option>
              {classes.map((cls) => (
                <option key={cls} value={cls}>
                  Class {cls}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Difficulty Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Difficulty
          </label>
          <select
            value={filters.difficulty || ''}
            onChange={(e) => onFilterChange('difficulty', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">All Levels</option>
            {difficulties.map((diff) => (
              <option key={diff} value={diff}>
                {diff}
              </option>
            ))}
          </select>
        </div>

        {/* Type Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Question Type
          </label>
          <select
            value={filters.question_type || ''}
            onChange={(e) => onFilterChange('question_type', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">All Types</option>
            {types.map((type) => (
              <option key={type} value={type}>
                {type.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>
        {/* Source Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Source
          </label>
          <select
            value={filters.source || ''}
            onChange={(e) => onFilterChange('source', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">All Sources</option>
            {sources.map((source) => (
              <option key={source} value={source}>
                {source}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;