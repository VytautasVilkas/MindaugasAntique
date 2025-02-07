import axios from "axios";
import { BASE_URL } from "../utils/config";

const apiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, 
});

const UserService = {
  async GetNewSessionID() {
    try {
    await apiClient.get("/api/User/GuestSession");
    }catch(error){
      throw new Error(error.message);
    } 
  },
  async Register(email, password) {
    try {
      const response = await axios.post(`${BASE_URL}/api/user/register`, {
        email,
        password,
      });
      return response.data; 
    } catch (error) {
      console.error("Registration failed:", error);
      if (error.response) {
        const backendMessage = error.response.data?.message;
        throw new Error(backendMessage || "Registracija nepavyko. Bandykite dar kartą.");
      } else {
        throw new Error("Nenumatyta klaida įvyko registracijos metu.");
      }
    }
  },
  async checkSessionInfo() {
    try {
      const response = await apiClient.get("/api/user/SessionInfo");
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message);
    }
  },
  async validateResetPasswordToken(token) {
    try {
      const response = await apiClient.post(
        "/api/user/validateReset-token",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Token validation failed.");
    }
  },
  
  async login(credentials) {
    try {
      await apiClient.post("/api/user/login", credentials);
    } catch (error) {
      throw new Error(error.response?.data?.message || "Įvyko klaida prisijungiant.");
    }
  },
    /**
     * @param {string} idToken 
     * @returns {Promise<Object>}
     */
    async loginWithGoogle(idToken) {
      try {
        console.log("Login with Google");
        const response = await apiClient.post("/api/user/loginWithGoogle", { idToken });
        return response.data;

      } catch (error) {
        throw new Error(error.response?.data?.message || "Nepavyko prisijungti naudojant Google.");
      }
    },
  async verifyToken() {
    try {
      const response = await apiClient.get("/api/user/verifyToken");
      return response.data 
    } catch (error) {
      throw new Error(error.response?.data?.message || "Įvyko klaida prisijungiant.");
    }
  },
  async forgotPassword(email) {
    try {
      const response = await apiClient.post("/api/user/forgot-password", { email });
  
      // Check for non-200 HTTP status codes and throw an error
      if (!response.status || response.status >= 400) {
        throw new Error(response.data?.message || "Server returned an error.");
      }
  
      return response.data;
    } catch (error) {
      // Ensure proper error message is passed up
      throw new Error(error.response?.data?.message || "Failed to send recovery email.");
    }
  },
  
  async resetPassword(token,newPassword) {
    try {
      const response = await apiClient.post("/api/user/reset-password", { newPassword },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to reset password.");
    }
  },
  async refreshAccessToken() {
    try {
      const response = await apiClient.post("/api/user/refreshToken");
      return response.data; 
    } catch (error) {
      throw new Error(error.response?.data?.message || "Nepavyko atnaujinti sesijos.");
    }
  },

  async logout() {
    try {
      await apiClient.post("/api/user/logout");
    } catch (error) {
      throw new Error(error.response?.data?.message || "Nepavyko atsijungti.");
    }
  },
    /**
     * Submit feedback for an authenticated user
     * @param {string} feedback - The feedback message
     */
    async postFeedbackAuthenticated(feedback) {
      try {
        const response = await apiClient.post('/api/user/submitAuthenticated', {
          FeedbackText: feedback,
          Email: "", 
        });
        return response.data; 
      } catch (error) {
          throw error;
      }
      
    },
  
    /**
     * Submit feedback for an unauthenticated user
     * @param {string} email 
     * @param {string} feedback 
     */
    async postFeedbackUnauthenticated(email, feedback) {
      try {
        const response = await apiClient.post('/api/user/submitGuest', {
          Email: email,
          FeedbackText: feedback,
        });
  
        return response.data; 
      } catch (error) {
        throw error;
      }
    },
  };

  


export default UserService;
