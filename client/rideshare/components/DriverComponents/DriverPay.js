import React, { useState } from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import tw from "twrnc"; // Tailwind for React Native
import QRCode from "react-native-qrcode-svg"; // For QR code generation

const PaymentScreen = ({ navigation }) => {
  const [rideAmount, setRideAmount] = useState(250); // Example ride amount
  const [userName, setUserName] = useState("Riya"); // Example user name

  const handleFeedbackPress = () => {
    // Navigate to feedback screen
    navigation.navigate("FeedbackScreen");
  };

  const handleHomePress = () => {
    // Navigate back to home screen
    navigation.navigate("HomeScreen");
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-white`}>
      {/* Top Bar with back button and title */}
      <View style={tw`flex-row items-center p-4`}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={tw`text-lg`}>← BACK</Text>
        </TouchableOpacity>
        <Text style={tw`text-xl font-semibold ml-4`}>Payment</Text>
      </View>

      {/* User info and ride amount */}
      <View
        style={tw`flex-row items-center justify-between bg-blue-100 p-4 m-4 rounded-lg`}
      >
        <View style={tw`flex-row items-center`}>
          {/* Placeholder for profile picture */}
          <Image
            source={{ uri: "https://example.com/your-profile-pic.png" }}
            style={tw`w-10 h-10 rounded-full`}
          />
          <Text style={tw`ml-2 text-lg`}>{userName}</Text>
        </View>
        <Text style={tw`text-lg`}>Ride Amount: ₹ {rideAmount}</Text>
      </View>

      {/* QR Code for Payment */}
      <View
        style={tw`items-center justify-center m-4 p-6 border border-gray-300 rounded-lg`}
      >
        <QRCode
          value={`upi://pay?pa=example@upi&pn=${userName}&am=${rideAmount}`}
          size={150}
        />
        <Text style={tw`text-xl mt-4`}>₹ {rideAmount}</Text>
        <TouchableOpacity
          style={tw`absolute top-2 right-2`}
          onPress={() => console.log("Close QR Code")}
        >
          <Text style={tw`text-gray-500`}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Feedback Section */}
      <Text style={tw`text-center text-gray-500 p-4`}>
        Your feedback will help us to improve your user experience better
      </Text>
      <TouchableOpacity
        style={tw`bg-blue-500 p-4 mx-6 rounded-lg`}
        onPress={handleFeedbackPress}
      >
        <Text style={tw`text-white text-center`}>Please Feedback</Text>
      </TouchableOpacity>

      {/* Back to Home Button */}
      <TouchableOpacity
        style={tw`bg-gray-200 p-4 mt-4 mx-6 rounded-lg`}
        onPress={handleHomePress}
      >
        <Text style={tw`text-center`}>Back to Home</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default PaymentScreen;
