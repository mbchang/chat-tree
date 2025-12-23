import { ChatMessage } from '@/types/chat';

export interface DeleteButtonProps {
  onDelete: () => void;
}

export interface BranchButtonProps {
  messageId: string;
  onBranch: (messageId: string) => void;
}

export interface MessageBubbleProps {
  message: ChatMessage;
  showBranchButton: boolean;
  onBranch: (messageId: string) => void;
}

export interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onFocus?: () => void;
}

export interface MessageListProps {
  chatHistory: ChatMessage[];
  isLeaf: boolean;
  isLoading?: boolean;
  onBranch: (messageId: string) => void;
}

