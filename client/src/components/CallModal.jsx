import { useEffect, useRef, useState } from 'react';

const formatDuration = (totalSeconds) => {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const seconds = Math.floor(totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
};

const statusText = (callState, callType, duration) => {
  if (callState === 'outgoing') return `Calling ${callType === 'video' ? 'video' : 'audio'}…`;
  if (callState === 'incoming') return `Incoming ${callType === 'video' ? 'video' : 'audio'} call`;
  if (callState === 'connecting') return 'Connecting…';
  if (callState === 'connected') return formatDuration(duration);
  return '';
};

const ControlButton = ({ onClick, title, active, danger, success, children, large = false }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    aria-label={title}
    className={`flex items-center justify-center rounded-full shadow-xl transition-all duration-200 hover:scale-105 active:scale-95 ${
      large ? 'h-16 w-16' : 'h-14 w-14'
    } ${
      danger
        ? 'bg-[#ea4335] text-white hover:bg-[#d93025]'
        : success
          ? 'bg-[#25d366] text-white hover:bg-[#1fbd5b]'
          : active
            ? 'bg-white text-[#111b21] hover:bg-slate-100'
            : 'bg-white/15 text-white backdrop-blur-md hover:bg-white/25'
    }`}
  >
    {children}
  </button>
);

const CallModal = ({
  callState,
  callType,
  peerInfo,
  localStream,
  remoteStream,
  isMuted,
  isCameraOff,
  callError,
  onAccept,
  onDecline,
  onEnd,
  onToggleMute,
  onToggleCamera,
}) => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (!localVideoRef.current) return;
    localVideoRef.current.srcObject = localStream || null;
    if (localStream) localVideoRef.current.play().catch(() => {});
  }, [localStream]);

  useEffect(() => {
    // Keep the remote media element mounted throughout negotiation. The
    // remote stream may arrive before callState becomes "connected".
    if (callType === 'video' && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream || null;
      if (remoteStream) remoteVideoRef.current.play().catch(() => {});
    }

    if (callType === 'audio' && remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = remoteStream || null;
      if (remoteStream) remoteAudioRef.current.play().catch(() => {});
    }
  }, [remoteStream, callType, callState]);

  useEffect(() => {
    if (callState !== 'connected') {
      setDuration(0);
      return undefined;
    }
    const interval = setInterval(() => setDuration((value) => value + 1), 1000);
    return () => clearInterval(interval);
  }, [callState]);

  if (callState === 'idle') return null;

  const avatarChar = peerInfo?.username?.charAt(0)?.toUpperCase() || '?';
  const showRemoteVideo = callType === 'video' && callState === 'connected';

  return (
    <div className="fixed inset-0 z-[60] overflow-hidden bg-[#111b21] text-white">
      <audio ref={remoteAudioRef} autoPlay className="hidden" />

      {callType === 'video' && (
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
            showRemoteVideo ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}

      {!showRemoteVideo && (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_#214740_0%,_#152d2a_35%,_#111b21_72%)]" />
      )}

      <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-black/75" />

      <div className="relative z-10 flex h-full flex-col">
        <div className="flex flex-col items-center px-6 pt-14 text-center sm:pt-10">
          {!showRemoteVideo && (
            <div className="mb-5 flex h-28 w-28 items-center justify-center rounded-full bg-[#00a884] text-5xl font-semibold text-white shadow-2xl ring-4 ring-white/10 sm:h-32 sm:w-32">
              {avatarChar}
            </div>
          )}

          <h2 className="max-w-md truncate text-2xl font-semibold drop-shadow-md sm:text-3xl">
            {peerInfo?.username || 'Unknown user'}
          </h2>
          <p className="mt-2 text-sm font-medium text-white/80 sm:text-base">
            {statusText(callState, callType, duration)}
          </p>
          {callError && (
            <p className="mt-3 max-w-md rounded-full bg-red-500/20 px-4 py-2 text-sm text-red-100 backdrop-blur-md">
              {callError}
            </p>
          )}
        </div>

        {callType === 'video' && localStream && (
          <div className="absolute right-4 top-4 h-40 w-28 overflow-hidden rounded-2xl bg-[#202c33] shadow-2xl ring-1 ring-white/20 sm:right-6 sm:top-6 sm:h-48 sm:w-36">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={`h-full w-full object-cover ${isCameraOff ? 'hidden' : ''}`}
            />
            {isCameraOff && (
              <div className="flex h-full w-full items-center justify-center bg-[#202c33] text-3xl font-semibold text-[#8696a0]">
                {avatarChar}
              </div>
            )}
            <span className="absolute bottom-2 left-2 rounded-full bg-black/45 px-2 py-1 text-[10px] font-medium backdrop-blur-sm">
              You
            </span>
          </div>
        )}

        <div className="mt-auto px-5 pb-8 sm:pb-10">
          {callState === 'incoming' ? (
            <div className="mx-auto flex max-w-xs items-center justify-between rounded-[2rem] bg-black/25 px-8 py-5 backdrop-blur-xl ring-1 ring-white/10">
              <div className="flex flex-col items-center gap-2">
                <ControlButton onClick={onDecline} title="Decline call" danger large>
                  <svg viewBox="0 0 24 24" className="h-7 w-7 rotate-[135deg]" fill="currentColor">
                    <path d="M6.62 10.79a15.46 15.46 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24 11.36 11.36 0 003.56.57 1 1 0 011 1V20a1 1 0 01-1 1C10.59 21 3 13.41 3 4a1 1 0 011-1h3.5a1 1 0 011 1 11.36 11.36 0 00.57 3.56 1 1 0 01-.25 1.01l-2.2 2.22z" />
                  </svg>
                </ControlButton>
                <span className="text-xs font-medium text-white/80">Decline</span>
              </div>

              <div className="flex flex-col items-center gap-2">
                <ControlButton onClick={onAccept} title="Accept call" success large>
                  <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor">
                    <path d="M6.62 10.79a15.46 15.46 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24 11.36 11.36 0 003.56.57 1 1 0 011 1V20a1 1 0 01-1 1C10.59 21 3 13.41 3 4a1 1 0 011-1h3.5a1 1 0 011 1 11.36 11.36 0 00.57 3.56 1 1 0 01-.25 1.01l-2.2 2.22z" />
                  </svg>
                </ControlButton>
                <span className="text-xs font-medium text-white/80">Accept</span>
              </div>
            </div>
          ) : (
            <div className="mx-auto flex w-fit items-center gap-4 rounded-[2rem] bg-black/30 px-5 py-4 backdrop-blur-xl ring-1 ring-white/10 sm:gap-5 sm:px-7">
              <ControlButton onClick={onToggleMute} title={isMuted ? 'Unmute' : 'Mute'} active={isMuted}>
                {isMuted ? (
                  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 9v3a3 3 0 004.88 2.33M15 9V5a3 3 0 00-6 0v1m10 5v1a7 7 0 01-11.73 5.15M5 11v1a7 7 0 00.56 2.74M12 19v3m-4 0h8M3 3l18 18" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="2" width="6" height="12" rx="3" />
                    <path d="M5 10v2a7 7 0 0014 0v-2M12 19v3m-4 0h8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </ControlButton>

              {callType === 'video' && (
                <ControlButton onClick={onToggleCamera} title={isCameraOff ? 'Turn camera on' : 'Turn camera off'} active={isCameraOff}>
                  {isCameraOff ? (
                    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 3l18 18M16 10l5-3v10l-5-3M3 7a2 2 0 012-2h6m5 4v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="5" width="13" height="14" rx="2" />
                      <path d="M16 10l5-3v10l-5-3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </ControlButton>
              )}

              <ControlButton onClick={onEnd} title="End call" danger large>
                <svg viewBox="0 0 24 24" className="h-7 w-7 rotate-[135deg]" fill="currentColor">
                  <path d="M6.62 10.79a15.46 15.46 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24 11.36 11.36 0 003.56.57 1 1 0 011 1V20a1 1 0 01-1 1C10.59 21 3 13.41 3 4a1 1 0 011-1h3.5a1 1 0 011 1 11.36 11.36 0 00.57 3.56 1 1 0 01-.25 1.01l-2.2 2.22z" />
                </svg>
              </ControlButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CallModal;