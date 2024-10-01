import React, { useEffect, useState } from "react";
import {
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import tw from "twrnc";
import axios from "axios";
import * as ImagePicker from 'expo-image-picker';
import { useUser } from "./UserContext";
import { useNavigation } from "@react-navigation/native";

const ProfilePage = () => {
  const { userId, setUserId } = useUser();
  const navigation = useNavigation();
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [gender, setGender] = useState("");
  const [upiId, setUpiId] = useState(""); // UPI ID state
  const [profilePicture, setProfilePicture] = useState(null);
  const [isProfilePicChanged, setIsProfilePicChanged] = useState(false); // Track if profile pic was changed

  // Fetch user data on load
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get(
          `http://192.168.58.164:3000/api/users/${userId}`
        );

        // Logging fetched data for debugging
        console.log("Fetched User Data:", response.data);

        const { username, email, phonenumber, gender, profile_picture, upi_id } = response.data;

        setUserName(username);
        setEmail(email);
        setMobile(phonenumber);
        setGender(gender);
        setProfilePicture(profile_picture ? `http://192.168.58.164:3000/${profile_picture}` : null); // Formatted URI for the profile picture
        setUpiId(upi_id || ""); // Fetch and set UPI ID
      } catch (error) {
        console.error("Error fetching user data:", error);
        Alert.alert("Error", "Could not load user data");
      }
    };

    if (userId) {
      fetchUserData();
    }
  }, [userId]); // This will fetch user data when userId changes

  // Function to handle profile picture upload
  const pickImage = async () => {
    if (Platform.OS !== "web") {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "Permission to access the gallery is needed.");
        return;
      }
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setProfilePicture(result.assets[0].uri); // Use the URI from the assets array
      setIsProfilePicChanged(true); // Mark that the user has selected a new picture
    }
  };

  // Save profile data
  const saveProfileData = async () => {
    if (!email || !mobile) {
      Alert.alert("Error", "Email and Mobile fields are required.");
      return;
    }

    try {
      const formData = new FormData();

      // Only append the profile picture if a new one has been selected
      if (isProfilePicChanged && profilePicture) {
        const filename = profilePicture.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image`;

        formData.append("profilePicture", {
          uri: profilePicture,
          name: filename,
          type: type,
        });
      }

      // Append other fields
      formData.append("email", email);
      formData.append("mobile", mobile);
      formData.append("gender", gender);
      formData.append("upi_id", upiId); // Append UPI ID

      await axios.put(
        `http://192.168.58.164:3000/api/users/${userId}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      Alert.alert("Success", "Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", `Could not update profile: ${error.message}`);
    }
  };

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
            setUserId(null);
            navigation.navigate("Login");
          },
        },
      ],
      { cancelable: false }
    );
  };

  const navigateToPaymentDetails = () => {
    navigation.navigate("PaymentDetails");
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
          <TouchableOpacity onPress={pickImage}>
            <Image
              source={profilePicture ? { uri: profilePicture } : { uri: "https://via.placeholder.com/100" }} // Use placeholder if no picture is available
              style={tw`w-24 h-24 rounded-full border-4 border-white`}
            />
          </TouchableOpacity>
        </View>
        <Text style={tw`text-2xl font-bold mt-2`}>{userName}</Text>
      </View>

      {/* Profile Info */}
      <View style={tw`p-5`}>
        <TextInput
          style={tw`border border-gray-300 p-3 rounded mb-4`}
          value={email}
          onChangeText={setEmail}
          placeholder="example@email.com"
          keyboardType="email-address"
        />

        <View
          style={tw`flex-row items-center border border-gray-300 p-3 rounded mb-4`}
        >
          <Image
            source={{
              uri: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Flag_of_India.svg/1200px-Flag_of-India.svg.png",
            }}
            style={tw`w-6 h-4 mr-2`}
          />
          <Text style={tw`mr-2`}>+91</Text>
          <TextInput
            style={tw`flex-1`}
            value={mobile}
            onChangeText={setMobile}
            placeholder="Mobile Number"
            keyboardType="phone-pad"
          />
        </View>

        <TextInput
          style={tw`border border-gray-300 p-3 rounded mb-4`}
          value={gender}
          onChangeText={setGender}
          placeholder="Gender"
        />

        

        <TouchableOpacity
          style={tw`bg-blue-500 p-3 rounded mb-4`}
          onPress={saveProfileData}
        >
          <Text style={tw`text-white text-center`}>Save Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={tw`bg-red-500 p-3 rounded mb-4`}
          onPress={handleLogout}
        >
          <Text style={tw`text-white text-center`}>Logout</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={tw`bg-green-500 p-3 rounded mb-4`}
          onPress={navigateToPaymentDetails}
        >
          <Text style={tw`text-white text-center`}>Add The Payment Details</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ProfilePage;
