import { View, Text, TextInput, Pressable, ScrollView } from "react-native";
import { Link, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = () => {
    router.replace("/(dashboard)");
  };

  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ flexGrow: 1 }}>
      <View className="flex-1 justify-center px-6 py-12">
        {/* Logo */}
        <View className="items-center mb-8">
          <View className="flex-row items-center gap-2 mb-6">
            <View className="w-10 h-10 bg-primary rounded-xl items-center justify-center">
              <Feather name="layers" size={22} color="#fff" />
            </View>
            <Text className="text-2xl font-bold text-foreground">WealthGuard</Text>
          </View>
          <Text className="text-2xl font-bold text-foreground mb-1">Welcome back</Text>
          <Text className="text-sm text-muted-foreground">
            Sign in to your account to continue
          </Text>
        </View>

        {/* Social Login */}
        <View className="gap-3 mb-6">
          <Pressable className="flex-row items-center justify-center gap-2 py-3 border border-border rounded-lg">
            <Feather name="github" size={18} color="#0F172A" />
            <Text className="text-sm font-medium text-foreground">Continue with GitHub</Text>
          </Pressable>
          <Pressable className="flex-row items-center justify-center gap-2 py-3 border border-border rounded-lg">
            <Feather name="mail" size={18} color="#0F172A" />
            <Text className="text-sm font-medium text-foreground">Continue with Google</Text>
          </Pressable>
        </View>

        {/* Divider */}
        <View className="flex-row items-center gap-3 mb-6">
          <View className="flex-1 h-px bg-border" />
          <Text className="text-xs text-muted-foreground">OR</Text>
          <View className="flex-1 h-px bg-border" />
        </View>

        {/* Form */}
        <View className="gap-4 mb-6">
          <View>
            <Text className="text-sm font-medium text-foreground mb-1.5">Email</Text>
            <TextInput
              className="border border-border rounded-lg px-3.5 py-2.5 text-sm text-foreground"
              placeholder="name@company.com"
              placeholderTextColor="#94A3B8"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          <View>
            <View className="flex-row justify-between mb-1.5">
              <Text className="text-sm font-medium text-foreground">Password</Text>
              <Pressable>
                <Text className="text-sm text-primary">Forgot password?</Text>
              </Pressable>
            </View>
            <View className="relative">
              <TextInput
                className="border border-border rounded-lg px-3.5 py-2.5 text-sm text-foreground pr-10"
                placeholder="Enter your password"
                placeholderTextColor="#94A3B8"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <Pressable
                className="absolute right-3 top-2.5"
                onPress={() => setShowPassword(!showPassword)}
              >
                <Feather name={showPassword ? "eye-off" : "eye"} size={18} color="#94A3B8" />
              </Pressable>
            </View>
          </View>
        </View>

        {/* Submit */}
        <Pressable
          className="bg-primary py-3 rounded-lg items-center mb-4"
          onPress={handleLogin}
        >
          <Text className="text-white font-semibold text-sm">Sign In</Text>
        </Pressable>

        <View className="flex-row justify-center gap-1">
          <Text className="text-sm text-muted-foreground">Don't have an account?</Text>
          <Link href="/signup">
            <Text className="text-sm text-primary font-medium">Sign up</Text>
          </Link>
        </View>
      </View>
    </ScrollView>
  );
}
