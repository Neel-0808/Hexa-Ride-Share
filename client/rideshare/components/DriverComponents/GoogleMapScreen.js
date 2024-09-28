import React, { useState, useEffect } from "react";
import { View, Text, ActivityIndicator, StyleSheet, Alert, TouchableOpacity, Dimensions, Modal } from "react-native";
import * as Location from "expo-location";
import MapView, { Marker, Polyline } from "react-native-maps";
import { useRoute , useNavigation} from "@react-navigation/native";
import Icon from 'react-native-vector-icons/FontAwesome';

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
  const { pickupLocation, destinationLocation, role, driverDetails, riderDetail } = route.params || {}; // Get role and details

  const [driverLocation, setDriverLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [distance, setDistance] = useState(null);
  const [time, setTime] = useState(null);
  const [fare, setFare] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);

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

  const handleReachedPress = () => {
    setModalVisible(true);
  };

  const handlePaymentPress = () => {
    // Navigate to the DriverPay screen
    navigation.navigate('DriverPay'); // Pass the fare if needed
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
          <Text style={styles.riderText}>{role === "rider" ? riderDetail?.riderDetail || "Rider Name" : driverDetails?.driver_name || "Driver Name"}</Text>
          <TouchableOpacity style={styles.callIcon}>
            <Icon name="phone" size={20} color="green" />
          </TouchableOpacity>
        </View>

        <View style={styles.tripInfoRow}>
          <View style={styles.tripInfoItem}>
            <Icon name="road" size={20} color="gray" />
            <Text style={styles.tripInfoText}>{distance ? `${distance} km` : "Distance..."}</Text>
          </View>
          <View style={styles.tripInfoItem}>
            <Icon name="clock-o" size={20} color="gray" />
            <Text style={styles.tripInfoText}>{time ? `${time} min` : "Estimating time..."}</Text>
          </View>
          <View style={styles.tripInfoItem}>
            <Icon name="money" size={20} color="gray" />
            <Text style={styles.tripInfoText}>{fare ? `₹${fare}` : "Fare..."}</Text>
          </View>
        </View>

        <View style={styles.pickupDropContainer}>
          <View style={styles.pickupDropItem}>
            <Icon name="map-marker" size={20} color="gray" />
            <Text style={styles.pickupDropText}>{pickupLocation ? `Pickup: ${pickupLocation?.title || "Unknown"}` : "Pickup location..."}</Text>
          </View>
          <View style={styles.pickupDropItem}>
            <Icon name="map-marker" size={20} color="gray" />
            <Text style={styles.pickupDropText}>{destinationLocation ? `Drop: ${destinationLocation?.title || "Unknown"}` : "Destination location..."}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.reachedButton} onPress={handleReachedPress}>
          <Text style={styles.reachedButtonText}>Reached</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={modalVisible} transparent={true}>
  <View style={styles.modalContainer}>
    <View style={styles.modalContent}>
      <Text style={styles.modalTitle}>Payment Details</Text>
      <Text style={styles.modalTitle}>Total Fare: ₹{fare}</Text>
      <TouchableOpacity 
        style={styles.paymentButton} 
        onPress={handlePaymentPress} // Updated here
      >
        <Text style={styles.paymentButtonText}>Pay Now</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.closeButton} 
        onPress={() => setModalVisible(false)} // Close button to dismiss the modal
      >
        <Text style={styles.closeButtonText}>Close</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>


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
    padding: 20,
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 10,
    width: '100%',
  },
  tripTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  pickupDropContainer: {
    marginBottom: 15,
  },
  pickupDropItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  pickupDropText: {
    marginLeft: 10,
    fontSize: 16,
    color: "#333",
  },
  riderDetailContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  riderText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  tripInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  tripInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    flex: 1,
  },
  tripInfoText: {
    marginLeft: 10,
    fontSize: 16,
    color: "#333",
  },
  callIcon: {
    padding: 10,
    backgroundColor: '#32CD32',
    borderRadius: 20,
  },
  reachedButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#1E90FF",
    padding: 12,
    borderRadius: 10,
    elevation: 5,
  },
  reachedButtonText: {
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
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  paymentButton: {
    backgroundColor: "#32CD32",
    padding: 10,
    borderRadius: 5,
  },
  paymentButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default RideMap;
