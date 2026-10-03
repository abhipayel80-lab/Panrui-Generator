import React, { useState } from 'react';
import { CaseRecord, saveCase, deleteCase } from '../db/indexedDB';
import { Plus, Trash2, Edit2, Check, X, FolderLock, Search } from 'lucide-react';

interface CaseVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  cases: CaseRecord[];
  onCasesUpdated: () => void;
  onSelectCase?: (caseItem: CaseRecord) => void;
}

export const CaseVaultModal: React.FC<CaseVaultModalProps> = ({
  isOpen,
  onClose,
  cases,
  onCasesUpdated,
  onSelectCase,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [title, setTitle] = useState('');
  const [reference, setReference] = useState('');
  const [gist, setGist] = useState('');
  const [ioName, setIoName] = useState('');

  if (!isOpen) return null;

  const resetForm = () => {
    setTitle('');
    setReference('');
    setGist('');
    setIoName('');
    setIsAdding(false);
    setEditingId(null);
  };

  const startAdd = () => {
    resetForm();
    setIsAdding(true);
  };

  const startEdit = (c: CaseRecord) => {
    setTitle(c.title);
    setReference(c.reference);
    setGist(c.gist);
    setIoName(c.ioName);
    setEditingId(c.id);
    setIsAdding(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !reference.trim()) return;

    const record: CaseRecord = {
      id: editingId || `case_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: title.trim(),
      reference: reference.trim(),
      gist: gist.trim(),
      ioName: ioName.trim(),
      updatedAt: Date.now(),
    };

    await saveCase(record);
    onCasesUpdated();
    resetForm();
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this case from Case Vault?')) {
      await deleteCase(id);
      onCasesUpdated();
    }
  };

  const filteredCases = cases.filter(
    (c) =>
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.ioName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <FolderLock className="w-5 h-5 text-slate-700" />
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Case Vault</h2>
              <p className="text-xs text-slate-500">Central case repository for all requisition generators</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Top toolbar */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search cases by title, reference, or IO name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-300 rounded bg-white text-slate-800 focus:outline-none focus:border-slate-500"
              />
            </div>
            {!isAdding && (
              <button
                onClick={startAdd}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-slate-800 text-white rounded hover:bg-slate-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Case
              </button>
            )}
          </div>

          {/* Add / Edit Form */}
          {isAdding && (
            <form onSubmit={handleSubmit} className="mb-6 p-4 border border-slate-200 rounded-lg bg-slate-50">
              <h3 className="text-sm font-semibold text-slate-800 mb-3">
                {editingId ? 'Edit Case in Vault' : 'New Case Entry'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Case Title *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Cyber Fraud Investigation"
                    className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded bg-white text-slate-800 focus:outline-none focus:border-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Case Reference *</label>
                  <input
                    type="text"
                    required
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="e.g. FIR No. 12/2026 u/s 66D IT Act"
                    className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded bg-white text-slate-800 focus:outline-none focus:border-slate-500"
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="block text-xs font-medium text-slate-700 mb-1">Case Gist</label>
                <textarea
                  rows={3}
                  value={gist}
                  onChange={(e) => setGist(e.target.value)}
                  placeholder="Brief synopsis/gist of the case allegations and matter under investigation..."
                  className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded bg-white text-slate-800 focus:outline-none focus:border-slate-500"
                />
              </div>

              <div className="mb-4">
                <label className="block text-xs font-medium text-slate-700 mb-1">IO Name</label>
                <input
                  type="text"
                  value={ioName}
                  onChange={(e) => setIoName(e.target.value)}
                  placeholder="e.g. Insp. R. Sharma, Cyber Crime Unit"
                  className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded bg-white text-slate-800 focus:outline-none focus:border-slate-500"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs font-medium text-white bg-slate-800 rounded hover:bg-slate-700"
                >
                  {editingId ? 'Update Case' : 'Save to Vault'}
                </button>
              </div>
            </form>
          )}

          {/* Cases List */}
          {filteredCases.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-slate-200 rounded-lg">
              <p className="text-sm text-slate-500">No cases found in Case Vault.</p>
              <button
                onClick={startAdd}
                className="mt-2 text-xs font-medium text-slate-700 hover:text-slate-900 underline"
              >
                Add your first case
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg">
              {filteredCases.map((c) => (
                <div
                  key={c.id}
                  className="p-4 bg-white hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-semibold text-sm text-slate-900 truncate">{c.title}</span>
                      <span className="inline-block px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-700 rounded border border-slate-200">
                        {c.reference}
                      </span>
                    </div>
                    {c.gist && (
                      <p className="text-xs text-slate-600 line-clamp-2 mb-1 leading-relaxed">{c.gist}</p>
                    )}
                    <div className="text-xs text-slate-500 font-medium">
                      IO: <span className="text-slate-700">{c.ioName || 'Not specified'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                    {onSelectCase && (
                      <button
                        onClick={() => {
                          onSelectCase(c);
                          onClose();
                        }}
                        className="px-2.5 py-1 text-xs font-medium text-slate-800 bg-slate-100 hover:bg-slate-200 rounded border border-slate-300"
                      >
                        Select Case
                      </button>
                    )}
                    <button
                      onClick={() => startEdit(c)}
                      className="p-1.5 text-slate-500 hover:text-slate-800 rounded hover:bg-slate-100"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(c.id, e)}
                      className="p-1.5 text-red-500 hover:text-red-700 rounded hover:bg-red-50"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>{cases.length} cases stored in vault</span>
          <button
            onClick={onClose}
            className="px-3 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-100"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
