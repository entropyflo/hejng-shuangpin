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
  const tones = kind === "correct" ? [660, 880] : [220];

  tones.forEach((frequency, index) => {
    const oscillator = audioContext!.createOscillator();
    const gain = audioContext!.createGain();
    const start = now + index * 0.07;

    oscillator.type = kind === "correct" ? "sine" : "triangle";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.07, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.14);

    oscillator.connect(gain);
    gain.connect(audioContext!.destination);
    oscillator.start(start);
    oscillator.stop(start + 0.16);
  });
}
