import React, { useCallback, useMemo, useState } from 'react';

import { Box, Popover, Table, TableBody, TableCell, TableContainer, TableRow, Typography } from '@mui/material';

import ForceDirectedGraph from './ForceDirectedGraph';

const STYLES = {
  popover: {
    pointerEvents: 'none'
  }
}

// TODO: Change height on changing browser window size
const CONTAINER_HEIGHT = (window.innerHeight / 2) - 40

function GraphWithTooltip ({ data, nodeCharge }) {
  const [anchorEl, setAnchorEl] = useState(null)
  const [hoveredNode, setHoveredNode] = useState(null)

  const onMouseOverNode = useCallback(function (data) {
    setHoveredNode(data);
    setAnchorEl(this);
  }, []);

  return (
    <Box>
      <ForceDirectedGraph
        data={data}
        containerHeight={CONTAINER_HEIGHT}
        onMouseOverNode={onMouseOverNode}
        onMouseOutNode={() => setAnchorEl(null)}
        nodeCharge={nodeCharge}
      />
      <Popover
        id="mouse-over-popover"
        sx={STYLES.popover}
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
                <TableCell size="small">{hoveredNode && `${hoveredNode.id} (${hoveredNode.pseudonym})`}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell size="small"><b>Multiaddr</b></TableCell>
                <TableCell size="small">
                  {hoveredNode && hoveredNode.multiaddrs.map(multiaddr => (<Typography key={multiaddr} variant="body2">{multiaddr}</Typography>))}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Popover>
    </Box>
  )
}

export default GraphWithTooltip;
