import React, { createContext, useContext, useState, useEffect } from "react";
import StockService from "../services/StockService";

const StockContext = createContext();

// Custom hook to use stock data
export const useStockData = () => useContext(StockContext);

export const StockDataProvider = ({ children }) => {
  const [stockData, setStockData] = useState({});
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState(null); // Track errors for debugging

  const fetchStockData = async () => {
    setIsFetching(true);
    setError(null); 
    try {
      const stock = await StockService.fetchStock();
      const stockMap = stock.reduce((map, item) => {
        map[item.PRK_ID] = item.PRK_KIEKIS;
        return map;
      }, {});
      setStockData(stockMap);
    } catch (error) {
      console.error("Error fetching stock:", error);
      setError(error.message || "Failed to fetch stock data");
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchStockData();
  }, []);

  return (
    <StockContext.Provider
      value={{
        stockData,
        fetchStockData,
        isFetching,
        error,
      }}
    >
      {children}
    </StockContext.Provider>
  );
};
