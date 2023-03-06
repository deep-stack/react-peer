import React, { useState, useCallback, useContext, useEffect, useMemo } from 'react';

import { Box } from '@mui/material';
import ScopedCssBaseline from '@mui/material/ScopedCssBaseline';

import { PeerContext } from '../context/PeerContext';
import { DEFAULT_REFRESH_INTERVAL, THROTTLE_WAIT_TIME } from '../constants';
import GraphWithTooltip from './GraphWithTooltip';
import { useThrottledCallback } from '../hooks/throttledCallback';
import { updateGraphDataWithDebugInfo } from '../utils';

export function PeersGraph ({ refreshInterval = DEFAULT_REFRESH_INTERVAL, ...props }) {
  const peer = useContext(PeerContext);
  const [connections, setConnections] = useState([]);

  // Callback to update connections state only on some change
  const updateConnections = useCallback(() => {
    if (!peer || !peer.node) {
      return
    }

    const newConnections = peer.getPeerConnectionsInfo();

    setConnections(prevConnections => {
      // Compare and check if connections changed
      if (JSON.stringify(prevConnections) === JSON.stringify(newConnections)){
        // Return previous connections to prevent re-render
        return prevConnections;
      }

      return newConnections;
    })
  }, [peer]);
  const throttledUpdateConnections = useThrottledCallback(updateConnections, THROTTLE_WAIT_TIME, { leading: false });

  useEffect(() => {
    if (!peer || !peer.node) {
      return
    }

    peer.node.addEventListener('peer:connect', throttledUpdateConnections)
    peer.node.addEventListener('peer:disconnect', throttledUpdateConnections)

    return () => {
      peer.node?.removeEventListener('peer:connect', throttledUpdateConnections)
      peer.node?.removeEventListener('peer:disconnect', throttledUpdateConnections)
    }
  }, [peer, throttledUpdateConnections])

  useEffect(() => {
    // TODO: Add event for connection close and remove refresh in interval
    const intervalID = setInterval(throttledUpdateConnections, refreshInterval);

    // Update connections immediately on first render
    throttledUpdateConnections();

    return () => {
      clearInterval(intervalID)
    }
  }, [throttledUpdateConnections])

  const data = useMemo(() => {
    if (!peer) {
      return {
        nodes: [],
        links: []
      }
    }

    const debugInfo = {
      selfInfo: peer.getPeerSelfInfo(),
      connInfo: connections
    }

    const {nodesMap, linksMap} = updateGraphDataWithDebugInfo(peer, debugInfo);

    return {
      nodes: Array.from(nodesMap.values()),
      links: Array.from(linksMap.values())
    }
  }, [peer, connections]);

  return (
    <ScopedCssBaseline>
      <Box mt={1} {...props}>
        <GraphWithTooltip
          data={data}
        />
      </Box>
    </ScopedCssBaseline>
  )
}
