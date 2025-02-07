import React, { useState } from "react";
import { useUser } from "../contexts/UserContext";
import UserService from "../services/UserService"; // Import UserService
import Modal from "../dialogBox/Modal";

function ContactPage() {
  const { isAuthenticated,refreshTokenOrLogout } = useUser(); // Get auth status
  const [feedback, setFeedback] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  
  const openModal = (title, message) => {
    setModalTitle(title);
    setModalMessage(message);
    setIsModalOpen(true);
  };

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleFeedbackSubmit = async () => {
    try {
      if (!feedback.trim()) {
        setError("Atsiliepimas negali būti tuščias.");
        return;
      }
      if (!isAuthenticated) {
        if (!email.trim()) {
          setError("Prašome įvesti el. pašto adresą.");
          return;
        }
        if (!isValidEmail(email)) {
          setError("Prašome įvesti tinkamą el. pašto adresą.");
          return;
        }
        await UserService.postFeedbackUnauthenticated(email, feedback);
      } else {
        try {
          
          await UserService.postFeedbackAuthenticated(feedback);
        } catch (error) {
          if (error.response?.status === 401) {
            const tokenValid = await refreshTokenOrLogout();
            if (tokenValid) {
              await UserService.postFeedbackAuthenticated(feedback);
            } else {
              throw new Error("Jūsų sesija baigėsi. Prašome prisijungti iš naujo, arba tęsti kaip svečias.");
            }
          } else {
            throw new Error("Nepavyko pateikti atsiliepimo.");
          }
        }
      }

      setFeedback("");
      setEmail("");
      setError("");
      openModal("Atsiliepimas", `Ačiū už jūsų atsiliepimą!`);
    } catch (error) {
      setError(error.message || "Nepavyko pateikti atsiliepimo.");
      console.error("Feedback submission error:", error);
    }
  };
  
  
  
  

  return (
    <div className="flex font-oldStandard min-h-screen flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
        <h2 className="text-center text-2xl font-bold tracking-tight text-gray-900">
          Parašykite mums
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Mums svarbi jūsų nuomonė. Palikite savo atsiliepimą arba klausimus.
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-2xl">
        <form className="space-y-6">
          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}
          {!isAuthenticated && (
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                El. paštas
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Jūsų el. paštas..."
                className="block w-full rounded-md bg-white px-3 py-2 text-base text-gray-900 outline outline-1 outline-gray-300 placeholder-gray-400 focus:outline-black sm:text-sm"
              />
            </div>
          )}
          <div>
            <textarea
              placeholder="Jūsų atsiliepimas..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="block w-full h-40 rounded-md bg-white px-3 py-2 text-base text-gray-900 outline outline-1 outline-gray-300 placeholder-gray-400 focus:outline-black sm:text-sm resize-none"
            ></textarea>
          </div>

          <div>
            <button
              type="button"
              onClick={handleFeedbackSubmit}
              className="flex w-full justify-center rounded-md bg-black px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 focus:outline-black"
            >
              Siųsti
            </button>
          </div>
        </form>
        {isModalOpen && (
        <Modal
          title={modalTitle}
          message={modalMessage}
          onClose={() => setIsModalOpen(false)}
        />
      )}
      </div>
      
    </div>
    
  );
}

export default ContactPage;



