"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, ArrowLeft, Eye, EyeOff, Activity, Clock } from 'lucide-react';
import Link from 'next/link';
import { useModal } from '@/components/providers/ModalProvider';
import { useRouter } from 'next/navigation';

export default function UsersMaster() {
  const router = useRouter();
  const modal = useModal();
  const [data, setData] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [activityModal, setActivityModal] = useState<any | null>(null);
  const [userActivities, setUserActivities] = useState<any[]>([]);

  const [formData, setFormData] = useState({ 
    fullName: '', 
    email: '', 
    department: '', 
    role: 'staff',
    password: ''
  });

  useEffect(() => {
    // Check Auth
    const loggedUser = localStorage.getItem('nexus_logged_user');
    if (loggedUser) {
      try {
        const parsed = JSON.parse(loggedUser);
        const role = parsed.role?.toLowerCase();
        if (role === 'administrator' || role === 'admin') {
          setIsAuthorized(true);
        } else {
          router.push('/dashboard');
        }
      } catch (e) {}
    } else {
      router.push('/login');
    }

    // Load Users
    const saved = localStorage.getItem('nexus_users_db');
    if (saved) {
      setData(JSON.parse(saved));
    }

    // Load Departments
    const savedDepts = localStorage.getItem('ugz_master_department');
    if (savedDepts) {
      setDepartments(JSON.parse(savedDepts));
    }
    
    setIsLoading(false);
  }, [router]);

  const saveToLocal = (newData: any[]) => {
    setData(newData);
    localStorage.setItem('nexus_users_db', JSON.stringify(newData));
  };

  const handleSave = () => {
    if (!formData.fullName || !formData.email || !formData.role) {
      modal.alert("Peringatan", "Nama, Email, dan Role wajib diisi.");
      return;
    }
    
    if (isEditing) {
      const updated = data.map(item => 
        item.email === isEditing ? { 
          ...item, 
          fullName: formData.fullName,
          department: formData.department,
          role: formData.role,
          // Only update password if provided
          password: formData.password ? formData.password : item.password,
        } : item
      );
      saveToLocal(updated);
    } else {
      // Check if email already exists
      if (data.some(u => u.email === formData.email)) {
        modal.alert("Error", "Email sudah digunakan.");
        return;
      }
      if (!formData.password) {
        modal.alert("Peringatan", "Password wajib diisi untuk pengguna baru.");
        return;
      }
      
      const newItem = { 
        id: Date.now().toString(), 
        fullName: formData.fullName,
        email: formData.email,
        username: formData.email, // using email as username
        department: formData.department,
        role: formData.role,
        password: formData.password
      };
      saveToLocal([...data, newItem]);
    }
    
    setIsEditing(null);
    setFormData({ fullName: '', email: '', department: '', role: 'staff', password: '' });
    setIsModalOpen(false);
  };

  const handleDelete = async (email: string) => {
    if (email === 'admin@example.com') {
       modal.alert("Error", "Tidak dapat menghapus admin utama.");
       return;
    }
    if (await modal.confirm("Konfirmasi Hapus", "Apakah Anda yakin ingin menghapus pengguna ini?", true)) {
      saveToLocal(data.filter(item => item.email !== email));
    }
  };

  const startEdit = (item: any) => {
    if (item.email === 'admin@example.com') {
        modal.alert("Error", "Akun admin utama tidak bisa diedit di sini.");
        return;
    }
    setIsEditing(item.email);
    setFormData({ 
      fullName: item.fullName || '', 
      email: item.email || '', 
      department: item.department || '', 
      role: item.role || 'staff',
      password: '' // Don't show existing password
    });
    setIsModalOpen(true);
  };

  const viewActivity = (userEmail: string, userName: string) => {
    const appsStr = localStorage.getItem("ugz_applications");
    let activities: any[] = [];
    if (appsStr) {
      try {
        const apps = JSON.parse(appsStr);
        apps.forEach((app: any) => {
          if (app.history && Array.isArray(app.history)) {
            app.history.forEach((h: any) => {
              if (h.actorEmail === userEmail) {
                activities.push({
                  ...h,
                  candidateId: app.candidateId
                });
              }
            });
          }
        });
      } catch (e) {}
    }
    // Sort descending by date
    activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    // Total unique candidates handled
    const uniqueCandidates = new Set(activities.map(a => a.candidateId)).size;

    setUserActivities(activities);
    setActivityModal({ email: userEmail, name: userName, uniqueCandidates });
  };

  if (isLoading) return <div className="p-6">Loading...</div>;
  if (!isAuthorized) return <div className="p-6">Unauthorized access.</div>;

  return (
    <div className="space-y-6">
      <Link href="/dashboard" className="inline-flex items-center text-sm text-on-surface-variant hover:text-primary transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Dashboard
      </Link>

      <div className="bg-white rounded-lg shadow-sm border border-table-border overflow-hidden">
        <div className="p-6 border-b border-table-border flex justify-between items-center bg-surface-container-lowest">
          <div>
            <h2 className="text-lg font-bold text-primary">User Management</h2>
            <p className="text-xs text-on-surface-variant">Kelola akses pengguna (Admin, Manager, Staff)</p>
          </div>
          <button 
            onClick={() => { 
              setIsEditing(null); 
              setFormData({ fullName: "", email: "", department: "", role: "staff", password: "" }); 
              setIsModalOpen(true); 
            }}
            className="px-4 py-2 bg-primary text-white rounded text-sm hover:bg-primary-container transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add User
          </button>
        </div>

        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="px-6 py-4 border-b border-table-border flex justify-between items-center bg-surface-container-lowest">
                <h3 className="font-bold text-lg text-primary">
                  {isEditing ? "Edit User" : "Add New User"}
                </h3>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="text-on-surface-variant hover:text-status-error transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">Full Name</label>
                  <input 
                    type="text" 
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-3 py-2 border border-outline-variant rounded text-sm focus:outline-none focus:border-primary text-black"
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">Email / Username</label>
                  <input 
                    type="email" 
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={!!isEditing}
                    className="w-full px-3 py-2 border border-outline-variant rounded text-sm focus:outline-none focus:border-primary text-black disabled:bg-gray-100 disabled:text-gray-500"
                    placeholder="Enter email"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 border border-outline-variant rounded text-sm focus:outline-none focus:border-primary text-black"
                  >
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                    <option value="staff">Staff</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 border border-outline-variant rounded text-sm focus:outline-none focus:border-primary text-black"
                  >
                    <option value="">-- Select Department --</option>
                    {departments.map((dept: any) => (
                      <option key={dept.id} value={dept.name}>{dept.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    {isEditing ? "New Password (Leave blank to keep current)" : "Password"}
                  </label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-3 py-2 border border-outline-variant rounded text-sm focus:outline-none focus:border-primary text-black pr-10"
                      placeholder={isEditing ? "Leave blank to keep unchanged" : "Enter password"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 bg-surface-container-lowest border-t border-table-border flex justify-end gap-2">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-surface-container-high text-on-surface-variant rounded text-sm hover:bg-outline-variant transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-primary text-white rounded text-sm hover:bg-primary-container transition-colors flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {isEditing ? "Update User" : "Save User"}
                </button>
              </div>
            </div>
          </div>
        )}

        {activityModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="px-6 py-4 border-b border-table-border flex justify-between items-center bg-surface-container-lowest">
                <div>
                  <h3 className="font-bold text-lg text-primary">Activity Analytics</h3>
                  <p className="text-xs text-on-surface-variant">Staff: {activityModal.name}</p>
                </div>
                <button 
                  onClick={() => setActivityModal(null)}
                  className="text-on-surface-variant hover:text-status-error transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-primary/5 border border-primary/10 p-4 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="text-xs text-primary font-semibold uppercase tracking-wider mb-1">Total Activities</p>
                      <h4 className="text-2xl font-bold text-primary">{userActivities.length}</h4>
                    </div>
                    <Activity className="w-8 h-8 text-primary opacity-50" />
                  </div>
                  <div className="bg-secondary/5 border border-secondary/10 p-4 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="text-xs text-secondary font-semibold uppercase tracking-wider mb-1">Candidates Handled</p>
                      <h4 className="text-2xl font-bold text-secondary">{activityModal.uniqueCandidates}</h4>
                    </div>
                    <Eye className="w-8 h-8 text-secondary opacity-50" />
                  </div>
                </div>

                <h4 className="font-semibold text-sm mb-3">Recent Activities</h4>
                <div className="max-h-[40vh] overflow-y-auto custom-scrollbar border border-table-border rounded-lg">
                  {userActivities.length === 0 ? (
                    <div className="p-6 text-center text-sm text-on-surface-variant">
                      Belum ada aktivitas yang terekam.
                    </div>
                  ) : (
                    <div className="divide-y divide-table-border">
                      {userActivities.map((act, i) => (
                        <div key={i} className="p-3 hover:bg-surface-container-low transition-colors flex gap-3 items-start">
                          <div className="mt-0.5 w-6 h-6 rounded-full bg-surface-container flex items-center justify-center shrink-0">
                            <Clock className="w-3 h-3 text-on-surface-variant" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-black">
                              Moved candidate to <span className="font-bold text-primary">{act.stageName}</span>
                            </p>
                            <p className="text-xs text-on-surface-variant mt-0.5">
                              {new Date(act.date).toLocaleString('id-ID')}
                            </p>
                            {act.note && (
                              <p className="text-xs text-red-600 bg-red-50 p-1.5 mt-1 rounded border border-red-100">
                                <span className="font-semibold">Note:</span> {act.note}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="px-6 py-4 bg-surface-container-lowest border-t border-table-border flex justify-end">
                <button
                  onClick={() => setActivityModal(null)}
                  className="px-4 py-2 bg-surface-container-high text-on-surface-variant rounded text-sm hover:bg-outline-variant transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-on-surface bg-table-header-bg uppercase border-b border-table-border">
              <tr>
                <th className="px-6 py-3 w-16">No</th>
                <th className="px-6 py-3">Full Name</th>
                <th className="px-6 py-3">Email / Username</th>
                <th className="px-6 py-3">Role</th>
                <th className="px-6 py-3">Department</th>
                <th className="px-6 py-3 text-right w-32">Actions</th>
              </tr>
            </thead>
            <tbody>
              {/* Default Admin */}
              <tr className="bg-white border-b border-table-border hover:bg-surface-container-low/50">
                <td className="px-6 py-4">1</td>
                <td className="px-6 py-4 font-medium text-black">Admin DPP</td>
                <td className="px-6 py-4 text-on-surface-variant">admin@example.com</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full">
                    Administrator
                  </span>
                </td>
                <td className="px-6 py-4">-</td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => viewActivity('admin@example.com', 'Admin DPP')} className="text-secondary hover:text-secondary-container mr-3" title="View Activity">
                    <Activity className="w-4 h-4 inline" />
                  </button>
                  <span className="text-xs text-on-surface-variant italic">Default Admin</span>
                </td>
              </tr>
              {data.map((item, index) => (
                <tr key={item.email} className="bg-white border-b border-table-border hover:bg-surface-container-low/50">
                  <td className="px-6 py-4">{index + 2}</td>
                  <td className="px-6 py-4 font-medium text-black">{item.fullName}</td>
                  <td className="px-6 py-4 text-on-surface-variant">{item.email}</td>
                  <td className="px-6 py-4">
                     <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        item.role?.toLowerCase() === 'admin' ? 'bg-primary/10 text-primary' : 
                        item.role?.toLowerCase() === 'manager' ? 'bg-secondary/10 text-secondary' : 
                        'bg-surface-variant text-on-surface-variant'
                     }`}>
                        {item.role || 'staff'}
                     </span>
                  </td>
                  <td className="px-6 py-4">{item.department || '-'}</td>
                  <td className="px-6 py-4 text-right flex justify-end items-center">
                    <button onClick={() => viewActivity(item.email, item.fullName)} className="text-secondary hover:text-secondary-container mr-3" title="View Activity">
                      <Activity className="w-4 h-4 inline" />
                    </button>
                    <button onClick={() => startEdit(item)} className="text-primary hover:text-primary-container mr-3" title="Edit">
                      <Edit2 className="w-4 h-4 inline" />
                    </button>
                    <button onClick={() => handleDelete(item.email)} className="text-status-error hover:text-red-700" title="Delete">
                      <Trash2 className="w-4 h-4 inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
