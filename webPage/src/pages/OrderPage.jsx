import React, { useEffect, useState } from "react";
import { useUser } from "../contexts/UserContext";
import OrderService from "../services/OrderService";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { useNavigate } from "react-router-dom";
import Modal from "../dialogBox/Modal";
const UserOrders = () => {
  const formatDate = (date) => date.toISOString().split("T")[0];

  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  const today = new Date();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const { isAuthenticated, logout, refreshTokenOrLogout } = useUser();
    const [animationError, setAnimationError] = useState(false);
    const [serverError, setServerError] = useState("");
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalTitle, setModalTitle] = useState("");
    const [modalMessage, setModalMessage] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [startDate, setStartDate] = useState(formatDate(twoWeeksAgo));
    const [endDate, setEndDate] = useState(formatDate(today));
    const [message, setMessage] = useState("");
    const [Sstatus, setSstatus] = useState("");
 
    
  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async (search = "", startDate = "", endDate = "", Sstatus = "") => {
    try {
      setLoading(true);
      const response = await OrderService.getUserOrders(search, startDate, endDate, Sstatus, refreshTokenOrLogout);
      if (Array.isArray(response) && response.length > 0) {
        setOrders(response);
        setMessage(""); 
      } else {
        setOrders([]); 
        setMessage("Nerasta užsakymų."); 
      }
    } catch (error) {
      console.error("Error fetching orders:", error.message);
      if (error.response?.status === 401) {
        setErrorMessage("Jūsų sesija baigėsi. Prašome prisijungti iš naujo.");
        await logout();
      } else {
        setServerError(error.message || "Nepavyko gauti užsakymų.");
      }
    } finally {
      setLoading(false);
    }
  };
  

  
  const openModal = (title, message) => {
    setModalTitle(title);
    setModalMessage(message);
    setIsModalOpen(true);
  };
  const handleSearch = () => {
    fetchOrders(searchQuery, startDate, endDate, Sstatus);
  };
//   if (serverError) {
//       return (
//       <div className="font-oldStandard container mx-auto py-6 px-4 text-center">
//       <h1 className="text-2xl font-bold mb-4">Jūsų užsakymai</h1>
//       <div className="text-2xl text-gray-700 mt-4">{serverError}</div>
//       <div className="flex justify-center mt-6">
//       {!animationError && (
//         <DotLottieReact
//               src="https://lottie.host/b3377209-bd26-40e1-a351-96be6897d735/EZ1CxFsRuY.lottie"
//               loop
//               autoplay
//               style={{ width: "250px", height: "250px" }}
//               onError={() => setAnimationError(true)} 
//             />)}
//         </div>
//           </div>
//       );
//     }

if (!isAuthenticated) {
    return (
      <div className="font-oldStandard container mx-auto py-6 px-4 text-center">
        <h1 className="text-2xl font-bold mb-4">Jūsų užsakymai</h1>
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
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-center mb-6">Jūsų užsakymai</h1>
    
        
            {/* Filter Section */}
            <div className="space-y-6">
              {/* Container 1: Date Filters and Status Dropdown */}
              <div className="flex flex-col gap-4 md:flex-row items-center bg-gray-30 p-4 rounded-lg shadow-sm">
                {/* Start Date */}
                <div className="flex items-center space-x-2">
                  <label htmlFor="startDate" className="text-sm text-gray-600 whitespace-nowrap">
                    Nuo:
                  </label>
                  <input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full md:w-auto"
                  />
                </div>

                {/* End Date */}
                <div className="flex items-center space-x-2">
                  <label htmlFor="endDate" className="text-sm text-gray-600 whitespace-nowrap">
                    Iki:
                  </label>
                  <input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full md:w-auto"
                  />
                </div>

                {/* Status Filter */}
                <div className="flex items-center space-x-2">
                  <label htmlFor="Sstatus" className="text-sm text-gray-600 whitespace-nowrap">
                    Statusas:
                  </label>
                  <select
                    id="Sstatus"
                    value={Sstatus}
                    onChange={(e) => setSstatus(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full md:w-auto"
                  >
                    <option value="">Visi</option>
                    <option value="Naujas">Naujas</option>
                    <option value="Apmokėtas">Apmokėtas</option>
                    <option value="Atšauktas">Atšauktas</option>
                  </select>
                </div>
              </div>

              {/* Container 2: Search Bar and Search Button */}
              <div className="flex flex-col gap-4 md:flex-row items-center bg-gray-30 p-4 rounded-lg shadow-sm">
                {/* Search Input */}
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ieškoti pagal užsakymo numerį..."
                  className="flex-grow border border-gray-300 rounded-md px-3 py-2 text-sm w-full md:w-auto"
                />

                {/* Search Button */}
                <button
                  onClick={handleSearch}
                  className="text-black px-3 py-2 flex items-center border border-gray-300 rounded-md bg-gray-30 hover:bg-gray-200 transition-transform transform hover:scale-110"
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


    
        {/* Feedback Message or Animation */}
        {message && (
          <div className="flex flex-col items-center justify-center mt-4">
            {!animationError && (
              <DotLottieReact
                src="https://lottie.host/ed0e834c-79aa-4c9a-a1b8-75370de7a13d/AhCHWsPHkN.lottie"
                loop
                autoplay
                style={{ width: "150px", height: "150px" }}
                onError={() => setAnimationError(true)}
              />
            )}
            <p className="text-center text-black mt-2">{message}</p>
          </div>
        )}
    
        {/* Orders List */}
        <div className="space-y-6">
          {orders.map((order) => (
            <div
              key={order.orderNumber}
              className="border rounded-lg shadow-md p-4 bg-white relative"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold">Užsakymo Nr: {order.orderNumber}</h2>
                  <p className="text-sm text-gray-600">
                    Data: {new Date(order.orderDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <span
                    className={`px-3 py-1 rounded text-sm ${
                      order.status === "Apmokėtas"
                        ? "bg-green-100 text-green-700"
                        : order.status === "Atšauktas"
                        ? "bg-red-100 text-red-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {order.status}
                  </span>
                </div>
              </div>
    
              <p className="mt-2 text-gray-700">Pristatymas: {order.deliveryName}</p>
              <p className="mt-2 text-gray-700">
                Bendra suma:{" "}
                {new Intl.NumberFormat("lt-LT", {
                  style: "currency",
                  currency: "EUR",
                }).format(order.totalPrice)}
              </p>
    
              <div className="mt-4">
                <h3 className="text-sm font-bold text-gray-700 mb-2">Užsakymo prekės:</h3>
                <ul className="list-disc list-inside">
                  {order.items.map((item) => (
                    <li key={item.productCode} className="text-sm text-gray-600">
                      {item.productName} ({item.quantity} x {item.price} €) ={" "}
                      {item.subtotal} €
                    </li>
                  ))}
                </ul>
              </div>
              {order.status === "Naujas" && (
              <div className="mt-4 flex justify-end">
                <button
                  className="flex items-center justify-center underline-hover hover:animate-smooth-bounce border border-gray-300 rounded-md px-4 py-2 bg-gray-50 hover:bg-gray-100 transition-colors duration-300"
                  onClick={async () => {
                    try {
                      const blob = await OrderService.generateInvoice(
                        order.orderNumber,
                        refreshTokenOrLogout
                      );
                      const url = window.URL.createObjectURL(blob);
                      const link = document.createElement("a");
                      link.href = url;
                      link.download = `Išankstinė_Sąskaita_${order.orderNumber}.pdf`;
                      link.click();
                      window.URL.revokeObjectURL(url);
                    } catch (error) {
                      openModal(
                        "Klaida",
                        error.message || "Nepavyko atsisiųsti išankstinės sąskaitos."
                      );
                      fetchOrders();
                    }
                  }}
                >
                  Gauti Išankstinę
                </button>
              </div>
            )}
            </div>
          ))}
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
    
  
  };
  
  export default UserOrders;
  

