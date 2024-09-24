import * as Location from "expo-location";
import React, { useEffect, useState } from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import tw from "twrnc"; // Tailwind import
import LottieView from "lottie-react-native"; // Import LottieView

const LocationScreen = ({ navigation }) => {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setErrorMsg("Permission to access location was denied");
          Alert.alert(
            "Location Error",
            "Permission to access location was denied"
          );
          return;
        }
        const { coords } = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setLocation(coords);
      } catch (error) {
        console.log("Error fetching location: ", error); // Log error for debugging
        setErrorMsg("Failed to fetch location");
        Alert.alert("Location Error", "Failed to fetch location");
      }
    };

    fetchLocation();
  }, []);

  const handleNext = () => {
    navigation.navigate("RoleSelectionScreen"); // Navigate to RoleSelectionScreen
  };

  if (!location && !errorMsg) {
    return (
      <View style={tw`flex-1 items-center justify-center`}>
        <Text style={tw`mb-2 text-lg`}>Fetching your location...</Text>
        <LottieView
          source={require("../assets/location_ani.json")} // Replace with the path to your animation file
          autoPlay
          loop
          style={tw`w-80 h-80`} // Adjust the size as needed
        />
      </View>
    );
  }

  return (
    <View style={tw`flex-1`}>
      <MapView
        style={tw`flex-1`}
        region={{
          latitude: location?.latitude || 37.78825,
          longitude: location?.longitude || -122.4324,
          latitudeDelta: 0.015,
          longitudeDelta: 0.0121,
        }}
      >
        {location && (
          <Marker
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            title="Your Location"
            description="This is where you are currently located"
          />
        )}
      </MapView>

      <View style={tw`absolute bottom-0 left-0 right-0 p-4`}>
        <TouchableOpacity
          style={tw`bg-blue-600 rounded-lg py-3 items-center`}
          onPress={handleNext}
        >
          <Text style={tw`text-white text-lg font-bold`}>Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default LocationScreen;
