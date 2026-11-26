"use client";

import { createContext, useContext, useEffect, useState } from "react";

type WhatsAppContextValue = {
  contextMessage: string | null;
  setContextMessage: (message: string | null) => void;
};

const WhatsAppContext = createContext<WhatsAppContextValue | null>(null);

export function WhatsAppProvider({ children }: { children: React.ReactNode }) {
  const [contextMessage, setContextMessage] = useState<string | null>(null);

  return (
    <WhatsAppContext.Provider value={{ contextMessage, setContextMessage }}>
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
