import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  TouchableWithoutFeedback, // import this
  Keyboard,
} from "react-native";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import tw from "twrnc";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";

const RideShareApp = () => {
  const [pickupLocation, setPickupLocation] = useState("");
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [time, setTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [rides, setRides] = useState([]);
  const [filteredRides, setFilteredRides] = useState([]);
  const [isFiltered, setIsFiltered] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchAllRides = async () => {
      try {
        const response = await axios.get(
          "http://192.168.29.122:3000/api/rides"
        );
        const sortedRides = response.data.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        ); // Sort rides based on creation date
        setRides(sortedRides);
        setFilteredRides(sortedRides);
      } catch (error) {
        Alert.alert("Error", `Failed to fetch rides. Error: ${error.message}`);
      }
    };

    fetchAllRides();
  }, []);

  const handleSearch = async () => {
    if (!pickupLocation || !destination) {
      Alert.alert(
        "Error",
        "Please enter both pickup location and destination to search for rides."
      );
      return;
    }

    try {
      const formattedDate = date.toISOString().split("T")[0];
      const formattedTime = time.toTimeString().split(" ")[0];

      const response = await axios.get("http://192.168.29.122:3000/api/rides", {
        params: {
          date: formattedDate,
          time: formattedTime,
        },
      });

      const filtered = response.data.filter(
        (ride) =>
          ride.origin
            .trim()
            .toLowerCase()
            .includes(pickupLocation.trim().toLowerCase()) &&
          ride.destination
            .trim()
            .toLowerCase()
            .includes(destination.trim().toLowerCase())
      );

      const sortedFilteredRides = filtered.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      ); // Sort filtered rides based on creation date

      setFilteredRides(sortedFilteredRides);
      setIsFiltered(true);

      if (sortedFilteredRides.length === 0) {
        Alert.alert("No Results", "No rides match your search criteria.");
      }
    } catch (error) {
      Alert.alert("Error", `Failed to fetch rides. Error: ${error.message}`);
    }
  };

  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(false);
    setDate(currentDate);
  };

  const onTimeChange = (event, selectedTime) => {
    const currentTime = selectedTime || time;
    setShowTimePicker(false);
    setTime(currentTime);
  };

  const handleRidePress = (ride) => {
    navigation.navigate("AvailableRides", { ride });
  };

  const toggleMenu = () => setShowMenu((prev) => !prev);
  const closeMenu = () => setShowMenu(false);

  return (
    <TouchableWithoutFeedback
      onPress={() => {
        closeMenu(); // Close the menu when touched outside
        Keyboard.dismiss(); // Dismiss the keyboard as well
      }}
    >
      <SafeAreaView style={tw`flex-1 bg-gray-100`}>
        {/* Header Section */}
        <View style={tw`bg-blue-600 p-4 flex-row justify-between items-center`}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={28} color="white" />
          </TouchableOpacity>
          <Text style={tw`text-white text-xl font-bold`}>
            Ride Request Details
          </Text>
          <View>
            <TouchableOpacity onPress={toggleMenu}>
              <Ionicons name="menu-outline" size={44} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Dropdown Menu */}
        {showMenu && (
          <View
            style={[
              tw`absolute top-14 right-1 bg-white shadow-lg rounded p-1 z-30`,
              { width: 200, borderWidth: 1, borderColor: "lightgray" },
            ]}
          >
            <TouchableOpacity
              onPress={() => {
                navigation.navigate("Profile");
                closeMenu();
              }}
              style={tw`p-2 flex-row items-center`}
            >
              <Ionicons
                name="person-circle-outline"
                size={28}
                color="black"
                style={tw`mr-2`}
              />
              <Text style={tw`text-black text-base`}>Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                navigation.navigate("NotificationScreen");
                closeMenu();
              }}
              style={tw`p-2 flex-row items-center`}
            >
              <Ionicons
                name="notifications-outline"
                size={28}
                color="black"
                style={tw`mr-2`}
              />
              <Text style={tw`text-black text-base`}>Notifications</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Search Section */}
        <View style={tw`bg-white p-5 m-4 rounded-lg shadow-lg`}>
          <TextInput
            style={tw`border border-gray-300 p-3 rounded mt-2`}
            placeholder="Your current location"
            value={pickupLocation}
            onChangeText={setPickupLocation}
          />
          <TextInput
            style={tw`border border-gray-300 p-3 rounded mt-2`}
            placeholder="Destination"
            value={destination}
            onChangeText={setDestination}
          />
          <View style={tw`flex-row justify-between mt-2`}>
            <TouchableOpacity
              style={tw`flex-row items-center border border-gray-300 p-3 rounded`}
              onPress={() => navigation.navigate("MapScreen")}
            >
              <FontAwesome name="map-marker" size={24} color="black" />
              <Text style={tw`ml-2`}>Select on Map</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={tw`flex-row items-center border border-gray-300 p-3 rounded`}
              onPress={() => setShowDatePicker(true)}
            >
              <FontAwesome name="calendar" size={24} color="black" />
              <Text style={tw`ml-2`}>Date</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={tw`flex-row items-center border border-gray-300 p-3 rounded`}
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

          <TouchableOpacity
            style={tw`bg-blue-500 p-4 rounded mt-4`}
            onPress={handleSearch}
          >
            <Text style={tw`text-white text-center text-lg`}>Search</Text>
          </TouchableOpacity>
        </View>

        {/* Rides Section */}
        <ScrollView style={tw`p-5`}>
          {isFiltered ? (
            <>
              <Text style={tw`text-lg font-bold mb-2`}>Filtered Rides</Text>
              {filteredRides.length > 0 ? (
                filteredRides.map((ride) => (
                  <TouchableOpacity
                    key={ride.id}
                    style={tw`bg-white p-4 mb-3 rounded-lg shadow-md`}
                    onPress={() => handleRidePress(ride)}
                  >
                    <Text style={tw`text-base`}>
                      Driver Name: {ride.driver_name}
                    </Text>
                    <Text style={tw`text-base`}>
                      Vehicle Info: {ride.vehicle_info}
                    </Text>
                    <Text style={tw`text-base`}>Origin: {ride.origin}</Text>
                    <Text style={tw`text-base`}>
                      Destination: {ride.destination}
                    </Text>
                    <Text style={tw`text-base`}>
                      Available Seats: {ride.available_seats}
                    </Text>
                  </TouchableOpacity>
                ))
              ) : (
                <Text>No rides available.</Text>
              )}
            </>
          ) : (
            <>
              <Text style={tw`text-lg font-bold mb-2`}>Available Rides</Text>
              {rides.map((ride) => (
                <TouchableOpacity
                  key={ride.id}
                  style={tw`bg-white p-4 mb-3 rounded-lg shadow-md`}
                  onPress={() => handleRidePress(ride)}
                >
                  <Text style={tw`text-base`}>
                    Driver Name: {ride.driver_name}
                  </Text>
                  <Text style={tw`text-base`}>
                    Vehicle Info: {ride.vehicle_info}
                  </Text>
                  <Text style={tw`text-base`}>Origin: {ride.origin}</Text>
                  <Text style={tw`text-base`}>
                    Destination: {ride.destination}
                  </Text>
                  <Text style={tw`text-base`}>
                    Available Seats: {ride.available_seats}
                  </Text>
                </TouchableOpacity>
              ))}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

export default RideShareApp;
