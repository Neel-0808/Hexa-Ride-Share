import React, { useState, useEffect } from 'react';
import { View, Text, Button, Alert, ActivityIndicator, StyleSheet, TextInput } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import AllInOneSDKManager from 'paytm_allinone_react-native'; // Paytm SDK

const PaymentScreen = () => {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [merchantId, setMerchantId] = useState('');
  const [transactionToken, setTransactionToken] = useState('');
  const [callbackUrl, setCallbackUrl] = useState('');
  const [amount, setAmount] = useState('');
  const [orderId, setOrderId] = useState('');

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera permission is required to scan QR codes.');
      }
    })();
  }, []);

  const handleBarCodeScanned = async ({ type, data }) => {
    if (scanning) {
      setScanning(false);

      const params = new URLSearchParams(data.split('?')[1]);
      const payeeAddress = params.get('pa'); // UPI ID
      const payeeName = params.get('pn'); // Payee Name
      const amount = params.get('am'); // Amount
      const currency = params.get('cu'); // Currency

      if (payeeAddress && amount && currency) {
        setMerchantId(payeeAddress);
        setAmount(amount);
        setCallbackUrl(''); // Paytm doesn't include callbackUrl in the QR code
        Alert.alert('QR Code Scanned', `Merchant UPI ID: ${payeeAddress}`);
        
        // Fetch the transaction token after scanning the QR code
        await fetchTransactionToken(payeeAddress);
      } else {
        Alert.alert('Invalid QR Code', 'The scanned QR code does not contain valid payment information.');
        setScanning(true);
      }
    }
  };

  const fetchTransactionToken = async (mid) => {
    try {
      // Send request to your backend API to get the transaction token
      const response = await fetch('https://your-backend-api.com/generateTransactionToken', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mid: mid,
          orderId: `order_${Date.now()}`, // Unique order ID
          amount: amount,
        }),
      });
      
      const data = await response.json();
      if (data && data.body && data.body.txnToken) {
        setTransactionToken(data.body.txnToken); // Set the fetched transaction token
      } else {
        Alert.alert('Error', 'Unable to fetch transaction token');
      }
    } catch (error) {
      console.error('Error fetching transaction token:', error);
      Alert.alert('Error', 'Error fetching transaction token');
    }
  };

  const initiatePayment = async () => {
    if (!amount || !merchantId || !transactionToken) {
      Alert.alert('Invalid Details', 'Please ensure you have scanned a valid QR code and entered a valid amount.');
      return;
    }

    setIsLoading(true);

    // Set unique orderId
    const newOrderId = `order_${Date.now()}`;
    setOrderId(newOrderId);

    try {
      const response = await AllInOneSDKManager.startTransaction(
        newOrderId,
        merchantId,
        transactionToken,
        amount,
        callbackUrl,
        true, // Set this to false for production
        false, // appInvokeRestricted, if you want to limit Paytm app invoke, set to true
        ''
      );
      handleSuccess(response);
    } catch (error) {
      handleFailure(error);
    }
  };

  const handleSuccess = (response) => {
    setIsLoading(false);
    Alert.alert('Payment Success', `Transaction ID: ${response.TXNID}`);
  };

  const handleFailure = (error) => {
    setIsLoading(false);
    Alert.alert('Payment Failed', `Reason: ${error.message}`);
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
      {!scanning && !isLoading && (
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
            <Text style={styles.scannedText}>{merchantId ? `Merchant ID: ${merchantId}` : 'Scan a QR code'}</Text>
          </View>
        </View>
      )}
      {merchantId && !isLoading && (
        <>
          <Text style={styles.receiverText}>Merchant ID: {merchantId}</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Amount"
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
          />
          <Button title="Confirm Payment" onPress={initiatePayment} color="#28a745" style={styles.confirmButton} />
        </>
      )}
      {isLoading && (
        <ActivityIndicator size="large" color="#007bff" style={styles.loader} />
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
  confirmButton: {
    marginTop: 20,
    width: '100%',
  },
  loader: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -25 }, { translateY: -25 }],
  },
});

export default PaymentScreen;
