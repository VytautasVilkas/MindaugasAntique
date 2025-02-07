import axios from "axios";
import { BASE_URL } from "../utils/config";

/**
 * @param {Error} error 
 * @param {string} defaultMessage 
 * @throws {Error} 
 */
const handleApiError = (error, defaultMessage) => {
  const message = error.response?.data?.message || defaultMessage;
  throw new Error(message);
};

const apiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, 
});

const InfoService = {
  /**
   * @returns {Promise<Object>} 
   * @throws {Error} 
   */
  async GetInfo() {
    try {
      const response = await apiClient.get("/api/Info");
      return response.data;
    } catch (error) {
      handleApiError(error, "Nepavyko gauti informacijos.");
    }
  },
};

export default InfoService;
