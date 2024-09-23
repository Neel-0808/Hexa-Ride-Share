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

const DriverHome = () => {
  const [rideRequests, setRideRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const navigation = useNavigation();

  // Fetch all ride requests when the app loads
  useEffect(() => {
    const fetchAllRideRequests = async () => {
      try {
        const response = await axios.get(
          "http://192.168.35.164:3000/api/ride-requests"
        );
        console.log("Ride Requests Data:", response.data); // Debugging API response
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

  const handlePostRide = () => {
    navigation.navigate("PostRideScreen"); // Navigate to the "Post Ride" screen
  };

  const handleRequestPress = (request) => {
    console.log('Ride Request selected:', request); // Debugging to check the selected request
    setSelectedRequest(request);
    setModalVisible(true);
  };

  const handleAccept = async () => {
    try {
      if (!selectedRequest) {
        Alert.alert("Error", "No request selected");
        return;
      }
  
      const response = await axios.post(
        `http://192.168.35.164:3000/api/ride-requests/${selectedRequest.id}/accept`,
        {
          driver_id: "driver123", // Driver's ID
          request_id: selectedRequest.id,
        }
      );
  
      if (response.status === 200) {
        Alert.alert("Success", "Ride request accepted.");
        
        // Navigate to the RideMap screen with the ride details
        navigation.navigate("GoogleMapScreen", {
          pickupLocation: {
            latitude: selectedRequest.pickup_latitude,
            longitude: selectedRequest.pickup_longitude,
          },
          destinationLocation: {
            latitude: selectedRequest.destination_latitude,
            longitude: selectedRequest.destination_longitude,
          },
        });
      } else {
        Alert.alert("Error", "Failed to accept the ride request.");
      }
    } catch (error) {
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
        <Text style={tw`text-white text-xl font-bold`}>Buddy</Text>
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
