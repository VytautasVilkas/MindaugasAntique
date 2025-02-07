import React from "react";

const Layout = ({ children }) => {
  return (
    <div
      className="min-h-screen bg-gradient-to-b from-gray-0 to-gray-200 relative"
    >
      <div className="pb-0">{children}</div> 
    </div>
  );
};

export default Layout;






