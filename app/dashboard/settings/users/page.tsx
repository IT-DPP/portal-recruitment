"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, ArrowLeft, Eye, EyeOff, Shield } from 'lucide-react';
import Link from 'next/link';
import { useModal } from '@/components/providers/ModalProvider';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { getDepartments } from '@/app/actions/master-data';

export default function UsersMaster() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const modal = useModal();
  
  const [data, setData] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    department: '', 
    role: 'RECRUITER',
    password: ''
  });

  const loadUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const users = await res.json();
        setData(users);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (status === 'loading') return;
    
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if ((session?.user as any)?.role === 'ADMIN') {
      setIsAuthorized(true);
      loadUsers();
      // Load departments from DB
      getDepartments().then(res => {
        if (res.success && res.data) {
          setDepartments(res.data);
        }
      });
      setIsLoading(false);
    } else {
      router.push('/dashboard');
    }
  }, [session, status, router]);

  const handleSave = async () => {
    if (!formData.name || !formData.email || !formData.role) {
      modal.alert("Peringatan", "Nama, Email, dan Role wajib diisi.");
      return;
    }
    
    setIsSubmitting(true);
    if (isEditing) {
      try {
        const res = await fetch(`/api/users/${isEditing}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            department: formData.department,
            role: formData.role,
            password: formData.password || undefined
          })
        });
        const result = await res.json();
        if (res.ok) {
          await loadUsers();
          modal.alert("Sukses", "User berhasil diperbarui");
          setIsModalOpen(false);
        } else {
          modal.alert("Error", result.message || "Gagal memperbarui user");
        }
      } catch (e) {
        modal.alert("Error", "Terjadi kesalahan server");
      }
    } else {
      if (!formData.password) {
        modal.alert("Peringatan", "Password wajib diisi untuk pengguna baru.");
        setIsSubmitting(false);
        return;
      }
      try {
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        const result = await res.json();
        if (res.ok) {
          await loadUsers();
          modal.alert("Sukses", "User berhasil dibuat");
          setIsModalOpen(false);
        } else {
          modal.alert("Error", result.message || "Gagal membuat user");
        }
      } catch (e) {
        modal.alert("Error", "Terjadi kesalahan server");
      }
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string, email: string) => {
    if (email === 'admin@example.com' || id === (session?.user as any)?.id) {
       modal.alert("Error", "Tidak dapat menghapus admin utama atau diri sendiri.");
       return;
    }
    if (await modal.confirm("Konfirmasi Hapus", "Apakah Anda yakin ingin menghapus pengguna ini?", true)) {
      setIsSubmitting(true);
      try {
        const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
        if (res.ok) {
          await loadUsers();
          modal.alert("Sukses", "User berhasil dihapus");
        } else {
          const result = await res.json();
          modal.alert("Error", result.message || "Gagal menghapus user");
        }
      } catch (e) {
        modal.alert("Error", "Terjadi kesalahan server");
      }
      setIsSubmitting(false);
    }
  };

  const startEdit = (item: any) => {
    if (item.email === 'admin@example.com') {
        modal.alert("Info", "Akun admin utama dilindungi oleh sistem.");
        return;
    }
    setIsEditing(item.id);
    setFormData({ 
      name: item.name || '', 
      email: item.email || '', 
      department: item.department || '', 
      role: item.role || 'RECRUITER',
      password: ''
    });
    setIsModalOpen(true);
  };

  if (status === 'loading' || isLoading) return <div className="p-6 font-medium text-primary">Loading User Data...</div>;
  if (!isAuthorized) return <div className="p-6 font-medium text-red-600">Unauthorized access. Only Admin can access this page.</div>;

  return (
    <div className="space-y-6">
      <Link href="/dashboard" className="inline-flex items-center text-sm text-on-surface-variant hover:text-primary transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Dashboard
      </Link>

      <div className="bg-white rounded-lg shadow-sm border border-table-border overflow-hidden">
        <div className="p-6 border-b border-table-border flex justify-between items-center bg-surface-container-lowest">
          <div>
            <h2 className="text-lg font-bold text-primary">Staff Management</h2>
            <p className="text-xs text-on-surface-variant">Kelola akses pengguna internal (Admin & Recruiter)</p>
          </div>
          <button 
            onClick={() => { 
              setIsEditing(null); 
              setFormData({ name: "", email: "", department: "", role: "RECRUITER", password: "" }); 
              setIsModalOpen(true); 
            }}
            className="px-4 py-2 bg-primary text-white rounded text-sm hover:bg-primary-container transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Staff
          </button>
        </div>

        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="px-6 py-4 border-b border-table-border flex justify-between items-center bg-surface-container-lowest">
                <h3 className="font-bold text-lg text-primary">
                  {isEditing ? "Edit Staff" : "Add New Staff"}
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
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                    <option value="ADMIN">Admin</option>
                    <option value="RECRUITER">Recruiter</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">Department (Optional)</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 border border-outline-variant rounded text-sm focus:outline-none focus:border-primary text-black"
                  >
                    <option value="">-- No Department --</option>
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
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-surface-container-high text-on-surface-variant rounded text-sm hover:bg-outline-variant transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-primary text-white rounded text-sm hover:bg-primary-container transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {isSubmitting ? "Processing..." : isEditing ? "Update Staff" : "Save Staff"}
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
              {data.map((item, index) => (
                <tr key={item.id} className="bg-white border-b border-table-border hover:bg-surface-container-low/50">
                  <td className="px-6 py-4 text-on-surface-variant">{index + 1}</td>
                  <td className="px-6 py-4 font-medium text-black flex items-center gap-2">
                    {item.email === 'admin@example.com' && <span title="Primary Admin"><Shield className="w-4 h-4 text-primary" /></span>}
                    {item.name || "No Name"}
                  </td>
                  <td className="px-6 py-4 text-on-surface-variant">{item.email}</td>
                  <td className="px-6 py-4">
                     <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        item.role === 'ADMIN' ? 'bg-primary/10 text-primary' : 
                        item.role === 'RECRUITER' ? 'bg-secondary/10 text-secondary' : 
                        'bg-surface-variant text-on-surface-variant'
                     }`}>
                        {item.role}
                     </span>
                  </td>
                  <td className="px-6 py-4 text-on-surface-variant">{item.department || '-'}</td>
                  <td className="px-6 py-4 text-right flex justify-end items-center gap-3">
                    <button onClick={() => startEdit(item)} className="text-primary hover:text-primary-container" title="Edit">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {item.email !== 'admin@example.com' && item.id !== (session?.user as any)?.id && (
                      <button onClick={() => handleDelete(item.id, item.email)} className="text-status-error hover:text-red-700" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-on-surface-variant italic">
                    Tidak ada data pengguna ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
