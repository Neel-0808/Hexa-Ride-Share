import React, { useState, useEffect } from "react";
import { View, Text, ActivityIndicator, StyleSheet, Alert, TouchableOpacity, Dimensions, Modal } from "react-native";
import * as Location from "expo-location";
import MapView, { Marker, Polyline } from "react-native-maps";
import { useRoute, useNavigation } from "@react-navigation/native";
import Icon from 'react-native-vector-icons/FontAwesome';
import PaymentScreen from "./DriverPay";
import { useUser } from '../UserContext'; 

const screenWidth = Dimensions.get('window').width;

// Helper function to calculate distance using the Haversine formula
const calculateDistance = (coord1, coord2) => {
  const toRad = (value) => (value * Math.PI) / 180;

  const lat1 = coord1.latitude;
  const lon1 = coord1.longitude;
  const lat2 = coord2.latitude;
  const lon2 = coord2.longitude;

  const R = 6371; // Radius of the Earth in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in kilometers

  return distance.toFixed(2); // Returns distance rounded to two decimal places
};

// Helper function to estimate time based on distance and average speed
const calculateTime = (distance) => {
  const averageSpeed = 40; // Average speed in km/h (can be adjusted)
  const time = distance / averageSpeed; // Time in hours
  const minutes = time * 60;
  return Math.round(minutes); // Return time in minutes
};

// Helper function to calculate fare based on distance
const calculateFare = (distance) => {
  const baseFare = 50; // Base fare
  const ratePerKm = 10; // Rate per kilometer
  const fare = baseFare + distance * ratePerKm;
  return fare.toFixed(2); // Return fare rounded to two decimal places
};

// Function to simulate a curved polyline for demonstration
const simulateRouteCoordinates = (pickup, destination) => {
  const midPoint = {
    latitude: (pickup.latitude + destination.latitude) / 2 + 0.005, // Slightly above midpoint
    longitude: (pickup.longitude + destination.longitude) / 2 + 0.005, // Slightly to the right
  };

  return [
    pickup,
    { latitude: midPoint.latitude + 0.01, longitude: midPoint.longitude - 0.01 },
    midPoint,
    { latitude: midPoint.latitude - 0.01, longitude: midPoint.longitude + 0.01 },
    destination
  ];
};

const RideMap = () => {
  const navigation = useNavigation(); // Get the navigation object
  const route = useRoute();
  const { pickupLocation, destinationLocation, role, driverNameContext, riderDetail,driver_Name,progressId } = route.params || {}; // Get role and details

  const [driverLocation, setDriverLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [distance, setDistance] = useState(null);
  const [time, setTime] = useState(null);
  const [fare, setFare] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const { userId } = useUser();

  useEffect(() => {
    const fetchDriverLocation = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permission to access location was denied");
        Alert.alert("Permission Denied", "Location access is required.");
        return;
      }

      let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setDriverLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    };

    fetchDriverLocation();
  }, []);

  useEffect(() => {
    if (pickupLocation && destinationLocation) {
      const pickupLatitude = parseFloat(pickupLocation.latitude);
      const pickupLongitude = parseFloat(pickupLocation.longitude);
      const destinationLatitude = parseFloat(destinationLocation.latitude);
      const destinationLongitude = parseFloat(destinationLocation.longitude);

      if (!isNaN(pickupLatitude) && !isNaN(pickupLongitude) && !isNaN(destinationLatitude) && !isNaN(destinationLongitude)) {
        const calculatedDistance = calculateDistance(
          { latitude: pickupLatitude, longitude: pickupLongitude },
          { latitude: destinationLatitude, longitude: destinationLongitude }
        );
        setDistance(calculatedDistance);

        const estimatedTime = calculateTime(calculatedDistance);
        setTime(estimatedTime);

        const calculatedFare = calculateFare(calculatedDistance);
        setFare(calculatedFare);

        const simulatedCoordinates = simulateRouteCoordinates(
          { latitude: pickupLatitude, longitude: pickupLongitude },
          { latitude: destinationLatitude, longitude: destinationLongitude }
        );
        setRouteCoordinates(simulatedCoordinates);
      } else {
        setErrorMsg("Pickup or Destination location coordinates are invalid.");
      }
    } else {
      setErrorMsg("Pickup and Destination locations are required.");
    }
  }, [pickupLocation, destinationLocation]);

  useEffect(() => {
    if (driverLocation && !errorMsg) {
      setLoading(false);
    }
  }, [driverLocation, errorMsg]);

  if (errorMsg) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{errorMsg}</Text>
      </View>
    );
  }

  if (loading || !driverLocation || !pickupLocation || !destinationLocation) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Loading map and locations...</Text>
      </View>
    );
  }

  const handleReachedPress = async () => {
    setModalVisible(true);
  
    // Use driverName directly
    const driverName = driver_Name;
  
    // Check if driverName is null
    if (!driverName) {
      Alert.alert("Error", "Driver name is required.");
      setModalVisible(false); // Close modal if there's an error
      return;
    }
  
    // Ensure you have access to progressId from props or state
    const progressId = route.params.progressId; // Get progressId from route parameters
  
    // Check if progressId is null
    if (!progressId) {
      Alert.alert("Error", "Progress ID is required.");
      setModalVisible(false); // Close modal if there's an error
      return;
    }
  
    try {
      // Construct the URL with progressId as a parameter
      const url = `http://192.168.53.164:3000/api/ride-requests/progress/${driverName}/${progressId}`;
      const body = JSON.stringify({
        driverName, // Include driverName in the request body
        progressId, // Also include progressId in the request body if needed
      });
  
      // Debug: Log URL and request body
      console.log("Sending request to:", url);
      console.log("Request body:", body);
  
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: body,
      });
  
      // Debug: Log the status of the response
      console.log("Response status:", response.status);
      
      const data = await response.json();
  
      // Debug: Log the entire response data
      console.log("Response data:", data);
  
      if (response.ok) {
        Alert.alert("Success", data.message);
        setModalVisible(true); // Close modal after success
      } else {
        Alert.alert("Error", data.message || "Failed to update progress.");
      }
    } catch (error) {
      // Debug: Log the error
      console.error("Error updating progress:", error);
      Alert.alert("Error", "An error occurred while updating progress.");
    }
  };
  
  
  
  
  const handlePaymentPress = () => {
    navigation.navigate('DriverPay'); // Pass the fare if needed
  };

  const handleScanToPayPress = () => {
    navigation.navigate('PaymentScreen')
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        region={{
          latitude: driverLocation.latitude,
          longitude: driverLocation.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        <Marker coordinate={driverLocation} title="Driver Location">
          <Icon name="car" size={30} color="blue" />
        </Marker>

        {pickupLocation && pickupLocation.latitude && pickupLocation.longitude && (
          <Marker coordinate={pickupLocation} title="Pickup Location" pinColor="green" />
        )}

        {destinationLocation && destinationLocation.latitude && destinationLocation.longitude && (
          <Marker coordinate={destinationLocation} title="Destination Location" pinColor="red" />
        )}

        {driverLocation && pickupLocation && (
          <Polyline
            coordinates={[driverLocation, pickupLocation]}
            strokeColor="blue"
            strokeWidth={3}
          />
        )}

        {pickupLocation && destinationLocation && (
          <Polyline
            coordinates={[pickupLocation, destinationLocation]}
            strokeColor="red"
            strokeWidth={3}
          />
        )}
      </MapView>

      <View style={styles.tripDetailsContainer}>
        <Text style={styles.tripTitle}>Trip Details</Text>

        <View style={styles.riderDetailContainer}>
          <Text style={styles.riderText}>{role === "rider" ? riderDetail?.riderDetail || "Rider Name" : driverNameContext?.driverNameContext|| "Driver Name"}</Text>
          <TouchableOpacity style={styles.callIcon}>
            <Icon name="phone" size={20} color="green" />
          </TouchableOpacity>
        </View>

        <View style={styles.tripInfoRow}>
          <View style={styles.tripInfoItem}>
            <Icon name="road" size={20} color="black" />
            <Text style={styles.tripInfoText}>{distance ? `${distance} km` : "Distance..."}</Text>
          </View>
          <View style={styles.tripInfoItem}>
            <Icon name="clock-o" size={20} color="black" />
            <Text style={styles.tripInfoText}>{time ? `${time} min` : "Estimating time..."}</Text>
          </View>
          <View style={styles.tripInfoItem}>
            <Icon name="money" size={20} color="brown" />
            <Text style={styles.tripInfoText}>{fare ? `₹${fare}` : "Fare..."}</Text>
          </View>
        </View>

        <View style={styles.pickupDropContainer}>
          <View style={styles.pickupDropItem}>
            <Icon name="map-marker" size={20} color="green" />
            <Text style={styles.pickupDropText}>Pickup: {pickupLocation?.title || "Pickup Address"}</Text>
          </View>
          <View style={styles.pickupDropItem}>
            <Icon name="map-marker" size={20} color="red" />
            <Text style={styles.pickupDropText}>Drop: {destinationLocation?.title || "Destination Address"}</Text>
          </View>
        </View>

        {/* Button displayed for rider */}
        {role === "rider" && (
          <TouchableOpacity style={styles.reachedButton} onPress={handleReachedPress}>
            <Text style={styles.reachedButtonText}>Reached</Text>
          </TouchableOpacity>
        )}

        {/* Button displayed for driver */}
        {role === "driver" && (
          <TouchableOpacity style={styles.paymentButton} onPress={handleScanToPayPress}>
            <Text style={styles.paymentButtonText}>Scan to Pay</Text>
          </TouchableOpacity>
        )}

        {/* Modal to confirm reaching destination */}
        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalText}>Successfully Reached Your destination...</Text>
              <TouchableOpacity style={styles.paymentButton} onPress={handlePaymentPress}>
        <Text style={styles.paymentButtonText}>Pay Now</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
        <Text style={styles.closeButtonText}>Close</Text>
      </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 18,
    color: "red",
  },
  tripDetailsContainer: {
    position: "absolute",
    bottom: 0,
    width: screenWidth,
    padding: 10,
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  tripTitle: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  riderDetailContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  riderText: {
    fontSize: 16,
    fontWeight: "bold",
   
  },
  callIcon: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
  },
  tripInfoRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
  },
  tripInfoItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  tripInfoText: {
    marginLeft: 5,
    fontSize: 14,
  },
  pickupDropContainer: {
    marginTop: 10,
  },
  pickupDropItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  pickupDropText: {
    marginLeft: 10,
    fontSize: 14,
  },
  reachedButton: {
    marginTop: 15,
    paddingVertical: 10,
    backgroundColor: "green",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  reachedButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },

  paymentButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: 300,
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
    alignItems: "center",
  },
  paymentButton: {
    backgroundColor: "green",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginVertical: 10, // Space above and below the payment button
  },
  closeButton: {
    backgroundColor: "red",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginTop: 10, // Add space above the close button
  },
  closeButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});

export default RideMap;