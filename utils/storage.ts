
import { User, PatientProfile, DoctorProfile, Branch, Appointment, MedicalRecord, Medicine, Inventory, Bill, DoctorWeeklySchedule, DoctorScheduleOverride } from '../types';
import { mockUsers, mockPatients, mockDoctors, mockBranches, mockAppointments, mockRecords, mockInventory, mockBills } from '../mockData';

const KEYS = {
  USERS: 'aura_users',
  PATIENTS: 'aura_patients',
  DOCTORS: 'aura_doctors',
  STAFF: 'aura_staff',
  BRANCHES: 'aura_branches',
  APPOINTMENTS: 'aura_appointments',
  RECORDS: 'aura_records',
  MEDICINES: 'aura_medicines',
  INVENTORY: 'aura_inventory',
  BILLS: 'aura_bills',
  DOCTOR_SCHEDULES: 'aura_dr_schedules',
  DOCTOR_OVERRIDES: 'aura_dr_overrides',
  LAB_TEST_TYPES: 'aura_lab_tests',
  ROOMS: 'aura_rooms',
  SESSION: 'aura_session'
};

export const db = {
  init: () => {
    if (!localStorage.getItem(KEYS.USERS)) {
      localStorage.setItem(KEYS.USERS, JSON.stringify(mockUsers));
      localStorage.setItem(KEYS.PATIENTS, JSON.stringify(mockPatients));
      localStorage.setItem(KEYS.DOCTORS, JSON.stringify(mockDoctors));
      localStorage.setItem(KEYS.BRANCHES, JSON.stringify(mockBranches));
      localStorage.setItem(KEYS.APPOINTMENTS, JSON.stringify(mockAppointments));
      localStorage.setItem(KEYS.RECORDS, JSON.stringify(mockRecords));
      localStorage.setItem(KEYS.INVENTORY, JSON.stringify(mockInventory));
      localStorage.setItem(KEYS.BILLS, JSON.stringify(mockBills));
      localStorage.setItem(KEYS.STAFF, JSON.stringify([]));
      localStorage.setItem(KEYS.MEDICINES, JSON.stringify([]));
      localStorage.setItem(KEYS.DOCTOR_SCHEDULES, JSON.stringify([]));
      localStorage.setItem(KEYS.DOCTOR_OVERRIDES, JSON.stringify([]));
      localStorage.setItem(KEYS.LAB_TEST_TYPES, JSON.stringify([]));
      localStorage.setItem(KEYS.ROOMS, JSON.stringify([]));
    }
  },

  getTable: <T>(key: string): T[] => {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  },

  saveToTable: <T>(key: string, item: T) => {
    const table = db.getTable<T>(key);
    const updatedTable = [item, ...table];
    localStorage.setItem(key, JSON.stringify(updatedTable));
    return updatedTable;
  },

  updateInTable: <T extends { id: string }>(key: string, id: string, updates: Partial<T>) => {
    const table = db.getTable<T>(key);
    const updatedTable = table.map(item => item.id === id ? { ...item, ...updates } : item);
    localStorage.setItem(key, JSON.stringify(updatedTable));
    return updatedTable;
  },

  login: (email: string, password: string): User | null => {
    const users = db.getTable<User>(KEYS.USERS);
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (user && password === "123") {
      localStorage.setItem(KEYS.SESSION, JSON.stringify(user));
      return user;
    }
    return null;
  },

  logout: () => {
    localStorage.removeItem(KEYS.SESSION);
    window.location.reload();
  },

  getCurrentUser: (): User | null => {
    const session = localStorage.getItem(KEYS.SESSION);
    return session ? JSON.parse(session) : null;
  },

  clear: () => {
    localStorage.clear();
    window.location.reload();
  }
};

export { KEYS };
