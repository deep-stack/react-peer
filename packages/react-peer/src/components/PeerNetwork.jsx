import React, { useCallback, useContext, useEffect } from 'react';

import { Box } from '@mui/material';
import ScopedCssBaseline from '@mui/material/ScopedCssBaseline';

import { useForceUpdate } from '../hooks/forceUpdate';
import { PeerContext } from '../context/PeerContext';
import { DEFAULT_REFRESH_INTERVAL, THROTTLE_WAIT_TIME } from '../constants';
import NetworkGraph from './NetworkGraph';
import { useThrottledCallback } from '../hooks/throttledCallback';

export function PeerNetwork ({ refreshInterval = DEFAULT_REFRESH_INTERVAL, ...props }) {
  const peer = useContext(PeerContext);
  
  // Set leading false to render UI after the events have triggered
  const forceUpdate = useForceUpdate();
  const throttledForceUpdate = useThrottledCallback(forceUpdate, THROTTLE_WAIT_TIME, { leading: false });

  useEffect(() => {
    if (!peer || !peer.node) {
      return
    }

    peer.node.addEventListener('peer:connect', throttledForceUpdate)
    peer.node.addEventListener('peer:disconnect', throttledForceUpdate)

    return () => {
      peer.node?.removeEventListener('peer:connect', throttledForceUpdate)
      peer.node?.removeEventListener('peer:disconnect', throttledForceUpdate)
    }
  }, [peer, throttledForceUpdate])

  useEffect(() => {
    // TODO: Add event for connection close and remove refresh in interval
    const intervalID = setInterval(throttledForceUpdate, refreshInterval);

    return () => {
      clearInterval(intervalID)
    }
  }, [throttledForceUpdate])

  return (
    <ScopedCssBaseline>
      <Box mt={1} {...props}>
        { peer && (
          <NetworkGraph
            connections={[...peer.node.getConnections()]}
            peer={peer}
          />
        )}
      </Box>
    </ScopedCssBaseline>
  )
}
