import React, { useEffect} from "react";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LikedItemsProvider } from "./contexts/LikedItemsContext";
import { CartProvider } from "./contexts/CartContext"; 
import { StockDataProvider } from "./contexts/StockDataContext";
import NavBar from './components/NavBar';
import AppRoutes from './Routes';
import { ContactInfoProvider } from "./contexts/ContactContext";
import { LoggerProvider, useLogger } from "./contexts/LoggerContext";
import { useUser } from './contexts/UserContext';
import Layout from "./components/Layout";
import { SharedStateProvider } from "./contexts/SharedStateContext";
function App() {
  const { isAuthenticated } = useUser();
  const { initializeLogger, log, isInitialized } = useLogger();

  useEffect(() => {
    if ( !isInitialized) {
      initializeLogger();
    }
    if (isInitialized ) {
      log("INFO", "Apsilankė");
    }
  }, [isAuthenticated, isInitialized]);
  
  
  return (
            <SharedStateProvider>
            <LikedItemsProvider>
            <StockDataProvider>
            <CartProvider>
            <Layout>
            <ContactInfoProvider>
              <Router>
            <NavBar>
              <AppRoutes />
            </NavBar>
            </Router>
            </ContactInfoProvider>
            </Layout>
            </CartProvider>
            </StockDataProvider>
            </LikedItemsProvider>
            </SharedStateProvider>
          
  );
}
export default App;








