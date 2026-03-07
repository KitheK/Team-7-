import { Modal, View, Text, Pressable, type ModalProps } from "react-native";

interface DialogProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function Dialog({ visible, onClose, children }: DialogProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/50 justify-center items-center px-6" onPress={onClose}>
        <Pressable className="bg-white rounded-2xl w-full max-w-md p-0" onPress={(e) => e.stopPropagation()}>
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function DialogHeader({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <View className={`p-5 pb-2 ${className}`}>{children}</View>;
}

export function DialogTitle({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <Text className={`text-lg font-semibold text-foreground ${className}`}>{children}</Text>;
}

export function DialogDescription({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <Text className={`text-sm text-muted-foreground mt-1 ${className}`}>{children}</Text>;
}

export function DialogContent({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <View className={`px-5 py-3 ${className}`}>{children}</View>;
}

export function DialogFooter({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <View className={`p-5 pt-2 flex-row justify-end gap-2 ${className}`}>{children}</View>;
}
