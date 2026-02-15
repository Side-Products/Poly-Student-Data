import { create } from "zustand";
import { persist } from "zustand/middleware";

interface FormState {
  currentStep: number;
  formData: Record<string, unknown>;
  setCurrentStep: (step: number) => void;
  updateFormData: (data: Record<string, unknown>) => void;
  resetForm: () => void;
}

export const useFormStore = create<FormState>()(
  persist(
    (set) => ({
      currentStep: 1,
      formData: {},
      setCurrentStep: (step) => set({ currentStep: step }),
      updateFormData: (data) =>
        set((state) => ({
          formData: { ...state.formData, ...data },
        })),
      resetForm: () => set({ currentStep: 1, formData: {} }),
    }),
    {
      name: "student-application-form",
    }
  )
);
