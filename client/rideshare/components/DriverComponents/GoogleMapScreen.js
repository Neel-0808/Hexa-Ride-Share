import React, { useState, useEffect } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import * as Location from "expo-location";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps"; 
import { useRoute } from "@react-navigation/native";

const RideMap = () => {
  const route = useRoute();
  const { pickupLocation, destinationLocation } = route.params;

  const [driverLocation, setDriverLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [distanceToPickup, setDistanceToPickup] = useState(0);
  const [distanceToDestination, setDistanceToDestination] = useState(0);
  const [address, setAddress] = useState(""); // State to store the address

  const getAddressFromCoordinates = async (lat, lng) => {
    const apiKey = "AlzaSySYTQx58Zc8aD7Dp3WT0-nwAs9cFivaTkF"; // Replace with your GoMap API key
    const url = `https://api.gomap.com/v1/geocode?lat=${lat}&lng=${lng}&key=${apiKey}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        setAddress(data.results[0].formatted_address);
      } else {
        setAddress("Address not found");
      }
    } catch (error) {
      console.error("Error fetching address:", error);
      setAddress("Failed to fetch address");
    }
  };

  // Get driver's current location
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permission to access location was denied");
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      setDriverLocation({ latitude, longitude });

      // Get address for driver's location
      await getAddressFromCoordinates(latitude, longitude);
    })();
  }, []);

  useEffect(() => {
    if (driverLocation) {
      setDistanceToPickup(getDistance(driverLocation, pickupLocation));
      setDistanceToDestination(getDistance(pickupLocation, destinationLocation));
    }
  }, [driverLocation, pickupLocation, destinationLocation]);

  const getDistance = (coords1, coords2) => {
    const toRad = (value) => (value * Math.PI) / 180;
    const R = 6371; // Radius of the Earth in km
    const dLat = toRad(coords2.latitude - coords1.latitude);
    const dLon = toRad(coords2.longitude - coords1.longitude);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(coords1.latitude)) *
        Math.cos(toRad(coords2.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };

  if (errorMsg) {
    return <Text>{errorMsg}</Text>;
  }

  if (!driverLocation) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  // Ensure pickup and destination locations are valid
  if (!pickupLocation || !destinationLocation) {
    return <Text>Error: Invalid pickup or destination location</Text>;
  }

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_DEFAULT}
        style={styles.map}
        initialRegion={{
          latitude: driverLocation.latitude,
          longitude: driverLocation.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        <Marker
          coordinate={driverLocation}
          title="Driver Location"
        />
        <Marker
          coordinate={pickupLocation}
          title="Pickup Location"
          pinColor="green"
        />
        <Marker
          coordinate={destinationLocation}
          title="Destination Location"
          pinColor="red"
        />
      </MapView>

      <View style={styles.distanceContainer}>
        <Text>Distance to Pickup: {distanceToPickup.toFixed(2)} km</Text>
        <Text>Distance to Destination: {distanceToDestination.toFixed(2)} km</Text>
      </View>

      <View style={styles.addressContainer}>
        <Text>Driver's Address: {address}</Text>
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
  distanceContainer: {
    padding: 10,
    backgroundColor: 'white',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  addressContainer: {
    padding: 10,
    backgroundColor: 'white',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
});

export default RideMap;
