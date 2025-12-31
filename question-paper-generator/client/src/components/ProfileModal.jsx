import React, { useState, useEffect } from 'react';
import { X, User, Save, LogOut } from 'lucide-react';
import { useProfile } from '../App';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

export default function ProfileModal({ isOpen, onClose }) {
    const { profile, setProfile } = useProfile();
    const { user, signOut } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({});

    useEffect(() => {
        if (isOpen && profile) {
            setFormData({
                role: profile.role || '',
                // full_name is not in the model yet, but users asked for name. 
                // We'll fallback to meta or just not show it if not supported backend yet.
                // Assuming we rely on what's in profile.
                category: profile.category || '',
                // Ensure arrays are initialized
                selected_grades: profile.selected_grades || [],
                selected_years: profile.selected_years || [],
                target_exam: profile.target_exam || '',
            });
        }
    }, [isOpen, profile]);

    if (!isOpen) return null;

    const handleSave = async () => {
        setLoading(true);
        try {
            const response = await api.put('/profile/me', formData);
            setProfile(response.data);
            setIsEditing(false);
        } catch (error) {
            console.error('Failed to update profile:', error);
            alert('Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        signOut();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-xl font-bold text-gray-900">My Profile</h2>
                    <button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="flex flex-col items-center">
                        <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 mb-4">
                            <User size={48} />
                        </div>
                        <p className="text-gray-500 text-sm">{user?.email}</p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                            {isEditing ? (
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    className="w-full p-2 border rounded-lg capitalize"
                                >
                                    <option value="" disabled>Select Role</option>
                                    <option value="student">Student</option>
                                    <option value="teacher">Teacher</option>
                                </select>
                            ) : (
                                <div className="p-3 bg-gray-50 rounded-lg text-gray-700 capitalize">
                                    {profile?.role}
                                </div>
                            )}
                        </div>

                        {/* Editable Fields */}
                        {isEditing ? (
                            <>
                                {/* Category Field */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => {
                                            const newCategory = e.target.value;
                                            setFormData({
                                                ...formData,
                                                category: newCategory,
                                                selected_grades: [],
                                                selected_years: [],
                                                target_exam: ''
                                            });
                                        }}
                                        className="w-full p-2 border rounded-lg capitalize"
                                    >
                                        <option value="" disabled>Select Category</option>
                                        <option value="school">School</option>
                                        <option value="college">College</option>
                                        <option value="competition">Competition</option>
                                    </select>
                                </div>

                                {/* Logic for Grades/Years/Exams based on current category */}
                                {formData.category === 'school' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            {formData.role === 'teacher' ? 'Grades Taught' : 'Grade'}
                                        </label>
                                        {/* Simplified selection for edit mode - logic similar to Onboarding but compact */}
                                        {formData.role === 'student' ? (
                                            <select
                                                value={formData.selected_grades?.[0] || ''}
                                                onChange={(e) => setFormData({ ...formData, selected_grades: [e.target.value] })}
                                                className="w-full p-2 border rounded-lg"
                                            >
                                                <option value="" disabled>Select Grade</option>
                                                {['12th', '11th', '10th', '9th', '8th', '7th', '6th', '5th', '4th', '3rd', '2nd', '1st'].map(g => (
                                                    <option key={g} value={g}>{g}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <div className="flex flex-wrap gap-2">
                                                {['12th', '11th', '10th', '9th', '8th'].map(g => { // showing top 5 for brevity or all?
                                                    const isSel = formData.selected_grades?.includes(g);
                                                    return (
                                                        <button
                                                            key={g}
                                                            onClick={() => {
                                                                const newGrades = isSel
                                                                    ? formData.selected_grades.filter(x => x !== g)
                                                                    : [...(formData.selected_grades || []), g];
                                                                setFormData({ ...formData, selected_grades: newGrades });
                                                            }}
                                                            className={`px-3 py-1 rounded-full text-xs border ${isSel ? 'bg-indigo-100 border-indigo-500 text-indigo-700' : 'bg-white'}`}
                                                        >
                                                            {g}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {formData.category === 'college' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            {formData.role === 'teacher' ? 'Years Taught' : 'Year'}
                                        </label>
                                        {formData.role === 'student' ? (
                                            <select
                                                value={formData.selected_years?.[0] || ''}
                                                onChange={(e) => setFormData({ ...formData, selected_years: [e.target.value] })}
                                                className="w-full p-2 border rounded-lg"
                                            >
                                                <option value="" disabled>Select Year</option>
                                                {['1st Year', '2nd Year', '3rd Year', '4th Year'].map(y => (
                                                    <option key={y} value={y}>{y}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <div className="flex flex-wrap gap-2">
                                                {['1st Year', '2nd Year', '3rd Year', '4th Year'].map(y => {
                                                    const isSel = formData.selected_years?.includes(y);
                                                    return (
                                                        <button
                                                            key={y}
                                                            onClick={() => {
                                                                const newYears = isSel
                                                                    ? formData.selected_years.filter(x => x !== y)
                                                                    : [...(formData.selected_years || []), y];
                                                                setFormData({ ...formData, selected_years: newYears });
                                                            }}
                                                            className={`px-3 py-1 rounded-full text-xs border ${isSel ? 'bg-indigo-100 border-indigo-500 text-indigo-700' : 'bg-white'}`}
                                                        >
                                                            {y}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {formData.category === 'competition' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Target Exam</label>
                                        <select
                                            value={formData.target_exam || ''}
                                            onChange={(e) => setFormData({ ...formData, target_exam: e.target.value })}
                                            className="w-full p-2 border rounded-lg"
                                        >
                                            <option value="" disabled>Select Exam</option>
                                            {['JEE', 'NEET', 'NDA', 'Other'].map(e => (
                                                <option key={e} value={e}>{e}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </>
                        ) : (
                            // View Mode
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                    <div className="p-3 bg-gray-50 rounded-lg text-gray-700 capitalize">
                                        {profile?.category}
                                    </div>
                                </div>

                                {profile?.category === 'school' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            {profile.role === 'teacher' ? 'Grades' : 'Grade'}
                                        </label>
                                        <div className="p-3 bg-gray-50 rounded-lg text-gray-700">
                                            {profile.selected_grades?.join(', ') || 'Not selected'}
                                        </div>
                                    </div>
                                )}
                                {profile?.category === 'college' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            {profile.role === 'teacher' ? 'Years' : 'Year'}
                                        </label>
                                        <div className="p-3 bg-gray-50 rounded-lg text-gray-700">
                                            {profile.selected_years?.join(', ') || 'Not selected'}
                                        </div>
                                    </div>
                                )}
                                {profile?.category === 'competition' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Target Exam</label>
                                        <div className="p-3 bg-gray-50 rounded-lg text-gray-700">
                                            {profile.target_exam || 'Not selected'}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t bg-gray-50 flex flex-col gap-3">
                    {isEditing ? (
                        <div className="flex gap-2">
                            <button
                                onClick={() => setIsEditing(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={loading}
                                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2"
                            >
                                {loading ? 'Saving...' : <><Save size={18} /> Save Changes</>}
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="w-full px-4 py-2 border border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 font-medium"
                        >
                            Edit Profile
                        </button>
                    )}

                    <button
                        onClick={handleLogout}
                        className="w-full px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg flex items-center justify-center gap-2"
                    >
                        <LogOut size={18} />
                        Log Out
                    </button>
                </div>
            </div>
        </div>
    );
}
