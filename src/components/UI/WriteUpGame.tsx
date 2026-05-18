import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Glasses, FileText } from 'lucide-react';
import { CharacterSprite } from '../CharacterSprite';

interface WriteUpGameProps {
  patientName: string;
  patientSpriteBase?: string;
  insurance?: string;
  prescription?: {
    sphere: number;
    cylinder: number;
    axis: number;
  };
  onClose: () => void;
  onComplete: (total: number) => void;
}

interface ServiceItem {
  id: string;
  name: string;
  price: number;
  checked: boolean;
  required?: boolean;
}

export const WriteUpGame: React.FC<WriteUpGameProps> = ({ 
  patientName, 
  patientSpriteBase = "james",
  insurance,
  prescription,
  onClose, 
  onComplete 
}) => {
  const [services, setServices] = useState<ServiceItem[]>([
    { id: 'exam', name: 'Eye Exam', price: insurance && insurance !== 'none' && insurance !== 'MEDICAID' ? 50 : 75, checked: false },
    { id: 'glasses', name: 'Complete Pair Glasses', price: 150, checked: false },
    { id: 'frames', name: 'Frames Only', price: 85, checked: false },
    { id: 'lenses', name: 'Lenses Only', price: 75, checked: false },
    { id: 'coatings', name: 'Anti-Reflective Coating', price: 35, checked: false },
    { id: 'tints', name: 'Tinting', price: 25, checked: false },
    { id: 'progressive', name: 'Progressive Add', price: 50, checked: false },
    { id: 'polycarb', name: 'Polycarbonate Upgrade', price: 40, checked: false },
  ]);

  const [patientNeeds, setPatientNeeds] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    const possibleNeeds = ['coatings', 'tints', 'progressive', 'polycarb'];
    const baseNeed = Math.random() > 0.5 ? 'glasses' : (Math.random() > 0.5 ? 'frames' : 'lenses');
    const additionalNeeds = possibleNeeds.filter(() => Math.random() > 0.6);
    
    // Sometimes they just had an exam, so they also need to pay for the exam
    const needsExam = Math.random() > 0.5 ? ['exam'] : [];
    
    setPatientNeeds([...needsExam, baseNeed, ...additionalNeeds]);
  }, []);

  const total = services.filter(s => s.checked).reduce((sum, s) => sum + s.price, 0);

  const toggleService = (id: string) => {
    setServices(services.map(s => 
      s.id === id ? { ...s, checked: !s.checked } : s
    ));
    setFeedback(null);
  };

  const handleComplete = () => {
    const selectedIds = services.filter(s => s.checked).map(s => s.id);
    const missing = patientNeeds.filter(n => !selectedIds.includes(n));
    const extra = selectedIds.filter(n => !patientNeeds.includes(n));

    if (missing.length === 0 && extra.length === 0) {
      onComplete(total);
    } else {
      setFeedback("That doesn't look right. Make sure you select exactly what I asked for!");
    }
  };

  const getNeedsText = () => {
    if (patientNeeds.length === 0) return "Loading...";
    
    const parts = patientNeeds.map(id => services.find(s => s.id === id)?.name || id);
    if (parts.length === 1) return `I need a ${parts[0]}.`;
    if (parts.length === 2) return `I need ${parts[0]} and ${parts[1]}.`;
    
    const last = parts.pop();
    return `I need ${parts.join(', ')}, and ${last}.`;
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-110 flex bg-slate-900"
    >
      {/* Patient Side */}
      <div className="w-1/2 h-full flex flex-col items-center justify-center border-r-8 border-slate-700 bg-slate-800 relative">
        <div className="absolute top-12 max-w-lg bg-white p-6 rounded-2xl border-4 border-slate-300 shadow-xl before:content-[''] before:absolute before:-bottom-6 before:left-1/2 before:-translate-x-1/2 before:border-l-20 before:border-l-transparent before:border-t-24 before:border-t-white before:border-r-20 before:border-r-transparent">
          <p className="text-xl font-medium text-slate-800 leading-relaxed italic">
            "{getNeedsText()} Here is my prescription."
          </p>
        </div>

        <div className="mt-20">
          <CharacterSprite 
            spriteBase={patientSpriteBase} 
            direction="south" 
            size="xxl" 
            scale={2}
          />
        </div>

        <div className="mt-12 text-center bg-black/40 p-6 rounded-xl border-4 border-black/20">
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">{patientName}</h2>
          <p className="text-blue-400 font-black uppercase tracking-widest">{insurance || 'CASH PAY'}</p>
          
          {prescription && (
            <div className="mt-6 bg-white/10 border-2 border-white/20 p-4 rounded text-left">
              <h3 className="text-white/50 font-black uppercase tracking-widest mb-2 text-sm">PRESCRIPTION</h3>
              <div className="font-mono text-white text-lg grid grid-cols-3 gap-8">
                <div><span className="text-white/50 text-sm">SPH:</span> <br/>{prescription.sphere}</div>
                <div><span className="text-white/50 text-sm">CYL:</span> <br/>{prescription.cylinder}</div>
                <div><span className="text-white/50 text-sm">AXS:</span> <br/>{prescription.axis}°</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Write Up Side */}
      <div className="w-1/2 h-full flex flex-col p-8 bg-white overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-5xl font-black uppercase tracking-tighter text-slate-900">Write Up</h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-900 transition-colors"
          >
            <X size={40} />
          </button>
        </div>

        <div className="flex-1 space-y-3">
          <h3 className="text-xl font-black text-blue-600 uppercase tracking-widest flex items-center gap-2 mb-6">
            <FileText size={24} /> Available Services & Options
          </h3>
          
          {services.map(service => (
            <motion.div
              key={service.id}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className={`p-5 rounded-xl border-4 cursor-pointer transition-all flex items-center justify-between ${
                service.checked 
                  ? 'bg-blue-50 border-blue-500 shadow-md' 
                  : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50'
              }`}
              onClick={() => toggleService(service.id)}
            >
              <div className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-lg border-4 flex items-center justify-center transition-colors ${
                  service.checked ? 'bg-blue-500 border-blue-500' : 'bg-white border-slate-300'
                }`}>
                  {service.checked && <Check size={20} className="text-white" strokeWidth={4} />}
                </div>
                <span className={`font-bold text-lg ${service.checked ? 'text-blue-900' : 'text-slate-700'}`}>
                  {service.name}
                </span>
              </div>
              <span className={`font-black text-xl ${service.checked ? 'text-blue-600' : 'text-slate-400'}`}>
                ${service.price}
              </span>
            </motion.div>
          ))}
        </div>

        <div className="border-t-4 border-slate-200 pt-6 mt-6 bg-slate-50 -mx-8 -mb-8 p-8 rounded-t-3xl">
          <AnimatePresence>
            {feedback && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-4 p-4 bg-red-100 border-2 border-red-200 text-red-600 font-bold rounded-xl flex items-center gap-2"
              >
                <X size={20} /> {feedback}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex justify-between items-center mb-6">
            <span className="text-2xl font-black uppercase text-slate-500">TOTAL DUE</span>
            <span className="text-5xl font-black text-slate-900">${total}</span>
          </div>
          <button
            onClick={handleComplete}
            disabled={services.filter(s => s.checked).length === 0}
            className={`w-full py-6 font-black text-2xl uppercase tracking-widest rounded-2xl transition-all ${
              services.filter(s => s.checked).length > 0
                ? 'bg-slate-900 text-white hover:bg-blue-600 shadow-xl hover:-translate-y-1 hover:shadow-2xl'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Glasses className="inline mr-3 mb-1" size={28} /> Process Order
          </button>
        </div>
      </div>
    </motion.div>
  );
};