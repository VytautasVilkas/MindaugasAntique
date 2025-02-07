import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../dialogBox/Modal'; // Import Modal
import UserService from "../services/UserService";
const PasswordRecoveryPage = () => {
  const [email, setEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  
  const navigate = useNavigate();

  const handlePasswordRecovery = async (e) => {
    e.preventDefault();
    setErrorMessage('');
  
    try {
      const response = await UserService.forgotPassword(email); // Send request to backend
      setModalTitle('Slaptažodžio atkūrimas');
      setModalMessage('Slaptažodžio atkūrimo nuoroda išsiųsta į el. paštą!');
      setIsModalOpen(true);
        
      setTimeout(() => {
        setIsModalOpen(false);
        navigate('/prisijungti');
      }, 3000);
    } catch (error) {

      const backendMessage = error.message || 'Įvyko klaida atkuriant slaptažodį. Bandykite dar kartą.';
      setErrorMessage(backendMessage); 
    }
  };
  
  

  return (
    <div className="flex font-oldStandard min-h-full flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="mt-10 text-center text-2xl font-bold tracking-tight text-gray-900">
          Slaptažodžio atkūrimas
        </h2>
        <p className="mt-2 text-center text-sm text-gray-500">
          Įveskite savo el. pašto adresą, kad gautumėte slaptažodžio atkūrimo nuorodą.
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <form onSubmit={handlePasswordRecovery} className="space-y-6">
          {errorMessage && (
            <div className="text-red-500 text-sm text-center">{errorMessage}</div>
          )}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-900"
            >
              El. paštas
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
            <button
              type="submit"
              className="flex w-full justify-center rounded-md bg-black px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 focus:outline-black"
            >
              Atkurti slaptažodį
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

export default PasswordRecoveryPage;

