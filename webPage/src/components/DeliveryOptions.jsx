import React, { useEffect, useState } from "react";
import axios from "axios";
import { BASE_URL } from "../utils/Config";

function DeliveryOptions({ deliveryOption, setDeliveryOption }) {
  const [deliveryMethods, setDeliveryMethods] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDeliveryMethods = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/api/info/delivery-methods`);
        console.log("Delivery Methods:", response.data); 
        setDeliveryMethods(response.data);
      } catch (error) {
        const errorMessage = error.response?.data?.message || "Nepavyko gauti pristatymo būdų.";
        setError(errorMessage);
      }
    };
    fetchDeliveryMethods();
  }, []);

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  return (
    <div className="mt-4">
      <p className="font-bold text-gray-800 mb-2">Pristatymo būdas:</p>
      {deliveryMethods.map((method, index) => (
      <div key={`${method.ID || method.Pavadinimas}-${index}`} className="flex items-center space-x-3 mt-2">
        <input
          type="radio"
          id={method.Pavadinimas}
          name="deliveryOption"
          value={method.Pavadinimas}
          checked={deliveryOption === method.Pavadinimas} 
          onChange={() => setDeliveryOption(method)}
          className="h-4 w-4 text-green-500 border-gray-300"
        />
        <label htmlFor={method.Pavadinimas} className="text-gray-700">
          {method.Pavadinimas} {method.Kaina > 0 ? `(+${method.Kaina} €)` : "(0 €)"}
          {method.Aprasymas && typeof method.Aprasymas === "string" && (
            <p className="text-sm text-gray-500 mt-1">{method.Aprasymas}</p>
          )}
        </label>
      </div>
))}


    </div>
  );
}

export default DeliveryOptions;


