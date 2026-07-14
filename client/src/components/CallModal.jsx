import { useEffect, useRef, useState } from 'react';

const formatDuration = (totalSeconds) => {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const s = Math.floor(totalSeconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

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
    if (localVideoRef.current) localVideoRef.current.srcObject = localStream || null;
  }, [localStream]);

  useEffect(() => {
    // Assigning srcObject doesn't guarantee playback starts — some browsers
    // (especially mobile) require an explicit play() call, and the promise
    // can reject silently under autoplay restrictions if not awaited/caught.
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream || null;
      if (remoteStream) {
        remoteVideoRef.current.play().catch(() => {});
      }
    }
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = remoteStream || null;
      if (remoteStream) {
        remoteAudioRef.current.play().catch(() => {});
      }
    }
  }, [remoteStream]);

  useEffect(() => {
    if (callState !== 'connected') {
      setDuration(0);
      return undefined;
    }
    const interval = setInterval(() => setDuration((d) => d + 1), 1000);
    return () => clearInterval(interval);
  }, [callState]);

  if (callState === 'idle') return null;

  const avatarChar = peerInfo?.username?.charAt(0).toUpperCase();
  const showRemoteVideo = callType === 'video' && callState === 'connected';

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-slate-900 text-white">
      {/* Audio element carries sound for both audio-only and video calls */}
      <audio ref={remoteAudioRef} autoPlay className="hidden" />

      {showRemoteVideo ? (
        <video ref={remoteVideoRef} autoPlay playsInline className="h-full w-full flex-1 object-cover" />
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6">
          <div className="flex h-28 w-28 items-center justify-center rounded-full bg-brand-600 text-4xl font-semibold">
            {avatarChar}
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold">{peerInfo?.username}</p>
            <p className="mt-1 text-sm text-slate-300">
              {callState === 'outgoing' && `Calling… (${callType})`}
              {callState === 'incoming' && `Incoming ${callType} call`}
              {callState === 'connecting' && 'Connecting…'}
              {callState === 'connected' && formatDuration(duration)}
            </p>
            {callError && <p className="mt-2 text-sm text-red-400">{callError}</p>}
          </div>
        </div>
      )}

      {showRemoteVideo && (
        <p className="pointer-events-none absolute left-4 top-4 rounded-full bg-black/40 px-3 py-1 text-sm">
          {peerInfo?.username} · {formatDuration(duration)}
        </p>
      )}

      {callType === 'video' && localStream && (
        <div className="absolute right-4 top-4 h-32 w-24 overflow-hidden rounded-xl bg-slate-800 shadow-lg ring-1 ring-white/10 sm:h-40 sm:w-28">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className={`h-full w-full object-cover ${isCameraOff ? 'hidden' : ''}`}
          />
          {isCameraOff && (
            <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-slate-400">
              {avatarChar}
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-center gap-4 pb-10 pt-6">
        {callState === 'incoming' ? (
          <>
            <button
              type="button"
              onClick={onDecline}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-2xl shadow-lg transition hover:bg-red-700"
              title="Decline"
            >
              ✕
            </button>
            <button
              type="button"
              onClick={onAccept}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-2xl shadow-lg transition hover:bg-emerald-700"
              title="Accept"
            >
              📞
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={onToggleMute}
              className={`flex h-12 w-12 items-center justify-center rounded-full text-xl shadow-lg transition ${
                isMuted ? 'bg-white text-slate-900' : 'bg-white/10 hover:bg-white/20'
              }`}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? '🔇' : '🎤'}
            </button>

            {callType === 'video' && (
              <button
                type="button"
                onClick={onToggleCamera}
                className={`flex h-12 w-12 items-center justify-center rounded-full text-xl shadow-lg transition ${
                  isCameraOff ? 'bg-white text-slate-900' : 'bg-white/10 hover:bg-white/20'
                }`}
                title={isCameraOff ? 'Turn camera on' : 'Turn camera off'}
              >
                {isCameraOff ? '📷' : '🎥'}
              </button>
            )}

            <button
              type="button"
              onClick={onEnd}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-2xl shadow-lg transition hover:bg-red-700"
              title="End call"
            >
              ✕
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default CallModal;
