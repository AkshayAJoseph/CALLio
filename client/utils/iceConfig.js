export function getIceServers() {
  const servers = [
    {
      urls: [
        "stun:stun.l.google.com:19302",
        "stun:stun1.l.google.com:19302",
        "stun:global.stun.twilio.com:3478",
        "stun:stun.cloudflare.com:3478",
      ],
    },
  ];

  const turnUrl = process.env.NEXT_PUBLIC_TURN_URL;
  const turnUser = process.env.NEXT_PUBLIC_TURN_USERNAME;
  const turnCred = process.env.NEXT_PUBLIC_TURN_CREDENTIAL;

  if (turnUrl) {
    servers.push({
      urls: [turnUrl],
      username: turnUser,
      credential: turnCred,
    });
  }

  return servers;
}
