import InputText from "@/components/InputText";
import { theme } from "@/constants/theme";
import { Button, Text, View } from "react-native";
import Card from "../../components/Card";

export default function LoginScreen() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.colors.background }}>
      <Card>
        <Text style={{ color: theme.colors.textPrimary }}>Login</Text>
        <Text style={{ color: theme.colors.textSecondary }}>
          Please enter your credentials
        </Text>
        <InputText label="Email" type="email" placeholder="Enter your email" />
        <InputText label="Password" type="password" placeholder="Enter your password" />
        <Button title="Login" onPress={() => {}} />
      </Card>
    </View>
  );
}