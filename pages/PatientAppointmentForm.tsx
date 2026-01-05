
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar as CalendarIcon, Clock, MapPin, Stethoscope, ChevronRight, X, ClipboardCheck, Info, CheckCircle2, DollarSign, Timer, CreditCard } from 'lucide-react';
import { db, KEYS } from '../utils/storage';
import { Branch, DoctorProfile, Appointment, AppointmentStatus, PatientProfile, DoctorWeeklySchedule, DoctorScheduleOverride, OverrideStatus } from '../types';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const PatientAppointmentForm: React.FC = () => {
  const navigate = useNavigate();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [patientProfile, setPatientProfile] = useState<PatientProfile | null>(null);
  const [doctorSchedules, setDoctorSchedules] = useState<DoctorWeeklySchedule[]>([]);
  
  // Slot Logic State
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);

  const [formData, setFormData] = useState({
    branchId: '',
    doctorId: '',
    date: '',
    startTime: '',
    reason: '',
    notes: ''
  });

  useEffect(() => {
    const user = db.getCurrentUser();
    if (!user) return;
    
    const profiles = db.getTable<PatientProfile>(KEYS.PATIENTS);
    const profile = profiles.find(p => p.userId === user.id);
    setPatientProfile(profile || null);

    setBranches(db.getTable<Branch>(KEYS.BRANCHES));
    
    const allDocs = db.getTable<DoctorProfile>(KEYS.DOCTORS);
    const allUsers = db.getTable<any>(KEYS.USERS);
    setDoctors(allDocs.map(d => ({ ...d, user: allUsers.find((u: any) => u.id === d.userId) })));
  }, []);

  // Fetch schedules when doctor is selected
  useEffect(() => {
    if (formData.doctorId) {
      const allSchedules = db.getTable<DoctorWeeklySchedule>(KEYS.DOCTOR_SCHEDULES);
      setDoctorSchedules(allSchedules.filter(s => s.doctorId === formData.doctorId));
    } else {
      setDoctorSchedules([]);
    }
  }, [formData.doctorId]);

  // Recalculate slots whenever doctor or date changes
  useEffect(() => {
    if (formData.doctorId && formData.date) {
      calculateSlots();
    }
  }, [formData.doctorId, formData.date]);

  const calculateSlots = () => {
    setIsCalculating(true);
    const dateObj = new Date(formData.date);
    const dayOfWeek = dateObj.getDay();
    
    const selectedDoc = doctors.find(d => d.id === formData.doctorId);
    const slotDuration = selectedDoc?.slotDuration || 30;

    // 1. Get Base Weekly Schedule
    const weeklySchedules = db.getTable<DoctorWeeklySchedule>(KEYS.DOCTOR_SCHEDULES);
    const baseSched = weeklySchedules.find(s => s.doctorId === formData.doctorId && s.dayOfWeek === dayOfWeek && s.isActive);
    
    if (!baseSched) {
      setAvailableSlots([]);
      setIsCalculating(false);
      return;
    }

    // 2. Check Overrides (Leave/Shift Change)
    const overrides = db.getTable<DoctorScheduleOverride>(KEYS.DOCTOR_OVERRIDES);
    const activeOverride = overrides.find(o => 
      o.doctorId === formData.doctorId && 
      o.date === formData.date && 
      o.status === OverrideStatus.APPROVED
    );

    if (activeOverride?.type === 'LEAVE') {
      setAvailableSlots([]);
      setIsCalculating(false);
      return;
    }

    const start = activeOverride?.startTime || baseSched.startTime;
    const end = activeOverride?.endTime || baseSched.endTime;

    // 3. Generate slots based on doctor's slotDuration
    const slots: string[] = [];
    let current = new Date(`2000-01-01T${start}`);
    const final = new Date(`2000-01-01T${end}`);

    while (current < final) {
      slots.push(current.toTimeString().substring(0, 5));
      current.setMinutes(current.getMinutes() + slotDuration);
    }

    // 4. Filter existing appointments
    const allAppointments = db.getTable<Appointment>(KEYS.APPOINTMENTS);
    const occupied = allAppointments
      .filter(a => a.doctorId === formData.doctorId && a.appointmentDate === formData.date && a.status !== AppointmentStatus.CANCELLED)
      .map(a => a.startTime);

    setAvailableSlots(slots.filter(s => !occupied.includes(s)));
    setIsCalculating(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientProfile || !formData.startTime) return;

    const selectedDoc = doctors.find(d => d.id === formData.doctorId);
    const duration = selectedDoc?.slotDuration || 30;

    // Calculate End Time
    const [h, m] = formData.startTime.split(':');
    const end = new Date(2000, 0, 1, parseInt(h), parseInt(m) + duration);

    const newAppointment: Appointment = {
      id: `app_${Date.now()}`,
      appointmentNo: `APP-${Math.floor(Math.random() * 90000) + 10000}`,
      patientId: patientProfile.id,
      branchId: formData.branchId,
      doctorId: formData.doctorId,
      appointmentDate: formData.date,
      startTime: formData.startTime,
      endTime: end.toTimeString().substring(0, 5),
      dateTime: `${formData.date}T${formData.startTime}:00`,
      duration: duration,
      status: AppointmentStatus.PENDING,
      reason: formData.reason,
      type: 'Routine Checkup',
      notes: formData.notes,
      reminderSent: false,
      createdAt: new Date().toISOString()
    };

    db.saveToTable(KEYS.APPOINTMENTS, newAppointment);
    alert("Appointment request submitted successfully!");
    navigate('/appointments');
  };

  const selectedDoctor = doctors.find(d => d.id === formData.doctorId);
  const selectedBranch = branches.find(b => b.id === formData.branchId);

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <CalendarIcon className="text-blue-600" /> Book an Appointment
          </h1>
          <p className="text-slate-500 mt-1">Select a specialist and pick an available time slot.</p>
        </div>
        <button onClick={() => navigate(-1)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-all">
          <X size={24} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-8">
            {/* Step 1: Branch & Doctor */}
            <div className="space-y-4">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <Stethoscope size={18} className="text-blue-600" /> 1. Choose Specialist
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select
                  required
                  value={formData.branchId}
                  onChange={(e) => setFormData(prev => ({ ...prev, branchId: e.target.value, doctorId: '', startTime: '' }))}
                  className="bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="">Select Branch</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                <select
                  required
                  disabled={!formData.branchId}
                  value={formData.doctorId}
                  onChange={(e) => setFormData(prev => ({ ...prev, doctorId: e.target.value, startTime: '' }))}
                  className="bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm font-bold text-blue-600 outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50"
                >
                  <option value="">Select Doctor</option>
                  {doctors.filter(d => !formData.branchId || d.branchId === formData.branchId).map(doc => (
                    <option key={doc.id} value={doc.id}>{doc.user?.name} - {doc.specialization}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Step 2: Date & Slots */}
            <div className="space-y-4">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <CalendarIcon size={18} className="text-blue-600" /> 2. Select Date
              </label>
              <input 
                required
                disabled={!formData.doctorId}
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value, startTime: '' }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-600 transition-all disabled:opacity-50"
              />

              {formData.date && (
                <div className="space-y-4 pt-4">
                  <div className="flex items-center justify-between ml-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Available Slots</p>
                    {selectedDoctor && (
                       <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Timer size={10} /> {selectedDoctor.slotDuration} min per session
                       </span>
                    )}
                  </div>
                  {isCalculating ? (
                    <div className="text-center py-6 text-slate-400 text-sm font-medium animate-pulse">Calculating availability...</div>
                  ) : availableSlots.length === 0 ? (
                    <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100 flex items-center gap-2 text-rose-600 text-sm font-medium">
                      <Info size={16} /> No slots available for this doctor on selected date.
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                      {availableSlots.map(slot => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, startTime: slot }))}
                          className={`py-2 px-1 rounded-xl border-2 text-xs font-bold transition-all ${
                            formData.startTime === slot 
                            ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100' 
                            : 'border-slate-100 bg-slate-50 text-slate-600 hover:border-blue-200 hover:bg-white'
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Step 3: Reason */}
            <div className="space-y-4">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                 <ClipboardCheck size={18} className="text-blue-600" /> 3. Additional Details
              </label>
              <input
                required
                placeholder="Reason for visit (e.g. Follow-up, Chest Pain)"
                value={formData.reason}
                onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-600 transition-all"
              />
              <textarea
                placeholder="Any notes for the doctor..."
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm h-24 outline-none focus:ring-2 focus:ring-blue-600 transition-all resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={!formData.startTime}
              className="w-full bg-blue-600 text-white rounded-2xl py-4 font-bold shadow-xl shadow-blue-100 hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center justify-center gap-3 group"
            >
              Confirm Request <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </form>

        <div className="space-y-6">
          {/* Doctor Profile Info Card */}
          {selectedDoctor && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-right-4">
              <div className="flex items-center gap-4 mb-6">
                <img src={`https://picsum.photos/seed/${selectedDoctor.id}/64/64`} className="w-16 h-16 rounded-2xl border border-slate-200" alt="" />
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{selectedDoctor.user?.name}</h3>
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">{selectedDoctor.specialization}</p>
                  <p className="text-[10px] text-slate-400 font-medium mt-1">License: {selectedDoctor.licenseNumber}</p>
                </div>
              </div>

              <div className="space-y-4">
                 <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                    <div className="flex items-center gap-2 text-slate-500 text-sm">
                       <DollarSign size={16} /> Consultation Fee
                    </div>
                    <span className="font-bold text-slate-900">${selectedDoctor.consultationFee}</span>
                 </div>
                 <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                    <div className="flex items-center gap-2 text-slate-500 text-sm">
                       <Timer size={16} /> Slot Duration
                    </div>
                    <span className="font-bold text-slate-900">{selectedDoctor.slotDuration} mins</span>
                 </div>
                 <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                    <div className="flex items-center gap-2 text-slate-500 text-sm">
                       <MapPin size={16} /> Facility
                    </div>
                    <span className="font-bold text-slate-900">{selectedBranch?.name || 'Loading...'}</span>
                 </div>
              </div>

              {/* Weekly Schedule Visibility */}
              <div className="mt-8">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                   <Clock size={14} /> Weekly Schedule
                </h4>
                <div className="space-y-2">
                  {DAYS.map((day, idx) => {
                    const sched = doctorSchedules.find(s => s.dayOfWeek === idx);
                    return (
                      <div key={day} className={`flex items-center justify-between text-xs py-1.5 ${sched?.isActive ? 'text-slate-700' : 'text-slate-300 italic'}`}>
                        <span className="font-semibold">{day}</span>
                        <span>{sched?.isActive ? `${sched.startTime} - ${sched.endTime}` : 'Unavailable'}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
               <Info size={18} className="text-blue-600" /> Booking Summary
            </h3>
            <div className="space-y-4">
              {formData.date && formData.startTime && (
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                    <CheckCircle2 size={16} /> Ready to Book
                  </div>
                  <p className="text-xs text-emerald-600 leading-relaxed">
                    You've selected a <b>{selectedDoctor?.slotDuration}</b> minute slot on <b>{formData.date}</b> at <b>{formData.startTime}</b>.
                  </p>
                </div>
              )}
              {!formData.doctorId && (
                <div className="text-center py-4 text-slate-400 text-sm italic">
                  Select a doctor to view their profile and available hours.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientAppointmentForm;
