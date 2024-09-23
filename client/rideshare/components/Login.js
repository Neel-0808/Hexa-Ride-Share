import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Image } from "react-native";
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import { Checkbox } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import axios from "axios"; // Import axios
import tw from "twrnc";
import { useUser } from './UserContext'; // Import useUser

const Login = () => {
  const { setUserId } = useUser(); // Get setUserId from context
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const navigation = useNavigation();

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const fetchUserCredentials = async () => {
    try {
      const response = await axios.get('http://192.168.35.164:3000/api/login', {
        params: {
          email,
          password,
        },
      });

      if (response.status === 200) {
        console.log('Login successful:', response.data);
        const userId = response.data.user.id; // Extract user ID
        setUserId(userId); // Set the user ID in context
        navigation.navigate("LocationScreen"); // Navigate to the next screen
      }
    } catch (error) {
      if (error.response) {
        console.error('Error:', error.response.data.message);
        alert(error.response.data.message); // Show error message to the user
      } else {
        console.error('Unexpected error:', error);
        alert('An unexpected error occurred.');
      }
    }
  };

  const handleLogin = () => {
    if (email && password) {
      fetchUserCredentials(); // Call fetch function to get data from backend
    } else {
      alert("Please enter your credentials");
    }
  };

  return (
    <View style={tw`flex-1`}>
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
