import React, { useState } from 'react';
import type { STTConfig, STTProvider } from '../services/sttService';
import { X, Key, Check } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: STTConfig;
  onSaveConfig: (newConfig: STTConfig) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
}) => {
  const [provider, setProvider] = useState<STTProvider>(config.provider);
  const [elevenLabsKey, setElevenLabsKey] = useState(config.elevenLabsApiKey || '');
  const [sarvamKey, setSarvamKey] = useState(config.sarvamApiKey || '');

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveConfig({
      provider,
      elevenLabsApiKey: elevenLabsKey,
      sarvamApiKey: sarvamKey,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="glass-panel rounded-2xl max-w-md w-full p-6 border border-indigo-500/30 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between border-b border-gray-800 pb-3">
          <h3 className="text-base font-bold text-gray-100 flex items-center gap-2">
            <Key className="w-4 h-4 text-indigo-400" /> STT Provider & API Key Settings
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* STT Provider Choice */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-300">Select Speech-to-Text Provider:</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'elevenlabs', label: 'ElevenLabs' },
              { id: 'sarvam', label: 'Sarvam AI' },
              { id: 'browser-fallback', label: 'Browser Demo' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setProvider(p.id as STTProvider)}
                className={`px-3 py-2 rounded-xl text-xs font-medium border transition ${
                  provider === p.id
                    ? 'bg-indigo-600 border-indigo-400 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-dark-800 border-gray-800 text-gray-400 hover:border-gray-700'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* ElevenLabs API Key */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-300">ElevenLabs API Key:</label>
          <input
            type="password"
            value={elevenLabsKey}
            onChange={(e) => setElevenLabsKey(e.target.value)}
            placeholder="xi-api-key..."
            className="w-full px-3.5 py-2 rounded-xl glass-input text-xs text-gray-200"
          />
          <p className="text-[10px] text-gray-400">Required if using ElevenLabs STT provider.</p>
        </div>

        {/* Sarvam AI API Key */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-300">Sarvam AI API Key:</label>
          <input
            type="password"
            value={sarvamKey}
            onChange={(e) => setSarvamKey(e.target.value)}
            placeholder="api-subscription-key..."
            className="w-full px-3.5 py-2 rounded-xl glass-input text-xs text-gray-200"
          />
          <p className="text-[10px] text-gray-400">Required if using Sarvam AI STT provider.</p>
        </div>

        <div className="pt-2 border-t border-gray-800 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-dark-800 hover:bg-gray-800 text-xs text-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Save Configuration</span>
          </button>
        </div>
      </div>
    </div>
  );
};
