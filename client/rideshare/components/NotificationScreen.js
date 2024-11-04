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
  Image,
  Dimensions,
} from "react-native";
import tw from "twrnc";
import { useUser } from "./UserContext"; // Importing UserContext
import { LinearGradient } from "expo-linear-gradient"; // Use expo-linear-gradient
import * as Animatable from "react-native-animatable";
import Icon from "react-native-vector-icons/FontAwesome"; // For using a car icon
import LottieView from 'lottie-react-native'; // For Lottie animation

const { width: screenWidth } = Dimensions.get("window"); // Get screen width

const NotificationScreen = ({ route }) => {
  const { requestId } = route.params || {};
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

        const response = await axios.get(`http://192.168.215.164:4000/api/ride-requests`);
        const request = response.data.find((req) => req.id === requestId);

        if (!request) {
          throw new Error("Ride request not found");
        }

        setSelectedRequest(request);
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
          `http://192.168.215.164:4000/api/ride-requests/status?requestId=${requestId}`
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
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`,
        {
          headers: {
            'User-Agent': 'YourAppName/1.0 (your-email@example.com)', // Replace with your details
          },
        }
      );
      if (response.data.length > 0) {
        const { lat, lon } = response.data[0];
        return { latitude: parseFloat(lat), longitude: parseFloat(lon) };
      } else {
        throw new Error(`No results found for location: ${location}`);
      }
    } catch (error) {
      if (error.response && error.response.status === 403) {
        throw new Error('403 Forbidden: You have been blocked by the geocoding service. Try again later.');
      }
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
        driverNameContext: { driverNameContext: driverNameContext }, // Pass the driver's name from UserContext
        role: "driver", // Pass the role
      });
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-blue-100 justify-center items-center`}>
      {isLoading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <Animatable.View animation="fadeInUp" style={tw`flex-1 justify-center items-center`}>
          <Animatable.Text
            animation="bounceIn"
            iterationCount="infinite"
            style={tw`text-3xl font-bold mb-4 text-gray-800 shadow-md rounded-lg p-4 bg-white`}
          >
            Your ride status: {rideStatus}
          </Animatable.Text>

          {rideStatus === "Pending" ? (
            <Animatable.Text
              animation="fadeIn"
              delay={500}
              style={tw`text-lg text-gray-500`}
            >
              Waiting for driver to accept your ride...
            </Animatable.Text>
          ) : (
            <Animatable.Text animation="fadeIn" delay={500} style={tw`text-lg text-green-500`}>
              Driver {driverNameContext} has accepted the ride!
            </Animatable.Text>
          )}

          {/* Car Animation using Lottie */}
          <LottieView
            source={require('../assets/car_animation.json')} // Replace with your Lottie JSON path
            autoPlay
            loop
            style={{ width:300, height: 300, marginTop: 20 }}
          />

          {selectedRequest && selectedRequest.pickup_location && selectedRequest.destination_location ? (
            <TouchableOpacity onPress={handleViewOnMap}>
              <Animatable.View animation="pulse" iterationCount="infinite" style={tw`mt-6`}>
                <LinearGradient
                  colors={["#4c669f", "#3b5998", "#192f6a"]}
                  style={tw`rounded-full px-6 py-3`}
                >
                  <Text style={tw`text-white text-lg font-bold text-center`}>View on Map</Text>
                </LinearGradient>
              </Animatable.View>
            </TouchableOpacity>
          ) : (
            <Text style={tw`text-red-500 text-lg mt-4`}>
              Pickup or destination location not available.
            </Text>
          )}
        </Animatable.View>
      )}
    </SafeAreaView>
  );
};

export default NotificationScreen;
