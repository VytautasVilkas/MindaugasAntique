import React, { useEffect, useState } from "react";
import ProductService from "../services/ProductService";
import { useStockData } from "../contexts/StockDataContext"; 
import { useCart } from "../contexts/CartContext"; // Import useCart context
import { useSharedState } from "../contexts/SharedStateContext";
function CartDropdown() {
  const { cartItems, addToCart, removeFromCart, validateCart, validateCartItems } = useCart(); // Use cart context
  const [productDetails, setProductDetails] = useState([]);
  const {fetchStockData} = useStockData();
  const { setNeedsRefresh } = useSharedState(); 

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const promises = Object.keys(cartItems).map((id) =>
          ProductService.fetchProductById(id)
            .then((product) => ({ id, product })) 
            .catch((error) => {
              console.error(`Klaida ${id}:`, error);
              return { id, product: null }; 
            })
        );
        const results = await Promise.all(promises);
        const validProducts = results.filter((result) => result.product !== null);
        const invalidProducts = results.filter((result) => result.product === null);
        
        setProductDetails(validProducts.map((result) => result.product));
        if (invalidProducts.length > 0){
          
        validateCartItems(invalidProducts);
        setNeedsRefresh(true); 
        }else{

        }


      } catch (error) {
        const errorMessage = error.message  || "Nepavyko gauti krepselio informacijos.";
        setServerError(errorMessage);
      }
    };
  
    fetchDetails();
  }, [cartItems, setNeedsRefresh]);
  

   useEffect(() => {
    validateCart();
    fetchStockData();
  }, []);

  function addAndCheckStock(productId){
    addToCart(productId)
    fetchStockData();
  }
  function removeAndCheckStock(productId){
    removeFromCart(productId)
    fetchStockData();
  }

  const calculateTotal = () => {
    return productDetails.reduce((total, product) => {
      const price = parseFloat(product.PRK_KAINA) || 0;
      const discount = parseFloat(product.PRK_NUOLAIDA) || 0;
      const discountedPrice = discount > 0 ? price - (price * discount) / 100 : price;

      return total + discountedPrice * (cartItems[product.PRK_ID] || 0);
    }, 0);
  };

  return (
    <div className="absolute top-full right-0 mt-2 bg-white shadow-lg rounded-lg z-50 w-80 sm:w-72 md:w-96 lg:w-80 xl:w-96">
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
                {/* Image Container */}
                <div className="flex-shrink-0 w-12 h-12 md:w-16 md:h-16 bg-gray-100 rounded-md overflow-hidden">
                  <img
                    src={`data:image/jpeg;base64,${product.IMG_DATA}`}
                    alt={product.PRK_PAVADINIMAS}
                    className="w-full h-full object-cover"
                  />
                </div>
  
                {/* Product Details */}
                <div className="flex-1 ml-3">
                  <div className="font-semibold text-gray-800 leading-snug line-clamp-2 md:line-clamp-3">
                    {product.PRK_PAVADINIMAS}
                  </div>
                  {/* Price */}
                  <div className="text-sm font-oldStandard">
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
                  {/* Quantity Controls */}
                  <div className="flex items-center space-x-2 mt-1">
                    <button
                      className="text-red-500 border border-gray-300 rounded px-2 py-1 hover:bg-red-500 hover:text-white transition"
                      onClick={() => removeAndCheckStock(product.PRK_ID)}
                    >
                      -
                    </button>
                    <span className="text-gray-700 font-semibold">
                      {cartItems[product.PRK_ID]}
                    </span>
                    <button
                      className="text-green-500 border border-gray-300 rounded px-2 py-1 hover:bg-green-500 hover:text-white transition"
                      onClick={() => addAndCheckStock(product.PRK_ID)}
                    >
                      +
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
  
          {/* Total Sum */}
          <li className="p-2 text-lg font-bold text-gray-800 border-t">
            Viso:{" "}
            {new Intl.NumberFormat("lt-LT", {
              style: "currency",
              currency: "EUR",
            }).format(calculateTotal().toFixed(2))}
          </li>
  
          {/* View Cart Button */}
          <li className="mt-2">
            <a
              href="/krepselis"
              className="flex items-center font-oldStandard underline-hover hover:animate-smooth-bounce border border-gray-300 rounded-md px-4 py-2 hover:bg-gray-100 transition-colors duration-300"
            >
              <img
                src="https://img.icons8.com/fluency-systems-regular/96/shopping-bag--v1.png"
                alt="Cart Icon"
                className="w-6 h-6 mr-2"
              />
              Peržiūrėti krepšelį
            </a>
          </li>
        </ul>
      ) : (
        <div className="p-3 text-gray-500 text-center">Krepšelis tuščias</div>
      )}
    </div>
  );
  
}

export default CartDropdown;
