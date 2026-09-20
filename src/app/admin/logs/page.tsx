"use client";

import React, { useState, useEffect } from "react";
import { Search, Filter, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { AuditDetailModal } from "@/components/admin/AuditDetailModal";

interface AuditLogEntry {
  id: string;
  actorUsername: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  description: string;
  beforeData?: Record<string, unknown>;
  afterData?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

interface AuditLogsResponse {
  logs: AuditLogEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const ACTIONS = ["CREATE", "UPDATE", "DELETE", "LOGIN", "LOGOUT", "DENIED"] as const;
const RESOURCES = ["User", "Trip", "Settings", "Permissions", "Auth", "Storage"] as const;

const ACTION_COLORS: Record<string, string> = {
  CREATE: "bg-emerald-50 text-emerald-700",
  UPDATE: "bg-blue-50 text-blue-700",
  DELETE: "bg-red-50 text-red-700",
  LOGIN: "bg-purple-50 text-purple-700",
  LOGOUT: "bg-stone-100 text-stone-600",
  DENIED: "bg-red-100 text-red-800",
};

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [resourceFilter, setResourceFilter] = useState("");
  const [actorFilter, setActorFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [detailLog, setDetailLog] = useState<AuditLogEntry | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const limit = 20;

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(limit));
      if (search) params.set("search", search);
      if (actionFilter) params.set("action", actionFilter);
      if (resourceFilter) params.set("resource", resourceFilter);
      if (actorFilter) params.set("actor", actorFilter);
      if (fromDate) params.set("from", fromDate);
      if (toDate) params.set("to", toDate);

      try {
        const res = await fetch(`/api/admin/audit?${params.toString()}`);
        const data: AuditLogsResponse = await res.json();
        if (!cancelled) {
          setLogs(data.logs || []);
          setTotalPages(data.totalPages || 1);
          setTotal(data.total || 0);
        }
      } catch {
        if (!cancelled) setLogs([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [page, search, actionFilter, resourceFilter, actorFilter, fromDate, toDate]);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const hasActiveFilters = actionFilter || resourceFilter || actorFilter || fromDate || toDate;

  return (
    <div className="flex flex-col gap-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-light text-[#1C1E21] tracking-tight">
            Audit Logs
          </h1>
          <p className="text-xs sm:text-sm text-[#6B7280] mt-1">
            Track all admin actions, authentication events, and system changes.
          </p>
        </div>
        <div className="text-xs text-[#6B7280]">
          Total: <span className="font-semibold text-[#1C1E21]">{total}</span> entries
        </div>
      </div>

      <div className="flex flex-col gap-3 p-4 rounded-2xl bg-white border border-[#E5E0D8] shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search logs..."
              className="w-full pl-10 pr-4 py-1.5 rounded-xl border border-[#E5E0D8] text-xs font-medium focus:ring-2 focus:ring-[#4B6B5B]/20 outline-hidden"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-xl border text-xs font-semibold transition-colors ${
              showFilters || hasActiveFilters
                ? "bg-[#1C1E21] text-white border-[#1C1E21]"
                : "bg-white text-[#6B7280] border-[#E5E0D8] hover:bg-stone-50"
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            Filters
            {hasActiveFilters && (
              <span className="ml-1 w-1.5 h-1.5 rounded-full bg-[#4B6B5B]" />
            )}
          </button>
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-3 pt-3 border-t border-[#F0EFEA]">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-[#6B7280] uppercase">Action</label>
              <select
                value={actionFilter}
                onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
                className="px-3 py-1.5 rounded-xl border border-[#E5E0D8] text-xs font-medium focus:ring-2 focus:ring-[#4B6B5B]/20 outline-hidden"
              >
                <option value="">All Actions</option>
                {ACTIONS.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-[#6B7280] uppercase">Resource</label>
              <select
                value={resourceFilter}
                onChange={(e) => { setResourceFilter(e.target.value); setPage(1); }}
                className="px-3 py-1.5 rounded-xl border border-[#E5E0D8] text-xs font-medium focus:ring-2 focus:ring-[#4B6B5B]/20 outline-hidden"
              >
                <option value="">All Resources</option>
                {RESOURCES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-[#6B7280] uppercase">Actor</label>
              <input
                type="text"
                value={actorFilter}
                onChange={(e) => { setActorFilter(e.target.value); setPage(1); }}
                placeholder="Username..."
                className="px-3 py-1.5 rounded-xl border border-[#E5E0D8] text-xs font-medium focus:ring-2 focus:ring-[#4B6B5B]/20 outline-hidden"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-[#6B7280] uppercase">From</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
                className="px-3 py-1.5 rounded-xl border border-[#E5E0D8] text-xs font-medium focus:ring-2 focus:ring-[#4B6B5B]/20 outline-hidden"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-[#6B7280] uppercase">To</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => { setToDate(e.target.value); setPage(1); }}
                className="px-3 py-1.5 rounded-xl border border-[#E5E0D8] text-xs font-medium focus:ring-2 focus:ring-[#4B6B5B]/20 outline-hidden"
              />
            </div>
            {hasActiveFilters && (
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setActionFilter("");
                    setResourceFilter("");
                    setActorFilter("");
                    setFromDate("");
                    setToDate("");
                  }}
                  className="px-3 py-1.5 rounded-xl border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-50 transition-colors"
                >
                  Clear All
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-white rounded-3xl border border-[#E5E0D8] overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#FAF9F6] border-b border-[#E5E0D8] text-[#6B7280] uppercase font-semibold">
                <th className="py-3.5 px-5">Timestamp</th>
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Resource</th>
                <th className="py-3.5 px-4">Description</th>
                <th className="py-3.5 px-5 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EFEA]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-[#6B7280]">
                    Loading logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-[#6B7280]">
                    No audit logs found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-stone-50/60 transition-colors">
                    <td className="py-4 px-5 text-[#6B7280] whitespace-nowrap">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-semibold text-[#1C1E21]">{log.actorUsername}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${ACTION_COLORS[log.action] || "bg-stone-100 text-stone-600"}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-[#6B7280]">
                      {log.resourceType}
                      {log.resourceId && (
                        <span className="ml-1 text-[#9CA3AF]">({log.resourceId})</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-[#1C1E21] max-w-xs truncate">
                      {log.description}
                    </td>
                    <td className="py-4 px-5 text-right">
                      <button
                        onClick={() => setDetailLog(log)}
                        className="p-1.5 rounded-lg border border-[#E5E0D8] text-[#1C1E21] hover:bg-stone-100 transition-colors"
                        title="View details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-[#E5E0D8] bg-[#FAF9F6]">
            <span className="text-xs text-[#6B7280]">
              Page <span className="font-semibold text-[#1C1E21]">{page}</span> of {totalPages}
            </span>
            <div className="inline-flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#E5E0D8] text-xs font-semibold text-[#1C1E21] hover:bg-stone-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Prev
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#E5E0D8] text-xs font-semibold text-[#1C1E21] hover:bg-stone-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {detailLog && (
        <AuditDetailModal
          log={detailLog}
          onClose={() => setDetailLog(null)}
          formatDate={formatDate}
        />
      )}
    </div>
  );
}
