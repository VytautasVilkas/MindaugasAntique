import React, { useEffect, useState } from "react";
import ProductService from "../services/ProductService";
import GridDisplay from "../components/Grid";
import { useLikedItems } from "../contexts/LikedItemsContext";
import { useCart } from "../contexts/CartContext";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { useSharedState } from "../contexts/SharedStateContext";
function ProductCatalog() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const {likedItems, toggleLike } = useLikedItems();
  const {cartItems, addToCart, removeFromCart } = useCart();
  const [searchQuery, setSearchQuery] = useState("");
  const [productTypes, setProductTypes] = useState([]);
  const [selectedFilters, setSelectedFilters] = useState([]);
  const [animationError, setAnimationError] = useState(false);
  const { needsRefresh, setNeedsRefresh } = useSharedState();

 

  const fetchProducts = async (query = "", filters = []) => {
    try {
      setLoading(true);
      const typeQuery = filters.join(",");
      const products = await ProductService.fetchProducts(query, typeQuery);
      setItems(products);
      setMessage(products.length === 0 ? "Produktų nerasta." : "");
    } catch (error) {
      setMessage(error.message || "Nepavyko gauti produktų.");
    } finally {
      setLoading(false);
    }
  };

  const fetchProductTypes = async () => {
    try {
      const types = await ProductService.fetchProductTypes();
      setProductTypes(types);
    } catch (error) {
      console.error("Nepavyko gauti produktų tipų:", error.message);
    }
  };

  useEffect(() => {
    fetchProducts(); 
    fetchProductTypes(); 
  }, []);

  useEffect(() => {
    if (needsRefresh) {
      fetchProducts();
      setNeedsRefresh(false); 
    }
  }, [needsRefresh, setNeedsRefresh]); 


  const handleSearch = () => {
    fetchProducts(searchQuery, selectedFilters);
  };

  const toggleFilter = (type) => {
    setSelectedFilters((prev) =>
      prev.includes(type) ? prev.filter((f) => f !== type) : [...prev, type]
    );
  };
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        {!animationError && (
          <DotLottieReact
            src="https://lottie.host/ed0e834c-79aa-4c9a-a1b8-75370de7a13d/AhCHWsPHkN.lottie"
            loop
            autoplay
            style={{ width: "250px", height: "250px" }}
            onError={() => setAnimationError(true)}
          />
        )}
      </div>
    );
  }
  



  return (
    <div className="min-h-screen">
      <div className="flex flex-col items-center bg-gray-30 p-4 shadow-md space-y-4">
        {/* Search Input */}
        <div className="flex items-center w-full max-w-lg space-x-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Parašykite ko ieškote..."
            className="flex-grow border border-gray-300 rounded-md px-3 py-1 text-sm"
          />
          {/* Search Button */}
          <div className="flex items-center">
            <button
              onClick={handleSearch}
              className="text-black px-3 py-1 flex items-center border border-gray-300 rounded-md bg-gray-30 hover:bg-gray-200 transition-transform transform hover:scale-110"
            >
              <img
                width="16"
                height="16"
                src="https://img.icons8.com/ios/100/search--v1.png"
                alt="search-icon"
                className="mr-2"
              />
              <span className="text-sm">Ieškoti</span>
            </button>
          </div>
        </div>

        {/* Filter Tags */}
        <div className="flex flex-wrap items-center w-full max-w-lg space-x-2">
          {productTypes.map((type) => (
            <button
              key={type.PT_ID}
              onClick={() => toggleFilter(type.PT_ID)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                selectedFilters.includes(type.PT_ID)
                  ? "bg-black text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              {type.PT_TYPE}
            </button>
          ))}
        </div>

        {/* Selected Filters */}
        {selectedFilters.length > 0 && (
          <div className="flex flex-wrap items-center w-full max-w-lg space-x-2">
            {selectedFilters.map((filter) => (
              <div
                key={filter}
                className="flex items-center bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm"
              >
                <span>{productTypes.find((t) => t.PT_ID === filter)?.PT_TYPE}</span>
                <button
                  onClick={() => toggleFilter(filter)}
                  className="ml-2 text-green-700"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {message && (
  <div className="flex flex-col items-center justify-center mt-4">
    {!animationError && (
      <DotLottieReact
        src="https://lottie.host/ed0e834c-79aa-4c9a-a1b8-75370de7a13d/AhCHWsPHkN.lottie" // Replace with your preferred animation URL
        loop
        autoplay
        style={{ width: "150px", height: "150px" }}
        onError={() => setAnimationError(true)}
      />
    )}
    {animationError ? (
      <p className="text-center text-black text-2xl font-bold">{message}</p>
    ) : (
      <p className="text-center text-black mt-2">{message}</p>
    )}
  </div>
)}


      <div className="p-4">
        <GridDisplay
          items={items}
          likedItems={likedItems}
          toggleLike={toggleLike}
          addToCart={addToCart}
          cartItems={cartItems}
          removeFromCart={removeFromCart}
        />
      </div>
    </div>
  );
}

export default ProductCatalog;
