import React, { useContext, useEffect } from 'react';

import { Box } from '@mui/material';
import ScopedCssBaseline from '@mui/material/ScopedCssBaseline';

import { useForceUpdate } from '../hooks/forceUpdate';
import { PeerContext } from '../context/PeerContext';
import { DEFAULT_REFRESH_INTERVAL } from '../constants';
import NetworkGraph from './NetworkGraph';

export function PeerNetwork ({ refreshInterval = DEFAULT_REFRESH_INTERVAL, ...props }) {
  const forceUpdate = useForceUpdate();
  const peer = useContext(PeerContext);

  useEffect(() => {
    if (!peer || !peer.node) {
      return
    }

    peer.node.peerStore.addEventListener('change:multiaddrs', forceUpdate)
    peer.node.addEventListener('peer:connect', forceUpdate)
    peer.node.addEventListener('peer:disconnect', forceUpdate)

    return () => {
      peer.node?.peerStore.removeEventListener('change:multiaddrs', forceUpdate)
      peer.node?.removeEventListener('peer:connect', forceUpdate)
      peer.node?.removeEventListener('peer:disconnect', forceUpdate)
    }
  }, [peer, forceUpdate])

  useEffect(() => {
    // TODO: Add event for connection close and remove refresh in interval
    const intervalID = setInterval(forceUpdate, refreshInterval);

    return () => {
      clearInterval(intervalID)
    }
  }, [forceUpdate])

  return (
    <ScopedCssBaseline>
      <Box mt={1}>
        { peer && (
          <NetworkGraph
            peer={peer}
          />
        )}
      </Box>
    </ScopedCssBaseline>
  )
}
