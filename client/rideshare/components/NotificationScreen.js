import React, { useEffect, useState } from "react";
import { View, Text, SafeAreaView, ActivityIndicator, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import tw from "twrnc"; // Tailwind CSS for styling

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

    const fetchRideStatus = async () => {
      try {
        const response = await axios.get(`http://192.168.35.164:3000/api/ride-requests/status?requestId=${requestId}`);
        if (response.data && response.data.status) {
          setRideStatus(response.data.status); // Update status from the backend
          setIsLoading(false);
        } else {
          console.error("Invalid response data:", response.data);
        }
      } catch (error) {
        console.error("Error fetching ride status:", error);
        Alert.alert("Error", `Failed to fetch ride status. Error: ${error.message}`);
      }
    };

    // Initial fetch
    fetchRideStatus();

    // Set up polling to check status every 5 seconds
    const intervalId = setInterval(fetchRideStatus, 5000);

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
