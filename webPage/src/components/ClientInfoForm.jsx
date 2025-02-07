import React from "react";

const ClientInfoForm = ({ clientInfo, setClientInfo, isAuthenticated, deliveryOption }) => {
  const handleInputChange = (field, value) => {
    setClientInfo((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="mt-4 p-4 border rounded-md bg-white shadow">
      <h2 className="text-xl font-bold mb-4">Kliento Informacija</h2>

      {/* First Name */}
      <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
        Vardas
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none">
        <img width="20" height="20" src="https://img.icons8.com/dotty/80/user.png" alt="user"/>
        </div>
        <input
          type="text"
          id="firstName"
          value={clientInfo.firstName}
          onChange={(e) => handleInputChange("firstName", e.target.value)}
          className="block w-full rounded-md bg-white px-3 ps-10 py-2 text-base text-gray-900 outline outline-1 outline-gray-300 placeholder-gray-400 focus:outline-black sm:text-sm"
          placeholder="Įveskite vardą..."
        />
      </div>

      {/* Last Name */}
      <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mt-4">
        Pavardė
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none">
        <img width="20" height="20" src="https://img.icons8.com/dotty/80/user.png" alt="user"/>
        </div>
        <input
          type="text"
          id="lastName"
          value={clientInfo.lastName}
          onChange={(e) => handleInputChange("lastName", e.target.value)}
          className="block w-full rounded-md bg-white px-3 ps-10 py-2 text-base text-gray-900 outline outline-1 outline-gray-300 placeholder-gray-400 focus:outline-black sm:text-sm"
          placeholder="Įveskite pavardę..."
        />
      </div>

      {/* Phone Number */}
      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mt-4">
        Telefono numeris
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none">
        <img width="20" height="20" src="https://img.icons8.com/ios/100/phone--v1.png" alt="phone--v1"/>
        </div>
        <input
          type="text"
          id="phone"
          value={clientInfo.phoneNumber}
          onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
          className="block w-full rounded-lg bg-white px-3 ps-10 py-2 text-base text-gray-900 border border-gray-300 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          placeholder="Įveskite telefono numerį..."
          pattern="^[0-9]{8}$"
          required
        />
      </div>

      {deliveryOption === "delivery" && (
        <>
          {/* City */}
          <label htmlFor="city" className="block text-sm font-medium text-gray-700 mt-4">
            Miestas
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none">
            <img width="20" height="20" src="https://img.icons8.com/ios/100/city.png" alt="city"/>
            </div>
            <input
              type="text"
              id="city"
              value={clientInfo.city}
              onChange={(e) => handleInputChange("city", e.target.value)}
              className="block w-full rounded-md bg-white px-3 ps-10 py-2 text-base text-gray-900 outline outline-1 outline-gray-300 placeholder-gray-400 focus:outline-black sm:text-sm"
              placeholder="Įveskite miestą..."
            />
          </div>

          {/* Street */}
          <label htmlFor="street" className="block text-sm font-medium text-gray-700 mt-4">
            Gatvė
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none">
            <img width="20" height="20" src="https://img.icons8.com/ios/100/crossroad.png" alt="crossroad"/>
            </div>
            <input
              type="text"
              id="street"
              value={clientInfo.street}
              onChange={(e) => handleInputChange("street", e.target.value)}
              className="block w-full rounded-md bg-white px-3 ps-10 py-2 text-base text-gray-900 outline outline-1 outline-gray-300 placeholder-gray-400 focus:outline-black sm:text-sm"
              placeholder="Įveskite gatvę..."
            />
          </div>

          {/* House Number */}
          <label htmlFor="houseNumber" className="block text-sm font-medium text-gray-700 mt-4">
            Namo numeris
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none">
            <img width="20" height="20" src="https://img.icons8.com/ios/100/country-house.png" alt="country-house"/>
            </div>
            <input
              type="text"
              id="houseNumber"
              value={clientInfo.houseNumber}
              onChange={(e) => handleInputChange("houseNumber", e.target.value)}
              className="block w-full rounded-md bg-white px-3 ps-10 py-2 text-base text-gray-900 outline outline-1 outline-gray-300 placeholder-gray-400 focus:outline-black sm:text-sm"
              placeholder="Įveskite namo numerį..."
            />
          </div>

          {/* Postal Code */}
          <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mt-4">
            Pašto kodas
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none">
              <svg
                className="w-4 h-4 text-gray-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                viewBox="0 0 16 20"
              >
                <path d="M8 0a7.992 7.992 0 0 0-6.583 12.535 1 1 0 0 0 .12.183l.12.146c.112.145.227.285.326.4l5.245 6.374a1 1 0 0 0 1.545-.003l5.092-6.205c.206-.222.4-.455.578-.7l.127-.155a.934.934 0 0 0 .122-.192A8.001 8.001 0 0 0 8 0Zm0 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z" />
              </svg>
            </div>
            <input
              type="text"
              id="postalCode"
              value={clientInfo.postalCode}
              onChange={(e) => handleInputChange("postalCode", e.target.value)}
              className="block w-full rounded-md bg-white px-3 ps-10 py-2 text-base text-gray-900 outline outline-1 outline-gray-300 placeholder-gray-400 focus:outline-black sm:text-sm"
              placeholder="Įveskite pašto kodą..."
            />
          </div>
        </>
      )}
    </div>
  );
};

export default ClientInfoForm;
