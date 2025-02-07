import React, { createContext, useContext, useState, useEffect } from "react";
import InfoService from "../services/InfoService";

const ContactInfoContext = createContext();

export const useContactInfo = () => useContext(ContactInfoContext);

export const ContactInfoProvider = ({ children }) => {
  const [data, setData] = useState({
    EMAIL: "Keičiasi kontaktiniai duomenys",
    TELEFONAS: "Keičiasi kontaktiniai duomenys",
    ADRESAS: "Keičiasi kontaktiniai duomenys",
  });
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const result = await InfoService.GetInfo();
        if (result.length > 0) {
          setData(result[0]);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error("Error fetching contact info:", err);
        setError(true);
      }
    };

    fetchInfo();
  }, []);

  return (
    <ContactInfoContext.Provider value={{ data, error }}>
      {children}
    </ContactInfoContext.Provider>
  );
};
