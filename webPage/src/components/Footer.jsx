import React, { useState } from "react";
import { useContactInfo } from "../contexts/ContactContext";

function Footer() {
  const { data, error } = useContactInfo();


  return (
    <footer
      className="relative w-full text-[#4a3f35] font-oldStandard py-2 px-6 mt-auto shadow-inner"
      style={{ minHeight: "100px" }} 
    >
      <div className="relative z-10 container mx-auto flex flex-col md:flex-row justify-between items-start pb-1">
        {/* Left Section */}
        <div className="text-sm text-left mb-0 md:mb-0">
          <p className="font-bold">Kontaktai:</p>
          {error ? (
            <p>Kontaktinė informacija šiuo metu nepasiekiama.</p>
          ) : (
            <>
              <p>Tel.: {data?.TELEFONAS || "Keičiasi kontaktiniai duomenys"}</p>
              <p>El.paštas: {data?.EMAIL || "Keičiasi kontaktiniai duomenys"}</p>
            </>
          )}
        </div>

        {/* Feedback Mail Icon */}
        <div className="relative group hover:animate-smooth-bounce">
          <a
            href="/susisiekite"
            className="text-gray-800 text-4xl transform transition-transform duration-300"
            aria-label="Send Feedback"
          >
            <img
              width="30"
              height="30"
              src="https://img.icons8.com/metro/52/paper-plane.png"
              alt="paper-plane"
            />
          </a>
        </div>
      </div>

      {/* Bottom Line */}
      <div className="border-t border-[#e0ded8] mt-1"></div>

      {/* Center Section */}
      <div className="relative text-sm text-center pt-1" style={{ marginBottom: "5px" }}>
        © 2024 Visos teisės saugomos
      </div>
    </footer>
  );
}

export default Footer;
