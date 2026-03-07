import { View, Text, ScrollView } from "react-native";

export function Table({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View className={`min-w-full ${className}`}>{children}</View>
    </ScrollView>
  );
}

export function TableHeader({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <View className={`border-b border-border ${className}`}>{children}</View>;
}

export function TableBody({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <View className={className}>{children}</View>;
}

export function TableRow({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <View className={`flex-row border-b border-border ${className}`}>{children}</View>;
}

export function TableHead({ children, className = "", width }: { children: React.ReactNode; className?: string; width?: number }) {
  return (
    <View className={`px-4 py-3 ${className}`} style={width ? { width } : { flex: 1 }}>
      <Text className="text-xs font-medium text-muted-foreground uppercase">{children}</Text>
    </View>
  );
}

export function TableCell({ children, className = "", width }: { children: React.ReactNode; className?: string; width?: number }) {
  return (
    <View className={`px-4 py-3 justify-center ${className}`} style={width ? { width } : { flex: 1 }}>
      {typeof children === "string" ? (
        <Text className="text-sm text-foreground">{children}</Text>
      ) : (
        children
      )}
    </View>
  );
}
