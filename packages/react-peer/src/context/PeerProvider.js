import React from 'react';

import { Peer, createPeerId } from '@cerc-io/peer';

import { PeerContext } from './PeerContext';

const PEER_INIT_CONFIG = {
  maxConnections: 100,
  maxRelayConnections: 5
};

export const PeerProvider = ({ peerConfig = {}, relayNodes, children }) => {
  const [peer, setPeer] = React.useState(null);
  const [initConfig, setInitConfig] = React.useState({ ...PEER_INIT_CONFIG, ...peerConfig });

  React.useEffect(() => {
    const init = async () => {
      // TODO: Validate prop relayNodes
      if (relayNodes.length === 0) {
        throw new Error('Relay nodes not set');
      }

      let primaryRelayNode = localStorage.getItem('primaryRelay');

      if (!Boolean(primaryRelayNode)) {
        const randomIndex = Math.floor(Math.random() * relayNodes.length);
        primaryRelayNode = relayNodes[randomIndex];
      }

      const peer = new Peer(primaryRelayNode);

      // Try to get peer id from browser's local storage
      let peerIdFromStorage = localStorage.getItem('peerId');
      let peerIdObj;

      if (peerIdFromStorage) {
        console.log('Using saved peer id; keep the app open in only one browser tab at a time');
        peerIdObj = JSON.parse(peerIdFromStorage);
      } else {
        console.log('Creating a new peer id');
        peerIdObj = await createPeerId();
      }

      await peer.init(initConfig, peerIdObj);

      // Debug
      console.log(`Peer ID: ${peer.peerId.toString()}`);

      localStorage.setItem('peerId', JSON.stringify(peerIdObj));
      setPeer(peer);
    };

    init();

    return () => {
      if (peer.node) {
        // TODO: Await for peer close
        peer.close();
      }
    }
  }, []);

  return (
    <PeerContext.Provider value={peer}>
      {children}
    </PeerContext.Provider>
  );
};
