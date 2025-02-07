import Cookies from "js-cookie";
import UserService from '../services/UserService';

const CART_KEY = "cartItems";
const LIKED_KEY = "likedItems";
const AUTH_TOKEN = "authToken";
const REFRESH_TOKEN = "refreshToken";
const GUEST_SESSION_KEY = "guestId";

const CookieManager = {
  fetchLikedItems: () => {
    try {
      const likedItems = Cookies.get(LIKED_KEY) ? JSON.parse(Cookies.get(LIKED_KEY)) : {};
      return likedItems;
    } catch (error) {
      console.error("Error fetching liked items:", error);
      return {};
    }
  },
  toggleLike: (itemId, log, isInitialized) => {
    try {
      const likedItems = Cookies.get(LIKED_KEY) ? JSON.parse(Cookies.get(LIKED_KEY)) : {};
      if (likedItems[itemId]) {
        delete likedItems[itemId];
        if (isInitialized && log) {
          log("INFO", "Nebepatinka preke", { productId: itemId });
        }
      } else {
        likedItems[itemId] = true;
        if (isInitialized && log) {
          log("INFO", "Patinka preke", { productId: itemId });
        }
      }
      Cookies.set(LIKED_KEY, JSON.stringify(likedItems), { expires: 365 });
      return likedItems;
    } catch (error) {
      console.error("Error toggling like:", error);
      return {};
    }
  },
  updateLikedItems: (likedItems) => {
    try {
      Cookies.set(LIKED_KEY, JSON.stringify(likedItems), { expires: 365 });
      console.log("Liked items updated in cookies:", likedItems);
    } catch (error) {
      console.error("Error updating liked items in cookies:", error);
    }
  },
  
  fetchCartItems: () => {
    try {
      const cartItems = Cookies.get(CART_KEY) ? JSON.parse(Cookies.get(CART_KEY)) : {};
      return cartItems;
    } catch (error) {
      console.error("Error fetching cart items:", error);
      return {};
    }
  },
  updateCartItems: (cartItems) => {
    try {
      Cookies.set(CART_KEY, JSON.stringify(cartItems), { expires: 365 });
    } catch (error) {
      console.error("Error updating cart items:", error);
    }
  },
  clearCart: () => {
    try {
      Cookies.remove(CART_KEY);
    } catch (error) {
      console.error("Error clearing cart:", error);
    }
  },
  
    getGuestId: () => Cookies.get(GUEST_SESSION_KEY),
    setGuestId: (guestId) =>
      Cookies.set(GUEST_SESSION_KEY, guestId, { expires: 365, secure: true, sameSite: "Strict" }),
    clearGuestId: () => Cookies.remove(GUEST_SESSION_KEY),
};

export default CookieManager;


