import { createContext, useContext, useEffect } from "react";
import { Button, IButtonProps } from "@blueprintjs/core";
import { useStoredState } from "./util/local-storage";
import h from "@macrostrat/hyper";

type DarkModeState = { isEnabled: boolean; isAutoset: boolean };

type DarkModeUpdater = (enabled?: boolean) => void;

const ValueContext = createContext<DarkModeState | null>(null);
const UpdaterContext = createContext<DarkModeUpdater | null>(null);

const matcher = window?.matchMedia("(prefers-color-scheme: dark)");

const systemDarkMode = (): DarkModeState => ({
  isEnabled: matcher?.matches ?? false,
  isAutoset: true
});

const DarkModeProvider = (props: { children?: React.ReactNode }) => {
  const [storedValue, updateValue] = useStoredState(
    "ui-dark-mode",
    systemDarkMode()
  );
  // Guards so that we don't error on an invalid stored value
  const value = {
    isEnabled: storedValue?.isEnabled ?? false,
    isAutoset: storedValue?.isAutoset ?? false
  };

  const update: DarkModeUpdater = (enabled: boolean | null) => {
    const isEnabled = enabled ?? !value.isEnabled;
    updateValue({ isAutoset: false, isEnabled });
  };

  useEffect(() => {
    matcher?.addEventListener?.("change", e => {
      if (value.isAutoset) updateValue(systemDarkMode());
    });
  });

  return h(
    ValueContext.Provider,
    { value },
    h(UpdaterContext.Provider, { value: update }, props.children)
  );
};

const useDarkMode = () => useContext(ValueContext);
const inDarkMode = () => useDarkMode()?.isEnabled ?? false;
const darkModeUpdater = () => useContext(UpdaterContext);

const DarkModeButton = (props: IButtonProps) => {
  const { isEnabled, isAutoset } = useDarkMode();
  const icon = isEnabled ? "flash" : "moon";
  const update = darkModeUpdater();
  const onClick = () => update();
  const active = !isAutoset;

  return h(Button, { active, ...props, icon, onClick });
};

export {
  DarkModeProvider,
  useDarkMode,
  inDarkMode,
  darkModeUpdater,
  DarkModeButton
};
