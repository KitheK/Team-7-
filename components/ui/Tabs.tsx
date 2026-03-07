import { View, Text, Pressable, ScrollView } from "react-native";
import { useState, createContext, useContext } from "react";

const TabsContext = createContext<{ value: string; onChange: (v: string) => void }>({ value: "", onChange: () => {} });

interface TabsProps {
  defaultValue: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

export function Tabs({ defaultValue, value: controlledValue, onValueChange, children, className = "" }: TabsProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const value = controlledValue ?? internalValue;
  const onChange = (v: string) => {
    setInternalValue(v);
    onValueChange?.(v);
  };

  return (
    <TabsContext.Provider value={{ value, onChange }}>
      <View className={className}>{children}</View>
    </TabsContext.Provider>
  );
}

export function TabsList({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} className={`bg-muted rounded-lg p-1 ${className}`}>
      <View className="flex-row gap-1">{children}</View>
    </ScrollView>
  );
}

export function TabsTrigger({ value, children, className = "" }: { value: string; children: React.ReactNode; className?: string }) {
  const { value: selected, onChange } = useContext(TabsContext);
  const isActive = selected === value;

  return (
    <Pressable
      onPress={() => onChange(value)}
      className={`px-3 py-1.5 rounded-md ${isActive ? "bg-white shadow-sm" : ""} ${className}`}
    >
      <Text className={`text-sm font-medium ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
        {typeof children === "string" ? children : children}
      </Text>
    </Pressable>
  );
}

export function TabsContent({ value, children, className = "" }: { value: string; children: React.ReactNode; className?: string }) {
  const { value: selected } = useContext(TabsContext);
  if (selected !== value) return null;
  return <View className={`mt-3 ${className}`}>{children}</View>;
}
