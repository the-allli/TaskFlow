import { create } from "zustand";

const useThemeStore = create((set) => ({
  theme: "dark",

  toggleTheme: () =>
    set((state) => {
      const newTheme = state.theme === "light" ? "dark" : "light";

      localStorage.setItem("theme", newTheme);
      document.documentElement.classList.toggle("dark", newTheme === "dark");

      return { theme: newTheme };
    }),

  setTheme: (newTheme) => {
    set({ theme: newTheme });
  },

  loadTheme: () => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      set({ theme: savedTheme });
      if (savedTheme === "dark") {
        document.documentElement.classList.add("dark");
      }
    }
  },
}));

export default useThemeStore;
