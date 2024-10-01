import React, { createContext, useContext, useState } from 'react';

// Create the UserContext
const UserContext = createContext();

// UserProvider component to wrap around the app and provide the context values
export const UserProvider = ({ children }) => {
  const [userId, setUserId] = useState(null);
  const [driverId, setDriverId] = useState(null);
  const [driverNameContext, setDriverNameContext] = useState("");
  const [riderId, setRiderId] = useState(null);
  const [riderName, setRiderName] = useState("");
  const [upiId, setUpiId] = useState(""); // Added UPI ID state

  return (
    <UserContext.Provider
      value={{
        userId, setUserId,
        driverId, setDriverId,
        driverNameContext, setDriverNameContext,
        riderId, setRiderId,
        riderName, setRiderName,
        upiId, setUpiId, // Added UPI ID to context
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

// Custom hook to use the UserContext
export const useUser = () => {
  return useContext(UserContext);
};
