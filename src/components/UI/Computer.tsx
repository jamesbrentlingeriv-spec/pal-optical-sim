
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Search, ShieldCheck, CreditCard, Calendar, CheckCircle2, User } from 'lucide-react';
import { useWindowSize } from '../../hooks/useWindowSize';

interface ComputerProps {
  onClose: () => void;
  onCompleteSale: (amount: number) => void;
}

export default function Computer({ onClose, onCompleteSale }: ComputerProps) {
  const { width } = useWindowSize();
  const isMobile = width < 768;
  const scale = isMobile ? Math.min(1, width / 1000) : 1;
  const [activeTab, setActiveTab] = useState<'insurance' | 'payment' | 'appointments'>('insurance');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResult, setSearchResult] = useState<any | null>(null);
  const [paymentStep, setPaymentStep] = useState<'IDLE' | 'INSERT_CARD' | 'PIN_ENTRY' | 'PROCESSING' | 'SUCCESS'>('IDLE');
  const [pin, setPin] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSearch = () => {
     // Mock insurance lookup
     if (searchTerm.length > 2) {
         setSearchResult({
             name: searchTerm,
             insurance: 'Blue Shield',
             coverage: '80%',
             copay: '$10.00',
             status: 'Active'
         });
     }
  };

  const startPayment = () => {
    setPaymentStep('INSERT_CARD');
  };

  const handleCardInserted = () => {
    setPaymentStep('PIN_ENTRY');
  };

  const handleNumberClick = (n: number | string) => {
    if (paymentStep === 'PIN_ENTRY' && typeof n === 'number') {
        if (pin.length < 4) {
            const newPin = pin + n;
            setPin(newPin);
            if (newPin.length === 4) {
                // Auto process after 4 digits
                processPayment();
            }
        }
    }
  };

  const processPayment = () => {
    setPaymentStep('PROCESSING');
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setPaymentStep('SUCCESS');
      setShowSuccess(true);
      onCompleteSale(150);
      setTimeout(() => {
          setShowSuccess(false);
          setPaymentStep('IDLE');
          setPin('');
          setActiveTab('insurance');
      }, 3000);
    }, 3000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl"
    >
      <div 
        style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }}
        className="bg-black border-[6px] border-white shadow-[16px_16px_0_0_rgba(0,0,0,1)] w-full max-w-5xl h-150 flex overflow-hidden pixel-border"
      >
        {/* Sidebar */}
        <div className="w-64 bg-black border-r-4 border-white flex flex-col">
          <div className="p-6 border-b-4 border-white">
            <h2 className="text-sm font-black italic text-white animate-pulse">PAL-OS v1.0</h2>
          </div>
          
          <nav className="flex-1 p-4 space-y-4">
            {[
              { id: 'insurance', label: 'INSURANCE', icon: ShieldCheck },
              { id: 'payment', label: 'PAYMENT', icon: CreditCard },
              { id: 'appointments', label: 'LOGS', icon: Calendar },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-4 border-4 transition-all text-[8px] font-black ${
                  activeTab === tab.id ? 'bg-white text-black border-white shadow-[4px_4px_0_0_rgba(255,255,255,0.3)]' : 'text-white border-transparent hover:border-white/20'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>

          <button 
            onClick={onClose}
            className="m-4 px-4 py-4 bg-black border-4 border-red-500 text-red-500 hover:bg-red-500 hover:text-black font-black text-[8px] flex items-center justify-center gap-2 transition-all shadow-[4px_4px_0_0_rgba(239,68,68,0.2)]"
          >
            <X className="w-4 h-4" />
            LOGOUT
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 bg-black relative overflow-hidden">
          <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,black_100%)]" />
          <div className="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-size-[100%_2px,2px_100%] pointer-events-none" />

          <AnimatePresence mode="wait">
            {activeTab === 'insurance' && (
              <motion.div 
                key="ins" 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="p-10 space-y-8 h-full flex flex-col"
              >
                <div>
                  <h1 className="text-xl font-black text-white underline decoration-4 decoration-blue-500 underline-offset-8">PATIENT LOOKUP</h1>
                  <p className="text-blue-400 text-[6px] mt-4 uppercase animate-pulse">Scanning server database...</p>
                </div>

                <div className="flex gap-4">
                  <input 
                    type="text" 
                    placeholder="NAME..." 
                    className="flex-1 pl-4 pr-4 py-4 bg-black border-4 border-white text-white text-[10px] font-black focus:border-blue-500 outline-none placeholder:text-white/20"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <button 
                    onClick={handleSearch}
                    className="px-8 py-4 bg-white text-black font-black hover:bg-blue-500 hover:text-white transition-all shadow-[6px_6px_0_0_black]"
                  >
                    SEARCH
                  </button>
                </div>

                {searchResult ? (
                   <motion.div 
                     initial={{ y: 20, opacity: 0 }} 
                     animate={{ y: 0, opacity: 1 }}
                     className="border-4 border-white p-6 bg-black relative"
                   >
                     <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div>
                                <label className="text-[6px] text-blue-400 uppercase">IDENTIFIER</label>
                                <div className="text-lg font-black text-white">{searchResult.name}</div>
                            </div>
                            <div>
                                <label className="text-[6px] text-blue-400 uppercase">PROVIDER</label>
                                <div className="text-sm font-black text-white italic">{searchResult.insurance}</div>
                            </div>
                        </div>
                        <div className="space-y-6 text-right">
                            <div>
                                <label className="text-[6px] text-blue-400 uppercase">COVERAGE</label>
                                <div className="text-lg font-black text-green-500">{searchResult.coverage}</div>
                            </div>
                            <div>
                                <label className="text-[6px] text-blue-400 uppercase">CO-PAY</label>
                                <div className="text-lg font-black text-white">{searchResult.copay}</div>
                            </div>
                        </div>
                     </div>
                     <div className="mt-8 pt-6 border-t-2 border-white/20 flex justify-between items-center">
                        <div className="flex items-center gap-2 text-green-500 text-[8px] font-black underline">
                           [ STATUS: VERIFIED ]
                        </div>
                        <button 
                          onClick={() => setActiveTab('payment')}
                          className="text-white text-[8px] font-black border-2 border-white px-3 py-2 hover:bg-white hover:text-black transition-all"
                        >
                            GOTO CHECKOUT -{'>'}
                        </button>
                     </div>
                   </motion.div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center opacity-10">
                    <Search className="w-20 h-20 mb-4" />
                    <span className="text-[8px] font-black uppercase tracking-[4px]">No Data Selected</span>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'payment' && (
              <motion.div 
                key="pay" 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="p-10 flex flex-col h-full bg-slate-900/20"
              >
                <div className="mb-6 text-center">
                    <h1 className="text-xl font-black text-white underline decoration-4 decoration-green-500 underline-offset-8">CREDIT_TERMINAL_v4</h1>
                    <p className="text-[6px] text-green-500/50 mt-4 font-mono">CONNECTION: ENCRYPTED_SSL_AES256</p>
                </div>
 
                <div className="flex-1 flex flex-col items-center justify-center gap-8">
                    {!showSuccess ? (
                        <div className="flex gap-12 items-center">
                            {/* The Terminal Device */}
                            <div className="w-64 bg-[#1a1a1a] border-x-12 border-t-12 border-b-24 border-[#2a2a2a] p-4 shadow-[20px_20px_0_0_rgba(0,0,0,1)] relative flex flex-col rounded-t-xl">
                                {/* Screen Area */}
                                <div className="w-full h-32 bg-[#0a1f0a] border-4 border-black mb-6 p-3 flex flex-col items-center justify-center relative overflow-hidden">
                                     <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%)] bg-size-[100%_4px] pointer-events-none" />
                                     
                                     {paymentStep === 'IDLE' && (
                                         <div className="text-center">
                                             <div className="text-[6px] text-green-500/40 mb-1 uppercase">TOTAL</div>
                                             <div className="text-2xl font-black text-green-400">$150.00</div>
                                         </div>
                                     )}

                                     {paymentStep === 'INSERT_CARD' && (
                                         <div className="text-center space-y-2 animate-pulse">
                                             <CreditCard className="w-8 h-8 text-green-400 mx-auto" />
                                             <div className="text-[8px] font-black text-green-400">INSERT CARD</div>
                                         </div>
                                     )}

                                     {paymentStep === 'PIN_ENTRY' && (
                                         <div className="text-center space-y-4">
                                             <div className="text-[8px] font-black text-green-400">ENTER PIN</div>
                                             <div className="flex gap-2 justify-center">
                                                 {[...Array(4)].map((_, i) => (
                                                     <div key={i} className={`w-3 h-3 border-2 border-green-500/30 flex items-center justify-center ${pin.length > i ? 'bg-green-500' : ''}`} />
                                                 ))}
                                             </div>
                                         </div>
                                     )}

                                     {paymentStep === 'PROCESSING' && (
                                         <div className="text-center space-y-2">
                                             <div className="text-[8px] font-black text-green-400 animate-pulse">AUTHORIZING...</div>
                                             <div className="w-full h-1 bg-green-900 overflow-hidden">
                                                 <motion.div 
                                                     initial={{ x: '-100%' }}
                                                     animate={{ x: '100%' }}
                                                     transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                                     className="w-1/2 h-full bg-green-400"
                                                 />
                                             </div>
                                         </div>
                                     )}
                                </div>

                                {/* Keypad */}
                                <div className="grid grid-cols-3 gap-2 mb-4">
                                    {[1,2,3,4,5,6,7,8,9,'*',0,'#'].map(n => (
                                        <button 
                                            key={n} 
                                            onClick={() => handleNumberClick(n)}
                                            className="h-8 bg-[#2a2a2a] border-b-2 border-black hover:bg-[#3a3a3a] active:translate-y-0.5 active:border-b-0 flex items-center justify-center text-[10px] text-white/80 font-black transition-all rounded-sm"
                                        >
                                            {n}
                                        </button>
                                    ))}
                                </div>

                                {/* Function Buttons */}
                                <div className="grid grid-cols-2 gap-2">
                                    <button className="h-6 bg-red-900/40 text-red-500 text-[6px] font-black border-b-2 border-red-950 rounded-sm">CANCEL</button>
                                    <button className="h-6 bg-green-900/40 text-green-500 text-[6px] font-black border-b-2 border-green-950 rounded-sm">ENTER</button>
                                </div>

                                {/* Card Slot Animation */}
                                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-48 h-6 bg-[#0a0a0a] border-t-2 border-white/10 flex items-center justify-center">
                                     <div className="w-40 h-1 bg-black rounded-full" />
                                     
                                     {paymentStep === 'INSERT_CARD' && (
                                         <motion.div 
                                            initial={{ y: 40, opacity: 0 }}
                                            animate={{ y: 2 }}
                                            onClick={handleCardInserted}
                                            className="absolute w-32 h-20 bg-blue-600 border-2 border-white rounded-md cursor-pointer hover:bg-blue-500 flex flex-col p-2 shadow-2xl"
                                         >
                                             <div className="w-8 h-6 bg-yellow-400/80 rounded-sm mb-2" />
                                             <div className="text-[4px] text-white/50">PLATINUM_CARD</div>
                                             <div className="mt-auto text-[6px] text-white font-mono">**** **** **** 4242</div>
                                         </motion.div>
                                     )}

                                     {paymentStep !== 'IDLE' && paymentStep !== 'INSERT_CARD' && (
                                          <div className="absolute w-32 h-20 bg-blue-800 border-2 border-white/20 rounded-md -bottom-16 opacity-40 translate-y-2 pointer-events-none" />
                                     )}
                                </div>
                            </div>

                            {/* Action Instructions */}
                            <div className="w-64 space-y-4">
                                {paymentStep === 'IDLE' && (
                                    <button 
                                        onClick={startPayment}
                                        className="w-full py-4 bg-white text-black font-black hover:bg-green-500 hover:text-white transition-all shadow-[6px_6px_0_0_black] text-[10px] flex items-center justify-center gap-3"
                                    >
                                        <CreditCard className="w-4 h-4" />
                                        START CHECKOUT
                                    </button>
                                )}
                                
                                {paymentStep === 'INSERT_CARD' && (
                                    <div className="bg-blue-900/20 border-2 border-blue-500/50 p-4 rounded-lg">
                                        <p className="text-[8px] text-blue-400 font-black animate-pulse">ACTION: CLICK THE CARD BELOW TO INSERT</p>
                                    </div>
                                )}

                                {paymentStep === 'PIN_ENTRY' && (
                                    <div className="bg-yellow-900/20 border-2 border-yellow-500/50 p-4 rounded-lg">
                                        <p className="text-[8px] text-yellow-400 font-black">ACTION: USE KEYPAD TO ENTER PIN (any 4 digits)</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center space-y-8">
                            <motion.div 
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-32 h-32 bg-green-500 mx-auto flex items-center justify-center border-4 border-white shadow-[12px_12px_0_0_rgba(0,0,0,1)]"
                            >
                                <CheckCircle2 className="w-20 h-20 text-white" />
                            </motion.div>
                            <h2 className="text-4xl font-black text-white italic tracking-tighter">SALE_APPROVED</h2>
                            <div className="text-green-500 font-black animate-pulse uppercase tracking-[4px] text-[8px]">Printing Receipt...</div>
                            
                            <motion.div 
                                initial={{ y: -20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                className="w-48 h-64 bg-white mx-auto p-4 flex flex-col gap-2 shadow-2xl relative"
                            >
                                <div className="text-[6px] font-black text-black border-b border-black/10 pb-2">OPTICAL_CLINIC_v1</div>
                                <div className="space-y-1 mt-2">
                                    <div className="flex justify-between text-[4px] font-bold text-black/60">
                                        <span>ITEM_01</span>
                                        <span>$120.00</span>
                                    </div>
                                    <div className="flex justify-between text-[4px] font-bold text-black/60">
                                        <span>CO-PAY</span>
                                        <span>$30.00</span>
                                    </div>
                                </div>
                                <div className="mt-auto pt-2 border-t-2 border-black border-dashed flex justify-between text-[8px] font-black text-black">
                                    <span>TOTAL</span>
                                    <span>$150.00</span>
                                </div>
                                <div className="absolute top-0 left-0 w-full h-4 bg-linear-to-b from-black/5 to-transparent" />
                            </motion.div>
                        </div>
                    )}
                </div>
              </motion.div>
            )}

            {activeTab === 'appointments' && (
               <motion.div 
                 key="app" 
                 initial={{ opacity: 0 }} 
                 animate={{ opacity: 1 }} 
                 className="p-10 flex flex-col h-full"
               >
                 <h1 className="text-xl font-black text-white underline decoration-4 decoration-yellow-500 underline-offset-8 mb-12 uppercase">Operation_Logs</h1>
                 <div className="space-y-4 flex-1">
                    {[
                        { time: '09:00', name: 'PATIENT_01', type: 'EYE_EXAM' },
                        { time: '10:30', name: 'PATIENT_02', type: 'ADJUST_FRAME' },
                        { time: '13:00', name: 'EMPTY_SLOT', type: 'AVAILABLE' },
                        { time: '14:30', name: 'PATIENT_03', type: 'LENS_SCAN' }
                    ].map((apt, i) => (
                        <div key={i} className="flex items-center justify-between p-6 bg-black border-4 border-white/20 hover:border-white transition-all cursor-pointer group hover:bg-slate-950">
                            <div className="flex items-center gap-8">
                                <div className="text-lg font-black text-blue-500 italic">
                                    {apt.time}
                                </div>
                                <div className="space-y-1">
                                    <div className="font-black text-sm text-white group-hover:text-blue-400">{apt.name}</div>
                                    <div className="text-[6px] text-white/40 uppercase group-hover:text-white/60">{apt.type}</div>
                                </div>
                            </div>
                            <button className="opacity-0 group-hover:opacity-100 px-4 py-2 bg-white text-black text-[8px] font-black transition-all">
                                INIT_LOG
                            </button>
                        </div>
                    ))}
                 </div>
               </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
