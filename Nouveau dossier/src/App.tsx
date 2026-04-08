/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo, Component, useRef } from 'react';
import { 
  signInAnonymously, 
  onAuthStateChanged, 
  User,
  signOut,
  updateProfile
} from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  increment, 
  serverTimestamp, 
  where, 
  getDocs,
  deleteDoc,
  getDoc,
  setDoc,
  limit,
  Timestamp
} from 'firebase/firestore';
import { 
  MessageSquare, 
  Heart, 
  Star, 
  Send, 
  TrendingUp, 
  Clock, 
  Trash2, 
  AlertCircle,
  User as UserIcon,
  ChevronDown,
  ChevronUp,
  LogIn,
  LogOut,
  ShieldAlert,
  Flag,
  Settings,
  X,
  Camera,
  Check,
  Pin,
  Download,
  Mail,
  Trash,
  Bell,
  AtSign,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db, OperationType, handleFirestoreError, loginWithGoogle, logout } from './firebase';

// --- Types ---

interface Post {
  id: string;
  content: string;
  authorId: string;
  createdAt: any;
  likesCount: number;
  favoritesCount: number;
  repliesCount: number;
  score: number;
  isPinned?: boolean;
}

interface Reply {
  id: string;
  postId: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: any;
}

interface Notification {
  id: string;
  userId: string;
  type: 'mention' | 'reply';
  fromId: string;
  fromName: string;
  postId: string;
  content: string;
  isRead: boolean;
  isFavorited?: boolean;
  createdAt: any;
}

interface UserProfile {
  id: string;
  displayName: string;
  photoURL: string;
  lastUsernameChange?: Timestamp;
  role?: string;
  banUntil?: Timestamp;
  isReadOnly?: boolean;
  strikes?: number;
  banCount?: number;
  hasSeenPrivacyWarning?: boolean;
  createdAt?: Timestamp;
}

const BANNED_WORDS = [
  "merde", "con", "connard", "salope", "pute", "enculé", "bite", "couille", "fdp", "ntm",
  "fuck", "shit", "asshole", "bitch", "cunt", "dick", "pussy", "bastard", "nègre", "nigger", "bougnoule", "raton", "pd", "pédé", "goudou", "suce", "branle", "foutre", "nichon", "cul", "clito", "vagin", "pénis", "testicule", "sodomie", "viol", "nazi", "hitler", "daesh", "terroriste", "pute", "salope", "connard", "enculé", "fdp", "ntm", "suce", "bite", "couille", "nichon", "cul", "pd", "pédé", "goudou", "branle", "foutre", "clito", "vagin", "pénis", "testicule", "sodomie", "viol", "nazi", "hitler", "daesh", "terroriste"
];

const checkProfanity = (text: string) => {
  const lowerText = text.toLowerCase();
  // Simple word matching, could be improved with regex for better accuracy
  return BANNED_WORDS.some(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    return regex.test(lowerText);
  });
};

interface Message {
  id: string;
  senderId: string;
  content: string;
  createdAt: any;
  reportId?: string;
  reportOwnerId?: string;
  isRead?: boolean;
  attachment?: string;
  attachmentType?: string;
}

interface Report {
  id: string;
  targetId: string;
  targetType: 'post' | 'reply';
  targetContent?: string;
  reporterId: string;
  reporterName?: string;
  reason: string;
  createdAt: any;
  isRead?: boolean;
}

// --- Error Boundary ---

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorInfo: string | null;
}

class ErrorBoundary extends (Component as any) {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorInfo: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, errorInfo: error.message };
  }

  render() {
    if (this.state.hasError) {
      let parsedError: any = null;
      try {
        parsedError = JSON.parse(this.state.errorInfo || '');
      } catch (e) {
        parsedError = { error: this.state.errorInfo };
      }

      return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-red-500/30 p-8 rounded-2xl max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 text-red-500 mb-4">
              <AlertCircle className="w-8 h-8" />
              <h1 className="text-xl font-bold">Une erreur est survenue</h1>
            </div>
            <p className="text-zinc-400 mb-6 font-medium">
              {parsedError.error || "Une erreur inattendue s'est produite."}
            </p>
            {parsedError.operationType && (
              <div className="text-xs font-mono bg-black/50 p-3 rounded-lg text-zinc-500 mb-6">
                Opération: {parsedError.operationType}<br />
                Chemin: {parsedError.path}
              </div>
            )}
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition-colors"
            >
              Recharger l'application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- Components ---

interface PostCardProps {
  post: Post;
  currentUser: User | null;
  currentUserProfile: UserProfile | null;
  onLike: (postId: string) => void;
  onFavorite: (postId: string) => void;
  onDelete: (postId: string) => void;
  onReport: (targetId: string, type: 'post' | 'reply') => void;
  onPin?: (postId: string) => void;
  onStrike: (userId: string) => Promise<void>;
  onMentions: (text: string, postId: string, fromId: string, fromName: string) => Promise<void>;
  isLiked: boolean;
  isFavorited: boolean;
  isAdmin?: boolean;
  allUsers: UserProfile[];
  replyCooldown: number;
  onReplyCooldownStart: (postId: string) => void;
  onViewProfile: (userId: string) => void;
  key?: React.Key;
}

const PostCard = ({ 
  post, 
  currentUser, 
  currentUserProfile,
  onLike, 
  onFavorite, 
  onDelete,
  onReport,
  onPin,
  onStrike,
  onMentions,
  isLiked,
  isFavorited,
  isAdmin,
  allUsers,
  replyCooldown,
  onReplyCooldownStart,
  onViewProfile
}: PostCardProps) => {
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [authorProfile, setAuthorProfile] = useState<UserProfile | null>(null);
  const [mentionSuggestions, setMentionSuggestions] = useState<UserProfile[]>([]);
  const replyInputRef = useRef<HTMLInputElement>(null);

  const isAnonymous = currentUser?.isAnonymous;

  const isOldMember = useMemo(() => {
    if (!authorProfile?.createdAt) return false;
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    return authorProfile.createdAt.toMillis() < thirtyDaysAgo;
  }, [authorProfile]);

  useEffect(() => {
    const fetchProfile = async () => {
      const docRef = doc(db, 'users', post.authorId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setAuthorProfile({ id: docSnap.id, ...docSnap.data() } as UserProfile);
      }
    };
    fetchProfile();
  }, [post.authorId]);

  useEffect(() => {
    if (!showReplies) return;

    const q = query(
      collection(db, 'replies'),
      where('postId', '==', post.id),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newReplies = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Reply));
      setReplies(newReplies);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `replies (postId: ${post.id})`);
    });

    return () => unsubscribe();
  }, [showReplies, post.id]);

  const handleReplyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setReplyContent(value);

    const lastAt = value.lastIndexOf('@');
    if (lastAt !== -1 && !value.slice(lastAt).includes(' ')) {
      const queryStr = value.slice(lastAt + 1).toLowerCase();
      if (queryStr.length > 0) {
        const filtered = allUsers
          .filter(u => u.displayName.toLowerCase().includes(queryStr))
          .slice(0, 5);
        setMentionSuggestions(filtered);
      } else {
        setMentionSuggestions([]);
      }
    } else {
      setMentionSuggestions([]);
    }
  };

  const insertMention = (user: UserProfile) => {
    const lastAt = replyContent.lastIndexOf('@');
    const newValue = replyContent.slice(0, lastAt) + `@${user.displayName} ` + replyContent.slice(replyInputRef.current?.selectionEnd || replyContent.length);
    setReplyContent(newValue);
    setMentionSuggestions([]);
    replyInputRef.current?.focus();
  };

  const handleAddReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || isAnonymous || !replyContent.trim() || isSubmittingReply || replyCooldown > 0) return;

    setIsSubmittingReply(true);
    try {
      if (checkProfanity(replyContent)) {
        await onStrike(currentUser.uid);
        setReplyContent('');
        setIsSubmittingReply(false);
        return;
      }

      const authorName = currentUserProfile?.displayName || 'Anonyme';

      const replyRef = await addDoc(collection(db, 'replies'), {
        postId: post.id,
        content: replyContent.trim(),
        authorId: currentUser.uid,
        authorName: authorName,
        createdAt: serverTimestamp()
      });

      // Handle mentions
      await onMentions(replyContent, post.id, currentUser.uid, authorName);

      // Notify post author if not the same person
      if (post.authorId !== currentUser.uid) {
        await addDoc(collection(db, 'notifications'), {
          userId: post.authorId,
          type: 'reply',
          fromId: currentUser.uid,
          fromName: authorName,
          postId: post.id,
          content: replyContent.trim(),
          isRead: false,
          createdAt: serverTimestamp()
        });
      }

      await updateDoc(doc(db, 'posts', post.id), {
        repliesCount: increment(1),
        score: increment(2)
      });

      setReplyContent('');
      onReplyCooldownStart(post.id);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'replies');
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const isOwner = currentUser?.uid === post.authorId;

  return (
    <motion.div 
      id={`post-${post.id}`}
      layout
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-lg mb-4"
    >
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => onViewProfile(post.authorId)}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              {authorProfile?.photoURL ? (
                <img src={authorProfile.photoURL} className="w-6 h-6 rounded-full object-cover" alt="" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center">
                  <UserIcon className="w-3 h-3 text-zinc-500" />
                </div>
              )}
              <div className="flex flex-col items-start">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-zinc-300">{authorProfile?.displayName || 'Anonyme'}</span>
                  {isOldMember && (
                    <span title="Membre depuis plus de 30 jours" className="text-amber-500">⭐</span>
                  )}
                </div>
                <span className="text-[10px] text-zinc-500">{post.createdAt?.toDate().toLocaleString() || 'À l\'instant'}</span>
              </div>
            </button>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <button 
                onClick={() => onPin?.(post.id)}
                className={`p-1 transition-colors ${post.isPinned ? 'text-indigo-500' : 'text-zinc-600 hover:text-indigo-400'}`}
                title={post.isPinned ? "Désépingler" : "Épingler"}
              >
                <Pin className={`w-4 h-4 ${post.isPinned ? 'fill-current' : ''}`} />
              </button>
            )}
            <button 
              onClick={() => onReport(post.id, 'post')}
              className="text-zinc-600 hover:text-amber-500 transition-colors p-1"
              title="Signaler"
            >
              <Flag className="w-4 h-4" />
            </button>
            {(isOwner || isAdmin) && (
              <button 
                onClick={() => onDelete(post.id)}
                className="text-zinc-600 hover:text-red-500 transition-colors p-1"
                title="Supprimer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <p className="text-zinc-200 text-lg leading-relaxed mb-6 whitespace-pre-wrap">
          {post.content}
        </p>

        <div className="flex items-center gap-6 text-zinc-400">
          <button 
            onClick={() => onLike(post.id)}
            disabled={isAnonymous || !currentUserProfile}
            className={`flex items-center gap-2 p-1.5 rounded-xl transition-all ${isLiked ? 'text-pink-500 bg-pink-500/10' : 'hover:text-pink-500 hover:bg-pink-500/5'} disabled:opacity-30`}
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
            <span className="text-sm font-bold">{post.likesCount}</span>
          </button>

          <button 
            onClick={() => onFavorite(post.id)}
            disabled={isAnonymous || !currentUserProfile}
            className={`flex items-center gap-2 p-1.5 rounded-xl transition-all ${isFavorited ? 'text-amber-500 bg-amber-500/10' : 'hover:text-amber-500 hover:bg-amber-500/5'} disabled:opacity-30`}
          >
            <Star className={`w-5 h-5 ${isFavorited ? 'fill-current' : ''}`} />
            <span className="text-sm font-bold">{post.favoritesCount}</span>
          </button>

          <button 
            onClick={() => setShowReplies(!showReplies)}
            className={`flex items-center gap-2 p-1.5 rounded-xl transition-all ${showReplies ? 'text-indigo-500 bg-indigo-500/10' : 'hover:text-indigo-500 hover:bg-indigo-500/5'}`}
          >
            <MessageSquare className="w-5 h-5" />
            <span className="text-sm font-bold">{post.repliesCount}</span>
            {showReplies ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showReplies && (
          <motion.div 
            key="replies-container"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-zinc-950/50 border-t border-zinc-800"
          >
            <div className="p-6 space-y-4">
              {replies.map(reply => (
                <div key={reply.id} className="flex gap-3 group">
                  <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0">
                    <UserIcon className="w-4 h-4 text-zinc-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => setReplyContent(`@${reply.authorName} `)}
                          className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                        >
                          {reply.authorName}
                        </button>
                        <span className="text-[10px] text-zinc-600">{reply.createdAt?.toDate().toLocaleTimeString()}</span>
                      </div>
                      <button 
                        onClick={() => onReport(reply.id, 'reply')}
                        className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-amber-500 transition-all"
                      >
                        <Flag className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-sm text-zinc-300">{reply.content}</p>
                  </div>
                </div>
              ))}

              {!isAnonymous && (
                <div className="mt-6 relative">
                  <AnimatePresence>
                    {mentionSuggestions.length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute bottom-full left-0 w-full bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl mb-2 overflow-hidden z-50"
                      >
                        {mentionSuggestions.map(u => (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => insertMention(u)}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-800 transition-colors text-left"
                          >
                            {u.photoURL ? (
                              <img src={u.photoURL} className="w-8 h-8 rounded-full object-cover" alt="" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
                                <UserIcon className="w-4 h-4 text-zinc-500" />
                              </div>
                            )}
                            <span className="text-sm font-bold text-zinc-300">@{u.displayName}</span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <form onSubmit={handleAddReply} className="flex gap-2">
                    <input 
                      ref={replyInputRef}
                      type="text"
                      value={replyContent}
                      onChange={handleReplyChange}
                      placeholder="Répondre..."
                      className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                    <button 
                      disabled={isSubmittingReply || !replyContent.trim() || replyCooldown > 0}
                      className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white p-2 rounded-xl transition-colors min-w-[40px] flex items-center justify-center"
                    >
                      {replyCooldown > 0 ? (
                        <span className="text-xs font-bold">{replyCooldown}s</span>
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </button>
                  </form>
                </div>
              )}
              {isAnonymous && (
                <p className="text-center text-xs text-zinc-600 py-2">Mode lecture seule en anonyme</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// --- Profile Modal ---

const ProfileModal = ({ 
  user, 
  profile, 
  onClose 
}: { 
  user: User; 
  profile: UserProfile | null; 
  onClose: () => void;
  key?: React.Key;
}) => {
  const [name, setName] = useState(profile?.displayName || '');
  const [photo, setPhoto] = useState(profile?.photoURL || '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canChangeName = useMemo(() => {
    if (!profile?.lastUsernameChange) return true;
    const lastChange = profile.lastUsernameChange.toDate();
    const now = new Date();
    const diffDays = Math.ceil((now.getTime() - lastChange.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 14;
  }, [profile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 200 * 1024) { // 200KB limit to avoid Firestore document size limits
        setError("L'image est trop volumineuse (max 200Ko)");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    setError('');

    if (checkProfanity(name)) {
      setError("Le nom d'utilisateur contient des mots inappropriés.");
      return;
    }

    if (name !== profile?.displayName && !canChangeName) {
      setError("Vous ne pouvez changer votre nom qu'une fois tous les 14 jours.");
      return;
    }

    setIsSaving(true);
    try {
      await setDoc(doc(db, 'users', user.uid), {
        displayName: name,
        photoURL: photo,
        lastUsernameChange: name !== profile?.displayName ? serverTimestamp() : (profile?.lastUsernameChange || null)
      }, { merge: true });
      
      await updateProfile(user, { displayName: name, photoURL: photo });
      onClose();
    } catch (err: any) {
      console.error(err);
      setError("Erreur lors de la sauvegarde.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
      >
        <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
          <h2 className="text-xl font-bold">Paramètres du profil</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><X /></button>
        </div>
        
        <form onSubmit={handleSave} className="p-6 space-y-6">
          <div className="flex justify-center">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full bg-zinc-800 overflow-hidden border-2 border-indigo-500/50">
                {photo ? (
                  <img src={photo} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <UserIcon className="w-10 h-10 text-zinc-600" />
                  </div>
                )}
              </div>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-full cursor-pointer"
              >
                <Camera className="w-6 h-6 text-white" />
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/*"
              />
            </div>
          </div>

          <div className="space-y-2 text-center">
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              CHANGER LA PHOTO (MAX 1MO)
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Nom d'utilisateur</label>
            <input 
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!canChangeName}
              placeholder="Votre pseudo..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-200 focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-50"
            />
            {!canChangeName && (
              <p className="text-[10px] text-amber-500">Modifiable une fois par semaine.</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">URL de la photo</label>
            <input 
              type="text"
              value={photo}
              onChange={(e) => setPhoto(e.target.value)}
              placeholder="https://..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-200 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button 
            disabled={isSaving}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
          >
            {isSaving ? 'Sauvegarde...' : 'Enregistrer les modifications'}
            <Check className="w-5 h-5" />
          </button>
        </form>
      </motion.div>
    </div>
  );
};

const PublicProfileModal = ({ 
  userId, 
  onClose,
  allUsers,
  currentUser,
  currentUserProfile,
  onLike,
  onFavorite,
  onDelete,
  onReport,
  onPin,
  onStrike,
  onMentions,
  userLikes,
  userFavorites,
  isAdmin,
  replyCooldowns,
  onReplyCooldownStart,
  onViewProfile
}: { 
  userId: string; 
  onClose: () => void;
  allUsers: UserProfile[];
  currentUser: User | null;
  currentUserProfile: UserProfile | null;
  onLike: (postId: string) => void;
  onFavorite: (postId: string) => void;
  onDelete: (postId: string) => void;
  onReport: (targetId: string, type: 'post' | 'reply') => void;
  onPin?: (postId: string) => void;
  onStrike: (userId: string) => Promise<void>;
  onMentions: (text: string, postId: string, fromId: string, fromName: string) => Promise<void>;
  userLikes: Set<string>;
  userFavorites: Set<string>;
  isAdmin?: boolean;
  replyCooldowns: Record<string, number>;
  onReplyCooldownStart: (postId: string) => void;
  onViewProfile: (userId: string) => void;
}) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const docRef = doc(db, 'users', userId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setProfile({ id: docSnap.id, ...docSnap.data() } as UserProfile);
      }
    };

    const fetchPosts = async () => {
      const q = query(
        collection(db, 'posts'),
        where('authorId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(10)
      );
      const querySnapshot = await getDocs(q);
      const posts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
      setUserPosts(posts);
    };

    Promise.all([fetchProfile(), fetchPosts()]).finally(() => setIsLoading(false));
  }, [userId]);

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-zinc-900 border border-zinc-800 w-full max-w-2xl max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col"
      >
        <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
          <h2 className="text-xl font-bold">Profil de @{profile?.displayName || '...'}</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white p-2 rounded-full hover:bg-zinc-800 transition-colors"><X /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-24 h-24 rounded-full bg-zinc-800 overflow-hidden border-4 border-indigo-500/20">
                  {profile?.photoURL ? (
                    <img src={profile.photoURL} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <UserIcon className="w-10 h-10 text-zinc-600" />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">{profile?.displayName}</h3>
                  <p className="text-zinc-500 text-sm">
                    Membre depuis le {profile?.createdAt?.toDate().toLocaleDateString() || 'Inconnu'}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-800 pb-2">Dernières publications</h4>
                {userPosts.length === 0 ? (
                  <p className="text-center text-zinc-600 py-10 italic">Aucune publication pour le moment.</p>
                ) : (
                  userPosts.map(post => (
                    <PostCard 
                      key={post.id}
                      post={post} 
                      currentUser={currentUser}
                      currentUserProfile={currentUserProfile}
                      onLike={onLike}
                      onFavorite={onFavorite}
                      onDelete={onDelete}
                      onReport={onReport}
                      onPin={onPin}
                      onStrike={onStrike}
                      onMentions={onMentions}
                      isLiked={userLikes.has(post.id)}
                      isFavorited={userFavorites.has(post.id)}
                      isAdmin={isAdmin}
                      allUsers={allUsers}
                      replyCooldown={replyCooldowns[post.id] ?? 0}
                      onReplyCooldownStart={onReplyCooldownStart}
                      onViewProfile={onViewProfile}
                    />
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isSigningInAnonymously, setIsSigningInAnonymously] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sortBy, setSortBy] = useState<'recent' | 'hot' | 'favorites'>('recent');
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());
  const [userFavorites, setUserFavorites] = useState<Set<string>>(new Set());
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [reportTarget, setReportTarget] = useState<{ id: string, type: 'post' | 'reply' } | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [isReporting, setIsReporting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);
  const [adminMessages, setAdminMessages] = useState<Message[]>([]);
  const [showReportMessageModal, setShowReportMessageModal] = useState<{ reportId: string } | null>(null);
  const [reportMessageContent, setReportMessageContent] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [userReports, setUserReports] = useState<Report[]>([]);
  const [userMessages, setUserMessages] = useState<Message[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedReportForChat, setSelectedReportForChat] = useState<Report | null>(null);
  const [showUserDashboard, setShowUserDashboard] = useState(false);
  const [showPrivacyWarning, setShowPrivacyWarning] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showCustomBanModal, setShowCustomBanModal] = useState<{ userId: string } | null>(null);
  const [customBanDuration, setCustomBanDuration] = useState('24'); // hours
  const [customBanReason, setCustomBanReason] = useState('');
  const [reportAttachment, setReportAttachment] = useState<{ data: string, type: string } | null>(null);
  const [userDashboardTab, setUserDashboardTab] = useState<'reports' | 'messages' | 'favorites'>('messages');
  const [adminTab, setAdminTab] = useState<'reports' | 'messages' | 'users'>('reports');

  const [postCooldown, setPostCooldown] = useState(0);
  const cooldownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [replyCooldowns, setReplyCooldowns] = useState<Record<string, number>>({});
  const [postMentionSuggestions, setPostMentionSuggestions] = useState<UserProfile[]>([]);
  const postTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [viewingProfile, setViewingProfile] = useState<string | null>(null);

  const isAdmin = useMemo(() => {
    return userProfile?.role === 'admin' || (user?.email === 'ismailbasly19@gmail.com' && user?.emailVerified);
  }, [userProfile, user]);

  const startPostCooldown = () => {
    setPostCooldown(5);
    if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
    cooldownTimerRef.current = setInterval(() => {
      setPostCooldown(prev => {
        if (prev <= 1) {
          if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startReplyCooldown = (postId: string) => {
    setReplyCooldowns(prev => ({ ...prev, [postId]: 5 }));
    const timer = setInterval(() => {
      setReplyCooldowns(prev => {
        const current = prev[postId] || 0;
        if (current <= 1) {
          clearInterval(timer);
          const next = { ...prev };
          delete next[postId];
          return next;
        }
        return { ...prev, [postId]: current - 1 };
      });
    }, 1000);
  };

  const handlePostContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setContent(value);

    const lastAt = value.lastIndexOf('@');
    if (lastAt !== -1 && !value.slice(lastAt).includes(' ')) {
      const queryStr = value.slice(lastAt + 1).toLowerCase();
      if (queryStr.length > 0) {
        const filtered = allUsers
          .filter(u => u.displayName.toLowerCase().includes(queryStr))
          .slice(0, 5);
        setPostMentionSuggestions(filtered);
      } else {
        setPostMentionSuggestions([]);
      }
    } else {
      setPostMentionSuggestions([]);
    }
  };

  const insertPostMention = (user: UserProfile) => {
    const lastAt = content.lastIndexOf('@');
    const newValue = content.slice(0, lastAt) + `@${user.displayName} ` + content.slice(postTextareaRef.current?.selectionEnd || content.length);
    setContent(newValue);
    setPostMentionSuggestions([]);
    postTextareaRef.current?.focus();
  };

  const handleStrike = async (userId: string) => {
    if (!userProfile) return;
    
    const newStrikes = (userProfile.strikes || 0) + 1;
    let newBanCount = userProfile.banCount || 0;
    let banUntil = userProfile.banUntil || null;

    if (newStrikes >= 3) {
      newBanCount += 1;
      const now = Date.now();
      let duration = 0;
      let durationLabel = "";
      
      if (newBanCount === 1) {
        duration = 24 * 60 * 60 * 1000;
        durationLabel = "1 jour";
      } else if (newBanCount === 2) {
        duration = 7 * 24 * 60 * 60 * 1000;
        durationLabel = "1 semaine";
      } else if (newBanCount === 3) {
        duration = 30 * 24 * 60 * 60 * 1000;
        durationLabel = "1 mois";
      } else {
        duration = 100 * 365 * 24 * 60 * 60 * 1000;
        durationLabel = "À vie";
      }

      banUntil = Timestamp.fromMillis(now + duration);
      
      try {
        await updateDoc(doc(db, 'users', userId), {
          strikes: 0,
          banCount: newBanCount,
          banUntil: banUntil
        });
        alert(`Vous avez été banni pour contenu inapproprié. Durée : ${durationLabel}.`);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
      }
    } else {
      try {
        await updateDoc(doc(db, 'users', userId), {
          strikes: newStrikes
        });
        alert(`Attention : Votre message contient des mots inappropriés. Strike ${newStrikes}/3. Au 3ème strike, vous serez banni.`);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
      }
    }
  };

  // Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Profile Listener
  useEffect(() => {
    if (!user) {
      setUserProfile(null);
      return;
    }

    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as UserProfile;
        if (data.hasSeenPrivacyWarning === undefined) {
          updateDoc(doc(db, 'users', user.uid), { hasSeenPrivacyWarning: false });
        }
        setUserProfile({ id: docSnap.id, ...data } as UserProfile);
      } else {
        // Create a default profile if it doesn't exist
        const defaultName = user.displayName || `Anonyme#${user.uid.slice(-4)}`;
        setDoc(doc(db, 'users', user.uid), {
          displayName: defaultName,
          photoURL: user.photoURL || '',
          role: 'user',
          hasSeenPrivacyWarning: false,
          strikes: 0,
          banCount: 0,
          createdAt: serverTimestamp()
        });
      }
    });

    return () => unsubscribe();
  }, [user]);

  // Fetch User Interactions
  useEffect(() => {
    if (!user || user.isAnonymous) return;

    const likesUnsubscribe = onSnapshot(
      query(collection(db, 'likes'), where('userId', '==', user.uid)),
      (snapshot) => {
        setUserLikes(new Set(snapshot.docs.map(doc => doc.data().postId)));
      }
    );

    const favsUnsubscribe = onSnapshot(
      query(collection(db, 'favorites'), where('userId', '==', user.uid)),
      (snapshot) => {
        setUserFavorites(new Set(snapshot.docs.map(doc => doc.data().postId)));
      }
    );

    return () => {
      likesUnsubscribe();
      favsUnsubscribe();
    };
  }, [user]);

  // Fetch Posts
  useEffect(() => {
    let q;
    if (sortBy === 'favorites') {
      if (!user || user.isAnonymous || userFavorites.size === 0) {
        setPosts([]);
        return;
      }
      // Firestore 'in' query limit is 30
      const favoriteIds = Array.from(userFavorites).slice(0, 30);
      q = query(
        collection(db, 'posts'),
        where('__name__', 'in', favoriteIds)
      );
    } else {
      q = query(
        collection(db, 'posts'),
        orderBy(sortBy === 'recent' ? 'createdAt' : 'score', 'desc'),
        limit(50)
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newPosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
      // If favorites, we might want to sort them by date locally since 'in' query doesn't support orderBy on different field easily without index
      if (sortBy === 'favorites') {
        newPosts.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      }
      setPosts(newPosts);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'posts');
    });

    return () => unsubscribe();
  }, [sortBy, userFavorites, user]);

  // Admin Listeners
  useEffect(() => {
    if (!isAdmin) {
      setReports([]);
      setAdminMessages([]);
      return;
    }

    const reportsUnsubscribe = onSnapshot(
      query(collection(db, 'reports'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        setReports(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Report)));
      },
      (error) => {
        console.error("Reports listener error:", error);
        // Silent fail for non-admins to avoid noise
        if (isAdmin) handleFirestoreError(error, OperationType.LIST, 'reports');
      }
    );

    const messagesUnsubscribe = onSnapshot(
      query(collection(db, 'messages'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        setAdminMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message)));
      },
      (error) => {
        console.error("Messages listener error:", error);
        // Silent fail for non-admins to avoid noise
        if (isAdmin) handleFirestoreError(error, OperationType.LIST, 'messages');
      }
    );

    const usersUnsubscribe = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        setAllUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile)));
      },
      (error) => {
        console.error("Users listener error:", error);
        if (isAdmin) handleFirestoreError(error, OperationType.LIST, 'users');
      }
    );

    return () => {
      reportsUnsubscribe();
      messagesUnsubscribe();
      usersUnsubscribe();
    };
  }, [isAdmin]);

  // User Listeners (for their own reports/messages)
  useEffect(() => {
    if (!user || isAdmin) {
      setUserReports([]);
      setUserMessages([]);
      return;
    }

    const reportsUnsubscribe = onSnapshot(
      query(collection(db, 'reports'), where('reporterId', '==', user.uid), orderBy('createdAt', 'desc')),
      (snapshot) => {
        setUserReports(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Report)));
      }
    );

    const messagesUnsubscribe = onSnapshot(
      query(
        collection(db, 'messages'), 
        where('reportOwnerId', '==', user.uid), 
        orderBy('createdAt', 'desc')
      ),
      (snapshot) => {
        setUserMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message)));
      }
    );

    const notificationsUnsubscribe = onSnapshot(
      query(collection(db, 'notifications'), where('userId', '==', user.uid), orderBy('createdAt', 'desc')),
      (snapshot) => {
        setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification)));
      }
    );

    return () => {
      reportsUnsubscribe();
      messagesUnsubscribe();
      notificationsUnsubscribe();
    };
  }, [user, isAdmin]);

  useEffect(() => {
    if (showUserDashboard && userDashboardTab === 'messages') {
      notifications.forEach(async (n) => {
        if (!n.isRead) {
          await updateDoc(doc(db, 'notifications', n.id), { isRead: true });
        }
      });
    }
  }, [showUserDashboard, userDashboardTab, notifications]);

  useEffect(() => {
    if (selectedReportForChat) {
      const messagesToMark = (isAdmin ? adminMessages : userMessages)
        .filter(m => m.reportId === selectedReportForChat.id && !m.isRead && m.senderId !== user?.uid);
      
      messagesToMark.forEach(async (m) => {
        await updateDoc(doc(db, 'messages', m.id), { isRead: true });
      });

      if (isAdmin && !selectedReportForChat.isRead) {
        updateDoc(doc(db, 'reports', selectedReportForChat.id), { isRead: true });
      }
    }
  }, [selectedReportForChat, isAdmin, adminMessages, userMessages, user]);

  const handleGoToPost = (postId: string) => {
    setShowUserDashboard(false);
    setTimeout(() => {
      const element = document.getElementById(`post-${postId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.classList.add('ring-2', 'ring-indigo-500', 'ring-offset-4', 'ring-offset-black');
        setTimeout(() => {
          element.classList.remove('ring-2', 'ring-indigo-500', 'ring-offset-4', 'ring-offset-black');
        }, 3000);
      }
    }, 300);
  };

  const handleToggleFavoriteNotification = async (notifId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'notifications', notifId), { isFavorited: !currentStatus });
    } catch (error) {
      console.error(error);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !content.trim() || isSubmitting || postCooldown > 0) return;

    setIsSubmitting(true);
    try {
      if (checkProfanity(content)) {
        await handleStrike(user.uid);
        setContent('');
        setIsSubmitting(false);
        return;
      }

      const postRef = await addDoc(collection(db, 'posts'), {
        content: content.trim(),
        authorId: user.uid,
        createdAt: serverTimestamp(),
        likesCount: 0,
        favoritesCount: 0,
        repliesCount: 0,
        score: 0
      });

      await handleMentions(content, postRef.id, user.uid, userProfile?.displayName || 'Anonyme');

      setContent('');
      startPostCooldown();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'posts');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMentions = async (text: string, postId: string, fromId: string, fromName: string) => {
    const mentionRegex = /\B@(\w+)/g;
    const matches = [...text.matchAll(mentionRegex)];
    const mentionedUsernames = [...new Set(matches.map(m => m[1].toLowerCase()))];

    for (const username of mentionedUsernames) {
      const targetUser = allUsers.find(u => u.displayName.toLowerCase() === username);
      if (targetUser && targetUser.id !== fromId) {
        await addDoc(collection(db, 'notifications'), {
          userId: targetUser.id,
          type: 'mention',
          fromId,
          fromName,
          postId,
          content: text,
          isRead: false,
          isFavorited: false,
          createdAt: serverTimestamp()
        });
      }
    }
  };

  useEffect(() => {
    if (userProfile && userProfile.hasSeenPrivacyWarning === false) {
      setShowPrivacyWarning(true);
    }
  }, [userProfile]);

  const handleDismissPrivacyWarning = async () => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), { hasSeenPrivacyWarning: true });
      setShowPrivacyWarning(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const handleLike = async (postId: string) => {
    if (!user || user.isAnonymous) {
      alert("Mode lecture seule en anonyme.");
      return;
    }
    const likeId = `${user.uid}_${postId}`;
    const likeDocRef = doc(db, 'likes', likeId);
    
    try {
      const likeSnap = await getDoc(likeDocRef);
      if (likeSnap.exists()) {
        await deleteDoc(likeDocRef);
        await updateDoc(doc(db, 'posts', postId), {
          likesCount: increment(-1),
          score: increment(-1)
        });
      } else {
        await setDoc(likeDocRef, { userId: user.uid, postId });
        await updateDoc(doc(db, 'posts', postId), {
          likesCount: increment(1),
          score: increment(1)
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `likes/${likeId}`);
    }
  };

  const handleFavorite = async (postId: string) => {
    if (!user || user.isAnonymous) {
      alert("Mode lecture seule en anonyme.");
      return;
    }
    const favId = `${user.uid}_${postId}`;
    const favDocRef = doc(db, 'favorites', favId);
    
    try {
      const favSnap = await getDoc(favDocRef);
      if (favSnap.exists()) {
        await deleteDoc(favDocRef);
        await updateDoc(doc(db, 'posts', postId), {
          favoritesCount: increment(-1),
          score: increment(-3)
        });
      } else {
        await setDoc(favDocRef, { userId: user.uid, postId });
        await updateDoc(doc(db, 'posts', postId), {
          favoritesCount: increment(1),
          score: increment(3)
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `favorites/${favId}`);
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await deleteDoc(doc(db, 'posts', postId));
      setPostToDelete(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `posts/${postId}`);
    }
  };

  const handlePin = async (postId: string) => {
    if (!isAdmin) return;
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    try {
      await updateDoc(doc(db, 'posts', postId), {
        isPinned: !post.isPinned
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `posts/${postId}`);
    }
  };

  const handleBackup = async () => {
    if (!isAdmin) return;
    try {
      const postsSnap = await getDocs(collection(db, 'posts'));
      const repliesSnap = await getDocs(collection(db, 'replies'));
      const reportsSnap = await getDocs(collection(db, 'reports'));
      const messagesSnap = await getDocs(collection(db, 'messages'));

      const data = {
        posts: postsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
        replies: repliesSnap.docs.map(d => ({ id: d.id, ...d.data() })),
        reports: reportsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
        messages: messagesSnap.docs.map(d => ({ id: d.id, ...d.data() })),
        exportDate: new Date().toISOString()
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `anonvoice_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Backup failed:", error);
      alert("Erreur lors de la sauvegarde des données.");
    }
  };

  const handleSendReportMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !showReportMessageModal || !reportMessageContent.trim() || isSendingMessage) return;

    setIsSendingMessage(true);
    try {
      const reportSnap = await getDoc(doc(db, 'reports', showReportMessageModal.reportId));
      const reportData = reportSnap.data();
      
      await addDoc(collection(db, 'messages'), {
        senderId: user.uid,
        content: reportMessageContent.trim(),
        reportId: showReportMessageModal.reportId,
        reportOwnerId: reportData?.reporterId,
        createdAt: serverTimestamp()
      });
      setShowReportMessageModal(null);
      setReportMessageContent('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'messages');
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const type = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'file';
        setReportAttachment({ data: reader.result as string, type });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBanUser = async (userId: string, durationHours: number | 'permanent', reason: string = '') => {
    if (!isAdmin) return;
    try {
      const banUntil = durationHours === 'permanent' 
        ? Timestamp.fromDate(new Date(8640000000000000)) // Far future
        : Timestamp.fromDate(new Date(Date.now() + durationHours * 60 * 60 * 1000));
      
      await updateDoc(doc(db, 'users', userId), { 
        banUntil,
        isReadOnly: true,
        banReason: reason
      });
      setShowCustomBanModal(null);
      setCustomBanReason('');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    }
  };

  const handleSetReadOnly = async (userId: string, isReadOnly: boolean) => {
    if (!isAdmin) return;
    try {
      await updateDoc(doc(db, 'users', userId), { isReadOnly });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    }
  };

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !reportTarget || !reportReason.trim() || isReporting) return;

    setIsReporting(true);
    try {
      let targetContent = "";
      if (reportTarget.type === 'post') {
        const post = posts.find(p => p.id === reportTarget.id);
        targetContent = post?.content || "Contenu introuvable";
      } else {
        const replySnap = await getDoc(doc(db, 'replies', reportTarget.id));
        targetContent = replySnap.exists() ? replySnap.data().content : "Contenu introuvable";
      }

      const reportData = {
        targetId: reportTarget.id,
        targetType: reportTarget.type,
        targetContent,
        reporterId: user.uid,
        reporterName: userProfile?.displayName || 'Anonyme',
        reason: reportReason.trim(),
        createdAt: serverTimestamp()
      };
      
      const reportRef = await addDoc(collection(db, 'reports'), reportData);
      setReportSuccess(true);
      setReportReason('');
      
      setTimeout(() => {
        const id = reportRef.id;
        setReportTarget(null);
        setReportSuccess(false);
        setShowReportMessageModal({ reportId: id });
      }, 2000);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'reports');
    } finally {
      setIsReporting(false);
    }
  };

  const handleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (error) {
      console.error("Login Error:", error);
    }
  };

  const handleAnonymousLogin = async () => {
    if (isSigningInAnonymously) return;
    setIsSigningInAnonymously(true);
    try {
      await signInAnonymously(auth);
    } catch (error) {
      console.error("Anonymous Login Error:", error);
      alert("Erreur lors de la connexion anonyme.");
    } finally {
      setIsSigningInAnonymously(false);
    }
  };

  const sortedPosts = useMemo(() => {
    return [...posts].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return 0;
    });
  }, [posts]);

  const unreadNotificationsCount = useMemo(() => {
    return notifications.filter(n => !n.isRead).length;
  }, [notifications]);

  const unreadMessagesCount = useMemo(() => {
    return (isAdmin ? adminMessages : userMessages).filter(m => !m.isRead && m.senderId !== user?.uid).length;
  }, [isAdmin, adminMessages, userMessages, user]);

  const unreadReportsCount = useMemo(() => {
    return reports.filter(r => !r.isRead).length;
  }, [reports]);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-indigo-500/30">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-900">
          <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 border border-indigo-400/20 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative">
                  <div className="absolute -inset-1 bg-indigo-400/30 blur-sm rounded-full animate-pulse"></div>
                  <MessageSquare className="w-6 h-6 text-white relative z-10" />
                  <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-purple-400 rounded-full border-2 border-indigo-600 animate-bounce"></div>
                </div>
              </div>
              <div className="flex flex-col -space-y-1">
                <h1 className="text-xl font-black tracking-tighter text-white" translate="no">SAFE VOICE</h1>
                <span className="text-[8px] font-bold text-indigo-400 tracking-[0.2em] uppercase pl-0.5">Community</span>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setShowHelpModal(true)}
                className="flex items-center gap-2 text-zinc-500 hover:text-indigo-400 text-xs font-bold transition-colors group"
                title="Règles & Aide"
              >
                <div className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 group-hover:border-indigo-500/50 group-hover:bg-indigo-500/10 transition-all">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <span className="hidden xs:inline">AIDE</span>
              </button>
              <div className="hidden sm:flex bg-zinc-900 p-1 rounded-xl border border-zinc-800">
                <button 
                  onClick={() => setSortBy('recent')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${sortBy === 'recent' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  RÉCENTS
                </button>
                <button 
                  onClick={() => setSortBy('hot')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${sortBy === 'hot' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  POPULAIRES
                </button>
                {user && !user.isAnonymous && (
                  <button 
                    onClick={() => setSortBy('favorites')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${sortBy === 'favorites' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    <Star className="w-3.5 h-3.5" />
                    FAVORIS
                  </button>
                )}
              </div>

              {user ? (
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => {
                      if (isAdmin) {
                        setShowAdminDashboard(true);
                      } else {
                        setShowUserDashboard(true);
                      }
                    }}
                    className="p-2 text-zinc-400 hover:text-indigo-400 relative group"
                    title={isAdmin ? "Dashboard Admin" : "Mes Notifications & Signalements"}
                  >
                    <Mail className="w-5 h-5" />
                    {(unreadNotificationsCount > 0 || unreadMessagesCount > 0 || (isAdmin && unreadReportsCount > 0)) && (
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full border-2 border-zinc-950 flex items-center justify-center animate-bounce">
                        <span className="text-[8px] font-bold text-white">{unreadNotificationsCount + unreadMessagesCount + (isAdmin ? unreadReportsCount : 0)}</span>
                      </span>
                    )}
                  </button>
                  <div className="flex flex-col items-end">
                    <span className="text-xs font-bold text-zinc-300">
                      {userProfile?.displayName || (user?.isAnonymous ? `Anonyme#${user.uid.slice(-4)}` : 'Chargement...')}
                    </span>
                    <button 
                      onClick={() => setShowProfileModal(true)}
                      className="text-[10px] text-zinc-500 hover:text-indigo-400 flex items-center gap-1"
                    >
                      <Settings className="w-2.5 h-2.5" />
                      PROFIL
                    </button>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 overflow-hidden">
                    {userProfile?.photoURL ? (
                      <img src={userProfile.photoURL} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <UserIcon className="w-4 h-4 text-zinc-600" />
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={logout}
                    className="text-zinc-600 hover:text-red-500 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={handleLogin}
                  className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-xl text-xs font-bold hover:bg-zinc-200 transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  CONNEXION
                </button>
              )}
            </div>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 py-8">
          {/* Auth Prompt if not logged in */}
          {!user && (
            <section className="mb-12 bg-indigo-600/10 border border-indigo-500/20 rounded-2xl p-8 text-center">
              <ShieldAlert className="w-12 h-12 text-indigo-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Rejoignez la conversation</h2>
              <p className="text-zinc-400 mb-6 max-w-sm mx-auto">
                Connectez-vous pour publier des messages, liker et interagir avec la communauté <span translate="no">Safe Voice</span>.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button 
                  onClick={handleLogin}
                  className="bg-white text-black px-8 py-3 rounded-xl font-bold hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
                >
                  <LogIn className="w-5 h-5" />
                  Se connecter avec Google
                </button>
                <button 
                  onClick={handleAnonymousLogin}
                  disabled={isSigningInAnonymously}
                  className="bg-zinc-900 text-white px-8 py-3 rounded-xl font-bold border border-zinc-800 hover:bg-zinc-800 transition-colors disabled:opacity-50"
                >
                  {isSigningInAnonymously ? 'Connexion...' : 'Continuer en Anonyme'}
                </button>
              </div>
            </section>
          )}

          {/* Create Post */}
          {user && !user.isAnonymous && (
            <section className="mb-12">
              <form onSubmit={handleCreatePost} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl focus-within:border-indigo-500/50 transition-colors">
                <textarea 
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Qu'avez-vous à dire anonymement ?"
                  maxLength={1000}
                  className="w-full bg-transparent text-zinc-200 text-lg placeholder:text-zinc-600 focus:outline-none resize-none min-h-[120px]"
                />
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-800">
                  <span className="text-xs font-mono text-zinc-600">
                    {content.length}/1000
                  </span>
                  <button 
                    disabled={isSubmitting || !content.trim()}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-indigo-500/20"
                  >
                    {isSubmitting ? 'Publication...' : 'Publier'}
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </section>
          )}

          {user?.isAnonymous && (
            <div className="mb-12 bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-4 text-center">
              <p className="text-xs text-zinc-500">Vous êtes en mode lecture seule. Connectez-vous avec Google pour interagir.</p>
            </div>
          )}

          {/* Feed */}
          <section className="space-y-6">
            <div className="sm:hidden flex justify-center mb-6">
               <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800">
                <button 
                  onClick={() => setSortBy('recent')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${sortBy === 'recent' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  RÉCENTS
                </button>
                <button 
                  onClick={() => setSortBy('hot')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${sortBy === 'hot' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  POPULAIRES
                </button>
                {user && !user.isAnonymous && (
                  <button 
                    onClick={() => setSortBy('favorites')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${sortBy === 'favorites' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    <Star className="w-3.5 h-3.5" />
                    FAVORIS
                  </button>
                )}
              </div>
            </div>

            <AnimatePresence mode="popLayout">
              {sortedPosts.map(post => (
                <PostCard 
                  key={post.id}
                  post={post}
                  currentUser={user}
                  currentUserProfile={userProfile}
                  onLike={handleLike}
                  onFavorite={handleFavorite}
                  onDelete={(id) => setPostToDelete(id)}
                  onReport={(id, type) => setReportTarget({ id, type })}
                  onPin={handlePin}
                  onStrike={handleStrike}
                  onMentions={handleMentions}
                  isAdmin={isAdmin}
                  allUsers={allUsers}
                  isLiked={userLikes.has(post.id)}
                  isFavorited={userFavorites.has(post.id)}
                  replyCooldown={replyCooldowns[post.id] ?? 0}
                  onReplyCooldownStart={startReplyCooldown}
                  onViewProfile={setViewingProfile}
                />
              ))}
            </AnimatePresence>

            {posts.length === 0 && (
              <div className="text-center py-20">
                <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-zinc-800">
                  <MessageSquare className="w-8 h-8 text-zinc-700" />
                </div>
                <h3 className="text-zinc-400 font-medium">Aucun post pour le moment</h3>
                <p className="text-zinc-600 text-sm">Soyez le premier à briser le silence !</p>
              </div>
            )}
          </section>
        </main>

        {/* Profile Modal */}
        <AnimatePresence>
          {showProfileModal && user && (
            <ProfileModal 
              key="profile-modal"
              user={user} 
              profile={userProfile} 
              onClose={() => setShowProfileModal(false)} 
            />
          )}

          {/* Delete Confirmation Modal */}
          {postToDelete && (
            <div key="delete-modal" className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-zinc-900 border border-zinc-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl text-center"
              >
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-xl font-bold mb-2">Supprimer le post ?</h3>
                <p className="text-zinc-400 mb-6 text-sm">Cette action est irréversible.</p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setPostToDelete(null)}
                    className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 rounded-xl transition-colors"
                  >
                    Annuler
                  </button>
                  <button 
                    onClick={() => {
                      handleDeletePost(postToDelete);
                      setPostToDelete(null);
                    }}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-colors"
                  >
                    Supprimer
                  </button>
                </div>
              </motion.div>
            </div>
          )}

          {/* Report Modal */}
          {reportTarget && (
            <div key="report-modal" className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-3xl p-6 shadow-2xl"
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold flex items-center gap-2"><Flag className="w-5 h-5 text-amber-500" /> Signaler</h3>
                  <button onClick={() => setReportTarget(null)} className="text-zinc-500 hover:text-white"><X /></button>
                </div>
                <p className="text-zinc-400 mb-4 text-sm">Pourquoi signalez-vous ce {reportTarget.type === 'post' ? 'post' : 'commentaire'} ?</p>
                {reportSuccess ? (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 p-6 rounded-2xl text-center flex flex-col items-center gap-3">
                    <Check className="w-10 h-10" />
                    <p className="font-bold">Signalement envoyé !</p>
                    <p className="text-xs opacity-80">Merci de nous aider à garder <span translate="no">Safe Voice</span> sûr.</p>
                  </div>
                ) : (
                  <>
                    <textarea 
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      placeholder="Raison du signalement..."
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-200 focus:outline-none focus:border-amber-500 transition-colors min-h-[100px] mb-6"
                    />
                    <button 
                      onClick={handleReport}
                      disabled={isReporting || !reportReason.trim()}
                      className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-amber-500/20"
                    >
                      {isReporting ? 'Envoi...' : 'Envoyer le signalement'}
                    </button>
                  </>
                )}
              </motion.div>
            </div>
          )}

          {/* Report Message Modal */}
          {showReportMessageModal && (
            <div key="report-message-modal" className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl max-w-md w-full shadow-2xl"
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold flex items-center gap-2"><Mail className="w-5 h-5 text-indigo-500" /> Message à l'admin</h3>
                  <button onClick={() => setShowReportMessageModal(null)} className="text-zinc-500 hover:text-white"><X /></button>
                </div>
                <p className="text-zinc-400 mb-4 text-sm">Voulez-vous envoyer un message à l'administrateur pour expliquer votre signalement ?</p>
                <form onSubmit={handleSendReportMessage}>
                  <textarea 
                    value={reportMessageContent}
                    onChange={(e) => setReportMessageContent(e.target.value)}
                    placeholder="Votre message (optionnel)..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-200 focus:outline-none focus:border-indigo-500 transition-colors min-h-[100px] mb-6"
                  />
                  <div className="flex gap-3">
                    <button 
                      type="button"
                      onClick={() => setShowReportMessageModal(null)}
                      className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 rounded-xl transition-colors"
                    >
                      Plus tard
                    </button>
                    <button 
                      type="submit"
                      disabled={isSendingMessage || !reportMessageContent.trim()}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors"
                    >
                      {isSendingMessage ? 'Envoi...' : 'Envoyer'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}

          {/* Admin Dashboard Modal */}
          {showAdminDashboard && isAdmin && (
            <div key="admin-dashboard-modal" className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-2xl w-full h-[80vh] overflow-hidden flex flex-col shadow-2xl"
              >
                <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50 backdrop-blur-md">
                  <h2 className="text-xl font-black flex items-center gap-2">
                    <ShieldAlert className="w-6 h-6 text-indigo-500" />
                    DASHBOARD ADMIN
                  </h2>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={handleBackup}
                      className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      BACKUP
                    </button>
                    <button onClick={() => setShowAdminDashboard(false)} className="text-zinc-500 hover:text-white"><X /></button>
                  </div>
                </div>

                <div className="flex border-b border-zinc-800 bg-zinc-900/30">
                  <button 
                    onClick={() => setAdminTab('reports')}
                    className={`flex-1 py-3 text-xs font-bold transition-colors ${adminTab === 'reports' ? 'text-indigo-500 border-b-2 border-indigo-500' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    SIGNALEMENTS ({reports.length})
                  </button>
                  <button 
                    onClick={() => setAdminTab('messages')}
                    className={`flex-1 py-3 text-xs font-bold transition-colors ${adminTab === 'messages' ? 'text-indigo-500 border-b-2 border-indigo-500' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    MESSAGES ({adminMessages.length})
                  </button>
                  <button 
                    onClick={() => setAdminTab('users')}
                    className={`flex-1 py-3 text-xs font-bold transition-colors ${adminTab === 'users' ? 'text-indigo-500 border-b-2 border-indigo-500' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    UTILISATEURS ({allUsers.length})
                  </button>
                  <button 
                    onClick={() => setAdminTab('stats')}
                    className={`flex-1 py-3 text-xs font-bold transition-colors ${adminTab === 'stats' ? 'text-indigo-500 border-b-2 border-indigo-500' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    STATS
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                  {adminTab === 'reports' && (
                    <section>
                      <div className="space-y-3">
                        {reports.length === 0 ? (
                          <p className="text-zinc-600 text-sm italic">Aucun signalement en attente.</p>
                        ) : (
                          reports.map(report => (
                            <div key={report.id} className="bg-zinc-950 border border-zinc-800 p-4 rounded-2xl">
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex flex-col">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full w-fit mb-1 ${report.targetType === 'post' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-amber-500/10 text-amber-400'}`}>
                                    {report.targetType.toUpperCase()}
                                  </span>
                                  <span className="text-xs text-zinc-400">Par: {report.reporterName} ({report.reporterId})</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button 
                                    onClick={async () => {
                                      if (window.confirm('Supprimer ce signalement ?')) {
                                        await deleteDoc(doc(db, 'reports', report.id));
                                      }
                                    }}
                                    className="text-zinc-600 hover:text-red-500 transition-colors p-1"
                                    title="Supprimer le signalement"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                  <span className="text-[10px] text-zinc-600">{report.createdAt?.toDate().toLocaleString()}</span>
                                </div>
                              </div>
                              <div className="bg-zinc-900/50 p-3 rounded-xl mb-3 border border-zinc-800/50">
                                <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Contenu signalé:</p>
                                <p className="text-sm text-zinc-400 italic line-clamp-2">{report.targetContent}</p>
                              </div>
                              <p className="text-sm text-zinc-300 mb-4 font-medium">Raison: {report.reason}</p>
                              <div className="flex items-center justify-between">
                                <button 
                                  onClick={() => setSelectedReportForChat(report)}
                                  className="text-[10px] text-indigo-500 hover:underline flex items-center gap-1"
                                >
                                  <MessageSquare className="w-3 h-3" />
                                  Discuter avec le reporter
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </section>
                  )}

                  {adminTab === 'messages' && (
                    <section>
                      <div className="space-y-3">
                        {adminMessages.length === 0 ? (
                          <p className="text-zinc-600 text-sm italic">Aucun message.</p>
                        ) : (
                          adminMessages.map(msg => (
                            <div key={msg.id} className="bg-zinc-950 border border-zinc-800 p-4 rounded-2xl">
                              <div className="flex justify-between items-start mb-2">
                                <span className="text-[10px] text-zinc-500">De: {msg.senderId}</span>
                                <span className="text-[10px] text-zinc-600">{msg.createdAt?.toDate().toLocaleString()}</span>
                              </div>
                              <p className="text-sm text-zinc-300">{msg.content}</p>
                              {msg.reportId && (
                                <p className="text-[10px] text-indigo-500 mt-2">Lié au signalement: {msg.reportId}</p>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </section>
                  )}

                  {adminTab === 'users' && (
                    <section>
                      <div className="relative mb-4">
                        <input 
                          type="text"
                          value={userSearchQuery}
                          onChange={(e) => setUserSearchQuery(e.target.value)}
                          placeholder="Rechercher un utilisateur..."
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500 transition-colors"
                        />
                      </div>
                      <div className="space-y-3">
                        {allUsers
                          .filter(u => u.displayName.toLowerCase().includes(userSearchQuery.toLowerCase()))
                          .map(u => (
                            <div key={u.id} className="bg-zinc-950 border border-zinc-800 p-4 rounded-2xl flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 overflow-hidden">
                                  {u.photoURL ? (
                                    <img src={u.photoURL} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <UserIcon className="w-5 h-5 text-zinc-600" />
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-zinc-200">{u.displayName}</p>
                                  <p className="text-[10px] text-zinc-500 font-mono">{u.id}</p>
                                  {u.banUntil && u.banUntil.toDate() > new Date() && (
                                    <p className="text-[10px] text-red-500">Banni jusqu'au {u.banUntil.toDate().toLocaleString()}</p>
                                  )}
                                  {u.isReadOnly && (
                                    <p className="text-[10px] text-amber-500">Lecture seule</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <select 
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === 'unban') handleBanUser(u.id, 0);
                                    else if (val === '3m') handleBanUser(u.id, 0.05, 'Test 3 minutes');
                                    else if (val === '2d') handleBanUser(u.id, 48, 'Comportement inapproprié');
                                    else if (val === 'life') handleBanUser(u.id, 'permanent', 'Violation grave des règles');
                                    else if (val === 'custom') setShowCustomBanModal({ userId: u.id });
                                  }}
                                  className="bg-zinc-900 border border-zinc-800 text-[10px] rounded-lg px-2 py-1 focus:outline-none"
                                >
                                  <option value="">Bannir...</option>
                                  <option value="unban">Débannir</option>
                                  <option value="3m">3 minutes (test)</option>
                                  <option value="2d">2 jours</option>
                                  <option value="life">À vie</option>
                                  <option value="custom">Personnalisé...</option>
                                </select>
                                <button 
                                  onClick={() => handleSetReadOnly(u.id, !u.isReadOnly)}
                                  className={`text-[10px] px-3 py-1 rounded-lg font-bold transition-colors ${u.isReadOnly ? 'bg-amber-500/20 text-amber-500' : 'bg-zinc-800 text-zinc-400'}`}
                                >
                                  {u.isReadOnly ? 'LECTURE SEULE' : 'NORMAL'}
                                </button>
                              </div>
                            </div>
                          ))}
                      </div>
                    </section>
                  )}

                  {adminTab === 'stats' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-2xl flex flex-col items-center text-center space-y-2">
                        <UserIcon className="w-8 h-8 text-indigo-500" />
                        <span className="text-2xl font-bold text-white">{allUsers.length}</span>
                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Utilisateurs</span>
                      </div>
                      <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-2xl flex flex-col items-center text-center space-y-2">
                        <ShieldAlert className="w-8 h-8 text-red-500" />
                        <span className="text-2xl font-bold text-white">
                          {allUsers.filter(u => u.banUntil && u.banUntil.toMillis() > Date.now()).length}
                        </span>
                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Bannis</span>
                      </div>
                      <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-2xl flex flex-col items-center text-center space-y-2">
                        <MessageSquare className="w-8 h-8 text-indigo-400" />
                        <span className="text-2xl font-bold text-white">{posts.length}</span>
                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Publications</span>
                      </div>
                      <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-2xl flex flex-col items-center text-center space-y-2">
                        <Flag className="w-8 h-8 text-amber-500" />
                        <span className="text-2xl font-bold text-white">{reports.length}</span>
                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Signalements</span>
                      </div>
                      <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-2xl col-span-2 flex flex-col items-center text-center space-y-2">
                        <Bell className="w-8 h-8 text-indigo-600" />
                        <span className="text-2xl font-bold text-white">
                          {reports.filter(r => !r.isRead).length}
                        </span>
                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Signalements non lus</span>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}

          {/* Privacy Warning Modal */}
          {showPrivacyWarning && (
            <div key="privacy-warning-modal" className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-3xl p-8 shadow-2xl text-center"
              >
                <div className="w-20 h-20 bg-indigo-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <ShieldAlert className="w-10 h-10 text-indigo-500" />
                </div>
                <h2 className="text-2xl font-black mb-4 tracking-tight uppercase">Conditions d'utilisation</h2>
                <div className="space-y-4 mb-8">
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    En cliquant sur <span className="text-white font-bold">"J'AI COMPRIS"</span>, vous reconnaissez que votre pseudo et votre photo de profil ont été récupérés depuis votre compte Google. Vous pouvez les modifier dans vos paramètres.
                  </p>
                  <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 text-xs text-zinc-500 text-left space-y-2">
                    <p className="font-bold text-zinc-400 uppercase tracking-wider mb-1">Clause de non-responsabilité :</p>
                    <p>
                      Safe Voice est une plateforme d'expression. Nous ne sommes en aucun cas responsables de vos activités, de vos propos ou de tout incident survenant suite à l'utilisation du site.
                    </p>
                    <p>
                      Vous êtes seul responsable de vos interactions et du contenu que vous publiez. En continuant, vous nous dégagez de toute responsabilité juridique ou morale.
                    </p>
                  </div>
                </div>
                <button 
                  onClick={handleDismissPrivacyWarning}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
                >
                  J'AI COMPRIS
                </button>
              </motion.div>
            </div>
          )}

          {/* Custom Ban Modal */}
          {showCustomBanModal && (
            <div key="custom-ban-modal" className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-3xl p-8 shadow-2xl"
              >
                <h2 className="text-xl font-black mb-6 flex items-center gap-2">
                  <ShieldAlert className="w-6 h-6 text-red-500" />
                  BANNISSEMENT PERSONNALISÉ
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase mb-1 block">Durée (heures)</label>
                    <input 
                      type="number"
                      value={customBanDuration}
                      onChange={(e) => setCustomBanDuration(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                      placeholder="24"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase mb-1 block">Raison du bannissement</label>
                    <textarea 
                      value={customBanReason}
                      onChange={(e) => setCustomBanReason(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 h-24 resize-none"
                      placeholder="Ex: Comportement inapproprié répété..."
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button 
                      onClick={() => setShowCustomBanModal(null)}
                      className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 rounded-xl transition-all"
                    >
                      ANNULER
                    </button>
                    <button 
                      onClick={() => handleBanUser(showCustomBanModal.userId, customBanDuration === 'permanent' ? 'permanent' : parseInt(customBanDuration), customBanReason)}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-red-500/20"
                    >
                      BANNIR
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {/* Help Modal */}
          {showHelpModal && (
            <div key="help-modal" className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="bg-zinc-900 border border-zinc-800 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
              >
                <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
                  <h2 className="text-xl font-black flex items-center gap-2">
                    <AlertCircle className="w-6 h-6 text-indigo-500" />
                    RÈGLES & AIDE
                  </h2>
                  <button onClick={() => setShowHelpModal(false)} className="text-zinc-500 hover:text-white"><X /></button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                  <section>
                    <h3 className="text-indigo-400 font-bold uppercase tracking-widest text-xs mb-4">Règles de la communauté</h3>
                    <ul className="space-y-4">
                      <li className="flex gap-3">
                        <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold shrink-0">01</div>
                        <p className="text-zinc-300 text-sm"><span className="font-bold text-white">Respect mutuel :</span> Pas d'insultes, de propos haineux ou de discrimination.</p>
                      </li>
                      <li className="flex gap-3">
                        <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold shrink-0">02</div>
                        <p className="text-zinc-300 text-sm"><span className="font-bold text-white">Pas de harcèlement :</span> Le harcèlement sous toutes ses formes est strictement interdit et sera banni.</p>
                      </li>
                      <li className="flex gap-3">
                        <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold shrink-0">03</div>
                        <p className="text-zinc-300 text-sm"><span className="font-bold text-white">Anonymat :</span> Respectez l'anonymat des autres. Ne divulguez pas d'informations personnelles.</p>
                      </li>
                    </ul>
                  </section>

                  <section className="bg-indigo-600/10 border border-indigo-500/20 rounded-2xl p-6">
                    <h3 className="text-indigo-400 font-bold uppercase tracking-widest text-xs mb-4">Besoin d'aide ?</h3>
                    <p className="text-zinc-300 text-sm mb-4">
                      Si tu es victime de harcèlement scolaire ou si tu traverses une période difficile, ne reste pas seul(e).
                    </p>
                    <div className="space-y-3">
                      <div className="bg-zinc-900/80 p-4 rounded-2xl border border-zinc-800 shadow-inner group hover:border-indigo-500/50 transition-all">
                        <p className="text-xs font-bold text-white mb-1 flex items-center gap-2">
                          <ShieldAlert className="w-3 h-3 text-red-500" />
                          Harcèlement scolaire (France)
                        </p>
                        <p className="text-indigo-400 font-black text-2xl tracking-tighter group-hover:text-indigo-300 transition-colors">Appelle le 3020</p>
                        <p className="text-[10px] text-zinc-500 mt-1 italic">Numéro gratuit et anonyme</p>
                      </div>
                      <div className="bg-zinc-900/80 p-4 rounded-2xl border border-zinc-800 shadow-inner group hover:border-indigo-500/50 transition-all">
                        <p className="text-xs font-bold text-white mb-1 flex items-center gap-2">
                          <AtSign className="w-3 h-3 text-indigo-500" />
                          Cyber-harcèlement
                        </p>
                        <p className="text-indigo-400 font-black text-2xl tracking-tighter group-hover:text-indigo-300 transition-colors">Appelle le 3018</p>
                        <p className="text-[10px] text-zinc-500 mt-1 italic">Disponible 7j/7, de 9h à 23h</p>
                      </div>
                      <div className="bg-zinc-900/80 p-4 rounded-2xl border border-zinc-800 shadow-inner group hover:border-indigo-500/50 transition-all">
                        <p className="text-xs font-bold text-white mb-1 flex items-center gap-2">
                          <AlertCircle className="w-3 h-3 text-amber-500" />
                          Suicide Écoute
                        </p>
                        <p className="text-indigo-400 font-black text-2xl tracking-tighter group-hover:text-indigo-300 transition-colors">Appelle le 01 45 39 40 00</p>
                        <p className="text-[10px] text-zinc-500 mt-1 italic">24h/24 et 7j/7</p>
                      </div>
                    </div>
                  </section>

                  <p className="text-center text-[10px] text-zinc-600 italic">
                    "Safe Voice est un espace de parole libre mais protégé. Chaque signalement est traité manuellement par nos modérateurs."
                  </p>
                </div>
                
                <div className="p-6 bg-zinc-900/50 border-t border-zinc-800">
                  <button 
                    onClick={() => setShowHelpModal(false)}
                    className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 rounded-xl transition-colors"
                  >
                    FERMER
                  </button>
                </div>
              </motion.div>
            </div>
          )}

          {/* Public Profile Modal */}
          {viewingProfile && (
            <PublicProfileModal 
              userId={viewingProfile}
              onClose={() => setViewingProfile(null)}
              currentUser={user}
              currentUserProfile={userProfile}
              isAdmin={isAdmin}
              allUsers={allUsers}
              userLikes={userLikes}
              userFavorites={userFavorites}
              onLike={handleLike}
              onFavorite={handleFavorite}
              onDelete={(id) => setPostToDelete(id)}
              onReport={(id, type) => setReportTarget({ id, type })}
              onPin={handlePin}
              onStrike={handleStrike}
              onMentions={handleMentions}
              replyCooldowns={replyCooldowns}
              onReplyCooldownStart={startReplyCooldown}
              onViewProfile={setViewingProfile}
            />
          )}

        {/* User Dashboard Modal */}
          {showUserDashboard && (
            <div key="user-dashboard-modal" className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-2xl w-full h-[80vh] overflow-hidden flex flex-col shadow-2xl"
              >
                <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50 backdrop-blur-md">
                  <h2 className="text-xl font-black flex items-center gap-2">
                    <Mail className="w-6 h-6 text-indigo-500" />
                    VOTRE ACTIVITÉ
                  </h2>
                  <button onClick={() => setShowUserDashboard(false)} className="text-zinc-500 hover:text-white"><X /></button>
                </div>

                <div className="flex border-b border-zinc-800 bg-zinc-900/30">
                  <button 
                    onClick={() => setUserDashboardTab('messages')}
                    className={`flex-1 py-3 text-xs font-bold transition-colors relative ${userDashboardTab === 'messages' ? 'text-indigo-500 border-b-2 border-indigo-500' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    MESSAGES ({unreadNotificationsCount})
                  </button>
                  <button 
                    onClick={() => setUserDashboardTab('reports')}
                    className={`flex-1 py-3 text-xs font-bold transition-colors relative ${userDashboardTab === 'reports' ? 'text-indigo-500 border-b-2 border-indigo-500' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    SIGNALEMENTS ({userReports.length})
                  </button>
                  <button 
                    onClick={() => setUserDashboardTab('favorites')}
                    className={`flex-1 py-3 text-xs font-bold transition-colors relative ${userDashboardTab === 'favorites' ? 'text-indigo-500 border-b-2 border-indigo-500' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    FAVORIS ({notifications.filter(n => n.isFavorited).length})
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                  {(userDashboardTab === 'messages' || userDashboardTab === 'favorites') ? (
                    <div className="space-y-3">
                      {(userDashboardTab === 'favorites' ? notifications.filter(n => n.isFavorited) : notifications).length === 0 ? (
                        <div className="text-center py-20">
                          {userDashboardTab === 'favorites' ? <Star className="w-12 h-12 text-zinc-800 mx-auto mb-4" /> : <Bell className="w-12 h-12 text-zinc-800 mx-auto mb-4" />}
                          <p className="text-zinc-500">
                            {userDashboardTab === 'favorites' ? "Vous n'avez aucun message favori." : "Vous n'avez aucun message."}
                          </p>
                        </div>
                      ) : (
                        (userDashboardTab === 'favorites' ? notifications.filter(n => n.isFavorited) : notifications).map(notif => (
                          <div 
                            key={notif.id} 
                            className={`p-4 rounded-2xl border transition-all ${notif.isRead ? 'bg-zinc-950 border-zinc-800' : 'bg-indigo-500/5 border-indigo-500/30 shadow-lg shadow-indigo-500/5'}`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center gap-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${notif.type === 'mention' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                  {notif.type === 'mention' ? <AtSign className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                                </div>
                                <span className="text-sm font-bold">{notif.fromName}</span>
                                <span className="text-xs text-zinc-500">
                                  {notif.type === 'mention' ? 'vous a mentionné' : 'a répondu à votre post'}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => handleToggleFavoriteNotification(notif.id, !!notif.isFavorited)}
                                  className={`p-1.5 rounded-lg transition-colors ${notif.isFavorited ? 'text-amber-500 bg-amber-500/10' : 'text-zinc-600 hover:text-zinc-400 hover:bg-zinc-800'}`}
                                >
                                  <Star className={`w-3.5 h-3.5 ${notif.isFavorited ? 'fill-current' : ''}`} />
                                </button>
                                <span className="text-[10px] text-zinc-600">{notif.createdAt?.toDate().toLocaleString()}</span>
                              </div>
                            </div>
                            <p className="text-sm text-zinc-400 line-clamp-2 italic mb-3">"{notif.content}"</p>
                            <div className="flex justify-between items-center">
                              <button 
                                onClick={() => handleGoToPost(notif.postId)}
                                className="text-[10px] font-bold text-indigo-500 hover:text-indigo-400 flex items-center gap-1 bg-indigo-500/10 px-3 py-1.5 rounded-lg transition-colors"
                              >
                                <ExternalLink className="w-3 h-3" />
                                VOIR LE POST
                              </button>
                              {!notif.isRead && (
                                <span className="text-[8px] font-black bg-indigo-600 text-white px-1.5 py-0.5 rounded-full uppercase tracking-tighter">Nouveau</span>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {userReports.length === 0 ? (
                        <div className="text-center py-20">
                          <Flag className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
                          <p className="text-zinc-500">Vous n'avez effectué aucun signalement.</p>
                        </div>
                      ) : (
                        userReports.map(report => (
                          <div key={report.id} className="bg-zinc-950 border border-zinc-800 p-4 rounded-2xl">
                            <div className="flex justify-between items-start mb-2">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${report.targetType === 'post' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-amber-500/10 text-amber-400'}`}>
                                {report.targetType.toUpperCase()}
                              </span>
                              <span className="text-[10px] text-zinc-600">{report.createdAt?.toDate().toLocaleString()}</span>
                            </div>
                            <div className="bg-zinc-900/50 p-3 rounded-xl mb-3 border border-zinc-800/50">
                              <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Contenu signalé:</p>
                              <p className="text-sm text-zinc-400 italic line-clamp-2">{report.targetContent}</p>
                            </div>
                            <p className="text-sm text-zinc-300 mb-4 font-medium">Raison: {report.reason}</p>
                            <button 
                              onClick={() => setSelectedReportForChat(report)}
                              className="text-[10px] text-indigo-500 hover:underline flex items-center gap-1"
                            >
                              <MessageSquare className="w-3 h-3" />
                              Discuter avec l'admin
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}

          {/* Report Chat Modal */}
          {selectedReportForChat && (
            <div key="report-chat-modal" className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-md w-full h-[60vh] flex flex-col shadow-2xl overflow-hidden"
              >
                <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-600/20 rounded-xl flex items-center justify-center border border-indigo-500/30 relative">
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                      <MessageSquare className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold">Discussion: Signalement</h3>
                      <p className="text-[10px] text-zinc-500">ID: {selectedReportForChat.id}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedReportForChat(null)} className="text-zinc-500 hover:text-white"><X /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  <div className="bg-zinc-950/50 p-3 rounded-2xl border border-zinc-800/30">
                    <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Rappel du signalement:</p>
                    <p className="text-xs text-zinc-400 italic mb-2">"{selectedReportForChat.targetContent}"</p>
                    <p className="text-xs text-zinc-300">Raison: {selectedReportForChat.reason}</p>
                  </div>

                  {/* Messages related to this report */}
                  {(isAdmin ? adminMessages : userMessages)
                    .filter(m => m.reportId === selectedReportForChat.id)
                    .sort((a, b) => a.createdAt?.toDate() - b.createdAt?.toDate())
                    .map(m => (
                      <div key={m.id} className={`flex flex-col ${m.senderId === user?.uid ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-[80%] p-4 rounded-3xl text-sm leading-relaxed ${m.senderId === user?.uid ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-zinc-800 text-zinc-200 rounded-tl-none'}`}>
                          {m.content}
                          {m.attachment && (
                            <div className="mt-3 rounded-xl overflow-hidden border border-white/10">
                              {m.attachmentType === 'image' ? (
                                <img src={m.attachment} alt="Pièce jointe" className="max-w-full h-auto block" referrerPolicy="no-referrer" />
                              ) : m.attachmentType === 'video' ? (
                                <video src={m.attachment} controls className="max-w-full h-auto block" />
                              ) : (
                                <div className="p-3 bg-black/20 text-[10px] flex items-center gap-2">
                                  <Download className="w-3 h-3" />
                                  Fichier joint
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <span className="text-[8px] text-zinc-600 mt-1 px-2">{m.createdAt?.toDate().toLocaleTimeString()}</span>
                      </div>
                    ))}
                </div>

                <div className="p-4 border-t border-zinc-800 bg-zinc-900/50">
                  <form 
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if ((!reportMessageContent.trim() && !reportAttachment) || isSendingMessage) return;
                      setIsSendingMessage(true);
                      try {
                        await addDoc(collection(db, 'messages'), {
                          senderId: user?.uid,
                          content: reportMessageContent.trim(),
                          reportId: selectedReportForChat.id,
                          reportOwnerId: selectedReportForChat.reporterId,
                          isRead: false,
                          attachment: reportAttachment?.data || null,
                          attachmentType: reportAttachment?.type || null,
                          createdAt: serverTimestamp()
                        });
                        setReportMessageContent('');
                        setReportAttachment(null);
                      } catch (err) {
                        console.error(err);
                      } finally {
                        setIsSendingMessage(false);
                      }
                    }}
                    className="flex flex-col gap-3"
                  >
                    {reportAttachment && (
                      <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-indigo-500/50 group">
                        {reportAttachment.type === 'image' ? (
                          <img src={reportAttachment.data} className="w-full h-full object-cover" alt="" />
                        ) : reportAttachment.type === 'video' ? (
                          <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                            <Camera className="w-6 h-6 text-indigo-400" />
                          </div>
                        ) : (
                          <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                            <Download className="w-6 h-6 text-indigo-400" />
                          </div>
                        )}
                        <button 
                          type="button"
                          onClick={() => setReportAttachment(null)}
                          className="absolute top-1 right-1 bg-black/60 rounded-full p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      <input 
                        type="file"
                        id="report-file"
                        className="hidden"
                        onChange={handleFileUpload}
                        accept="image/*,video/*"
                      />
                      <button 
                        type="button"
                        onClick={() => document.getElementById('report-file')?.click()}
                        className="p-3 rounded-2xl bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all"
                      >
                        <Camera className="w-5 h-5" />
                      </button>
                      <input 
                        type="text"
                        value={reportMessageContent}
                        onChange={(e) => setReportMessageContent(e.target.value)}
                        placeholder="Votre message..."
                        className="flex-1 bg-zinc-800 border border-zinc-700 rounded-2xl px-4 py-3 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500 transition-all"
                      />
                      <button 
                        disabled={isSendingMessage || (!reportMessageContent.trim() && !reportAttachment)}
                        className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white p-3 rounded-2xl transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
                      >
                        <Send className="w-5 h-5" />
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Footer Info */}
        <footer className="max-w-2xl mx-auto px-4 py-12 text-center border-t border-zinc-900">
          <p className="text-zinc-600 text-xs">
            © 2026 <span translate="no">Safe Voice</span> • Plateforme 100% anonyme
          </p>
        </footer>
      </div>
    </ErrorBoundary>
  );
}
