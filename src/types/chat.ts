export type ChatMessage = {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
};

export type MessageNodeData = {
  chatHistory: ChatMessage[];
  onSendMessage: (message: string) => Promise<void>;
  onBranch: (messageId: string) => void;
  onDelete: (nodeId: string) => void;
  isLeaf: boolean;
  isRoot?: boolean;
  isLoading?: boolean;
};
