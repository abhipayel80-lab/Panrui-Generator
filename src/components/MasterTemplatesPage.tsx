import React, { useRef } from 'react';
import { MasterTemplateRecord, saveMasterTemplate } from '../db/indexedDB';
import { ArrowLeft, ArrowRight, Upload } from 'lucide-react';

interface MasterTemplatesPageProps {
  onBack: () => void;
  templates: MasterTemplateRecord[];
  onTemplatesUpdated: () => void;
}

interface TemplateSlotConfig {
  slotId: MasterTemplateRecord['slotId'];
  name: string;
  defaultMaster: string;
}

const TEMPLATE_SLOTS: TemplateSlotConfig[] = [
  {
    slotId: 'kyc',
    name: 'KYC Requisition',
    defaultMaster: 'Standard_KYC_Master.docx',
  },
  {
    slotId: 'cdr',
    name: 'CDR / CAF / SDR',
    defaultMaster: 'Standard_CDR_CAF_SDR_Master.docx',
  },
  {
    slotId: 'imei',
    name: 'IMEI Searching',
    defaultMaster: 'Standard_IMEI_Searching_Master.docx',
  },
  {
    slotId: 'ipdr',
    name: 'IPDR / IP Subscriber Details',
    defaultMaster: 'Standard_IPDR_Master.docx',
  },
  {
    slotId: 'google',
    name: 'Google Notice',
    defaultMaster: 'Standard_Google_Notice_Master.docx',
  },
];

export const MasterTemplatesPage: React.FC<MasterTemplatesPageProps> = ({
  onBack,
  templates,
  onTemplatesUpdated,
}) => {
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const handleFileSelect = async (
    slotId: MasterTemplateRecord['slotId'],
    name: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const record: MasterTemplateRecord = {
      slotId,
      displayName: name,
      fileName: file.name,
      fileData: file,
      updatedAt: Date.now(),
    };

    await saveMasterTemplate(record);
    onTemplatesUpdated();

    if (fileInputRefs.current[slotId]) {
      fileInputRefs.current[slotId]!.value = '';
    }
  };

  const getTemplateForSlot = (slotId: MasterTemplateRecord['slotId']) => {
    return templates.find((t) => t.slotId === slotId);
  };

  const triggerUpload = (slotId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    fileInputRefs.current[slotId]?.click();
  };

  return (
    <div className="space-y-6">
      {/* Top Bar / Breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-950 bg-white border border-slate-200 hover:border-slate-300 px-3 py-1.5 rounded transition-colors shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        <h2 className="text-base font-bold text-slate-900">Master Templates</h2>
        <div className="w-16"></div>
      </div>

      {/* Template Cards */}
      <div className="space-y-3">
        {TEMPLATE_SLOTS.map((slot) => {
          const matched = getTemplateForSlot(slot.slotId);
          const currentMasterName = matched?.fileName || slot.defaultMaster;

          return (
            <div
              key={slot.slotId}
              onClick={(e) => triggerUpload(slot.slotId, e)}
              className="bg-white border border-slate-200 rounded-lg p-5 flex items-center justify-between hover:border-slate-400 hover:shadow-xs transition-all cursor-pointer group"
            >
              {/* Hidden file input strictly for .docx */}
              <input
                type="file"
                ref={(el) => {
                  fileInputRefs.current[slot.slotId] = el;
                }}
                onChange={(e) => handleFileSelect(slot.slotId, slot.name, e)}
                accept=".docx"
                className="hidden"
              />

              <div className="space-y-2 flex-1 min-w-0 pr-4">
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-slate-950">
                  {slot.name}
                </h3>

                <div className="text-xs text-slate-600 flex items-center gap-1.5 flex-wrap">
                  <span className="text-slate-500 font-medium">Current Master:</span>
                  <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 truncate max-w-xs sm:max-w-md">
                    {currentMasterName}
                  </span>
                </div>

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={(e) => triggerUpload(slot.slotId, e)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors shadow-xs"
                  >
                    <Upload className="w-3.5 h-3.5 text-slate-500" />
                    Replace / Upload Master
                  </button>
                </div>
              </div>

              {/* Right-side arrow → */}
              <div className="shrink-0 pl-2">
                <span className="text-slate-400 group-hover:text-slate-800 group-hover:translate-x-1 inline-block transition-transform text-xl font-bold">
                  →
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
