import React, { useEffect, useState } from "react";
import {
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import tw from "twrnc";
import axios from "axios";
import { useUser } from "./UserContext"; // Import useUser from UserContext
import { useNavigation } from "@react-navigation/native"; // Import useNavigation

const ProfilePage = () => {
  const { userId, setUserId } = useUser(); // Get userId and setUserId from UserContext
  const navigation = useNavigation(); // Use useNavigation for navigation
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [gender, setGender] = useState("");

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get(
          `http://192.168.29.122:3000/api/users/${userId}`
        );
        const { username, email, phonenumber, gender } = response.data; // Adjust property names as needed
        setUserName(username);
        setEmail(email);
        setMobile(phonenumber);
        setGender(gender);
      } catch (error) {
        console.error("Error fetching user data:", error);
        Alert.alert("Error", "Could not load user data");
      }
    };

    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  const handleLogout = () => {
    Alert.alert(
      "Confirm Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          onPress: () => console.log("Logout canceled"),
          style: "cancel",
        },
        {
          text: "OK",
          onPress: () => {
            setUserId(null); // Clear userId in context or storage
            navigation.navigate("LoginScreen"); // Navigate to the Login screen
          },
        },
      ],
      { cancelable: false }
    );
  };

  return (
    <View style={tw`flex-1 bg-white`}>
      {/* Header */}
      <View style={tw`bg-white p-4 flex-row justify-between items-center mt-5`}>
        <TouchableOpacity onPress={() => navigation.openDrawer()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <View style={tw`items-center`}>
          <Text style={tw`text-lg font-bold`}>Profile</Text>
        </View>
        <Ionicons name="notifications" size={24} color="black" />
      </View>

      {/* Profile Picture */}
      <View style={tw`items-center mt-5`}>
        <View style={tw`relative`}>
          <Image
            source={{ uri: "https://via.placeholder.com/100" }}
            style={tw`w-24 h-24 rounded-full border-4 border-white`}
          />
          <View style={tw`absolute bottom-0 right-0`}>
            <Ionicons name="checkmark-circle" size={24} color="green" />
          </View>
        </View>
        <Text style={tw`text-2xl font-bold mt-2`}>{userName}</Text>
      </View>

      {/* Profile Info */}
      <View style={tw`p-5`}>
        {/* Email Input */}
        <TextInput
          style={tw`border border-gray-300 p-3 rounded mb-4`}
          value={email}
          onChangeText={setEmail}
          placeholder="example@email.com"
          keyboardType="email-address"
        />

        {/* Mobile Input with Country Flag */}
        <View
          style={tw`flex-row items-center border border-gray-300 p-3 rounded mb-4`}
        >
          <Image
            source={{
              uri: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Flag_of_India.svg/1200px-Flag_of_India.svg.png",
            }}
            style={tw`w-6 h-4 mr-2`}
          />
          <Text style={tw`mr-2`}>+91</Text>
          <TextInput
            style={tw`flex-1`}
            value={mobile}
            onChangeText={setMobile}
            placeholder="Your mobile number"
            keyboardType="phone-pad"
          />
        </View>

        {/* Gender Display */}
        <View style={tw`border border-gray-300 p-3 rounded mb-4`}>
          <Text>{gender}</Text>
        </View>

        {/* Buttons */}
        <View style={tw`flex justify-center items-center`}>
          <TouchableOpacity
            style={[tw`bg-blue-500 p-4 rounded mb-3`, { width: "50%" }]}
          >
            <Text style={tw`text-white text-center`}>History</Text>
          </TouchableOpacity>
        </View>

        <View style={tw`flex justify-center items-center`}>
          <TouchableOpacity
            style={[tw`bg-red-700 p-4 rounded mb-3`, { width: "50%" }]}
            onPress={handleLogout} // Attach logout function
          >
            <Text style={tw`text-white text-center`}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom Navigation */}
      <View
        style={tw`flex-row justify-between items-center bg-gray-200 p-4 absolute bottom-0 w-full`}
      >
        <TouchableOpacity onPress={() => navigation.navigate("Home")}>
          <FontAwesome5 name="home" size={24} color="gray" />
        </TouchableOpacity>
        <TouchableOpacity>
          <Ionicons name="person" size={24} color="blue" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ProfilePage;
