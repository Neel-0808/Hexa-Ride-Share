import React, { useState } from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import tw from "twrnc"; // Tailwind for React Native
import QRCode from "react-native-qrcode-svg"; // For QR code generation

const PaymentScreen = ({ navigation }) => {
  const [rideAmount, setRideAmount] = useState(250); // Example ride amount
  const [userName, setUserName] = useState("Riya"); // Example user name
  const [paytmUpiId, setPaytmUpiId] = useState('yourmerchant@paytm'); // Merchant Paytm UPI ID

  const handleFeedbackPress = () => {
    navigation.navigate("FeedbackScreen");
  };

  const handleHomePress = () => {
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
          <Image
            source={{ uri: "https://example.com/your-profile-pic.png" }}
            style={tw`w-10 h-10 rounded-full`}
          />
          <Text style={tw`ml-2 text-lg`}>{userName}</Text>
        </View>
        <Text style={tw`text-lg`}>Ride Amount: ₹ {rideAmount}</Text>
      </View>

      {/* Paytm QR Code for Payment */}
      <View
        style={tw`items-center justify-center m-4 p-6 border border-gray-300 rounded-lg`}
      >
        <QRCode
          value={`upi://pay?pa=${paytmUpiId}&pn=${userName}&am=${rideAmount}&cu=INR`}
          size={150}
        />
        <Text style={tw`text-xl mt-4`}>₹ {rideAmount}</Text>
      </View>

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
