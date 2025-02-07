import React, { useState, useEffect, useRef,useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import { useLikedItems } from "../contexts/LikedItemsContext";
import { useCart } from "../contexts/CartContext";
import { useUser } from "../contexts/UserContext";
import { LayoutContext } from "../ResponsiveWrapper";
import Footer from "./Footer";
import CartDropdown from "./CartDropdown";
import LikedDropDown from "./FavoritesDropdown";

function NavBar({ children }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { likedItems } = useLikedItems();
  const { cartItems } = useCart();
  const { isAuthenticated, logout } = useUser();
  const cartCount = Object.values(cartItems).reduce((sum, count) => sum + count, 0);
  const likeCount = Object.values(likedItems).reduce((sum, count) => sum + count, 0);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  const cartRef = useRef(null);
  const favoritesRef = useRef(null);
  const userDropdownRef = useRef(null);
  const navigate = useNavigate();
  const layout = useContext(LayoutContext);


  const handleLoginClick = () => {
    navigate("/prisijungti");
  };
  const handleCartClick = () => {
    if (layout === "mobile" || layout === "tablet") {
      navigate("/krepselis"); // Redirect to cart page if on mobile or tablet
    } else {
      setIsCartOpen((prevState) => !prevState);
      setIsFavoritesOpen(false);
      setIsUserDropdownOpen(false);
    }
  };

  const handleLikedClick = () => {
    if (layout === "mobile" || layout === "tablet") {
      navigate("/megstamiausios"); // Redirect to favorites page if on mobile or tablet
    } else {
      setIsFavoritesOpen((prevState) => !prevState);
      setIsCartOpen(false);
      setIsUserDropdownOpen(false);
    }
  };


  const toggleUserDropdown = () => {
    setIsUserDropdownOpen((prev) => !prev);
    setIsCartOpen(false);
    setIsFavoritesOpen(false);
  };

  // Close dropdowns if clicked outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (cartRef.current && !cartRef.current.contains(e.target)) {
        setIsCartOpen(false);
      }
      if (favoritesRef.current && !favoritesRef.current.contains(e.target)) {
        setIsFavoritesOpen(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target)) {
        setIsUserDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  return (
    <div className="">
      {/* Header */}
      <header className="w-full p-4 flex items-center justify-between bg-[#ffffff] shadow-md py-0 px-6 shadow-md relative z-10"
      >
        {/* Logo */}
        <div className="relative group ">
          <div className="h-16 w-16 md:h-24 md:w-24 lg:h-32 lg:w-32 rounded-full bg-white flex items-center justify-center overflow-hidden shadow-lg transform transition-transform duration-300 group-hover:scale-110">
            <img src={logo} alt="logo" className="h-20 w-20 md:h-28 md:w-28 lg:h-36 lg:w-36 object-cover" />
          </div>
        </div>
        {/* Navigation */}
        <nav className="hidden font-oldStandard sm:flex gap-5">
          <Link to="/" className="underline-hover hover:animate-smooth-bounce">
            Pradžia
          </Link>
          <Link to="/prekiu-katalogas" className="underline-hover hover:animate-smooth-bounce">
            Katalogas
          </Link>
          <Link to="/kontaktai" className="underline-hover hover:animate-smooth-bounce">
            Kontaktai
          </Link>
        </nav>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="sm:hidden text-gray-800 focus:outline-none z-20"
        >
          <div className="relative w-6 h-6">
            {/* Top Line */}
            <span
              className={`absolute block w-6 h-[2px] bg-gray-800 transform transition-all duration-300 ease-in-out ${
                isMenuOpen ? "rotate-45 top-2.5" : "top-0"
              }`}
            ></span>
            {/* Middle Line */}
            <span
              className={`absolute block w-6 h-[2px] bg-gray-800 transition-opacity duration-300 ease-in-out ${
                isMenuOpen ? "opacity-0" : "top-2.5"
              }`}
            ></span>
            {/* Bottom Line */}
            <span
              className={`absolute block w-6 h-[2px] bg-gray-800 transform transition-all duration-300 ease-in-out ${
                isMenuOpen ? "-rotate-45 top-2.5" : "top-5"
              }`}
            ></span>
          </div>
        </button>

        {/* Icons */}
        <div className="flex gap-4">
          {/* Cart */}
          <div className="relative" ref={cartRef}>
            <button className="relative text-gray-800 hover:scale-110" onClick={handleCartClick}>
              <img
                width="30"
                height="30"
                src="https://img.icons8.com/fluency-systems-regular/96/shopping-bag--v1.png"
                alt="shopping-bag"
              />
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-semibold w-5 h-5 flex items-center justify-center rounded-full">
                {cartCount}
              </span>
            </button>
            {isCartOpen && layout !== "mobile" && layout !== "tablet" && <CartDropdown />}
          </div>

          <div className="relative" ref={favoritesRef}>
            <button className="relative text-gray-800 hover:scale-110" onClick={handleLikedClick}>
              <img width="30" height="30" src="https://img.icons8.com/metro/52/like.png" alt="like" />
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-semibold w-5 h-5 flex items-center justify-center rounded-full">
                {likeCount}
              </span>
            </button>
            {isFavoritesOpen && layout !== "mobile" && layout !== "tablet" && <LikedDropDown />}
          </div>

          {/* User Dropdown */}
          <div className="relative" ref={userDropdownRef}>
          <button
              className="relative hover:scale-110"
              onClick={toggleUserDropdown}
            >
              <img
                src={`https://img.icons8.com/windows/96/${
                  isAuthenticated ? "26e07f" : "000000"
                }/user.png`}
                alt="user"
                className="w-8 h-8"
              />
            </button>

            {isUserDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white shadow-lg rounded-lg z-50 p-3">
                  {isAuthenticated ? (
                    <ul className="space-y-2">
                      {/* Orders Button */}
                      <li className="flex items-center border-b border-gray-200 pb-2 last:border-none">
                        <button
                          onClick={() => navigate("/uzsakymai")}
                          className="flex items-center justify-between font-oldStandard underline-hover hover:animate-smooth-bounce border border-gray-300 rounded-md w-full px-3 py-2 text-sm hover:bg-gray-100 transition-colors duration-300"
                        >
                          <div className="flex items-center">
                          <img width="30" height="30" src="https://img.icons8.com/windows/96/shopping-cart.png" alt="shopping-cart"/>
                            Užsakymai
                          </div>
                        </button>
                      </li>

                      {/* Logout Button */}
                      <li className="flex items-center border-b border-gray-200 pb-2 last:border-none">
                        <button
                          onClick={() => logout("manual")}
                          className="flex items-center justify-between font-oldStandard underline-hover hover:animate-smooth-bounce border border-gray-300 rounded-md w-full px-3 py-2 text-sm hover:bg-gray-100 transition-colors duration-300"
                        >
                          <div className="flex items-center">
                          <img width="30" height="30" src="https://img.icons8.com/fluency-systems-filled/96/exit.png" alt="exit"/>
                            Atsijungti
                          </div>
                        </button>
                      </li>
                    </ul>
                  ) : (
                    <ul className="space-y-2">
                      {/* Login Button */}
                      <li className="flex items-center border-b border-gray-200 pb-2 last:border-none">
                        <button
                          onClick={handleLoginClick}
                          className="flex items-center justify-between font-oldStandard underline-hover hover:animate-smooth-bounce border border-gray-300 rounded-md w-full px-3 py-2 text-sm hover:bg-gray-100 transition-colors duration-300"
                        >
                          <div className="flex items-center">
                          <img width="30" height="30" src="https://img.icons8.com/windows/96/enter-2.png" alt="enter-2"/>
                            Prisijungti
                          </div>
                        </button>
                      </li>
                    </ul>
                  )}
                </div>
              )}


          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <nav className="sm:hidden fixed top-16 right-4 w-48 bg-white shadow-lg rounded-lg p-4 z-30">
          <ul className="flex flex-col items-start">
            <li className="text-gray-800 text-sm mb-3 underline-hover hover:animate-smooth-bounce">
              <Link to="/" onClick={() => setIsMenuOpen(false)}>Pradžia</Link>
            </li>
            <li className="text-gray-800 text-sm mb-3 underline-hover hover:animate-smooth-bounce">
              <Link to="/prekiu-katalogas" onClick={() => setIsMenuOpen(false)}>Katalogas</Link>
            </li>
            <li className="text-gray-800 text-sm underline-hover hover:animate-smooth-bounce">
              <Link to="/kontaktai" onClick={() => setIsMenuOpen(false)}>Kontaktai</Link>
            </li>
          </ul>
        </nav>
      )}

      {/* Main Content */}
      <main className="flex-grow">{children}</main>
      <Footer />
    </div>
  );
}

export default NavBar;

