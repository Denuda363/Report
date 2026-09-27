import React, { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, limit, deleteDoc, doc, where, updateDoc, setDoc } from 'firebase/firestore';
import { db, isFirebaseQuotaExceeded, handleFirestoreError, OperationType } from '../lib/firebase';
import { MessageCircle, X, Send, Trash2, ArrowLeft, User, Circle } from 'lucide-react';
import { ChatMessage, ChatUser } from '../types';

import { isFirebaseDb } from '../lib/dbAdapter';

export const ChatBox = () => {
  if (!isFirebaseDb()) return null; // Nonaktifkan chat Firestore jika menggunakan Supabase atau Local DB

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  
  const [localUserId, setLocalUserId] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>('');
  const [isEditingName, setIsEditingName] = useState(false);
  
  const [activeUsers, setActiveUsers] = useState<ChatUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const totalUnread: number = (Object.values(unreadCounts) as number[]).reduce((a, b) => a + b, 0);

  // Initialize local user
  useEffect(() => {
    let storedId = localStorage.getItem('chat_device_id');
    if (!storedId) {
      storedId = Math.random().toString(36).substring(2, 6).toUpperCase();
      localStorage.setItem('chat_device_id', storedId);
    }
    setLocalUserId(storedId);

    let storedName = localStorage.getItem('chat_display_name');
    if (!storedName) {
      storedName = `User ${storedId}`;
      localStorage.setItem('chat_display_name', storedName);
    }
    setDisplayName(storedName);
  }, []);

  // Sync user status to Firestore
  useEffect(() => {
    if (!localUserId || !displayName) return;
    if (isFirebaseQuotaExceeded()) return;
    
    const userRef = doc(db, 'chat_users', localUserId);
    
    const updatePresence = async () => {
      if (isFirebaseQuotaExceeded()) return;
      try {
        await setDoc(userRef, {
          id: localUserId,
          displayName,
          isOnline: true,
          lastSeen: Date.now()
        }, { merge: true });
      } catch (e) {
        try {
          handleFirestoreError(e, OperationType.UPDATE, 'chat_users');
        } catch (err) {
          // ignore thrown error from handleFirestoreError
        }
      }
    };
    
    updatePresence();
    const interval = setInterval(updatePresence, 300000); // every 5 minutes
    
    const handleUnload = () => {
      if (isFirebaseQuotaExceeded()) return;
      // Best effort to set offline
      setDoc(userRef, { isOnline: false, lastSeen: Date.now() }, { merge: true }).catch(() => {});
    };
    window.addEventListener('beforeunload', handleUnload);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleUnload);
      handleUnload();
    };
  }, [localUserId, displayName]);

  const handleSaveName = (newName: string) => {
    if (newName.trim()) {
      localStorage.setItem('chat_display_name', newName.trim());
      setDisplayName(newName.trim());
    }
    setIsEditingName(false);
  };

  // Listen for all users
  useEffect(() => {
    const q = query(collection(db, 'chat_users'), orderBy('lastSeen', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const users: ChatUser[] = [];
      const now = Date.now();
      snapshot.forEach(doc => {
        const u = doc.data() as ChatUser;
        // consider offline if lastSeen > 1 minute ago
        if (now - u.lastSeen > 60000) {
          u.isOnline = false;
        }
        if (u.id !== localUserId) {
          users.push(u);
        }
      });
      setActiveUsers(users);
    });
    return unsub;
  }, [localUserId]);

  // Listen for unread messages (receiverId == localUserId && read == false)
  useEffect(() => {
    if (!localUserId) return;
    const q = query(
      collection(db, 'messages'),
      where('receiverId', '==', localUserId),
      where('read', '==', false)
    );
    
    const unsub = onSnapshot(q, (snapshot) => {
      const counts: Record<string, number> = {};
      snapshot.forEach(doc => {
        const msg = doc.data() as ChatMessage;
        counts[msg.senderId] = (counts[msg.senderId] || 0) + 1;
      });
      setUnreadCounts(counts);
    });
    return unsub;
  }, [localUserId]);

  // Listen to messages when a user is selected
  useEffect(() => {
    if (!localUserId || !selectedUser) {
      setMessages([]);
      return;
    }
    
    const chatId = [localUserId, selectedUser.id].sort().join('_');
    const q = query(
      collection(db, 'messages'),
      where('chatId', '==', chatId),
      orderBy('createdAt', 'desc'),
      limit(100)
    );
    
    const unsub = onSnapshot(q, (snapshot) => {
      const msgs: ChatMessage[] = [];
      snapshot.forEach(doc => {
        msgs.push({ id: doc.id, ...doc.data() } as ChatMessage);
      });
      msgs.reverse();
      setMessages(msgs);
      
      // Mark as read if we are the receiver
      msgs.forEach(msg => {
        if (msg.receiverId === localUserId && !msg.read) {
          if (!isFirebaseQuotaExceeded()) {
            updateDoc(doc(db, 'messages', msg.id), { read: true }).catch(e => {
               try { handleFirestoreError(e, OperationType.UPDATE, 'messages'); } catch (err) {}
            });
          }
        }
      });
    });
    return unsub;
  }, [localUserId, selectedUser]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !localUserId || !selectedUser) return;
    if (isFirebaseQuotaExceeded()) {
      alert("Pesan tidak dapat dikirim karena batas kuota database telah tercapai.");
      return;
    }

    const chatId = [localUserId, selectedUser.id].sort().join('_');
    const msgData = {
      chatId,
      senderId: localUserId,
      receiverId: selectedUser.id,
      text: newMessage.trim(),
      createdAt: Date.now(),
      read: false
    };
    
    setNewMessage('');
    try {
      await addDoc(collection(db, 'messages'), msgData);
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.CREATE, 'messages');
      } catch (err) {
        alert("Gagal mengirim pesan: " + (err as Error).message);
      }
    }
  };

  const handleDeleteMessage = async (id: string) => {
    if (isFirebaseQuotaExceeded()) {
      alert("Pesan tidak dapat dihapus karena batas kuota database telah tercapai.");
      return;
    }
    try {
      await deleteDoc(doc(db, 'messages', id));
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.DELETE, 'messages');
      } catch (err) {
        alert("Gagal menghapus pesan: " + (err as Error).message);
      }
    }
  };

  const formatTime = (timestamp: number) => {
    return new Intl.DateTimeFormat('id-ID', {
      hour: '2-digit', minute: '2-digit'
    }).format(new Date(timestamp));
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={`fixed bottom-20 md:bottom-6 right-4 md:right-6 bg-theme-500 hover:bg-theme-600 text-white p-4 rounded-full shadow-xl transition-all duration-300 z-40 flex items-center justify-center ${totalUnread > 0 ? 'animate-bounce ring-4 ring-rose-400/50 ring-offset-2' : 'hover:scale-110 active:scale-95'}`}
        >
          <MessageCircle className="w-6 h-6" />
          {totalUnread > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center bg-rose-500 rounded-full text-[10px] font-bold border-2 border-white">
              {totalUnread}
            </span>
          )}
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-theme-200 z-50 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
          
          {/* Header */}
          <div className="bg-theme-500 p-4 flex items-center justify-between text-white shrink-0">
            {selectedUser ? (
              <div className="flex items-center gap-3 flex-1">
                <button onClick={() => setSelectedUser(null)} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex flex-col">
                  <span className="font-bold truncate max-w-[150px]">{selectedUser.displayName}</span>
                  <span className="text-[10px] flex items-center gap-1 opacity-90">
                    <Circle className={`w-2 h-2 fill-current ${selectedUser.isOnline ? 'text-green-300' : 'text-neutral-300'}`} />
                    {selectedUser.isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 flex-1 mr-4">
                {isEditingName ? (
                  <input
                    type="text"
                    defaultValue={displayName}
                    autoFocus
                    onBlur={(e) => handleSaveName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSaveName(e.currentTarget.value);
                      } else if (e.key === 'Escape') {
                        setIsEditingName(false);
                      }
                    }}
                    className="w-full px-2 py-1 text-sm text-theme-900 rounded outline-none"
                    placeholder="Your Name"
                    maxLength={20}
                  />
                ) : (
                  <div 
                    className="flex items-center gap-2 cursor-pointer group flex-1"
                    onClick={() => setIsEditingName(true)}
                    title="Edit nama"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <h3 className="font-bold flex items-center gap-2">
                      <span className="truncate max-w-[120px] md:max-w-[180px]">{displayName}</span>
                      <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Edit</span>
                    </h3>
                  </div>
                )}
              </div>
            )}
            
            <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="h-96 overflow-y-auto flex flex-col bg-theme-50">
            {!selectedUser ? (
              // User List
              <div className="flex flex-col">
                <div className="p-3 text-xs font-bold text-theme-500 uppercase tracking-wider bg-theme-100/50">Daftar Pengguna</div>
                {activeUsers.length === 0 ? (
                  <p className="p-4 text-center text-sm text-theme-600-text mt-4">Belum ada pengguna lain.</p>
                ) : (
                  activeUsers.map(u => (
                    <div 
                      key={u.id} 
                      onClick={() => setSelectedUser(u)}
                      className="flex items-center justify-between p-3 border-b border-theme-100 hover:bg-theme-100/50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-10 h-10 bg-theme-200 rounded-full flex items-center justify-center text-theme-700">
                            <User className="w-5 h-5" />
                          </div>
                          <Circle className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-white rounded-full fill-current ${u.isOnline ? 'text-green-500' : 'text-neutral-400'}`} />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-theme-900 text-sm">{u.displayName}</span>
                          <span className="text-xs text-theme-600-text">{u.isOnline ? 'Online' : 'Offline'}</span>
                        </div>
                      </div>
                      {unreadCounts[u.id] > 0 && (
                        <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {unreadCounts[u.id]} baru
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            ) : (
              // Chat Interface
              <div className="p-4 flex flex-col gap-3">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center mt-10">
                    <MessageCircle className="w-12 h-12 text-theme-200 mb-2" />
                    <p className="text-sm text-theme-600-text">Mulai obrolan pribadi dengan {selectedUser.displayName}.</p>
                    <p className="text-xs text-theme-600-text/70 mt-1">Pesan ini hanya bisa dilihat oleh Anda berdua.</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.senderId === localUserId;
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col group ${isMe ? 'items-end' : 'items-start'} max-w-[85%] ${isMe ? 'self-end' : 'self-start'}`}
                      >
                        <div className="flex items-center gap-2 mb-1 px-1">
                          <span className="text-[10px] font-bold text-theme-900">
                            {isMe ? 'Anda' : selectedUser.displayName}
                          </span>
                          <span className="text-[9px] text-theme-600-text">
                            {formatTime(msg.createdAt)}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {isMe && (
                            <button
                              onClick={() => handleDeleteMessage(msg.id)}
                              className="opacity-0 group-hover:opacity-100 p-1.5 text-rose-500 hover:bg-rose-50 rounded-full transition-all"
                              title="Tarik pesan"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          
                          <div
                            className={`px-3 py-2 rounded-2xl text-sm ${
                              isMe
                                ? 'bg-theme-500 text-white rounded-tr-none order-1'
                                : 'bg-white border border-theme-200 text-theme-800 rounded-tl-none order-1'
                            }`}
                          >
                            {msg.text}
                          </div>
                        </div>
                        
                        {isMe && (
                          <div className="text-[9px] text-theme-600-text mt-0.5 px-1 flex items-center justify-end">
                            {msg.read ? (
                              <span className="text-blue-500 font-bold">Dibaca</span>
                            ) : (
                              <span>Terkirim</span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input Area */}
          {selectedUser && (
            <div className="bg-white border-t border-theme-200 shrink-0 flex flex-col">
              <form onSubmit={handleSendMessage} className="p-3 flex items-center gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={`Pesan untuk ${selectedUser.displayName}...`}
                  className="flex-1 px-3 py-2 border border-theme-200 rounded-xl text-sm outline-none focus:border-theme-500 bg-theme-50"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="bg-theme-500 text-white p-2 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </>
  );
};
