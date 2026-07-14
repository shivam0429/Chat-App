import { useCallback, useEffect, useRef, useState } from 'react';
import { getIceServers } from '../services/webrtc';

const CALL_TIMEOUT_MS = 30000;

// callState: 'idle' | 'outgoing' | 'incoming' | 'connecting' | 'connected'
export const useCall = (socket) => {
  const [callState, setCallState] = useState('idle');
  const [callType, setCallType] = useState('video'); // 'audio' | 'video'
  const [peerInfo, setPeerInfo] = useState(null); // { userId, username }
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [callError, setCallError] = useState('');

  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const pendingOfferRef = useRef(null);
  const timeoutRef = useRef(null);
  const callStateRef = useRef('idle');

  // ICE candidates from the other side can arrive before our own
  // RTCPeerConnection exists (e.g. the caller's candidates start flowing
  // the moment they click call, long before the callee has clicked Accept).
  // Any candidate that arrives too early gets queued here and is flushed
  // once the peer connection is actually created, instead of being dropped.
  const pendingCandidatesRef = useRef([]);

  useEffect(() => {
    callStateRef.current = callState;
  }, [callState]);

  const clearCallTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const cleanup = useCallback(() => {
    clearCallTimeout();
    if (pcRef.current) {
      pcRef.current.onconnectionstatechange = null;
      pcRef.current.close();
      pcRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    pendingOfferRef.current = null;
    pendingCandidatesRef.current = [];
    setLocalStream(null);
    setRemoteStream(null);
    setPeerInfo(null);
    setIsMuted(false);
    setIsCameraOff(false);
    setCallState('idle');
  }, []);

  const flushPendingCandidates = useCallback(async (pc) => {
    const queued = pendingCandidatesRef.current;
    pendingCandidatesRef.current = [];
    for (const candidate of queued) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch {
        // Invalid/stale candidate — safe to skip.
      }
    }
  }, []);

  const createPeerConnection = useCallback(
    (otherUserId) => {
      const pc = new RTCPeerConnection({ iceServers: getIceServers() });

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('ice_candidate', { toUserId: otherUserId, candidate: event.candidate });
        }
      };

      pc.ontrack = (event) => {
        setRemoteStream(event.streams[0]);
      };

      // The offer/answer handshake completing doesn't mean media is
      // actually flowing yet — track the real transport state so the UI
      // isn't lying about "connected" while negotiation is still underway
      // or has failed outright.
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'connected') {
          clearCallTimeout();
          setCallState('connected');
        } else if (pc.connectionState === 'failed') {
          setCallError('Call connection failed — check your network and try again');
          cleanup();
        }
      };

      pcRef.current = pc;
      // Apply any ICE candidates that arrived before this connection existed.
      flushPendingCandidates(pc);
      return pc;
    },
    [socket, cleanup, flushPendingCandidates]
  );

  const startCall = useCallback(
    async (userId, username, type) => {
      if (!socket || callStateRef.current !== 'idle') return;

      setCallError('');
      setCallType(type);
      setPeerInfo({ userId, username });
      setCallState('outgoing');

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: type === 'video',
        });
        localStreamRef.current = stream;
        setLocalStream(stream);

        const pc = createPeerConnection(userId);
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socket.emit('call_user', { toUserId: userId, offer, callType: type }, (ack) => {
          if (!ack?.success) {
            setCallError(ack?.message || 'Call could not be started');
            cleanup();
            return;
          }
          timeoutRef.current = setTimeout(() => {
            setCallError('No answer');
            socket.emit('end_call', { toUserId: userId });
            cleanup();
          }, CALL_TIMEOUT_MS);
        });
      } catch (err) {
        setCallError('Camera/microphone access denied or unavailable');
        cleanup();
      }
    },
    [socket, createPeerConnection, cleanup]
  );

  const acceptCall = useCallback(async () => {
    if (!socket || !pendingOfferRef.current) return;
    const { fromUserId, offer } = pendingOfferRef.current;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callType === 'video',
      });
      localStreamRef.current = stream;
      setLocalStream(stream);

      // Creating the peer connection here also flushes any ICE candidates
      // from the caller that arrived while we were still ringing.
      const pc = createPeerConnection(fromUserId);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit('answer_call', { toUserId: fromUserId, answer });
      pendingOfferRef.current = null;
      // Signaling is done; actual "connected" now waits on
      // onconnectionstatechange so the UI reflects real media state.
      setCallState('connecting');
    } catch (err) {
      setCallError('Camera/microphone access denied or unavailable');
      socket.emit('call_declined', { toUserId: fromUserId });
      cleanup();
    }
  }, [socket, callType, createPeerConnection, cleanup]);

  const declineCall = useCallback(() => {
    if (!socket || !pendingOfferRef.current) return;
    socket.emit('call_declined', { toUserId: pendingOfferRef.current.fromUserId });
    cleanup();
  }, [socket, cleanup]);

  const endCall = useCallback(() => {
    if (!socket || !peerInfo) return;
    socket.emit('end_call', { toUserId: peerInfo.userId });
    cleanup();
  }, [socket, peerInfo, cleanup]);

  const toggleMute = useCallback(() => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getAudioTracks().forEach((track) => {
      track.enabled = !track.enabled;
    });
    setIsMuted((prev) => !prev);
  }, []);

  const toggleCamera = useCallback(() => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getVideoTracks().forEach((track) => {
      track.enabled = !track.enabled;
    });
    setIsCameraOff((prev) => !prev);
  }, []);

  useEffect(() => {
    if (!socket) return undefined;

    const handleCallMade = ({ fromUserId, fromUsername, offer, callType: incomingType }) => {
      // No call-waiting support in this MVP — auto-decline if already busy.
      if (callStateRef.current !== 'idle') {
        socket.emit('call_declined', { toUserId: fromUserId });
        return;
      }
      pendingOfferRef.current = { fromUserId, offer };
      setCallError('');
      setCallType(incomingType === 'video' ? 'video' : 'audio');
      setPeerInfo({ userId: fromUserId, username: fromUsername });
      setCallState('incoming');
    };

    const handleCallAnswered = async ({ answer }) => {
      clearCallTimeout();
      if (!pcRef.current) return;
      try {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        // Signaling is done; actual "connected" now waits on
        // onconnectionstatechange so the UI reflects real media state.
        setCallState('connecting');
      } catch {
        setCallError('Failed to connect the call');
        cleanup();
      }
    };

    const handleIceCandidate = async ({ candidate }) => {
      if (!candidate) return;

      // No peer connection yet (e.g. we haven't accepted the call yet) —
      // queue it instead of dropping it.
      if (!pcRef.current) {
        pendingCandidatesRef.current.push(candidate);
        return;
      }

      try {
        await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch {
        // Late/invalid candidates can be safely ignored.
      }
    };

    const handleCallDeclined = () => {
      setCallError('Call declined');
      cleanup();
    };

    const handleCallEnded = () => {
      cleanup();
    };

    socket.on('call_made', handleCallMade);
    socket.on('call_answered', handleCallAnswered);
    socket.on('ice_candidate', handleIceCandidate);
    socket.on('call_declined', handleCallDeclined);
    socket.on('call_ended', handleCallEnded);

    return () => {
      socket.off('call_made', handleCallMade);
      socket.off('call_answered', handleCallAnswered);
      socket.off('ice_candidate', handleIceCandidate);
      socket.off('call_declined', handleCallDeclined);
      socket.off('call_ended', handleCallEnded);
    };
  }, [socket, cleanup]);

  // Safety net: release camera/mic and close the peer connection if the
  // component using this hook unmounts mid-call.
  useEffect(() => () => cleanup(), [cleanup]);

  return {
    callState,
    callType,
    peerInfo,
    localStream,
    remoteStream,
    isMuted,
    isCameraOff,
    callError,
    startCall,
    acceptCall,
    declineCall,
    endCall,
    toggleMute,
    toggleCamera,
  };
};
