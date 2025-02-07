import React, { useState, useEffect } from "react";
import { useUser } from "../contexts/UserContext";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";

const LoginPage = () => {
  const { login, loginWithGoogle, isAuthenticated } = useUser();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // If the user is already authenticated, redirect to the homepage
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    try {
      await login({ email, password });
      navigate("/");
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  const handleGoogleLoginSuccess = async (credentialResponse) => {
    try {
      console.log("trying to log with google....");
      await loginWithGoogle(credentialResponse.credential);
      navigate("/");
    } catch (error) {
      console.log(error.message);
      setErrorMessage(error.message);
    }
  };

  const handleGoogleLoginError = () => {
    setErrorMessage("Nepavyko prisijungti naudojant Google.");
  };

  return (
    <div className="flex font-oldStandard min-h-full flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="mt-10 text-center text-2xl font-bold tracking-tight text-gray-900">
          Prisijunkite
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          {errorMessage && (
            <div className="text-red-500 text-sm text-center">
              {errorMessage}
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
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 outline-gray-300 placeholder-gray-400 focus:outline-black sm:text-sm"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-900"
              >
                Slaptažodis
              </label>
              <div className="text-sm">
                <a
                  href="slaptazodzio-atkurimas"
                  className="font-semibold text-black hover:text-gray-700"
                >
                  Pamiršote slaptažodį?
                </a>
              </div>
            </div>
            <div className="mt-2">
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 outline-gray-300 placeholder-gray-400 focus:outline-black sm:text-sm"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="flex w-full justify-center rounded-md bg-black px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 focus:outline-black"
            >
              Prisijunkite
            </button>
          </div>
        </form>

        <div className="mt-4">
          <GoogleLogin
            onSuccess={handleGoogleLoginSuccess}
            onError={handleGoogleLoginError}
            useOneTap
          />
        </div>

        <p className="mt-10 text-center text-sm text-gray-500">
          Ar neturite paskyros?
          <a
            href="registracija"
            className="font-semibold text-black hover:text-gray-700"
          >
            {" "}
            Registracija
          </a>
        </p>
        <p className="mt-2 text-center text-sm text-gray-500">
          Ar negavote patvirtinimo el. laiško?
          <a
            href="pakartotinis-patvirtinimas"
            className="font-semibold text-black hover:text-gray-700"
          >
            {" "}
            Siųsti iš naujo
          </a>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;



