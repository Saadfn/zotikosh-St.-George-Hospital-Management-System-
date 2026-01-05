
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Calendar as CalendarIcon, Clock, MapPin, Search, Plus, Filter, Download, 
  ChevronRight, MoreVertical, CheckCircle2, XCircle, Clock4, AlertCircle 
} from 'lucide-react';
import { Appointment, UserRole, AppointmentStatus } from '../types';
import { db, KEYS } from '../utils/storage';
import { exportToCSV } from '../utils/csvExport';

const AppointmentList: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = db.getCurrentUser();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  useEffect(() => {
    const allApps = db.getTable<Appointment>(KEYS.APPOINTMENTS);
    const docs = db.getTable<any>(KEYS.DOCTORS);
    const pats = db.getTable<any>(KEYS.PATIENTS);
    const users = db.getTable<any>(KEYS.USERS);

    // Enriching data for display immutably
    const enriched = allApps.map(app => {
      const doc = docs.find((d: any) => d.id === app.doctorId);
      const pat = pats.find((p: any) => p.id === app.patientId);
      
      const enrichedDoc = doc ? {
        ...doc,
        user: users.find((u: any) => u.id === doc.userId)
      } : null;

      const enrichedPat = pat ? {
        ...pat,
        user: users.find((u: any) => u.id === pat.userId)
      } : null;

      return { 
        ...app, 
        doctor: enrichedDoc, 
        patient: enrichedPat 
      };
    });

    // If patient, filter to show only their own
    if (currentUser?.role === UserRole.PATIENT) {
      const patientProfile = pats.find((p: any) => p.userId === currentUser.id);
      setAppointments(enriched.filter(a => a.patientId === patientProfile?.id));
    } else {
      setAppointments(enriched);
    }
  }, []); // Run only on mount to prevent infinite loops from db.getCurrentUser() reference changes

  const handleStatusChange = (appId: string, newStatus: AppointmentStatus) => {
    const allApps = db.getTable<Appointment>(KEYS.APPOINTMENTS);
    const updated = allApps.map(app => 
      app.id === appId ? { ...app, status: newStatus } : app
    );
    localStorage.setItem(KEYS.APPOINTMENTS, JSON.stringify(updated));
    
    // Refresh local state (keep enrichment)
    setAppointments(prev => prev.map(a => a.id === appId ? { ...a, status: newStatus } : a));
  };

  const handleExport = () => {
    exportToCSV(appointments, 'StGeorge_Appointments');
  };

  const filtered = appointments.filter(a => {
    const patientName = a.patient?.user?.name || '';
    const doctorName = a.doctor?.user?.name || '';
    const matchesSearch = a.appointmentNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doctorName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusStyle = (status: AppointmentStatus) => {
    switch (status) {
      case AppointmentStatus.CONFIRMED: return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case AppointmentStatus.PENDING: return 'bg-amber-50 text-amber-600 border-amber-100';
      case AppointmentStatus.CANCELLED: return 'bg-rose-50 text-rose-600 border-rose-100';
      case AppointmentStatus.COMPLETED: return 'bg-blue-50 text-blue-600 border-blue-100';
      default: return 'bg-slate-50 text-slate-500 border-slate-100';
    }
  };

  const getStatusIcon = (status: AppointmentStatus) => {
    switch (status) {
      case AppointmentStatus.CONFIRMED: return <CheckCircle2 size={14} />;
      case AppointmentStatus.PENDING: return <Clock4 size={14} />;
      case AppointmentStatus.CANCELLED: return <XCircle size={14} />;
      case AppointmentStatus.COMPLETED: return <CheckCircle2 size={14} />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {currentUser?.role === UserRole.ADMIN ? 'Global Appointments' : 'My Appointments'}
          </h1>
          <p className="text-slate-500 text-sm">
            {currentUser?.role === UserRole.ADMIN 
              ? 'Comprehensive view of all hospital schedules and requests.' 
              : 'Keep track of your medical visits and follow-ups.'}
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-sm"
          >
            <Download size={18} /> Export
          </button>
          {currentUser?.role === UserRole.PATIENT && (
            <button 
              onClick={() => navigate('/book-appointment')}
              className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 shadow-lg shadow-blue-100 flex items-center gap-2"
            >
              <Plus size={18} /> Request Appointment
            </button>
          )}
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by ID, Patient or Doctor..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-sm w-full outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 outline-none"
          >
            <option value="ALL">All Status</option>
            <option value={AppointmentStatus.PENDING}>Pending</option>
            <option value={AppointmentStatus.CONFIRMED}>Confirmed</option>
            <option value={AppointmentStatus.COMPLETED}>Completed</option>
            <option value={AppointmentStatus.CANCELLED}>Cancelled</option>
          </select>
        </div>
      </div>

      {currentUser?.role === UserRole.ADMIN ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">ID / Date</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Patient</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Doctor</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Reason</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Status Update</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-widest">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-xs font-bold text-blue-600 font-mono">{app.appointmentNo}</p>
                      <p className="text-sm font-bold text-slate-900 mt-0.5">{new Date(app.dateTime).toLocaleDateString()}</p>
                      <p className="text-xs text-slate-500 flex items-center gap-1"><Clock size={12}/> {new Date(app.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <img src={`https://picsum.photos/seed/${app.patientId}/32/32`} className="w-8 h-8 rounded-full border border-slate-200" alt="" />
                        <div>
                          <p className="text-sm font-bold text-slate-900">{app.patient?.user?.name || 'Unknown Patient'}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">{app.patient?.patientId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-slate-700">{app.doctor?.user?.name || 'Unknown Doctor'}</p>
                      <p className="text-[10px] text-blue-500 font-bold uppercase">{app.doctor?.specialization}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-600 italic truncate max-w-[150px]">"{app.reason}"</p>
                    </td>
                    <td className="px-6 py-4">
                      <select 
                        value={app.status}
                        onChange={(e) => handleStatusChange(app.id, e.target.value as AppointmentStatus)}
                        className={`text-xs font-bold px-2.5 py-1.5 rounded-lg border outline-none transition-all ${getStatusStyle(app.status)}`}
                      >
                        <option value={AppointmentStatus.PENDING}>PENDING</option>
                        <option value={AppointmentStatus.CONFIRMED}>CONFIRMED</option>
                        <option value={AppointmentStatus.COMPLETED}>COMPLETED</option>
                        <option value={AppointmentStatus.CANCELLED}>CANCELLED</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 text-slate-400 hover:text-slate-600"><MoreVertical size={18} /></button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium italic">No appointments found matching criteria.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((app) => (
            <div key={app.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:border-blue-300 transition-all group">
              <div className="flex justify-between items-start mb-6">
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusStyle(app.status)}`}>
                  {getStatusIcon(app.status)}
                  {app.status}
                </div>
                <p className="text-[10px] font-bold text-slate-400 font-mono">{app.appointmentNo}</p>
              </div>

              <h4 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{app.doctor?.user?.name || 'Unknown Doctor'}</h4>
              <p className="text-xs font-bold text-blue-500 uppercase tracking-widest mt-1 mb-6">{app.doctor?.specialization}</p>

              <div className="space-y-3 pt-6 border-t border-slate-50">
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <CalendarIcon size={16} className="text-slate-400" />
                  {new Date(app.dateTime).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Clock size={16} className="text-slate-400" />
                  {new Date(app.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <AlertCircle size={16} className="text-slate-400" />
                  <span className="truncate italic">"{app.reason}"</span>
                </div>
              </div>

              <div className="mt-8">
                <button className="w-full py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-50 transition-all">
                  Reschedule
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="lg:col-span-3 py-20 text-center flex flex-col items-center gap-4">
              <div className="p-4 bg-slate-50 rounded-full text-slate-300">
                <CalendarIcon size={48} />
              </div>
              <div>
                <p className="text-slate-500 font-medium">You have no upcoming appointments.</p>
                <Link to="/book-appointment" className="text-blue-600 font-bold hover:underline mt-2 inline-block">Request your first appointment</Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AppointmentList;
