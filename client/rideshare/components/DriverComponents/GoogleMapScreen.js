import axios from "axios"; // Import axios for making HTTP requests
import * as Location from "expo-location";
import React, { useEffect, useState } from "react";
import { Alert, Button, Text, View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import tw from "twrnc";

const MapScreen = ({ route, navigation }) => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [pickupLocation, setPickupLocation] = useState(null);
  const [destinationLocation, setDestinationLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pickupAddress, setPickupAddress] = useState("");
  const [destinationAddress, setDestinationAddress] = useState("");

  useEffect(() => {
    const fetchCurrentLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Permission Denied",
            "Location permission is required to use this feature"
          );
          return;
        }

        const { coords } = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setCurrentLocation(coords);
        setPickupLocation(coords);
        await fetchAddress(coords.latitude, coords.longitude, true); // Fetch address for pickup location
      } catch (error) {
        Alert.alert("Error", "An error occurred while fetching location");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentLocation();
  }, []);

  const fetchAddress = async (latitude, longitude, isPickup) => {
    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/reverse`,
        {
          params: {
            lat: latitude,
            lon: longitude,
            format: "json",
          },
        }
      );
      const address = response.data.display_name;
      if (isPickup) {
        setPickupAddress(address);
      } else {
        setDestinationAddress(address);
      }
    } catch (error) {
      console.error("Error fetching address:", error);
      Alert.alert("Error", "Failed to fetch address for the selected location");
    }
  };

  const handleConfirm = () => {
    if (pickupLocation && destinationLocation) {
      if (route.params?.setLocation) {
        route.params.setLocation(
          {
            latitude: pickupLocation.latitude,
            longitude: pickupLocation.longitude,
          },
          {
            latitude: destinationLocation.latitude,
            longitude: destinationLocation.longitude,
          }
        );
      }
      navigation.goBack();
    } else {
      Alert.alert("Error", "Both pickup and destination locations must be set");
    }
  };

  const handleDriverLocationUpdate = async () => {
    try {
      const { coords } = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setCurrentLocation(coords);
    } catch (error) {
      Alert.alert("Error", "Unable to update driver location");
      console.error(error);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      handleDriverLocationUpdate(); // Update driver location every 5 seconds
    }, 5000);

    return () => clearInterval(interval); // Clear the interval on component unmount
  }, []);

  if (loading) {
    return (
      <View style={tw`flex-1 justify-center items-center`}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={tw`flex-1`}>
      <MapView
        style={tw`flex-1`}
        initialRegion={{
          latitude: currentLocation ? currentLocation.latitude : 37.78825,
          longitude: currentLocation ? currentLocation.longitude : -122.4324,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        onPress={(event) => {
          const { latitude, longitude } = event.nativeEvent.coordinate;
          if (!pickupLocation) {
            setPickupLocation({ latitude, longitude });
            fetchAddress(latitude, longitude, true); // Fetch address for pickup
          } else if (!destinationLocation) {
            setDestinationLocation({ latitude, longitude });
            fetchAddress(latitude, longitude, false); // Fetch address for destination
          }
        }}
      >
        {currentLocation && (
          <Marker coordinate={currentLocation} title="Driver's Location" />
        )}
        {pickupLocation && (
          <Marker coordinate={pickupLocation} title="Pickup Location" />
        )}
        {destinationLocation && (
          <Marker
            coordinate={destinationLocation}
            title="Destination Location"
          />
        )}
      </MapView>
      <View style={tw`absolute bottom-0 left-0 right-0 p-4`}>
        <Text>Pickup Address: {pickupAddress}</Text>
        <Text>Destination Address: {destinationAddress}</Text>
        <Button title="Confirm" onPress={handleConfirm} />
      </View>
    </View>
  );
};

export default MapScreen;
