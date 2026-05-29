"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { ArisPopupModal } from "@/components/ArisPopupModal";
import { MascotState } from "@/components/AriseMascot";

interface PopupConfig {
  isOpen: boolean;
  type: "info" | "warning" | "success" | "confirm";
  title: string;
  message: string;
  mascotState?: MascotState;
  confirmLabel?: string;
  onConfirm?: () => void;
  onClose?: () => void;
}

interface ArisPopupContextType {
  showPopup: (config: Omit<PopupConfig, "isOpen">) => void;
  showError: (title: string, message: string) => void;
  showSuccess: (title: string, message: string) => void;
  showWarning: (title: string, message: string) => void;
  showConfirm: (title: string, message: string, onConfirm: () => void, confirmLabel?: string) => void;
  closePopup: () => void;
}

const ArisPopupContext = createContext<ArisPopupContextType | undefined>(undefined);

export function ArisPopupProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<PopupConfig>({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
  });

  const showPopup = (newConfig: Omit<PopupConfig, "isOpen">) => {
    setConfig({
      ...newConfig,
      isOpen: true,
    });
  };

  const showError = (title: string, message: string) => {
    showPopup({
      type: "warning",
      title,
      message,
      mascotState: "error",
    });
  };

  const showSuccess = (title: string, message: string) => {
    showPopup({
      type: "success",
      title,
      message,
      mascotState: "success",
    });
  };

  const showWarning = (title: string, message: string) => {
    showPopup({
      type: "warning",
      title,
      message,
      mascotState: "warning",
    });
  };

  const showConfirm = (title: string, message: string, onConfirm: () => void, confirmLabel?: string) => {
    showPopup({
      type: "confirm",
      title,
      message,
      confirmLabel,
      onConfirm,
      mascotState: "confused",
    });
  };

  const closePopup = () => {
    if (config.onClose) config.onClose();
    setConfig(prev => ({ ...prev, isOpen: false }));
  };

  // Intercept standard window.alert calls client-side
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const originalAlert = window.alert;
      window.alert = (message: string) => {
        let mascot: MascotState = "happy";
        let type: "info" | "warning" | "success" = "info";
        let title = "ARIS Message";

        const lower = String(message).toLowerCase();
        if (
          lower.includes("error") ||
          lower.includes("fail") ||
          lower.includes("invalid") ||
          lower.includes("could not") ||
          lower.includes("restricted") ||
          lower.includes("failed")
        ) {
          mascot = "error";
          type = "warning";
          title = "Uh Oh!";
        } else if (
          lower.includes("success") ||
          lower.includes("joined") ||
          lower.includes("updated") ||
          lower.includes("approved") ||
          lower.includes("successfully") ||
          lower.includes("rewarded")
        ) {
          mascot = "success";
          type = "success";
          title = "Awesome!";
        } else if (
          lower.includes("please") ||
          lower.includes("warning") ||
          lower.includes("check") ||
          lower.includes("fill in")
        ) {
          mascot = "confused";
          type = "info";
          title = "Just a Sec!";
        }

        showPopup({
          type,
          title,
          message,
          mascotState: mascot
        });
      };

      return () => {
        window.alert = originalAlert;
      };
    }
  }, []);

  return (
    <ArisPopupContext.Provider value={{ showPopup, showError, showSuccess, showWarning, showConfirm, closePopup }}>
      {children}
      <ArisPopupModal
        isOpen={config.isOpen}
        onClose={closePopup}
        type={config.type}
        title={config.title}
        message={config.message}
        mascotState={config.mascotState}
        confirmLabel={config.confirmLabel}
        onConfirm={config.onConfirm}
      />
    </ArisPopupContext.Provider>
  );
}

export function useArisPopup() {
  const context = useContext(ArisPopupContext);
  if (!context) {
    throw new Error("useArisPopup must be used within an ArisPopupProvider");
  }
  return context;
}
