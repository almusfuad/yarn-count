import { useState } from 'react';
import { useStore } from '../store/useStore';
import './SetupPanel.css';

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
    <div className="setup-panel">
      {/* Collapsed Bar */}
      <div className="setup-bar" onClick={handleToggle}>
        <div className="setup-left">
          <span className="setup-icon">⚙</span>
          <span className="setup-label">Setup / Configuration</span>
          <span className="active-badge">Active</span>
        </div>
        <div className="setup-center">
          <span className="roll-target">Roll Target: {session.rollTarget} counts</span>
        </div>
        <div className="setup-right">
          <span className={`chevron ${isOpen ? 'open' : ''}`}>▼</span>
        </div>
      </div>

      {/* Expanded Panel */}
      {isOpen && (
        <div className="setup-content">
          <div className="setup-fields">
            <div className="field-group">
              <label>FACILITY / COMPANY</label>
              <input
                type="text"
                value={draft.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
              />
            </div>
            <div className="field-group">
              <label>ASSET / MACHINE NAME</label>
              <input
                type="text"
                value={draft.asset}
                onChange={(e) => handleInputChange('asset', e.target.value)}
              />
            </div>
            <div className="field-group">
              <label>JOB / ARTICLE NAME</label>
              <input
                type="text"
                value={draft.job}
                onChange={(e) => handleInputChange('job', e.target.value)}
              />
            </div>
            <div className="field-group">
              <label>ROLL COUNT TARGET</label>
              <input
                type="number"
                value={draft.rollTarget}
                onChange={(e) => handleInputChange('rollTarget', Number(e.target.value))}
              />
            </div>
            <div className="field-group">
              <label>OPERATOR NAME</label>
              <input
                type="text"
                value={draft.operator}
                onChange={(e) => handleInputChange('operator', e.target.value)}
              />
            </div>
            <div className="field-group">
              <label>FLOOR TARGET</label>
              <input
                type="number"
                value={draft.floorTarget}
                onChange={(e) => handleInputChange('floorTarget', Number(e.target.value))}
              />
            </div>
          </div>

          <div className="shift-field">
            <label>SHIFT</label>
            <input
              type="text"
              value={draft.shift}
              onChange={(e) => handleInputChange('shift', e.target.value)}
            />
          </div>

          <div className="setup-actions">
            <button className="btn-save" onClick={handleSave}>
              Save Configuration
            </button>
            <button className="btn-cancel" onClick={handleCancel}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
