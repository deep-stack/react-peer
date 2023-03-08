// Scripts to be run in browsers
export const SCRIPT_GET_PEER_ID = 'return window.peer.peerId?.toString()';

export const SCRIPT_PEER_INIT = "return (typeof window.peer !== 'undefined') && window.peer.node.isStarted();";

export const SCRIPT_GET_PEER_CONNECTIONS = `return window.peer.node.getConnections().map(connection => {
  return connection.remotePeer.toString();
});`;

export const SCRIPT_GET_MESSAGE_OF_KIND = `
const expectedKind = arguments[0];
const done = arguments[arguments.length - 1];
window.peer.subscribeTopic('mobymask', (peerId, data) => {
  const { kind, message } = data;
  console.log("received message of kind", kind);
  console.log("want", expectedKind);

  if (kind === expectedKind) {
    done(message);
  }
});`
