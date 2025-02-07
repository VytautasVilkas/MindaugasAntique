import { BASE_URL } from "../utils/config";
import axios from "axios";

// Centralized Axios instance
const apiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // Automatically include cookies if required
});

/**
 * @param {Error} error 
 * @param {string} defaultMessage 
 * @throws {Error} 
 */
const handleApiError = (error, defaultMessage) => {
  const message = error.response?.data?.message || defaultMessage;
  throw new Error(message);
};


const StockService = {
  /**
   * Fetch the stock data
   * @returns {Promise<Array>} 
   */
  async fetchStock() {
    try {
      const response = await apiClient.get("/api/stock/getStock");
      return response.data; 
    } catch (error) {
      handleApiError(error, "Nepavyko gauti sandėlio duomenų.");
      return []; 
    }
  },

  /** 
   * @param {number|string} prkId 
   * @returns {Promise<Object>} 
   */
  async checkStock(prkId) {
    try {
      const response = await apiClient.get(`/api/stock/checkStock/${prkId}`);
      return response.data; 
    } catch (error) {
      handleApiError(error, "Nepavyko patikrinti produkto kiekio.");
    }
  },
};

export default StockService;



