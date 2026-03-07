import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { Link } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!email || !password) {
      setError("Please fill in all required fields.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setError("");
    setSuccess("");
    setLoading(true);
    const { error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: name.trim() } },
    });
    setLoading(false);
    if (authError) {
      setError(authError.message);
    } else {
      setSuccess("Check your email to confirm your account.");
    }
  };

  const handleGoogleSignup = async () => {
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: "leanledger://auth-callback" },
    });
    if (authError) setError(authError.message);
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
          <Text className="text-2xl font-bold text-foreground mb-1">Create your account</Text>
          <Text className="text-sm text-muted-foreground">
            Start your 14-day free trial, no credit card required
          </Text>
        </View>

        {/* Social Signup */}
        <View className="gap-3 mb-6">
          <Pressable
            className="flex-row items-center justify-center gap-2 py-3 border border-border rounded-lg"
            onPress={handleGoogleSignup}
          >
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
            <Text className="text-sm font-medium text-foreground mb-1.5">Full Name</Text>
            <TextInput
              className="border border-border rounded-lg px-3.5 py-2.5 text-sm text-foreground"
              placeholder="John Doe"
              placeholderTextColor="#94A3B8"
              value={name}
              onChangeText={setName}
            />
          </View>
          <View>
            <Text className="text-sm font-medium text-foreground mb-1.5">Work Email</Text>
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
            <Text className="text-sm font-medium text-foreground mb-1.5">Password</Text>
            <View className="relative">
              <TextInput
                className="border border-border rounded-lg px-3.5 py-2.5 text-sm text-foreground pr-10"
                placeholder="Create a strong password"
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
            <Text className="text-xs text-muted-foreground mt-1">
              Must be at least 8 characters with a number and special character
            </Text>
          </View>
        </View>

        {/* Error / Success */}
        {error ? (
          <View className="bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 mb-4">
            <Text className="text-sm text-red-600">{error}</Text>
          </View>
        ) : null}
        {success ? (
          <View className="bg-green-50 border border-green-200 rounded-lg px-3 py-2.5 mb-4">
            <Text className="text-sm text-green-700">{success}</Text>
          </View>
        ) : null}

        {/* Submit */}
        <Pressable
          className="bg-primary py-3 rounded-lg items-center mb-4 flex-row justify-center gap-2"
          onPress={handleSignup}
          disabled={loading}
          style={{ opacity: loading ? 0.7 : 1 }}
        >
          {loading && <ActivityIndicator size="small" color="#fff" />}
          <Text className="text-white font-semibold text-sm">Create Account</Text>
        </Pressable>

        <Text className="text-xs text-muted-foreground text-center mb-4">
          By signing up, you agree to our Terms of Service and Privacy Policy.
        </Text>

        <View className="flex-row justify-center gap-1">
          <Text className="text-sm text-muted-foreground">Already have an account?</Text>
          <Link href="/login">
            <Text className="text-sm text-primary font-medium">Sign in</Text>
          </Link>
        </View>
      </View>
    </ScrollView>
  );
}
