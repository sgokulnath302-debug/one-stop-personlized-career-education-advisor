import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Key, Save, AlertCircle } from 'lucide-react';
import { getStoredKeys, saveKeys } from '../services/keyManager';
import { motion, AnimatePresence } from 'motion/react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [keys, setKeys] = useState<string[]>([]);
  const [newKey, setNewKey] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setKeys(getStoredKeys());
    }
  }, [isOpen]);

  const handleAddKey = () => {
    if (newKey.trim()) {
      const updatedKeys = [...keys, newKey.trim()];
      setKeys(updatedKeys);
      setNewKey('');
    }
  };

  const handleRemoveKey = (index: number) => {
    const updatedKeys = keys.filter((_, i) => i !== index);
    setKeys(updatedKeys);
  };

  const handleSave = () => {
    saveKeys(keys);
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      onClose();
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                <Key size={20} />
              </div>
              <h2 className="text-xl font-bold text-gray-900">API Key Management</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
              <AlertCircle className="text-amber-600 shrink-0" size={20} />
              <p className="text-sm text-amber-800">
                Add multiple Gemini API keys to handle higher traffic or bypass individual quota limits. Keys are stored safely in your browser.
              </p>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-700 block">
                Add New Key
              </label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  placeholder="Enter Gemini API Key"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                />
                <button
                  onClick={handleAddKey}
                  disabled={!newKey.trim()}
                  className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <Plus size={24} />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-700 block">
                Active Keys ({keys.length})
              </label>
              <div className="max-h-48 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                {keys.length === 0 ? (
                  <p className="text-center py-4 text-gray-400 italic text-sm">
                    No custom keys added yet. Using default environment key.
                  </p>
                ) : (
                  keys.map((key, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-xl group hover:border-indigo-200 transition-all"
                    >
                      <code className="text-xs text-gray-600 font-mono">
                        {key.substring(0, 8)}••••••••{key.substring(key.length - 4)}
                      </code>
                      <button
                        onClick={() => handleRemoveKey(index)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all ${
                showSuccess
                  ? 'bg-green-600 text-white'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200'
              }`}
            >
              {showSuccess ? (
                <>Saved Successfully!</>
              ) : (
                <>
                  <Save size={18} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default SettingsModal;
