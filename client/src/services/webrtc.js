// Free public STUN servers let two peers discover their public IP/port so a
// direct connection can usually be made without any paid service.
//
// Some networks (strict NATs, some corporate/mobile networks) can't complete
// a direct connection even with STUN — for those, a TURN server is needed to
// relay the media. TURN is optional here: if you don't configure one, calls
// will still work in the majority of cases, they just may fail to connect on
// a small subset of networks. Free/self-hosted TURN options: coturn
// (self-hosted), or free tiers from providers like Metered.ca or Xirsys.
export const getIceServers = () => {
  const iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ];

  const turnUrl = import.meta.env.VITE_TURN_URL;
  if (turnUrl) {
    iceServers.push({
      urls: turnUrl,
      username: import.meta.env.VITE_TURN_USERNAME,
      credential: import.meta.env.VITE_TURN_CREDENTIAL,
    });
  }

  return iceServers;
};
