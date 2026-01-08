import React, { useState, useEffect } from 'react';
import { medicalProfileAPI, medicalNoteAPI, userAPI } from '../../services/api';
import { 
  FiSearch, FiUser, FiHeart, FiAlertTriangle, FiActivity, FiPackage, 
  FiFileText, FiPlus, FiX, FiDroplet, FiPhone, FiEdit2, FiTrash2
} from 'react-icons/fi';
import ToastContainer from '../../components/ToastContainer';
import ConfirmModal from '../../components/ConfirmModal';
import { useToast } from '../../hooks/useToast';

const PatientMedicalRecords = () => {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientHistory, setPatientHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [noteForm, setNoteForm] = useState({
    note_type: 'general', title: '', content: '', is_private: false
  });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  const [actionLoading, setActionLoading] = useState(false);
  
  const toast = useToast();

  useEffect(() => { fetchPatients(); }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getAllUsers();
      const customerPatients = response.data.filter(u => u.role === 'customer');
      setPatients(customerPatients);
    } catch (error) {
      toast.error('Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientHistory = async (userId) => {
    try {
      setHistoryLoading(true);
      const response = await medicalProfileAPI.getPatientHistory(userId);
      setPatientHistory(response.data);
    } catch (error) {
      console.error('Error fetching patient history:', error);
      setPatientHistory({ 
        blood_type: '',
        allergies: [], 
        chronic_conditions: [], 
        current_medications: [], 
        medical_notes: [] 
      });
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSelectPatient = (patient) => {
    setSelectedPatient(patient);
    setPatientHistory(null);
    fetchPatientHistory(patient.id);
  };

  // Add Note
  const handleAddNote = async (e) => {
    e.preventDefault();
    try {
      await medicalNoteAPI.create({
        patient: selectedPatient.id,
        ...noteForm
      });
      toast.success('Note added successfully!');
      closeNoteModal();
      fetchPatientHistory(selectedPatient.id);
    } catch (error) {
      toast.error('Error adding note');
    }
  };

  // Edit Note
  const handleEditNote = (note) => {
    setEditingNote(note);
    setNoteForm({
      note_type: note.note_type,
      title: note.title,
      content: note.content,
      is_private: note.is_private
    });
    setShowNoteModal(true);
  };

  const handleUpdateNote = async (e) => {
    e.preventDefault();
    try {
      await medicalNoteAPI.update(editingNote.id, noteForm);
      toast.success('Note updated successfully!');
      closeNoteModal();
      fetchPatientHistory(selectedPatient.id);
    } catch (error) {
      toast.error('Error updating note');
    }
  };

  // Delete Note
  const handleDeleteNote = (note) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Note',
      message: `Are you sure you want to delete "${note.title}"? This action cannot be undone.`,
      type: 'danger',
      confirmText: 'Delete',
      onConfirm: async () => {
        setActionLoading(true);
        try {
          await medicalNoteAPI.delete(note.id);
          toast.success('Note deleted successfully!');
          fetchPatientHistory(selectedPatient.id);
        } catch (error) {
          toast.error('Error deleting note');
        } finally {
          setActionLoading(false);
          setConfirmModal({ ...confirmModal, isOpen: false });
        }
      }
    });
  };

  const closeNoteModal = () => {
    setShowNoteModal(false);
    setEditingNote(null);
    setNoteForm({ note_type: 'general', title: '', content: '', is_private: false });
  };

  const getSeverityColor = (severity) => {
    const colors = {
      mild: 'bg-green-100 text-green-700 border-green-300',
      moderate: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      severe: 'bg-orange-100 text-orange-700 border-orange-300',
      life_threatening: 'bg-red-100 text-red-700 border-red-300'
    };
    return colors[severity] || 'bg-gray-100 text-gray-700';
  };

  const filteredPatients = patients.filter(p => 
    p.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      <section className="relative py-12 overflow-hidden" style={{ background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' }}>
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10 container mx-auto px-6">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <FiHeart className="text-pink-200" /> Patient Medical Records
          </h1>
          <p className="text-white/70">View and manage patient medical histories</p>
        </div>
      </section>

      <div className="container mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Patient List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-4">
              <div className="relative mb-4">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search patients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-xl"
                />
              </div>
              
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  </div>
                ) : filteredPatients.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No patients found</p>
                ) : (
                  filteredPatients.map(patient => (
                    <button
                      key={patient.id}
                      onClick={() => handleSelectPatient(patient)}
                      className={`w-full p-3 rounded-xl text-left transition-all flex items-center gap-3 ${
                        selectedPatient?.id === patient.id 
                          ? 'bg-green-100 border-2 border-green-500' 
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">
                        {patient.first_name?.[0] || patient.username?.[0] || 'P'}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">
                          {patient.first_name} {patient.last_name || patient.username}
                        </p>
                        <p className="text-sm text-gray-500">{patient.email}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Patient Details */}
          <div className="lg:col-span-2">
            {!selectedPatient ? (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <FiUser className="mx-auto mb-4 text-gray-300" size={64} />
                <h3 className="text-xl font-semibold text-gray-600">Select a Patient</h3>
                <p className="text-gray-400">Choose a patient from the list to view their medical history</p>
              </div>
            ) : historyLoading ? (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-500">Loading patient history...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Patient Header */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-500 rounded-xl flex items-center justify-center text-white text-2xl font-bold">
                        {selectedPatient.first_name?.[0] || selectedPatient.username?.[0]}
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-800">
                          {selectedPatient.first_name} {selectedPatient.last_name}
                        </h2>
                        <p className="text-gray-500">{selectedPatient.email}</p>
                        {selectedPatient.phone && (
                          <p className="text-gray-500 flex items-center gap-1">
                            <FiPhone size={14} /> {selectedPatient.phone}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => { setEditingNote(null); setNoteForm({ note_type: 'general', title: '', content: '', is_private: false }); setShowNoteModal(true); }}
                      className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 flex items-center gap-2"
                    >
                      <FiPlus /> Add Note
                    </button>
                  </div>

                  {/* Quick Stats */}
                  {patientHistory && (
                    <div className="grid grid-cols-4 gap-4 mt-6">
                      <div className="bg-gray-50 rounded-xl p-3 text-center">
                        <FiDroplet className="mx-auto text-red-500 mb-1" />
                        <p className="text-xs text-gray-500">Blood Type</p>
                        <p className="font-bold">{patientHistory.blood_type || 'N/A'}</p>
                      </div>
                      <div className="bg-red-50 rounded-xl p-3 text-center">
                        <FiAlertTriangle className="mx-auto text-red-500 mb-1" />
                        <p className="text-xs text-gray-500">Allergies</p>
                        <p className="font-bold text-red-600">{patientHistory.allergies?.length || 0}</p>
                      </div>
                      <div className="bg-yellow-50 rounded-xl p-3 text-center">
                        <FiActivity className="mx-auto text-yellow-600 mb-1" />
                        <p className="text-xs text-gray-500">Conditions</p>
                        <p className="font-bold text-yellow-600">{patientHistory.chronic_conditions?.length || 0}</p>
                      </div>
                      <div className="bg-green-50 rounded-xl p-3 text-center">
                        <FiPackage className="mx-auto text-green-600 mb-1" />
                        <p className="text-xs text-gray-500">Medications</p>
                        <p className="font-bold text-green-600">{patientHistory.current_medications?.length || 0}</p>
                      </div>
                    </div>
                  )}

                  {/* Additional Profile Info */}
                  {patientHistory && (patientHistory.date_of_birth || patientHistory.weight || patientHistory.height) && (
                    <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
                      {patientHistory.date_of_birth && (
                        <div>
                          <p className="text-xs text-gray-500">Date of Birth</p>
                          <p className="font-semibold">{patientHistory.date_of_birth}</p>
                          {patientHistory.age && <p className="text-sm text-gray-500">({patientHistory.age} years old)</p>}
                        </div>
                      )}
                      {patientHistory.weight && (
                        <div>
                          <p className="text-xs text-gray-500">Weight</p>
                          <p className="font-semibold">{patientHistory.weight} kg</p>
                        </div>
                      )}
                      {patientHistory.height && (
                        <div>
                          <p className="text-xs text-gray-500">Height</p>
                          <p className="font-semibold">{patientHistory.height} cm</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Emergency Contact */}
                  {patientHistory && patientHistory.emergency_contact_name && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-xs text-gray-500">Emergency Contact</p>
                      <p className="font-semibold">{patientHistory.emergency_contact_name} - {patientHistory.emergency_contact_phone}</p>
                    </div>
                  )}
                </div>

                {/* Allergies Warning */}
                {patientHistory?.allergies?.length > 0 && (
                  <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4">
                    <h3 className="font-bold text-red-800 flex items-center gap-2 mb-3">
                      <FiAlertTriangle /> ⚠️ Patient Allergies
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {patientHistory.allergies.map(allergy => (
                        <span key={allergy.id} className={`px-3 py-1 rounded-full text-sm font-medium border ${getSeverityColor(allergy.severity)}`}>
                          {allergy.allergen} ({allergy.severity_display || allergy.severity})
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Chronic Conditions */}
                {patientHistory?.chronic_conditions?.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-lg p-6">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
                      <FiActivity className="text-yellow-500" /> Chronic Conditions
                    </h3>
                    <div className="space-y-3">
                      {patientHistory.chronic_conditions.map(condition => (
                        <div key={condition.id} className="bg-yellow-50 rounded-xl p-3">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-gray-800">{condition.condition_name}</span>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              condition.status === 'active' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                            }`}>
                              {condition.status_display || condition.status}
                            </span>
                          </div>
                          {condition.notes && <p className="text-sm text-gray-600 mt-1">{condition.notes}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Current Medications */}
                {patientHistory?.current_medications?.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-lg p-6">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
                      <FiPackage className="text-green-500" /> Current Medications
                    </h3>
                    <div className="grid md:grid-cols-2 gap-3">
                      {patientHistory.current_medications.map(med => (
                        <div key={med.id} className="bg-green-50 rounded-xl p-3">
                          <p className="font-semibold text-gray-800">{med.medication_name}</p>
                          <p className="text-blue-600">{med.dosage} - {med.frequency_display || med.frequency}</p>
                          {med.reason && <p className="text-sm text-gray-500">For: {med.reason}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Medical Notes - WITH EDIT/DELETE */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
                    <FiFileText className="text-purple-500" /> Medical Notes
                  </h3>
                  {patientHistory?.medical_notes?.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No notes yet</p>
                  ) : (
                    <div className="space-y-3">
                      {patientHistory?.medical_notes?.map(note => (
                        <div key={note.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold text-gray-800">{note.title}</h4>
                            <div className="flex items-center gap-2">
                              {note.is_private && (
                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Private</span>
                              )}
                              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                                {note.note_type_display || note.note_type}
                              </span>
                              {/* Edit & Delete Buttons */}
                              <button
                                onClick={() => handleEditNote(note)}
                                className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                title="Edit Note"
                              >
                                <FiEdit2 size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteNote(note)}
                                className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                title="Delete Note"
                              >
                                <FiTrash2 size={16} />
                              </button>
                            </div>
                          </div>
                          <p className="text-gray-600 text-sm">{note.content}</p>
                          <p className="text-xs text-gray-400 mt-2">
                            By Dr. {note.doctor_name} • {new Date(note.created_at).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Empty State if no data */}
                {patientHistory && 
                 !patientHistory.blood_type && 
                 patientHistory.allergies?.length === 0 && 
                 patientHistory.chronic_conditions?.length === 0 && 
                 patientHistory.current_medications?.length === 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 text-center">
                    <FiAlertTriangle className="mx-auto mb-2 text-yellow-500" size={32} />
                    <p className="text-yellow-800 font-medium">This patient has not added any medical information yet.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Note Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">{editingNote ? 'Edit' : 'Add'} Medical Note</h2>
              <button onClick={closeNoteModal} className="p-2 hover:bg-gray-100 rounded-lg">
                <FiX />
              </button>
            </div>
            <form onSubmit={editingNote ? handleUpdateNote : handleAddNote} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Note Type</label>
                <select 
                  className="w-full p-3 border rounded-xl" 
                  value={noteForm.note_type} 
                  onChange={(e) => setNoteForm({...noteForm, note_type: e.target.value})}
                >
                  <option value="general">General Note</option>
                  <option value="consultation">Consultation</option>
                  <option value="follow_up">Follow Up</option>
                  <option value="prescription">Prescription Note</option>
                  <option value="lab_result">Lab Result</option>
                  <option value="warning">Warning/Alert</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Title *</label>
                <input 
                  type="text" 
                  className="w-full p-3 border rounded-xl" 
                  value={noteForm.title} 
                  onChange={(e) => setNoteForm({...noteForm, title: e.target.value})} 
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Content *</label>
                <textarea 
                  className="w-full p-3 border rounded-xl" 
                  rows="4" 
                  value={noteForm.content} 
                  onChange={(e) => setNoteForm({...noteForm, content: e.target.value})} 
                  required 
                />
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="is_private" 
                  checked={noteForm.is_private} 
                  onChange={(e) => setNoteForm({...noteForm, is_private: e.target.checked})} 
                />
                <label htmlFor="is_private" className="text-sm">Private note (only visible to doctors)</label>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={closeNoteModal} className="flex-1 py-3 bg-gray-100 rounded-xl font-semibold">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-3 bg-green-600 text-white rounded-xl font-semibold">
                  {editingNote ? 'Update' : 'Add'} Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientMedicalRecords;