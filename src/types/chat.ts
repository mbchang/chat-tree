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
  onSetActive: (nodeId: string) => void;
  isLeaf: boolean;
  isRoot?: boolean;
  isLoading?: boolean;
  isOnActivePath?: boolean;
  depth?: number; // Depth in the tree for accent color
  pendingRequestId?: string; // Tracks which API request this node is waiting for
};

export type TreeEdgeData = {
  isActive?: boolean;
};
