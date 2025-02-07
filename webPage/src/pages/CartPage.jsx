import React, { useEffect, useState } from "react";
import ProductService from "../services/ProductService";
import { useCart } from "../contexts/CartContext";
import { useUser } from "../contexts/UserContext";
import { useNavigate } from "react-router-dom";
import ClientInfoForm from "../components/ClientInfoForm";
import DeliveryOptions from '../components/DeliveryOptions';
import Modal from "../dialogBox/Modal";
import OrderService from "../services/OrderService";
import PaymentOptions from "../components/PaymentOptions";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
function CartPage() {
  
  const { cartItems, removeFromCart, addToCart, clearCart,validateCart,validateCartItems} = useCart();
  const {isAuthenticated, refreshTokenOrLogout} = useUser();
  const [productDetails, setProductDetails] = useState([]);
  const [agreeToPolicy, setAgreeToPolicy] = useState(false);
  const [deliveryOption, setDeliveryOption] = useState(false); 
  const [deliveryType, setDeliveryType] = useState("");
  const [deliveryFee,setDeliveryFee] = useState();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [animationError, setAnimationError] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [clientInfo, setClientInfo] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    email: "", 
    city: "",
    street: "",
    houseNumber: "",
    postalCode: "",
  });
  const [serverError, setServerError] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  // useEffect(() => {
  //   const fetchDetails = async () => {
  //     try {
  //       const promises = Object.keys(cartItems).map((id) =>
  //         ProductService.fetchProductById(id)
  //       );
  //       const results = await Promise.all(promises);
  //       setProductDetails(results);
  //     } catch (error) {
  //       const errorMessage = error.message  || "Nepavyko gauti krepselio informacijos.";
  //       setServerError(errorMessage);
  //     }
    
  //   };
  
  //   fetchDetails();
  // }, [cartItems]);
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
        validateCartItems(invalidProducts);

      } catch (error) {
        const errorMessage = error.message  || "Nepavyko gauti krepselio informacijos.";
        setServerError(errorMessage);
      }
    };
  
    fetchDetails();
  }, [cartItems]);








  useEffect(() => {
  validateCart();
  }, []);
  
  const productPage = (productName, productId) => {
    const cleanName = productName.replace(/\s+/g, "-").toLowerCase();
    navigate(`/prekiu-katalogas/${cleanName}/${productId}`); 
  };

  const calculateTotal = () => {
    const productTotal = productDetails.reduce((total, product) => {
      const price = parseFloat(product.PRK_KAINA) || 0;
      const discount = parseFloat(product.PRK_NUOLAIDA) || 0;
      const discountedPrice = discount > 0 ? price - (price * discount) / 100 : price;
  
      return total + discountedPrice * (cartItems[product.PRK_ID] || 0);
    }, 0);
    const deliveryCharge = deliveryFee ? parseFloat(deliveryFee) : 0;
  
    return productTotal + deliveryCharge;
  };
  
  
  
  const handleCreateOrder = async () => { 

    setError(""); 

    if (!agreeToPolicy) {
        setError("Turite sutikti su pardavimo sąlygomis.");
        return;
    }
    if (!clientInfo.firstName.trim()) {
      setError("Įveskite Vardą.");
      return;
    } 
    if (!clientInfo.lastName.trim()) {
    setError("Įveskite Pavardę.");
    return;
    }
    if (!clientInfo.phoneNumber.trim()) {
        setError("Turite įvesti telefono numerį.");
        return;
    }
    if (!deliveryOption) {
        setError("Pasirinkite pristatymo būdą ");
        return;
    }
    if (deliveryType === "delivery" && (!clientInfo.city.trim() || !clientInfo.street.trim() || !clientInfo.houseNumber.trim() || !clientInfo.postalCode.trim())) {
        setError("Turite įvesti pilną adresą.");
        return;
    }
    if (!paymentMethod) return setError("Turite pasirinkti mokėjimo būdą.");
    if (!isAuthenticated && !clientInfo.email.trim()) {
        setError("Turite įvesti el. pašto adresą.");
        return;
    } 
    const cartModified = await validateCart();
    if (cartModified) {
    setError("Krepšelis buvo pakeistas. Peržiūrėkite pakeitimus prieš tęsdami.");
    return;
    }

    const orderData = {
      name: clientInfo.firstName,
      surname: clientInfo.lastName,
      phone: clientInfo.phoneNumber,
      deliveryName: deliveryOption,
      deliveryType: deliveryType,
      paymentMethodID: paymentMethod, 
      totalPrice: calculateTotal(),
      deliveryFee: parseFloat(deliveryFee) || 0,
      ...(deliveryType === "delivery"
        ? {
            city: clientInfo.city || "",
            street: clientInfo.street || "",
            houseNumber: clientInfo.houseNumber || "",
            postCode: clientInfo.postalCode || "",
          }
        : {
            city: "",
            street: "",
            houseNumber: "",
            postCode: "",
          }),
          items: productDetails
          .filter((product) => cartItems[product.PRK_ID])
          .map((product) => {
            const price = parseFloat(product.PRK_KAINA) || 0;
            const discount = parseFloat(product.PRK_NUOLAIDA) || 0;
            const discountedPrice = discount > 0 ? price - (price * discount) / 100 : price;
            return {
              productId: product.PRK_KODAS,
              productName: product.PRK_PAVADINIMAS,
              quantity: cartItems[product.PRK_ID],
              price: discountedPrice 
            };
          }),
    };
    console.log("Generated Order Data:", JSON.stringify(orderData, null, 2));
    if (!orderData.items.length) {
      setError("Krepšelis tuščias.");
      return;
    }
    try {
      const response = await createNewOrder(orderData);
      openModal("Užsakymas", "Ačiū už jūsų užsakymą");
      setTimeout(() => {
        clearCart();
        navigate(`/susisieksime-su-jumis`);
      }, 2000);
    } catch (error) {
      setError(error.message || "Nepavyko sukurti užsakymo.");
    }
  };
  const createNewOrder = async (orderData) => {
    try {
      const response = await OrderService.createOrder(orderData, refreshTokenOrLogout);
      return response; 
    } catch (error) {
      setError(error.message || "Nepavyko sukurti užsakymo.");
      throw error; 
    }
  };
  const openModal = (title, message) => {
    console.log(title + " : " + message); 
    setModalTitle(title);
    setModalMessage(message);
    setIsModalOpen(true); 
    
  };
  if (serverError) {
    return (
    <div className="font-oldStandard container mx-auto py-6 px-4 text-center">
    <h1 className="text-2xl font-bold mb-4">Jūsų krepšelis</h1>
    <div className="text-2xl text-gray-700 mt-4">{serverError}</div>
    <div className="flex justify-center mt-6">
    {!animationError && (
      <DotLottieReact
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
  if (!isAuthenticated) {
    return (
      <div className="font-oldStandard container mx-auto py-6 px-4 text-center">
        <h1 className="text-2xl font-bold mb-4">Jūsų krepšelis</h1>
        <p className="text-lg text-gray-700 mb-6">
          Atsiprašome, tačiau norėdami tęsti, turite prisijungti.
        </p>
        <button
          onClick={() => navigate("/prisijungti")}
          className="flex items-center justify-center mx-auto mb-4 underline-hover hover:animate-smooth-bounce border border-gray-300 rounded-md px-4 py-2 hover:bg-gray-100 transition-colors duration-300"
        >
          Prisijungti
        </button>
        <div className="flex justify-center mt-6">
        {!animationError && (
          <DotLottieReact
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
      <h1 className="text-2xl text-center font-bold mb-4">Jūsų krepšelis</h1>
        <div>
          <div className="text-2xl text-center text-gray-700 mb-12">Krepšelis tuščias</div>
          <div className="flex justify-center mt-6">
          {!animationError && (
            <DotLottieReact
            src="https://lottie.host/4d159cb5-e73a-4ebe-bd4f-344b7d46ce09/uZBlmM2Mba.lottie"
            loop
            autoplay
            style={{ width: "250px", height: "250px" }}
            onError={() => setAnimationError(true)} 
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
      <h1 className="text-2xl font-oldStandard text-center font-bold mb-4">Jūsų krepšelis</h1>
  
      {/* Product List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 font-oldStandard">
        {productDetails.map((product) => {
          const price = parseFloat(product.PRK_KAINA) || 0;
          const discount = parseFloat(product.PRK_NUOLAIDA) || 0;
          const discountedPrice = discount > 0 ? price - (price * discount) / 100 : price;
  
          return (
            <div
            key={product.PRK_ID}
            className="flex flex-col border p-4 hover:scale-105 transition-transform"
          >
            {/* Product Image */}
            <img
              src={`data:image/jpeg;base64,${product.IMG_DATA}`}
              alt={product.PRK_PAVADINIMAS}
             
              className="w-40 h-40 object-cover rounded mb-4 self-center overflow-hidden cursor-pointer hover:shadow-lg"
              onClick={() => productPage(product.PRK_PAVADINIMAS, product.PRK_ID)}
            />
          
            {/* Product Details */}
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-lg font-bold">{product.PRK_PAVADINIMAS}</h2>
              <p>
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
              </p>
            </div>
            {/* line */}
            <div className="border-t border-gray-300 mt-4"></div>
            {/* Quantity Controls */}
            <div className="flex justify-center items-center gap-2 mt-4">
              <button
                className="w-8 h-8 border rounded text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center"
                onClick={() => removeFromCart(product.PRK_ID)}
              >
                -
              </button>
              <span className="font-semibold">{cartItems[product.PRK_ID]}</span>
              <button
                className="w-8 h-8 border rounded text-green-500 hover:bg-green-500 hover:text-white flex items-center justify-center"
                onClick={() => addToCart(product.PRK_ID)}
              >
                +
              </button>
            </div>
          </div>
          
          

          );
        })}
      </div>
        
      {/* Additional Options */}
      <div className="mt-6">
        {/* Agreement Checkbox */}
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="agreeToPolicy"
            checked={agreeToPolicy}
            onChange={() => setAgreeToPolicy(!agreeToPolicy)}
            className="h-4 w-4 text-green-500 border-gray-300 rounded"
          />
          <label htmlFor="agreeToPolicy" className="text-gray-700">
            Sutinku su pardavimo sąlygomis
          </label>
        </div>
        {!agreeToPolicy && (
          <p className="text-red-500 text-sm mt-2">
            Turite sutikti su pardavimo sąlygomis.
          </p>
        )}
  
        {/* Delivery & Payment Options */}
        <div className="mt-4">
          <DeliveryOptions
            deliveryOption={deliveryOption}
            setDeliveryOption={(method) => {
              setDeliveryOption(method.Pavadinimas);
              setDeliveryFee(method.Kaina || 0);
              setDeliveryType(method.ArPristatymas ? "delivery" : "pickup");
            }}
          />
          <PaymentOptions
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            deliveryType={deliveryType}
          />
        </div>
      </div>
  
      {/* Client Info Form */}
      <ClientInfoForm
        clientInfo={clientInfo}
        setClientInfo={setClientInfo}
        isAuthenticated={isAuthenticated}
        deliveryOption={deliveryType}
      />
  
      {/* Total and Submit */}
      <div className="mt-6 text-right">
        <h2 className="text-xl font-bold">
          Viso:{" "}
          {new Intl.NumberFormat("lt-LT", {
            style: "currency",
            currency: "EUR",
          }).format(calculateTotal().toFixed(2))}
        </h2>
        {deliveryOption && (
          <p className="text-sm text-gray-600">
            Pristatymo mokestis:{" "}
            {deliveryFee > 0
              ? `${new Intl.NumberFormat("lt-LT", {
                  style: "currency",
                  currency: "EUR",
                }).format(deliveryFee)}`
              : "Nemokamai"}
          </p>
        )}
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        <button
          onClick={handleCreateOrder}
          className={`mt-4 px-4 py-2 ${
            agreeToPolicy
              ? "bg-green-500 hover:bg-green-600 text-white"
              : "bg-gray-400 text-gray-700 cursor-not-allowed"
          } rounded shadow transition`}
          disabled={!agreeToPolicy}
        >
          Sukurti užsakymą
        </button>
      </div>
  
      {/* Modal */}
      {isModalOpen && (
        <Modal
          title={modalTitle}
          message={modalMessage}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
  
}

export default CartPage;


