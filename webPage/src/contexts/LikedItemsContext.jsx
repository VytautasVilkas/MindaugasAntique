import React, { createContext, useContext, useState, useEffect } from "react";
import CookieManager from "../utils/CookieManager";
import UserService from "../services/UserService"; 
import { useUser } from "./UserContext";
import { LoggerProvider, useLogger } from "../contexts/LoggerContext";
const LikedItemsContext = createContext();

export const useLikedItems = () => useContext(LikedItemsContext);

export const LikedItemsProvider = ({ children }) => {
  const { isAuthenticated } = useUser();
  const [likedItems, setLikedItems] = useState({});
  const { log, isInitialized } = useLogger();
  useEffect(() => {
    const fetchLikedItems = async () => {
      let initialLikedItems = CookieManager.fetchLikedItems();
      setLikedItems(initialLikedItems);
    };

    fetchLikedItems();
  }, []);

  const toggleLike = (itemId) => {
    try {
      const updatedLikedItems = CookieManager.toggleLike(itemId,log,isInitialized );
      setLikedItems(updatedLikedItems);
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };
  const validateLikedItems = (invalidIds) => {
    if (invalidIds.length > 0) {
      const updatedLikedItems = { ...likedItems };
      invalidIds.forEach((id) => {
        delete updatedLikedItems[id];
      });
  
      // Update cookies and context state
      CookieManager.updateLikedItems(updatedLikedItems);
      setLikedItems(updatedLikedItems);
      console.log(`Removed invalid liked items: ${invalidIds}`);
    }
  };
   
  return (
    <LikedItemsContext.Provider value={{ likedItems, toggleLike,validateLikedItems }}>
      {children}
    </LikedItemsContext.Provider>
  );
};







