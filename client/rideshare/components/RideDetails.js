import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import tw from "twrnc"; // Tailwind CSS for styling
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants"; // Importing Expo Notifications
import { useUser } from "./UserContext"; // Import useUser for accessing user context

const RideDetails = ({ route }) => {
  const { userId } = useUser(); // Get userId from context
  const [riderName, setRiderName] = useState("");
  const [gender, setGender] = useState("");
  const [time, setTime] = useState("");
  const [pickupLocation, setPickupLocation] = useState("");
  const [destinationLocation, setDestinationLocation] = useState("");
  const [contact, setContact] = useState("");

  const navigation = useNavigation();

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const response = await axios.get(
          `http://192.168.29.122:3000/api/users/${userId}`
        );
        const user = response.data;
        setRiderName(user.username); // Assuming 'username' field exists in user table
        setGender(user.gender);
        setContact(user.phonenumber); // Assuming 'phonenumber' field exists in user table
      } catch (error) {
        console.error("Error fetching user details:", error);
        Alert.alert("Error", "Could not fetch user details.");
      }
    };

    fetchUserDetails();
  }, [userId]);

  const handleSubmit = async () => {
    const expoPushToken = await registerForPushNotificationsAsync();

    if (
      !riderName ||
      !gender ||
      !time ||
      !pickupLocation ||
      !destinationLocation ||
      !contact
    ) {
      Alert.alert("Error", "Please fill all the fields.");
      return;
    }

    const rideRequest = {
      rider_name: riderName,
      gender: gender,
      time: time,
      pickup_location: pickupLocation,
      destination_location: destinationLocation,
      contact: contact,
      push_token: expoPushToken, // Changed to push_token
    };

    try {
      const response = await axios.post(
        "http://192.168.29.122:3000/api/ride-requests",
        rideRequest
      );

      // Correctly extract requestId from the response
      const requestId = response.data.requestId;

      if (requestId) {
        Alert.alert("Success", "Ride request has been submitted!");
        console.log(
          "Navigating to NotificationScreen with requestId:",
          requestId
        );
        navigation.navigate("NotificationScreen", { requestId });
      } else {
        console.error("Error: No requestId received");
        Alert.alert("Error", "Failed to get requestId from the server.");
      }
    } catch (error) {
      if (error.response && error.response.status === 500) {
        Alert.alert(
          "Error",
          "Request failed with status code 500. Please try again."
        );
      } else {
        Alert.alert("Error", `Failed to submit ride request: ${error.message}`);
      }
    }
  };

  // Function to register for push notifications and get Expo push token
  async function registerForPushNotificationsAsync() {
    let token;
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      Alert.alert("Failed to get push token for push notification!");
      return;
    }

    token = (
      await Notifications.getExpoPushTokenAsync({
        projectId: Constants.manifest?.expo?.projectId,
      })
    ).data;

    console.log(token); // You should store this in your backend
    return token;
  }

  return (
    <SafeAreaView style={tw`flex-1 bg-white`}>
      {/* Header */}
      <View style={tw`bg-blue-600 p-4 flex-row justify-between items-center`}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={tw`text-white text-xl font-bold`}>
          Ride Request Details
        </Text>
        <TouchableOpacity onPress={() => navigation.navigate("Profile")}>
          <Ionicons name="person-circle-outline" size={40} color="white" />
        </TouchableOpacity>
      </View>

      {/* Ride Request Form */}
      <ScrollView style={tw`p-4`}>
        <View style={tw`mb-4`}>
          <Text style={tw`text-lg font-bold mb-1`}>Rider Name:</Text>
          <TextInput
            style={tw`bg-gray-100 p-2 rounded`}
            placeholder="Enter your name"
            value={riderName}
            onChangeText={setRiderName}
          />
        </View>

        <View style={tw`mb-4`}>
          <Text style={tw`text-lg font-bold mb-1`}>Gender:</Text>
          <TextInput
            style={tw`bg-gray-100 p-2 rounded`}
            placeholder="Enter your gender"
            value={gender}
            onChangeText={setGender}
          />
        </View>

        <View style={tw`mb-4`}>
          <Text style={tw`text-lg font-bold mb-1`}>Time:</Text>
          <TextInput
            style={tw`bg-gray-100 p-2 rounded`}
            placeholder="Enter time (e.g., 10:00 AM)"
            value={time}
            onChangeText={setTime}
          />
        </View>

        <View style={tw`mb-4`}>
          <Text style={tw`text-lg font-bold mb-1`}>Pickup Location:</Text>
          <TextInput
            style={tw`bg-gray-100 p-2 rounded`}
            placeholder="Enter pickup location"
            value={pickupLocation}
            onChangeText={setPickupLocation}
          />
        </View>

        <View style={tw`mb-4`}>
          <Text style={tw`text-lg font-bold mb-1`}>Destination Location:</Text>
          <TextInput
            style={tw`bg-gray-100 p-2 rounded`}
            placeholder="Enter destination location"
            value={destinationLocation}
            onChangeText={setDestinationLocation}
          />
        </View>

        <View style={tw`mb-4`}>
          <Text style={tw`text-lg font-bold mb-1`}>Contact:</Text>
          <TextInput
            style={tw`bg-gray-100 p-2 rounded`}
            placeholder="Enter contact number"
            value={contact}
            onChangeText={setContact}
            keyboardType="phone-pad"
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={tw`bg-blue-500 p-4 rounded-full shadow-lg`}
          onPress={handleSubmit}
        >
          <Text style={tw`text-white text-center text-lg font-bold`}>
            Submit Ride Request
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default RideDetails;
