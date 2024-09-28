import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import tw from "twrnc"; // Tailwind CSS for styling

const NotificationScreen = ({ route }) => {
  // Destructure requestId and selectedRequest from route params
  const { requestId, selectedRequest } = route.params || {}; // Fallback to an empty object
  console.log("Route Params:", route.params); // Log route params for debugging
  console.log("Selected Request:", selectedRequest); // Log selectedRequest

  const [rideStatus, setRideStatus] = useState("Pending"); // Default status
  const [isLoading, setIsLoading] = useState(true);
  const navigation = useNavigation();

  // Polling to check ride status
  useEffect(() => {
    const fetchRideStatus = async () => {
      try {
        if (!requestId) {
          throw new Error("RequestId is undefined or null");
        }

        const response = await axios.get(
          `http://192.168.35.164:3000/api/ride-requests/status?requestId=${requestId}`
        );

        if (response.data && response.data.status) {
          setRideStatus(response.data.status); // Update status from backend
        } else {
          throw new Error("Invalid response data");
        }
      } catch (error) {
        console.error("Error fetching ride status:", error);
        Alert.alert(
          "Error",
          `Failed to fetch ride status. Error: ${error.message}`
        );
      } finally {
        setIsLoading(false); // Ensure loading state is updated
      }
    };

    // Initial fetch
    fetchRideStatus();

    // Set up polling to check status every 5 seconds
    const intervalId = setInterval(fetchRideStatus, 5000);

    // Clean up the interval on component unmount
    return () => clearInterval(intervalId);
  }, [requestId]); // Dependency array to trigger effect when requestId changes

  const getCoordinates = async (location) => {
    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          location
        )}&format=json&limit=1`
      );

      if (response.data.length > 0) {
        const { lat, lon } = response.data[0];
        return { latitude: parseFloat(lat), longitude: parseFloat(lon) };
      } else {
        throw new Error(`No results found for location: ${location}`);
      }
    } catch (error) {
      throw new Error(
        `Failed to fetch coordinates for ${location}: ${error.message}`
      );
    }
  };

  const handleViewOnMap = async () => {
    try {
      // Ensure selectedRequest is valid
      if (!selectedRequest || !selectedRequest.pickup_location || !selectedRequest.destination_location) {
        throw new Error("Pickup or destination location is not available.");
      }

      const pickupCoordinates = await getCoordinates(
        selectedRequest.pickup_location
      );
      const destinationCoordinates = await getCoordinates(
        selectedRequest.destination_location
      );

      console.log("Pickup Coordinates:", pickupCoordinates);
      console.log("Destination Coordinates:", destinationCoordinates);

      // Navigate to the GoogleMapScreen with valid coordinates
      navigation.navigate("GoogleMapScreen", {
        pickupLocation: pickupCoordinates,
        destinationLocation: destinationCoordinates,
      });
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

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

          {/* Button to view on map */}
          {selectedRequest && selectedRequest.pickup_location && selectedRequest.destination_location && (
            <TouchableOpacity
              style={tw`mt-6 bg-blue-500 rounded-full px-4 py-2`}
              onPress={handleViewOnMap}
            >
              <Text style={tw`text-white text-lg font-bold`}>View on Map</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </SafeAreaView>
  );
};

export default NotificationScreen;
