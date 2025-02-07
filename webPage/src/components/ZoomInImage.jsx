import React, { useEffect, useState } from "react";
import ProductService from "../services/ProductService";
import { useStockData } from "../contexts/StockDataContext"; 
function ZoomInImage({
  item,
  closeGallery,
  addToCart,
  cartItems,
  removeFromCart,
  toggleLike,
  isLiked,
}) {
      
  const [images, setImages] = useState([]);
  const [mainImage, setMainImage] = useState(null);
  const {stockData, fetchStockData} = useStockData();
  useEffect(() => {
    const getImages = async () => {
      try {
        const imageList = await ProductService.fetchProductImages(item.PRK_ID);
        setImages(imageList);
        setMainImage(imageList[0] || null); // Set first image as default
      } catch (error) {
        setImages([]);
      }
    };
    getImages();
  }, [item.PRK_ID]);
  useEffect(() => {
    fetchStockData();
  }, []);
  const validateAddAndCkeckStock = async (productId) => {
    try {
      addToCart(productId)
      await fetchStockData();
    } catch (error) {
      console.log("Klaida: " + error);
    }
  };
  const validateRemoveAndCkeckStock = async (productId) => {
    try {
      removeFromCart(productId)
      await fetchStockData();
    } catch (error) {
      console.log("Klaida: " + error);
    }
  };
  return (
      <div className="bg-white min-h-screen flex flex-col lg:flex-row items-start justify-center p-6">

      {/* Modal Content */}
      <div className="w-full max-w-5xl bg-white rounded-lg overflow-hidden shadow-lg flex flex-col lg:flex-row relative animate-scale-in">
      <div className="relative flex-1 flex flex-col items-center">
        {/* image section */}
        <div className="relative flex items-center justify-center bg-transparent w-full h-[400px] sm:h-[500px] lg:h-[700px]">
            {mainImage ? (
              <img
                src={`data:image/jpeg;base64,${mainImage}`}
                alt="Main Product"
                className="w-full h-full object-contain"
              />
            ) : (
              <p className="text-gray-500 text-sm">Nerasta nuotraukų</p>
            )}
          </div>


          <div className="w-full grid grid-cols-5 gap-1 p-2">
            {images.map((image, index) => (
              <div
                key={index}
                className={`w-[60px] h-[60px] border rounded-md flex items-center justify-center cursor-pointer ${
                  image === mainImage ? "border-black" : "border-gray-300"
                } transition-transform hover:scale-105`}
                onClick={() => setMainImage(image)}
              >
                <img
                  src={`data:image/jpeg;base64,${image}`}
                  alt={`Thumbnail ${index}`}
                  className="w-full h-full object-contain"
                />
              </div>
            ))}
          </div>
        </div>
            {/* Right Section: Description and Actions */}
            <div className="flex-1 p-6 flex flex-col justify-between font-oldStandard">
              {/* Title */}
              <div>
                <h2 className="text-3xl font-bold text-black mb-4 text-center">
                  {item.PRK_PAVADINIMAS || "Nėra pavadinimo"}
                </h2>
              <div>
                <h3 className="text-lg font-semibold mb-2 text-gray-800">
                  Aprašymas
                </h3>
                <div className="border-t border-gray-300 mt-4"></div>
                <p className="text-gray-700 text-sm leading-relaxed">
                  {item.PRK_APRASYMAS || "Nėra aprašymo."}
                </p>
                </div>
                <div className="border-t border-gray-300 mt-4"></div>
              {/* Price */}
              <div className="text-lg font-oldStandard">
              <span className="font-semibold mr-1">Kaina:</span> {/* Added label */}
                    {item.PRK_KAINA && !isNaN(item.PRK_KAINA) ? (
                      Number(item.discount) > 0 ? (
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
                          </span> 
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
                  <span className="font-oldStandard mr-3">Prekės kodas:  </span> {/* Added label */}
                     {item.PRK_KODAS}
                  </div>
              </div>
              <div className="flex flex-col gap-4">
              {/* // amount in stock*/}
              <div className="text-sm mb-2 flex items-center font-oldStandard ">
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

            <div className="border-t border-gray-300 mt-5"></div>
            {/* Like/Unlike Button */}
            <button
              onClick={() => toggleLike(item.PRK_ID)}
              className={`bg-transparent rounded-full  transition-all duration-200 ${
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
        </div>
      </div>
    </div>
  );
}
export default ZoomInImage;


