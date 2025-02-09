import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import Modal from "../dialogBox/Modal";
import { BASE_URL } from "../utils/Config";
function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const [statusMessage, setStatusMessage] = useState("Tikrinama...");
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");

  const isVerifyingRef = useRef(false); 

  const openModal = (title, message) => {
    setModalTitle(title);
    setModalMessage(message);
    setIsModalOpen(true);
  };

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      openModal("Klaida", "Trūksta patvirtinimo tokeno.");
      setStatusMessage("Trūksta patvirtinimo tokeno.");
      return;
    }
    if (isVerifyingRef.current) {
      return;
    }
    const verifyEmail = async () => {
      try {
        isVerifyingRef.current = true; 
        const response = await axios.get(BASE_URL +
          "/api/user/verify-email",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        openModal("Patvirtinimas", response.data.message);
        setTimeout(() => navigate("/prisijungti"), 2000);
      } catch (error) {
        const errorMessage =
          error.response?.data?.message || "Įvyko klaida. Bandykite dar kartą vėliau.";
        if (error.response?.status === 400) {
          openModal("Klaida", errorMessage);
          setStatusMessage(errorMessage);
        } else if (error.response?.status === 401) {
          openModal("Klaida", errorMessage);
          setStatusMessage(errorMessage);
        } else {
          openModal("Klaida", errorMessage);
          setStatusMessage(errorMessage);
        }
      } finally {
        isVerifyingRef.current = false; 
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">{statusMessage}</h1>
      </div>
      {isModalOpen && (
        <Modal
          title={modalTitle}
          message={modalMessage}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}

export default VerifyEmailPage;




