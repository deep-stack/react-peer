import { getPseudonymForPeerId } from '@cerc-io/peer';

const GRAPH_NODE_COLOR = {
  blue: 0,
  green: 2,
  red: 3,
  yellow: 8
}

/**
 * Method to create/update graph data with debugInfo
 * @param selfPeer
 * @param debugInfo
 * @param nodesMap
 * @param linksMap
 */
export const updateGraphDataWithDebugInfo = (selfPeer, debugInfo, nodesMap = new Map(), linksMap = new Map()) => {
  const { selfInfo, connInfo } = debugInfo;

  // Update from selfInfo
  nodesMap.set(selfInfo.peerId, {
    // Set node color to blue and label to Peer by default
    colorIndex: GRAPH_NODE_COLOR.blue,
    label: 'Peer',

    // Set existing node properties
    ...nodesMap.get(selfInfo.peerId),
    
    id: selfInfo.peerId,
    pseudonym: getPseudonymForPeerId(selfInfo.peerId),
    
    // Override multiaddrs from selfInfo
    multiaddrs: selfInfo.multiaddrs,

    // Modify self node in graph
    ...(selfPeer.peerId.toString() === selfInfo.peerId) && { size: 14, colorIndex: GRAPH_NODE_COLOR.red, label: 'Self' }
  })

  // Update nodes from connections info
  connInfo.forEach(conn => {
    nodesMap.set(conn.peerId, {
      // Set node color to blue and label to Peer by default
      colorIndex: GRAPH_NODE_COLOR.blue,
      label: 'Peer',

      // Set connection multiaddr if node already does not exist
      // Self info will update with actual multiaddr
      multiaddrs: [conn.multiaddr],

      // Set existing node properties
      ...nodesMap.get(conn.peerId),

      // Set relay node in the graph
      ...(conn.isPeerRelay && { colorIndex: GRAPH_NODE_COLOR.yellow, label: 'Relay (secondary)' }),

      id: conn.peerId,
      pseudonym: getPseudonymForPeerId(conn.peerId),

      // Modify self peer's primary relay in the graph
      ...(conn.multiaddr === selfPeer.relayNodeMultiaddr.toString() && { colorIndex: GRAPH_NODE_COLOR.green, label: 'Relay (primary)' })
    })
  })

  // Update links from connections info
  connInfo.forEach(conn => {
    let source = selfInfo.peerId

    // Change source node for link to relay incase of relayed connection
    // Check if relay node exists in graph
    if (conn.type === 'relayed' && nodesMap.has(conn.hopRelayPeerId)) {
      source = conn.hopRelayPeerId
    }

    // Form unique links between peers by concatenating ids based on comparison
    const linkId =  source < conn.peerId ? `${source}-${conn.peerId}` : `${conn.peerId}-${source}`;

    linksMap.set(linkId, {
      id: linkId,
      source,
      target: conn.peerId
    })
  })

  return {
    nodesMap,
    linksMap
  }
}
