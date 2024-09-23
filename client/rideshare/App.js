import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import * as Notifications from "expo-notifications"; // Import Notifications
import Login from "./components/Login";
import LocationScreen from "./components/LocationScreen";
import RideShareApp from "./components/RideShareApp";
import MapScreen from "./components/MapScreen";
import ProfilePage from "./components/ProfilePage";
import RoleSelectionScreen from "./components/RoleSelectionScreen";
import DriverHome from "./components/DriverComponents/DriverHome";
import AvailableRides from "./components/AvailableRides";
import RideDetails from "./components/RideDetails";
import PostRideScreen from "./components/DriverComponents/PostRideScreen";
import NotificationScreen from "./components/NotificationScreen";
import GoogleMapScreen from "./components/DriverComponents/GoogleMapScreen";

// Create the stack navigator
const Stack = createStackNavigator();

export default function App() {
  useEffect(() => {
    // Request permissions for notifications
    const requestPermissions = async () => {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        const { status: newStatus } = await Notifications.requestPermissionsAsync();
        if (newStatus !== 'granted') {
          alert('Failed to get push token for push notification!');
          return;
        }
      }

      // Get the Expo push token
      const token = (await Notifications.getExpoPushTokenAsync()).data;
      console.log("Expo Push Token:", token);
      // You can save the token to your backend here
    };

    requestPermissions();
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="Login"
          component={Login}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="LocationScreen"
          component={LocationScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="RoleSelectionScreen"
          component={RoleSelectionScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="RideShareApp"
          component={RideShareApp}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="MapScreen"
          component={MapScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Profile"
          component={ProfilePage}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="DriverHome"
          component={DriverHome}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="AvailableRides"
          component={AvailableRides}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="RideDetails"
          component={RideDetails}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="PostRideScreen"
          component={PostRideScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="NotificationScreen"
          component={NotificationScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="GoogleMapScreen"
          component={GoogleMapScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
