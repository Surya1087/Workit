import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useApiClient } from '../hooks/useApiClient';
import { useSocket } from '../hooks/useSocket';
import { useAuthUser } from '../hooks/useAuthUser';

const Messages = () => {
  const { client, isLoaded } = useApiClient();
  const socket = useSocket();
  const { authUser } = useAuthUser();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [conversations, setConversations] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedUserInfo, setSelectedUserInfo] = useState(null);
  const [deletingConvoId, setDeletingConvoId] = useState(null);
  const [deleteConvoConfirm, setDeleteConvoConfirm] = useState(null);
  const [deletingMessageId, setDeletingMessageId] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const messagesEndRef = useRef(null);

  // Check for user parameter in URL
  useEffect(() => {
    const userParam = searchParams.get('user');
    if (userParam) {
      setSelectedUserId(userParam);
    }
  }, [searchParams]);

  // Fetch conversations
  useEffect(() => {
    if (!client) return;

    let active = true;
    const fetchConversations = async () => {
      setLoading(true);
      try {
        const response = await client.get('/api/messages');
        if (!active) return;
        const data = Array.isArray(response?.data?.data) ? response?.data?.data : [];
        setConversations(data);
        
        // Auto-select first or specified user
        const userParam = searchParams.get('user');
        console.log('📨 Messages - URL param:', userParam, 'Conversations:', data.length);
        if (userParam) {
          console.log('📨 Setting selectedUserId from URL:', userParam);
          setSelectedUserId(userParam);
        } else if (data.length > 0 && !selectedUserId) {
          setSelectedUserId(data[0].userId);
        }
      } catch (error) {
        console.error('Error fetching conversations:', error);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchConversations();
    return () => {
      active = false;
    };
  }, [client, searchParams]);

  // Fetch messages when conversation changes
  useEffect(() => {
    if (!client || !selectedUserId) return;

    let active = true;
    const fetchMessages = async () => {
      try {
        const response = await client.get(`/api/messages/${selectedUserId}`);
        if (!active) return;
        const data = Array.isArray(response?.data?.data) ? response?.data?.data : [];
        setMessages(data);
        
        // Get user info from existing conversation or fetch from URL param
        const convo = conversations.find((c) => c.userId === selectedUserId);
        if (convo) {
          setSelectedUserInfo(convo);
        } else if (!selectedUserInfo) {
          // If no conversation exists but user is selected from URL, fetch user info
          try {
            const userResponse = await client.get(`/api/users/${selectedUserId}`);
            if (userResponse?.data?.data) {
              setSelectedUserInfo({
                userId: selectedUserId,
                userName: userResponse.data.data.name,
                userEmail: userResponse.data.data.email,
              });
            }
          } catch (err) {
            console.error('Error fetching user info:', err);
          }
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    fetchMessages();
    return () => {
      active = false;
    };
  }, [client, selectedUserId, conversations]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Listen for new messages
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (data) => {
      if (data.senderId === selectedUserId) {
        setMessages((prev) => [
          ...prev,
          {
            _id: data.id,
            senderId: data.senderId,
            content: data.content,
            createdAt: data.createdAt,
          },
        ]);
      }

      // Update conversation list
      setConversations((prev) => {
        const updated = prev.map((c) =>
          c.userId === data.senderId
            ? { ...c, lastMessage: data.content, lastMessageTime: data.createdAt }
            : c
        );
        return updated.sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));
      });
    };

    socket.on('message:new', handleNewMessage);
    return () => socket.off('message:new', handleNewMessage);
  }, [socket, selectedUserId]);

  // Send message
  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedUserId) return;

    const tempMessage = messageText;
    setMessageText('');

    try {
      const response = await client.post('/api/messages', {
        receiverId: selectedUserId,
        content: tempMessage,
      });

      if (response?.data?.success) {
        const messageData = response.data.data;
        setMessages((prev) => [
          ...prev,
          {
            _id: messageData.id || messageData._id,
            senderId: messageData.senderId || authUser?.id || authUser?._id,
            content: messageData.content,
            createdAt: messageData.createdAt,
          },
        ]);

        // Update conversation list
        setConversations((prev) => {
          const updated = prev.map((c) =>
            c.userId === selectedUserId
              ? { ...c, lastMessage: tempMessage, lastMessageTime: new Date().toISOString() }
              : c
          );
          return updated.sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessageText(tempMessage);
    }
  };

  // Delete entire conversation
  const handleDeleteConversation = async (userId, userName) => {
    if (!client) return;

    setDeletingConvoId(userId);
    try {
      await client.delete(`/api/messages/${userId}`);
      
      // Remove conversation from list
      setConversations((prev) => prev.filter((c) => c.userId !== userId));
      
      // Clear messages and selection
      if (selectedUserId === userId) {
        setSelectedUserId(null);
        setMessages([]);
        setSelectedUserInfo(null);
      }
      
      setSuccessMessage(`Conversation with ${userName} deleted`);
      setDeleteConvoConfirm(null);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Error deleting conversation:', error);
    } finally {
      setDeletingConvoId(null);
    }
  };

  // Delete specific message
  const handleDeleteMessage = async (messageId) => {
    if (!client || !selectedUserId) return;

    setDeletingMessageId(messageId);
    try {
      await client.delete(`/api/messages/${selectedUserId}/${messageId}`);
      
      // Remove message from list
      setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
    } catch (error) {
      console.error('Error deleting message:', error);
    } finally {
      setDeletingMessageId(null);
    }
  };

  // Format time
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isLoaded || !client) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <p className="text-sm font-medium text-zinc-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-800/60 backdrop-blur-sm border border-zinc-700/50 mb-2">
          <svg className="w-4 h-4 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="text-sm text-zinc-300">Messages</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white">Messages</h1>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="rounded-2xl border border-emerald-800 bg-emerald-900/30 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-emerald-200">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>{successMessage}</span>
            </div>
            <button
              onClick={() => setSuccessMessage(null)}
              className="text-emerald-200 hover:text-emerald-100"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Messages Container */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-96 md:h-[600px] rounded-2xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
        {/* Conversations List */}
        <div className="border-r border-zinc-800 overflow-hidden flex flex-col bg-zinc-900/30">
          <div className="border-b border-zinc-800 p-4 bg-zinc-800/30">
            <h2 className="font-semibold text-white text-sm">Conversations</h2>
          </div>
          <div className="overflow-y-auto flex-1">
            {conversations.length === 0 ? (
              <div className="p-4 text-center text-zinc-400 text-sm">
                No conversations yet. Message someone from a gig!
              </div>
            ) : (
              conversations.map((convo) => (
                <div
                  key={convo.userId}
                  className={`border-b border-zinc-800 hover:bg-zinc-800/50 transition flex items-center justify-between px-4 py-3 ${
                    selectedUserId === convo.userId ? 'bg-zinc-800/70' : ''
                  }`}
                >
                  {/* Conversation Info */}
                  <button
                    onClick={() => setSelectedUserId(convo.userId)}
                    className="flex-1 text-left min-w-0"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="font-semibold text-white truncate text-sm">{convo.userName}</p>
                      {convo.unreadCount > 0 && (
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-zinc-900 text-xs font-bold flex-shrink-0">
                          {convo.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 truncate">{convo.lastMessage}</p>
                    <p className="text-xs text-zinc-500 mt-1">{formatTime(convo.lastMessageTime)}</p>
                  </button>

                  {/* Delete Button - Always Visible */}
                  <button
                    onClick={() => setDeleteConvoConfirm(convo.userId)}
                    className="ml-2 p-2 rounded-lg bg-rose-900/20 text-rose-200 hover:bg-rose-900/40 flex-shrink-0 transition"
                    title="Delete conversation"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>

                  {/* Delete Confirmation Dialog */}
                  {deleteConvoConfirm === convo.userId && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-sm w-full">
                        <h3 className="text-lg font-bold text-white mb-2">Delete Conversation?</h3>
                        <p className="text-zinc-400 mb-6">
                          Are you sure you want to delete all messages with <span className="font-semibold">{convo.userName}</span>? This cannot be undone.
                        </p>
                        <div className="flex gap-3">
                          <button
                            onClick={() => setDeleteConvoConfirm(null)}
                            className="flex-1 px-4 py-2 rounded-lg bg-zinc-800 text-white hover:bg-zinc-700 transition font-medium"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleDeleteConversation(convo.userId, convo.userName)}
                            disabled={deletingConvoId === convo.userId}
                            className="flex-1 px-4 py-2 rounded-lg bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
                          >
                            {deletingConvoId === convo.userId ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Window */}
        <div className="md:col-span-2 flex flex-col overflow-hidden bg-zinc-900/50">
          {selectedUserInfo ? (
            <>
              {/* Chat Header */}
              <div className="border-b border-zinc-800 p-4 bg-zinc-800/30">
                <h3 className="font-semibold text-white">{selectedUserInfo.userName}</h3>
                <p className="text-xs text-zinc-400">{selectedUserInfo.userEmail}</p>
              </div>

              {/* Messages Area */}
              <div className="overflow-y-auto flex-1 p-4 space-y-4 flex flex-col">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-zinc-400 text-sm">
                    No messages yet. Start the conversation!
                  </div>
                ) : (
                  messages.map((msg) => {
                    // Normalize senderId to string for comparison
                    const msgSenderId = typeof msg.senderId === 'object' ? msg.senderId?._id || msg.senderId?.id : msg.senderId;
                    const currentUserId = authUser?.id || authUser?._id;
                    const isOwn = msgSenderId?.toString?.() === currentUserId?.toString?.();
                    
                    return (
                      <div
                        key={msg._id}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group items-end gap-2`}
                      >
                        <div
                          className={`max-w-xs px-4 py-3 rounded-lg break-words ${
                            isOwn
                              ? 'bg-blue-600 text-white rounded-br-none'
                              : 'bg-zinc-800 text-zinc-100 rounded-bl-none'
                          }`}
                        >
                          <p className="text-sm break-words">{msg.content}</p>
                          <p className={`text-xs mt-2 ${isOwn ? 'text-blue-100' : 'text-zinc-500'}`}>
                            {formatTime(msg.createdAt)}
                          </p>
                        </div>

                        {/* Delete Message Button (only for own messages) */}
                        {isOwn && (
                          <button
                            onClick={() => handleDeleteMessage(msg._id)}
                            disabled={deletingMessageId === msg._id}
                            className="p-1 rounded text-rose-400 hover:text-rose-300 opacity-0 group-hover:opacity-100 transition disabled:opacity-50 flex-shrink-0"
                            title="Delete message"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="border-t border-zinc-800 p-4 bg-zinc-800/30">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2 text-sm text-white placeholder-zinc-500 focus:border-zinc-600 focus:ring-2 focus:ring-zinc-600/50 outline-none transition"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!messageText.trim()}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Send
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-zinc-400">
              <p className="text-sm">Select a conversation to start messaging</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;