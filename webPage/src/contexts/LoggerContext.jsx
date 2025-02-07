import { BASE_URL } from "../utils/config";
import React, { createContext, useContext, useEffect, useState } from "react";

const LoggerContext = createContext();

export const useLogger = () => useContext(LoggerContext);

export const LoggerProvider = ({ children }) => {
  const [logs, setLogs] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const maxBatchSize = 10;
  const backendEndpoint = `${BASE_URL}/api/logs`;

  const initializeLogger = () => {
    setIsInitialized(true);
    console.info("Logger initialized.");
  };

  const log = (level, message, additionalData = {}) => {
    if (!isInitialized) {
      console.warn("Logger not initialized. Queuing log:", { level, message });
      return;
    }

    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      additionalData,
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    setLogs((prevLogs) => [...prevLogs, logEntry]);
    console.info(`Logged action: ${level}`, logEntry);

    if (logs.length + 1 >= maxBatchSize) {
      sendLogs();
    }
  };

  const sendLogs = async () => {
    if (logs.length === 0) {
      return;
    }
    try {
      const response = await fetch(backendEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", 
        body: JSON.stringify(logs),
      });
  
      if (response.ok) {
        console.info("Logs sent successfully.");
        setLogs([]); // Clear logs on successful send
      } else {
        console.error("Failed to send logs. Status: " + response.status);
      }
    } catch (error) {
      console.error("Error sending logs:", error);
    }
  };

  useEffect(() => {
    const intervalId = setInterval(sendLogs, 15000); // Auto-send logs every 15 seconds
    return () => clearInterval(intervalId); // Cleanup on unmount
  }, [logs]);

  return (
    <LoggerContext.Provider value={{ log, initializeLogger, isInitialized }}>
      {children}
    </LoggerContext.Provider>
  );
};
