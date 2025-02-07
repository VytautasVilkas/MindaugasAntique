import React, { createContext, useEffect, useState } from "react";

export const LayoutContext = createContext();

function ResponsiveWrapper({ children }) {
  const [layout, setLayout] = useState("desktop"); // 'desktop', 'tablet', or 'mobile'

  useEffect(() => {
    const updateLayout = () => {
      const screenWidth = window.innerWidth;
      if (screenWidth < 768) {
        setLayout("mobile");
      } else if (screenWidth >= 768 && screenWidth < 1024) {
        setLayout("tablet");
      } else {
        setLayout("desktop");
      }
    };

    updateLayout(); // Check layout on component mount
    window.addEventListener("resize", updateLayout); // Update layout on resize

    return () => {
      window.removeEventListener("resize", updateLayout);
    };
  }, []);

  console.log("ResponsiveWrapper Layout:", layout);

  return (
    <LayoutContext.Provider value={layout}>
      <div
        className="min-h-screen w-full flex justify-center "
        style={{
          overflowX: "hidden", // Prevent horizontal scrolling
        }}
      >
        <div
          className={`w-full ${
            layout === "desktop" ? "max-w-screen-xl" : "max-w-3xl"
          } p-4`}
        >
          {children}
        </div>
      </div>
    </LayoutContext.Provider>
  );
}

export default ResponsiveWrapper;









  