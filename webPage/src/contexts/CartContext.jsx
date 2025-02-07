import React, { createContext, useContext, useState, useEffect } from "react";
import CookieManager from "../utils/CookieManager";
import StockService from "../services/StockService";
import Modal from "../dialogBox/Modal";
import { LoggerProvider, useLogger } from "../contexts/LoggerContext";
const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const { log, isInitialized } = useLogger();
  const [cartUpdated, setCartUpdated] = useState(false);

  useEffect(() => {
    const fetchCart = () => {
      const initialCartItems = CookieManager.fetchCartItems();
      setCartItems(initialCartItems);
    };
    fetchCart();
  }, []);
  
  const fetchCart = () => {
    const initialCartItems = CookieManager.fetchCartItems();
    setCartItems(initialCartItems);
  };

  const validateCart = async () => {
    let cartModified = false; 
    try {
      const stockData = await StockService.fetchStock();
      const stockMap = {};
      stockData.forEach((item) => {
        stockMap[item.PRK_ID] = item.PRK_KIEKIS;
      });

      setCartItems((prevCartItems) => {
        const updatedCart = { ...prevCartItems };
        Object.keys(prevCartItems).forEach((itemId) => {
          const cartQuantity = prevCartItems[itemId];
          const stockQuantity = stockMap[itemId] || 0;

          if (cartQuantity > stockQuantity) {
            if (stockQuantity === 0) {
              cartModified = true;
              delete updatedCart[itemId];
              openModal("Sandėlys", `Prekės nėra sandėlyje.`);
              
            } else {
              cartModified = true; 
              updatedCart[itemId] = stockQuantity;
              openModal("Sandėlys", `Prekės kiekis sumažintas.`);
            }
          }
        });
        CookieManager.updateCartItems(updatedCart);
        return updatedCart;
      });
    } catch (error) {
      setCartItems(() => {
        openModal("Klaida", "Nepavyko patikrinti sandėlio kiekio. Krepšelis išvalytas.");
        CookieManager.updateCartItems({});
        return {};
      });
      cartModified = true; 
    }
    return cartModified; 
  };

  const openModal = (title, message) => {
    setModalTitle(title);
    setModalMessage(message);
    setIsModalOpen(true);
  };

  const addToCart = async (itemId) => {
    const updatedCartItems = {
      ...cartItems,
      [itemId]: (cartItems[itemId] || 0) + 1,
    };
    if (isInitialized && itemId) {
      log("INFO", "Pridejo į krepselį",  { productId: itemId });
    }
    setCartItems(updatedCartItems);
    CookieManager.updateCartItems(updatedCartItems);
    await validateCart();
  };

  const validateCartItems = async (invalidProducts) => {
    if (invalidProducts.length > 0) {
      const validCartItems = { ...cartItems };
      invalidProducts.forEach((result) => {
        delete validCartItems[result.id];
      });
      CookieManager.updateCartItems(validCartItems); 
      fetchCart();
    }
  }
  const removeFromCart = async (itemId) => {
    if (!cartItems[itemId]) return;

    const updatedCartItems = { ...cartItems };
    if (updatedCartItems[itemId] > 1) {
      updatedCartItems[itemId] -= 1;
    } else {
      delete updatedCartItems[itemId];
    }
    if (isInitialized && itemId) {
      log("INFO", "Panaikino iš krepšelio",  { productId: itemId });
    }
    setCartItems(updatedCartItems);
    CookieManager.updateCartItems(updatedCartItems);
    await validateCart();
  };

  const clearCart = () => {
    setCartItems({});
    CookieManager.clearCart();
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        clearCart,
        validateCart,
        validateCartItems,
      }}
    >
      {children}

      {isModalOpen && (
        <Modal
          title={modalTitle}
          message={modalMessage}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </CartContext.Provider>
  );
};


