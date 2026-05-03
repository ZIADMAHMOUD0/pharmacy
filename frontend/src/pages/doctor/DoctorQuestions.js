import React, { useState, useEffect } from 'react';
import { questionAPI } from '../../services/api';
import { FiEdit2, FiCheck, FiTrash2, FiMessageCircle, FiClock, FiSend, FiImage, FiX } from 'react-icons/fi';
import ConfirmModal from '../../components/ConfirmModal';
import ToastContainer from '../../components/ToastContainer';
import { useToast } from '../../hooks/useToast';

const DoctorQuestions = () => {
  const [questions, setQuestions] = useState([]);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [answer, setAnswer] = useState('');
  const [editingAnswerId, setEditingAnswerId] = useState(null);
  const [editAnswer, setEditAnswer] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', type: 'danger', onConfirm: () => {} });
  const [actionLoading, setActionLoading] = useState(false);
  const [viewingImage, setViewingImage] = useState(null);
  const toast = useToast();

  useEffect(() => { fetchQuestions(); }, []);

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

  const closeConfirmModal = () => {
    setConfirmModal({ ...confirmModal, isOpen: false });
    setActionLoading(false);
  };

  const handleSubmitAnswer = async (e) => {
    e.preventDefault();
    if (!answer.trim()) { toast.warning('Please enter an answer'); return; }
    setSubmitting(true);
    try {
      await questionAPI.answer(selectedQuestion.id, { answer });
      setSelectedQuestion(null);
      setAnswer('');
      fetchQuestions();
      toast.success('Answer submitted!');
    } catch (error) {
      toast.error('Error submitting answer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditAnswer = (question) => {
    setEditingAnswerId(question.id);
    setEditAnswer(question.answer);
  };

  const handleUpdateAnswer = async (questionId) => {
    if (!editAnswer.trim()) { toast.warning('Please enter an answer'); return; }
    try {
      await questionAPI.answer(questionId, { answer: editAnswer });
      setEditingAnswerId(null);
      setEditAnswer('');
      fetchQuestions();
      toast.success('Answer updated!');
    } catch (error) {
      toast.error('Error updating answer');
    }
  };

  const handleDeleteQuestion = (question) => {
    if (!question.is_answered) {
      toast.warning('You must answer this question before deleting');
      return;
    }
    setConfirmModal({
      isOpen: true, title: 'Delete Question', message: `Delete "${question.title}"? This cannot be undone.`, type: 'danger', confirmText: 'Delete',
      onConfirm: async () => {
        setActionLoading(true);
        try {
          await questionAPI.delete(question.id);
          toast.success('Question deleted!');
          if (selectedQuestion?.id === question.id) { setSelectedQuestion(null); setAnswer(''); }
          fetchQuestions();
        } catch (error) {
          toast.error('Error deleting question');
        } finally {
          closeConfirmModal();
        }
      },
    });
  };

  const unanswered = questions.filter(q => !q.is_answered);
  const answered = questions.filter(q => q.is_answered);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-800">
      <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />
      <ConfirmModal isOpen={confirmModal.isOpen} onClose={closeConfirmModal} onConfirm={confirmModal.onConfirm} title={confirmModal.title} message={confirmModal.message} type={confirmModal.type} confirmText={confirmModal.confirmText} loading={actionLoading} />

      {/* Hero */}
      <section className="relative py-12 overflow-hidden" style={{ backgroundImage: 'url(/assets/images/doctors-bg.jpeg)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-cyan-900/80 to-slate-900"></div>
        <div className="absolute inset-0 pattern-pharmacy opacity-10"></div>
        <div className="relative z-10 container mx-auto px-6">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">👨‍⚕️ Patient Questions</h1>
          <p className="text-white/70">{unanswered.length} pending • {answered.length} answered</p>
        </div>
      </section>

      <div className="container mx-auto px-6 py-8">
        {loading ? (
          <div className="flex justify-center py-20"><div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-500/30 border-t-blue-600 rounded-full animate-spin"></div></div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Unanswered */}
            <div>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><FiClock className="text-yellow-500 dark:text-yellow-400" /> Pending Questions <span className="bg-yellow-100 dark:bg-yellow-500/15 text-yellow-700 dark:text-yellow-300 px-2 py-1 rounded-full text-sm">{unanswered.length}</span></h2>
              {unanswered.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 text-center shadow-lg"><FiMessageCircle className="mx-auto mb-4 text-gray-300 dark:text-slate-600" size={48} /><p className="text-gray-500 dark:text-slate-400">No pending questions</p></div>
              ) : (
                <div className="space-y-4">
                  {unanswered.map((q, i) => (
                    <div key={q.id} onClick={() => setSelectedQuestion(q)}
                      className={`bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-5 cursor-pointer hover:shadow-xl transition-all border-l-4 border-yellow-400 ${selectedQuestion?.id === q.id ? 'ring-2 ring-blue-500' : ''}`}
                      style={{ animationDelay: `${i * 0.1}s` }}>
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-lg text-gray-800 dark:text-slate-100">{q.title}</h3>
                        {q.image_url && (
                          <span className="bg-purple-100 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                            <FiImage size={12} /> Image
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 dark:text-slate-300 text-sm mb-3 line-clamp-2">{q.question_text}</p>
                      <div className="flex justify-between text-xs text-gray-500 dark:text-slate-400">
                        <span className="text-blue-600 dark:text-blue-300 font-semibold">Patient: {q.customer_name}</span>
                        <span>{new Date(q.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Answer Panel */}
            <div>
              {selectedQuestion ? (
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-6 sticky top-24 max-h-[85vh] overflow-y-auto">
                  <h2 className="text-xl font-bold mb-4">Answer Question</h2>
                  <div className="bg-blue-50 dark:bg-blue-500/10 p-4 rounded-xl mb-4 border border-blue-100 dark:border-blue-500/30">
                    <h3 className="font-bold text-gray-800 dark:text-slate-100 mb-2">{selectedQuestion.title}</h3>
                    <p className="text-gray-700 dark:text-slate-200 mb-2">{selectedQuestion.question_text}</p>
                    
                    {/* Display attached image */}
                    {selectedQuestion.image_url && (
                      <div className="mt-3 mb-2">
                        <p className="text-sm text-purple-600 dark:text-purple-300 font-semibold mb-2 flex items-center gap-1">
                          <FiImage size={14} /> Attached Image:
                        </p>
                        <img 
                          src={selectedQuestion.image_url} 
                          alt="Attached" 
                          className="max-h-60 rounded-xl border border-blue-200 dark:border-blue-500/30 shadow-sm cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => setViewingImage(selectedQuestion.image_url)}
                        />
                      </div>
                    )}
                    
                    <p className="text-sm text-blue-600 dark:text-blue-300 font-semibold">Patient: {selectedQuestion.customer_name}</p>
                  </div>
                  <form onSubmit={handleSubmitAnswer}>
                    <label className="block font-semibold mb-2">Your Answer:</label>
                    <textarea className="w-full p-4 border rounded-xl resize-none mb-4" rows="5" placeholder="Provide a helpful answer..." value={answer} onChange={(e) => setAnswer(e.target.value)} required />
                    <div className="flex gap-2">
                      <button type="submit" disabled={submitting} className="flex-1 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2">
                        {submitting ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Submitting...</> : <><FiSend /> Submit Answer</>}
                      </button>
                      <button type="button" onClick={() => { setSelectedQuestion(null); setAnswer(''); }} className="px-6 py-3 bg-gray-100 dark:bg-slate-800 rounded-xl font-semibold">Cancel</button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="bg-gray-100 dark:bg-slate-800 rounded-2xl p-12 text-center sticky top-24">
                  <FiMessageCircle className="mx-auto mb-4 text-gray-400 dark:text-slate-500" size={48} />
                  <p className="text-gray-500 dark:text-slate-400">Select a question to answer</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Answered Questions */}
        <div className="mt-12">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><FiCheck className="text-green-500 dark:text-green-400" /> Answered Questions <span className="bg-green-100 dark:bg-green-500/15 text-green-700 dark:text-green-300 px-2 py-1 rounded-full text-sm">{answered.length}</span></h2>
          {answered.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 text-center shadow-lg text-gray-500 dark:text-slate-400">No answered questions</div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {answered.map((q, i) => (
                <div key={q.id} className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-5 border-l-4 border-green-400" style={{ animationDelay: `${i * 0.1}s` }}>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-gray-800 dark:text-slate-100">{q.title}</h3>
                      {q.image_url && (
                        <span className="bg-purple-100 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1">
                          <FiImage size={10} />
                        </span>
                      )}
                    </div>
                    <button onClick={() => handleDeleteQuestion(q)} className="p-1 text-gray-400 dark:text-slate-500 hover:text-red-600 dark:text-red-300 rounded-lg"><FiTrash2 size={16} /></button>
                  </div>
                  <div className="bg-gray-50 dark:bg-slate-800 p-3 rounded-xl mb-3 text-sm text-gray-600 dark:text-slate-300">
                    {q.question_text}
                    {q.image_url && (
                      <img 
                        src={q.image_url} 
                        alt="Attached" 
                        className="mt-2 max-h-32 rounded-lg cursor-pointer hover:opacity-90"
                        onClick={() => setViewingImage(q.image_url)}
                      />
                    )}
                  </div>
                  <div className="bg-green-50 dark:bg-green-500/10 p-3 rounded-xl border border-green-100 dark:border-green-500/30">
                    {editingAnswerId === q.id ? (
                      <div>
                        <textarea className="w-full p-3 border rounded-xl mb-2" rows="3" value={editAnswer} onChange={(e) => setEditAnswer(e.target.value)} />
                        <div className="flex gap-2">
                          <button onClick={() => handleUpdateAnswer(q.id)} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium">Update</button>
                          <button onClick={() => setEditingAnswerId(null)} className="px-4 py-2 bg-gray-200 dark:bg-slate-700 rounded-lg">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-green-700 dark:text-green-300 font-semibold text-sm">Your Answer:</span>
                          <button onClick={() => handleEditAnswer(q)} className="text-blue-600 dark:text-blue-300 text-sm flex items-center gap-1"><FiEdit2 size={12} /> Edit</button>
                        </div>
                        <p className="text-gray-700 dark:text-slate-200">{q.answer}</p>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 dark:text-slate-500 mt-2">Answered {new Date(q.answered_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Image Viewer Modal */}
      {viewingImage && (
        <div 
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-[100] p-4"
          onClick={() => setViewingImage(null)}
        >
          <button 
            className="absolute top-4 right-4 text-white hover:text-gray-300 dark:text-slate-600 p-2"
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

export default DoctorQuestions;
