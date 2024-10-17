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
import tw from "twrnc"; 
import { useUser } from "./UserContext"; // Importing UserContext

const NotificationScreen = ({ route }) => {
  const { requestId } = route.params || {};
  console.log("Route Params:", route.params);

  const { driverNameContext } = useUser(); // Accessing driverName from UserContext
  const [rideStatus, setRideStatus] = useState("Pending");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigation = useNavigation();

  // Fetch ride requests and find the selected request
  useEffect(() => {
    const fetchRideRequests = async () => {
      try {
        if (!requestId) {
          throw new Error("RequestId is undefined or null");
        }

        const response = await axios.get(`http://192.168.53.164:3000/api/ride-requests`);
        const request = response.data.find((req) => req.id === requestId);

        if (!request) {
          throw new Error("Ride request not found");
        }

        setSelectedRequest(request);
        
        // Set driver name if available in request
      } catch (error) {
        console.error("Error fetching ride requests:", error.message);
        Alert.alert("Error", `Failed to fetch ride requests. Error: ${error.message}`);
      }
    };

    fetchRideRequests();
  }, [requestId]);

  // Polling to check ride status
  useEffect(() => {
    const fetchRideStatus = async () => {
      try {
        if (!requestId) {
          throw new Error("RequestId is undefined or null");
        }

        const response = await axios.get(
          `http://192.168.53.164:3000/api/ride-requests/status?requestId=${requestId}`
        );

        if (response.data && response.data.status) {
          setRideStatus(response.data.status);
        } else {
          throw new Error("Invalid response data");
        }
      } catch (error) {
        console.error("Error fetching ride status:", error);
        Alert.alert("Error", `Failed to fetch ride status. Error: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRideStatus();

    const intervalId = setInterval(fetchRideStatus, 5000);

    return () => clearInterval(intervalId);
  }, [requestId]);

  const getCoordinates = async (location) => {
    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`
      );

      if (response.data.length > 0) {
        const { lat, lon } = response.data[0];
        return { latitude: parseFloat(lat), longitude: parseFloat(lon) };
      } else {
        throw new Error(`No results found for location: ${location}`);
      }
    } catch (error) {
      throw new Error(`Failed to fetch coordinates for ${location}: ${error.message}`);
    }
  };

  const handleViewOnMap = async () => {
    try {
      if (!selectedRequest || !selectedRequest.pickup_location || !selectedRequest.destination_location) {
        throw new Error("Pickup or destination location is not available.");
      }
  
      // Fetch pickup and destination coordinates
      const pickupCoordinates = await getCoordinates(selectedRequest.pickup_location);
      const destinationCoordinates = await getCoordinates(selectedRequest.destination_location);
  
      console.log("Pickup Coordinates:", pickupCoordinates);
      console.log("Destination Coordinates:", destinationCoordinates);
  
      // Log the driver name before navigating
      console.log("Navigating to GoogleMapScreen with driver name:", driverNameContext);
  
      // Navigate to GoogleMapScreen with driver name, pickup and destination locations
      navigation.navigate("GoogleMapScreen", {
        pickupLocation: {
          latitude: pickupCoordinates.latitude,
          longitude: pickupCoordinates.longitude,
          title: selectedRequest.pickup_location, // Pass pickup title
        },
        destinationLocation: {
          latitude: destinationCoordinates.latitude,
          longitude: destinationCoordinates.longitude,
          title: selectedRequest.destination_location, // Pass destination title
        },
        driverNameContext: {driverNameContext:driverNameContext}, // Pass the driver's name from UserContext
        role: "driver", // Pass the role
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
              Driver {driverNameContext} has accepted the ride! {/* Display driver name */}
            </Text>
          )}

          {selectedRequest && selectedRequest.pickup_location && selectedRequest.destination_location ? (
            <TouchableOpacity
              style={tw`mt-6 bg-blue-500 rounded-full px-4 py-2`}
              onPress={handleViewOnMap}
            >
              <Text style={tw`text-white text-lg font-bold`}>View on Map</Text>
            </TouchableOpacity>
          ) : (
            <Text style={tw`text-red-500 text-lg mt-4`}>
              Pickup or destination location not available.
            </Text>
          )}
        </View>
      )}
    </SafeAreaView>
  );
};

export default NotificationScreen;
