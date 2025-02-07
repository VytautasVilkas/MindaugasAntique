import React, { useState,useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import UserService from '../services/UserService'; // Import UserService
import Modal from '../dialogBox/Modal'; // Import Modal

const PasswordResetPage = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token'); 
  const navigate = useNavigate();

  useEffect(() => {
    const validateToken = async () => {
      try {
        const response = await UserService.validateResetPasswordToken(token); 
        console.log(response.message); 
      } catch (error) {
        setModalTitle('Klaida');
        setModalMessage(error.message);
        setIsModalOpen(true);
        setTimeout(() => navigate('/'), 2000); 
      }
    };
    validateToken();
  }, [token, navigate]);





  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setErrorMessage(''); 
    if (newPassword !== confirmPassword) {
      setErrorMessage('Slaptažodžiai nesutampa.');
      return;
    }
    try {
      await UserService.resetPassword(token,newPassword); 
      setModalTitle('Slaptažodžio atkūrimas');
      setModalMessage('Slaptažodis sėkmingai pakeistas!');
      setIsModalOpen(true);
      setTimeout(() => {
        setIsModalOpen(false);
        navigate('/prisijungti'); 
      }, 3000);
    } catch (error) {
      setErrorMessage(error.message || 'Įvyko klaida atkuriant slaptažodį. Bandykite dar kartą.');
    }
  };

  return (
    <div className="flex font-oldStandard min-h-full flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="mt-10 text-center text-2xl font-bold tracking-tight text-gray-900">
          Slaptažodžio atkūrimas
        </h2>
        <p className="mt-2 text-center text-sm text-gray-500">
          Įveskite naują slaptažodį.
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <form onSubmit={handlePasswordReset} className="space-y-6">
          {errorMessage && (
            <div className="text-red-500 text-sm text-center">{errorMessage}</div>
          )}
          <div>
            <label
              htmlFor="newPassword"
              className="block text-sm font-medium text-gray-900"
            >
              Naujas slaptažodis
            </label>
            <div className="mt-2">
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 outline-gray-300 placeholder-gray-400 focus:outline-black sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-900"
            >
              Patvirtinkite slaptažodį
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

export default PasswordResetPage;