import { useState } from 'react';
import { useStore } from '../store/useStore';

export default function SetupPanel() {
  const session = useStore((state) => state.session);
  const setSession = useStore((state) => state.setSession);

  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState(session);

  const handleToggle = () => {
    if (!isOpen) {
      setDraft(session);
    }
    setIsOpen(!isOpen);
  };

  const handleInputChange = (field, value) => {
    setDraft((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    setSession(draft);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setDraft(session);
    setIsOpen(false);
  };

  return (
    <div className="bg-white rounded-xs shadow-sm mb-6">
      {/* Collapsed Bar */}
      <div
        className="px-5 py-4 cursor-pointer flex justify-between items-center border-b border-neutral-200 bg-neutral-50 hover:bg-neutral-100 transition-colors"
        onClick={handleToggle}
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">⚙</span>
          <span className="font-semibold text-neutral-900">Setup / Configuration</span>
          <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-xs text-xs font-bold">Active</span>
        </div>
        <div className="text-sm text-neutral-600">Roll Target: {session.rollTarget} counts</div>
        <div className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</div>
      </div>

      {/* Expanded Panel */}
      {isOpen && (
        <div className="p-3 sm:p-4 md:p-5 border-t border-neutral-200 bg-white">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 md:gap-5 mb-4 sm:mb-6">
            <div>
              <label className="block text-xs font-bold uppercase text-neutral-500 mb-2">
                Facility / Company
              </label>
              <input
                type="text"
                value={draft.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-xs text-sm font-inherit focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-neutral-500 mb-2">
                Asset / Machine Name
              </label>
              <input
                type="text"
                value={draft.asset}
                onChange={(e) => handleInputChange('asset', e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-xs text-sm font-inherit focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-neutral-500 mb-2">
                Job / Article Name
              </label>
              <input
                type="text"
                value={draft.job}
                onChange={(e) => handleInputChange('job', e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-xs text-sm font-inherit focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-neutral-500 mb-2">
                Roll Count Target
              </label>
              <input
                type="number"
                value={draft.rollTarget}
                onChange={(e) => handleInputChange('rollTarget', Number(e.target.value))}
                className="w-full px-3 py-2 border border-neutral-300 rounded-xs text-sm font-inherit focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-neutral-500 mb-2">
                Operator Name
              </label>
              <input
                type="text"
                value={draft.operator}
                onChange={(e) => handleInputChange('operator', e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-xs text-sm font-inherit focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-neutral-500 mb-2">
                Shift
              </label>
              <input
                type="text"
                value={draft.shift}
                onChange={(e) => handleInputChange('shift', e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-xs text-sm font-inherit focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-start">
            <button
              className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-purple-600 text-white rounded-xs text-sm font-semibold cursor-pointer hover:bg-purple-700 transition-colors"
              onClick={handleSave}
            >
              Save Configuration
            </button>
            <button
              className="px-4 py-2 bg-neutral-200 text-neutral-700 rounded-xs text-sm font-semibold cursor-pointer hover:bg-neutral-300 transition-colors"
              onClick={handleCancel}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
