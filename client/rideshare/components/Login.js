import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Modal,
  Alert,
  ActivityIndicator,
} from "react-native";
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import { Checkbox } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from '@react-native-async-storage/async-storage'; // Import AsyncStorage
import axios from "axios";
import tw from "twrnc";
import { useUser } from "./UserContext";
import LottieView from "lottie-react-native";

const Login = () => {
  const { setUserId, userId } = useUser(); // Get and set user ID from UserContext
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loginStatus, setLoginStatus] = useState(null);
  const [loginMessage, setLoginMessage] = useState("");
  const [loading, setLoading] = useState(true); // Loading state to check async storage
  const navigation = useNavigation();

  useEffect(() => {
    // Check if user is already logged in when the app loads
    const checkLoginStatus = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem('userId');
        if (storedUserId) {
          setUserId(storedUserId); // Set user ID in context
          navigation.navigate('LocationScreen'); // Redirect to the desired screen
        }
      } catch (error) {
        console.error("Failed to check login status:", error);
      } finally {
        setLoading(false); // Stop loading once we check async storage
      }
    };
    checkLoginStatus();
  }, []);

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const fetchUserCredentials = async () => {
    try {
      const response = await axios.get("http:/192.168.58.164:3000/api/login", {
        params: {
          email,
          password,
        },
      });

      if (response.status === 200) {
        console.log("Login successful:", response.data);
        const userId = response.data.user.id;
        setUserId(userId);
        setLoginStatus("success");
        setLoginMessage("Login successful! Redirecting...");

        // Store userId in AsyncStorage for persistent login
        if (rememberMe) {
          await AsyncStorage.setItem('userId', userId.toString());
        }

        setTimeout(() => {
          setLoginStatus(null);
          navigation.navigate("LocationScreen");
        }, 1500);
      }
    } catch (error) {
      if (error.response) {
        console.error("Error:", error.response.data.message);
        setLoginStatus("failure");
        setLoginMessage(error.response.data.message);
        setTimeout(() => setLoginStatus(null), 1500);
      } else {
        console.error("Unexpected error:", error);
        setLoginStatus("failure");
        setLoginMessage("An unexpected error occurred.");
        setTimeout(() => setLoginStatus(null), 1500);
      }
    }
  };

  const handleLogin = () => {
    if (email && password) {
      fetchUserCredentials();
    } else {
      setLoginStatus("failure");
      setLoginMessage("Please enter your credentials");
      setTimeout(() => setLoginStatus(null), 1500);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('userId'); // Clear userId from storage
    setUserId(null); // Clear userId from context
    navigation.navigate('Login'); // Navigate to login screen after logout
  };

  if (loading) {
    // Display a loading indicator while checking login status
    return (
      <View style={tw`flex-1 justify-center items-center`}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={tw`flex-1`}>
      {loginStatus && (
        <Modal
          transparent={true}
          animationType="slide"
          visible={true}
          onRequestClose={() => setLoginStatus(null)}
        >
          <View
            style={tw`flex-1 justify-center items-center bg-black bg-opacity-50`}
          >
            <View style={tw`bg-white p-6 rounded-lg`}>
              <LottieView
                source={
                  loginStatus === "success"
                    ? require("../assets/login_success.json")
                    : require("../assets/login_fail.json")
                }
                autoPlay
                loop={false}
                style={tw`w-60 h-60`}
              />
              <Text style={tw`text-center text-lg mt-4`}>{loginMessage}</Text>
            </View>
          </View>
        </Modal>
      )}

      {/* Login Form */}
      <View
        style={[
          tw`flex-1 bg-blue-600 justify-center px-4`,
          {
            borderBottomLeftRadius: 10,
            borderBottomRightRadius: 190,
            borderTopLeftRadius: 190,
          },
        ]}
      >
        <View
          style={tw`absolute top-20 left-5 right-5 flex-row justify-between items-center`}
        >
          <View>
            <Text style={tw`text-white text-xs font-bold `}>
              Login to Continue..
            </Text>
            <Text style={tw`text-white text-2xl font-bold mb-40`}>
              WELCOME!
            </Text>
          </View>
          <Image
            source={{
              uri: "https://download.logo.wine/logo/Hexaware_Technologies/Hexaware_Technologies-Logo.wine.png",
            }}
            style={tw`w-30 h-25 mb-45`}
          />
        </View>

        {/* Email Input */}
        <View
          style={tw`flex-row items-center bg-white rounded-lg px-4 py-3 mb-4 mt-20`}
        >
          <FontAwesome
            name="envelope"
            size={20}
            color="black"
            style={tw`mr-3`}
          />
          <TextInput
            style={tw`flex-1 text-base text-gray-800`}
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor="#aaa"
          />
        </View>

        {/* Password Input */}
        <View style={tw`flex-row items-center bg-white rounded-lg px-4 py-3 `}>
          <MaterialIcons name="lock" size={20} color="black" style={tw`mr-3`} />
          <TextInput
            style={tw`flex-1 text-base text-gray-800`}
            placeholder="Enter your password"
            secureTextEntry={!isPasswordVisible}
            value={password}
            onChangeText={setPassword}
            placeholderTextColor="#aaa"
          />
          <TouchableOpacity onPress={togglePasswordVisibility}>
            <MaterialIcons
              name={isPasswordVisible ? "visibility" : "visibility-off"}
              size={20}
              color="black"
            />
          </TouchableOpacity>
        </View>

        {/* Remember Me & Forgot Password */}
        <View style={tw`flex-row justify-between items-center mb-5`}>
          <View style={tw`flex-row items-center`}>
            <Checkbox
              status={rememberMe ? "checked" : "unchecked"}
              onPress={() => setRememberMe(!rememberMe)}
              color="#fff"
              uncheckedColor="#fff"
            />
            <Text style={tw`text-white`}>Remember me</Text>
          </View>
          <TouchableOpacity>
            <Text style={tw`text-white underline`}>Forgot password?</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* White Background Section */}
      <View style={tw`bg-white pt-5 items-center h-1/6`}>
        <TouchableOpacity
          style={tw`bg-blue-600 rounded-lg py-4 mb-5 w-1/2 items-center`}
          onPress={handleLogin}
        >
          <Text style={tw`text-white text-lg font-bold`}>LOGIN</Text>
        </TouchableOpacity>
        
      </View>
    </View>
  );
};

export default Login;
