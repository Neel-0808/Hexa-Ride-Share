import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import LottieView from 'lottie-react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome'; // Import from react-native-vector-icons

const WelcomeScreen = ({ navigation }) => {
  const handleGetStarted = () => {
    // Handle the navigation or logic when 'Get Started' is pressed
    navigation.navigate('Login'); // Replace 'HomeScreen' with your desired screen
  };

  return (
    <View style={styles.container}>
      <Image 
        source={require('../assets/Hexaware_Technologies-Logo.wine.png')} // Ensure the logo path is correct
        style={styles.logo} 
      />
      <Text style={styles.title}>Welcome to Rideshare Application</Text>
      <Text style={styles.subtitle}>Your one-stop solution for all your rideshare needs</Text>
      
      {/* Car Lottie Animation */}
      <View style={styles.animationContainer}>
        <LottieView
          source={require('../assets/car_animation.json')} // Ensure the Lottie path is correct
          autoPlay
          loop
          style={styles.lottie}
        />
      </View>

      <TouchableOpacity style={styles.button} onPress={handleGetStarted}>
        <Text style={styles.buttonText}>
          Get Started
        </Text>
        <Text>
          <FontAwesome name="arrow-circle-right" style={styles.icon} /> {/* Wrap the icon inside <Text> */}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',  // Center items vertically
    alignItems: 'center',      // Center items horizontally
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 20,     // Horizontal padding for better layout on wide screens
  },
  logo: {
    width: 180,
    height: 150,
    marginBottom: 30,          // Adequate spacing below the logo
  },
  title: {
    fontSize: 26,              // Larger font size for title
    fontWeight: 'bold',
    marginBottom: 10,          // Spacing below title
    textAlign: 'center',       // Center the title
    color: '#333',             // Dark color for better readability
  },
  subtitle: {
    fontSize: 15,
    marginBottom: 30,          // Spacing below subtitle
    textAlign: 'center',       // Center the subtitle
    color: '#666',             // Lighter color for subtitle
  },
  button: {
    backgroundColor: '#007BFF',
    flexDirection: 'row',      // Align the text and icon in a row
    alignItems: 'center',      // Center the content of the button
    justifyContent: 'center',  // Ensure text and icon are centered
    paddingVertical: 15,       // Vertical padding for better touch target
    paddingHorizontal: 50,     // Add padding to make button wider
    borderRadius: 8,           // Rounded corners for the button
    marginBottom: 50,          // Space below the button
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,              // Larger font size for button text
    fontWeight: 'bold',        // Bold font for emphasis
    marginRight: 10,           // Space between text and icon
  },
  icon: {
    fontSize: 24,              // Size of the arrow icon
    color: '#FFFFFF',
  },
  animationContainer: {
    width: '100%',
    height: 200,
    justifyContent: 'center',  // Center animation vertically
    alignItems: 'center',      // Center animation horizontally
    marginBottom: 20,          // Space between animation and button
  },
  lottie: {
    width: '100%',
    height: '100%',
  },
});

export default WelcomeScreen;