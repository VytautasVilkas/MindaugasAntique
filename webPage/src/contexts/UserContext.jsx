import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import UserService from "../services/UserService";
import Modal from "../dialogBox/Modal";
import { useGoogleLogin } from "@react-oauth/google";
const UserContext = createContext();
export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const isMounted = useRef(false);
  
  useEffect(() => {
    const initialize = async () => {
      if (isMounted.current) {
        return;
      }
      isMounted.current = true;
  
      try {
        const verifyResponse = await UserService.verifyToken();
        if (verifyResponse.isValid) {
          setIsAuthenticated(true);
          return; // Exit if token is verified
        }
      } catch (verifyError) {
        console.error("Token verification failed:", verifyError);
      }
  
      try {
        const refreshResponse = await UserService.refreshAccessToken();
        console.log("Tokenas Atnaujintas");
        setIsAuthenticated(true);
        return; // Exit if token is refreshed
      } catch (refreshError) {
        console.error("Failed to refresh token:", refreshError);
      }
      try {
        const sessionInfoResponse = await UserService.checkSessionInfo();
        if (sessionInfoResponse.message === "Sesija baigta") {
          openModal("Baigta sesija", sessionInfoResponse.message);
        }
      } catch (sessionInfoError) {
        console.error("Failed to check session info:", sessionInfoError);
      }
      try {
        await UserService.GetNewSessionID();
        setIsAuthenticated(false); 
      } catch (newSessionError) {
        console.error("Failed to generate new session:", newSessionError);
      }
    };
    initialize();
  }, []);
  

  const login = async (credentials) => {
    try {
      await UserService.login(credentials);
      setIsAuthenticated(true);
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await UserService.logout();
      await UserService.GetNewSessionID();
      setIsAuthenticated(false);
      openModal("Atsijungėte", "Jūs sėkmingai atsijungėte.");
    } catch (error) {
      openModal("Klaida", error.message || "Nepavyko atsijungti.");
      throw error;
    }
  };
  const refreshTokenOrLogout = async () => {
    try {
      const refreshResponse = await UserService.refreshAccessToken();
      console.log("Tokenas Atnaujintas");
      setIsAuthenticated(true);
      return true;
    } catch (refreshError) {
      const sessionInfoResponse = await UserService.checkSessionInfo();
      if (sessionInfoResponse.message === "Sesija baigta") {
        openModal("Baigta sesija", sessionInfoResponse.message);
      } 
    }
    // Step 4: Initialize guest session
    await UserService.GetNewSessionID();
    setIsAuthenticated(false);
    }
    const handleGoogleLoginSuccess = async (credentialResponse) => {
      try {
        const idToken = credentialResponse.credential; // The actual token
        await loginWithGoogle(idToken);
        navigate("/");
      } catch (error) {
        console.log(error.message);
        setErrorMessage(error.message);
      }
    };
    
    const loginWithGoogle = async (idToken) => {
      try {
        const response = await UserService.loginWithGoogle(idToken);
        setIsAuthenticated(true);
      } catch (error) {
        openModal("Klaida", error.message || "Google prisijungimas nepavyko.");
      }
    };
    
  const openModal = (title, message) => {
    setModalTitle(title);
    setModalMessage(message);
    setIsModalOpen(true);
  };

  return (
    <UserContext.Provider value={{ isAuthenticated,  login, logout,refreshTokenOrLogout, loginWithGoogle}}>
      {children}
      {isModalOpen && (
        <Modal
          title={modalTitle}
          message={modalMessage}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </UserContext.Provider>
  );
};

