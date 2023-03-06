import React, { useRef, useCallback, useEffect, useState, useMemo } from "react"
import * as d3 from "d3";

function ForceDirectedGraph ({
  data,
  containerHeight,
  onClickNode,
  onMouseOverNode,
  onMouseOutNode,
  nodeCharge = -250
}) {
  const containerRef = useRef(null)
  const [containerWidth, setContainerWidth] = useState(0)

  const { current: simulation } = useRef(d3.forceSimulation()
    .force(
      "link",
      d3.forceLink()
        .distance(150) // Minimum distance between linked nodes
        .id(d => d.id)
    )
    .force("charge", d3.forceManyBody().strength(nodeCharge)) // Force between nodes
  )

  const svgRef = useRef(d3.create("svg").attr('display', 'block'));
  const linkRef = useRef(null);
  const nodeRef = useRef(null);
  const labelRef = useRef(null);

  const zoom = useMemo(() => {
    const zoomed = () => {
      linkRef.current.attr("transform", d3.event.transform);
      nodeRef.current.attr("transform", d3.event.transform);
      labelRef.current.attr("transform", d3.event.transform);
    };

    return d3.zoom()
      .scaleExtent([1/8, 8])
      .on(
        "zoom",
        zoomed
      )
  }, []);

  const update = useCallback(({ nodes, links }) => {
    // Make a shallow copy to protect against mutation, while
    // recycling old nodes to preserve position and velocity.
    const old = new Map(nodeRef.current.data().map(d => [d.id, d]));
    nodes = nodes.map(d => Object.assign(old.get(d.id) || {}, d));
    links = links.map(d => Object.assign({}, d));

    nodeRef.current = nodeRef.current
      .data(nodes)
      .join("circle")
      .attr("r", d => d.size ?? 12)
      .attr("fill", d => color(d.colorIndex))
      .attr("stroke-width", d => d.selected ? 2 : 0)
      .attr("stroke", d => d.selected ? color(3) : '#FFF')
      .on('click', onClickNode)
      .on('mouseover', onMouseOverNode)
      .on('mouseout', onMouseOutNode)
      .call(drag(simulation));

    labelRef.current = labelRef.current
      .data(nodes)
      .join("text")
      .attr("dx", d => (d.size ?? 12) + 2)
      .attr("dy",".35em")
      .attr("font-size", 14)
      .text(d => d.label);

    linkRef.current = linkRef.current
      .data(links)
      .join("line")
      // .attr('marker-end','url(#arrowhead)'); // Add arrow to links

    simulation.nodes(nodes);
    simulation.force("link").links(links);
    simulation.alpha(1).restart();

    const transform = d3.zoomTransform(svgRef.current.node())
    linkRef.current.attr("transform", transform);
    nodeRef.current.attr("transform", transform);
    labelRef.current.attr("transform", transform);
  }, [onClickNode])

  const measuredRef = useCallback(node => {
    if (node !== null) {
      setContainerWidth(node.getBoundingClientRect().width);
    }
  }, []);

  useEffect(() => {
    // Set d3 SVG group references on mount
    // SVG group for links
    linkRef.current = svgRef.current.append("g")
      .attr("stroke", "grey")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", 1)
      .selectAll("line");
    // SVG group for nodes
    nodeRef.current = svgRef.current.append("g")
      .selectAll("circle");
    // SVG group for labels
    labelRef.current = svgRef.current.append("g")
      .selectAll("text");

    // Simulation tick handler for setting positions of SVG elements
    const onTick = () => {
      linkRef.current
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);
    
      nodeRef.current
        .attr("cx", d => d.x)
        .attr("cy", d => d.y);
    
      labelRef.current
        .attr("x", d => d.x)
        .attr("y", d => d.y);
    }

    // Existing listener is replaced on registering new one
    simulation.on("tick", onTick);

    // Append the d3 root element to container div 
    containerRef.current.append(svgRef.current.node());
  }, []);

  useEffect(() => {
    svgRef.current.call(zoom);
  }, [zoom])

  useEffect(() => {
    if (!containerWidth) {
      return
    }

    svgRef.current.attr("viewBox", [0, 0, containerWidth, containerHeight])
    simulation.force("center", d3.forceCenter(containerWidth / 2, containerHeight / 2));
    zoom.extent([[0, 0], [containerWidth, containerHeight]])
  }, [
    containerWidth,
    containerHeight,
    zoom
  ])

  useEffect(() => {
    update(data)
  }, [data, update])

  return (
    <div ref={measuredRef}>
      <div ref={containerRef} />
    </div>
  )
}

export default ForceDirectedGraph

const color = n => d3.schemeCategory10[n]

const drag = simulation => {
  function dragstarted(d) {
    if (!d3.event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
  }

  function dragended(d) {
    if (!d3.event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }

  return d3.drag()
    .on("start", dragstarted)
    .on("drag", dragged)
    .on("end", dragended);
}

// SVG for arrowheads
// svg.append('defs')
//   .append('marker')
//   .attr("id",'arrowhead')
//   .attr('viewBox','-0 -5 10 10') //the bound of the SVG viewport for the current SVG fragment. defines a coordinate system 10 wide and 10 high starting on (0,-5)
//   .attr('refX',26.5) // x coordinate for the reference point of the marker. If circle is bigger, this need to be bigger.
//   .attr('refY',0)
//   .attr('orient','auto')
//   .attr('markerWidth',5)
//   .attr('markerHeight',5)
//   .attr('xoverflow','visible')
//   .append('svg:path')
//   .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
//   .attr('fill', '#999')
//   .style('stroke','none');
