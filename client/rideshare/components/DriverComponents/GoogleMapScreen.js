import React, { useState, useEffect } from "react";
import { View, Text, ActivityIndicator, StyleSheet, Alert } from "react-native";
import * as Location from "expo-location";
import MapView, { Marker, Polyline } from "react-native-maps";
import { useRoute } from "@react-navigation/native";
import Icon from 'react-native-vector-icons/FontAwesome'; // Import vector icons

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

const RideMap = () => {
  const route = useRoute();
  const { pickupLocation, destinationLocation } = route.params || {};

  const [driverLocation, setDriverLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [distance, setDistance] = useState(null);
  const [time, setTime] = useState(null);
  const [fare, setFare] = useState(null);

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

        // Calculate time and fare
        const estimatedTime = calculateTime(calculatedDistance);
        setTime(estimatedTime);

        const calculatedFare = calculateFare(calculatedDistance);
        setFare(calculatedFare);
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
        <Text>{errorMsg}</Text>
      </View>
    );
  }

  if (loading || !driverLocation || !pickupLocation || !destinationLocation) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Loading map and locations...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: driverLocation.latitude,
          longitude: driverLocation.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {/* Marker for driver's location with car icon */}
        <Marker coordinate={driverLocation} title="Driver Location">
          <Icon name="car" size={30} color="blue" />
        </Marker>

        {/* Marker for pickup location */}
        {pickupLocation && pickupLocation.latitude && pickupLocation.longitude && (
          <Marker coordinate={pickupLocation} title="Pickup Location" pinColor="green" />
        )}

        {/* Marker for destination location */}
        {destinationLocation && destinationLocation.latitude && destinationLocation.longitude && (
          <Marker coordinate={destinationLocation} title="Destination Location" pinColor="red" />
        )}

        {/* Draw a route line between pickup and destination in red */}
        {pickupLocation && destinationLocation && (
          <Polyline
            coordinates={[pickupLocation, destinationLocation]}
            strokeColor="red" // Line color
            strokeWidth={3} // Line width
          />
        )}

        {/* Draw a route line between driver and destination in red */}
        {driverLocation && destinationLocation && (
          <Polyline
            coordinates={[driverLocation, destinationLocation]}
            strokeColor="red" // Line color for driver to destination
            strokeWidth={3} // Line width
          />
        )}
      </MapView>

      <View style={styles.infoContainer}>
        {distance && <Text style={styles.infoText}>Distance: {distance} km</Text>}
        {time && <Text style={styles.infoText}>Estimated Time: {time} minutes</Text>}
        {fare && <Text style={styles.infoText}>Estimated Fare: ₹{fare}</Text>}
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  infoContainer: {
    padding: 10,
    backgroundColor: "white",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: "#ccc",
  },
  infoText: {
    fontWeight: "bold", // Make text bold
    textAlign: "center", // Center align text
  },
});

export default RideMap;
