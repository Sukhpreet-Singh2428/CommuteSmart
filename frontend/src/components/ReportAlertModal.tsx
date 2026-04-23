import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { alertsAPI } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const ALERT_TYPES = [
  { value: 'traffic',      label: 'Traffic',      icon: '🚦' },
  { value: 'accident',     label: 'Accident',     icon: '💥' },
  { value: 'delay',        label: 'Delay',        icon: '🕐' },
  { value: 'construction', label: 'Construction', icon: '🔧' },
  { value: 'weather',      label: 'Weather',      icon: '🌧' },
  { value: 'info',         label: 'Info',         icon: 'ℹ️' },
];

const SEVERITY_OPTIONS = [
  { value: 'low',      label: 'Low',      color: 'text-green-400',  dot: '🟢' },
  { value: 'medium',   label: 'Medium',   color: 'text-yellow-400', dot: '🟡' },
  { value: 'high',     label: 'High',     color: 'text-orange-400', dot: '🟠' },
  { value: 'critical', label: 'Critical', color: 'text-red-400',    dot: '🔴' },
];

const PUNJAB_AREAS = [
  'Sector 17, Chandigarh', 'Sector 22, Chandigarh', 'Sector 35, Chandigarh',
  'Rajpura Bypass', 'Patiala Road', 'Ambala Highway', 'Mohali Phase 1',
  'Mohali Phase 7', 'Zirakpur', 'Banur', 'Kharar', 'Morinda', 'Ropar',
  'Ludhiana Bus Stand', 'Jalandhar City', 'Amritsar Golden Temple Road',
  'Other'
];

interface ReportAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  routeFrom?: string;
  routeTo?: string;
  startCoords?: [number, number];
}

export function ReportAlertModal({ isOpen, onClose, routeFrom, routeTo, startCoords }: ReportAlertModalProps) {
  const { user, updateUser } = useAuth();
  const [alertMessage, setAlertMessage] = useState('');
  const [selectedType, setSelectedType] = useState('traffic');
  const [selectedSeverity, setSelectedSeverity] = useState('medium');
  const [locationText, setLocationText] = useState('');
  const [selectedArea, setSelectedArea] = useState(PUNJAB_AREAS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [messageError, setMessageError] = useState('');

  const handleSubmit = async () => {
    // Validation
    if (!alertMessage.trim()) {
      setMessageError('Alert message is required');
      return;
    }
    if (alertMessage.trim().length < 10) {
      setMessageError('Message must be at least 10 characters');
      return;
    }
    setMessageError('');
    setIsSubmitting(true);

    try {
      const lat = startCoords ? startCoords[0] : 30.73;
      const long = startCoords ? startCoords[1] : 76.78;

      const response = await alertsAPI.createAlert({
        message: alertMessage.trim(),
        type: selectedType,
        severity: selectedSeverity,
        location: locationText || '',
        area: selectedArea,
        routeFrom: routeFrom || '',
        routeTo: routeTo || '',
        lat,
        long,
      });

      if (response.data.success) {
        toast.success('✅ Alert reported! +10 XP');
        if (user) {
          updateUser({ points: (user.points || 0) + 10 });
        }
        // Reset form
        setAlertMessage('');
        setSelectedType('traffic');
        setSelectedSeverity('medium');
        setLocationText('');
        setSelectedArea(PUNJAB_AREAS[0]);
        onClose();
      }
    } catch (error: unknown) {
      const err = error as { response?: { status?: number } };
      if (err.response?.status === 401) {
        toast.error('Please login to report alerts');
      } else {
        toast.error('Failed to report alert. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="bg-[#0a1411] border border-white/10 rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto custom-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="text-xl">⚠</span>
                Report Alert
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-4">
              {/* Route Details (only when route context exists) */}
              {routeFrom && routeTo && (
                <div>
                  <label className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-2 block">
                    Route Details
                  </label>
                  <div className="bg-[#122620]/50 border border-white/10 rounded-xl px-3 py-2 text-sm text-gray-300">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-2 h-2 rounded-full bg-[#0fb880]"></span>
                      <span>From: {routeFrom}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500"></span>
                      <span>To: {routeTo}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Alert Message */}
              <div>
                <label className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-2 block">
                  Alert Message <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={alertMessage}
                  onChange={(e) => {
                    setAlertMessage(e.target.value);
                    if (messageError) setMessageError('');
                  }}
                  placeholder="Describe the traffic issue, road condition, or any alert..."
                  className="w-full bg-[#122620]/50 border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:ring-1 focus:ring-[#0fb880] focus:border-[#0fb880] outline-none transition-all text-white focus:bg-[#122620]/70 resize-none"
                  rows={3}
                  maxLength={200}
                />
                <div className="flex justify-between items-center mt-1">
                  {messageError && (
                    <span className="text-xs text-red-400">{messageError}</span>
                  )}
                  <span className="text-xs text-gray-500 ml-auto">
                    {alertMessage.length}/200
                  </span>
                </div>
              </div>

              {/* Alert Type */}
              <div>
                <label className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-2 block">
                  Alert Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {ALERT_TYPES.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setSelectedType(type.value)}
                      className={`p-2.5 rounded-xl border transition-all flex items-center gap-2 ${
                        selectedType === type.value
                          ? 'bg-[#0fb880]/20 border-[#0fb880]/40 text-[#0fb880]'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:border-[#0fb880]/20 hover:text-[#0fb880]'
                      }`}
                    >
                      <span className="text-base">{type.icon}</span>
                      <span className="text-xs font-medium">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Severity */}
              <div>
                <label className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-2 block">
                  Severity
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {SEVERITY_OPTIONS.map((sev) => (
                    <button
                      key={sev.value}
                      onClick={() => setSelectedSeverity(sev.value)}
                      className={`p-2 rounded-xl border transition-all flex flex-col items-center gap-1 ${
                        selectedSeverity === sev.value
                          ? 'bg-white/10 border-white/30'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <span className="text-sm">{sev.dot}</span>
                      <span className="text-[10px] text-gray-300 font-medium">{sev.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-2 block">
                  Location (Optional)
                </label>
                <input
                  type="text"
                  value={locationText}
                  onChange={(e) => setLocationText(e.target.value)}
                  className="w-full bg-[#122620]/50 border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:ring-1 focus:ring-[#0fb880] focus:border-[#0fb880] outline-none transition-all text-white focus:bg-[#122620]/70"
                  placeholder="e.g., Sector 17 Chowk, NH-44"
                />
              </div>

              {/* Area */}
              <div>
                <label className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-2 block">
                  Area
                </label>
                <select
                  value={selectedArea}
                  onChange={(e) => setSelectedArea(e.target.value)}
                  className="w-full bg-[#122620]/50 border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:ring-1 focus:ring-[#0fb880] focus:border-[#0fb880] outline-none transition-all text-white focus:bg-[#122620]/70"
                >
                  {PUNJAB_AREAS.map((area) => (
                    <option key={area} value={area}>{area}</option>
                  ))}
                </select>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={onClose}
                  className="flex-1 bg-gray-500/20 hover:bg-gray-500/30 text-gray-400 font-medium py-2.5 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !alertMessage.trim()}
                  className="flex-1 bg-[#0fb880] hover:bg-[#0fb880]/90 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Reporting...</span>
                    </>
                  ) : (
                    <>
                      <span>🚨</span>
                      <span>Report Alert</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
