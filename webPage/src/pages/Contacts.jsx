import React, { useState } from "react";
import { useContactInfo } from "../contexts/ContactContext";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

function Kontaktai() {
  const { data, error } = useContactInfo();
  const [animationError, setAnimationError] = useState(false);

  const googleMapsURL = `https://www.google.com/maps?q=${encodeURIComponent(
    data.ADRESAS
  )}&output=embed`;
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      
      <div className="w-full max-w-4xl bg-white shadow-md rounded-lg p-6">
        <div className="pb-6 border-b">
          <h3 className="text-2xl font-bold text-gray-800">Kontaktinė informacija</h3>
          <div className="flex justify-center mt-6">
      {!animationError && (
        <DotLottieReact
          src="https://lottie.host/3f8c861e-fc1b-4e7f-be47-432b5f3c766c/CzetrRjHOE.lottie"
          loop
          autoplay
          style={{ width: "250px", height: "250px" }}
          onError={() => setAnimationError(true)} 
        />
      )}
      </div>
          <p className="mt-1 text-gray-600 text-sm">
            {error
              ? "Šiuo metu atnaujinami kontaktiniai duomenys."
              : "Susisiekite su mumis dėl papildomos informacijos."}
          </p>
        </div>
        <div className="mt-6">
          <dl className="divide-y divide-gray-200">
            <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-gray-700">El. paštas</dt>
              <dd className="text-sm text-gray-900 sm:col-span-2">{data.EMAIL}</dd>
            </div>
            <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-gray-700">Telefonas</dt>
              <dd className="text-sm text-gray-900 sm:col-span-2">{data.TELEFONAS}</dd>
            </div>
            <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-gray-700">Adresas</dt>
              <dd className="text-sm text-gray-900 sm:col-span-2">{data.ADRESAS}</dd>
            </div>
          </dl>
        </div>
        <div className="mt-6">
          <h4 className="text-lg font-semibold text-gray-800">Mūsų vieta</h4>
          <div className="mt-4">
            <iframe
              title="Google Maps"
              src={googleMapsURL}
              width="100%"
              height="300"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
            ></iframe>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Kontaktai;





