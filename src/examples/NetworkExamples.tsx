/**
 * Network Handling Examples
 * 
 * This file demonstrates various ways to use the network handling system
 * in your React Native application.
 * 
 * DO NOT import this file in production code - it's for reference only.
 */

import React, { useEffect } from 'react';
import { View, Text, Button, StyleSheet, Alert } from 'react-native';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import NoInternetScreen from '../components/NoInternetScreen';
import NoInternetBanner from '../components/NoInternetBanner';
import {
  checkInternetConnection,
  executeWhenOnline,
  retryWithBackoff,
  waitForConnection,
  isWiFiConnection,
} from '../utils/networkUtils';

/**
 * Example 1: Basic usage with hook
 * Shows how to check connection status in any component
 */
export const BasicNetworkExample = () => {
  const { isConnected, status, refresh } = useNetworkStatus();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Network Status</Text>
      <Text style={styles.status}>
        Status: {status} {isConnected ? '✅' : '❌'}
      </Text>
      <Button title="Refresh Status" onPress={refresh} />
    </View>
  );
};

/**
 * Example 2: Conditional rendering based on network status
 * Show different UI when offline
 */
export const ConditionalRenderExample = () => {
  const { isConnected } = useNetworkStatus();

  if (!isConnected) {
    return <NoInternetScreen />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>You're Online!</Text>
      <Text>This content is only shown when connected.</Text>
    </View>
  );
};

/**
 * Example 3: Custom offline screen with retry
 * Shows how to customize the offline screen
 */
export const CustomOfflineScreenExample = () => {
  const { isConnected, refresh } = useNetworkStatus();

  const handleRetry = async () => {
    await refresh();
    if (isConnected) {
      Alert.alert('Success', 'Connection restored!');
    }
  };

  if (!isConnected) {
    return (
      <NoInternetScreen
        title="Oops! No Internet"
        message="We couldn't connect to the internet. Please check your connection and try again."
        showRetryButton={true}
        retryButtonText="Retry Connection"
        onRetry={handleRetry}
      />
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Online Content</Text>
    </View>
  );
};

/**
 * Example 4: Custom banner position
 * Shows banner at bottom instead of top
 */
export const CustomBannerExample = () => {
  const { isConnected } = useNetworkStatus();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Custom Banner Example</Text>
      {!isConnected && (
        <NoInternetBanner
          position="bottom"
          message="🔌 Connection Lost"
          animationDuration={400}
        />
      )}
    </View>
  );
};

/**
 * Example 5: Network-dependent API call
 * Shows how to handle API calls with network checking
 */
export const NetworkDependentAPIExample = () => {
  const { isConnected } = useNetworkStatus();

  const fetchData = async () => {
    if (!isConnected) {
      Alert.alert('No Internet', 'Please connect to the internet to fetch data.');
      return;
    }

    try {
      // Your API call here
      const response = await fetch('https://api.example.com/data');
      const data = await response.json();
      console.log('Data fetched:', data);
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to fetch data. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>API Call Example</Text>
      <Button
        title="Fetch Data"
        onPress={fetchData}
        disabled={!isConnected}
      />
      {!isConnected && (
        <Text style={styles.warning}>
          Connect to internet to enable this feature
        </Text>
      )}
    </View>
  );
};

/**
 * Example 6: Using network utilities
 * Shows how to use utility functions for advanced scenarios
 */
export const NetworkUtilitiesExample = () => {
  const checkConnection = async () => {
    const isOnline = await checkInternetConnection();
    Alert.alert('Connection Status', isOnline ? 'Online' : 'Offline');
  };

  const checkWiFi = async () => {
    const isWiFi = await isWiFiConnection();
    Alert.alert('WiFi Status', isWiFi ? 'Connected to WiFi' : 'Not on WiFi');
  };

  const waitAndExecute = async () => {
    Alert.alert('Info', 'Waiting for connection...');
    const connected = await waitForConnection(10000);
    
    if (connected) {
      Alert.alert('Success', 'Connection established!');
    } else {
      Alert.alert('Timeout', 'Could not connect within 10 seconds');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Network Utilities</Text>
      <Button title="Check Connection" onPress={checkConnection} />
      <Button title="Check WiFi" onPress={checkWiFi} />
      <Button title="Wait for Connection" onPress={waitAndExecute} />
    </View>
  );
};

/**
 * Example 7: Execute function when online
 * Automatically waits for connection before executing
 */
export const ExecuteWhenOnlineExample = () => {
  const handleSubmit = async () => {
    const result = await executeWhenOnline(async () => {
      // This will only execute when online
      // If offline, it waits for connection (up to timeout)
      const response = await fetch('https://api.example.com/submit', {
        method: 'POST',
        body: JSON.stringify({ data: 'example' }),
      });
      return await response.json();
    }, 10000); // 10 second timeout

    if (result) {
      Alert.alert('Success', 'Data submitted successfully!');
    } else {
      Alert.alert('Error', 'Could not connect to submit data');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Execute When Online</Text>
      <Button title="Submit Data" onPress={handleSubmit} />
      <Text style={styles.info}>
        This will automatically wait for connection if offline
      </Text>
    </View>
  );
};

/**
 * Example 8: Retry with exponential backoff
 * Automatically retries failed requests with increasing delays
 */
export const RetryWithBackoffExample = () => {
  const fetchWithRetry = async () => {
    try {
      const data = await retryWithBackoff(
        async () => {
          const response = await fetch('https://api.example.com/data');
          if (!response.ok) throw new Error('Request failed');
          return await response.json();
        },
        3, // Max 3 retries
        1000 // Start with 1 second delay
      );
      
      Alert.alert('Success', 'Data fetched with retry!');
      console.log('Data:', data);
    } catch (error) {
      Alert.alert('Error', 'Failed after multiple retries');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Retry with Backoff</Text>
      <Button title="Fetch with Auto-Retry" onPress={fetchWithRetry} />
      <Text style={styles.info}>
        Automatically retries up to 3 times with exponential backoff
      </Text>
    </View>
  );
};

/**
 * Example 9: Listen to connection changes
 * React to connection status changes in real-time
 */
export const ConnectionChangeListenerExample = () => {
  const { isConnected } = useNetworkStatus();

  useEffect(() => {
    if (isConnected) {
      console.log('✅ Connection restored - sync data');
      // Sync pending data, refresh content, etc.
    } else {
      console.log('❌ Connection lost - queue operations');
      // Queue operations, show cached data, etc.
    }
  }, [isConnected]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Connection Change Listener</Text>
      <Text style={styles.status}>
        Current Status: {isConnected ? 'Online ✅' : 'Offline ❌'}
      </Text>
      <Text style={styles.info}>
        Check console for connection change logs
      </Text>
    </View>
  );
};

/**
 * Example 10: Screen with integrated offline handling
 * Complete example of a screen with proper offline handling
 */
export const CompleteScreenExample = () => {
  const { isConnected, refresh } = useNetworkStatus();
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);

  const loadData = async () => {
    if (!isConnected) {
      Alert.alert('No Internet', 'Please connect to the internet first.');
      return;
    }

    setLoading(true);
    try {
      const result = await retryWithBackoff(async () => {
        const response = await fetch('https://api.example.com/data');
        return await response.json();
      });
      setData(result);
    } catch (error) {
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected) {
      loadData();
    }
  }, [isConnected]);

  if (!isConnected) {
    return (
      <NoInternetScreen
        onRetry={async () => {
          await refresh();
          if (isConnected) {
            loadData();
          }
        }}
      />
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Complete Screen Example</Text>
      {loading ? (
        <Text>Loading...</Text>
      ) : (
        <Text>Data: {JSON.stringify(data)}</Text>
      )}
      <Button title="Refresh" onPress={loadData} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  status: {
    fontSize: 16,
    marginBottom: 20,
  },
  warning: {
    color: '#FF6B6B',
    marginTop: 10,
    textAlign: 'center',
  },
  info: {
    color: '#666',
    marginTop: 10,
    textAlign: 'center',
    fontSize: 12,
  },
});

