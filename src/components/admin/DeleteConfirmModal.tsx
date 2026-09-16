import React from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  tripTitle: string;
  onCancel: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  tripTitle,
  onCancel,
  onConfirm,
  loading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-3xl border border-[#E5E0D8] max-w-sm w-full p-6 sm:p-7 shadow-2xl relative text-center">
        <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <h3 className="text-lg font-semibold text-[#1C1E21] mb-1.5">
          Delete this trip?
        </h3>

        <p className="text-xs sm:text-sm text-[#4A5568] mb-1">
          Are you sure you want to remove <span className="font-semibold text-[#1C1E21]">"{tripTitle}"</span>?
        </p>

        <p className="text-xs text-red-600 font-medium mb-6">
          This action cannot be undone.
        </p>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-3 px-4 rounded-xl border border-[#E5E0D8] text-xs font-semibold text-[#374151] hover:bg-stone-50 transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold tracking-wide transition-colors flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-75"
          >
            {loading ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5" />
            )}
            <span>Delete Trip</span>
          </button>
        </div>
      </div>
    </div>
  );
};
