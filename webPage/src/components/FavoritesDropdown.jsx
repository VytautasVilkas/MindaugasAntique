import React, { useEffect, useState } from "react";
import ProductService from "../services/ProductService";
import { useLikedItems } from "../contexts/LikedItemsContext";
import { useSharedState } from "../contexts/SharedStateContext";
function FavoritesDropdown() {
  const { likedItems, toggleLike,validateLikedItems } = useLikedItems();
  const [productDetails, setProductDetails] = useState([]);
  const { setNeedsRefresh } = useSharedState(); 


  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const promises = Object.keys(likedItems)
          .filter((id) => likedItems[id]) 
          .map((id) => 
            ProductService.fetchProductById(id)
              .then((product) => ({ id, product })) 
              .catch((error) => {
                console.error(`Error fetching product ID ${id}:`, error);
                return { id, product: null }; 
              })
          );
  
        const results = await Promise.all(promises);
        const validProducts = results.filter((result) => result.product !== null);
        const invalidProducts = results.filter((result) => result.product === null);
        setProductDetails(validProducts.map((result) => result.product));
        if (invalidProducts.length > 0) {
          validateLikedItems(invalidProducts.map((result) => result.id));
          setNeedsRefresh(true); 
        }
      } catch (error) {
        console.error("Error fetching product details:", error);
      }
    };
  
    fetchDetails();
  }, [likedItems, setNeedsRefresh]); 

  return (
    <div className="absolute top-full right-0 mt-2 w-80 bg-white shadow-lg rounded-lg z-50">
      {productDetails.length > 0 ? (
        <ul className="p-2 space-y-2">
          {productDetails.map((product) => {
            const price = parseFloat(product.PRK_KAINA) || 0;
            const discount = parseFloat(product.PRK_NUOLAIDA) || 0;
            const discountedPrice =
              discount > 0 ? price - (price * discount) / 100 : price;

            return (
              <li
                key={product.PRK_ID}
                className="flex items-center p-2 border-b last:border-none"
              >
                {/* Image */}
                <div className="w-16 h-16 bg-gray-100 rounded-md overflow-hidden">
                  <img
                    src={`data:image/jpeg;base64,${product.IMG_DATA}`}
                    alt={product.PRK_PAVADINIMAS}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Product Details */}
                <div className="flex-1 ml-3">
                  <div className="font-semibold text-gray-800 leading-snug line-clamp-3">
                    {product.PRK_PAVADINIMAS}
                  </div>
                  {/* Price */}
                  <div className="text-sm font-oldStandard mt-1">
                    {discount > 0 ? (
                      <>
                        <span className="text-red-500">
                          {new Intl.NumberFormat("lt-LT", {
                            style: "currency",
                            currency: "EUR",
                          }).format(discountedPrice.toFixed(2))}
                        </span>
                        <span className="text-gray-400 line-through ml-1">
                          {new Intl.NumberFormat("lt-LT", {
                            style: "currency",
                            currency: "EUR",
                          }).format(price.toFixed(2))}
                        </span>
                      </>
                    ) : (
                      <span>
                        {new Intl.NumberFormat("lt-LT", {
                          style: "currency",
                          currency: "EUR",
                        }).format(price.toFixed(2))}
                      </span>
                    )}
                  </div>
                </div>

                {/* Heart Icon */}
                <button
                  onClick={() => toggleLike(product.PRK_ID)}
                  className="text-red-500 hover:scale-110 transition-transform"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill={likedItems[product.PRK_ID] ? "red" : "none"}
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="w-6 h-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                    />
                  </svg>
                </button>
              </li>
            );
          })}
          <li className="mt-2">
            <a
              href="/megstamiausios"
              className="flex items-center font-oldStandard underline-hover hover:animate-smooth-bounce border border-gray-300 rounded-md px-4 py-2 hover:bg-gray-100 transition-colors duration-300"
            >
              <img
                src="https://img.icons8.com/metro/52/like.png"
                alt="like"
                className="w-6 h-6 mr-2"
              />
              Peržiūrėti mėgstamiausias
            </a>
          </li>


          
        </ul>
      ) : (
        <div className="p-3 text-gray-500 text-center">Sąrašas tuščias</div>
      )}
    </div>
  );
}

export default FavoritesDropdown;
