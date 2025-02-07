
import React, { useEffect,useContext, useState } from "react";
import { LayoutContext } from "../ResponsiveWrapper";
import StockService from "../services/StockService";
import { useNavigate } from "react-router-dom";
import { useStockData } from "../contexts/StockDataContext"; 


function FavoriteIcon({ itemId, isLiked, toggleLike }) {
  return (
    <div className="absolute top-2 right-2">
      <button
        onClick={() => toggleLike(itemId)}
        className={`bg-transparent rounded-full p-2 transition-all duration-200 ${
          isLiked ? "text-red-500" : "text-gray-800"
        }`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill={isLiked ? "red" : "none"}
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
          className="w-5 h-5 transition-all duration-200 hover:scale-105 hover:fill-red-500"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
          />
        </svg>
      </button>
    </div>
  );
}
function GridDisplay({ items, likedItems, toggleLike, addToCart, cartItems,removeFromCart }) {
    const {stockData,fetchStockData} = useStockData();

    const layout = useContext(LayoutContext);

    const navigate = useNavigate();

    const product = (productName, productId) => {
      const cleanName = productName.replace(/\s+/g, "-").toLowerCase();
      navigate(`/prekiu-katalogas/${cleanName}/${productId}`); 
    };
    const validateAddAndCkeckStock = async (productId) => {
      try {
        addToCart(productId)
        await fetchStockData();
      } catch (error) {
        console.log("Klaida: " + error);
      }
    };
    const validateRemoveAndCkeckStock  = async (productId) => {
      try {
        removeFromCart(productId)
        await fetchStockData();
      } catch (error) {
        console.log("Klaida: " + error);
      }
    };
       useEffect(() => {
        fetchStockData();
      }, []);
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 p-6">
        {items.map((item) => (
          <div
          
            key={item.PRK_ID}
            className="flex flex-col items-center bg-white shadow-lg rounded-lg overflow-hidden transition-transform transform underline-hover hover:scale-105"
            
          >
            {/* Image Container */}
            <div className="relative aspect-w-1 aspect-h-1 w-full bg-transparent flex items-center justify-center hover:scale-105 ">
                <img
                    src={`data:image/jpeg;base64,${item.IMG_DATA}`}
                    alt={item.PRK_PAVADINIMAS}
                    className="w-full h-full object-contain"
                    onClick={() => product(item.PRK_PAVADINIMAS, item.PRK_ID)}
                />
               </div>
            {/* Content */}
            <div className="p-4 w-full text-center">
              {/* Product Title */}
              <div
                className="text-md font-oldStandard mb-2 h-12 flex items-center justify-center text-center overflow-hidden"
                style={{ lineHeight: "1.2rem" }}
              >
                {item.PRK_PAVADINIMAS}
              </div>
              {/* Price */}
              <div className="text-lg font-oldStandard">
                    {item.PRK_KAINA && !isNaN(item.PRK_KAINA) ? (
                      Number(item.PRK_NUOLAIDA) > 0 ? (
                        <>
                          {/* Discounted price */}
                          <span className="text-red-500">
                            {new Intl.NumberFormat("lt-LT", {
                              style: "currency",
                              currency: "EUR",
                              minimumFractionDigits: 2,
                            }).format(
                              (Number(item.PRK_KAINA) - (Number(item.PRK_KAINA) * Number(item.PRK_NUOLAIDA || 0)) / 100).toFixed(2)
                            )}
                          </span>{" "}
                          <span className="text-gray-400 line-through ml-2">
                            {new Intl.NumberFormat("lt-LT", {
                              style: "currency",
                              currency: "EUR",
                              minimumFractionDigits: 2,
                            }).format(Number(item.PRK_KAINA).toFixed(2))}
                          </span>
                        </>
                      ) : (
                        <span>
                          {new Intl.NumberFormat("lt-LT", {
                            style: "currency",
                            currency: "EUR",
                            minimumFractionDigits: 2,
                          }).format(Number(item.PRK_KAINA).toFixed(2))}
                        </span>
                      )
                    ) : (
                      <span className="text-red-500">Kaina nerasta</span>
                    )}
                  </div>
                  <div className="text-md font-oldStandard mb-2 h-12 flex items-center justify-left text-center overflow-hidden">
                    {item.PRK_KODAS}
                  </div>
              
              {/* // amount in stock*/}
              <div className="text-sm mb-2 flex items-center font-oldStandard">
                <span className="text-gray-600 mr-2">Kiekis sandėlyje:</span>
                {stockData[item.PRK_ID] > 0 ? (
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold">
                    {stockData[item.PRK_ID]} vnt.
                  </span>
                ) : (
                  <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-semibold">
                    Išparduota
                  </span>
                )}
              </div>
              {/* Bottom Line */}
              <div className="border-t border-gray-300 mt-4"></div>
              {/* Button */}
              <div className="mt-3 flex items-center">
                {/* Basket Icon - Left-aligned */}
                <div className="flex items-center justify-start w-1/4">
                <img width="30" height="30" src="https://img.icons8.com/windows/96/add-shopping-cart.png" alt="add-shopping-cart"/>
                </div>

                {/* Cart Controls - Centered */}
                <div className="flex items-center justify-center w-2/4 space-x-2">
                  {/* Remove from Cart Button */}
                  <button
                    className={`hover:bg-red-500 bg-white hover:text-white text-black text-sm py-1 px-3 rounded-lg transition-all duration-200 hover:scale-105 border border-gray-300 ${
                      !cartItems[item.PRK_ID] || !item.PRK_KAINA ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    onClick={() => validateRemoveAndCkeckStock (item.PRK_ID)}
                    disabled={!cartItems[item.PRK_ID] || !item.PRK_KAINA}
                  >
                    -
                  </button>
                    
                  {/* Item Count */}
                  <span className="text-sm font-semibold text-gray-700">
                    {cartItems[item.PRK_ID] || 0}
                  </span>

                  {/* Add to Cart Button */}
                  <button
                    className={`hover:bg-black bg-white hover:text-white text-black text-sm py-1 px-3 rounded-lg transition-all duration-200 hover:scale-105 border border-gray-300 ${
                      !item.PRK_KAINA ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    onClick={() => validateAddAndCkeckStock(item.PRK_ID)}
                    disabled={!item.PRK_KAINA}
                  >
                    +
                  </button>
                </div>
              </div>
              <FavoriteIcon
                itemId={item.PRK_ID}
                isLiked={likedItems[item.PRK_ID] || false}
                toggleLike={toggleLike}
              />
              {/* <ZoomInIcon
                product={() => product(item.title, item.PRK_ID)} 
              /> */}
              
            </div>
          </div>
        ))}
      </div>
    );
  }
  
export default GridDisplay;