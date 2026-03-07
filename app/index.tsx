import { View, Text, ScrollView, Pressable, Image } from "react-native";
import { Link } from "expo-router";
import { Feather } from "@expo/vector-icons";

const features = [
  {
    icon: "cpu" as const,
    title: "AI-Powered Insights",
    description: "Get intelligent recommendations to optimize your spending and maximize savings.",
  },
  {
    icon: "trending-up" as const,
    title: "Price Creep Detection",
    description: "Automatically detect when vendors silently increase your subscription prices.",
  },
  {
    icon: "dollar-sign" as const,
    title: "Automated Negotiations",
    description: "Let AI negotiate better rates with your vendors on your behalf.",
  },
  {
    icon: "pie-chart" as const,
    title: "Spend Analytics",
    description: "Deep analytics into your spending patterns across all categories.",
  },
  {
    icon: "shield" as const,
    title: "Contract Management",
    description: "Track all your contracts, renewal dates, and terms in one place.",
  },
  {
    icon: "zap" as const,
    title: "Smart Automation",
    description: "Automate cancellations, downgrades, and vendor communications.",
  },
];

export default function LandingPage() {
  return (
    <ScrollView className="flex-1 bg-white">
      {/* Nav */}
      <View className="flex-row items-center justify-between px-6 py-4 border-b border-border">
        <View className="flex-row items-center gap-2">
          <View className="w-8 h-8 bg-primary rounded-lg items-center justify-center">
            <Feather name="layers" size={18} color="#fff" />
          </View>
          <Text className="text-xl font-bold text-foreground">WealthGuard</Text>
        </View>
        <View className="flex-row items-center gap-3">
          <Link href="/login" asChild>
            <Pressable className="px-4 py-2 rounded-lg">
              <Text className="text-sm font-medium text-muted-foreground">Sign In</Text>
            </Pressable>
          </Link>
          <Link href="/signup" asChild>
            <Pressable className="px-4 py-2 bg-primary rounded-lg">
              <Text className="text-sm font-medium text-white">Get Started</Text>
            </Pressable>
          </Link>
        </View>
      </View>

      {/* Hero */}
      <View className="px-6 py-16 items-center">
        <View className="bg-primary-50 px-4 py-1.5 rounded-full mb-4">
          <Text className="text-primary text-xs font-semibold">Save up to 30% on SaaS spend</Text>
        </View>
        <Text className="text-4xl font-bold text-foreground text-center mb-4">
          Take Control of Your{"\n"}Software Spending
        </Text>
        <Text className="text-base text-muted-foreground text-center mb-8 max-w-md">
          AI-powered platform that finds hidden savings, negotiates better rates, and automates vendor management for your business.
        </Text>
        <View className="flex-row gap-3">
          <Link href="/signup" asChild>
            <Pressable className="px-6 py-3 bg-primary rounded-lg flex-row items-center gap-2">
              <Text className="text-white font-semibold">Start Free Trial</Text>
              <Feather name="arrow-right" size={16} color="#fff" />
            </Pressable>
          </Link>
          <Pressable className="px-6 py-3 border border-border rounded-lg">
            <Text className="text-foreground font-semibold">Watch Demo</Text>
          </Pressable>
        </View>
      </View>

      {/* Stats */}
      <View className="flex-row justify-around px-6 py-8 bg-muted mx-6 rounded-2xl mb-12">
        {[
          { value: "$2.4M+", label: "Saved for clients" },
          { value: "500+", label: "Companies trust us" },
          { value: "15,000+", label: "Subscriptions managed" },
        ].map((stat) => (
          <View key={stat.label} className="items-center">
            <Text className="text-2xl font-bold text-primary">{stat.value}</Text>
            <Text className="text-xs text-muted-foreground mt-1">{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* Features */}
      <View className="px-6 mb-16">
        <Text className="text-2xl font-bold text-foreground text-center mb-2">
          Everything you need to optimize spend
        </Text>
        <Text className="text-base text-muted-foreground text-center mb-8">
          Powerful tools to manage, analyze, and reduce your software costs.
        </Text>
        <View className="gap-4">
          {features.map((feature) => (
            <View key={feature.title} className="p-5 border border-border rounded-xl">
              <View className="w-10 h-10 bg-primary-50 rounded-lg items-center justify-center mb-3">
                <Feather name={feature.icon} size={20} color="#6366F1" />
              </View>
              <Text className="text-base font-semibold text-foreground mb-1">{feature.title}</Text>
              <Text className="text-sm text-muted-foreground">{feature.description}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* CTA */}
      <View className="px-6 py-12 bg-primary mx-6 rounded-2xl mb-12 items-center">
        <Text className="text-2xl font-bold text-white text-center mb-2">
          Ready to start saving?
        </Text>
        <Text className="text-sm text-primary-200 text-center mb-6">
          Join 500+ companies already saving with WealthGuard.
        </Text>
        <Link href="/signup" asChild>
          <Pressable className="px-6 py-3 bg-white rounded-lg">
            <Text className="text-primary font-semibold">Get Started Free</Text>
          </Pressable>
        </Link>
      </View>

      {/* Footer */}
      <View className="px-6 py-8 border-t border-border items-center">
        <Text className="text-sm text-muted-foreground">
          2026 WealthGuard. All rights reserved.
        </Text>
      </View>
    </ScrollView>
  );
}
