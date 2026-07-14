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
  const remoteStreamRef = useRef(null);
  const pendingOfferRef = useRef(null);
  const pendingCandidatesRef = useRef([]);
  const timeoutRef = useRef(null);
  const callStateRef = useRef('idle');

  useEffect(() => {
    callStateRef.current = callState;
  }, [callState]);

  const clearCallTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const cleanup = useCallback(() => {
    clearCallTimeout();

    if (pcRef.current) {
      pcRef.current.onicecandidate = null;
      pcRef.current.ontrack = null;
      pcRef.current.onconnectionstatechange = null;
      pcRef.current.close();
      pcRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach((track) => track.stop());
      remoteStreamRef.current = null;
    }

    pendingOfferRef.current = null;
    pendingCandidatesRef.current = [];

    setLocalStream(null);
    setRemoteStream(null);
    setPeerInfo(null);
    setIsMuted(false);
    setIsCameraOff(false);
    setCallState('idle');
  }, [clearCallTimeout]);

  const flushPendingCandidates = useCallback(async (pc) => {
    if (!pc || !pc.remoteDescription) return;

    const queuedCandidates = [...pendingCandidatesRef.current];
    pendingCandidatesRef.current = [];

    for (const candidate of queuedCandidates) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.error('Failed to add queued ICE candidate:', error);
      }
    }
  }, []);

  const createPeerConnection = useCallback(
    (otherUserId) => {
      const pc = new RTCPeerConnection({
        iceServers: getIceServers(),
      });

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('ice_candidate', {
            toUserId: otherUserId,
            candidate: event.candidate,
          });
        }
      };

      pc.ontrack = (event) => {
        if (!remoteStreamRef.current) {
          remoteStreamRef.current = new MediaStream();
        }

        const currentStream = remoteStreamRef.current;

        if (!currentStream.getTracks().some((track) => track.id === event.track.id)) {
          currentStream.addTrack(event.track);
        }

        // Create a fresh MediaStream so React detects every track update.
        setRemoteStream(new MediaStream(currentStream.getTracks()));
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'connected') {
          clearCallTimeout();
          setCallState('connected');
        } else if (
          pc.connectionState === 'failed' ||
          pc.connectionState === 'disconnected'
        ) {
          setCallError('Call connection failed — check your network and try again');
          cleanup();
        }
      };

      pcRef.current = pc;
      return pc;
    },
    [socket, clearCallTimeout, cleanup]
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

        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socket.emit(
          'call_user',
          {
            toUserId: userId,
            offer,
            callType: type,
          },
          (ack) => {
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
          }
        );
      } catch (error) {
        console.error('Failed to start call:', error);
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

      const pc = createPeerConnection(fromUserId);

      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      await flushPendingCandidates(pc);

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit('answer_call', {
        toUserId: fromUserId,
        answer,
      });

      pendingOfferRef.current = null;
      setCallState('connecting');
    } catch (error) {
      console.error('Failed to accept call:', error);
      setCallError('Camera/microphone access denied or unavailable');
      socket.emit('call_declined', { toUserId: fromUserId });
      cleanup();
    }
  }, [
    socket,
    callType,
    createPeerConnection,
    cleanup,
    flushPendingCandidates,
  ]);

  const declineCall = useCallback(() => {
    if (!socket || !pendingOfferRef.current) return;

    socket.emit('call_declined', {
      toUserId: pendingOfferRef.current.fromUserId,
    });

    cleanup();
  }, [socket, cleanup]);

  const endCall = useCallback(() => {
    if (!socket || !peerInfo) return;

    socket.emit('end_call', {
      toUserId: peerInfo.userId,
    });

    cleanup();
  }, [socket, peerInfo, cleanup]);

  const toggleMute = useCallback(() => {
    if (!localStreamRef.current) return;

    localStreamRef.current.getAudioTracks().forEach((track) => {
      track.enabled = !track.enabled;
    });

    setIsMuted((previous) => !previous);
  }, []);

  const toggleCamera = useCallback(() => {
    if (!localStreamRef.current) return;

    localStreamRef.current.getVideoTracks().forEach((track) => {
      track.enabled = !track.enabled;
    });

    setIsCameraOff((previous) => !previous);
  }, []);

  useEffect(() => {
    if (!socket) return undefined;

    const handleCallMade = ({
      fromUserId,
      fromUsername,
      offer,
      callType: incomingType,
    }) => {
      if (callStateRef.current !== 'idle') {
        socket.emit('call_declined', {
          toUserId: fromUserId,
        });
        return;
      }

      pendingOfferRef.current = {
        fromUserId,
        offer,
      };

      setCallError('');
      setCallType(incomingType === 'video' ? 'video' : 'audio');
      setPeerInfo({
        userId: fromUserId,
        username: fromUsername,
      });
      setCallState('incoming');
    };

    const handleCallAnswered = async ({ answer }) => {
      clearCallTimeout();

      const pc = pcRef.current;
      if (!pc) return;

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        await flushPendingCandidates(pc);
        setCallState('connecting');
      } catch (error) {
        console.error('Failed to apply call answer:', error);
        setCallError('Failed to connect the call');
        cleanup();
      }
    };

    const handleIceCandidate = async ({ candidate }) => {
      if (!candidate) return;

      const pc = pcRef.current;

      // Queue candidates until both the peer connection and remote description exist.
      if (!pc || !pc.remoteDescription) {
        pendingCandidatesRef.current.push(candidate);
        return;
      }

      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.error('Failed to add ICE candidate:', error);
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
  }, [
    socket,
    cleanup,
    clearCallTimeout,
    flushPendingCandidates,
  ]);

  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

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
