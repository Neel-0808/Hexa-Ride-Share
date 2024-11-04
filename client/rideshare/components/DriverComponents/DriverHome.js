import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  Modal,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import tw from "twrnc"; // For Tailwind styles
import { useNavigation } from "@react-navigation/native";
import { useUser } from '../UserContext'; 



const DriverHome = () => {
  const [rideRequests, setRideRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const { userId } = useUser();
  const [driverName, setDriverName] = useState(null);
  const navigation = useNavigation();

  // Fetch all ride requests when the app loads
  useEffect(() => {
    const fetchAllRideRequests = async () => {
      try {
        const response = await axios.get(
          "http://192.168.215.164:4000/api/ride-requests"
        );
         // Debugging API response
        setRideRequests(response.data);
      } catch (error) {
        console.log("Error fetching ride requests:", error.message); // Debugging error
        Alert.alert(
          "Error",
          `Failed to fetch ride requests. Error: ${error.message}`
        );
      }
    };

    fetchAllRideRequests();
  }, []);

  useEffect(() => {
    const fetchDriverName = async () => {
      try {
        const response = await axios.get(
          `http://192.168.215.164:4000/api/users/${userId}`
        );
        // Store the driver name in state
        setDriverName(response.data.username);
        console.log("Fetched Driver Name:", response.data.username); // Debugging
      } catch (error) {
        console.log("Error fetching driver name:", error.message);
        Alert.alert(
          "Error",
          `Failed to fetch driver name. Error: ${error.message}`
        );
      }
    };

    if (userId) {
      fetchDriverName();
    }
  }, [userId]);

  const handlePostRide = () => {
    navigation.navigate("PostRideScreen"); // Navigate to the "Post Ride" screen
  };

  const handleRequestPress = (request) => {
    console.log("Ride Request selected:", request); // Debugging to check the selected request
    setSelectedRequest(request);
    setModalVisible(true);
  };

  const handleAccept = async () => {
    try {
      // Check if a request is selected
      if (!selectedRequest) {
        Alert.alert("Error", "No request selected");
        return;
      }
  
      // Log the selected request details for debugging
      console.log("Selected Request for Accepting Ride:", selectedRequest);
      console.log("Request ID sent to backend:", selectedRequest.id);
  
      // Geocode the pickup and destination locations using OpenStreetMap Nominatim
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
      
  
      // Fetch pickup and destination coordinates
      const pickupCoordinates = await getCoordinates(selectedRequest.pickup_location);
      const destinationCoordinates = await getCoordinates(selectedRequest.destination_location);
  
      console.log("Pickup Coordinates:", pickupCoordinates);
      console.log("Destination Coordinates:", destinationCoordinates);
  
      // Log driver name for debugging
      console.log("Driver Name Context:", driverName);
  
      // Construct the request URL
      const requestUrl = `http://192.168.215.164:4000/api/ride-requests/${selectedRequest.id}/accept/${encodeURIComponent(driverName)}`;
  
      // Proceed with accepting the request
      const response = await axios.post(requestUrl, {
        driver_name: driverName, // Driver's ID
        request_id: selectedRequest.id,
      });
  
      // Log the server response
      
  
      // Check for success
      if (response.status === 200) {
        const { progressId } = response.data; // Extract the progress ID from the response
        Alert.alert("Success", "Ride request accepted.");
  
        // Navigate to the RideMap screen with valid coordinates and titles, including progress ID
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
          driver_Name: driverName,
          riderDetail: { riderDetail: selectedRequest.rider_name },
          role: "rider", // Pass rider details if available
          progressId, // Pass the progress ID to the GoogleMapScreen
        });
      } else {
        console.error("Unexpected response status:", response.status);
        Alert.alert("Error", "Failed to accept the ride request.");
      }
    } catch (error) {
      console.error("Error in handleAccept:", error);
      Alert.alert("Error", `Failed to accept ride request. ${error.message}`);
    }
  };
  
  
  
  
  
  
  const handleReject = async () => {
    console.log("Ride request rejected for:", selectedRequest); // Debugging rejected request
    Alert.alert("Rejected", "You have rejected the ride request.");
    setModalVisible(false);
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-white`}>
      {/* Top Navigation Bar */}
      <View style={tw`bg-blue-600 p-4 flex-row justify-between items-center`}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={tw`text-white text-xl font-bold`}></Text>
        <TouchableOpacity onPress={() => navigation.navigate("Profile")}>
          <Ionicons name="person-circle-outline" size={40} color="white" />
        </TouchableOpacity>
      </View>

      {/* Post Your Ride Button */}
      <View style={tw`flex-row justify-center mt-4`}>
        <TouchableOpacity
          style={tw`bg-white flex-row p-4 rounded-full shadow-lg w-10/12 justify-between items-center`}
          onPress={handlePostRide}
        >
          <Text style={tw`text-lg font-bold`}>Post Your Ride...</Text>
          <Ionicons name="arrow-forward-circle" size={32} color="black" />
        </TouchableOpacity>
      </View>

      {/* Requested Rides Section */}
      <ScrollView style={tw`p-5`}>
        <Text style={tw`text-lg font-bold mb-2`}>Requested Rides</Text>
        {rideRequests.length > 0 ? (
          rideRequests.map((request) => (
            <TouchableOpacity
              key={request.id}
              style={tw`bg-white p-4 mb-3 rounded-lg shadow-md`}
              onPress={() => handleRequestPress(request)}
            >
              <Text style={tw`text-base font-bold`}>
                Rider Name: {request.rider_name || "N/A"}
              </Text>
              <Text style={tw`text-base`}>Gender: {request.gender || "N/A"}</Text>
              <Text style={tw`text-base`}>
                Pickup Location: {request.pickup_location || "N/A"}
              </Text>
              <Text style={tw`text-base`}>
                Destination Location: {request.destination_location || "N/A"}
              </Text>
              <Text style={tw`text-base`}>Contact: {request.contact || "N/A"}</Text>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={tw`text-center text-gray-500`}>
            No ride requests available
          </Text>
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={tw`flex-row justify-around bg-gray-100 p-3`}>
        <TouchableOpacity onPress={() => navigation.navigate("Home")}>
          <Ionicons name="home" size={32} color="gray" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate("Profile")}>
          <Ionicons name="person-circle-outline" size={32} color="gray" />
        </TouchableOpacity>
      </View>

      {/* Modal for Accept/Reject */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={tw`text-lg font-bold mb-4`}>
              Ride Request from {selectedRequest?.rider_name}
            </Text>
            <Text style={tw`mb-2`}>
              Pickup: {selectedRequest?.pickup_location}
            </Text>
            <Text style={tw`mb-4`}>
              Destination: {selectedRequest?.destination_location}
            </Text>
            <View style={tw`flex-row justify-between`}>
              <TouchableOpacity
                style={styles.buttonAccept}
                onPress={handleAccept}
              >
                <Text style={tw`text-white font-bold`}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.buttonReject}
                onPress={handleReject}
              >
                <Text style={tw`text-white font-bold`}>Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonAccept: {
    backgroundColor: "green",
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginRight: 10,
    alignItems: "center",
  },
  buttonReject: {
    backgroundColor: "red",
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginLeft: 10,
    alignItems: "center",
  },
});

export default DriverHome;
