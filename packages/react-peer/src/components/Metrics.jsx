import React, { useContext, useEffect, useState } from 'react';
import convert from 'convert';

import { Box, Grid, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';

import LabelledMetrics from './LabelledMetrics';
import { PeerContext } from '../context/PeerContext';
import { DEFAULT_REFRESH_INTERVAL } from '../constants';

const dataValueModifier = (value) => {
  const { quantity, unit } = convert(value, 'bytes').to('best')
    
  return quantity.toLocaleString(
      undefined,
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }
    ).concat(' ', unit)
}

const UNLABELLED_METRICS = [
  {
    name: 'libp2p_dialler_pending_dials',
    title: 'pending dials'
  },
  {
    name: 'libp2p_dialler_pending_dial_targets',
    title: 'pending dial targets'
  },
  {
    name: 'libp2p_transport_manager_listeners',
    title: 'listeners'
  },
]

const LABELLED_METRICS = [
  {
    name: 'js_memory_usage_bytes',
    title: 'Memory usage',
    valueModifier: dataValueModifier
  },
  {
    name: 'libp2p_connection_manager_connections',
    title: 'Connections',
    labelDisplay: 'Direction'
  },
  {
    name: 'libp2p_protocol_streams_total',
    title: 'Protocol streams',
  },
  {
    name: 'libp2p_connection_manager_protocol_streams_per_connection_90th_percentile',
    title: '90th percentile of streams per protocol',
  },
]

const DATA_TRANSFER_METRICS = {
  name: 'libp2p_data_transfer_bytes_total',
  title: 'Data transfer',
  valueModifier: dataValueModifier
}

const DATA_TRANSFER_METRICS_LABEL = 'protocol'

export function Metrics({ refreshInterval = DEFAULT_REFRESH_INTERVAL }) {
  const peer = useContext(PeerContext);
  const [metricsData, setMetricsData] = useState();

  useEffect(() => {
    if (!peer) {
      return
    }

    const updateMetrics = async () => {
      const data = await peer.metrics.getMetricsAsMap();
      setMetricsData(data);
    }

    const intervalID = setInterval(updateMetrics, refreshInterval);
    updateMetrics();

    return () => {
      clearInterval(intervalID);
    };
  }, [peer])

  return (
    <Box mt={1}>
      <Grid container spacing={1}>
        <Grid item xs={3}>
          <LabelledMetrics
            title={DATA_TRANSFER_METRICS.title}
            label={DATA_TRANSFER_METRICS_LABEL}
            valueModifier={DATA_TRANSFER_METRICS.valueModifier}
            data={metricsData?.get(DATA_TRANSFER_METRICS.name)?.instance.collect()}
          />
        </Grid>
        <Grid item xs={9} container spacing={1}>
          <Grid item xs={4}>
            <Typography variant="subtitle2" color="inherit" noWrap>
              <b>General metrics</b>
            </Typography>
            <TableContainer component={Paper}>
              <Table size='small'>
                <TableHead>
                  <TableRow>
                    <TableCell size="small"><b>Name</b></TableCell>
                    <TableCell size="small" align="right"><b>Value</b></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {
                    UNLABELLED_METRICS.map(({ name, title }) => {
                      const data = metricsData?.get(name);

                      if (!data) {
                        return null;
                      }

                      return (
                        <TableRow key={name}>
                          <TableCell size="small">{title}</TableCell>
                          <TableCell size="small" align="right">{data.instance.get()?.value}</TableCell>
                        </TableRow>
                      );
                    })
                  }
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
          {
            LABELLED_METRICS.map(({ name, title, labelDisplay, valueModifier }) => {
              const data = metricsData?.get(name);
              
              if (!data || !data.instance.collect().length) {
                return null;
              }

              const [label] = Object.keys(data.instance.collect()[0].labels);

              return (
                <Grid key={name} item xs={4}>
                  <LabelledMetrics
                    title={title}
                    label={label}
                    labelDisplay={labelDisplay}
                    valueModifier={valueModifier}
                    data={data.instance.collect()}
                  />
                </Grid>
              );
            })
          }
        </Grid>
      </Grid>
    </Box>
  )
}
