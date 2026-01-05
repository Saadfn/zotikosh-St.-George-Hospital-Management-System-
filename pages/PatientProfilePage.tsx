
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User as UserIcon, HeartPulse, MapPin, Phone, Calendar, Save, Loader2, ClipboardCheck, AlertTriangle } from 'lucide-react';
import { db, KEYS } from '../utils/storage';
import { User, PatientProfile } from '../types';

const PatientProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    dob: '',
    gender: 'Male',
    bloodGroup: 'O+',
    address: '',
    emergencyContact: '',
    emergencyPhone: '',
    allergies: '',
    medicalHistory: ''
  });

  useEffect(() => {
    const currentUser = db.getCurrentUser();
    if (!currentUser) {
      navigate('/login');
      return;
    }
    setUser(currentUser);
    setFormData(prev => ({ ...prev, name: currentUser.name, phone: currentUser.phone }));
    
    // Check if patient profile already exists
    const patients = db.getTable<PatientProfile>(KEYS.PATIENTS);
    const existing = patients.find(p => p.userId === currentUser.id);
    if (existing) {
      setFormData({
        name: currentUser.name,
        phone: currentUser.phone,
        dob: existing.dateOfBirth,
        gender: existing.gender,
        bloodGroup: existing.bloodGroup,
        address: existing.address || '',
        emergencyContact: existing.emergencyContact || '',
        emergencyPhone: existing.emergencyPhone || '',
        allergies: existing.allergies || '',
        medicalHistory: existing.medicalHistory || ''
      });
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsLoading(true);

    await new Promise(resolve => setTimeout(resolve, 1000));

    // 1. Update User Record
    db.updateInTable<User>(KEYS.USERS, user.id, { 
      name: formData.name, 
      phone: formData.phone,
      isProfileComplete: true 
    });

    // 2. Create/Update Patient Profile
    const patients = db.getTable<PatientProfile>(KEYS.PATIENTS);
    const existingIdx = patients.findIndex(p => p.userId === user.id);
    
    const patientData: PatientProfile = {
      id: existingIdx !== -1 ? patients[existingIdx].id : `p_${Date.now()}`,
      userId: user.id,
      patientId: existingIdx !== -1 ? patients[existingIdx].patientId : `PAT-${Math.floor(Math.random() * 9000) + 1000}`,
      dateOfBirth: formData.dob,
      gender: formData.gender,
      bloodGroup: formData.bloodGroup,
      address: formData.address,
      emergencyContact: formData.emergencyContact,
      emergencyPhone: formData.emergencyPhone,
      allergies: formData.allergies,
      medicalHistory: formData.medicalHistory
    };

    if (existingIdx !== -1) {
      db.updateInTable<PatientProfile>(KEYS.PATIENTS, patientData.id, patientData);
    } else {
      db.saveToTable(KEYS.PATIENTS, patientData);
    }

    // Update session
    const updatedUser = { ...user, name: formData.name, phone: formData.phone, isProfileComplete: true };
    localStorage.setItem(KEYS.SESSION, JSON.stringify(updatedUser));

    alert("Profile saved successfully!");
    navigate('/');
    setIsLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <ClipboardCheck className="text-blue-600" /> Complete Your Profile
        </h1>
        <p className="text-slate-500 mt-1">Please provide your medical details to enable all portal features.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <UserIcon size={16} /> Basic Account Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Full Name*</label>
              <input name="name" required value={formData.name} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-blue-600 outline-none" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Phone Number*</label>
              <input name="phone" required value={formData.phone} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-blue-600 outline-none" />
            </div>
          </div>
        </section>

        <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <h3 className="text-sm font-bold text-orange-600 uppercase tracking-widest flex items-center gap-2">
            <HeartPulse size={16} /> Medical Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Date of Birth*</label>
              <input type="date" name="dob" required value={formData.dob} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Gender</label>
                <select name="gender" value={formData.gender} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm">
                  <option>Male</option><option>Female</option><option>Other</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Blood Group</label>
                <select name="bloodGroup" value={formData.bloodGroup} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm">
                  <option>A+</option><option>O+</option><option>B+</option><option>AB+</option><option>A-</option><option>O-</option>
                </select>
              </div>
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Full Address</label>
              <input name="address" value={formData.address} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm" />
            </div>
          </div>
        </section>

        <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Phone size={16} /> Emergency Contact
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Contact Name</label>
              <input name="emergencyContact" value={formData.emergencyContact} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Emergency Phone</label>
              <input name="emergencyPhone" value={formData.emergencyPhone} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm" />
            </div>
          </div>
        </section>

        <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <h3 className="text-sm font-bold text-rose-600 uppercase tracking-widest flex items-center gap-2">
            <AlertTriangle size={16} /> Allergies & Medical History
          </h3>
          <div className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Allergies (if any)</label>
              <textarea name="allergies" value={formData.allergies} onChange={handleInputChange} placeholder="E.g. Penicillin, Peanuts..." className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm h-24 resize-none focus:ring-2 focus:ring-blue-600 outline-none" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Medical History Summary</label>
              <textarea name="medicalHistory" value={formData.medicalHistory} onChange={handleInputChange} placeholder="Previous surgeries, chronic conditions..." className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm h-32 resize-none focus:ring-2 focus:ring-blue-600 outline-none" />
            </div>
          </div>
        </section>

        <button 
          type="submit" disabled={isLoading}
          className="w-full bg-blue-600 text-white rounded-3xl py-5 font-bold shadow-xl shadow-blue-100 hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center justify-center gap-3 group"
        >
          {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
          Complete Registration & Save Profile
        </button>
      </form>
    </div>
  );
};

export default PatientProfilePage;
