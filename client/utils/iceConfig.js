export function getIceServers() {
  return [
    {
      urls: [
        "stun:stun.l.google.com:19302",
        "stun:global.stun.twilio.com:3478",
        "stun:stun.relay.metered.ca:80"
      ],
    },
    {
      urls: "turn:in.relay.metered.ca:80",
      username: "1e2bb5ef1b164aa9ef65f1d1",
      credential: "mwTLWJWutx2FyJ7A",
    },
    {
      urls: "turn:in.relay.metered.ca:80?transport=tcp",
      username: "1e2bb5ef1b164aa9ef65f1d1",
      credential: "mwTLWJWutx2FyJ7A",
    },
    {
      urls: "turn:in.relay.metered.ca:443",
      username: "1e2bb5ef1b164aa9ef65f1d1",
      credential: "mwTLWJWutx2FyJ7A",
    },
    {
      urls: "turns:in.relay.metered.ca:443?transport=tcp",
      username: "1e2bb5ef1b164aa9ef65f1d1",
      credential: "mwTLWJWutx2FyJ7A",
    }
  ];
}