import React, { useState, useEffect } from 'react';
import {
  CaseRecord,
  MasterTemplateRecord,
  RecentRequisitionRecord,
  saveRecentRequisition,
} from '../db/indexedDB';
import {
  generateKycDocx,
  generateCdrDocx,
  generateImeiDocx,
  generateIpdrDocx,
  generateGoogleNoticeDocx,
  downloadDocxBlob,
} from '../utils/docxKycGenerator';
import {
  X,
  FileText,
  CheckCircle2,
  Plus,
  Download,
  AlertCircle,
  Trash2,
} from 'lucide-react';

export type GeneratorType = 'kyc' | 'cdr' | 'imei' | 'ipdr' | 'google';

interface RequisitionGeneratorModalProps {
  isOpen: boolean;
  generatorType: GeneratorType | null;
  onClose: () => void;
  cases: CaseRecord[];
  templates: MasterTemplateRecord[];
  onOpenCaseVault: () => void;
  onRequisitionCreated: () => void;
}

interface IpEntry {
  id: string;
  ip: string;
  date: string;
  time: string;
}

const GENERATOR_CONFIG: Record<
  GeneratorType,
  {
    title: string;
    subtitle: string;
  }
> = {
  kyc: {
    title: 'KYC REQUISITION',
    subtitle: 'Bank, Wallet & Payment Gateway KYC Requisition',
  },
  cdr: {
    title: 'CDR / CAF / SDR',
    subtitle: 'Call Detail Record, CAF & SDR Requisition',
  },
  imei: {
    title: 'IMEI SEARCHING',
    subtitle: 'Handset IMEI Tracking & Device Requisition',
  },
  ipdr: {
    title: 'IPDR / IP SUBSCRIBER DETAILS',
    subtitle: 'Internet Protocol Detail Record & Log Notice',
  },
  google: {
    title: 'GOOGLE NOTICE',
    subtitle: 'Google Account, Gmail, Drive & Android Device Notice',
  },
};

export const RequisitionGeneratorModal: React.FC<RequisitionGeneratorModalProps> = ({
  isOpen,
  generatorType,
  onClose,
  cases,
  templates,
  onOpenCaseVault,
  onRequisitionCreated,
}) => {
  // Case selection
  const [selectedCaseId, setSelectedCaseId] = useState<string>('');
  const [caseReference, setCaseReference] = useState<string>('');
  const [caseGist, setCaseGist] = useState<string>('');
  const [ioName, setIoName] = useState<string>('');

  // UI state
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // 1. KYC State
  const [memoNo, setMemoNo] = useState<string>('');
  const [kycDate, setKycDate] = useState<string>('');
  const [bankName, setBankName] = useState<string>('');
  const [accountNo, setAccountNo] = useState<string>('');
  const [statementFromDate, setStatementFromDate] = useState<string>('');

  // 2. CDR / CAF / SDR State
  const [requisitionType, setRequisitionType] = useState<'CDR' | 'CAF' | 'SDR'>('CDR');
  const [cdrMobile, setCdrMobile] = useState<string>('');
  const [cdrFromDate, setCdrFromDate] = useState<string>('');
  const [cdrToDate, setCdrToDate] = useState<string>('');

  // 3. IMEI State
  const [imeiNumber, setImeiNumber] = useState<string>('');
  const [imeiFromDate, setImeiFromDate] = useState<string>('');
  const [imeiToDate, setImeiToDate] = useState<string>('');

  // 4. IPDR State
  const [ipdrMode, setIpdrMode] = useState<'ipdr' | 'subscriber'>('ipdr');
  const [ipdrTarget, setIpdrTarget] = useState<string>('');
  const [ipdrFromDate, setIpdrFromDate] = useState<string>('');
  const [ipdrFromTime, setIpdrFromTime] = useState<string>('');
  const [ipdrToDate, setIpdrToDate] = useState<string>('');
  const [ipdrToTime, setIpdrToTime] = useState<string>('');
  const [ipList, setIpList] = useState<IpEntry[]>([
    { id: '1', ip: '', date: '', time: '' },
  ]);

  // 5. Google Notice State
  const [googleEmail, setGoogleEmail] = useState<string>('');
  const [googleDate, setGoogleDate] = useState<string>('');

  // Auto-populate from Case Vault
  const handleCaseSelect = (caseId: string) => {
    setSelectedCaseId(caseId);
    if (!caseId) {
      setCaseReference('');
      setCaseGist('');
      setIoName('');
      return;
    }

    const found = cases.find((c) => c.id === caseId);
    if (found) {
      setCaseReference(found.reference);
      setCaseGist(found.gist);
      setIoName(found.ioName);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setSavedSuccess(false);
      setGenerationError(null);
      const today = new Date().toLocaleDateString('en-GB');
      setKycDate(today);
      setGoogleDate(today);

      if (cases.length > 0 && !selectedCaseId) {
        handleCaseSelect(cases[0].id);
      }
    } else {
      setSavedSuccess(false);
      setGenerationError(null);
      setMemoNo('');
      setBankName('');
      setAccountNo('');
      setStatementFromDate('');
      setCdrMobile('');
      setCdrFromDate('');
      setCdrToDate('');
      setImeiNumber('');
      setImeiFromDate('');
      setImeiToDate('');
      setIpdrTarget('');
      setIpdrFromDate('');
      setIpdrFromTime('');
      setIpdrToDate('');
      setIpdrToTime('');
      setIpList([{ id: '1', ip: '', date: '', time: '' }]);
      setGoogleEmail('');
    }
  }, [isOpen, generatorType, cases]);

  if (!isOpen || !generatorType) return null;

  const config = GENERATOR_CONFIG[generatorType];
  const matchedTemplate = templates.find((t) => t.slotId === generatorType);
  const selectedCase = cases.find((c) => c.id === selectedCaseId);

  // Helper for multiple IP entries in Subscriber Details mode
  const handleAddIpEntry = () => {
    setIpList((prev) => [
      ...prev,
      { id: Date.now().toString(), ip: '', date: '', time: '' },
    ]);
  };

  const handleUpdateIpEntry = (
    id: string,
    field: 'ip' | 'date' | 'time',
    value: string
  ) => {
    setIpList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleRemoveIpEntry = (id: string) => {
    if (ipList.length <= 1) return;
    setIpList((prev) => prev.filter((item) => item.id !== id));
  };

  const getTargetIdentifierForSaving = (): string => {
    switch (generatorType) {
      case 'kyc':
        return accountNo.trim();
      case 'cdr':
        return cdrMobile.trim();
      case 'imei':
        return imeiNumber.trim();
      case 'ipdr':
        return ipdrMode === 'ipdr'
          ? ipdrTarget.trim()
          : `${ipList.filter((x) => x.ip.trim()).length} IP(s)`;
      case 'google':
        return googleEmail.trim();
      default:
        return '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = getTargetIdentifierForSaving();
    if (!target || !caseReference.trim()) return;

    const requisitionItem: RecentRequisitionRecord = {
      id: `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      generatorType,
      generatorTitle: config.title,
      caseId: selectedCaseId || 'custom',
      caseTitle: selectedCase?.title || 'Case Requisition',
      caseReference: caseReference.trim(),
      ioName: ioName.trim() || 'Investigating Officer',
      targetIdentifier: target,
      createdDate: new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      status: 'Ready',
    };

    await saveRecentRequisition(requisitionItem);
    onRequisitionCreated();
    setSavedSuccess(true);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const handleGenerateWord = async () => {
    setGenerationError(null);

    if (!matchedTemplate?.fileData) {
      setGenerationError(
        `${config.title} master DOCX is not uploaded yet. Please upload it in Master Templates first.`
      );
      return;
    }

    try {
      setIsGenerating(true);
      let generatedBlob: Blob;
      let filename = '';
      let targetForRecord = '';

      if (generatorType === 'kyc') {
        if (!accountNo.trim()) {
          setGenerationError('Please enter Account Number.');
          setIsGenerating(false);
          return;
        }
        targetForRecord = accountNo.trim();
        generatedBlob = await generateKycDocx(matchedTemplate.fileData, {
          memoNo: memoNo.trim(),
          date: kycDate.trim(),
          caseReference: caseReference.trim(),
          bankName: bankName.trim(),
          accountNo: accountNo.trim(),
          statementFromDate: statementFromDate.trim(),
          ioName: ioName.trim(),
        });
        const safeAcc = accountNo.trim().replace(/[/\\?%*:|"<>]/g, '_');
        filename = `KYC_${safeAcc}.docx`;
      } else if (generatorType === 'cdr') {
        if (!cdrMobile.trim()) {
          setGenerationError('Please enter Mobile Number.');
          setIsGenerating(false);
          return;
        }
        targetForRecord = `${requisitionType} - ${cdrMobile.trim()}`;
        generatedBlob = await generateCdrDocx(matchedTemplate.fileData, {
          caseReference: caseReference.trim(),
          caseGist: caseGist.trim(),
          ioName: ioName.trim(),
          requisitionType,
          mobileNumber: cdrMobile.trim(),
          fromDate: cdrFromDate.trim(),
          toDate: cdrToDate.trim(),
        });
        const safeMobile = cdrMobile.trim().replace(/[/\\?%*:|"<>]/g, '_');
        filename = `${requisitionType}_${safeMobile}.docx`;
      } else if (generatorType === 'imei') {
        if (!imeiNumber.trim()) {
          setGenerationError('Please enter IMEI Number.');
          setIsGenerating(false);
          return;
        }
        targetForRecord = imeiNumber.trim();
        generatedBlob = await generateImeiDocx(matchedTemplate.fileData, {
          caseReference: caseReference.trim(),
          ioName: ioName.trim(),
          imeiNumber: imeiNumber.trim(),
          fromDate: imeiFromDate.trim(),
          toDate: imeiToDate.trim(),
        });
        const safeImei = imeiNumber.trim().replace(/[/\\?%*:|"<>]/g, '_');
        filename = `IMEI_${safeImei}.docx`;
      } else if (generatorType === 'ipdr') {
        if (ipdrMode === 'ipdr') {
          if (!ipdrTarget.trim()) {
            setGenerationError('Please enter Target identifier.');
            setIsGenerating(false);
            return;
          }
          targetForRecord = ipdrTarget.trim();
          const fromPart = `${ipdrFromDate.trim()} ${ipdrFromTime.trim()}`.trim();
          const toPart = `${ipdrToDate.trim()} ${ipdrToTime.trim()}`.trim();
          const dataRequired = `IPDR of\n${ipdrTarget.trim()}\nw.e.f. ${fromPart} to ${toPart}`;

          generatedBlob = await generateIpdrDocx(matchedTemplate.fileData, {
            caseReference: caseReference.trim(),
            ioName: ioName.trim(),
            dataRequired,
          });
          const safeTarget = ipdrTarget.trim().replace(/[/\\?%*:|"<>]/g, '_');
          filename = `IPDR_${safeTarget}.docx`;
        } else {
          const validIps = ipList.filter((x) => x.ip.trim());
          if (validIps.length === 0) {
            setGenerationError('Please enter at least one IP address.');
            setIsGenerating(false);
            return;
          }
          targetForRecord = `${validIps.length} IP(s)`;
          const itemsText = validIps
            .map((item, index) => {
              const dt = `${item.date.trim()} ${item.time.trim()}`.trim();
              return `${index + 1}. ${item.ip.trim()}\n   Date & Time: ${dt}`;
            })
            .join('\n\n');
          const dataRequired = `Subscriber Details of\n\n${itemsText}`;

          generatedBlob = await generateIpdrDocx(matchedTemplate.fileData, {
            caseReference: caseReference.trim(),
            ioName: ioName.trim(),
            dataRequired,
          });
          filename = 'IP_SUBSCRIBER_DETAILS.docx';
        }
      } else if (generatorType === 'google') {
        if (!googleEmail.trim()) {
          setGenerationError('Please enter Email / Gmail ID.');
          setIsGenerating(false);
          return;
        }
        targetForRecord = googleEmail.trim();
        generatedBlob = await generateGoogleNoticeDocx(matchedTemplate.fileData, {
          emailId: googleEmail.trim(),
          caseReference: caseReference.trim(),
          caseGist: caseGist.trim(),
          ioName: ioName.trim(),
          date: googleDate.trim(),
        });
        const safeEmail = googleEmail.trim().replace(/[/\\?%*:|"<>]/g, '_');
        filename = `GOOGLE_NOTICE_${safeEmail}.docx`;
      } else {
        setIsGenerating(false);
        return;
      }

      downloadDocxBlob(generatedBlob, filename);

      // Save record to Recent Requisitions
      const requisitionItem: RecentRequisitionRecord = {
        id: `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        generatorType,
        generatorTitle: config.title,
        caseId: selectedCaseId || 'custom',
        caseTitle: selectedCase?.title || 'Case Requisition',
        caseReference: caseReference.trim(),
        ioName: ioName.trim() || 'Investigating Officer',
        targetIdentifier: targetForRecord,
        createdDate: new Date().toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
        status: 'Generated',
      };

      await saveRecentRequisition(requisitionItem);
      onRequisitionCreated();
      setSavedSuccess(true);
    } catch (err: any) {
      console.error(`Failed to generate ${generatorType} DOCX`, err);
      setGenerationError(err?.message || 'Failed to generate Word document.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-wide">
              {config.title}
            </h2>
            <p className="text-xs text-slate-500">{config.subtitle}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-4">
          {savedSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Requisition saved successfully to Recent Requisitions.</span>
            </div>
          )}

          {generationError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{generationError}</span>
            </div>
          )}

          {/* Master Template slot indication */}
          <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-600">
            <span className="font-medium text-slate-700">Master Template:</span>
            <span className="font-semibold text-slate-800">
              {matchedTemplate?.fileName || 'Standard Master'}
            </span>
          </div>

          {/* Case Vault Selector */}
          <div className="border border-slate-200 rounded-lg p-3 bg-white space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-800">
                Select Case from Vault
              </label>
              <button
                type="button"
                onClick={onOpenCaseVault}
                className="text-xs text-slate-600 hover:text-slate-900 inline-flex items-center gap-1 font-medium underline"
              >
                <Plus className="w-3 h-3" />
                Manage Case Vault
              </button>
            </div>

            {cases.length === 0 ? (
              <div className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded border border-slate-200">
                No cases in Case Vault yet.{' '}
                <button
                  type="button"
                  onClick={onOpenCaseVault}
                  className="text-slate-800 font-semibold underline ml-1"
                >
                  Add a case now
                </button>
              </div>
            ) : (
              <select
                value={selectedCaseId}
                onChange={(e) => handleCaseSelect(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded bg-white text-slate-800 focus:outline-none focus:border-slate-500"
              >
                <option value="">-- Choose a Case from Vault --</option>
                {cases.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.reference} - {c.title}
                  </option>
                ))}
              </select>
            )}

            {/* Supplied Fields from Case Vault */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Case Reference *
                </label>
                <input
                  type="text"
                  required
                  value={caseReference}
                  onChange={(e) => setCaseReference(e.target.value)}
                  placeholder="e.g. FIR No. / Ref No."
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded bg-white text-slate-800 focus:outline-none focus:border-slate-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  IO Name
                </label>
                <input
                  type="text"
                  value={ioName}
                  onChange={(e) => setIoName(e.target.value)}
                  placeholder="Investigating Officer Name"
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded bg-white text-slate-800 focus:outline-none focus:border-slate-500"
                />
              </div>
            </div>

            {/* Case Gist (Used in CDR, Google Notice, etc.) */}
            {(generatorType === 'cdr' || generatorType === 'google' || generatorType === 'kyc') && (
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Case Gist
                </label>
                <textarea
                  rows={2}
                  value={caseGist}
                  onChange={(e) => setCaseGist(e.target.value)}
                  placeholder="Case Gist automatically supplied from Case Vault..."
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded bg-white text-slate-800 focus:outline-none focus:border-slate-500"
                />
              </div>
            )}
          </div>

          {/* 1. KYC Specific Form */}
          {generatorType === 'kyc' && (
            <div className="border border-slate-200 rounded-lg p-3 bg-white space-y-3">
              <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                KYC Requisition Details
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Memo No.
                  </label>
                  <input
                    type="text"
                    value={memoNo}
                    onChange={(e) => setMemoNo(e.target.value)}
                    placeholder="e.g. 104/CYBER/2026"
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded bg-white text-slate-800 focus:outline-none focus:border-slate-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Date
                  </label>
                  <input
                    type="text"
                    value={kycDate}
                    onChange={(e) => setKycDate(e.target.value)}
                    placeholder="e.g. 03/10/2026"
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded bg-white text-slate-800 focus:outline-none focus:border-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Bank / Financial Institution Name
                </label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="e.g. State Bank of India, HDFC Bank"
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded bg-white text-slate-800 focus:outline-none focus:border-slate-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Account Number *
                </label>
                <input
                  type="text"
                  required
                  value={accountNo}
                  onChange={(e) => setAccountNo(e.target.value)}
                  placeholder="e.g. 123456789012"
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded bg-white text-slate-800 focus:outline-none focus:border-slate-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Statement From Date
                </label>
                <input
                  type="text"
                  value={statementFromDate}
                  onChange={(e) => setStatementFromDate(e.target.value)}
                  placeholder="e.g. 01/01/2026"
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded bg-white text-slate-800 focus:outline-none focus:border-slate-500"
                />
              </div>
            </div>
          )}

          {/* 2. CDR / CAF / SDR Specific Form */}
          {generatorType === 'cdr' && (
            <div className="border border-slate-200 rounded-lg p-3 bg-white space-y-3">
              <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                CDR / CAF / SDR Details
              </h4>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Requisition Type
                </label>
                <div className="flex items-center gap-3">
                  {(['CDR', 'CAF', 'SDR'] as const).map((type) => (
                    <label
                      key={type}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded cursor-pointer transition-colors ${
                        requisitionType === type
                          ? 'bg-slate-800 text-white border-slate-800'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="requisitionType"
                        value={type}
                        checked={requisitionType === type}
                        onChange={() => setRequisitionType(type)}
                        className="hidden"
                      />
                      <span>{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Mobile Number *
                </label>
                <input
                  type="text"
                  required
                  value={cdrMobile}
                  onChange={(e) => setCdrMobile(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded bg-white text-slate-800 focus:outline-none focus:border-slate-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    From Date
                  </label>
                  <input
                    type="date"
                    value={cdrFromDate}
                    onChange={(e) => setCdrFromDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded bg-white text-slate-800 focus:outline-none focus:border-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    To Date
                  </label>
                  <input
                    type="date"
                    value={cdrToDate}
                    onChange={(e) => setCdrToDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded bg-white text-slate-800 focus:outline-none focus:border-slate-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 3. IMEI Searching Specific Form */}
          {generatorType === 'imei' && (
            <div className="border border-slate-200 rounded-lg p-3 bg-white space-y-3">
              <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                IMEI Searching Details
              </h4>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  IMEI Number *
                </label>
                <input
                  type="text"
                  required
                  value={imeiNumber}
                  onChange={(e) => setImeiNumber(e.target.value)}
                  placeholder="e.g. 864293041234567 (15 digits)"
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded bg-white text-slate-800 focus:outline-none focus:border-slate-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    From Date
                  </label>
                  <input
                    type="date"
                    value={imeiFromDate}
                    onChange={(e) => setImeiFromDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded bg-white text-slate-800 focus:outline-none focus:border-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    To Date
                  </label>
                  <input
                    type="date"
                    value={imeiToDate}
                    onChange={(e) => setImeiToDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded bg-white text-slate-800 focus:outline-none focus:border-slate-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 4. IPDR / IP Subscriber Details Specific Form */}
          {generatorType === 'ipdr' && (
            <div className="border border-slate-200 rounded-lg p-3 bg-white space-y-4">
              {/* Mode Selector */}
              <div className="flex border-b border-slate-200 pb-2 gap-4">
                <button
                  type="button"
                  onClick={() => setIpdrMode('ipdr')}
                  className={`text-xs font-bold pb-1 transition-colors border-b-2 ${
                    ipdrMode === 'ipdr'
                      ? 'border-slate-900 text-slate-900'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  IPDR
                </button>
                <button
                  type="button"
                  onClick={() => setIpdrMode('subscriber')}
                  className={`text-xs font-bold pb-1 transition-colors border-b-2 ${
                    ipdrMode === 'subscriber'
                      ? 'border-slate-900 text-slate-900'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  IP SUBSCRIBER DETAILS
                </button>
              </div>

              {ipdrMode === 'ipdr' ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Target *
                    </label>
                    <input
                      type="text"
                      required
                      value={ipdrTarget}
                      onChange={(e) => setIpdrTarget(e.target.value)}
                      placeholder="e.g. 103.21.244.0 or target mobile/identifier"
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded bg-white text-slate-800 focus:outline-none focus:border-slate-500 font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        From Date
                      </label>
                      <input
                        type="date"
                        value={ipdrFromDate}
                        onChange={(e) => setIpdrFromDate(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded bg-white text-slate-800 focus:outline-none focus:border-slate-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        From Time
                      </label>
                      <input
                        type="time"
                        value={ipdrFromTime}
                        onChange={(e) => setIpdrFromTime(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded bg-white text-slate-800 focus:outline-none focus:border-slate-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        To Date
                      </label>
                      <input
                        type="date"
                        value={ipdrToDate}
                        onChange={(e) => setIpdrToDate(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded bg-white text-slate-800 focus:outline-none focus:border-slate-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        To Time
                      </label>
                      <input
                        type="time"
                        value={ipdrToTime}
                        onChange={(e) => setIpdrToTime(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded bg-white text-slate-800 focus:outline-none focus:border-slate-500"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-700">
                      IP Addresses & Timestamp Entries
                    </span>
                    <button
                      type="button"
                      onClick={handleAddIpEntry}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-slate-800 hover:text-slate-950 underline cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Another IP
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {ipList.map((entry, index) => (
                      <div
                        key={entry.id}
                        className="p-3 border border-slate-200 rounded-lg bg-slate-50 space-y-2 relative"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-700">
                            Entry #{index + 1}
                          </span>
                          {ipList.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveIpEntry(entry.id)}
                              className="text-red-500 hover:text-red-700 p-0.5"
                              title="Remove this IP entry"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 mb-0.5">
                            IP Address *
                          </label>
                          <input
                            type="text"
                            required
                            value={entry.ip}
                            onChange={(e) =>
                              handleUpdateIpEntry(entry.id, 'ip', e.target.value)
                            }
                            placeholder="e.g. 103.21.244.10"
                            className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded bg-white text-slate-800 focus:outline-none focus:border-slate-500 font-mono"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[11px] font-medium text-slate-600 mb-0.5">
                              Date
                            </label>
                            <input
                              type="date"
                              value={entry.date}
                              onChange={(e) =>
                                handleUpdateIpEntry(entry.id, 'date', e.target.value)
                              }
                              className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded bg-white text-slate-800 focus:outline-none focus:border-slate-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-medium text-slate-600 mb-0.5">
                              Time
                            </label>
                            <input
                              type="time"
                              value={entry.time}
                              onChange={(e) =>
                                handleUpdateIpEntry(entry.id, 'time', e.target.value)
                              }
                              className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded bg-white text-slate-800 focus:outline-none focus:border-slate-500"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 5. Google Notice Specific Form */}
          {generatorType === 'google' && (
            <div className="border border-slate-200 rounded-lg p-3 bg-white space-y-3">
              <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                Google Notice Details
              </h4>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Email / Gmail ID *
                </label>
                <input
                  type="email"
                  required
                  value={googleEmail}
                  onChange={(e) => setGoogleEmail(e.target.value)}
                  placeholder="e.g. target.user@gmail.com"
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded bg-white text-slate-800 focus:outline-none focus:border-slate-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Date
                </label>
                <input
                  type="text"
                  value={googleDate}
                  onChange={(e) => setGoogleDate(e.target.value)}
                  placeholder="e.g. 03/10/2026"
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded bg-white text-slate-800 focus:outline-none focus:border-slate-500"
                />
              </div>
            </div>
          )}

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded transition-colors"
            >
              Save Requisition
            </button>
            <button
              type="button"
              onClick={handleGenerateWord}
              disabled={isGenerating}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded hover:bg-slate-800 transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              {isGenerating ? 'Generating...' : 'Generate Word'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
