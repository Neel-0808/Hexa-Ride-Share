import React, { useState } from "react";
import { View, Text, TouchableOpacity, Image, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import QRCode from "react-native-qrcode-svg"; // For QR code generation
import tw from "twrnc";
import { useUser } from "../UserContext"; // Import UserContext to get UPI ID

const PaymentScreen = ({ navigation, route }) => {
  const { driverName, fare } = route.params; // Retrieve driverName and fare from route params
  const [rideAmount] = useState(fare); // Set ride amount from fare prop
  const [userName] = useState(driverName); // Set user name from driverName prop
  const { upiId } = useUser(); // Retrieve UPI ID from UserContext
  
  // Debugging: Log the UPI ID to the console
  console.log("UPI ID:", upiId);

  const [isLoading, setIsLoading] = useState(false);

  const handleFeedbackPress = () => {
    navigation.navigate("FeedBackForm");
  };

  const handleHomePress = () => {
    navigation.navigate("DriverHome");
  };

  // Simulate payment success for demonstration purposes
  const handlePayment = async () => {
    setIsLoading(true);
    
    // Here you would typically send the payment request to your server
    // For demonstration, we'll just simulate success after a timeout
    setTimeout(() => {
      setIsLoading(false);
      Alert.alert("Payment Success", `You have successfully paid ₹${rideAmount}`);
    }, 2000);
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
      <View style={tw`flex-row items-center justify-between bg-blue-100 p-4 m-4 rounded-lg`}>
        <View style={tw`flex-row items-center`}>
          <Image source={{ uri: "https://example.com/your-profile-pic.png" }} style={tw`w-10 h-10 rounded-full`} />
          <Text style={tw`ml-2 text-lg`}>{userName}</Text>
        </View>
        <Text style={tw`text-lg`}>Ride Amount: ₹ {rideAmount}</Text>
      </View>

      {/* UPI QR Code for Payment */}
      <View style={tw`items-center justify-center m-4 p-6 border border-gray-300 rounded-lg`}>
        <QRCode value={`upi://pay?pa=${upiId}&pn=${userName}&am=${rideAmount}&cu=INR`} size={150} />
        <Text style={tw`text-xl mt-4`}>Scan to Pay ₹ {rideAmount}</Text>
      </View>

      

      {/* Submit Feedback Button */}
      <TouchableOpacity style={tw`bg-blue-500 p-4 mt-4 mx-6 rounded-lg`} onPress={handleFeedbackPress}>
        <Text style={tw`text-white text-center`}>Submit Feedback</Text>
      </TouchableOpacity>

      <TouchableOpacity style={tw`bg-gray-200 p-4 mt-4 mx-6 rounded-lg`} onPress={handleHomePress}>
        <Text style={tw`text-center`}>Back to Home</Text>
      </TouchableOpacity>

      {isLoading && <ActivityIndicator size="large" color="#007bff" style={{ marginTop: 20 }} />}
    </SafeAreaView>
  );
};

export default PaymentScreen;
