import React, { useState, useEffect } from 'react';
import { questionAPI } from '../../services/api';
import { FiEdit2, FiCheck, FiTrash2, FiMessageCircle, FiClock, FiSend } from 'react-icons/fi';
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
    <div className="min-h-screen bg-gray-50">
      <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />
      <ConfirmModal isOpen={confirmModal.isOpen} onClose={closeConfirmModal} onConfirm={confirmModal.onConfirm} title={confirmModal.title} message={confirmModal.message} type={confirmModal.type} confirmText={confirmModal.confirmText} loading={actionLoading} />

      {/* Hero */}
      <section className="relative py-12 overflow-hidden" style={{ backgroundImage: 'url(/assets/images/doctors-bg.jpeg)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 to-purple-900/80"></div>
        <div className="relative z-10 container mx-auto px-6">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">👨‍⚕️ Patient Questions</h1>
          <p className="text-white/70">{unanswered.length} pending • {answered.length} answered</p>
        </div>
      </section>

      <div className="container mx-auto px-6 py-8">
        {loading ? (
          <div className="flex justify-center py-20"><div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div></div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Unanswered */}
            <div>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><FiClock className="text-yellow-500" /> Pending Questions <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-sm">{unanswered.length}</span></h2>
              {unanswered.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 text-center shadow-lg"><FiMessageCircle className="mx-auto mb-4 text-gray-300" size={48} /><p className="text-gray-500">No pending questions</p></div>
              ) : (
                <div className="space-y-4">
                  {unanswered.map((q, i) => (
                    <div key={q.id} onClick={() => setSelectedQuestion(q)}
                      className={`bg-white rounded-2xl shadow-lg p-5 cursor-pointer hover:shadow-xl transition-all border-l-4 border-yellow-400 ${selectedQuestion?.id === q.id ? 'ring-2 ring-blue-500' : ''}`}
                      style={{ animationDelay: `${i * 0.1}s` }}>
                      <h3 className="font-bold text-lg text-gray-800 mb-2">{q.title}</h3>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{q.question_text}</p>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span className="text-blue-600 font-semibold">Patient: {q.customer_name}</span>
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
                <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-24">
                  <h2 className="text-xl font-bold mb-4">Answer Question</h2>
                  <div className="bg-blue-50 p-4 rounded-xl mb-4 border border-blue-100">
                    <h3 className="font-bold text-gray-800 mb-2">{selectedQuestion.title}</h3>
                    <p className="text-gray-700 mb-2">{selectedQuestion.question_text}</p>
                    <p className="text-sm text-blue-600 font-semibold">Patient: {selectedQuestion.customer_name}</p>
                  </div>
                  <form onSubmit={handleSubmitAnswer}>
                    <label className="block font-semibold mb-2">Your Answer:</label>
                    <textarea className="w-full p-4 border rounded-xl resize-none mb-4" rows="5" placeholder="Provide a helpful answer..." value={answer} onChange={(e) => setAnswer(e.target.value)} required />
                    <div className="flex gap-2">
                      <button type="submit" disabled={submitting} className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2">
                        {submitting ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Submitting...</> : <><FiSend /> Submit Answer</>}
                      </button>
                      <button type="button" onClick={() => { setSelectedQuestion(null); setAnswer(''); }} className="px-6 py-3 bg-gray-100 rounded-xl font-semibold">Cancel</button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="bg-gray-100 rounded-2xl p-12 text-center sticky top-24">
                  <FiMessageCircle className="mx-auto mb-4 text-gray-400" size={48} />
                  <p className="text-gray-500">Select a question to answer</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Answered Questions */}
        <div className="mt-12">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><FiCheck className="text-green-500" /> Answered Questions <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-sm">{answered.length}</span></h2>
          {answered.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center shadow-lg text-gray-500">No answered questions</div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {answered.map((q, i) => (
                <div key={q.id} className="bg-white rounded-2xl shadow-lg p-5 border-l-4 border-green-400" style={{ animationDelay: `${i * 0.1}s` }}>
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-gray-800">{q.title}</h3>
                    <button onClick={() => handleDeleteQuestion(q)} className="p-1 text-gray-400 hover:text-red-600 rounded-lg"><FiTrash2 size={16} /></button>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-xl mb-3 text-sm text-gray-600">{q.question_text}</div>
                  <div className="bg-green-50 p-3 rounded-xl border border-green-100">
                    {editingAnswerId === q.id ? (
                      <div>
                        <textarea className="w-full p-3 border rounded-xl mb-2" rows="3" value={editAnswer} onChange={(e) => setEditAnswer(e.target.value)} />
                        <div className="flex gap-2">
                          <button onClick={() => handleUpdateAnswer(q.id)} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium">Update</button>
                          <button onClick={() => setEditingAnswerId(null)} className="px-4 py-2 bg-gray-200 rounded-lg">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-green-700 font-semibold text-sm">Your Answer:</span>
                          <button onClick={() => handleEditAnswer(q)} className="text-blue-600 text-sm flex items-center gap-1"><FiEdit2 size={12} /> Edit</button>
                        </div>
                        <p className="text-gray-700">{q.answer}</p>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Answered {new Date(q.answered_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorQuestions;
