"use client";

import { createContext, useContext, useEffect, useState } from "react";

type WhatsAppContextValue = {
  contextMessage: string | null;
  setContextMessage: (message: string | null) => void;
  mobileBottomBarVisible: boolean;
  setMobileBottomBarVisible: (visible: boolean) => void;
};

const WhatsAppContext = createContext<WhatsAppContextValue | null>(null);

export function WhatsAppProvider({ children }: { children: React.ReactNode }) {
  const [contextMessage, setContextMessage] = useState<string | null>(null);
  const [mobileBottomBarVisible, setMobileBottomBarVisible] = useState(false);

  return (
    <WhatsAppContext.Provider
      value={{
        contextMessage,
        setContextMessage,
        mobileBottomBarVisible,
        setMobileBottomBarVisible,
      }}
    >
      {children}
    </WhatsAppContext.Provider>
  );
}

export function useWhatsAppContext() {
  const ctx = useContext(WhatsAppContext);
  return (
    ctx ?? {
      contextMessage: null,
      setContextMessage: () => {},
      mobileBottomBarVisible: false,
      setMobileBottomBarVisible: () => {},
    }
  );
}

export function WhatsAppPageContext({
  message,
}: {
  message: string | null;
}) {
  const { setContextMessage } = useWhatsAppContext();

  useEffect(() => {
    setContextMessage(message);
    return () => {
      setContextMessage(null);
    };
  }, [message, setContextMessage]);

  return null;
}
