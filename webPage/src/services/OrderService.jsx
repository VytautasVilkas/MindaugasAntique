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

const OrderService = {
  /**
   * @param {Object} orderData - The order details.
   * @param {string} orderData.name - Customer's name.
   * @param {string} orderData.surname - Customer's surname.
   * @param {string} orderData.phone - Customer's phone number.
   * @param {string} [orderData.city] - City for delivery.
   * @param {string} [orderData.street] - Street for delivery.
   * @param {string} [orderData.houseNumber] - House number for delivery.s
   * @param {string} [orderData.postCode] - Post code for delivery.
   * @param {string} orderData.deliveryName - Delivery method name.
   * @param {string} orderData.deliveryFee
   * @param {string} orderData.deliveryType
   * @param {string} orderData.paymentMethodID
   * @param {Array} orderData.items - Array of items in the order.
   * @param {string} orderData.items[].productId - Product ID.
   * @param {string} orderData.items[].productName - Product name.
   * @param {number} orderData.items[].quantity - Quantity of the product.
   * @param {number} orderData.items[].price - Price of the product.
   * @returns {Promise<Object>} - Returns the order confirmation.
   * @throws {Error} 
   */

  async createOrder(orderData, refreshTokenOrLogout) {
    try {
      const response = await apiClient.post("/MakeNewOrder", orderData);
      return response.data; 
    } catch (error) {
      if (error.response?.status === 401) {
        const tokenValid = await refreshTokenOrLogout(); 
        if (tokenValid) {
          try {
            const retryResponse = await apiClient.post("/MakeNewOrder", orderData);
            return retryResponse.data;
          } catch (retryError) {
            handleApiError(retryError, "Nepavyko sukurti užsakymo.");
          }
        } else {
          throw new Error("Jūsų sesija baigėsi. Prašome prisijungti iš naujo.");
        }
      } else {
        handleApiError(error, "Nepavyko sukurti užsakymo.");
      }
    }
  },
  async getUserOrders(search, startDate, endDate,sStatus, refreshTokenOrLogout) {
    try {
      const response = await apiClient.get("/GetUserOrders",{
        params: {
          search: search || null,
          startDate: startDate || null,
          endDate: endDate || null,
          status: sStatus || null,
        },
      });
      return response.data || []; 
    } catch (error) {
      if (error.response?.status === 401) {
        const tokenValid = await refreshTokenOrLogout();
        if (tokenValid) {
          try {
            const retryResponse = await apiClient.get("/GetUserOrders");
            return retryResponse.data || [];
          } catch (retryError) {
            throw new Error("Nepavyko gauti užsakymų.");
          }
        } else {
          throw new Error("Jūsų sesija baigėsi. Prašome prisijungti iš naujo.");
        }
      }
      handleApiError(error, "Nepavyko gauti užsakymo.");
    }
  },
  async generateInvoice(orderNumber, refreshTokenOrLogout) {
    
    try {
        const response = await apiClient.get(`/GetProFormaInvoice/${orderNumber}`, {
            responseType: "blob",
        });
        return response.data; // PDF data returned successfully
    } catch (error) {
        // Handle session expiration (401)
        if (error.response?.status === 401) {
            try {
                const tokenValid = await refreshTokenOrLogout();
                if (tokenValid) {
                    const retryResponse = await apiClient.get(`/GetProFormaInvoice/${orderNumber}`, {
                        responseType: "blob",
                    });
                    return retryResponse.data;
                } else {
                    throw new Error("Jūsų sesija baigėsi. Prašome prisijungti iš naujo.");
                }
            } catch (refreshError) {
                // Handle specific 409 error during retry
                if (refreshError.response?.status === 409) {
                    const blob = refreshError.response.data;
                    const text = await blob.text();
                    const errorData = JSON.parse(text);
                    throw new Error(errorData.message || "užsakymas apmokėtas arba pašalintas");
                }
                throw new Error("Jūsų sesija baigėsi. Prašome prisijungti iš naujo.");
            }
        }

        // Handle specific 409 error during initial request
        if (error.response?.status === 409) {
            const blob = error.response.data;
            const text = await blob.text(); // Convert Blob to text
            const errorData = JSON.parse(text); // Parse the text as JSON
            console.error("Parsed error response:", errorData);
            throw new Error(errorData.message || "užsakymas apmokėtas arba pašalintas");
        }
        throw new Error(error.response?.data?.message || "Nepavyko sugeneruoti išankstinės sąskaitos.");
    }
}

};

export default OrderService;


