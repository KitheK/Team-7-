import { Pressable, Text, type PressableProps } from "react-native";

const variantClasses = {
  default: "bg-primary active:bg-primary-700",
  outline: "border border-border bg-transparent active:bg-muted",
  ghost: "bg-transparent active:bg-muted",
  destructive: "bg-destructive active:bg-red-700",
  link: "bg-transparent",
};

const variantTextClasses = {
  default: "text-white",
  outline: "text-foreground",
  ghost: "text-foreground",
  destructive: "text-white",
  link: "text-primary underline",
};

const sizeClasses = {
  sm: "px-3 py-1.5 rounded-md",
  default: "px-4 py-2.5 rounded-lg",
  lg: "px-6 py-3 rounded-lg",
  icon: "p-2 rounded-lg",
};

const sizeTextClasses = {
  sm: "text-xs",
  default: "text-sm",
  lg: "text-base",
  icon: "text-sm",
};

interface ButtonProps extends PressableProps {
  variant?: keyof typeof variantClasses;
  size?: keyof typeof sizeClasses;
  className?: string;
  textClassName?: string;
  children: React.ReactNode;
}

export function Button({
  variant = "default",
  size = "default",
  className = "",
  textClassName = "",
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <Pressable
      className={`flex-row items-center justify-center ${variantClasses[variant]} ${sizeClasses[size]} ${disabled ? "opacity-50" : ""} ${className}`}
      disabled={disabled}
      {...props}
    >
      {typeof children === "string" ? (
        <Text className={`font-semibold ${variantTextClasses[variant]} ${sizeTextClasses[size]} ${textClassName}`}>
          {children}
        </Text>
      ) : (
        children
      )}
    </Pressable>
  );
}
