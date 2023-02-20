import React, { useCallback, useState } from 'react';
import { Graph } from 'react-d3-graph';
import { Box, Popover, Table, TableBody, TableCell, TableContainer, TableRow, Tooltip, Typography } from '@mui/material';

// Graph configuration.
const graphConfig = {
  nodeHighlightBehavior: true,
  node: {
      color: 'blue',
      size: 1000,
      fontSize: 14,
      labelProperty: ({ id, color }) => {
        switch (color) {
          case 'red':
            return 'Self';
        
          case 'green':
            return 'Relay (primary)';
    
          case 'blue':
            return 'Peer';
          
          case 'yellow':
            return 'Relay (secondary)';
    
          default:
            return id;
        }
      }
  },
  link: {
    color: 'grey'
  },
  directed: false,
  collapsible: false,
  d3: {
    gravity: -1000
  },
  // https://github.com/danielcaldas/react-d3-graph/issues/23#issuecomment-338308398
  // height: 'calc(50vh - 16px - 32px - 32px)',
  // width: '100%'
  height: (window.innerHeight / 2) - 80,
  width: window.innerWidth - 64
};

function NetworkGraph ({ peer }) {
  const links = [];
  const relayMultiaddr = peer.relayNodeMultiaddr
  const [anchorEl, setAnchorEl] = useState(null)
  const [hoveredPeer, setHoveredPeer] = useState(null)

  const remotePeerNodes = peer.node.getConnections().map(connection => {
    const connectionMultiAddr = connection.remoteAddr
    
    const nodeData = {
      id: connection.remotePeer.toString(),
      multiaddr: connectionMultiAddr.toString(),
      color: 'blue'
    }
    
    if (peer.isRelayPeerMultiaddr(connectionMultiAddr.toString())) {
      links.push({ source: peer.peerId.toString(), target: connection.remotePeer.toString() })
      
      nodeData.color = 'yellow';

      if (connectionMultiAddr.equals(relayMultiaddr)) {
        nodeData.color = 'green';
      }
    } else {
      // If relayed connection
      if (connectionMultiAddr.protoNames().includes('p2p-circuit')) {
        const relayPeerId = connectionMultiAddr.decapsulate('p2p-circuit/p2p').getPeerId();
        links.push({ source: relayPeerId.toString(), target: connection.remotePeer.toString() });
      } else {
        links.push({ source: peer.peerId.toString(), target: connection.remotePeer.toString() });
      }
    }
  
    return nodeData;
  })

  const onMouseOverNode = useCallback((nodeId) => {
    let multiaddrs = peer.node.getMultiaddrs().map(multiaddr => multiaddr.toString());

    if (nodeId !== peer.peerId.toString()) {
      const remotePeerNode = remotePeerNodes.find(remotePeerNode => remotePeerNode.id === nodeId);
      multiaddrs = [remotePeerNode.multiaddr];
    }

    setHoveredPeer({
      id: nodeId,
      multiaddrs
    });

    setAnchorEl(document.getElementById(nodeId));
  }, [peer, remotePeerNodes])

  const data = {
    nodes: [
      {
        id: peer.peerId.toString(),
        color: 'red'
      },
      ...remotePeerNodes
    ],
    links
  };

  return (
    <Box>
      <Graph
        id="network-graph"
        data={data}
        config={graphConfig}
        onMouseOverNode={onMouseOverNode}
        onMouseOutNode={() => setAnchorEl(null)}
      />
      <Popover
        id="mouse-over-popover"
        sx={{
          pointerEvents: 'none',
        }}
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        disableRestoreFocus
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        <TableContainer>
          <Table size="small">
            <TableBody>
              <TableRow>
                <TableCell size="small"><b>Peer ID</b></TableCell>
                <TableCell size="small">{hoveredPeer && hoveredPeer.id}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell size="small"><b>Multiaddr</b></TableCell>
                <TableCell size="small">
                  {hoveredPeer && hoveredPeer.multiaddrs.map(multiaddr => (<Typography variant="body2">{multiaddr}</Typography>))}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Popover>
    </Box>
  )
}

export default NetworkGraph;
