import React, { useEffect, useState } from "react";
import {
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import tw from "twrnc";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";
import { useUser } from "./UserContext"; // Assuming you have UserContext for managing user data

const PaymentDetailsScreen = () => {
  const [upiId, setUpiId] = useState("");
  const navigation = useNavigation();
  const { userId, setUpiId: setUpiIdContext } = useUser(); // Retrieve userId and setUpiId from context

  // Fetch existing UPI ID when component mounts
  useEffect(() => {
    const fetchPaymentDetails = async () => {
      try {
        const response = await axios.get(
          `http://192.168.53.164:3000/api/users/${userId}`
        );
        const { upi_id } = response.data;
        setUpiId(upi_id || ""); // Set UPI ID in local state
        setUpiIdContext(upi_id || ""); // Store UPI ID in UserContext
      } catch (error) {
        console.error("Error fetching payment details:", error);
        Alert.alert("Error", "Could not load payment details");
      }
    };

    if (userId) {
      fetchPaymentDetails();
    }
  }, [userId]);

  // Save or update UPI ID
  const handleSavePaymentDetails = async () => {
    if (!upiId) {
      Alert.alert("Error", "Please enter a UPI ID");
      return;
    }

    try {
      const response = await axios.put(
        `http://192.168.53.164:3000/api/users/${userId}/upi`, // Use the new endpoint
        { upi_id: upiId }
      );

      if (response.status === 200) {
        Alert.alert("Success", "Payment details saved successfully!");
        setUpiIdContext(upiId); // Store the updated UPI ID in UserContext
        navigation.goBack();
      }
    } catch (error) {
      console.error("Error saving payment details:", error.response || error.message);
      Alert.alert("Error", "Could not save payment details");
    }
  };

  return (
    <View style={tw`flex-1 justify-center items-center bg-white`}>
      <Text style={tw`text-xl font-bold mb-4`}>Enter Payment Details</Text>

      <TextInput
        style={tw`border border-gray-300 p-3 rounded mb-4 w-3/4`}
        value={upiId}
        onChangeText={setUpiId}
        placeholder="Enter UPI ID"
      />

      <TouchableOpacity
        style={tw`bg-green-500 p-4 rounded w-1/2`}
        onPress={handleSavePaymentDetails}
      >
        <Text style={tw`text-white text-center`}>Save</Text>
      </TouchableOpacity>
    </View>
  );
};

export default PaymentDetailsScreen;
