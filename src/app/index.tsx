import { StyleSheet, Text, View } from "react-native";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Coffee Passport</Text>

      <Text style={styles.subtitle}>Desarrollada con React Native</Text>

      <Text style={styles.description}>ELABORADA POR: </Text>

      <Text style={styles.description}>- Corzo Delfin Jose Eduardo. </Text>

      <Text style={styles.description}>-Urias Gaxiola Roberto. </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    fontSize: 24,
    fontWeight: "bold",
  },

  subtitle: {
    fontSize: 16,
    marginTop: 10,
  },

  description: {
    fontSize: 14,
    marginTop: 20,
    textAlign: "center",
  },
});
