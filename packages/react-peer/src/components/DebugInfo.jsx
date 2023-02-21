import React, { useCallback, useContext, useEffect, useState } from 'react';

import { getPseudonymForPeerId } from '@cerc-io/peer';
import { Box, Button, Chip, FormControl, Grid, InputLabel, MenuItem, Paper, Select, Table, TableBody, TableCell, TableContainer, TableRow, Typography } from '@mui/material';

import { useForceUpdate } from '../hooks/forceUpdate';
import { PeerContext } from '../context/PeerContext';
import { DEFAULT_REFRESH_INTERVAL } from '../constants';

const STYLES = {
  selfInfoHead: {
    marginBottom: 1/2
  },
  primaryRelaySelect: {
    marginRight: 1,
    minWidth: 200
  },
  selfInfoTable: {
    marginBottom: 2
  },
  nodeStartedTableCell: {
    width: 150
  }
}

export function DebugInfo ({ relayNodes, refreshInterval = DEFAULT_REFRESH_INTERVAL, ...props }) {
  const forceUpdate = useForceUpdate();
  const peer = useContext(PeerContext);
  const [primaryRelay, setPrimaryRelay] = useState(localStorage.getItem('primaryRelay') ?? '')

  const handlePrimaryRelayChange = useCallback(() => {
    // Set selected primary relay in localStorage and refresh app
    localStorage.setItem('primaryRelay', primaryRelay);
    window.location.reload(false);
  }, [primaryRelay])

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
      <Grid container sx={STYLES.selfInfoHead}>
        <Grid item xs="auto">
          <Typography variant="subtitle2" color="inherit" noWrap>
            <b>Self Node Info</b>
          </Typography>
        </Grid>
        <Grid item xs />
        <Grid item xs="auto">
          <Box display="flex" alignItems="flex-end">
            <FormControl variant="standard" sx={STYLES.primaryRelaySelect} size="small">
              <InputLabel shrink id="primary-relay-label">Primary Relay</InputLabel>
              <Select
                displayEmpty
                labelId="primary-relay-label"
                id="primary-label"
                value={primaryRelay}
                label="Primary Relay"
                onChange={event => setPrimaryRelay(event.target.value)}
              >
                <MenuItem value="">{"<random>"}</MenuItem>
                {relayNodes.map(relayNode => (
                  <MenuItem
                    value={relayNode}
                    key={relayNode}
                  >
                    {relayNode.split('/')[2]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant="contained"
              size="small"
              disabled={primaryRelay === (localStorage.getItem('primaryRelay') ?? '')}
              onClick={handlePrimaryRelayChange}
              sx={STYLES.primaryRelayButton}
            >
              UPDATE
            </Button>
          </Box>
        </Grid>
      </Grid>
      <TableContainer sx={STYLES.selfInfoTable} component={Paper}>
        <Table size="small">
          <TableBody>
            <TableRow>
              <TableCell size="small"><b>Peer ID</b></TableCell>
              <TableCell size="small">{peer && peer.peerId && `${peer.peerId.toString()} ( ${getPseudonymForPeerId(peer.peerId.toString())} )`}</TableCell>
              <TableCell size="small" align="right"><b>Node started</b></TableCell>
              <TableCell size="small" sx={STYLES.nodeStartedTableCell}>{peer && peer.node && peer.node.isStarted().toString()}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell size="small"><b>Relay node</b></TableCell>
              <TableCell size="small" colSpan={3}>{peer && `${peer.relayNodeMultiaddr.toString()} ( ${getPseudonymForPeerId(peer.relayNodeMultiaddr.getPeerId())} )`}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell size="small"><b>Multiaddrs</b></TableCell>
              <TableCell size="small" colSpan={3}>
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
                      <TableCell size="small" sx={{ width: 150 }}><b>Connected multiaddr</b></TableCell>
                      <TableCell size="small" colSpan={7}>{connection.remoteAddr.toString()}</TableCell>
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
