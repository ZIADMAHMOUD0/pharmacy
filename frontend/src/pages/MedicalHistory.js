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
  const [medicationAllergyWarning, setMedicationAllergyWarning] = useState({ show: false, matchingAllergies: [] });
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
  const handleSaveMedication = async (e, forceAdd = false) => {
    e.preventDefault();
    
    if (!forceAdd && !editingMedication && medicationForm.medication_name.trim()) {
      try {
        const response = await currentMedicationAPI.checkAllergy(medicationForm.medication_name);
        if (response.data.has_allergy) {
          setMedicationAllergyWarning({
            show: true,
            matchingAllergies: response.data.matching_allergies,
            matchedBy: response.data.matched_by,
            foundActiveIngredients: response.data.found_active_ingredients || []
          });
          return;
        }
      } catch (error) {
        console.error('Error checking allergy:', error);
      }
    }
    
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

  const handleConfirmMedicationWithAllergy = async () => {
    setMedicationAllergyWarning({ show: false, matchingAllergies: [], matchedBy: [], foundActiveIngredients: [] });
    const syntheticEvent = { preventDefault: () => {} };
    await handleSaveMedication(syntheticEvent, true);
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
      mild: 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30',
      moderate: 'bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30',
      severe: 'bg-orange-100 dark:bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-500/30',
      life_threatening: 'bg-rose-100 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/30'
    };
    return colors[severity] || 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-300 font-medium">Loading your medical history...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { key: 'overview', label: 'Overview', icon: FiUser, color: 'teal' },
    { key: 'allergies', label: 'Allergies', icon: FiAlertTriangle, color: 'rose' },
    { key: 'conditions', label: 'Conditions', icon: FiActivity, color: 'amber' },
    { key: 'medications', label: 'Medications', icon: FiPackage, color: 'emerald' },
    { key: 'notes', label: 'Doctor Notes', icon: FiFileText, color: 'violet' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />
      <ConfirmModal isOpen={confirmModal.isOpen} onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })} onConfirm={confirmModal.onConfirm} title={confirmModal.title} message={confirmModal.message} type={confirmModal.type} confirmText={confirmModal.confirmText} loading={actionLoading} />

      {/* Medication Allergy Warning Modal */}
      {medicationAllergyWarning.show && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto animate-scale-in border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-rose-100 dark:bg-rose-500/15 rounded-2xl flex items-center justify-center flex-shrink-0">
                <FiAlertTriangle className="text-rose-600 dark:text-rose-300" size={28} />
              </div>
              <div>
                <h2 className="text-2xl font-display font-bold text-rose-600 dark:text-rose-300">Allergy Warning!</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm">This medication matches your allergies</p>
              </div>
            </div>
            
            <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-2xl p-5 mb-6">
              <p className="text-slate-700 dark:text-slate-200 mb-4">
                You are trying to add <strong className="text-slate-800 dark:text-slate-100">"{medicationForm.medication_name}"</strong> to your current medications, but it matches your recorded allergies:
              </p>
              
              {medicationAllergyWarning.foundActiveIngredients?.length > 0 && (
                <div className="bg-teal-50 dark:bg-teal-500/15 border border-teal-200 rounded-xl p-4 mb-4">
                  <p className="text-teal-700 dark:text-teal-300 text-sm font-medium mb-1">💊 Active Ingredient(s) found:</p>
                  <p className="text-teal-800 font-semibold">{medicationAllergyWarning.foundActiveIngredients.join(', ')}</p>
                </div>
              )}
              
              <div className="space-y-3">
                {medicationAllergyWarning.matchingAllergies.map((allergy, idx) => {
                  const matchInfo = medicationAllergyWarning.matchedBy?.find(m => m.allergen === allergy.allergen);
                  return (
                    <div key={idx} className={`p-4 rounded-xl border ${getSeverityColor(allergy.severity)}`}>
                      <div className="flex justify-between items-start">
                        <span className="font-semibold">{allergy.allergen}</span>
                        <span className="text-xs font-bold px-2 py-1 rounded-full bg-white/50">
                          {allergy.severity_display || allergy.severity}
                        </span>
                      </div>
                      {matchInfo && (
                        <p className="text-xs mt-2 opacity-70">
                          Matched by: {matchInfo.match_type?.includes('active_ingredient') ? '💊 Active Ingredient' : ''} 
                          {matchInfo.match_type?.includes('medication_name') ? (matchInfo.match_type?.includes('active_ingredient') ? ' & ' : '') + '📝 Medication Name' : ''}
                        </p>
                      )}
                      {allergy.reaction && <p className="text-sm mt-2 opacity-80">Reaction: {allergy.reaction}</p>}
                    </div>
                  );
                })}
              </div>
            </div>
            
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 flex items-start gap-2">
              <span className="text-lg">⚠️</span>
              Adding this medication despite your allergy could be dangerous. Please consult with a healthcare professional.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setMedicationAllergyWarning({ show: false, matchingAllergies: [], matchedBy: [], foundActiveIngredients: [] })}
                className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-800 rounded-xl font-semibold hover:bg-slate-200 transition-colors text-slate-700 dark:text-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmMedicationWithAllergy}
                className="flex-1 py-3.5 bg-gradient-to-r from-rose-500 to-red-500 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-rose-500/30 transition-all flex items-center justify-center gap-2"
              >
                <FiPackage size={18} />
                Add Anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative py-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-600 via-cyan-600 to-teal-700"></div>
        <div className="absolute inset-0 pattern-pharmacy opacity-10"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 container mx-auto px-6">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <FiHeart className="text-white" size={32} />
            </div>
            <div>
              <h1 className="text-4xl font-display font-bold text-white">My Medical History</h1>
              <p className="text-white/60">Manage your health information, allergies, and medications</p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/10">
              <FiDroplet className="mb-3 text-white/80" size={24} />
              <p className="text-white/60 text-sm font-medium">Blood Type</p>
              <p className="text-3xl font-display font-bold text-white">{profile?.blood_type || '—'}</p>
            </div>
            <div className="bg-rose-600/30 backdrop-blur-sm rounded-2xl p-5 border border-rose-400/20">
              <FiAlertTriangle className="mb-3 text-rose-200" size={24} />
              <p className="text-rose-200/80 text-sm font-medium">Allergies</p>
              <p className="text-3xl font-display font-bold text-white">{profile?.allergies?.length || 0}</p>
            </div>
            <div className="bg-amber-500/20 backdrop-blur-sm rounded-2xl p-5 border border-amber-400/20">
              <FiActivity className="mb-3 text-amber-200" size={24} />
              <p className="text-amber-200/80 text-sm font-medium">Conditions</p>
              <p className="text-3xl font-display font-bold text-white">{profile?.chronic_conditions?.length || 0}</p>
            </div>
            <div className="bg-emerald-500/20 backdrop-blur-sm rounded-2xl p-5 border border-emerald-400/20">
              <FiPackage className="mb-3 text-emerald-200" size={24} />
              <p className="text-emerald-200/80 text-sm font-medium">Medications</p>
              <p className="text-3xl font-display font-bold text-white">{profile?.current_medications?.length || 0}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-6 py-10">
        {/* Tabs */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-soft p-2 mb-8 flex gap-2 flex-wrap border border-slate-100 dark:border-slate-800">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all ${
                activeTab === tab.key 
                  ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-500/30' 
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50'
              }`}
            >
              <tab.icon size={18} /> {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-soft p-8 border border-slate-100 dark:border-slate-800 animate-fade-in">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-display font-bold text-slate-800 dark:text-slate-100">Personal Information</h2>
              <button onClick={() => setShowProfileModal(true)} className="px-5 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-xl font-medium hover:shadow-glow transition-all flex items-center gap-2">
                <FiEdit2 size={18} /> Edit Profile
              </button>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <InfoCard icon={<FiDroplet className="text-rose-500 dark:text-rose-400" />} label="Blood Type" value={profile?.blood_type || 'Not Set'} />
              <InfoCard icon={<FiCalendar className="text-teal-500" />} label="Date of Birth" value={profile?.date_of_birth || 'Not Set'} />
              <InfoCard icon={<FiThermometer className="text-emerald-500 dark:text-emerald-400" />} label="Weight / Height" value={`${profile?.weight ? `${profile.weight} kg` : '—'} / ${profile?.height ? `${profile.height} cm` : '—'}`} />
              <div className="md:col-span-2 lg:col-span-3">
                <InfoCard icon={<FiPhone className="text-violet-500 dark:text-violet-400" />} label="Emergency Contact" value={`${profile?.emergency_contact_name || 'Not Set'}${profile?.emergency_contact_phone ? ` • ${profile.emergency_contact_phone}` : ''}`} />
              </div>
            </div>
          </div>
        )}

        {/* Allergies Tab */}
        {activeTab === 'allergies' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-soft p-8 border border-slate-100 dark:border-slate-800 animate-fade-in">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-display font-bold text-slate-800 dark:text-slate-100 flex items-center gap-3">
                <div className="w-10 h-10 bg-rose-100 dark:bg-rose-500/15 rounded-xl flex items-center justify-center">
                  <FiAlertTriangle className="text-rose-600 dark:text-rose-300" size={20} />
                </div>
                My Allergies
              </h2>
              <button onClick={() => { setEditingAllergy(null); setAllergyForm({ allergy_type: 'drug', allergen: '', severity: 'moderate', reaction: '', diagnosed_date: '' }); setShowAllergyModal(true); }} className="px-5 py-2.5 bg-gradient-to-r from-rose-500 to-red-500 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-rose-500/30 transition-all flex items-center gap-2">
                <FiPlusCircle size={18} /> Add Allergy
              </button>
            </div>
            
            {profile?.allergies?.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FiShield className="text-slate-400 dark:text-slate-500" size={40} />
                </div>
                <p className="text-slate-500 dark:text-slate-400 font-medium">No allergies recorded</p>
                <p className="text-slate-400 dark:text-slate-500 text-sm">Add your allergies to help us keep you safe</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {profile?.allergies?.map((allergy, index) => (
                  <div key={allergy.id} className="border border-slate-200 dark:border-slate-700 rounded-2xl p-5 hover:shadow-soft-xl hover:border-rose-200 dark:border-rose-500/30 transition-all animate-fade-in-up" style={{ animationDelay: `${index * 50}ms` }}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-display font-bold text-lg text-slate-800 dark:text-slate-100">{allergy.allergen}</h3>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mt-2 border ${getSeverityColor(allergy.severity)}`}>
                          {allergy.severity_display}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => { setEditingAllergy(allergy); setAllergyForm(allergy); setShowAllergyModal(true); }} className="p-2.5 text-teal-600 dark:text-teal-300 hover:bg-teal-50 dark:bg-teal-500/15 rounded-xl transition-colors">
                          <FiEdit2 size={16} />
                        </button>
                        <button onClick={() => handleDeleteAllergy(allergy)} className="p-2.5 text-rose-500 dark:text-rose-400 hover:bg-rose-50 rounded-xl transition-colors">
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-3">Type: {allergy.allergy_type_display}</p>
                    {allergy.reaction && <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">Reaction: {allergy.reaction}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Conditions Tab */}
        {activeTab === 'conditions' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-soft p-8 border border-slate-100 dark:border-slate-800 animate-fade-in">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-display font-bold text-slate-800 dark:text-slate-100 flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 dark:bg-amber-500/15 rounded-xl flex items-center justify-center">
                  <FiActivity className="text-amber-600 dark:text-amber-300" size={20} />
                </div>
                Chronic Conditions
              </h2>
              <button onClick={() => { setEditingCondition(null); setConditionForm({ condition_name: '', diagnosis_date: '', status: 'active', notes: '' }); setShowConditionModal(true); }} className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-amber-500/30 transition-all flex items-center gap-2">
                <FiPlusCircle size={18} /> Add Condition
              </button>
            </div>
            
            {profile?.chronic_conditions?.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FiActivity className="text-slate-400 dark:text-slate-500" size={40} />
                </div>
                <p className="text-slate-500 dark:text-slate-400 font-medium">No chronic conditions recorded</p>
              </div>
            ) : (
              <div className="space-y-4">
                {profile?.chronic_conditions?.map((condition, index) => (
                  <div key={condition.id} className="border border-slate-200 dark:border-slate-700 rounded-2xl p-5 hover:shadow-soft-xl hover:border-amber-200 dark:border-amber-500/30 transition-all animate-fade-in-up" style={{ animationDelay: `${index * 50}ms` }}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-display font-bold text-lg text-slate-800 dark:text-slate-100">{condition.condition_name}</h3>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mt-2 border ${
                          condition.status === 'active' ? 'bg-rose-100 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/30' :
                          condition.status === 'managed' ? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                        }`}>
                          {condition.status_display}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => { setEditingCondition(condition); setConditionForm(condition); setShowConditionModal(true); }} className="p-2.5 text-teal-600 dark:text-teal-300 hover:bg-teal-50 dark:bg-teal-500/15 rounded-xl transition-colors">
                          <FiEdit2 size={16} />
                        </button>
                        <button onClick={() => handleDeleteCondition(condition)} className="p-2.5 text-rose-500 dark:text-rose-400 hover:bg-rose-50 rounded-xl transition-colors">
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </div>
                    {condition.diagnosis_date && <p className="text-sm text-slate-500 dark:text-slate-400 mt-3">Diagnosed: {condition.diagnosis_date}</p>}
                    {condition.notes && <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{condition.notes}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Medications Tab */}
        {activeTab === 'medications' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-soft p-8 border border-slate-100 dark:border-slate-800 animate-fade-in">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-display font-bold text-slate-800 dark:text-slate-100 flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-500/15 rounded-xl flex items-center justify-center">
                  <FiPackage className="text-emerald-600 dark:text-emerald-300" size={20} />
                </div>
                Current Medications
              </h2>
              <button onClick={() => { setEditingMedication(null); setMedicationForm({ medication_name: '', dosage: '', frequency: 'once_daily', start_date: '', reason: '' }); setShowMedicationModal(true); }} className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-emerald-500/30 transition-all flex items-center gap-2">
                <FiPlusCircle size={18} /> Add Medication
              </button>
            </div>
            
            {profile?.current_medications?.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FiPackage className="text-slate-400 dark:text-slate-500" size={40} />
                </div>
                <p className="text-slate-500 dark:text-slate-400 font-medium">No current medications recorded</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {profile?.current_medications?.map((med, index) => (
                  <div key={med.id} className="border border-slate-200 dark:border-slate-700 rounded-2xl p-5 hover:shadow-soft-xl hover:border-emerald-200 dark:border-emerald-500/30 transition-all animate-fade-in-up" style={{ animationDelay: `${index * 50}ms` }}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-display font-bold text-lg text-slate-800 dark:text-slate-100">{med.medication_name}</h3>
                        <p className="text-teal-600 dark:text-teal-300 font-semibold mt-1">{med.dosage}</p>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => { setEditingMedication(med); setMedicationForm(med); setShowMedicationModal(true); }} className="p-2.5 text-teal-600 dark:text-teal-300 hover:bg-teal-50 dark:bg-teal-500/15 rounded-xl transition-colors">
                          <FiEdit2 size={16} />
                        </button>
                        <button onClick={() => handleDeleteMedication(med)} className="p-2.5 text-rose-500 dark:text-rose-400 hover:bg-rose-50 rounded-xl transition-colors">
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-3">Frequency: {med.frequency_display}</p>
                    {med.reason && <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">For: {med.reason}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Doctor Notes Tab */}
        {activeTab === 'notes' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-soft p-8 border border-slate-100 dark:border-slate-800 animate-fade-in">
            <h2 className="text-2xl font-display font-bold text-slate-800 dark:text-slate-100 flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-violet-100 dark:bg-violet-500/15 rounded-xl flex items-center justify-center">
                <FiFileText className="text-violet-600 dark:text-violet-300" size={20} />
              </div>
              Doctor Notes
            </h2>
            
            {profile?.medical_notes?.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FiFileText className="text-slate-400 dark:text-slate-500" size={40} />
                </div>
                <p className="text-slate-500 dark:text-slate-400 font-medium">No medical notes yet</p>
                <p className="text-slate-400 dark:text-slate-500 text-sm">Your doctors' notes will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {profile?.medical_notes?.map((note, index) => (
                  <div key={note.id} className="border border-slate-200 dark:border-slate-700 rounded-2xl p-5 hover:border-violet-200 dark:border-violet-500/30 transition-all animate-fade-in-up" style={{ animationDelay: `${index * 50}ms` }}>
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-display font-bold text-slate-800 dark:text-slate-100">{note.title}</h3>
                      <span className="text-xs bg-violet-100 dark:bg-violet-500/15 text-violet-700 dark:text-violet-300 px-3 py-1 rounded-full font-semibold">
                        {note.note_type_display}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 mb-3">{note.content}</p>
                    <p className="text-sm text-slate-400 dark:text-slate-500">
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
        <Modal title="Edit Profile" onClose={() => setShowProfileModal(false)}>
          <form onSubmit={handleUpdateProfile} className="space-y-5">
            <FormField label="Blood Type">
              <select className="w-full p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 focus:border-transparent" value={profileForm.blood_type} onChange={(e) => setProfileForm({...profileForm, blood_type: e.target.value})}>
                <option value="">Select...</option>
                {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </FormField>
            <FormField label="Date of Birth">
              <input type="date" className="w-full p-4 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent" value={profileForm.date_of_birth} onChange={(e) => setProfileForm({...profileForm, date_of_birth: e.target.value})} />
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Weight (kg)">
                <input type="number" step="0.1" className="w-full p-4 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent" value={profileForm.weight} onChange={(e) => setProfileForm({...profileForm, weight: e.target.value})} />
              </FormField>
              <FormField label="Height (cm)">
                <input type="number" step="0.1" className="w-full p-4 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent" value={profileForm.height} onChange={(e) => setProfileForm({...profileForm, height: e.target.value})} />
              </FormField>
            </div>
            <FormField label="Emergency Contact Name">
              <input type="text" className="w-full p-4 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent" value={profileForm.emergency_contact_name} onChange={(e) => setProfileForm({...profileForm, emergency_contact_name: e.target.value})} />
            </FormField>
            <FormField label="Emergency Contact Phone">
              <input type="tel" className="w-full p-4 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent" value={profileForm.emergency_contact_phone} onChange={(e) => setProfileForm({...profileForm, emergency_contact_phone: e.target.value})} />
            </FormField>
            <ModalButtons onCancel={() => setShowProfileModal(false)} submitText="Save Changes" color="teal" />
          </form>
        </Modal>
      )}

      {/* Allergy Modal */}
      {showAllergyModal && (
        <Modal title={`${editingAllergy ? 'Edit' : 'Add'} Allergy`} onClose={() => setShowAllergyModal(false)}>
          <form onSubmit={handleSaveAllergy} className="space-y-5">
            <FormField label="Allergy Type *">
              <select className="w-full p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 focus:border-transparent" value={allergyForm.allergy_type} onChange={(e) => setAllergyForm({...allergyForm, allergy_type: e.target.value})} required>
                <option value="drug">Drug/Medication</option>
                <option value="food">Food</option>
                <option value="environmental">Environmental</option>
                <option value="other">Other</option>
              </select>
            </FormField>
            <FormField label="Allergen Name *">
              <input type="text" className="w-full p-4 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent" placeholder="e.g., Penicillin, Peanuts" value={allergyForm.allergen} onChange={(e) => setAllergyForm({...allergyForm, allergen: e.target.value})} required />
            </FormField>
            <FormField label="Severity *">
              <select className="w-full p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 focus:border-transparent" value={allergyForm.severity} onChange={(e) => setAllergyForm({...allergyForm, severity: e.target.value})} required>
                <option value="mild">Mild</option>
                <option value="moderate">Moderate</option>
                <option value="severe">Severe</option>
                <option value="life_threatening">Life Threatening</option>
              </select>
            </FormField>
            <FormField label="Reaction Description">
              <textarea className="w-full p-4 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none" rows="2" placeholder="Describe the allergic reaction..." value={allergyForm.reaction} onChange={(e) => setAllergyForm({...allergyForm, reaction: e.target.value})} />
            </FormField>
            <ModalButtons onCancel={() => setShowAllergyModal(false)} submitText="Save Allergy" color="rose" />
          </form>
        </Modal>
      )}

      {/* Condition Modal */}
      {showConditionModal && (
        <Modal title={`${editingCondition ? 'Edit' : 'Add'} Condition`} onClose={() => setShowConditionModal(false)}>
          <form onSubmit={handleSaveCondition} className="space-y-5">
            <FormField label="Condition Name *">
              <input type="text" className="w-full p-4 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent" placeholder="e.g., Diabetes, Hypertension" value={conditionForm.condition_name} onChange={(e) => setConditionForm({...conditionForm, condition_name: e.target.value})} required />
            </FormField>
            <FormField label="Status">
              <select className="w-full p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 focus:border-transparent" value={conditionForm.status} onChange={(e) => setConditionForm({...conditionForm, status: e.target.value})}>
                <option value="active">Active</option>
                <option value="managed">Managed</option>
                <option value="resolved">Resolved</option>
              </select>
            </FormField>
            <FormField label="Diagnosis Date">
              <input type="date" className="w-full p-4 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent" value={conditionForm.diagnosis_date} onChange={(e) => setConditionForm({...conditionForm, diagnosis_date: e.target.value})} />
            </FormField>
            <FormField label="Notes">
              <textarea className="w-full p-4 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none" rows="2" value={conditionForm.notes} onChange={(e) => setConditionForm({...conditionForm, notes: e.target.value})} />
            </FormField>
            <ModalButtons onCancel={() => setShowConditionModal(false)} submitText="Save Condition" color="amber" />
          </form>
        </Modal>
      )}

      {/* Medication Modal */}
      {showMedicationModal && (
        <Modal title={`${editingMedication ? 'Edit' : 'Add'} Medication`} onClose={() => setShowMedicationModal(false)}>
          <form onSubmit={handleSaveMedication} className="space-y-5">
            <FormField label="Medication Name *">
              <input type="text" className="w-full p-4 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent" placeholder="e.g., Metformin" value={medicationForm.medication_name} onChange={(e) => setMedicationForm({...medicationForm, medication_name: e.target.value})} required />
            </FormField>
            <FormField label="Dosage *">
              <input type="text" className="w-full p-4 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent" placeholder="e.g., 500mg" value={medicationForm.dosage} onChange={(e) => setMedicationForm({...medicationForm, dosage: e.target.value})} required />
            </FormField>
            <FormField label="Frequency">
              <select className="w-full p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 focus:border-transparent" value={medicationForm.frequency} onChange={(e) => setMedicationForm({...medicationForm, frequency: e.target.value})}>
                <option value="once_daily">Once Daily</option>
                <option value="twice_daily">Twice Daily</option>
                <option value="three_daily">Three Times Daily</option>
                <option value="four_daily">Four Times Daily</option>
                <option value="as_needed">As Needed</option>
                <option value="weekly">Weekly</option>
              </select>
            </FormField>
            <FormField label="Reason for Taking">
              <input type="text" className="w-full p-4 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent" placeholder="e.g., Blood sugar control" value={medicationForm.reason} onChange={(e) => setMedicationForm({...medicationForm, reason: e.target.value})} />
            </FormField>
            <FormField label="Start Date">
              <input type="date" className="w-full p-4 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent" value={medicationForm.start_date} onChange={(e) => setMedicationForm({...medicationForm, start_date: e.target.value})} />
            </FormField>
            <ModalButtons onCancel={() => setShowMedicationModal(false)} submitText="Save Medication" color="emerald" />
          </form>
        </Modal>
      )}
    </div>
  );
};

// Reusable Components
const InfoCard = ({ icon, label, value }) => (
  <div className="flex items-center gap-4 p-5 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800">
    <div className="w-12 h-12 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center shadow-sm">
      {icon}
    </div>
    <div>
      <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{label}</p>
      <p className="font-semibold text-slate-800 dark:text-slate-100">{value}</p>
    </div>
  </div>
);

const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 w-full max-w-md shadow-2xl animate-scale-in border border-slate-100 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-display font-bold text-slate-800 dark:text-slate-100">{title}</h2>
        <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:bg-slate-800 rounded-xl transition-colors">
          <FiX className="text-slate-400 dark:text-slate-500" size={20} />
        </button>
      </div>
      {children}
    </div>
  </div>
);

const FormField = ({ label, children }) => (
  <div>
    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">{label}</label>
    {children}
  </div>
);

const ModalButtons = ({ onCancel, submitText, color }) => {
  const colorMap = {
    teal: 'from-teal-500 to-cyan-500 shadow-teal-500/30',
    rose: 'from-rose-500 to-red-500 shadow-rose-500/30',
    amber: 'from-amber-500 to-orange-500 shadow-amber-500/30',
    emerald: 'from-emerald-500 to-teal-500 shadow-emerald-500/30',
  };
  
  return (
    <div className="flex gap-3 pt-4">
      <button type="button" onClick={onCancel} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 rounded-xl font-semibold hover:bg-slate-200 transition-colors text-slate-700 dark:text-slate-200">
        Cancel
      </button>
      <button type="submit" className={`flex-1 py-4 bg-gradient-to-r ${colorMap[color]} text-white rounded-xl font-semibold hover:shadow-lg transition-all`}>
        {submitText}
      </button>
    </div>
  );
};

export default MedicalHistory;
