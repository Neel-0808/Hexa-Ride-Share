import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native"; // Importing useRoute to get params
import axios from "axios";
import tw from "twrnc"; // Tailwind CSS for styling

const NotificationScreen = () => {
  const route = useRoute(); // Access navigation parameters
  const navigation = useNavigation(); // Navigation object

  const [requestId, setRequestId] = useState(null); // For storing the requestId
  const [rideStatus, setRideStatus] = useState("Pending");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);

  // Fetch ride requests and find the selected request
  useEffect(() => {
    if (route.params && route.params.requestId) {
      setRequestId(route.params.requestId); // Set requestId from params
    } else {
      console.error("RequestId is undefined or missing");
      Alert.alert("Error", "RequestId is missing");
      return;
    }

    const fetchRideRequests = async () => {
      try {
        const response = await axios.get(
          "http://192.168.29.122:3000/api/ride-requests"
        );
        const request = response.data.find((req) => req.id === requestId);
        if (request) {
          setSelectedRequest(request);
        } else {
          Alert.alert("Error", "Ride request not found");
        }
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching ride requests:", error.message);
        Alert.alert(
          "Error",
          `Failed to fetch ride requests. Error: ${error.message}`
        );
        setIsLoading(false);
      }
    };

    if (requestId) {
      fetchRideRequests();
    }
  }, [requestId, route.params]);

  // Polling to check ride status
  useEffect(() => {
    if (!requestId) {
      return;
    }

    const fetchRideStatus = async () => {
      try {
        const response = await axios.get(
          `http://192.168.29.122:3000/api/ride-requests/status?requestId=${requestId}`
        );
        if (response.data && response.data.status) {
          setRideStatus(response.data.status);
        } else {
          console.error("Invalid response data:", response.data);
        }
      } catch (error) {
        console.error("Error fetching ride status:", error);
        Alert.alert(
          "Error",
          `Failed to fetch ride status. Error: ${error.message}`
        );
      }
    };

    // Initial fetch
    fetchRideStatus();

    // Set up polling to check status every 5 seconds
    const intervalId = setInterval(fetchRideStatus, 5000);

    // Clean up the interval on component unmount
    return () => clearInterval(intervalId);
  }, [requestId]);

  // Fetch coordinates based on the location name
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

  // Handle viewing the map based on pickup and destination locations
  const handleViewOnMap = async () => {
    try {
      if (
        !selectedRequest ||
        !selectedRequest.pickup_location ||
        !selectedRequest.destination_location
      ) {
        throw new Error("Pickup and destination locations are required.");
      }

      const pickupCoordinates = await getCoordinates(
        selectedRequest.pickup_location
      );
      const destinationCoordinates = await getCoordinates(
        selectedRequest.destination_location
      );

      console.log("Pickup Coordinates:", pickupCoordinates);
      console.log("Destination Coordinates:", destinationCoordinates);

      // Navigate to the RideMap screen with valid coordinates
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
          <TouchableOpacity
            style={tw`mt-6 bg-blue-500 rounded-full px-4 py-2`}
            onPress={handleViewOnMap}
          >
            <Text style={tw`text-white text-lg font-bold`}>View on Map</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

export default NotificationScreen;
