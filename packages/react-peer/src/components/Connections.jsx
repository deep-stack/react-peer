import React, { useContext, useEffect } from 'react';

import { getPseudonymForPeerId } from '@cerc-io/peer';
import { Box, Chip, Paper, Table, TableBody, TableCell, TableContainer, TableRow, Typography } from '@mui/material';

import { useForceUpdate } from '../hooks/forceUpdate';
import { PeerContext } from '../context/PeerContext';
import { DEFAULT_REFRESH_INTERVAL, THROTTLE_WAIT_TIME } from '../constants';
import { useThrottledCallback } from '../hooks/throttledCallback';

const STYLES = {
  connectionsTable: {
    marginTop: 1
  },
  connectionsTableFirstColumn: {
    width: 150
  }
}

export function Connections ({ refreshInterval = DEFAULT_REFRESH_INTERVAL, ...props }) {
  const peer = useContext(PeerContext);
  const forceUpdate = useForceUpdate();

  // Set leading false to render UI after the events have triggered
  const throttledForceUpdate = useThrottledCallback(forceUpdate, THROTTLE_WAIT_TIME, { leading: false });

  useEffect(() => {
    if (!peer || !peer.node) {
      return;
    }

    peer.node.addEventListener('peer:connect', throttledForceUpdate);
    peer.node.addEventListener('peer:disconnect', throttledForceUpdate);

    return () => {
      peer.node?.removeEventListener('peer:connect', throttledForceUpdate);
      peer.node?.removeEventListener('peer:disconnect', throttledForceUpdate);
    }
  }, [peer, throttledForceUpdate])

  useEffect(() => {
    // TODO: Add event for connection close and remove refresh in interval
    const intervalID = setInterval(throttledForceUpdate, refreshInterval);

    return () => {
      clearInterval(intervalID);
    }
  }, [throttledForceUpdate])

  return peer && peer.node && (
    <Box {...props}>
      <Typography variant="subtitle2" color="inherit" noWrap>
        <b>
          Remote Peer Connections
          &nbsp;
          <Chip size="small" label={peer.node.getConnections().length} variant="outlined" />
        </b>
      </Typography>
      {peer.node.getConnections().map(connection => (
        <TableContainer sx={STYLES.connectionsTable} key={connection.id} component={Paper}>
          <Table size="small">
            <TableBody>
              <TableRow>
                <TableCell size="small" sx={STYLES.connectionsTableFirstColumn}><b>Connection ID</b></TableCell>
                <TableCell size="small">{connection.id}</TableCell>
                <TableCell size="small" align="right"><b>Direction</b></TableCell>
                <TableCell size="small">{connection.stat.direction}</TableCell>
                <TableCell size="small" align="right"><b>Status</b></TableCell>
                <TableCell size="small">{connection.stat.status}</TableCell>
                <TableCell size="small" align="right"><b>Type</b></TableCell>
                <TableCell size="small">{connection.remoteAddr.toString().includes('p2p-circuit/p2p') ? "relayed" : "direct"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell size="small" sx={STYLES.connectionsTableFirstColumn}><b>Peer ID</b></TableCell>
                <TableCell size="small">{`${connection.remotePeer.toString()} ( ${getPseudonymForPeerId(connection.remotePeer.toString())} )`}</TableCell>
                <TableCell align="right"><b>Node type</b></TableCell>
                <TableCell>
                  {
                    peer.isRelayPeerMultiaddr(connection.remoteAddr.toString())
                      ? peer.isPrimaryRelay(connection.remoteAddr.toString()) ? "Relay (Primary)" : "Relay (Secondary)"
                      : "Peer"
                  }
                </TableCell>
                <TableCell size="small" align="right"><b>Latency (ms)</b></TableCell>
                <TableCell size="small" colSpan={3}>
                  {
                    peer.getLatencyData(connection.remotePeer)
                      .map((value, index) => {
                        return index === 0 ?
                          (<span key={index}><b>{value}</b>&nbsp;</span>) :
                          (<span key={index}>{value}&nbsp;</span>)
                      })
                  }
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell size="small" sx={STYLES.connectionsTableFirstColumn}><b>Connected multiaddr</b></TableCell>
                <TableCell size="small" colSpan={7}>{connection.remoteAddr.toString()}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      ))}
    </Box>
  )
}
