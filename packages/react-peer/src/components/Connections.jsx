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

  return (
    <Box {...props}>
      <Typography variant="subtitle2" color="inherit" noWrap>
        <b>
          Remote Peer Connections
          &nbsp;
          <Chip size="small" label={peer?.node.getConnections().length ?? 0} variant="outlined" />
        </b>
      </Typography>
      {peer && peer.getPeerConnectionsInfo().map(connection => (
        <TableContainer sx={STYLES.connectionsTable} key={connection.id} component={Paper}>
          <Table size="small">
            <TableBody>
              <TableRow>
                <TableCell size="small" sx={STYLES.connectionsTableFirstColumn}><b>Connection ID</b></TableCell>
                <TableCell size="small">{connection.id}</TableCell>
                <TableCell size="small" align="right"><b>Direction</b></TableCell>
                <TableCell size="small">{connection.direction}</TableCell>
                <TableCell size="small" align="right"><b>Status</b></TableCell>
                <TableCell size="small">{connection.status}</TableCell>
                <TableCell size="small" align="right"><b>Type</b></TableCell>
                <TableCell size="small">{connection.type}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell size="small" sx={STYLES.connectionsTableFirstColumn}><b>Peer ID</b></TableCell>
                <TableCell size="small">{`${connection.peerId} ( ${getPseudonymForPeerId(connection.peerId)} )`}</TableCell>
                <TableCell align="right"><b>Node type</b></TableCell>
                <TableCell>
                  {
                    connection.isPeerRelay
                      ? connection.isPeerRelayPrimary ? "Relay (Primary)" : "Relay (Secondary)"
                      : "Peer"
                  }
                </TableCell>
                <TableCell size="small" align="right"><b>Latency (ms)</b></TableCell>
                <TableCell size="small" colSpan={3}>
                  {
                    connection.latency
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
                <TableCell size="small" colSpan={7}>{connection.multiaddr}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      ))}
    </Box>
  )
}
