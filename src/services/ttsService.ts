export class TextToSpeechService {
  /**
   * Speak text out loud using browser Web Speech Synthesis API
   */
  public static speak(text: string, onEnd?: () => void): void {
    if (!('speechSynthesis' in window)) {
      console.warn('Text-to-speech is not supported in this browser.');
      onEnd?.();
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    // Clean text (remove markdown symbols)
    const cleanText = text.replace(/[*#_`\[\]()]/g, '');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => {
      onEnd?.();
    };

    utterance.onerror = (e) => {
      console.error('Speech synthesis error:', e);
      onEnd?.();
    };

    window.speechSynthesis.speak(utterance);
  }

  public static stop(): void {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}
