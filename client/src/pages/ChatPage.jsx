import { useCallback, useMemo, useState } from 'react';
import ChatLayout from '../components/ChatLayout';
import ChatHeader from '../components/ChatHeader';
import ConversationSidebar from '../components/ConversationSidebar';
import MessageList from '../components/MessageList';
import MessageInput from '../components/MessageInput';
import Loader from '../components/Loader';
import ErrorState from '../components/ErrorState';
import CallModal from '../components/CallModal';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';
import { useMessages } from '../hooks/useMessages';
import { useTypingIndicator } from '../hooks/useTypingIndicator';
import { useOnlineUsers } from '../hooks/useOnlineUsers';
import { useConversations } from '../hooks/useConversations';
import { useCall } from '../hooks/useCall';
import { clearMessagesHttp, clearConversationHttp } from '../services/api';

const PUBLIC_CONVERSATION = { type: 'public' };

const ChatPage = () => {
  const { user, token, logout } = useAuth();
  const username = user?.username;
  const currentUserId = user?.id;

  const { socket, isConnected, isReconnecting, emit } = useSocket(token);
  const onlineUsernames = useOnlineUsers(socket);
  const call = useCall(socket);

  const [activeConversation, setActiveConversation] = useState(PUBLIC_CONVERSATION);
  const [mobileView, setMobileView] = useState('list'); // 'list' | 'chat'
  const [sendError, setSendError] = useState('');

  const { users, unreadCounts, clearUnread } = useConversations(socket, currentUserId, activeConversation);
  const { messages, isLoading, error, reload } = useMessages(socket, activeConversation, currentUserId);
  const { typingUsers, notifyTyping, notifyStopTyping } = useTypingIndicator(
    socket,
    username,
    activeConversation
  );

  const isDm = activeConversation.type === 'dm';
  const dmUser = useMemo(
    () => (isDm ? users.find((u) => u.id === activeConversation.userId) : null),
    [isDm, users, activeConversation]
  );

  const handleSelectPublic = useCallback(() => {
    setActiveConversation(PUBLIC_CONVERSATION);
    setMobileView('chat');
    setSendError('');
  }, []);

  const handleSelectUser = useCallback(
    (targetUser) => {
      setActiveConversation({ type: 'dm', userId: targetUser.id, username: targetUser.username });
      setMobileView('chat');
      setSendError('');
      clearUnread(targetUser.id);
    },
    [clearUnread]
  );

  const handleBackToList = useCallback(() => setMobileView('list'), []);

  const handleSend = useCallback(
    (text) => {
      setSendError('');
      const payload = isDm
        ? { message: text, recipientId: activeConversation.userId }
        : { message: text };

      emit('send_message', payload, (ack) => {
        if (!ack?.success) {
          setSendError(ack?.message || 'Failed to send message. Please try again.');
        }
      });
    },
    [emit, isDm, activeConversation]
  );

  const handleClearChat = useCallback(async () => {
    try {
      if (isDm) {
        await clearConversationHttp(activeConversation.userId);
      } else {
        await clearMessagesHttp();
      }
    } catch {
      setSendError('Could not clear chat history.');
    }
  }, [isDm, activeConversation]);

  const dmDisplayName = dmUser?.username || activeConversation.username;
  const isDmUserOnline = isDm && onlineUsernames.includes(dmDisplayName);
  const canCallDmUser = isDm && isDmUserOnline && call.callState === 'idle';

  const handleAudioCall = useCallback(() => {
    if (!dmUser) return;
    call.startCall(dmUser.id, dmUser.username, 'audio');
  }, [call, dmUser]);

  const handleVideoCall = useCallback(() => {
    if (!dmUser) return;
    call.startCall(dmUser.id, dmUser.username, 'video');
  }, [call, dmUser]);

  const headerTitle = isDm ? dmDisplayName : 'Public Room';
  const headerSubtitle = isDm
    ? isDmUserOnline
      ? 'Online'
      : 'Offline'
    : (() => {
        const otherOnlineCount = onlineUsernames.filter((u) => u !== username).length;
        return otherOnlineCount > 0
          ? `${otherOnlineCount} other${otherOnlineCount > 1 ? 's' : ''} online`
          : 'Just you right now';
      })();
  const headerAvatarChar = isDm ? dmDisplayName?.charAt(0).toUpperCase() : '#';

  return (
    <>
      <ChatLayout
        showSidebarOnMobile={mobileView === 'list'}
        showChatOnMobile={mobileView === 'chat'}
        sidebar={
          <ConversationSidebar
            activeConversation={activeConversation}
            onSelectPublic={handleSelectPublic}
            onSelectUser={handleSelectUser}
            users={users}
            onlineUsernames={onlineUsernames}
            unreadCounts={unreadCounts}
            currentUsername={username}
            onLogout={logout}
          />
        }
        header={
          <ChatHeader
            title={headerTitle}
            subtitle={headerSubtitle}
            avatarChar={headerAvatarChar}
            showOnlineDot={isDmUserOnline}
            isConnected={isConnected}
            isReconnecting={isReconnecting}
            onClearChat={handleClearChat}
            clearChatLabel={isDm ? 'Clear conversation' : 'Clear chat'}
            clearChatConfirmText={
              isDm
                ? 'This will permanently delete this conversation for both of you.'
                : 'This will permanently delete all messages for everyone in the room.'
            }
            showBackButton
            onBack={handleBackToList}
            showCallButtons={isDm}
            canCall={canCallDmUser}
            onAudioCall={handleAudioCall}
            onVideoCall={handleVideoCall}
          />
        }
        footer={
          <>
            {sendError && (
              <p className="bg-red-50 px-4 py-1.5 text-center text-xs text-red-600 dark:bg-red-950/40 dark:text-red-400">
                {sendError}
              </p>
            )}
            <MessageInput
              onSend={handleSend}
              onTyping={notifyTyping}
              onStopTyping={notifyStopTyping}
              disabled={!isConnected}
            />
          </>
        }
      >
        {isLoading && <Loader />}
        {!isLoading && error && <ErrorState message={error} onRetry={reload} />}
        {!isLoading && !error && (
          <MessageList
            messages={messages}
            username={username}
            currentUserId={currentUserId}
            typingUsers={typingUsers}
            isDm={isDm}
          />
        )}
      </ChatLayout>

      <CallModal
        callState={call.callState}
        callType={call.callType}
        peerInfo={call.peerInfo}
        localStream={call.localStream}
        remoteStream={call.remoteStream}
        isMuted={call.isMuted}
        isCameraOff={call.isCameraOff}
        callError={call.callError}
        onAccept={call.acceptCall}
        onDecline={call.declineCall}
        onEnd={call.endCall}
        onToggleMute={call.toggleMute}
        onToggleCamera={call.toggleCamera}
      />
    </>
  );
};

export default ChatPage;
