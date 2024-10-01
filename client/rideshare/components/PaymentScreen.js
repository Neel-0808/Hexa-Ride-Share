import React, { useState, useEffect } from 'react';
import { View, Text, Button, Alert, StyleSheet, TextInput, TouchableOpacity, Linking } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';

const PaymentScreen = () => {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [merchantId, setMerchantId] = useState('');
  const [amount, setAmount] = useState('');
  const [upiLink, setUpiLink] = useState('');

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera permission is required to scan QR codes.');
      }
    })();
  }, []);

  const handleBarCodeScanned = ({ type, data }) => {
    setScanning(false);

    // Extract UPI details from the QR code
    const params = new URLSearchParams(data.split('?')[1]);
    const payeeAddress = params.get('pa'); // UPI ID
    const payeeName = params.get('pn'); // Payee Name
    const scannedAmount = params.get('am'); // Amount (optional)
    const currency = params.get('cu') || 'INR'; // Currency (optional, default to INR)

    if (payeeAddress) {
      setMerchantId(payeeAddress);

      // Generate UPI deep link without amount if not present
      const upiUrl = `upi://pay?pa=${payeeAddress}&pn=${payeeName || 'Merchant'}&cu=${currency}`;
      setUpiLink(upiUrl);

      Alert.alert('QR Code Scanned', `Merchant UPI ID: ${payeeAddress}`);
    } else {
      Alert.alert('Invalid QR Code', 'The scanned QR code does not contain valid UPI information.');
    }
  };

  const handleOpenUpiApp = () => {
    if (upiLink && amount) {
      // Add the amount to the UPI link
      const finalUpiLink = `${upiLink}&am=${amount}`;
      Linking.openURL(finalUpiLink)
        .catch(() => {
          Alert.alert('Error', 'Unable to open UPI app. Please ensure you have a UPI app installed.');
        });
    } else {
      Alert.alert('Error', 'Please enter a valid amount.');
    }
  };

  if (hasPermission === null) {
    return <View><Text>Requesting camera permission...</Text></View>;
  }

  if (hasPermission === false) {
    return <View><Text>No access to camera. Please enable camera permissions in your settings.</Text></View>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Pay via QR Code</Text>
      {!scanning && !upiLink && (
        <Button title="Start Scanning" onPress={() => setScanning(true)} color="#007bff" />
      )}
      {scanning && (
        <View style={styles.scannerContainer}>
          <BarCodeScanner
            onBarCodeScanned={handleBarCodeScanned}
            style={styles.camera}
            barCodeTypes={[BarCodeScanner.Constants.BarCodeType.qr]}
          />
          <View style={styles.overlay}>
            <Text style={styles.scannedText}>Scan a QR code</Text>
          </View>
        </View>
      )}
      {upiLink && (
        <>
          <Text style={styles.receiverText}>Merchant UPI ID: {merchantId}</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Amount"
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
          />
          <TouchableOpacity onPress={handleOpenUpiApp} style={styles.upiLinkButton}>
            <Text style={styles.upiLinkText}>Pay via UPI</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  header: {
    fontSize: 20,
    marginBottom: 20,
    fontWeight: 'bold',
  },
  scannerContainer: {
    position: 'relative',
    width: 300,
    height: 300,
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: 10,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  camera: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannedText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  receiverText: {
    marginTop: 20,
    fontSize: 16,
    fontWeight: 'bold',
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginTop: 10,
    paddingHorizontal: 10,
    width: '100%',
  },
  upiLinkButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#28a745',
    borderRadius: 5,
  },
  upiLinkText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default PaymentScreen;
