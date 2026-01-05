
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Stethoscope, Search, MapPin, Clock, Timer, DollarSign, Calendar, ChevronRight, Filter } from 'lucide-react';
import { db, KEYS } from '../utils/storage';
import { DoctorProfile, DoctorWeeklySchedule, Branch } from '../types';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const DoctorDirectory: React.FC = () => {
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [schedules, setSchedules] = useState<DoctorWeeklySchedule[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState('All');

  useEffect(() => {
    const docs = db.getTable<DoctorProfile>(KEYS.DOCTORS);
    const users = db.getTable<any>(KEYS.USERS);
    const enriched = docs.map(d => ({
      ...d,
      user: users.find((u: any) => u.id === d.userId)
    }));
    
    setDoctors(enriched);
    setBranches(db.getTable<Branch>(KEYS.BRANCHES));
    setSchedules(db.getTable<DoctorWeeklySchedule>(KEYS.DOCTOR_SCHEDULES));
  }, []);

  const specializations = ['All', ...Array.from(new Set(doctors.map(d => d.specialization)))];

  const filtered = doctors.filter(d => {
    const matchesSearch = d.user?.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         d.specialization.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSpec = selectedSpecialization === 'All' || d.specialization === selectedSpecialization;
    return matchesSearch && matchesSpec;
  });

  const getBranchName = (id: string) => branches.find(b => b.id === id)?.name || 'Loading...';

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Stethoscope className="text-blue-600" /> Specialist Directory
          </h1>
          <p className="text-slate-500 text-sm">Browse our network of world-class medical professionals.</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" placeholder="Search by name or specialty..." 
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-600 transition-all"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter size={18} className="text-slate-400 ml-2" />
          <select 
            value={selectedSpecialization} onChange={(e) => setSelectedSpecialization(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 outline-none flex-1 md:w-48"
          >
            {specializations.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filtered.map((doctor) => {
          const docSchedules = schedules.filter(s => s.doctorId === doctor.id && s.isActive);
          
          return (
            <div key={doctor.id} className="bg-white rounded-[2rem] border border-slate-200 shadow-sm hover:border-blue-300 transition-all group relative overflow-hidden flex flex-col">
              <div className="p-8 pb-4">
                <div className="flex items-start gap-5 mb-6">
                  <img src={`https://picsum.photos/seed/${doctor.id}/80/80`} className="w-20 h-20 rounded-2xl border border-slate-200 shadow-sm" alt="" />
                  <div className="pt-1">
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-tight">{doctor.user?.name}</h3>
                    <p className="text-xs font-bold text-blue-500 uppercase tracking-widest mt-1">{doctor.specialization}</p>
                    <div className="flex items-center gap-1.5 mt-2 text-slate-400">
                      <MapPin size={12} />
                      <span className="text-[10px] font-bold uppercase">{getBranchName(doctor.branchId)}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="p-3 bg-slate-50 rounded-2xl flex items-center gap-2">
                    <DollarSign size={14} className="text-emerald-500" />
                    <div>
                      <p className="text-[8px] font-bold text-slate-400 uppercase">Consultation</p>
                      <p className="text-xs font-bold text-slate-900">${doctor.consultationFee}</p>
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-2xl flex items-center gap-2">
                    <Timer size={14} className="text-blue-500" />
                    <div>
                      <p className="text-[8px] font-bold text-slate-400 uppercase">Slot Time</p>
                      <p className="text-xs font-bold text-slate-900">{doctor.slotDuration}m</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Clock size={12} /> Weekly Hours
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {DAYS.map((day, idx) => {
                      const active = docSchedules.some(s => s.dayOfWeek === idx);
                      return (
                        <div key={day} className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                          active ? 'bg-blue-50 border-blue-100 text-blue-600' : 'bg-slate-50 border-transparent text-slate-300'
                        }`}>
                          {day.substring(0, 3)}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="mt-auto p-6 pt-2">
                <Link 
                  to="/book-appointment" 
                  className="w-full flex items-center justify-center gap-2 py-3 bg-slate-900 text-white rounded-2xl text-xs font-bold hover:bg-slate-800 transition-all group-hover:shadow-lg active:scale-95"
                >
                  Schedule Appointment <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DoctorDirectory;
