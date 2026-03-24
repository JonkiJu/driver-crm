import { create } from "zustand";
import { SAMPLE_DRIVERS } from "../constants/data";
import { todayStr } from "../utils/date";

export const useDriversStore = create((set, get) => ({
  drivers: SAMPLE_DRIVERS,
  idCounter: 20,

  upd: (id, patch) => {
    set((state) => ({
      drivers: state.drivers.map((driver) => (driver.id === id ? { ...driver, ...patch } : driver)),
    }));
  },

  addNote: (id, text) => {
    const entry = {
      text,
      date: new Date().toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    set((state) => ({
      drivers: state.drivers.map((driver) =>
        driver.id === id
          ? { ...driver, notes: [entry, ...driver.notes], lastContact: todayStr() }
          : driver,
      ),
    }));
  },

  addFile: (id, fileObj) => {
    set((state) => ({
      drivers: state.drivers.map((driver) =>
        driver.id === id
          ? { ...driver, files: [...(driver.files || []), fileObj] }
          : driver,
      ),
    }));
  },

  addDriver: (data) => {
    const nextId = get().idCounter + 1;

    set((state) => ({
      idCounter: nextId,
      drivers: [
        {
          id: nextId,
          notes: [],
          files: [],
          docs: {},
          flags: [],
          interest: "Warm",
          lastContact: null,
          ...data,
        },
        ...state.drivers,
      ],
    }));
  },
}));
