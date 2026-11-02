let audioContext: AudioContext | null = null;

export function playFeedback(kind: "correct" | "wrong", enabled: boolean): void {
  if (!enabled) return;

  const AudioContextClass = window.AudioContext;
  if (!AudioContextClass) return;

  audioContext ??= new AudioContextClass();
  if (audioContext.state === "suspended") {
    void audioContext.resume();
  }

  const now = audioContext.currentTime;
  const tones = kind === "correct" ? [660, 880] : [150, 170];

  tones.forEach((frequency, index) => {
    const oscillator = audioContext!.createOscillator();
    const gain = audioContext!.createGain();
    const isCorrect = kind === "correct";
    const start = now + index * (isCorrect ? 0.07 : 0.004);
    const decay = isCorrect ? 0.14 : 0.07;

    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(isCorrect ? 0.07 : 0.045, start + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + decay);

    oscillator.connect(gain);
    gain.connect(audioContext!.destination);
    oscillator.start(start);
    oscillator.stop(start + decay + 0.02);
  });
}
