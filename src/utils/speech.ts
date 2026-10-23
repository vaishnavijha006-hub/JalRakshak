// JalRakshak — Web Speech Synthesis & Recognition Engine
// Standards-compliant, lightweight browser Web Speech API wrapper.
// Handles asynchronous voice loading, Hindi & English voice resolution,
// cancellation, audio state events, and optional speech recognition.

export type LanguageCode = 'en' | 'hi';

export interface SpeechVoiceInfo {
  voice: SpeechSynthesisVoice | null;
  name: string;
  lang: string;
  isNative: boolean;
}

export interface VoiceCapabilities {
  supported: boolean;
  hasHindiVoice: boolean;
  hasEnglishVoice: boolean;
  hindiVoiceName?: string;
  englishVoiceName?: string;
  recognitionSupported: boolean;
}

class SpeechEngine {
  private utterance: SpeechSynthesisUtterance | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private voicesLoaded = false;
  private onVoicesChangedCallbacks: Set<() => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.loadVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => {
          this.loadVoices();
          this.notifyVoicesChanged();
        };
      }
    }
  }

  private loadVoices() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const list = window.speechSynthesis.getVoices();
    if (list && list.length > 0) {
      this.voices = list;
      this.voicesLoaded = true;
    }
  }

  public subscribeVoices(cb: () => void): () => void {
    this.onVoicesChangedCallbacks.add(cb);
    if (this.voicesLoaded) {
      cb();
    }
    return () => {
      this.onVoicesChangedCallbacks.delete(cb);
    };
  }

  private notifyVoicesChanged() {
    this.onVoicesChangedCallbacks.forEach(cb => {
      try {
        cb();
      } catch (err) {
        console.error('Error in onVoicesChanged listener:', err);
      }
    });
  }

  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  }

  public getCapabilities(): VoiceCapabilities {
    if (!this.isSupported()) {
      return {
        supported: false,
        hasHindiVoice: false,
        hasEnglishVoice: false,
        recognitionSupported: false,
      };
    }

    this.loadVoices();
    const hindiVoice = this.findVoiceForLanguage('hi');
    const englishVoice = this.findVoiceForLanguage('en');

    const recognitionSupported =
      typeof window !== 'undefined' &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

    return {
      supported: true,
      hasHindiVoice: Boolean(hindiVoice),
      hasEnglishVoice: Boolean(englishVoice),
      hindiVoiceName: hindiVoice?.name,
      englishVoiceName: englishVoice?.name,
      recognitionSupported,
    };
  }

  public findVoiceForLanguage(lang: LanguageCode): SpeechSynthesisVoice | null {
    this.loadVoices();
    if (!this.voices || this.voices.length === 0) return null;

    if (lang === 'hi') {
      // Look for explicit Hindi voices first (hi-IN, hi)
      const exactHindi = this.voices.find(v => v.lang.toLowerCase() === 'hi-in' || v.lang.toLowerCase().startsWith('hi'));
      if (exactHindi) return exactHindi;

      // Check if voice name contains "hindi"
      const nameMatch = this.voices.find(v => v.name.toLowerCase().includes('hindi') || v.name.toLowerCase().includes('kalpana') || v.name.toLowerCase().includes('hemant'));
      if (nameMatch) return nameMatch;

      return null;
    }

    // English: prefer Indian English (en-IN) for cultural context, then en-US, en-GB, or any en
    const enIn = this.voices.find(v => v.lang.toLowerCase() === 'en-in' || v.name.toLowerCase().includes('india'));
    if (enIn) return enIn;

    const enGeneral = this.voices.find(v => v.lang.toLowerCase().startsWith('en'));
    return enGeneral || this.voices[0] || null;
  }

  /**
   * Speak a text string with specified language and callbacks
   */
  public speak(
    text: string,
    lang: LanguageCode,
    callbacks: {
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (error: string) => void;
      onPause?: () => void;
      onResume?: () => void;
    } = {}
  ): boolean {
    if (!this.isSupported()) {
      callbacks.onError?.('Speech synthesis is not supported by your browser.');
      return false;
    }

    // Stop any existing utterance
    this.stop();

    if (!text.trim()) {
      callbacks.onError?.('No text content available to read.');
      return false;
    }

    try {
      const utterance = new SpeechSynthesisUtterance(text);
      this.utterance = utterance;

      const voice = this.findVoiceForLanguage(lang);
      if (voice) {
        utterance.voice = voice;
      }
      utterance.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';

      // Optimal clarity rates: slightly slower for Hindi pronunciation clarity
      utterance.rate = lang === 'hi' ? 0.92 : 0.96;
      utterance.pitch = 1.0;

      utterance.onstart = () => {
        callbacks.onStart?.();
      };

      utterance.onend = () => {
        this.utterance = null;
        callbacks.onEnd?.();
      };

      utterance.onerror = (event) => {
        this.utterance = null;
        // Canceled errors are intentional when user stops or changes narration
        if (event.error !== 'canceled' && event.error !== 'interrupted') {
          callbacks.onError?.(`Speech playback error: ${event.error || 'Unknown'}`);
        }
      };

      utterance.onpause = () => {
        callbacks.onPause?.();
      };

      utterance.onresume = () => {
        callbacks.onResume?.();
      };

      window.speechSynthesis.speak(utterance);
      return true;
    } catch (err: any) {
      this.utterance = null;
      callbacks.onError?.(err?.message || 'Failed to start speech.');
      return false;
    }
  }

  public pause(): void {
    if (this.isSupported() && window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
    }
  }

  public resume(): void {
    if (this.isSupported() && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
  }

  public stop(): void {
    if (this.isSupported()) {
      window.speechSynthesis.cancel();
      this.utterance = null;
    }
  }

  public getCurrentUtterance(): SpeechSynthesisUtterance | null {
    return this.utterance;
  }

  public isSpeaking(): boolean {
    return Boolean(this.isSupported() && window.speechSynthesis.speaking);
  }

  public isPaused(): boolean {
    return Boolean(this.isSupported() && window.speechSynthesis.paused);
  }
}

export const speechEngine = new SpeechEngine();

// Optional Speech Recognition helper
export interface SpeechRecognitionResultPayload {
  transcript: string;
  isFinal: boolean;
}

export function createSpeechRecognizer(options: {
  lang: LanguageCode;
  onResult: (result: SpeechRecognitionResultPayload) => void;
  onError: (error: string) => void;
  onEnd: () => void;
  onStart: () => void;
}) {
  if (typeof window === 'undefined') return null;

  const SpeechRecognitionAPI =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognitionAPI) {
    return null;
  }

  try {
    const recognizer = new SpeechRecognitionAPI();
    recognizer.continuous = false;
    recognizer.interimResults = true;
    recognizer.lang = options.lang === 'hi' ? 'hi-IN' : 'en-IN';

    recognizer.onstart = () => {
      options.onStart();
    };

    recognizer.onresult = (event: any) => {
      const results = event.results;
      if (!results || results.length === 0) return;
      const latest = results[results.length - 1];
      const transcript = latest[0].transcript;
      const isFinal = latest.isFinal;
      options.onResult({ transcript, isFinal });
    };

    recognizer.onerror = (event: any) => {
      options.onError(event.error || 'Speech recognition error');
    };

    recognizer.onend = () => {
      options.onEnd();
    };

    return recognizer;
  } catch (e: any) {
    console.error('Failed to initialize speech recognizer:', e);
    return null;
  }
}
