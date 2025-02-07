import React, { createContext, useContext, useState } from "react";

const SharedStateContext = createContext();

export const SharedStateProvider = ({ children }) => {
  const [needsRefresh, setNeedsRefresh] = useState(false);

  return (
    <SharedStateContext.Provider value={{ needsRefresh, setNeedsRefresh }}>
      {children}
    </SharedStateContext.Provider>
  );
};

export const useSharedState = () => useContext(SharedStateContext);
