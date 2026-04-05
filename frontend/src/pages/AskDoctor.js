import React, { useState, useEffect, useRef, useCallback } from 'react';
import { questionAPI } from '../services/api';
import { FiSend, FiEdit2, FiTrash2, FiMessageCircle, FiClock, FiCheckCircle, FiX, FiHelpCircle, FiUser, FiImage, FiCamera } from 'react-icons/fi';
import ConfirmModal from '../components/ConfirmModal';
import ToastContainer from '../components/ToastContainer';
import { useToast } from '../hooks/useToast';

const AskDoctor = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newQuestion, setNewQuestion] = useState({ title: '', question_text: '' });
  const [submitting, setSubmitting] = useState(false);
  
  // Image upload state
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  
  // Image viewer modal
  const [viewingImage, setViewingImage] = useState(null);
  
  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', question_text: '' });
  const [editImage, setEditImage] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState(null);
  const [removeExistingImage, setRemoveExistingImage] = useState(false);
  const editFileInputRef = useRef(null);
  
  // Confirm modal state
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  const [actionLoading, setActionLoading] = useState(false);
  
  const toast = useToast();
  const toastRef = useRef(toast);
  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

  const fetchQuestions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await questionAPI.getAll();
      setQuestions(response.data);
    } catch (error) {
      // Use ref to avoid changing dependencies causing re-renders
      toastRef.current?.error('Failed to load questions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  // Handle image selection
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        toast.error('Please select a valid image (JPEG, PNG, or WebP)');
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }
      
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
      
      // Use FormData if there's an image
      if (selectedImage) {
        const formData = new FormData();
        formData.append('title', newQuestion.title);
        formData.append('question_text', newQuestion.question_text);
        formData.append('image', selectedImage);
        await questionAPI.create(formData);
      } else {
        await questionAPI.create(newQuestion);
      }
      
      setNewQuestion({ title: '', question_text: '' });
      removeImage();
      fetchQuestions();
      toast.success('Question submitted successfully! A doctor will answer soon.');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error submitting question');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle edit image selection
  const handleEditImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        toast.error('Please select a valid image (JPEG, PNG, or WebP)');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }
      
      setEditImage(file);
      setRemoveExistingImage(false);
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeEditImage = () => {
    setEditImage(null);
    setEditImagePreview(null);
    setRemoveExistingImage(true);
    if (editFileInputRef.current) {
      editFileInputRef.current.value = '';
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
    setEditImage(null);
    setEditImagePreview(question.image_url || null);
    setRemoveExistingImage(false);
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
      
      // Use FormData if there's a new image or removing existing image
      if (editImage || removeExistingImage) {
        const formData = new FormData();
        formData.append('title', editForm.title);
        formData.append('question_text', editForm.question_text);
        if (editImage) {
          formData.append('image', editImage);
        } else if (removeExistingImage) {
          formData.append('image', ''); // Send empty to remove
        }
        await questionAPI.update(editingQuestion.id, formData);
      } else {
        await questionAPI.update(editingQuestion.id, editForm);
      }
      
      toast.success('Question updated successfully!');
      setShowEditModal(false);
      setEditingQuestion(null);
      setEditImage(null);
      setEditImagePreview(null);
      setRemoveExistingImage(false);
      fetchQuestions();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error updating question');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle delete
  const handleDelete = (question) => {
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
            
            {/* Image Upload Section */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Attach Image (Optional)
              </label>
              <p className="text-xs text-gray-500 mb-2">
                📷 You can attach a prescription, photo of symptoms, or any relevant image
              </p>
              
              {imagePreview ? (
                <div className="relative inline-block">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="max-h-40 rounded-xl border border-gray-200 shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 shadow-lg"
                  >
                    <FiX size={14} />
                  </button>
                </div>
              ) : (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-green-400 hover:bg-green-50/50 transition-all"
                >
                  <FiCamera className="mx-auto text-gray-400 mb-2" size={32} />
                  <p className="text-gray-500 text-sm">Click to upload an image</p>
                  <p className="text-gray-400 text-xs mt-1">JPEG, PNG, WebP (max 5MB)</p>
                </div>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/jpg,image/webp"
                onChange={handleImageSelect}
                className="hidden"
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
                      
                      {/* Display attached image */}
                      {q.image_url && (
                        <div className="mb-3">
                          <p className="text-sm text-gray-500 mb-2 flex items-center gap-1">
                            <FiImage size={14} /> Attached Image:
                          </p>
                          <img 
                            src={q.image_url} 
                            alt="Attached" 
                            className="max-h-48 rounded-xl border border-gray-200 shadow-sm cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => setViewingImage(q.image_url)}
                          />
                        </div>
                      )}
                      
                      <p className="text-sm text-gray-400 flex items-center gap-1">
                        <FiClock size={14} /> Asked on {new Date(q.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    
                    {/* Action buttons: Edit only for unanswered, Delete always (history cleanup) */}
                    <div className="flex gap-2">
                      {!q.is_answered && (
                        <button
                          onClick={() => openEditModal(q)}
                          className="p-2 text-teal-600 hover:bg-teal-100 rounded-lg transition-all"
                          title="Edit Question"
                        >
                          <FiEdit2 size={18} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(q)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-all"
                        title="Delete Question"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </div>
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl animate-scale-in my-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Edit Question</h2>
              <button 
                onClick={() => { setShowEditModal(false); setEditingQuestion(null); setEditImage(null); setEditImagePreview(null); }} 
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
              
              {/* Edit Image Section */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Attached Image
                </label>
                
                {editImagePreview && !removeExistingImage ? (
                  <div className="relative inline-block">
                    <img 
                      src={editImagePreview} 
                      alt="Preview" 
                      className="max-h-40 rounded-xl border border-gray-200 shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={removeEditImage}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 shadow-lg"
                      title="Remove image"
                    >
                      <FiX size={14} />
                    </button>
                  </div>
                ) : (
                  <div 
                    onClick={() => editFileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center cursor-pointer hover:border-green-400 hover:bg-green-50/50 transition-all"
                  >
                    <FiCamera className="mx-auto text-gray-400 mb-2" size={24} />
                    <p className="text-gray-500 text-sm">Click to upload an image</p>
                    <p className="text-gray-400 text-xs mt-1">JPEG, PNG, WebP (max 5MB)</p>
                  </div>
                )}
                
                <input
                  ref={editFileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/jpg,image/webp"
                  onChange={handleEditImageSelect}
                  className="hidden"
                />
                
                {editImagePreview && !removeExistingImage && (
                  <button
                    type="button"
                    onClick={() => editFileInputRef.current?.click()}
                    className="mt-2 text-sm text-teal-600 hover:text-teal-700 flex items-center gap-1"
                  >
                    <FiCamera size={14} /> Change image
                  </button>
                )}
              </div>
              
              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => { setShowEditModal(false); setEditingQuestion(null); setEditImage(null); setEditImagePreview(null); }} 
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

      {/* Image Viewer Modal */}
      {viewingImage && (
        <div 
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-[100] p-4"
          onClick={() => setViewingImage(null)}
        >
          <button 
            className="absolute top-4 right-4 text-white hover:text-gray-300 p-2"
            onClick={() => setViewingImage(null)}
          >
            <FiX size={32} />
          </button>
          <img 
            src={viewingImage} 
            alt="Full size" 
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default AskDoctor;