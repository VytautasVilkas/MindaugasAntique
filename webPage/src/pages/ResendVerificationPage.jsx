import React, { useState } from "react";
import axios from "axios";
import { BASE_URL } from "../utils/Config";
const ResendVerificationPage = () => {
  const [email, setEmail] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  const handleResendVerification = async (e) => {
    e.preventDefault();
    setStatusMessage("");

    try {
      const response = await axios.post(
        BASE_URL+"/api/user/resend-verification",
        { email }
      );
      setStatusMessage(response.data.message || "Patvirtinimo el. laiškas išsiųstas.");
    } catch (error) {
      setStatusMessage(
        error.response?.data?.message || "Įvyko klaida. Bandykite dar kartą."
      );
    }
  };

  return (
    <div className="flex font-oldStandard min-h-full flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="mt-10 text-center text-2xl font-bold tracking-tight text-gray-900">
          Pakartotinis patvirtinimas
        </h2>
        <p className="mt-2 text-center text-sm text-gray-500">
          Jei negavote el. laiško, įveskite savo el. pašto adresą ir mes atsiųsime naują.
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <form onSubmit={handleResendVerification} className="space-y-6">
          {statusMessage && (
            <div className="text-sm text-center text-gray-600">
              {statusMessage}
            </div>
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
            <button
              type="submit"
              className="flex w-full justify-center rounded-md bg-black px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 focus:outline-black"
            >
              Siųsti patvirtinimo el. laišką
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResendVerificationPage;

