import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ProductService from "../services/ProductService";
import ZoomInImage from "../components/ZoomInImage";
import { useCart } from "../contexts/CartContext";
import { useLikedItems } from "../contexts/LikedItemsContext";
import { useLogger } from "../contexts/LoggerContext";
import { useNavigate } from "react-router-dom";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
function Product() {
  const { name,id } = useParams(); 
  const [item, setItem] = useState(null); 
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(""); // State to handle error messages
  const { cartItems, addToCart, removeFromCart } = useCart();
  const { likedItems, toggleLike } = useLikedItems();
  const { log, isInitialized } = useLogger();
  const [animationError, setAnimationError] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    const fetchData = async () => {
      try {
        const product = await ProductService.fetchProductById(id);
        // kadangi produktas ieskomas tik pagal id,
        // gali nesutapti url prekes pavadinimas su tikru prekes pavadinimu.
        // sutikrinam ar sutampa ar ne ir jeigu nesutampa tai sugeneruojam nauja.
        const correctName = product.PRK_PAVADINIMAS.replace(/\s+/g, "-").toLowerCase(); 
        if (name !== correctName) {
          navigate(`/prekiu-katalogas/${correctName}/${id}`, { replace: true });
        }
        setItem(product);
      } catch (error) {
        setMessage(error.message || "Įvyko klaida bandant gauti produktą."); 
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  useEffect(() => {
    if (isInitialized && item) {
      log("INFO", "Pažiūrėjo prekę", {
        productId: item.PRK_ID,
        productName: item.PRK_PAVADINIMAS,
      });
    }
  }, [isInitialized, item]);

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
  if (message) return <p className="text-center py-8">{message}</p>; 
  if (!item) return <p>Produktas nerastas</p>;

  return (
    <>
      <ZoomInImage
        item={item}
        addToCart={addToCart}
        cartItems={cartItems}
        removeFromCart={removeFromCart}
        toggleLike={() => toggleLike(item.PRK_ID)}
        isLiked={likedItems[item.PRK_ID] || false}
      />
    </>
  );
}

export default Product;


    



