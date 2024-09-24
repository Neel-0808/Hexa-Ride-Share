import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Modal,
} from "react-native";
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import { Checkbox } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import tw from "twrnc";
import { useUser } from "./UserContext";
import LottieView from "lottie-react-native";

const Login = () => {
  const { setUserId } = useUser();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loginStatus, setLoginStatus] = useState(null);
  const [loginMessage, setLoginMessage] = useState(""); // State for login message
  const navigation = useNavigation();

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const fetchUserCredentials = async () => {
    try {
      const response = await axios.get("http://192.168.29.122:3000/api/login", {
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
      {/* Blue Background Section */}
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
        {/* Logo and Welcome Text */}
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
