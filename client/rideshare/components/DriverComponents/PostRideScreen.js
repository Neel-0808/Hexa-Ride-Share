import { FontAwesome, Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import tw from "twrnc"; // For Tailwind styles
import { useUser } from "../UserContext";

const PostRideScreen = () => {
  const { userId, setDriverNameContext } = useUser(); // Add setRiderName to UserContext
  const [DriverName, setDriverName] = useState("");
  const [pickupLocation, setPickupLocation] = useState("");
  const [destination, setDestination] = useState("");
  const [carNumber, setCarNumber] = useState(""); // Car Number state
  const [seatsAvailable, setSeatsAvailable] = useState(""); // Seats Available state
  const [carName, setCarName] = useState(""); // Car Name state
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [time, setTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const navigation = useNavigation();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const response = await axios.get(
          `http://192.168.215.164:4000/api/users/${userId}`
        );
        const user = response.data;
        setDriverName(user.username); // Assuming 'username' field exists in user table
      } catch (error) {
        console.error("Error fetching user details:", error);
        Alert.alert("Error", "Could not fetch user details.");
      }
    };

    fetchUserDetails();
  }, [userId]);

  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === "ios");
    setDate(currentDate);
  };

  const onTimeChange = (event, selectedTime) => {
    const currentTime = selectedTime || time;
    setShowTimePicker(Platform.OS === "ios");
    setTime(currentTime);
  };

  const handleSelectOnMap = () => {
    navigation.navigate("MapScreen", {
      setLocation: (pickup, dest) => {
        setPickupLocation(pickup);
        setDestination(dest);
      },
    });
  };

  const handlePostRide = async () => {
    if (
      !pickupLocation ||
      !destination ||
      !carNumber ||
      !seatsAvailable ||
      !carName
    ) {
      Alert.alert("Error", "Please fill all the fields.");
      return;
    }

    // Combine selected date and time into a single Date object
    const selectedDateTime = new Date(date);
    selectedDateTime.setHours(time.getHours(), time.getMinutes(), time.getSeconds());

    // Get current date and time
    const currentDateTime = new Date();

    // Check if the selected date and time are in the past
    if (selectedDateTime < currentDateTime) {
      Alert.alert("Error", "You cannot post a ride in the past. Please select a valid date and time.");
      return;
    }

    // Prepare ride details
    const rideDetails = {
      driver_name: DriverName,
      vehicle_info: `${carName} (${carNumber})`,
      origin: pickupLocation,
      destination: destination,
      available_seats: parseInt(seatsAvailable),
      ride_date: date.toLocaleDateString('en-CA'), // Format date as YYYY-MM-DD
      ride_time: time.toLocaleTimeString('en-CA', { hour12: false }),
    };

    try {
      const BACKEND_URL = "http://192.168.215.164:4000"; 

      // Send POST request to create a new ride
      const response = await axios.post(`${BACKEND_URL}/api/rides`, rideDetails);

      if (response.status === 201) {
        Alert.alert("Success", "Ride has been posted successfully!");
        console.log("drivername:",response.data.DriverName)
        // Store the rider name in UserContext
        setDriverNameContext(DriverName); // Assuming destination is used as the rider's name for context

        // Send the driver's name to the new endpoint
        

        // Your existing socket logic...
        if (socket) {
          socket.emit("newRide", response.data.ride);
        }

        // Navigate back to DriverHome or another relevant screen
        navigation.navigate("DriverHome");
      } else {
        Alert.alert("Error", "Failed to post ride.");
      }
    } catch (error) {
      Alert.alert("Error", `Failed to post ride: ${error.message}`);
      console.error(error);
    }
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-white`}>
      {/* Header */}
      <View style={tw`bg-blue-600 p-4 flex-row justify-between items-center`}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={tw`text-white text-xl font-bold`}></Text>
        <TouchableOpacity onPress={() => navigation.navigate("Profile")}>
          <Ionicons name="person-circle-outline" size={40} color="white" />
        </TouchableOpacity>
      </View>

      {/* Form Container */}
      <ScrollView style={tw`p-4`}>
        <View style={tw`bg-white p-4 rounded-lg shadow`}>
          <TextInput
            style={tw`border-b border-gray-300 p-3`}
            placeholder="DriverName"
            value={DriverName}
            onChangeText={setDriverName}
          />
          <TextInput
            style={tw`border-b border-gray-300 p-3`}
            placeholder="Your Starting Point"
            value={pickupLocation}
            onChangeText={setPickupLocation}
          />
          <TextInput
            style={tw`border-b border-gray-300 p-3`}
            placeholder="Destination"
            value={destination}
            onChangeText={setDestination}
          />
        </View>

        <View style={tw`flex-row justify-around mt-3`}>
          <TouchableOpacity
            style={tw`flex-row items-center border border-gray-300 p-2 rounded`}
            onPress={handleSelectOnMap}
          >
            <FontAwesome name="map-marker" size={24} color="black" />
            <Text style={tw`ml-2`}>Select on Map</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={tw`flex-row items-center border border-gray-300 p-2 rounded`}
            onPress={() => setShowDatePicker(true)}
          >
            <FontAwesome name="calendar" size={24} color="black" />
            <Text style={tw`ml-2`}>Date</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={tw`flex-row items-center border border-gray-300 p-2 rounded`}
            onPress={() => setShowTimePicker(true)}
          >
            <FontAwesome name="clock-o" size={24} color="black" />
            <Text style={tw`ml-2`}>Time</Text>
          </TouchableOpacity>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={onDateChange}
          />
        )}
        {showTimePicker && (
          <DateTimePicker
            value={time}
            mode="time"
            display="default"
            onChange={onTimeChange}
          />
        )}

        {/* Car Number Input */}
        <TextInput
          style={tw`border border-gray-300 p-3 rounded mt-3`}
          placeholder="Car Number"
          value={carNumber}
          onChangeText={setCarNumber}
        />

        {/* Seats Available Input */}
        <TextInput
          style={tw`border border-gray-300 p-3 rounded mt-3`}
          placeholder="Seats Available"
          value={seatsAvailable}
          onChangeText={setSeatsAvailable}
          keyboardType="numeric"
        />

        {/* Car Name Input */}
        <TextInput
          style={tw`border border-gray-300 p-3 rounded mt-3`}
          placeholder="Car Name"
          value={carName}
          onChangeText={setCarName}
        />

        {/* Post Ride Button */}
        <TouchableOpacity
          style={tw`bg-blue-600 p-4 mt-4 rounded-lg flex-row justify-center items-center`}
          onPress={handlePostRide}
        >
          <FontAwesome name="car" size={24} color="white" />
          <Text style={tw`ml-2 text-white text-lg`}>Post Ride</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom Navigation */}
      <View
        style={tw`absolute bottom-0 w-full bg-gray-200 flex-row justify-around p-5 border-t border-gray-300`}
      >
       
      </View>
    </SafeAreaView>
  );
};

export default PostRideScreen;
