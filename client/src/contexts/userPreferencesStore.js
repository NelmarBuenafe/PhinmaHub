import { createContext } from "react";

export const defaultUserPreferences = {
  theme: "system",
  density: "comfortable",
  motion: "system",
};

export const UserPreferencesContext = createContext(null);
