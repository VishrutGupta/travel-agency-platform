"use client";

import React from "react";
import { X, ArrowRight } from "lucide-react";
import {
  computeChanges,
  getResourceTitle,
  getImportantFields,
  getActionTitle,
  type FieldChange,
} from "@/lib/utils/auditFormatters";

interface AuditLogEntry {
  id: string;
  actorUsername: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  description: string;
  beforeData?: Record<string, unknown> | null;
  afterData?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

interface AuditDetailModalProps {
  log: AuditLogEntry;
  onClose: () => void;
  formatDate: (iso: string) => string;
}

function ChangeRow({ change }: { change: FieldChange }) {
  if (change.type === "added") {
    return (
      <div className="py-2.5 border-b border-[#F0EFEA] last:border-0">
        <div className="text-[10px] font-semibold text-[#6B7280] uppercase mb-1">{change.label}</div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-xs font-medium">
            {change.newValue}
          </span>
        </div>
      </div>
    );
  }

  if (change.type === "removed") {
    return (
      <div className="py-2.5 border-b border-[#F0EFEA] last:border-0">
        <div className="text-[10px] font-semibold text-[#6B7280] uppercase mb-1">{change.label}</div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-red-50 text-red-700 text-xs font-medium line-through">
            {change.oldValue}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="py-2.5 border-b border-[#F0EFEA] last:border-0">
      <div className="text-[10px] font-semibold text-[#6B7280] uppercase mb-1">{change.label}</div>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-red-50 text-red-700 text-xs font-medium">
          {change.oldValue}
        </span>
        <ArrowRight className="w-3 h-3 text-[#9CA3AF] shrink-0" />
        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-xs font-medium">
          {change.newValue}
        </span>
      </div>
    </div>
  );
}

function FieldList({ fields, color }: { fields: { label: string; value: string }[]; color: "green" | "red" }) {
  const bg = color === "green" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700";
  return (
    <div className="flex flex-col gap-1.5">
      {fields.map((f) => (
        <div key={f.label} className="flex items-start justify-between gap-4 py-1.5 border-b border-[#F0EFEA] last:border-0">
          <span className="text-[10px] font-semibold text-[#6B7280] uppercase shrink-0">{f.label}</span>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium text-right ${bg}`}>
            {f.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export const AuditDetailModal: React.FC<AuditDetailModalProps> = ({
  log,
  onClose,
  formatDate,
}) => {
  const title = getResourceTitle(log);
  const actionTitle = getActionTitle(log.action, log.resourceType, title);
  const changes = computeChanges(log.beforeData, log.afterData);
  const isUpdate = log.action.includes("update") || log.action === "UPDATE";
  const isCreate = log.action.includes("create") || log.action === "CREATE";
  const isDelete = log.action.includes("delete") || log.action === "DELETE";
  const isLogin = log.action === "login" || log.action === "LOGIN";

  const renderContent = () => {
    if (isLogin) {
      return (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-sm font-semibold text-emerald-800">Login Successful</span>
          </div>
          <div className="text-xs text-emerald-700">
            User: <span className="font-semibold">{log.actorUsername}</span>
          </div>
        </div>
      );
    }

    if (isCreate) {
      const importantFields = getImportantFields(log.afterData, log.resourceType);
      return (
        <div className="flex flex-col gap-4">
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-sm font-semibold text-emerald-800">{actionTitle}</span>
            </div>
            {title && (
              <div className="text-xs text-emerald-700 mt-1">
                Trip: <span className="font-semibold">{title}</span>
              </div>
            )}
          </div>
          {importantFields.length > 0 && (
            <div className="p-4 rounded-xl bg-white border border-[#E5E0D8]">
              <FieldList fields={importantFields} color="green" />
            </div>
          )}
        </div>
      );
    }

    if (isDelete) {
      const importantFields = getImportantFields(log.beforeData, log.resourceType);
      return (
        <div className="flex flex-col gap-4">
          <div className="p-4 rounded-xl bg-red-50 border border-red-100">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-sm font-semibold text-red-800">{actionTitle}</span>
            </div>
            {title && (
              <div className="text-xs text-red-700 mt-1">
                {log.resourceType === "Trip" ? "Trip" : log.resourceType === "User" ? "User" : "Item"}: <span className="font-semibold">{title}</span>
              </div>
            )}
          </div>
          {importantFields.length > 0 && (
            <div className="p-4 rounded-xl bg-white border border-[#E5E0D8]">
              <FieldList fields={importantFields} color="red" />
            </div>
          )}
        </div>
      );
    }

    if (isUpdate && changes.length > 0) {
      return (
        <div className="flex flex-col gap-4">
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-sm font-semibold text-blue-800">{actionTitle}</span>
            </div>
            {title && (
              <div className="text-xs text-blue-700 mt-1">
                {log.resourceType === "Trip" ? "Trip" : log.resourceType === "Settings" ? "Settings" : "Item"}: <span className="font-semibold">{title}</span>
              </div>
            )}
          </div>
          <div className="p-4 rounded-xl bg-white border border-[#E5E0D8]">
            {changes.map((change, i) => (
              <ChangeRow key={`${change.label}-${i}`} change={change} />
            ))}
          </div>
        </div>
      );
    }

    if (isUpdate && changes.length === 0) {
      return (
        <div className="flex flex-col gap-4">
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-sm font-semibold text-blue-800">{actionTitle}</span>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-stone-50 border border-[#E5E0D8] text-xs text-[#6B7280] text-center">
            No field-level changes detected.
          </div>
        </div>
      );
    }

    const importantFields = getImportantFields(log.afterData || log.beforeData, log.resourceType);
    return (
      <div className="flex flex-col gap-4">
        <div className="p-4 rounded-xl bg-stone-50 border border-[#E5E0D8]">
          <div className="text-sm font-semibold text-[#1C1E21] mb-1">{actionTitle}</div>
          {title && (
            <div className="text-xs text-[#6B7280]">
              {log.resourceType}: <span className="font-semibold text-[#1C1E21]">{title}</span>
            </div>
          )}
        </div>
        {importantFields.length > 0 && (
          <div className="p-4 rounded-xl bg-white border border-[#E5E0D8]">
            <FieldList fields={importantFields} color="green" />
          </div>
        )}
        {log.description && (
          <div className="p-4 rounded-xl bg-white border border-[#E5E0D8]">
            <div className="text-[10px] font-semibold text-[#6B7280] uppercase mb-1">Description</div>
            <div className="text-xs text-[#1C1E21] leading-relaxed">{log.description}</div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#FAF9F6] rounded-3xl border border-[#E5E0D8] p-6 sm:p-8 w-full max-w-2xl shadow-xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-[#1C1E21]">Audit Details</h2>
          <button onClick={onClose} className="text-stone-400 hover:text-[#1C1E21]"><X className="w-5 h-5" /></button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 p-4 rounded-xl bg-white border border-[#E5E0D8]">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold text-[#6B7280] uppercase">User</span>
            <span className="text-xs font-semibold text-[#1C1E21]">{log.actorUsername}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold text-[#6B7280] uppercase">Action</span>
            <span className="text-xs text-[#1C1E21]">{log.action}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold text-[#6B7280] uppercase">Resource</span>
            <span className="text-xs text-[#1C1E21]">{log.resourceType}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold text-[#6B7280] uppercase">Timestamp</span>
            <span className="text-xs text-[#6B7280]">{formatDate(log.createdAt)}</span>
          </div>
        </div>

        {renderContent()}

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#1C1E21] hover:bg-[#2A3A4A] text-white text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
