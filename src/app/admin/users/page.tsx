"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Shield,
  ToggleLeft,
  ToggleRight,
  Search,
  X,
  Eye,
  EyeOff,
  Check,
} from "lucide-react";

const PERMISSION_GROUPS: Record<string, string[]> = {
  Dashboard: ["dashboard.view"],
  Trips: ["trips.view", "trips.create", "trips.edit", "trips.delete"],
  Settings: ["settings.view", "settings.edit"],
  Users: ["users.view", "users.create", "users.edit", "users.disable", "users.delete", "users.permissions"],
  Logs: ["logs.view"],
  Storage: ["storage.upload", "storage.delete"],
};

const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

interface UserRow {
  id: string;
  name: string;
  username: string;
  role: string;
  isDisabled: boolean;
  createdAt: string;
  permissions?: string[];
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [permUser, setPermUser] = useState<UserRow | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id: string; role: string } | null>(null);
  const [myPermissions, setMyPermissions] = useState<string[]>([]);

  const fetchUsers = useCallback(async () => {
    const res = await fetch("/api/admin/users");
    const data = await res.json();
    if (data.users) setUsers(data.users);
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const [usersRes, meRes] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/admin/me"),
      ]);
      const usersData = await usersRes.json();
      const meData = await meRes.json();
      if (!cancelled) {
        if (usersData.users) setUsers(usersData.users);
        if (meData.user) setCurrentUser(meData.user);
        if (meData.permissions) setMyPermissions(meData.permissions);
        setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const isOwner = currentUser?.role === "owner";
  const hasPerm = (p: string) => isOwner || myPermissions.includes(p);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.username.toLowerCase().includes(q) ||
      u.name.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  });

  const handleToggleDisable = async (u: UserRow) => {
    if (!isOwner && u.role === "owner") return;
    await fetch(`/api/admin/users/${u.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isDisabled: !u.isDisabled }),
    });
    fetchUsers();
  };

  const handleDelete = async (u: UserRow) => {
    if (!confirm(`Delete user "${u.username}"? This cannot be undone.`)) return;
    await fetch(`/api/admin/users/${u.id}`, { method: "DELETE" });
    fetchUsers();
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-light text-[#1C1E21] tracking-tight">
            User Management
          </h1>
          <p className="text-xs sm:text-sm text-[#6B7280] mt-1">
            Manage admin users, roles, and permissions.
          </p>
        </div>
        {hasPerm("users.create") && (
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1C1E21] text-white text-xs font-semibold hover:bg-[#2A3A4A] transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Create User</span>
          </button>
        )}
      </div>

      <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-[#E5E0D8] shadow-2xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users..."
            className="w-full pl-10 pr-4 py-1.5 rounded-xl border border-[#E5E0D8] text-xs font-medium focus:ring-2 focus:ring-[#4B6B5B]/20 outline-hidden"
          />
        </div>
        <div className="text-xs text-[#6B7280]">
          Total: <span className="font-semibold text-[#1C1E21]">{filtered.length}</span> users
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-[#E5E0D8] overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#FAF9F6] border-b border-[#E5E0D8] text-[#6B7280] uppercase font-semibold">
                <th className="py-3.5 px-5">User</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Created</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EFEA]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-[#6B7280]">
                    Loading users...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-[#6B7280]">
                    No users found.
                  </td>
                </tr>
              ) : (
                filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-stone-50/60 transition-colors">
                    <td className="py-4 px-5">
                      <div>
                        <span className="font-semibold text-[#1C1E21]">{u.username}</span>
                        <span className="text-[#6B7280] ml-2">{u.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        u.role === "owner"
                          ? "bg-amber-50 text-amber-700"
                          : u.role === "admin"
                          ? "bg-blue-50 text-blue-700"
                          : "bg-stone-100 text-stone-600"
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <button
                        onClick={() => hasPerm("users.disable") && handleToggleDisable(u)}
                        disabled={!hasPerm("users.disable")}
                        className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                          u.isDisabled ? "text-red-500" : "text-emerald-600"
                        } ${isOwner ? "cursor-pointer hover:underline" : "cursor-default"}`}
                      >
                        {u.isDisabled ? <ToggleLeft className="w-3.5 h-3.5" /> : <ToggleRight className="w-3.5 h-3.5" />}
                        {u.isDisabled ? "Disabled" : "Active"}
                      </button>
                    </td>
                    <td className="py-4 px-4 text-[#6B7280]">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="py-4 px-5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => setEditUser(u)}
                          className="p-1.5 rounded-lg border border-[#E5E0D8] text-[#1C1E21] hover:bg-stone-100 transition-colors"
                          title="Edit user"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setPermUser(u)}
                          className="p-1.5 rounded-lg border border-[#E5E0D8] text-[#1C1E21] hover:bg-stone-100 transition-colors"
                          title="Manage permissions"
                        >
                          <Shield className="w-3.5 h-3.5" />
                        </button>
                        {u.role !== "owner" && hasPerm("users.delete") && (
                          <button
                            onClick={() => handleDelete(u)}
                            className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete user"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showCreate && (
        <CreateUserModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); fetchUsers(); }} />
      )}
      {editUser && hasPerm("users.edit") && (
        <EditUserModal user={editUser} onClose={() => setEditUser(null)} onSaved={() => { setEditUser(null); fetchUsers(); }} />
      )}
      {permUser && (
        <PermissionsModal user={permUser} onClose={() => setPermUser(null)} onSaved={() => { setPermUser(null); fetchUsers(); }} canEdit={hasPerm("users.permissions")} />
      )}
    </div>
  );
}

function CreateUserModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<"admin" | "staff">("staff");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!PASSWORD_RE.test(password)) {
      setError("Password must be at least 8 characters with uppercase, lowercase, number, and special character.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, fullName, username, role }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Failed to create user.");
      return;
    }
    onCreated();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl border border-[#E5E0D8] p-6 sm:p-8 w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-[#1C1E21]">Create User</h2>
          <button onClick={onClose} className="text-stone-400 hover:text-[#1C1E21]"><X className="w-5 h-5" /></button>
        </div>
        {error && <div className="p-3 mb-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">{error}</div>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#374151]">Full Name</label>
            <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="px-3.5 py-2.5 rounded-xl border border-[#E5E0D8] text-xs sm:text-sm focus:ring-2 focus:ring-[#4B6B5B]/20 outline-hidden" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#374151]">Username</label>
            <input type="text" required value={username} onChange={(e) => setUsername(e.target.value)} className="px-3.5 py-2.5 rounded-xl border border-[#E5E0D8] text-xs sm:text-sm focus:ring-2 focus:ring-[#4B6B5B]/20 outline-hidden" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#374151]">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="px-3.5 py-2.5 rounded-xl border border-[#E5E0D8] text-xs sm:text-sm focus:ring-2 focus:ring-[#4B6B5B]/20 outline-hidden" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#374151]">Password</label>
            <div className="relative">
              <input type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-[#E5E0D8] text-xs sm:text-sm focus:ring-2 focus:ring-[#4B6B5B]/20 outline-hidden" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-[#9CA3AF] hover:text-[#6B7280]" tabIndex={-1}>
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#374151]">Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value as "admin" | "staff")} className="px-3.5 py-2.5 rounded-xl border border-[#E5E0D8] text-xs sm:text-sm focus:ring-2 focus:ring-[#4B6B5B]/20 outline-hidden">
              <option value="admin">Admin</option>
              <option value="staff">Staff</option>
            </select>
          </div>
          <button type="submit" disabled={loading} className="w-full py-3 px-6 rounded-xl bg-[#1C1E21] hover:bg-[#2A3A4A] text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-75">
            {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><span>Create User</span><Plus className="w-4 h-4" /></>}
          </button>
        </form>
      </div>
    </div>
  );
}

function EditUserModal({ user, onClose, onSaved }: { user: UserRow; onClose: () => void; onSaved: () => void }) {
  const [fullName, setFullName] = useState(user.name);
  const [role, setRole] = useState(user.role);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, role }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || "Failed to update."); return; }
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl border border-[#E5E0D8] p-6 sm:p-8 w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-[#1C1E21]">Edit User: {user.username}</h2>
          <button onClick={onClose} className="text-stone-400 hover:text-[#1C1E21]"><X className="w-5 h-5" /></button>
        </div>
        {error && <div className="p-3 mb-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">{error}</div>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#374151]">Full Name</label>
            <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="px-3.5 py-2.5 rounded-xl border border-[#E5E0D8] text-xs sm:text-sm focus:ring-2 focus:ring-[#4B6B5B]/20 outline-hidden" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#374151]">Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} disabled={role === "owner"} className="px-3.5 py-2.5 rounded-xl border border-[#E5E0D8] text-xs sm:text-sm focus:ring-2 focus:ring-[#4B6B5B]/20 outline-hidden disabled:opacity-50">
              <option value="owner">Owner</option>
              <option value="admin">Admin</option>
              <option value="staff">Staff</option>
            </select>
          </div>
          <button type="submit" disabled={loading} className="w-full py-3 px-6 rounded-xl bg-[#1C1E21] hover:bg-[#2A3A4A] text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-75">
            {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <span>Save Changes</span>}
          </button>
        </form>
      </div>
    </div>
  );
}

function PermissionsModal({ user, onClose, onSaved, canEdit }: { user: UserRow; onClose: () => void; onSaved: () => void; canEdit: boolean }) {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/admin/users/${user.id}/permissions`)
      .then((r) => r.json())
      .then((data) => { setPermissions(data.permissions || []); setLoading(false); });
  }, [user.id]);

  const toggle = (perm: string) => {
    setPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    const res = await fetch(`/api/admin/users/${user.id}/permissions`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ permissions }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error || "Failed to save."); return; }
    onSaved();
  };

  const canEditPerms = canEdit && user.role !== "owner";

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl border border-[#E5E0D8] p-6 sm:p-8 w-full max-w-lg shadow-xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-[#1C1E21]">Permissions: {user.username}</h2>
          <button onClick={onClose} className="text-stone-400 hover:text-[#1C1E21]"><X className="w-5 h-5" /></button>
        </div>
        {error && <div className="p-3 mb-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">{error}</div>}
        {loading ? (
          <div className="py-10 text-center text-[#6B7280]">Loading...</div>
        ) : (
          <div className="flex flex-col gap-4">
            {Object.entries(PERMISSION_GROUPS).map(([group, perms]) => (
              <div key={group}>
                <h3 className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-2">{group}</h3>
                <div className="flex flex-wrap gap-2">
                  {perms.map((perm) => (
                    <button
                      key={perm}
                      onClick={() => canEditPerms && toggle(perm)}
                      disabled={!canEditPerms}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        permissions.includes(perm)
                          ? "bg-[#4B6B5B] text-white"
                          : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                      } ${!canEdit ? "opacity-50 cursor-default" : "cursor-pointer"}`}
                    >
                      {permissions.includes(perm) && <Check className="w-3 h-3" />}
                      {perm}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {canEditPerms && (
              <button onClick={handleSave} disabled={saving} className="w-full py-3 px-6 rounded-xl bg-[#1C1E21] hover:bg-[#2A3A4A] text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-75 mt-4">
                {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <span>Save Permissions</span>}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
