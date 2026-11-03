"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, ShieldAlert, Search, Download, RefreshCw } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface AuditLogEntry {
  id: string;
  actorId: string | null;
  actorEmail: string | null;
  actorRole: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
}

const ACTION_FILTERS = [
  "",
  "AUTH_LOGIN_SUCCESS",
  "AUTH_LOGIN_FAILED",
  "AUTH_LOGIN_RATE_LIMITED",
  "USER_CREATED",
  "USER_UPDATED",
  "USER_PASSWORD_RESET",
  "USER_DELETED",
  "JOB_CREATED",
  "STAGE_MOVED",
  "CANDIDATE_BLACKLISTED",
  "DOCUMENT_UPLOADED",
  "DOCUMENT_ACCESSED",
];

export default function AuditLogsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (actionFilter) params.set("action", actionFilter);
      if (search.trim()) params.set("search", search.trim());
      params.set("limit", "200");

      const res = await fetch(`/api/audit-logs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (error) {
      console.error("Failed to fetch audit logs:", error);
    } finally {
      setIsLoading(false);
    }
  }, [actionFilter, search]);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if ((session?.user as any)?.role === "ADMIN") {
      setIsAuthorized(true);
      fetchLogs();
    } else {
      router.push("/dashboard");
    }
  }, [session, status, router, fetchLogs]);

  const handleExportCsv = () => {
    const headers = [
      "Timestamp",
      "Actor Email",
      "Actor Role",
      "Action",
      "Entity Type",
      "Entity ID",
      "Metadata",
    ];
    const rows = logs.map((log) => [
      new Date(log.createdAt).toISOString(),
      log.actorEmail || "-",
      log.actorRole || "-",
      log.action,
      log.entityType,
      log.entityId || "-",
      log.metadata ? JSON.stringify(log.metadata).replace(/"/g, '""') : "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((r) => r.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (status === "loading") {
    return <div className="p-6 font-medium text-primary">Loading Audit Logs...</div>;
  }

  if (!isAuthorized) {
    return (
      <div className="p-6 font-medium text-red-600">
        Unauthorized access. Only Super Admin can view Audit Logs.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center text-sm text-on-surface-variant hover:text-primary transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Dashboard
      </Link>

      <div className="bg-white rounded-lg shadow-sm border border-table-border overflow-hidden">
        <div className="p-6 border-b border-table-border flex flex-col md:flex-row md:justify-between md:items-center gap-4 bg-surface-container-lowest">
          <div>
            <h2 className="text-lg font-bold text-primary flex items-center gap-2">
              <ShieldAlert className="w-5 h-5" /> System Audit Logs
            </h2>
            <p className="text-xs text-on-surface-variant">
              Jejak aktivitas keamanan, manajemen user, perubahan tahapan, dan akses dokumen (Kepatuhan UU PDP)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchLogs}
              className="px-3 py-2 border border-outline-variant rounded text-xs font-semibold text-on-surface hover:bg-surface-container-low transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
            <button
              onClick={handleExportCsv}
              disabled={logs.length === 0}
              className="px-4 py-2 bg-primary text-white rounded text-xs font-semibold hover:bg-primary-container transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="p-4 border-b border-table-border bg-surface-container-low/20 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchLogs()}
              placeholder="Cari berdasarkan email aktor, aksi, atau ID entitas..."
              className="w-full pl-9 pr-3 py-2 border border-outline-variant rounded text-sm text-black focus:outline-none focus:border-primary"
            />
          </div>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-2 border border-outline-variant rounded text-sm text-black focus:outline-none focus:border-primary"
          >
            <option value="">Semua Jenis Aksi</option>
            {ACTION_FILTERS.filter(Boolean).map((act) => (
              <option key={act} value={act}>
                {act}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-on-surface bg-table-header-bg uppercase border-b border-table-border">
              <tr>
                <th className="px-4 py-3">Waktu</th>
                <th className="px-4 py-3">Aktor</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Aksi</th>
                <th className="px-4 py-3">Entitas</th>
                <th className="px-4 py-3">Detail Metadata</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr
                  key={log.id}
                  className="bg-white border-b border-table-border hover:bg-surface-container-low/50"
                >
                  <td className="px-4 py-3 text-xs text-on-surface-variant whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString("id-ID")}
                  </td>
                  <td className="px-4 py-3 font-medium text-black">
                    {log.actorEmail || "-"}
                  </td>
                  <td className="px-4 py-3 text-xs text-on-surface-variant">
                    {log.actorRole || "-"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 text-xs font-mono font-semibold rounded bg-primary/10 text-primary">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-on-surface-variant">
                    <span className="font-semibold text-on-surface">{log.entityType}</span>
                    {log.entityId ? ` (${log.entityId})` : ""}
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-on-surface-variant max-w-md truncate">
                    {log.metadata ? JSON.stringify(log.metadata) : "-"}
                  </td>
                </tr>
              ))}
              {!isLoading && logs.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-on-surface-variant italic"
                  >
                    Belum ada catatan audit log yang sesuai filter.
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

