import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "../dialogBox/Modal"; // Import the Modal component
import UserService from "../services/UserService"; // Import UserService

const RegistracijaPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");

  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMessage(""); 

    if (password !== confirmPassword) {
      setErrorMessage("Slaptažodžiai nesutampa!");
      return;
    }

    try {
      await UserService.Register(email, password);
      setModalTitle("Registracija sėkminga!");
      setModalMessage("Patvirtinkite savo el. paštą, kad galėtumėte prisijungti.");
      setIsModalOpen(true);

      setTimeout(() => {
        setIsModalOpen(false);
        navigate("/prisijungti"); 
      }, 3000);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Įvyko klaida registruojantis. Bandykite dar kartą.");
    }
  };

  return (
    <div className="flex font-oldStandard min-h-full flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="mt-10 text-center text-2xl font-bold tracking-tight text-gray-900">
          Registracija
        </h2>
        <p className="mt-2 text-center text-sm text-gray-500">
          Sukurkite paskyrą, kad galėtumėte naudotis visais privalumais.
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <form onSubmit={handleRegister} className="space-y-6">
          {errorMessage && (
            <div className="text-red-500 text-sm text-center">{errorMessage}</div>
          )}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-900"
            >
              El. pašto adresas
            </label>
            <div className="mt-2">
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 outline-gray-300 placeholder-gray-400 focus:outline-black sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-900"
            >
              Slaptažodis
            </label>
            <div className="mt-2">
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 outline-gray-300 placeholder-gray-400 focus:outline-black sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-900"
            >
              Pakartokite slaptažodį
            </label>
            <div className="mt-2">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 outline-gray-300 placeholder-gray-400 focus:outline-black sm:text-sm"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="flex w-full justify-center rounded-md bg-black px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 focus:outline-black"
            >
              Registruotis
            </button>
          </div>
        </form>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <Modal
          title={modalTitle}
          message={modalMessage}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
};

export default RegistracijaPage;



