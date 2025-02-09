
import React, { useEffect, useState } from "react";
import axios from "axios";
import { BASE_URL } from "../utils/Config";


function PaymentOptions({ paymentMethod, setPaymentMethod, deliveryType }) {
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [error, setError] = useState("");
  
    useEffect(() => {
      const fetchPaymentMethods = async () => {
        try {
          const response = await axios.get(`${BASE_URL}/api/info/payment-methods`);
          setPaymentMethods(response.data);
          console.log(response.data);
        } catch (error) {
          const errorMessage =
            error.response?.data?.message || "Nepavyko gauti mokėjimo būdų.";
          setError(errorMessage);
        }
      };
      fetchPaymentMethods();
    }, []);
  
    if (error) {
      return <p className="text-red-500">{error}</p>;
    }
  
    const filteredPaymentMethods = paymentMethods.filter(
        (method) =>
          deliveryType === "pickup" || (deliveryType === "delivery" && method.deliveryPossible)
      );
      
      return (
        <div className="mt-4">
          <p className="font-bold text-gray-800 mb-2">Mokėjimo būdas:</p>
          {filteredPaymentMethods.map((method) => (
            <div key={method.id} className="flex items-center space-x-3 mt-2">
              <input
                type="radio"
                id={`payment-${method.id}`}
                name="paymentMethod"
                value={method.id}
                checked={paymentMethod === method.id}
                onChange={() => setPaymentMethod(method.id)}
                className="h-4 w-4 text-green-500 border-gray-300"
              />
              <label htmlFor={`payment-${method.id}`} className="text-gray-700">
                {method.pavadinimas}
              </label>
            </div>
          ))}
        </div>
      );
      
  }
  
  export default PaymentOptions;
  
