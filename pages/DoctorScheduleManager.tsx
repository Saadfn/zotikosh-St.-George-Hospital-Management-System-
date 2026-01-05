
import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Check, X, AlertCircle, User, Building2, ChevronRight, Save } from 'lucide-react';
import { db, KEYS } from '../utils/storage';
import { DoctorProfile, DoctorWeeklySchedule, DoctorScheduleOverride, OverrideStatus } from '../types';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const DoctorScheduleManager: React.FC = () => {
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [weeklySchedules, setWeeklySchedules] = useState<DoctorWeeklySchedule[]>([]);
  const [overrides, setOverrides] = useState<DoctorScheduleOverride[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const docs = db.getTable<DoctorProfile>(KEYS.DOCTORS);
    const users = db.getTable<any>(KEYS.USERS);
    const enrichedDocs = docs.map(d => ({
      ...d,
      user: users.find((u: any) => u.id === d.userId)
    }));
    setDoctors(enrichedDocs);
    if (enrichedDocs.length > 0) setSelectedDoctorId(enrichedDocs[0].id);
    
    setWeeklySchedules(db.getTable<DoctorWeeklySchedule>(KEYS.DOCTOR_SCHEDULES));
    setOverrides(db.getTable<DoctorScheduleOverride>(KEYS.DOCTOR_OVERRIDES));
  }, []);

  const doctorSchedules = weeklySchedules.filter(s => s.doctorId === selectedDoctorId);
  const pendingOverrides = overrides.filter(o => o.status === OverrideStatus.PENDING);

  const handleUpdateSchedule = (day: number, field: string, value: string | boolean) => {
    const existing = weeklySchedules.find(s => s.doctorId === selectedDoctorId && s.dayOfWeek === day);
    let updated;
    
    if (existing) {
      updated = weeklySchedules.map(s => 
        (s.doctorId === selectedDoctorId && s.dayOfWeek === day) ? { ...s, [field]: value } : s
      );
    } else {
      const newSched: DoctorWeeklySchedule = {
        id: `ws_${Date.now()}_${day}`,
        doctorId: selectedDoctorId,
        dayOfWeek: day,
        startTime: '09:00',
        endTime: '17:00',
        isActive: false,
        ...({ [field]: value })
      };
      updated = [...weeklySchedules, newSched];
    }
    
    setWeeklySchedules(updated);
    localStorage.setItem(KEYS.DOCTOR_SCHEDULES, JSON.stringify(updated));
  };

  const handleOverrideAction = (id: string, status: OverrideStatus) => {
    const updated = db.updateInTable<DoctorScheduleOverride>(KEYS.DOCTOR_OVERRIDES, id, { status });
    setOverrides(updated);
  };

  const getDocName = (id: string) => doctors.find(d => d.id === id)?.user?.name || 'Unknown';

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <Clock className="text-blue-600" /> Physician Scheduling
          </h1>
          <p className="text-slate-500 text-sm">Define base hours and manage leave requests.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Weekly Schedule Manager */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-slate-900">Base Weekly Hours</h3>
              <select 
                value={selectedDoctorId} 
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-blue-600 outline-none"
              >
                {doctors.map(d => <option key={d.id} value={d.id}>{d.user?.name}</option>)}
              </select>
            </div>

            <div className="space-y-3">
              {DAYS.map((dayName, idx) => {
                const sched = doctorSchedules.find(s => s.dayOfWeek === idx);
                return (
                  <div key={idx} className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${
                    sched?.isActive ? 'bg-white border-blue-100 shadow-sm' : 'bg-slate-50 border-transparent opacity-60'
                  }`}>
                    <div className="flex items-center gap-4">
                      <input 
                        type="checkbox" 
                        checked={sched?.isActive || false}
                        onChange={(e) => handleUpdateSchedule(idx, 'isActive', e.target.checked)}
                        className="w-5 h-5 rounded-lg border-slate-300 text-blue-600 focus:ring-blue-500" 
                      />
                      <span className="font-bold text-slate-700 w-24">{dayName}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-slate-400" />
                        <input 
                          type="time" 
                          value={sched?.startTime || '09:00'} 
                          disabled={!sched?.isActive}
                          onChange={(e) => handleUpdateSchedule(idx, 'startTime', e.target.value)}
                          className="bg-transparent border-none text-sm font-semibold text-slate-900 p-0 focus:ring-0"
                        />
                      </div>
                      <span className="text-slate-300">to</span>
                      <div className="flex items-center gap-2">
                        <input 
                          type="time" 
                          value={sched?.endTime || '17:00'} 
                          disabled={!sched?.isActive}
                          onChange={(e) => handleUpdateSchedule(idx, 'endTime', e.target.value)}
                          className="bg-transparent border-none text-sm font-semibold text-slate-900 p-0 focus:ring-0"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-8 flex items-center gap-3 p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50">
              <AlertCircle className="text-blue-500 shrink-0" size={20} />
              <p className="text-xs text-blue-800 leading-relaxed font-medium">
                Changes to weekly schedules apply immediately to the patient booking calendar. 
                Existing appointments are not automatically rescheduled.
              </p>
            </div>
          </div>
        </div>

        {/* Pending Requests Sidebar */}
        <div className="space-y-6">
          <div className="bg-slate-900 p-6 rounded-3xl text-white shadow-xl">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Calendar className="text-blue-400" /> Pending Requests
            </h3>
            <div className="space-y-4">
              {pendingOverrides.length === 0 ? (
                <p className="text-slate-500 text-sm italic py-4">No pending leave or shift requests.</p>
              ) : (
                pendingOverrides.map(ov => (
                  <div key={ov.id} className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-3">
                    <div className="flex items-center gap-2">
                      <img src={`https://picsum.photos/seed/${ov.doctorId}/32/32`} className="w-8 h-8 rounded-full border border-white/20" alt="" />
                      <div>
                        <p className="text-sm font-bold">{getDocName(ov.doctorId)}</p>
                        <p className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">{ov.type}</p>
                      </div>
                    </div>
                    <div className="text-xs space-y-1">
                      <p className="flex justify-between text-slate-400">Date: <span className="text-white">{ov.date}</span></p>
                      {ov.type === 'SHIFT_CHANGE' && (
                        <p className="flex justify-between text-slate-400">Hours: <span className="text-white">{ov.startTime} - {ov.endTime}</span></p>
                      )}
                      <p className="text-slate-400 italic">"{ov.reason}"</p>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button 
                        onClick={() => handleOverrideAction(ov.id, OverrideStatus.APPROVED)}
                        className="flex-1 py-2 bg-emerald-500/20 text-emerald-400 rounded-xl text-xs font-bold hover:bg-emerald-500/30 transition-all flex items-center justify-center gap-1"
                      >
                        <Check size={14} /> Approve
                      </button>
                      <button 
                        onClick={() => handleOverrideAction(ov.id, OverrideStatus.DECLINED)}
                        className="flex-1 py-2 bg-rose-500/20 text-rose-400 rounded-xl text-xs font-bold hover:bg-rose-500/30 transition-all flex items-center justify-center gap-1"
                      >
                        <X size={14} /> Decline
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorScheduleManager;
