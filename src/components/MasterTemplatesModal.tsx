import React, { useRef } from 'react';
import { MasterTemplateRecord, saveMasterTemplate } from '../db/indexedDB';
import { FileText, Upload, X, CheckCircle } from 'lucide-react';

interface MasterTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  templates: MasterTemplateRecord[];
  onTemplatesUpdated: () => void;
}

const SLOTS: { slotId: MasterTemplateRecord['slotId']; label: string; defaultFileName: string }[] = [
  { slotId: 'kyc', label: 'KYC', defaultFileName: 'Standard_KYC_Master.docx' },
  { slotId: 'cdr', label: 'CDR / CAF / SDR', defaultFileName: 'Standard_CDR_CAF_SDR_Master.docx' },
  { slotId: 'imei', label: 'IMEI Searching', defaultFileName: 'Standard_IMEI_Searching_Master.docx' },
  { slotId: 'ipdr', label: 'IPDR / IP Subscriber Details', defaultFileName: 'Standard_IPDR_Master.docx' },
  { slotId: 'google', label: 'Google Notice', defaultFileName: 'Standard_Google_Notice_Master.docx' },
];

export const MasterTemplatesModal: React.FC<MasterTemplatesModalProps> = ({
  isOpen,
  onClose,
  templates,
  onTemplatesUpdated,
}) => {
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  if (!isOpen) return null;

  const handleFileChange = async (
    slotId: MasterTemplateRecord['slotId'],
    displayName: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const record: MasterTemplateRecord = {
      slotId,
      displayName,
      fileName: file.name,
      fileData: file,
      updatedAt: Date.now(),
    };

    await saveMasterTemplate(record);
    onTemplatesUpdated();

    // Reset input
    if (fileInputRefs.current[slotId]) {
      fileInputRefs.current[slotId]!.value = '';
    }
  };

  const getTemplateForSlot = (slotId: MasterTemplateRecord['slotId']) => {
    return templates.find((t) => t.slotId === slotId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-slate-700" />
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Master Templates</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Slots Content */}
        <div className="p-6 overflow-y-auto flex-1 divide-y divide-slate-200">
          {SLOTS.map((slot) => {
            const template = getTemplateForSlot(slot.slotId);
            const currentFileName = template?.fileName || slot.defaultFileName;

            return (
              <div
                key={slot.slotId}
                className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">{slot.label}</h3>
                  <div className="text-xs text-slate-600 mt-1 flex items-center gap-1.5">
                    <span className="text-slate-500 font-medium">Current Master:</span>
                    <span className="font-medium text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {currentFileName}
                    </span>
                  </div>
                </div>

                <div className="shrink-0">
                  <input
                    type="file"
                    ref={(el) => {
                      fileInputRefs.current[slot.slotId] = el;
                    }}
                    onChange={(e) => handleFileChange(slot.slotId, slot.label, e)}
                    accept=".docx,.doc"
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRefs.current[slot.slotId]?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors shadow-sm"
                  >
                    <Upload className="w-3.5 h-3.5 text-slate-500" />
                    Replace Master
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-100"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
