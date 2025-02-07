import React, { useEffect, useState } from "react";
import { useLikedItems } from "../contexts/LikedItemsContext";
import ProductService from "../services/ProductService";
import { useNavigate } from "react-router-dom";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
function LikedPage() {
  const { likedItems, toggleLike } = useLikedItems();
  const [productDetails, setProductDetails] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [animationError, setAnimationError] = useState(false);
  const navigate = useNavigate();

  // useEffect(() => {
  //   const fetchDetails = async () => {
  //     try {
  //       const promises = Object.keys(likedItems)
  //         .filter((id) => likedItems[id])
  //         .map((id) => ProductService.fetchProductById(id));

  //       const results = await Promise.all(promises);
  //       setProductDetails(results);
  //     } catch (error) {
  //       const message = error.message || "Nepavyko gauti mėgstamų prekių.";
  //       setErrorMessage(message);
  //     }
  //   };
  //   fetchDetails();
  // }, [likedItems]);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const promises = Object.keys(likedItems)
          .filter((id) => likedItems[id]) // Include only `true` liked items
          .map((id) => 
            ProductService.fetchProductById(id)
              .then((product) => ({ id, product })) // Map response to include ID
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
        }
      } catch (error) {
        console.error("Error fetching product details:", error);
      }
    };
  
    fetchDetails();
  }, [likedItems]); 
  const navigateToProduct = (productName, productId) => {
    const cleanName = productName.replace(/\s+/g, "-").toLowerCase();
    navigate(`/prekiu-katalogas/${cleanName}/${productId}`);
  };

  if (errorMessage) {
      return (
      <div className="font-oldStandard container mx-auto py-6 px-4 text-center">
      <h1 className="text-2xl font-bold mb-4">Jūsų krepšelis</h1>
      <div className="text-2xl text-gray-700 mt-4">{serverError}</div>
      <div className="flex justify-center mt-6">
      {!animationError && (<DotLottieReact
              src="https://lottie.host/b3377209-bd26-40e1-a351-96be6897d735/EZ1CxFsRuY.lottie"
              loop
              autoplay
              style={{ width: "250px", height: "250px" }}
              onError={() => setAnimationError(true)} 
            />)}
          </div>
          </div>
      );
    }

  if (!productDetails.length) {
    return (
          <div className="font-oldStandard container mx-auto py-6 px-4">
          <h1 className="text-2xl text-center font-bold mb-4">Mėgstamiausios</h1>
            <div>
              <div className="text-2xl text-center text-gray-700 mb-12">Mėgstamu prekiu nėra</div>
              <div className="flex justify-center mt-6">
              {!animationError && (
                <DotLottieReact
                src="https://lottie.host/4d159cb5-e73a-4ebe-bd4f-344b7d46ce09/uZBlmM2Mba.lottie"
                loop
                autoplay
                style={{ width: "250px", height: "250px" }}
              />)}
            </div>
              <div className="mt-8 text-center ">
                <a
                  href="/prekiu-katalogas"
                  className="flex items-center justify-center underline-hover hover:animate-smooth-bounce border border-gray-300 rounded-md px-4 py-2 hover:bg-gray-100 transition-colors duration-300"
                >
                  <img
                    width="30"
                    height="30"
                    src="https://img.icons8.com/ios/100/magazine.png"
                    alt="magazine"
                    className="mr-5 "
                  />
                  Peržiūrėti katalogą
                </a>
              </div>
            </div>
            <div className="pb-16"></div> {/* Space between the button and footer */}
          </div>
        );
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <h1 className="text-2xl text-center font-bold mb-4">Mėgstamos prekės</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {productDetails.map((product) => (
          <div
            key={product.PRK_ID}
            className="relative border rounded p-4 hover:scale-105 transition group"
          >
            {/* Like Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleLike(product.PRK_ID);
              }}
              className={`absolute top-4 right-4 rounded-full p-2 transition-all duration-200 z-10 ${
                likedItems[product.PRK_ID] ? "text-red-500" : "text-gray-800"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill={likedItems[product.PRK_ID] ? "red" : "none"}
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="w-6 h-6 transition-all duration-200"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                />
              </svg>
            </button>

            {/* Image for Navigation */}
            <div
              className="relative w-full h-64 bg-gray-100 flex items-center justify-center rounded overflow-hidden cursor-pointer hover:shadow-lg"
              onClick={() => navigateToProduct(product.PRK_PAVADINIMAS, product.PRK_ID)}
            >
              <img
                src={`data:image/jpeg;base64,${product.IMG_DATA}`}
                alt={product.PRK_PAVADINIMAS}
                className="object-contain w-full h-full"
              />
            </div>

            {/* Product Details */}
            <div className="mt-3 text-center">
              <h2 className="text-lg font-bold">{product.PRK_PAVADINIMAS}</h2>
              <p className="text-gray-600">
                {new Intl.NumberFormat("lt-LT", {
                  style: "currency",
                  currency: "EUR",
                }).format(product.PRK_KAINA)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default LikedPage;




