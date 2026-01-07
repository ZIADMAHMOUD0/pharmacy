import React, { useState, useEffect } from 'react';
import { questionAPI } from '../services/api';
import { FiSend, FiEdit2, FiTrash2, FiMessageCircle, FiClock, FiCheckCircle, FiX, FiHelpCircle, FiUser } from 'react-icons/fi';
import ConfirmModal from '../components/ConfirmModal';
import ToastContainer from '../components/ToastContainer';
import { useToast } from '../hooks/useToast';

const AskDoctor = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newQuestion, setNewQuestion] = useState({ title: '', question_text: '' });
  const [submitting, setSubmitting] = useState(false);
  
  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', question_text: '' });
  
  // Confirm modal state
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  const [actionLoading, setActionLoading] = useState(false);
  
  const toast = useToast();

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const response = await questionAPI.getAll();
      setQuestions(response.data);
    } catch (error) {
      toast.error('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newQuestion.title.trim() || !newQuestion.question_text.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    
    try {
      setSubmitting(true);
      await questionAPI.create(newQuestion);
      setNewQuestion({ title: '', question_text: '' });
      fetchQuestions();
      toast.success('Question submitted successfully! A doctor will answer soon.');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error submitting question');
    } finally {
      setSubmitting(false);
    }
  };

  // Open edit modal
  const openEditModal = (question) => {
    if (question.is_answered) {
      toast.warning('Cannot edit an answered question');
      return;
    }
    setEditingQuestion(question);
    setEditForm({ title: question.title, question_text: question.question_text });
    setShowEditModal(true);
  };

  // Handle edit submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editForm.title.trim() || !editForm.question_text.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    
    try {
      setActionLoading(true);
      await questionAPI.update(editingQuestion.id, editForm);
      toast.success('Question updated successfully!');
      setShowEditModal(false);
      setEditingQuestion(null);
      fetchQuestions();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error updating question');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle delete
  const handleDelete = (question) => {
    if (question.is_answered) {
      toast.warning('Cannot delete an answered question');
      return;
    }
    
    setConfirmModal({
      isOpen: true,
      title: 'Delete Question',
      message: `Are you sure you want to delete "${question.title}"? This action cannot be undone.`,
      type: 'danger',
      confirmText: 'Delete',
      onConfirm: async () => {
        setActionLoading(true);
        try {
          await questionAPI.delete(question.id);
          toast.success('Question deleted successfully!');
          fetchQuestions();
        } catch (error) {
          toast.error('Error deleting question');
        } finally {
          setActionLoading(false);
          setConfirmModal({ ...confirmModal, isOpen: false });
        }
      },
    });
  };

  const pendingCount = questions.filter(q => !q.is_answered).length;
  const answeredCount = questions.filter(q => q.is_answered).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />
      <ConfirmModal 
        isOpen={confirmModal.isOpen} 
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })} 
        onConfirm={confirmModal.onConfirm} 
        title={confirmModal.title} 
        message={confirmModal.message} 
        type={confirmModal.type} 
        confirmText={confirmModal.confirmText} 
        loading={actionLoading} 
      />

      {/* Hero Section */}
      <section className="relative py-12 overflow-hidden" style={{ backgroundImage: 'url(/assets/images/doctors-bg.jpeg)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="absolute inset-0 bg-gradient-to-r from-green-900/90 to-teal-900/80"></div>
        <div className="relative z-10 container mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <FiHelpCircle className="text-green-300" /> Ask a Doctor
              </h1>
              <p className="text-white/70">Get professional medical advice from our team of doctors</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-white">
              <p className="text-white/70 text-sm">Total Questions</p>
              <p className="text-3xl font-bold">{questions.length}</p>
            </div>
            <div className="bg-yellow-500/20 backdrop-blur-sm rounded-xl p-4 text-white">
              <p className="text-yellow-200 text-sm">Pending</p>
              <p className="text-3xl font-bold text-yellow-300">{pendingCount}</p>
            </div>
            <div className="bg-green-500/20 backdrop-blur-sm rounded-xl p-4 text-white col-span-2 md:col-span-1">
              <p className="text-green-200 text-sm">Answered</p>
              <p className="text-3xl font-bold text-green-300">{answeredCount}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-6 py-8">
        {/* Submit Question Form */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <FiMessageCircle className="text-green-600" /> Submit a New Question
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Question Title *</label>
              <input
                type="text"
                placeholder="e.g., What are the side effects of Ibuprofen?"
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                value={newQuestion.title}
                onChange={(e) => setNewQuestion({ ...newQuestion, title: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Your Question *</label>
              <textarea
                placeholder="Describe your question in detail..."
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                rows="4"
                value={newQuestion.question_text}
                onChange={(e) => setNewQuestion({ ...newQuestion, question_text: e.target.value })}
                required
              />
            </div>
            <button 
              type="submit" 
              disabled={submitting}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <FiSend /> Submit Question
                </>
              )}
            </button>
          </form>
        </div>

        {/* My Questions */}
        <h2 className="text-2xl font-bold text-gray-800 mb-4">My Questions</h2>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
          </div>
        ) : questions.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <FiHelpCircle className="mx-auto mb-4 text-gray-300" size={64} />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No Questions Yet</h3>
            <p className="text-gray-400">Submit your first question above!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((q, index) => (
              <div 
                key={q.id} 
                className="bg-white rounded-2xl shadow-lg overflow-hidden animate-fade-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {/* Question Header */}
                <div className="p-6">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-xl text-gray-800">{q.title}</h3>
                        {q.is_answered ? (
                          <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                            <FiCheckCircle size={14} /> Answered
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-semibold">
                            <FiClock size={14} /> Pending
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 mb-3">{q.question_text}</p>
                      <p className="text-sm text-gray-400 flex items-center gap-1">
                        <FiClock size={14} /> Asked on {new Date(q.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    
                    {/* Edit/Delete buttons - Only show for unanswered questions */}
                    {!q.is_answered && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditModal(q)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-all"
                          title="Edit Question"
                        >
                          <FiEdit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(q)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-all"
                          title="Delete Question"
                        >
                          <FiTrash2 size={18} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Answer Section */}
                {q.is_answered && (
                  <div className="bg-gradient-to-r from-green-50 to-teal-50 p-6 border-t border-green-100">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white">
                        <FiUser size={18} />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-green-800 mb-1">
                          Dr. {q.answered_by_name || 'Doctor'}
                        </p>
                        <p className="text-gray-700 mb-2">{q.answer}</p>
                        <p className="text-sm text-gray-500">
                          Answered on {new Date(q.answered_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl animate-scale-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Edit Question</h2>
              <button 
                onClick={() => { setShowEditModal(false); setEditingQuestion(null); }} 
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <FiX size={20} />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Question Title *</label>
                <input
                  type="text"
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Your Question *</label>
                <textarea
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 resize-none"
                  rows="4"
                  value={editForm.question_text}
                  onChange={(e) => setEditForm({ ...editForm, question_text: e.target.value })}
                  required
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => { setShowEditModal(false); setEditingQuestion(null); }} 
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={actionLoading}
                  className="flex-1 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl font-semibold hover:shadow-lg disabled:opacity-50"
                >
                  {actionLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AskDoctor;