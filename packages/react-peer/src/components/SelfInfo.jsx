import React, { useCallback, useContext, useEffect, useState } from 'react';

import { getPseudonymForPeerId } from '@cerc-io/peer';
import { Box, Button, FormControl, Grid, InputLabel, MenuItem, Paper, Select, Table, TableBody, TableCell, TableContainer, TableRow, Typography } from '@mui/material';

import { useForceUpdate } from '../hooks/forceUpdate';
import { PeerContext } from '../context/PeerContext';
import { DEFAULT_REFRESH_INTERVAL, THROTTLE_WAIT_TIME } from '../constants';
import { useThrottledCallback } from '../hooks/throttledCallback';

const STYLES = {
  selfInfoHead: {
    marginBottom: 1/2
  },
  primaryRelaySelect: {
    marginRight: 1,
    minWidth: 200
  },
  nodeStartedTableCell: {
    width: 150
  }
}

export function SelfInfo ({ relayNodes, refreshInterval = DEFAULT_REFRESH_INTERVAL, ...props }) {
  const peer = useContext(PeerContext);
  const [primaryRelay, setPrimaryRelay] = useState(localStorage.getItem('primaryRelay') ?? '')
  const forceUpdate = useForceUpdate();

  const throttledForceUpdate = useThrottledCallback(forceUpdate, THROTTLE_WAIT_TIME);

  const handlePrimaryRelayChange = useCallback(() => {
    // Set selected primary relay in localStorage and refresh app
    localStorage.setItem('primaryRelay', primaryRelay);
    window.location.reload(false);
  }, [primaryRelay])

  useEffect(() => {
    if (!peer || !peer.node) {
      return
    }

    peer.node.peerStore.addEventListener('change:multiaddrs', throttledForceUpdate)

    return () => {
      peer.node?.peerStore.removeEventListener('change:multiaddrs', throttledForceUpdate)
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
      <TableContainer component={Paper}>
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
    </Box>
  )
}
