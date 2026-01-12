import React, { useState, useEffect } from 'react';
import { medicalProfileAPI, allergyAPI, chronicConditionAPI, currentMedicationAPI } from '../services/api';
import { 
  FiHeart, FiAlertTriangle, FiActivity, FiPlusCircle, FiEdit2, FiTrash2, 
  FiX, FiUser, FiPhone, FiDroplet, FiCalendar, FiFileText, FiShield,
  FiThermometer, FiPackage
} from 'react-icons/fi';
import ConfirmModal from '../components/ConfirmModal';
import ToastContainer from '../components/ToastContainer';
import { useToast } from '../hooks/useToast';

const MedicalHistory = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Form modals
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAllergyModal, setShowAllergyModal] = useState(false);
  const [showConditionModal, setShowConditionModal] = useState(false);
  const [showMedicationModal, setShowMedicationModal] = useState(false);
  
  // Editing items
  const [editingAllergy, setEditingAllergy] = useState(null);
  const [editingCondition, setEditingCondition] = useState(null);
  const [editingMedication, setEditingMedication] = useState(null);
  
  // Forms
  const [profileForm, setProfileForm] = useState({
    blood_type: '', date_of_birth: '', weight: '', height: '',
    emergency_contact_name: '', emergency_contact_phone: ''
  });
  const [allergyForm, setAllergyForm] = useState({
    allergy_type: 'drug', allergen: '', severity: 'moderate', reaction: '', diagnosed_date: ''
  });
  const [conditionForm, setConditionForm] = useState({
    condition_name: '', diagnosis_date: '', status: 'active', notes: ''
  });
  const [medicationForm, setMedicationForm] = useState({
    medication_name: '', dosage: '', frequency: 'once_daily', start_date: '', reason: ''
  });
  
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  const [actionLoading, setActionLoading] = useState(false);
  const toast = useToast();

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await medicalProfileAPI.getMyProfile();
      setProfile(response.data);
      setProfileForm({
        blood_type: response.data.blood_type || '',
        date_of_birth: response.data.date_of_birth || '',
        weight: response.data.weight || '',
        height: response.data.height || '',
        emergency_contact_name: response.data.emergency_contact_name || '',
        emergency_contact_phone: response.data.emergency_contact_phone || ''
      });
    } catch (error) {
      toast.error('Failed to load medical profile');
    } finally {
      setLoading(false);
    }
  };

  // Profile handlers
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      await medicalProfileAPI.updateMyProfile(profileForm);
      toast.success('Profile updated successfully!');
      setShowProfileModal(false);
      fetchProfile();
    } catch (error) {
      toast.error('Error updating profile');
    }
  };

  // Allergy handlers
  const handleSaveAllergy = async (e) => {
    e.preventDefault();
    try {
      if (editingAllergy) {
        await allergyAPI.update(editingAllergy.id, allergyForm);
        toast.success('Allergy updated!');
      } else {
        await allergyAPI.create(allergyForm);
        toast.success('Allergy added!');
      }
      setShowAllergyModal(false);
      setEditingAllergy(null);
      setAllergyForm({ allergy_type: 'drug', allergen: '', severity: 'moderate', reaction: '', diagnosed_date: '' });
      fetchProfile();
    } catch (error) {
      toast.error('Error saving allergy');
    }
  };

  const handleDeleteAllergy = (allergy) => {
    setConfirmModal({
      isOpen: true, title: 'Delete Allergy', type: 'danger', confirmText: 'Delete',
      message: `Remove "${allergy.allergen}" from your allergies?`,
      onConfirm: async () => {
        setActionLoading(true);
        try {
          await allergyAPI.delete(allergy.id);
          toast.success('Allergy removed!');
          fetchProfile();
        } catch (error) {
          toast.error('Error deleting allergy');
        } finally {
          setActionLoading(false);
          setConfirmModal({ ...confirmModal, isOpen: false });
        }
      }
    });
  };

  // Condition handlers
  const handleSaveCondition = async (e) => {
    e.preventDefault();
    try {
      if (editingCondition) {
        await chronicConditionAPI.update(editingCondition.id, conditionForm);
        toast.success('Condition updated!');
      } else {
        await chronicConditionAPI.create(conditionForm);
        toast.success('Condition added!');
      }
      setShowConditionModal(false);
      setEditingCondition(null);
      setConditionForm({ condition_name: '', diagnosis_date: '', status: 'active', notes: '' });
      fetchProfile();
    } catch (error) {
      toast.error('Error saving condition');
    }
  };

  const handleDeleteCondition = (condition) => {
    setConfirmModal({
      isOpen: true, title: 'Delete Condition', type: 'danger', confirmText: 'Delete',
      message: `Remove "${condition.condition_name}" from your conditions?`,
      onConfirm: async () => {
        setActionLoading(true);
        try {
          await chronicConditionAPI.delete(condition.id);
          toast.success('Condition removed!');
          fetchProfile();
        } catch (error) {
          toast.error('Error deleting condition');
        } finally {
          setActionLoading(false);
          setConfirmModal({ ...confirmModal, isOpen: false });
        }
      }
    });
  };

  // Medication handlers
  const handleSaveMedication = async (e) => {
    e.preventDefault();
    try {
      if (editingMedication) {
        await currentMedicationAPI.update(editingMedication.id, medicationForm);
        toast.success('Medication updated!');
      } else {
        await currentMedicationAPI.create(medicationForm);
        toast.success('Medication added!');
      }
      setShowMedicationModal(false);
      setEditingMedication(null);
      setMedicationForm({ medication_name: '', dosage: '', frequency: 'once_daily', start_date: '', reason: '' });
      fetchProfile();
    } catch (error) {
      toast.error('Error saving medication');
    }
  };

  const handleDeleteMedication = (med) => {
    setConfirmModal({
      isOpen: true, title: 'Delete Medication', type: 'danger', confirmText: 'Delete',
      message: `Remove "${med.medication_name}" from your medications?`,
      onConfirm: async () => {
        setActionLoading(true);
        try {
          await currentMedicationAPI.delete(med.id);
          toast.success('Medication removed!');
          fetchProfile();
        } catch (error) {
          toast.error('Error deleting medication');
        } finally {
          setActionLoading(false);
          setConfirmModal({ ...confirmModal, isOpen: false });
        }
      }
    });
  };

  const getSeverityColor = (severity) => {
    const colors = {
      mild: 'bg-green-100 text-green-700',
      moderate: 'bg-yellow-100 text-yellow-700',
      severe: 'bg-orange-100 text-orange-700',
      life_threatening: 'bg-red-100 text-red-700'
    };
    return colors[severity] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />
      <ConfirmModal isOpen={confirmModal.isOpen} onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })} onConfirm={confirmModal.onConfirm} title={confirmModal.title} message={confirmModal.message} type={confirmModal.type} confirmText={confirmModal.confirmText} loading={actionLoading} />

      {/* Hero Section */}
      <section className="relative py-12 overflow-hidden" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10 container mx-auto px-6">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <FiHeart className="text-pink-300" /> My Medical History
          </h1>
          <p className="text-white/70">Manage your health information, allergies, and medications</p>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-white">
              <FiDroplet className="mb-2" size={24} />
              <p className="text-white/70 text-sm">Blood Type</p>
              <p className="text-2xl font-bold">{profile?.blood_type || 'Not Set'}</p>
            </div>
            <div className="bg-red-500/20 backdrop-blur-sm rounded-xl p-4 text-white">
              <FiAlertTriangle className="mb-2" size={24} />
              <p className="text-red-200 text-sm">Allergies</p>
              <p className="text-2xl font-bold">{profile?.allergies?.length || 0}</p>
            </div>
            <div className="bg-yellow-500/20 backdrop-blur-sm rounded-xl p-4 text-white">
              <FiActivity className="mb-2" size={24} />
              <p className="text-yellow-200 text-sm">Conditions</p>
              <p className="text-2xl font-bold">{profile?.chronic_conditions?.length || 0}</p>
            </div>
            <div className="bg-green-500/20 backdrop-blur-sm rounded-xl p-4 text-white">
              <FiPackage className="mb-2" size={24} />
              <p className="text-green-200 text-sm">Medications</p>
              <p className="text-2xl font-bold">{profile?.current_medications?.length || 0}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg p-2 mb-6 flex gap-2 flex-wrap">
          {[
            { key: 'overview', label: 'Overview', icon: FiUser },
            { key: 'allergies', label: 'Allergies', icon: FiAlertTriangle },
            { key: 'conditions', label: 'Conditions', icon: FiActivity },
            { key: 'medications', label: 'Medications', icon: FiPackage },
            { key: 'notes', label: 'Doctor Notes', icon: FiFileText }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                activeTab === tab.key ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <tab.icon size={18} /> {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Personal Information</h2>
              <button onClick={() => setShowProfileModal(true)} className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 flex items-center gap-2">
                <FiEdit2 /> Edit Profile
              </button>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <FiDroplet className="text-red-500" size={24} />
                <div>
                  <p className="text-sm text-gray-500">Blood Type</p>
                  <p className="font-semibold text-gray-800">{profile?.blood_type || 'Not Set'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <FiCalendar className="text-blue-500" size={24} />
                <div>
                  <p className="text-sm text-gray-500">Date of Birth</p>
                  <p className="font-semibold text-gray-800">{profile?.date_of_birth || 'Not Set'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <FiThermometer className="text-green-500" size={24} />
                <div>
                  <p className="text-sm text-gray-500">Weight / Height</p>
                  <p className="font-semibold text-gray-800">
                    {profile?.weight ? `${profile.weight} kg` : '-'} / {profile?.height ? `${profile.height} cm` : '-'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl md:col-span-2 lg:col-span-3">
                <FiPhone className="text-purple-500" size={24} />
                <div>
                  <p className="text-sm text-gray-500">Emergency Contact</p>
                  <p className="font-semibold text-gray-800">
                    {profile?.emergency_contact_name || 'Not Set'} 
                    {profile?.emergency_contact_phone && ` - ${profile.emergency_contact_phone}`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Allergies Tab */}
        {activeTab === 'allergies' && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <FiAlertTriangle className="text-red-500" /> My Allergies
              </h2>
              <button onClick={() => { setEditingAllergy(null); setAllergyForm({ allergy_type: 'drug', allergen: '', severity: 'moderate', reaction: '', diagnosed_date: '' }); setShowAllergyModal(true); }} className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 flex items-center gap-2">
                <FiPlusCircle /> Add Allergy
              </button>
            </div>
            
            {profile?.allergies?.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FiShield className="mx-auto mb-4 text-gray-300" size={48} />
                <p>No allergies recorded</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {profile?.allergies?.map(allergy => (
                  <div key={allergy.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-lg text-gray-800">{allergy.allergen}</h3>
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold mt-1 ${getSeverityColor(allergy.severity)}`}>
                          {allergy.severity_display}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { setEditingAllergy(allergy); setAllergyForm(allergy); setShowAllergyModal(true); }} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg">
                          <FiEdit2 size={16} />
                        </button>
                        <button onClick={() => handleDeleteAllergy(allergy)} className="p-2 text-red-600 hover:bg-red-100 rounded-lg">
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">Type: {allergy.allergy_type_display}</p>
                    {allergy.reaction && <p className="text-sm text-gray-600 mt-1">Reaction: {allergy.reaction}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Conditions Tab */}
        {activeTab === 'conditions' && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <FiActivity className="text-yellow-500" /> Chronic Conditions
              </h2>
              <button onClick={() => { setEditingCondition(null); setConditionForm({ condition_name: '', diagnosis_date: '', status: 'active', notes: '' }); setShowConditionModal(true); }} className="px-4 py-2 bg-yellow-600 text-white rounded-xl hover:bg-yellow-700 flex items-center gap-2">
                <FiPlusCircle /> Add Condition
              </button>
            </div>
            
            {profile?.chronic_conditions?.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FiActivity className="mx-auto mb-4 text-gray-300" size={48} />
                <p>No chronic conditions recorded</p>
              </div>
            ) : (
              <div className="space-y-4">
                {profile?.chronic_conditions?.map(condition => (
                  <div key={condition.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-lg text-gray-800">{condition.condition_name}</h3>
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold mt-1 ${
                          condition.status === 'active' ? 'bg-red-100 text-red-700' :
                          condition.status === 'managed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {condition.status_display}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { setEditingCondition(condition); setConditionForm(condition); setShowConditionModal(true); }} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg">
                          <FiEdit2 size={16} />
                        </button>
                        <button onClick={() => handleDeleteCondition(condition)} className="p-2 text-red-600 hover:bg-red-100 rounded-lg">
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </div>
                    {condition.diagnosis_date && <p className="text-sm text-gray-500 mt-2">Diagnosed: {condition.diagnosis_date}</p>}
                    {condition.notes && <p className="text-sm text-gray-600 mt-1">{condition.notes}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Medications Tab */}
        {activeTab === 'medications' && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <FiPackage className="text-green-500" /> Current Medications
              </h2>
              <button onClick={() => { setEditingMedication(null); setMedicationForm({ medication_name: '', dosage: '', frequency: 'once_daily', start_date: '', reason: '' }); setShowMedicationModal(true); }} className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 flex items-center gap-2">
                <FiPlusCircle /> Add Medication
              </button>
            </div>
            
            {profile?.current_medications?.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FiPackage className="mx-auto mb-4 text-gray-300" size={48} />
                <p>No current medications recorded</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {profile?.current_medications?.map(med => (
                  <div key={med.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-lg text-gray-800">{med.medication_name}</h3>
                        <p className="text-blue-600 font-medium">{med.dosage}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { setEditingMedication(med); setMedicationForm(med); setShowMedicationModal(true); }} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg">
                          <FiEdit2 size={16} />
                        </button>
                        <button onClick={() => handleDeleteMedication(med)} className="p-2 text-red-600 hover:bg-red-100 rounded-lg">
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">Frequency: {med.frequency_display}</p>
                    {med.reason && <p className="text-sm text-gray-600 mt-1">For: {med.reason}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Doctor Notes Tab */}
        {activeTab === 'notes' && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2 mb-6">
              <FiFileText className="text-purple-500" /> Doctor Notes
            </h2>
            
            {profile?.medical_notes?.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FiFileText className="mx-auto mb-4 text-gray-300" size={48} />
                <p>No medical notes yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {profile?.medical_notes?.map(note => (
                  <div key={note.id} className="border border-gray-200 rounded-xl p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-gray-800">{note.title}</h3>
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                        {note.note_type_display}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-2">{note.content}</p>
                    <p className="text-sm text-gray-400">
                      By Dr. {note.doctor_name} • {new Date(note.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Edit Profile</h2>
              <button onClick={() => setShowProfileModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><FiX /></button>
            </div>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Blood Type</label>
                <select className="w-full p-3 border rounded-xl" value={profileForm.blood_type} onChange={(e) => setProfileForm({...profileForm, blood_type: e.target.value})}>
                  <option value="">Select...</option>
                  {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date of Birth</label>
                <input type="date" className="w-full p-3 border rounded-xl" value={profileForm.date_of_birth} onChange={(e) => setProfileForm({...profileForm, date_of_birth: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Weight (kg)</label>
                  <input type="number" step="0.1" className="w-full p-3 border rounded-xl" value={profileForm.weight} onChange={(e) => setProfileForm({...profileForm, weight: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Height (cm)</label>
                  <input type="number" step="0.1" className="w-full p-3 border rounded-xl" value={profileForm.height} onChange={(e) => setProfileForm({...profileForm, height: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Emergency Contact Name</label>
                <input type="text" className="w-full p-3 border rounded-xl" value={profileForm.emergency_contact_name} onChange={(e) => setProfileForm({...profileForm, emergency_contact_name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Emergency Contact Phone</label>
                <input type="tel" className="w-full p-3 border rounded-xl" value={profileForm.emergency_contact_phone} onChange={(e) => setProfileForm({...profileForm, emergency_contact_phone: e.target.value})} />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowProfileModal(false)} className="flex-1 py-3 bg-gray-100 rounded-xl font-semibold">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-semibold">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Allergy Modal */}
      {showAllergyModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">{editingAllergy ? 'Edit' : 'Add'} Allergy</h2>
              <button onClick={() => setShowAllergyModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><FiX /></button>
            </div>
            <form onSubmit={handleSaveAllergy} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Allergy Type *</label>
                <select className="w-full p-3 border rounded-xl" value={allergyForm.allergy_type} onChange={(e) => setAllergyForm({...allergyForm, allergy_type: e.target.value})} required>
                  <option value="drug">Drug/Medication</option>
                  <option value="food">Food</option>
                  <option value="environmental">Environmental</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Allergen Name *</label>
                <input type="text" className="w-full p-3 border rounded-xl" placeholder="e.g., Penicillin, Peanuts" value={allergyForm.allergen} onChange={(e) => setAllergyForm({...allergyForm, allergen: e.target.value})} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Severity *</label>
                <select className="w-full p-3 border rounded-xl" value={allergyForm.severity} onChange={(e) => setAllergyForm({...allergyForm, severity: e.target.value})} required>
                  <option value="mild">Mild</option>
                  <option value="moderate">Moderate</option>
                  <option value="severe">Severe</option>
                  <option value="life_threatening">Life Threatening</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Reaction Description</label>
                <textarea className="w-full p-3 border rounded-xl" rows="2" placeholder="Describe the allergic reaction..." value={allergyForm.reaction} onChange={(e) => setAllergyForm({...allergyForm, reaction: e.target.value})} />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowAllergyModal(false)} className="flex-1 py-3 bg-gray-100 rounded-xl font-semibold">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-red-600 text-white rounded-xl font-semibold">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Condition Modal */}
      {showConditionModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">{editingCondition ? 'Edit' : 'Add'} Condition</h2>
              <button onClick={() => setShowConditionModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><FiX /></button>
            </div>
            <form onSubmit={handleSaveCondition} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Condition Name *</label>
                <input type="text" className="w-full p-3 border rounded-xl" placeholder="e.g., Diabetes, Hypertension" value={conditionForm.condition_name} onChange={(e) => setConditionForm({...conditionForm, condition_name: e.target.value})} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select className="w-full p-3 border rounded-xl" value={conditionForm.status} onChange={(e) => setConditionForm({...conditionForm, status: e.target.value})}>
                  <option value="active">Active</option>
                  <option value="managed">Managed</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Diagnosis Date</label>
                <input type="date" className="w-full p-3 border rounded-xl" value={conditionForm.diagnosis_date} onChange={(e) => setConditionForm({...conditionForm, diagnosis_date: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea className="w-full p-3 border rounded-xl" rows="2" value={conditionForm.notes} onChange={(e) => setConditionForm({...conditionForm, notes: e.target.value})} />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowConditionModal(false)} className="flex-1 py-3 bg-gray-100 rounded-xl font-semibold">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-yellow-600 text-white rounded-xl font-semibold">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Medication Modal */}
      {showMedicationModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">{editingMedication ? 'Edit' : 'Add'} Medication</h2>
              <button onClick={() => setShowMedicationModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><FiX /></button>
            </div>
            <form onSubmit={handleSaveMedication} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Medication Name *</label>
                <input type="text" className="w-full p-3 border rounded-xl" placeholder="e.g., Metformin" value={medicationForm.medication_name} onChange={(e) => setMedicationForm({...medicationForm, medication_name: e.target.value})} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Dosage *</label>
                <input type="text" className="w-full p-3 border rounded-xl" placeholder="e.g., 500mg" value={medicationForm.dosage} onChange={(e) => setMedicationForm({...medicationForm, dosage: e.target.value})} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Frequency</label>
                <select className="w-full p-3 border rounded-xl" value={medicationForm.frequency} onChange={(e) => setMedicationForm({...medicationForm, frequency: e.target.value})}>
                  <option value="once_daily">Once Daily</option>
                  <option value="twice_daily">Twice Daily</option>
                  <option value="three_daily">Three Times Daily</option>
                  <option value="four_daily">Four Times Daily</option>
                  <option value="as_needed">As Needed</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Reason for Taking</label>
                <input type="text" className="w-full p-3 border rounded-xl" placeholder="e.g., Blood sugar control" value={medicationForm.reason} onChange={(e) => setMedicationForm({...medicationForm, reason: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Start Date</label>
                <input type="date" className="w-full p-3 border rounded-xl" value={medicationForm.start_date} onChange={(e) => setMedicationForm({...medicationForm, start_date: e.target.value})} />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowMedicationModal(false)} className="flex-1 py-3 bg-gray-100 rounded-xl font-semibold">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-green-600 text-white rounded-xl font-semibold">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicalHistory;