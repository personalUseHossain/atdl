'use client';

import { useEffect, useRef } from 'react';
import { Network } from 'vis-network';
import { DataSet } from 'vis-data';

const GraphVisualization = ({ graphData, onNodeSelect, onEdgeSelect, options = {} }) => {
  const networkRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!graphData || !graphData.nodes || !graphData.edges) return;

    // Create datasets
    const nodes = new DataSet(graphData.nodes.map(node => ({
      id: node.id,
      label: node.label,
      color: node.color || '#4A90E2',
      size: node.size || 30,
      shape: 'dot',
      title: `
        <div style="padding: 5px; max-width: 300px;">
          <strong>${node.label}</strong><br/>
          Type: ${node.type}<br/>
          Connections: ${node.total_connections || 0}<br/>
          ${node.size ? `Size: ${node.size}<br/>` : ''}
        </div>
      `,
      ...node
    })));

    const edges = new DataSet(graphData.edges.map(edge => ({
      id: edge.id,
      from: edge.source,
      to: edge.target,
      label: `Strength: ${edge.value}`,
      value: edge.value || 1,
      width: edge.value || 1,
      color: {
        color: getEdgeColor(edge.value),
        highlight: getEdgeColor(edge.value),
        hover: getEdgeColor(edge.value)
      },
      title: `
        <div style="padding: 5px; max-width: 300px;">
          <strong>Connection Strength: ${edge.value || 1}/5</strong><br/>
          ${edge.relationship ? `Relationship: ${edge.relationship}<br/>` : ''}
          ${edge.papers ? `Papers: ${edge.papers}<br/>` : ''}
        </div>
      `,
      ...edge
    })));

    // Network options
    const networkOptions = {
      nodes: {
        shape: 'dot',
        scaling: {
          min: 20,
          max: 50,
          label: {
            enabled: true,
            min: 14,
            max: 30,
            maxVisible: 30,
            drawThreshold: 5
          }
        },
        font: {
          size: 14,
          face: 'Arial',
          color: '#333333'
        },
        borderWidth: 2,
        borderWidthSelected: 4
      },
      edges: {
        width: 2,
        color: {
          color: '#848484',
          highlight: '#848484',
          hover: '#848484'
        },
        smooth: {
          type: 'continuous',
          roundness: 0.5
        },
        arrows: {
          to: {
            enabled: false
          },
          middle: {
            enabled: false
          },
          from: {
            enabled: false
          }
        },
        selectionWidth: 3,
        hoverWidth: 3
      },
      physics: options.physics !== false ? {
        enabled: true,
        stabilization: {
          iterations: 100
        },
        barnesHut: {
          gravitationalConstant: -2000,
          centralGravity: 0.3,
          springLength: 150,
          springConstant: 0.04,
          damping: 0.09,
          avoidOverlap: 0.2
        }
      } : { enabled: false },
      interaction: {
        hover: true,
        hoverConnectedEdges: true,
        selectConnectedEdges: true,
        tooltipDelay: 200,
        hideEdgesOnDrag: false,
        hideEdgesOnZoom: false,
        multiselect: false,
        navigationButtons: true,
        keyboard: {
          enabled: true,
          speed: { x: 10, y: 10, zoom: 0.02 }
        }
      },
      layout: options.layout === 'hierarchical' ? {
        hierarchical: {
          enabled: true,
          levelSeparation: 150,
          nodeSpacing: 100,
          treeSpacing: 200,
          blockShifting: true,
          edgeMinimization: true,
          parentCentralization: true,
          direction: 'UD',
          sortMethod: 'hubsize'
        }
      } : options.layout === 'radial' ? {
        hierarchical: false
      } : {
        improvedLayout: true,
        randomSeed: 42
      },
      groups: {
        drug: {
          color: { background: '#4A90E2', border: '#2C6DB4' },
          shape: 'dot'
        },
        health_issue: {
          color: { background: '#50E3C2', border: '#2EB8A0' },
          shape: 'diamond'
        }
      }
    };

    // Disable physics if specified
    if (options.physics === false) {
      networkOptions.physics = { enabled: false };
    }

    // Create network
    const data = { nodes, edges };
    networkRef.current = new Network(containerRef.current, data, networkOptions);

    // Event listeners
    networkRef.current.on('click', (params) => {
      if (params.nodes.length > 0) {
        const nodeId = params.nodes[0];
        const node = nodes.get(nodeId);
        onNodeSelect?.(node);
        onEdgeSelect?.(null);
      } else if (params.edges.length > 0) {
        const edgeId = params.edges[0];
        const edge = edges.get(edgeId);
        onEdgeSelect?.(edge);
        onNodeSelect?.(null);
      } else {
        onNodeSelect?.(null);
        onEdgeSelect?.(null);
      }
    });

    networkRef.current.on('doubleClick', (params) => {
      if (params.nodes.length > 0) {
        networkRef.current.focus(params.nodes[0], {
          scale: 1.5,
          animation: { duration: 1000, easingFunction: 'easeInOutQuad' }
        });
      }
    });

    // Handle window resize
    const handleResize = () => {
      if (networkRef.current) {
        networkRef.current.redraw();
      }
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (networkRef.current) {
        networkRef.current.destroy();
      }
    };
  }, [graphData, options.layout, options.physics]);

  const getEdgeColor = (strength) => {
    switch (strength) {
      case 5: return '#FF4444';
      case 4: return '#FF8844';
      case 3: return '#FFCC44';
      case 2: return '#44CCFF';
      case 1: return '#4488FF';
      default: return '#888888';
    }
  };

  return (
    <div 
      ref={containerRef} 
      style={{ 
        width: '100%', 
        height: '100%',
        backgroundColor: '#f8fafc',
        borderRadius: '8px'
      }} 
    />
  );
};

export default GraphVisualization;