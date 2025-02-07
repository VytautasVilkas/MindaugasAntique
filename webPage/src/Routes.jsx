// src/Routes.js
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import ProductCatalog from './pages/ProductCatalog';
import Kontaktai from './pages/Contacts';
import NotFound from './pages/NotFound';
import Product from './pages/Product';
import LoginPage from './pages/LogIn';
import RegisterPage from './pages/RegisterPage';
import PasswordRecoveryPage from './pages/PasswordRecoveryPage';
import CartPage from './pages/CartPage';
import ContactPage from './pages/ContactPage'
import LikedPage from './pages/LikedItems';
import VerifyEmailPage from "./pages/VerifyEmailPage";
import ResendVerifyEmailPage from "./pages/ResendVerificationPage";
import ThankYou from './pages/ThankYou';
import OrderPage from './pages/OrderPage';
import PasswordResetPage from './pages/PasswordResetPage';
function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/slaptazodzio-pakeitimas" element={<PasswordResetPage />} />
      <Route path="/prekiu-katalogas" element={<ProductCatalog />} />
      <Route path="/prekiu-katalogas/:name/:id" element={<Product />} />
      <Route path="/kontaktai" element={<Kontaktai />} />
      <Route path="/susisieksime-su-jumis" element={<ThankYou />} />
      <Route path="/prisijungti" element={<LoginPage />} />
      <Route path="/registracija" element={<RegisterPage  />} />
      <Route path="/krepselis" element={<CartPage  />} />
      <Route path="/uzsakymai" element={<OrderPage   />} />
      <Route path="/susisiekite" element={<ContactPage  />} />
      <Route path="/megstamiausios" element={<LikedPage  />} />
      <Route path="/pasto-patvirtinimas" element={<VerifyEmailPage />} />
      <Route path="/pakartotinis-patvirtinimas" element={<ResendVerifyEmailPage  />} />
      <Route path="/slaptazodzio-atkurimas" element={<PasswordRecoveryPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default AppRoutes;
