import React, { useState, useEffect } from "react";
import { View, Text, Button, Alert } from "react-native";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import tw from "twrnc";

const MapScreen = ({ route, navigation }) => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [pickupLocation, setPickupLocation] = useState(null);
  const [destinationLocation, setDestinationLocation] = useState(null);
  const [loading, setLoading] = useState(true);

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
      } catch (error) {
        Alert.alert("Error", "An error occurred while fetching location");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentLocation();
  }, []);

  const handleConfirm = () => {
    if (pickupLocation && destinationLocation) {
      if (route.params?.setLocation) {
        route.params.setLocation(
          `${pickupLocation.latitude}, ${pickupLocation.longitude}`,
          `${destinationLocation.latitude}, ${destinationLocation.longitude}`
        );
      }
      navigation.goBack();
    } else {
      Alert.alert("Error", "Both pickup and destination locations must be set");
    }
  };

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
          } else if (!destinationLocation) {
            setDestinationLocation({ latitude, longitude });
          }
        }}
      >
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
        <Button title="Confirm" onPress={handleConfirm} />
      </View>
    </View>
  );
};

export default MapScreen;
