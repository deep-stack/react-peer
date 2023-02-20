import React, { useContext, useEffect } from 'react';

import { Box, Chip, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';

import { useForceUpdate } from '../hooks/forceUpdate';
import { PeerContext } from '../context/PeerContext';
import { DEFAULT_REFRESH_INTERVAL } from '../constants';

export function DebugInfo ({ refreshInterval = DEFAULT_REFRESH_INTERVAL, ...props }) {
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
    <Box {...props}>
      <Typography variant="subtitle2" sx={{ marginBottom: 1 }} color="inherit" noWrap>
        <b>Self Node Info</b>
      </Typography>
      <TableContainer sx={{ marginBottom: 2 }} component={Paper}>
        <Table size="small">
          <TableBody>
            <TableRow>
              <TableCell size="small"><b>Peer ID</b></TableCell>
              <TableCell size="small">{peer && peer.peerId && peer.peerId.toString()}</TableCell>
              <TableCell size="small" align="right"><b>Relay node</b></TableCell>
              <TableCell size="small">{peer && peer.relayNodeMultiaddr.toString()}</TableCell>
              <TableCell size="small" align="right"><b>Node started</b></TableCell>
              <TableCell size="small" sx={{ width: 50 }}>{peer && peer.node && peer.node.isStarted().toString()}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell size="small"><b>Multiaddrs</b></TableCell>
              <TableCell size="small" colSpan={5}>
                <TableContainer>
                  <Table size="small">
                    <TableBody>
                      {
                        peer && peer.node && peer.node.getMultiaddrs().map(multiaddr => (
                          <TableRow key={multiaddr.toString()}>
                            <TableCell size="small" sx={{ px: 0 }}>
                              {multiaddr.toString()}
                            </TableCell>
                          </TableRow>
                        ))
                      }
                    </TableBody>
                  </Table>
                </TableContainer>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
      {
        peer && peer.node && (
          <>
            <Typography variant="subtitle2" color="inherit" noWrap>
              <b>
                Remote Peer Connections
                &nbsp;
                <Chip size="small" label={peer.node.getConnections().length} variant="outlined" />
              </b>
            </Typography>
            {peer.node.getConnections().map(connection => (
              <TableContainer sx={{ mt: 1 }} key={connection.id} component={Paper}>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell size="small" sx={{ width: 150 }}><b>Connection ID</b></TableCell>
                      <TableCell size="small">{connection.id}</TableCell>
                      <TableCell size="small" align="right"><b>Direction</b></TableCell>
                      <TableCell size="small">{connection.stat.direction}</TableCell>
                      <TableCell size="small" align="right"><b>Status</b></TableCell>
                      <TableCell size="small">{connection.stat.status}</TableCell>
                      <TableCell size="small" align="right"><b>Type</b></TableCell>
                      <TableCell size="small">{connection.remoteAddr.toString().includes('p2p-circuit/p2p') ? "relayed" : "direct"}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell size="small"><b>Peer ID</b></TableCell>
                      <TableCell size="small" colSpan={4}>{connection.remotePeer.toString()}</TableCell>
                      <TableCell size="small" align="right"><b>Latency (ms)</b></TableCell>
                      <TableCell size="small" colSpan={2}>
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
                      <TableCell size="small" sx={{ width: 150 }}><b>Connected multiaddr</b></TableCell>
                      <TableCell size="small" colSpan={7}>
                        {connection.remoteAddr.toString()}
                        &nbsp;
                        <b>{connection.remoteAddr.equals(peer.relayNodeMultiaddr) && "(RELAY NODE)"}</b>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            ))}
          </>
        )
      }
    </Box>
  )
}
