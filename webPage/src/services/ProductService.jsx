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

const ProductService = {
  /**
   * @returns {Promise<Array>} 
   * @throws {Error} 
   */
  async fetchProducts(query = "", type = "") {
    try {
      const response = await apiClient.get(`/api/product`, {
        params: {
          search: query || null, // Pass null if empty
          type: type || null,    // Pass null if empty
        },
      });
      return response.data.map((item) => ({
        PRK_ID: item.PRK_ID,
        IMG_DATA: item.IMG_DATA,
        PRK_PAVADINIMAS: item.PRK_PAVADINIMAS,
        PRK_APRASYMAS: item.PRK_APRASYMAS,
        PRK_KAINA: item.PRK_KAINA,
        PRK_NUOLAIDA: item.PRK_NUOLAIDA,
        PRK_KODAS: item.PRK_KODAS,
      }));
    } catch (error) {
      console.error("Error fetching products:", error); // Log full error details
      handleApiError(error, "Nepavyko gauti produktų sąrašo.");
    }
  },
  
  
  async fetchProductTypes() {
    const response = await apiClient.get("/api/Product/productTypes");
    return response.data.map((type) => ({
      PT_ID: type.PT_ID,
      PT_TYPE: type.PT_TYPE,
    }));
  },
  /**
   * @param {number|string} id 
   * @returns {Promise<Object>} 
   * @throws {Error} 
   */
  async fetchProductById(id) {
    try {
      const response = await apiClient.get(`/api/Product/${id}`);
      const item = Array.isArray(response.data) ? response.data[0] : response.data;
      return {
        PRK_ID: item.PRK_ID,
        IMG_DATA: item.IMG_DATA,
        PRK_PAVADINIMAS: item.PRK_PAVADINIMAS,
        PRK_APRASYMAS: item.PRK_APRASYMAS,
        PRK_KAINA: item.PRK_KAINA,
        PRK_NUOLAIDA: item.PRK_NUOLAIDA,
        PRK_KODAS: item.PRK_KODAS,
      };
    } catch (error) {
      handleApiError(error, "Nepavyko gauti produkto.");
    }
  },
  /**
   * @param {number|string} itemID 
   * @returns {Promise<Array>} 
   * @throws {Error} 
   */
  async fetchProductImages(itemID) {
    try {
      const response = await apiClient.get(`/api/Product/Nuotraukos/${itemID}`);
      return response.data.map((item) => item.IMG_DATA);
    } catch (error) {
      handleApiError(error, "Nepavyko gauti produkto nuotraukos.");
    }
  },
};

export default ProductService;