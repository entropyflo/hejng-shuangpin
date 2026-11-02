import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { MOTION_KEY, SOUND_KEY, readToggle, writeToggle } from "./settings";

type Preferences = {
  motion: boolean;
  sound: boolean;
  focus: boolean;
  setMotion: (value: boolean) => void;
  setSound: (value: boolean) => void;
  setFocus: (value: boolean) => void;
  toggleFocus: () => void;
};

const PreferencesContext = createContext<Preferences | null>(null);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [motion, setMotionState] = useState(() => readToggle(window.localStorage, MOTION_KEY, true));
  const [sound, setSoundState] = useState(() => readToggle(window.localStorage, SOUND_KEY, true));
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

  return (
    <PreferencesContext.Provider
      value={{
        motion,
        sound,
        focus,
        setMotion,
        setSound,
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
