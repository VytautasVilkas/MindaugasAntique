import React from "react";

const Modal = ({ title, message, onClose }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-1/3">
        <h2 className="text-lg font-oldStandard mb-4">{title}</h2>
        <p className="text-gray-700 font-oldStandard mb-6">{message}</p>
        {/* Bottom Line */}
        <div className="border-t border-gray-300 mt-4"></div>
        <div className="pt-4"> {/* Add padding here */}
          <button
            className="bg-white border border-gray-400 text-black py-2 px-4 rounded-lg shadow-md hover:shadow-lg hover:bg-gray-100 transition-all duration-200"
            onClick={onClose}
          >
            Uždaryti
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
