import React, { useState, useEffect } from 'react';
import { View, Text, Button, Alert, StyleSheet, TextInput, SafeAreaView } from 'react-native';
import { Picker } from '@react-native-picker/picker'; // Dropdown component
import axios from 'axios';
import { useUser } from '../UserContext'; // Import UserContext
import { FontAwesome } from '@expo/vector-icons'; // Icon for stars

const FeedbackForm = () => {
  const { userId } = useUser(); // Get userId from UserContext
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('rider'); // Default role
  const [feedbackText, setFeedbackText] = useState('');
  const [selectedIssue, setSelectedIssue] = useState('none'); // Default issue
  const [rating, setRating] = useState(0); // Star rating

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get(
          `http://192.168.58.164:3000/api/users/${userId}`
        );

        console.log("Fetched User Data:", response.data);

        const { username, email } = response.data;

        setUserName(username);
        setEmail(email);
      } catch (error) {
        Alert.alert('Error', 'Failed to fetch user details.');
      }
    };

    fetchUserData();
  }, [userId]);

  const submitFeedback = async () => {
    const feedbackData = {
      name: userName,
      email,
      role,
      feedback_text: feedbackText,
      rating,
      issue: selectedIssue,
    };

    try {
      const response = await axios.post('http://192.168.58.164:3000/api/submit-feedback', feedbackData);

      if (response.status === 200) {
        Alert.alert('Success', 'Feedback submitted successfully!');
      } else {
        Alert.alert('Error', response.data.error || 'Failed to submit feedback');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while submitting feedback');
    }
  };

  const handleRatingPress = (star) => {
    setRating(star);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Heading */}
        <Text style={styles.heading}>Feedback Services</Text>

        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          value={userName}
          editable={false} // Make it non-editable since it comes from fetched data
        />
        
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          editable={false} // Make it non-editable since it comes from fetched data
          keyboardType="email-address"
        />

        <Text style={styles.label}>Role</Text>
        {/* Role Dropdown */}
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={role}
            style={styles.picker}
            onValueChange={(itemValue) => setRole(itemValue)}
          >
            <Picker.Item label="Rider" value="rider" />
            <Picker.Item label="Driver" value="driver" />
          </Picker>
        </View>

        <Text style={styles.label}>Feedback</Text>
        <TextInput
          style={styles.input}
          value={feedbackText}
          onChangeText={setFeedbackText}
          placeholder="Enter your feedback"
          multiline
        />

        <Text style={styles.label}>Rating</Text>
        <View style={styles.starContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <FontAwesome
              key={star}
              name={star <= rating ? 'star' : 'star-o'}
              size={32}
              color="#FFD700"
              onPress={() => handleRatingPress(star)}
            />
          ))}
        </View>

        <Text style={styles.label}>Issue</Text>
        {/* Issue Dropdown */}
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedIssue}
            style={styles.picker}
            onValueChange={(itemValue) => setSelectedIssue(itemValue)}
          >
            <Picker.Item label="None" value="none" />
            <Picker.Item label="App Crash" value="app-crash" />
            <Picker.Item label="Payment Issue" value="payment-issue" />
            <Picker.Item label="Login Issue" value="login-issue" />
            <Picker.Item label="Other" value="other" />
          </Picker>
        </View>

        <Button title="Submit Feedback" onPress={submitFeedback} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    padding: 16,
    marginTop: 20, // Added margin top to lower the form
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
    color: '#333',
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#555',
    fontWeight: 'bold', // Make text bold
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 16,
    paddingHorizontal: 8,
    borderRadius: 8, // Adding some round corners for better UI
    fontWeight: 'bold', // Make text bold
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8, // Added a border and rounded corners for the dropdown
    marginBottom: 16,
    overflow: 'hidden', // To ensure rounded corners are applied to the picker
  },
  picker: {
    height: 50,
    width: '100%',
  },
  starContainer: {
    flexDirection: 'row',
    justifyContent: 'center', // Center stars horizontally
    borderWidth: 1, // Outline for rating container
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 8, // Add some padding inside the outline
    marginBottom: 16,
  },
});

export default FeedbackForm;
