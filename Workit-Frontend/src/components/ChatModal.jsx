import { useState, useEffect } from 'react';
import { useApiClient } from '../hooks/useApiClient';
import '../styles/ChatModal.css';

export const ChatModal = ({ gigId, receiverId, receiverName, onClose }) => {
  const { client } = useApiClient();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMessages();
  }, [gigId, receiverId]);

  const fetchMessages = async () => {
    try {
      const res = await client.get(`/api/messages/conversation/${receiverId}?gigId=${gigId}`);
      setMessages(res.data.data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await client.post('/api/messages', {
        receiverId,
        gigId,
        content: newMessage,
      });
      setNewMessage('');
      fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className="chat-modal-overlay" onClick={onClose}>
      <div className="chat-modal" onClick={(e) => e.stopPropagation()}>
        <div className="chat-header">
          <h3>Chat with {receiverName}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="chat-messages">
          {loading ? (
            <p>Loading...</p>
          ) : messages.length === 0 ? (
            <p className="no-messages">No messages yet</p>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`message ${msg.senderId === receiverId ? 'received' : 'sent'}`}>
                <p>{msg.content}</p>
                <small>{new Date(msg.createdAt).toLocaleTimeString()}</small>
              </div>
            ))
          )}
        </div>

        <form onSubmit={sendMessage} className="chat-input-form">
          <input
            type="text"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={loading}
          />
          <button type="submit" disabled={!newMessage.trim() || loading}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
};
