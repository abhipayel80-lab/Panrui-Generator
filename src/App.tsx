/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  getAllCases,
  getAllMasterTemplates,
  getRecentRequisitions,
  seedInitialTemplatesIfEmpty,
  deleteRecentRequisition,
  CaseRecord,
  MasterTemplateRecord,
  RecentRequisitionRecord,
} from './db/indexedDB';
import { CaseVaultModal } from './components/CaseVaultModal';
import { MasterTemplatesModal } from './components/MasterTemplatesModal';
import { MasterTemplatesPage } from './components/MasterTemplatesPage';
import { PWAInstallButton } from './components/PWAInstallButton';
import {
  RequisitionGeneratorModal,
  GeneratorType,
} from './components/RequisitionGeneratorModal';
import {
  FolderLock,
  FileText,
  FileSpreadsheet,
  PhoneCall,
  Smartphone,
  Globe,
  Mail,
  Trash2,
  HardDrive,
  Database,
  Layers,
  ArrowRight,
} from 'lucide-react';

export default function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'templates'>('home');
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [templates, setTemplates] = useState<MasterTemplateRecord[]>([]);
  const [recentRequisitions, setRecentRequisitions] = useState<RecentRequisitionRecord[]>([]);

  // Modals state
  const [isCaseVaultOpen, setIsCaseVaultOpen] = useState(false);
  const [isMasterTemplatesOpen, setIsMasterTemplatesOpen] = useState(false);
  const [activeGenerator, setActiveGenerator] = useState<GeneratorType | null>(null);

  const loadData = async () => {
    try {
      await seedInitialTemplatesIfEmpty();
      const [fetchedCases, fetchedTemplates, fetchedReqs] = await Promise.all([
        getAllCases(),
        getAllMasterTemplates(),
        getRecentRequisitions(),
      ]);
      setCases(fetchedCases);
      setTemplates(fetchedTemplates);
      setRecentRequisitions(fetchedReqs);
    } catch (err) {
      console.error('Failed to load local data', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDeleteRequisition = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this requisition entry?')) {
      await deleteRecentRequisition(id);
      loadData();
    }
  };

  const generatorCards: {
    type: GeneratorType;
    number: string;
    title: string;
    description: string;
    icon: React.ElementType;
  }[] = [
    {
      type: 'kyc',
      number: '1',
      title: 'KYC REQUISITION',
      description: 'Bank, Wallet & Payment Gateway Requisition',
      icon: FileSpreadsheet,
    },
    {
      type: 'cdr',
      number: '2',
      title: 'CDR / CAF / SDR',
      description: 'Call Detail Record, CAF & SDR Requisition',
      icon: PhoneCall,
    },
    {
      type: 'imei',
      number: '3',
      title: 'IMEI SEARCHING',
      description: 'Handset Tracking & Device CDR Requisition',
      icon: Smartphone,
    },
    {
      type: 'ipdr',
      number: '4',
      title: 'IPDR / IP SUBSCRIBER DETAILS',
      description: 'IP Detail Record, Port & ISP Notice',
      icon: Globe,
    },
    {
      type: 'google',
      number: '5',
      title: 'GOOGLE NOTICE',
      description: 'Google Account, Gmail, Drive & Android Logs',
      icon: Mail,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans antialiased">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between relative">
          <div className="shrink-0">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Generator</h1>
            <p className="text-xs font-medium text-slate-500">By Abhijit Gorai</p>
          </div>

          {/* Center Title */}
          <div className="absolute left-[38%] sm:left-[40%] -translate-x-1/2 text-center pointer-events-none">
            <span className="text-xs sm:text-base md:text-lg font-bold tracking-wider text-slate-900 uppercase">
              PANRUI PS
            </span>
          </div>

          {/* Top Quick Navigation Buttons */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              onClick={() => {
                setCurrentPage('home');
                setIsCaseVaultOpen(true);
              }}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded transition-colors"
            >
              <FolderLock className="w-4 h-4 text-slate-600" />
              <span>Case Vault</span>
              <span className="px-1.5 py-0.2 bg-slate-200 text-slate-800 rounded-full text-[11px] font-bold">
                {cases.length}
              </span>
            </button>

            <button
              onClick={() => setCurrentPage('templates')}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded transition-colors"
            >
              <FileText className="w-4 h-4 text-slate-600" />
              <span>Master Templates</span>
              <span className="text-slate-600 font-bold">→</span>
            </button>

            <PWAInstallButton />
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {currentPage === 'templates' ? (
          <MasterTemplatesPage
            onBack={() => setCurrentPage('home')}
            templates={templates}
            onTemplatesUpdated={loadData}
          />
        ) : (
          <>
            {/* Top Control Cards: Case Vault & Master Templates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Case Vault Card */}
              <div className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col justify-between shadow-xs">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-slate-100 rounded border border-slate-200 text-slate-700">
                      <FolderLock className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900">Case Vault</h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Central case repository for Case Reference, Case Gist and IO Name
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200">
                    {cases.length} {cases.length === 1 ? 'Case' : 'Cases'}
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500">Auto-supplies all 5 generators</span>
                  <button
                    onClick={() => setIsCaseVaultOpen(true)}
                    className="text-xs font-semibold text-slate-800 hover:text-slate-950 inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded transition-colors"
                  >
                    Open Case Vault
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Master Templates Card */}
              <div
                onClick={() => setCurrentPage('templates')}
                className="bg-white border border-slate-200 rounded-lg p-5 flex items-center justify-between hover:border-slate-400 hover:shadow-xs transition-all cursor-pointer group shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-slate-100 rounded border border-slate-200 text-slate-700">
                    <Layers className="w-5 h-5" />
                  </div>
                  <span className="text-base font-bold text-slate-900 group-hover:text-slate-950">
                    Master Templates
                  </span>
                </div>
                <span className="text-slate-700 group-hover:text-slate-950 group-hover:translate-x-1 inline-block transition-transform text-xl font-bold">
                  →
                </span>
              </div>
            </div>

        {/* Requisition Generators Section */}
        <div>
          <div className="mb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
              Requisition Generators
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
            {generatorCards.map((card) => {
              const Icon = card.icon;
              return (
                <button
                  key={card.type}
                  onClick={() => setActiveGenerator(card.type)}
                  className="bg-white border border-slate-200 rounded-lg p-4 text-left hover:border-slate-400 hover:shadow-xs transition-all flex flex-col justify-between group cursor-pointer"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        #{card.number}
                      </span>
                      <Icon className="w-5 h-5 text-slate-600 group-hover:text-slate-900 transition-colors" />
                    </div>
                    <h3 className="text-xs font-bold text-slate-900 leading-snug">
                      {card.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {card.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-700 group-hover:text-slate-950">
                    <span>Create Requisition</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Lower Dashboard: System Status & Recent Requisitions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* System Status Panel */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
                <Database className="w-4 h-4 text-slate-700" />
                <h3 className="text-sm font-bold text-slate-900">System Status</h3>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Case Vault</span>
                  <span className="font-semibold text-slate-800">
                    {cases.length} {cases.length === 1 ? 'case saved' : 'cases saved'}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Master Templates</span>
                  <span className="font-semibold text-slate-800">5 / 5 configured</span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Local Storage</span>
                  <span className="font-semibold text-slate-800">IndexedDB Active</span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Generators Active</span>
                  <span className="font-semibold text-slate-800">5 Modules</span>
                </div>

                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-500">Recent Requisitions</span>
                  <span className="font-semibold text-slate-800">
                    {recentRequisitions.length} stored
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5 p-2.5 bg-slate-50 border border-slate-200 rounded text-[11px] text-slate-600 flex items-center gap-2">
              <HardDrive className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>All case records and templates are stored locally on this machine.</span>
            </div>
          </div>

          {/* Recent Requisitions Table */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex flex-col">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-700" />
                <h3 className="text-sm font-bold text-slate-900">Recent Requisitions</h3>
              </div>
              <span className="text-xs text-slate-500">
                {recentRequisitions.length} total
              </span>
            </div>

            {recentRequisitions.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-10 border border-dashed border-slate-200 rounded text-center">
                <FileText className="w-8 h-8 text-slate-300 mb-2" />
                <p className="text-xs text-slate-500 font-medium">No requisitions generated yet.</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Select any generator above to prepare and save a requisition.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 bg-slate-50">
                      <th className="py-2 px-3 font-semibold">Date</th>
                      <th className="py-2 px-3 font-semibold">Requisition Type</th>
                      <th className="py-2 px-3 font-semibold">Case Reference</th>
                      <th className="py-2 px-3 font-semibold">Target Identifier</th>
                      <th className="py-2 px-3 font-semibold">IO Name</th>
                      <th className="py-2 px-3 text-right font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentRequisitions.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                          {req.createdDate}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className="inline-block px-1.5 py-0.5 text-[10px] font-bold rounded bg-slate-100 text-slate-800 border border-slate-200">
                            {req.generatorTitle}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-800 max-w-[160px] truncate">
                          {req.caseReference}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-700 max-w-[180px] truncate">
                          {req.targetIdentifier}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                          {req.ioName}
                        </td>
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          <button
                            onClick={(e) => handleDeleteRequisition(req.id, e)}
                            className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-slate-100 transition-colors"
                            title="Delete requisition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        </>
        )}
      </main>

      {/* Case Vault Modal */}
      <CaseVaultModal
        isOpen={isCaseVaultOpen}
        onClose={() => setIsCaseVaultOpen(false)}
        cases={cases}
        onCasesUpdated={loadData}
      />

      {/* Master Templates Modal */}
      <MasterTemplatesModal
        isOpen={isMasterTemplatesOpen}
        onClose={() => setIsMasterTemplatesOpen(false)}
        templates={templates}
        onTemplatesUpdated={loadData}
      />

      {/* Requisition Generator Modal */}
      <RequisitionGeneratorModal
        isOpen={activeGenerator !== null}
        generatorType={activeGenerator}
        onClose={() => setActiveGenerator(null)}
        cases={cases}
        templates={templates}
        onOpenCaseVault={() => {
          setActiveGenerator(null);
          setIsCaseVaultOpen(true);
        }}
        onRequisitionCreated={loadData}
      />
    </div>
  );
}
