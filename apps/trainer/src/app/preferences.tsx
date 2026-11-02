import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { FINGERING_KEY, MOTION_KEY, SOUND_KEY, readToggle, writeToggle } from "./settings";

type Preferences = {
  motion: boolean;
  sound: boolean;
  fingering: boolean;
  focus: boolean;
  setMotion: (value: boolean) => void;
  setSound: (value: boolean) => void;
  setFingering: (value: boolean) => void;
  setFocus: (value: boolean) => void;
  toggleFocus: () => void;
};

const PreferencesContext = createContext<Preferences | null>(null);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [motion, setMotionState] = useState(() => readToggle(window.localStorage, MOTION_KEY, true));
  const [sound, setSoundState] = useState(() => readToggle(window.localStorage, SOUND_KEY, false));
  const [fingering, setFingeringState] = useState(() => readToggle(window.localStorage, FINGERING_KEY, false));
  const [focus, setFocus] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.motion = motion ? "on" : "off";
  }, [motion]);

  function setMotion(value: boolean) {
    setMotionState(value);
    writeToggle(window.localStorage, MOTION_KEY, value);
  }

  function setSound(value: boolean) {
    setSoundState(value);
    writeToggle(window.localStorage, SOUND_KEY, value);
  }

  function setFingering(value: boolean) {
    setFingeringState(value);
    writeToggle(window.localStorage, FINGERING_KEY, value);
  }

  return (
    <PreferencesContext.Provider
      value={{
        motion,
        sound,
        fingering,
        focus,
        setMotion,
        setSound,
        setFingering,
        setFocus,
        toggleFocus: () => setFocus((current) => !current),
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences(): Preferences {
  const context = useContext(PreferencesContext);
  if (!context) throw new Error("PreferencesProvider 未挂载");
  return context;
}
