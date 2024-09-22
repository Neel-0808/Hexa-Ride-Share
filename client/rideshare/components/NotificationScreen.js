import React, { useEffect, useState } from "react";
import { View, Text, SafeAreaView, ActivityIndicator, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import tw from "twrnc"; // Tailwind CSS for styling
import * as Notifications from 'expo-notifications';

const NotificationScreen = ({ route }) => {
  const { requestId } = route.params;
  const [rideStatus, setRideStatus] = useState("Pending"); // Default status is 'Pending'
  const [isLoading, setIsLoading] = useState(true);
  const navigation = useNavigation();

  // Polling to check ride status
  useEffect(() => {
    if (!requestId) {
      console.error("RequestId is undefined or null, cannot fetch ride status.");
      return;
    }
  
    const intervalId = setInterval(() => {
      // Make a GET request to check the ride request status
      console.log('Fetching ride status for requestId:', requestId);
      axios
        .get(`http://192.168.35.164:3000/api/ride-requests/status?requestId=${requestId}`)
        .then((response) => {
          setRideStatus(response.data.status); // Status from the backend
          setIsLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching ride status:", error);
        });
    }, 5000); // Check status every 5 seconds
  
    // Clean up the interval on component unmount
    return () => clearInterval(intervalId);
  }, [requestId]); // Dependency array to trigger effect when requestId changes
  

  return (
    <SafeAreaView style={tw`flex-1 bg-white justify-center items-center`}>
      {isLoading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <View>
          <Text style={tw`text-2xl font-bold mb-4`}>
            Your ride status: {rideStatus}
          </Text>
          {rideStatus === "Pending" ? (
            <Text style={tw`text-lg text-gray-500`}>
              Waiting for driver to accept your ride...
            </Text>
          ) : (
            <Text style={tw`text-lg text-green-500`}>
              Driver has accepted the ride!
            </Text>
          )}
        </View>
      )}
    </SafeAreaView>
  );
};

export default NotificationScreen;
