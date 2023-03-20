import React, { useState, useCallback, useContext, useEffect, useMemo } from 'react';

import { Box } from '@mui/material';
import ScopedCssBaseline from '@mui/material/ScopedCssBaseline';
import LoadingButton from '@mui/lab/LoadingButton';

import { PeerContext } from '../context/PeerContext';
import { DEFAULT_REFRESH_INTERVAL, THROTTLE_WAIT_TIME } from '../constants';
import GraphWithTooltip from './GraphWithTooltip';
import { useThrottledCallback } from '../hooks/throttledCallback';
import { updateGraphDataWithDebugInfo } from '../utils';

const STYLES = {
  container: {
    position: 'relative'
  },
  udpateButton: {
    position: 'absolute',
    left: 0,
    top: 0
  }
}

export function NetworkGraph ({ refreshInterval = DEFAULT_REFRESH_INTERVAL, sx, containerHeight, ...props }) {
  const peer = useContext(PeerContext);
  const [isLoading, setIsLoading] = useState(false)
  const [debugInfos, setDebugInfos] = useState([])
  const [data, setData] = useState({ nodes: [], links: [] })

  const handleNetworkUpdate = useCallback(() => {
    if (!peer) {
      return
    }

    setIsLoading(true)
    setData({ nodes: [], links: [] })
    peer.requestPeerInfo();

    const updateSelfDebugInfo = async () => {
      const selfDebugInfo = await peer.getInfo();
      selfDebugInfo.selfInfo.isSelf = true;
      setDebugInfos(prevDebugInfos => prevDebugInfos.concat(selfDebugInfo));
    }

    updateSelfDebugInfo();
  }, [peer]);

  useEffect(() => {
    if (!peer) {
      return
    }

    const unsubscribeDebugInfo = peer.subscribeDebugInfo((peerId, msg) => {
      if (msg.type === 'Response' && msg.dst === peer.peerId?.toString()) {
        setDebugInfos(prevPeerInfos => prevPeerInfos.concat(msg.peerInfo))
      }
    })

    return unsubscribeDebugInfo
  }, [peer]);

  const handleDebugInfos = useCallback((newDebugInfos) => {
    setData(prevData => {
      let nodesMap = prevData.nodes.reduce((acc, node) => {
        acc.set(node.id, node);
        return acc;
      }, new Map());

      let linksMap = prevData.links.reduce((acc, link) => {
        acc.set(link.id, link);
        return acc;
      }, new Map());

      newDebugInfos.forEach(debugInfo => {
        ({nodesMap, linksMap} = updateGraphDataWithDebugInfo(peer, debugInfo, nodesMap, linksMap))
      });

      return {
        nodes: Array.from(nodesMap.values()),
        links: Array.from(linksMap.values())
      }
    });

    setIsLoading(false);
    setDebugInfos([]);
  }, [peer])
  const throttledHandleDebugInfos = useThrottledCallback(handleDebugInfos, THROTTLE_WAIT_TIME, { leading: false });

  useEffect(() => {
    if (debugInfos.length) {
      throttledHandleDebugInfos(debugInfos);
    }
  }, [debugInfos, throttledHandleDebugInfos])

  useEffect(() => {
    if (peer) {
      // Update network graph on mount
      handleNetworkUpdate();
    }
  }, [peer, handleNetworkUpdate]);

  return (
    <ScopedCssBaseline>
      <Box
        mt={1}
        sx={{ ...STYLES.container, ...sx }}
        {...props}
      >
        <LoadingButton
          loading={isLoading}
          variant="contained"
          onClick={handleNetworkUpdate}
          size="small"
          sx={STYLES.udpateButton}
        >
          Update
        </LoadingButton>
        <GraphWithTooltip
          data={data}
          peer={peer}
          nodeCharge={-1000}
          containerHeight={containerHeight}
        />
      </Box>
    </ScopedCssBaseline>
  )
}
