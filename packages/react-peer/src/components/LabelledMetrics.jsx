import React from 'react';
import capitalize from 'lodash/capitalize';

import { Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip, Typography } from '@mui/material';

function LabelledMetrics (
  {
    title,
    label,
    valueModifier,
    labelDisplay,
    data = [] 
  }
) {
  return (
    <Box>
      <Tooltip title={title} placement="top">
        <Typography variant="subtitle2" color="inherit" noWrap>
          <b>{title}</b>
        </Typography>
      </Tooltip>
      <TableContainer component={Paper}>
        <Table size='small'>
          <TableHead>
            <TableRow>
              <TableCell size="small"><b>{capitalize(labelDisplay ?? label)}</b></TableCell>
              <TableCell size="small" align="right"><b>Value</b></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {
              data.map(({ labels = {}, value }) => {
                return (
                  <TableRow key={labels[label]}>
                    <TableCell size="small">{labels[label]}</TableCell>
                    <TableCell size="small" align="right">{valueModifier ? valueModifier(value) : value}</TableCell>
                  </TableRow>
                );
              })
            }
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}

export default LabelledMetrics;
