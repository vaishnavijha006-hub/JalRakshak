// JalRakshak — Voice-Guided Accessibility Assistant
// Persistent, unobtrusive floating assistant providing real bilingual (English & Hindi)
// text-to-speech page guidance, dynamic data telemetry, captions teleprompter,
// and optional voice command recognition.

import { useState, useEffect, useRef, useCallback, useId, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Volume2,
  Play,
  Pause,
  Square,
  Mic,
  MicOff,
  X,
  Compass,
  FileText,
  AlertCircle,
  HelpCircle,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { speechEngine, createSpeechRecognizer, type LanguageCode, type VoiceCapabilities } from '../../utils/speech';
import { generatePageGuidance, getScriptForMode, type NarrationMode } from '../../utils/voiceGuidanceContent';
import { useStore } from '../../data/store';
import { cn } from '../../utils/format';

export function VoiceAssistant() {
  const location = useLocation();
  const navigate = useNavigate();
  const titleId = useId();
  const { metrics, incidents, routes } = useStore();

  const [isOpen, setIsOpen] = useState(false);
  const [lang, setLang] = useState<LanguageCode>('en');
  const [activeMode, setActiveMode] = useState<NarrationMode>('overview');
  const [playbackState, setPlaybackState] = useState<'idle' | 'playing' | 'paused'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [capabilities, setCapabilities] = useState<VoiceCapabilities>(() => speechEngine.getCapabilities());

  // Speech Recognition state (optional)
  const [isListening, setIsListening] = useState(false);
  const [speechTranscript, setSpeechTranscript] = useState('');
  const recognizerRef = useRef<any>(null);
  const isMountedRef = useRef(true);

  const panelRef = useRef<HTMLDivElement>(null);
  const prevPathRef = useRef(location.pathname);

  // Subscribe to system voices change
  useEffect(() => {
    const unsub = speechEngine.subscribeVoices(() => {
      if (isMountedRef.current) {
        setCapabilities(speechEngine.getCapabilities());
      }
    });
    return unsub;
  }, []);

  // Update page guidance dynamically as route or data updates
  const guidance = useMemo(() => generatePageGuidance({
    pathname: location.pathname,
    metrics,
    incidents,
    routes,
  }), [location.pathname, metrics, incidents, routes]);

  // Derive current script directly during render
  const currentScript = useMemo(() => {
    return getScriptForMode(guidance, activeMode, lang);
  }, [guidance, activeMode, lang]);

  // Clean up audio & speech recognition on route change
  useEffect(() => {
    if (prevPathRef.current !== location.pathname) {
      prevPathRef.current = location.pathname;
      speechEngine.stop();
      setPlaybackState('idle');
      if (recognizerRef.current) {
        try {
          recognizerRef.current.abort();
        } catch { /* ignore */ }
        recognizerRef.current = null;
      }
      setIsListening(false);
    }
  }, [location.pathname]);

  // Clean up audio and active speech recognizer on unmount to prevent leaks and stale state updates
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      speechEngine.stop();
      if (recognizerRef.current) {
        try {
          recognizerRef.current.abort();
        } catch { /* ignore */ }
        recognizerRef.current = null;
      }
    };
  }, []);

  // Keyboard accessibility: Escape closes panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleStartNarration = useCallback((mode: NarrationMode) => {
    setActiveMode(mode);
    setErrorMessage(null);

    const script = getScriptForMode(guidance, mode, lang);

    // If Hindi selected but no native Hindi voice is installed, warn user
    if (lang === 'hi' && !capabilities.hasHindiVoice) {
      setErrorMessage(
        'Notice: A native Hindi voice is not installed on this device. Fallback synthesis will be used.'
      );
    }

    const success = speechEngine.speak(script, lang, {
      onStart: () => {
        if (!isMountedRef.current) return;
        setPlaybackState('playing');
      },
      onEnd: () => {
        if (!isMountedRef.current) return;
        setPlaybackState('idle');
      },
      onPause: () => {
        if (!isMountedRef.current) return;
        setPlaybackState('paused');
      },
      onResume: () => {
        if (!isMountedRef.current) return;
        setPlaybackState('playing');
      },
      onError: (err) => {
        if (!isMountedRef.current) return;
        setPlaybackState('idle');
        setErrorMessage(err);
      },
    });

    if (!success && !capabilities.supported) {
      setErrorMessage('Browser text-to-speech is unavailable on this device.');
    }
  }, [guidance, lang, capabilities]);

  const handlePause = () => {
    speechEngine.pause();
    setPlaybackState('paused');
  };

  const handleResume = () => {
    speechEngine.resume();
    setPlaybackState('playing');
  };

  const handleStop = () => {
    speechEngine.stop();
    setPlaybackState('idle');
  };

  // Optional Voice Command recognition
  const handleToggleVoiceInput = () => {
    if (isListening) {
      if (recognizerRef.current) {
        try {
          recognizerRef.current.abort();
        } catch { /* ignore */ }
        recognizerRef.current = null;
      }
      setIsListening(false);
      return;
    }

    if (!capabilities.recognitionSupported) {
      setErrorMessage('Speech recognition is not supported in this browser.');
      return;
    }

    setErrorMessage(null);
    setSpeechTranscript('');

    const recognizer = createSpeechRecognizer({
      lang,
      onStart: () => {
        if (!isMountedRef.current) return;
        setIsListening(true);
      },
      onResult: ({ transcript, isFinal }) => {
        if (!isMountedRef.current) return;
        setSpeechTranscript(transcript);
        if (isFinal) {
          processVoiceCommand(transcript.toLowerCase());
        }
      },
      onError: (err) => {
        if (!isMountedRef.current) return;
        setIsListening(false);
        if (err !== 'aborted' && err !== 'no-speech') {
          setErrorMessage(`Voice command error: ${err}`);
        }
      },
      onEnd: () => {
        if (!isMountedRef.current) return;
        setIsListening(false);
      },
    });

    if (recognizer) {
      recognizerRef.current = recognizer;
      try {
        recognizer.start();
      } catch (err: any) {
        setErrorMessage(err?.message || 'Could not start microphone.');
        setIsListening(false);
      }
    }
  };

  const processVoiceCommand = (cmd: string) => {
    const trimmed = cmd.trim();

    // Navigation commands
    if (trimmed.includes('dashboard') || trimmed.includes('डैशबोर्ड')) {
      navigate('/dashboard');
      setIsOpen(false);
      return;
    }
    if (trimmed.includes('safe route') || trimmed.includes('route') || trimmed.includes('सुरक्षित मार्ग') || trimmed.includes('मार्ग')) {
      navigate('/safe-route');
      setIsOpen(false);
      return;
    }
    if (
      trimmed.includes('intelligence') ||
      trimmed.includes('history') ||
      trimmed.includes('रोड इंटेलिजेंस') ||
      trimmed.includes('इंटेलिजेंस') ||
      trimmed.includes('सड़क बुद्धिमत्ता') ||
      trimmed.includes('लेजर') ||
      trimmed.includes('रिकॉर्ड')
    ) {
      navigate('/road-intelligence');
      setIsOpen(false);
      return;
    }
    if (trimmed.includes('report') || trimmed.includes('रिपोर्ट')) {
      navigate('/report');
      setIsOpen(false);
      return;
    }
    if (trimmed.includes('maintenance') || trimmed.includes('वर्कफ्लो')) {
      navigate('/maintenance');
      setIsOpen(false);
      return;
    }
    if (trimmed.includes('home') || trimmed.includes('होम') || trimmed.includes('मुख्य')) {
      navigate('/');
      setIsOpen(false);
      return;
    }

    // Playback commands
    if (trimmed.includes('stop') || trimmed.includes('रुको') || trimmed.includes('बंद करो') || trimmed.includes('रुकिए')) {
      handleStop();
      return;
    }
    if (trimmed.includes('listen') || trimmed.includes('सुनो') || trimmed.includes('बोलिए')) {
      handleStartNarration('overview');
      return;
    }

    // Language switch
    if (trimmed.includes('hindi') || trimmed.includes('हिंदी') || trimmed.includes('हिन्दी')) {
      setLang('hi');
      return;
    }
    if (trimmed.includes('english') || trimmed.includes('अंग्रेजी')) {
      setLang('en');
      return;
    }

    setErrorMessage(`Command "${cmd}" not recognized. Try saying "Dashboard", "Safe Route", "Report", or "Stop".`);
  };

  return (
    <>
      {/* ── Persistent Floating Access Button ──────────────────────── */}
      <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-40 select-none">
        <button
          type="button"
          onClick={() => setIsOpen(prev => !prev)}
          aria-expanded={isOpen}
          aria-controls="voice-assistant-panel"
          aria-label={
            isOpen
              ? 'Close JalRakshak Voice Assistant'
              : `Talk to JalRakshak Voice Guide (${playbackState === 'playing' ? 'Audio Playing' : 'Idle'})`
          }
          className={cn(
            'group relative flex items-center gap-2.5 rounded-full px-4 py-3 sm:px-4.5 sm:py-3.5 font-bold shadow-2xl transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00F5FF]',
            playbackState === 'playing'
              ? 'bg-[#8B5CF6] text-white shadow-[0_0_24px_rgba(139,92,246,0.55)] border border-[#00F5FF]'
              : 'bg-[#0B0B10] text-white border border-[#8B5CF6]/50 hover:border-[#00F5FF] hover:shadow-[0_0_20px_rgba(0,245,255,0.3)]'
          )}
        >
          {/* Animated audio equalizer / wave when playing */}
          {playbackState === 'playing' ? (
            <div className="flex items-center gap-0.5 h-4 w-4" aria-hidden="true">
              <span className="w-1 bg-[#00F5FF] rounded-full animate-[bounce_0.8s_infinite]" />
              <span className="w-1 bg-white rounded-full animate-[bounce_0.6s_infinite_0.2s]" />
              <span className="w-1 bg-[#00F5FF] rounded-full animate-[bounce_0.7s_infinite_0.4s]" />
            </div>
          ) : (
            <div className="relative flex items-center justify-center">
              <Volume2 className="h-5 w-5 text-[#00F5FF] transition-transform group-hover:scale-110" />
              <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-[#8B5CF6]" />
            </div>
          )}

          <div className="flex flex-col text-left">
            <span className="text-xs font-extrabold tracking-tight flex items-center gap-1.5">
              <span>Talk to JalRakshak</span>
              <span className="text-[10px] font-mono text-[#00F5FF] bg-[#00F5FF]/15 px-1 rounded">
                VOICE
              </span>
            </span>
            <span className="text-[10px] text-zinc-400 font-medium">
              {playbackState === 'playing'
                ? 'Speaking narration...'
                : lang === 'hi'
                ? 'आवाज़ सहायता'
                : 'Accessible audio guide'}
            </span>
          </div>

          <ChevronDown
            className={cn(
              'h-4 w-4 text-zinc-400 transition-transform duration-300 ml-0.5',
              isOpen && 'rotate-180'
            )}
          />
        </button>
      </div>

      {/* ── Accessible Voice Assistant Modal Panel ─────────────────── */}
      {isOpen && (
        <div
          id="voice-assistant-panel"
          ref={panelRef}
          role="dialog"
          aria-labelledby={titleId}
          aria-modal="false"
          className="fixed bottom-20 right-4 sm:bottom-24 sm:right-6 z-40 w-[calc(100vw-2rem)] sm:w-[420px] max-h-[85vh] overflow-y-auto rounded-2xl border border-[#1C1C28] bg-[#0B0B10]/95 backdrop-blur-2xl p-5 shadow-[0_0_50px_rgba(0,0,0,0.85)] text-white animate-in fade-in zoom-in-95 duration-200"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#1C1C28]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 flex items-center justify-center text-[#00F5FF]">
                <Volume2 className="h-4 w-4" />
              </div>
              <div>
                <h2 id={titleId} className="text-sm font-extrabold text-white flex items-center gap-1.5">
                  <span>Voice Guide</span>
                  <span className="text-zinc-500 font-normal">/</span>
                  <span className="text-xs font-semibold text-[#A78BFA]">आवाज़ सहायता</span>
                </h2>
                <p className="text-[11px] text-zinc-400">
                  Delhi Monsoon Road Intelligence Audio Assistant
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close voice assistant"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-[#1C1C28] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00F5FF]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Current Page Context Badge & Language Toggle */}
          <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 bg-[#12121A] p-2.5 rounded-xl border border-[#1C1C28]">
            <div className="flex items-center gap-2">
              <Compass className="h-3.5 w-3.5 text-[#00F5FF] shrink-0" />
              <div className="truncate">
                <span className="text-[9px] uppercase font-mono text-zinc-500 block">Current Page</span>
                <span className="text-xs font-bold text-zinc-200 truncate block max-w-[200px]">
                  {guidance.pageTitle[lang]}
                </span>
              </div>
            </div>

            {/* Bilingual Toggle */}
            <div
              role="radiogroup"
              aria-label="Select Narration Language"
              className="flex items-center bg-[#050507] p-1 rounded-lg border border-[#1C1C28]"
            >
              <button
                type="button"
                role="radio"
                aria-checked={lang === 'en'}
                onClick={() => setLang('en')}
                className={cn(
                  'px-2.5 py-1 rounded text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#00F5FF]',
                  lang === 'en'
                    ? 'bg-[#8B5CF6] text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                )}
              >
                English
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={lang === 'hi'}
                onClick={() => setLang('hi')}
                className={cn(
                  'px-2.5 py-1 rounded text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#00F5FF]',
                  lang === 'hi'
                    ? 'bg-[#8B5CF6] text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                )}
              >
                हिन्दी
              </button>
            </div>
          </div>

          {/* Notice when speech synthesis / Hindi voice has conditions */}
          {!capabilities.hasHindiVoice && lang === 'hi' && (
            <div className="mt-2.5 p-2 rounded-lg bg-[#FFD166]/10 border border-[#FFD166]/30 text-[10px] text-[#FFD166] flex items-start gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>
                Native Hindi speech voice not detected in your operating system. System will use fallback pronunciation or teleprompter captions below.
              </span>
            </div>
          )}

          {errorMessage && (
            <div className="mt-2.5 p-2 rounded-lg bg-[#FF4D6D]/10 border border-[#FF4D6D]/30 text-[10px] text-[#FF4D6D] flex items-start gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span className="flex-1">{errorMessage}</span>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                aria-label="Dismiss error"
                className="text-zinc-400 hover:text-white"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}

          {/* ── 3 Main Narration Action Buttons ──────────────────────── */}
          <div className="mt-3.5 space-y-2">
            {/* Button 1: Listen to this page */}
            <button
              type="button"
              onClick={() => handleStartNarration('overview')}
              className={cn(
                'w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all duration-200 card-interactive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00F5FF]',
                activeMode === 'overview' && playbackState !== 'idle'
                  ? 'border-[#00F5FF] bg-[#00F5FF]/10 shadow-[0_0_15px_rgba(0,245,255,0.15)]'
                  : 'border-[#1C1C28] bg-[#12121A] hover:border-[#8B5CF6]/60 hover:bg-[#161622]'
              )}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#00F5FF]/15 border border-[#00F5FF]/30 flex items-center justify-center text-[#00F5FF] shrink-0">
                  <Volume2 className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">
                    {lang === 'hi' ? 'इस पेज को सुनें' : 'Listen to this Page'}
                  </p>
                  <p className="text-[10px] text-zinc-400">
                    {lang === 'hi' ? 'मुख्य सारांश और स्थिति' : 'High-level screen summary & state'}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono text-[#00F5FF] font-bold">
                {activeMode === 'overview' && playbackState === 'playing' ? 'PLAYING' : 'READ'}
              </span>
            </button>

            {/* Button 2: Explain important information */}
            <button
              type="button"
              onClick={() => handleStartNarration('insights')}
              className={cn(
                'w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all duration-200 card-interactive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00F5FF]',
                activeMode === 'insights' && playbackState !== 'idle'
                  ? 'border-[#8B5CF6] bg-[#8B5CF6]/15 shadow-[0_0_15px_rgba(139,92,246,0.2)]'
                  : 'border-[#1C1C28] bg-[#12121A] hover:border-[#8B5CF6]/60 hover:bg-[#161622]'
              )}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 flex items-center justify-center text-[#A78BFA] shrink-0">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">
                    {lang === 'hi' ? 'महत्वपूर्ण जानकारी समझें' : 'Explain Important Information'}
                  </p>
                  <p className="text-[10px] text-zinc-400">
                    {lang === 'hi' ? 'छिपे खतरे, डेटा व जोखिम विवरण' : 'Hidden hazards, risk metrics & disclaimers'}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono text-[#A78BFA] font-bold">
                {activeMode === 'insights' && playbackState === 'playing' ? 'PLAYING' : 'INSIGHTS'}
              </span>
            </button>

            {/* Button 3: Guide me through controls */}
            <button
              type="button"
              onClick={() => handleStartNarration('controls')}
              className={cn(
                'w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all duration-200 card-interactive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00F5FF]',
                activeMode === 'controls' && playbackState !== 'idle'
                  ? 'border-[#35D07F] bg-[#35D07F]/15 shadow-[0_0_15px_rgba(53,208,127,0.2)]'
                  : 'border-[#1C1C28] bg-[#12121A] hover:border-[#8B5CF6]/60 hover:bg-[#161622]'
              )}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#35D07F]/15 border border-[#35D07F]/30 flex items-center justify-center text-[#35D07F] shrink-0">
                  <HelpCircle className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">
                    {lang === 'hi' ? 'उपलब्ध कंट्रोल्स समझें' : 'Guide Through Available Controls'}
                  </p>
                  <p className="text-[10px] text-zinc-400">
                    {lang === 'hi' ? 'बटन, फ़िल्टर व नेविगेशन की मदद' : 'Filters, buttons & keyboard shortcuts'}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono text-[#35D07F] font-bold">
                {activeMode === 'controls' && playbackState === 'playing' ? 'PLAYING' : 'GUIDE'}
              </span>
            </button>
          </div>

          {/* ── Live Playback Controls Bar ────────────────────────────── */}
          <div className="mt-3.5 p-3 rounded-xl bg-[#050507] border border-[#1C1C28] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                {playbackState === 'playing' ? (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00F5FF] opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#00F5FF]" />
                  </>
                ) : playbackState === 'paused' ? (
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#FFD166]" />
                ) : (
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-zinc-600" />
                )}
              </span>
              <span className="text-xs font-mono font-bold uppercase text-zinc-300">
                {playbackState === 'playing'
                  ? 'Playing Narration'
                  : playbackState === 'paused'
                  ? 'Audio Paused'
                  : 'Ready to Read'}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {playbackState === 'playing' ? (
                <button
                  type="button"
                  onClick={handlePause}
                  aria-label="Pause narration"
                  title="Pause narration"
                  className="p-2 rounded-lg bg-[#1C1C28] hover:bg-[#2A2A3C] text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00F5FF]"
                >
                  <Pause className="h-4 w-4 text-[#FFD166]" />
                </button>
              ) : playbackState === 'paused' ? (
                <button
                  type="button"
                  onClick={handleResume}
                  aria-label="Resume narration"
                  title="Resume narration"
                  className="p-2 rounded-lg bg-[#1C1C28] hover:bg-[#2A2A3C] text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00F5FF]"
                >
                  <Play className="h-4 w-4 text-[#00F5FF]" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleStartNarration(activeMode)}
                  aria-label="Start narration"
                  title="Start narration"
                  className="p-2 rounded-lg bg-[#1C1C28] hover:bg-[#2A2A3C] text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00F5FF]"
                >
                  <Play className="h-4 w-4 text-[#00F5FF]" />
                </button>
              )}

              <button
                type="button"
                onClick={handleStop}
                disabled={playbackState === 'idle'}
                aria-label="Stop narration"
                title="Stop narration"
                className="p-2 rounded-lg bg-[#1C1C28] hover:bg-[#2A2A3C] text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4D6D]"
              >
                <Square className="h-4 w-4 text-[#FF4D6D]" />
              </button>
            </div>
          </div>

          {/* ── Live Teleprompter / Captions Box ──────────────────────── */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 mb-1">
              <span className="flex items-center gap-1">
                <FileText className="h-3 w-3 text-[#00F5FF]" />
                {lang === 'hi' ? 'जीवंत विवरण (कैप्शन)' : 'Live Teleprompter Text'}
              </span>
              <span>{lang.toUpperCase()} SCRIPT</span>
            </div>
            <div
              tabIndex={0}
              aria-live="polite"
              aria-atomic="true"
              className="p-3 rounded-xl bg-[#050507] border border-[#1C1C28] max-h-28 overflow-y-auto text-xs leading-relaxed text-zinc-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#00F5FF]"
            >
              {currentScript || 'Select an option above to generate voice narration.'}
            </div>
          </div>

          {/* ── Optional Voice Command Recognition ────────────────────── */}
          {capabilities.recognitionSupported && (
            <div className="mt-3 pt-3 border-t border-[#1C1C28]">
              <div className="flex items-center justify-between gap-2">
                <div className="text-[11px] text-zinc-400">
                  <span className="font-bold text-zinc-200 block">
                    {lang === 'hi' ? 'आवाज़ द्वारा नियंत्रण' : 'Voice Command Control'}
                  </span>
                  <span className="text-[10px] text-zinc-500">
                    {lang === 'hi' ? 'कहें: डैशबोर्ड, सेफ़ रूट, रिपोर्ट, या रुको' : 'Try: "Dashboard", "Safe Route", "Report", "Stop"'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleToggleVoiceInput}
                  aria-pressed={isListening}
                  aria-label={isListening ? 'Stop listening for voice commands' : 'Start speaking voice command'}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00F5FF]',
                    isListening
                      ? 'bg-[#FF4D6D] text-white animate-pulse shadow-[0_0_15px_rgba(255,77,109,0.4)]'
                      : 'bg-[#1C1C28] text-zinc-300 hover:text-white hover:bg-[#2A2A3C]'
                  )}
                >
                  {isListening ? (
                    <>
                      <MicOff className="h-3.5 w-3.5" />
                      Listening...
                    </>
                  ) : (
                    <>
                      <Mic className="h-3.5 w-3.5 text-[#00F5FF]" />
                      Voice Input
                    </>
                  )}
                </button>
              </div>

              {speechTranscript && (
                <p className="mt-1.5 text-[10px] font-mono text-[#00F5FF] bg-[#00F5FF]/10 p-1.5 rounded border border-[#00F5FF]/20 truncate">
                  Heard: &quot;{speechTranscript}&quot;
                </p>
              )}
            </div>
          )}

          {/* Footer Transparency Note */}
          <div className="mt-3 text-[10px] text-zinc-500 text-center leading-tight">
            Browser Web Speech API · Authentic Speech Synthesis · No External API Keys
          </div>
        </div>
      )}
    </>
  );
}
