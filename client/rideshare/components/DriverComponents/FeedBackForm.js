import React, { useState } from 'react';
import { View, Text, TextInput, Button, Picker, Alert, StyleSheet } from 'react-native';
import axios from 'axios';

const FeedbackForm = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [feedbackText, setFeedbackText] = useState('');
  const [rating, setRating] = useState('');
  const [selectedIssue, setSelectedIssue] = useState('');

  // Hardcoded list of common issues
  const commonIssues = [
    "Issue in car",
    "Issue with driver",
    "Not comfortable",
    "Late arrival",
    "Route problem",
    "Payment issue"
  ];

  const submitFeedback = async () => {
    const feedbackData = {
      name,
      email,
      role,
      feedback_text: feedbackText,
      rating: parseInt(rating),
      issue: selectedIssue
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

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Name</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Enter your name"
      />

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="Enter your email"
        keyboardType="email-address"
      />

      <Text style={styles.label}>Role</Text>
      <TextInput
        style={styles.input}
        value={role}
        onChangeText={setRole}
        placeholder="Enter your role (rider/driver)"
      />

      <Text style={styles.label}>Feedback</Text>
      <TextInput
        style={styles.input}
        value={feedbackText}
        onChangeText={setFeedbackText}
        placeholder="Enter your feedback"
        multiline
      />

      <Text style={styles.label}>Rating</Text>
      <TextInput
        style={styles.input}
        value={rating}
        onChangeText={setRating}
        placeholder="Enter your rating (1-5)"
        keyboardType="numeric"
      />

      <Text style={styles.label}>Select an Issue</Text>
      <Picker
        selectedValue={selectedIssue}
        style={styles.picker}
        onValueChange={(itemValue, itemIndex) => setSelectedIssue(itemValue)}
      >
        <Picker.Item label="Select an issue..." value="" />
        {commonIssues.map((issue, index) => (
          <Picker.Item key={index} label={issue} value={issue} />
        ))}
      </Picker>

      <Button title="Submit Feedback" onPress={submitFeedback} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  picker: {
    height: 50,
    width: '100%',
    marginBottom: 16,
  },
});

export default FeedbackForm;
