import React, { useState } from 'react';
import { X, Search, Database, ExternalLink, Globe, Tag } from 'lucide-react';
import { INITIAL_MSMARCO_DATASET, type MSMARCOPassage } from '../services/msmarcoDataset';

interface DatasetInspectorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DatasetInspectorDrawer: React.FC<DatasetInspectorDrawerProps> = ({
  isOpen,
  onClose,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  if (!isOpen) return null;

  const categories = ['ALL', ...Array.from(new Set(INITIAL_MSMARCO_DATASET.map((p) => p.category)))];

  const filteredPassages = INITIAL_MSMARCO_DATASET.filter((passage) => {
    const matchesSearch =
      passage.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      passage.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      passage.metadata.domain.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === 'ALL' || passage.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-xl bg-dark-900 border-l border-indigo-500/30 flex flex-col shadow-2xl">
          {/* Header */}
          <div className="p-4 sm:p-6 bg-dark-800/80 border-b border-gray-800 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  MSMARCO-XI Vector Index
                </h2>
                <p className="text-xs text-gray-400">
                  {INITIAL_MSMARCO_DATASET.length} Indexed Passages from AI4Bharat MSMARCO-XI
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition"
              title="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search & Filter Controls */}
          <div className="p-4 space-y-3 bg-dark-950/60 border-b border-gray-800">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search indexed passages or domains..."
                className="w-full pl-9 pr-4 py-2 bg-dark-800 border border-gray-700/80 rounded-xl text-xs text-gray-100 placeholder-gray-400 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 no-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                    selectedCategory === cat
                      ? 'bg-indigo-600 text-white'
                      : 'bg-dark-800 text-gray-400 hover:text-gray-200 border border-gray-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Passages List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {filteredPassages.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-xs">
                No passages match "{searchTerm}". Try another search query.
              </div>
            ) : (
              filteredPassages.map((passage: MSMARCOPassage) => (
                <div
                  key={passage.id}
                  className="p-4 rounded-xl glass-panel border border-indigo-500/20 space-y-2 hover:border-indigo-500/40 transition"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-indigo-300 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-indigo-400" />
                      {passage.title}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono text-[10px]">
                      {passage.metadata.domain}
                    </span>
                  </div>

                  <p className="text-xs text-gray-300 leading-relaxed font-sans">
                    {passage.text}
                  </p>

                  <div className="pt-2 border-t border-gray-800/80 flex items-center justify-between text-[11px] text-gray-400">
                    <span className="flex items-center gap-1">
                      <Globe className="w-3 h-3 text-emerald-400" /> Language: {passage.languageName}
                    </span>
                    <span className="font-mono text-[10px] text-gray-500">ID: {passage.id}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-4 bg-dark-800/80 border-t border-gray-800 flex items-center justify-between text-xs text-gray-400">
            <span>Powered by AI4Bharat Dataset</span>
            <a
              href="https://huggingface.co/datasets/ai4bharat/MSMARCO-XI"
              target="_blank"
              rel="noreferrer"
              className="text-indigo-400 hover:underline flex items-center gap-1 font-medium"
            >
              HuggingFace Repo <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
