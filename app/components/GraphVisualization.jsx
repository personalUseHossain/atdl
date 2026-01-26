// app/components/GraphVisualization.jsx - ALTERNATIVE
'use client';

import { useEffect, useRef } from 'react';

// Import CSS directly (we'll load it dynamically)
const loadVisNetworkCSS = () => {
  if (typeof document !== 'undefined') {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/vis-network/9.1.9/dist/dist/vis-network.min.css';
    document.head.appendChild(link);
  }
};

const GraphVisualization = ({ graphData, onNodeSelect, onEdgeSelect, options = {} }) => {
  const containerRef = useRef(null);
  const networkRef = useRef(null);

  // Load CSS on component mount
  useEffect(() => {
    loadVisNetworkCSS();
  }, []);

  // Default options
  const defaultOptions = {
    layout: 'force',
    physics: true,
    showLabels: true,
    nodeColors: {
      drug: '#4A90E2',
      health_issue: '#50E3C2'
    }
  };

  const mergedOptions = { ...defaultOptions, ...options };

  useEffect(() => {
    if (!containerRef.current || !graphData || !graphData.nodes) return;

    // Dynamically import vis-network
    import('vis-network/peer').then(({ Network, DataSet }) => {
      // Clean up existing network
      if (networkRef.current) {
        networkRef.current.destroy();
      }

      // Create nodes dataset (same as before)
      const nodes = new DataSet(
        graphData.nodes.map(node => {
          const isDrug = node.type === 'drug';
          
          return {
            id: node.id,
            label: mergedOptions.showLabels ? node.label : '',
            title: `
              ${node.label}
              Type: ${node.type.replace('_', ' ')}
              Connections: ${node.total_connections || 0}
              ${node.size ? `Size: ${node.size}` : ''}
            `.trim(),
            color: {
              background: mergedOptions.nodeColors[node.type] || '#666',
              border: '#333',
              highlight: {
                background: mergedOptions.nodeColors[node.type] || '#666',
                border: '#111'
              }
            },
            shape: isDrug ? 'hexagon' : 'circle',
            size: node.size || (isDrug ? 25 : 20),
            borderWidth: 2,
            font: {
              size: 12,
              color: '#333',
              face: 'Arial',
              strokeWidth: 0,
              strokeColor: '#ffffff'
            },
            shadow: {
              enabled: true,
              color: 'rgba(0,0,0,0.1)',
              size: 10,
              x: 0,
              y: 0
            },
            ...node
          };
        })
      );

      // Create edges dataset (same as before)
      const edges = new DataSet(
        graphData.edges.map((edge, index) => {
          const strength = edge.value || 1;
          let edgeColor, edgeWidth;
          
          if (strength >= 4) {
            edgeColor = '#10b981';
            edgeWidth = 4;
          } else if (strength >= 3) {
            edgeColor = '#f59e0b';
            edgeWidth = 3;
          } else {
            edgeColor = '#ef4444';
            edgeWidth = 2;
          }

          return {
            id: edge.id || `edge-${index}`,
            from: edge.source,
            to: edge.target,
            label: mergedOptions.showLabels ? `⭐${strength}` : '',
            title: `
              Strength: ${strength}/5
              ${edge.papers ? `Papers: ${edge.papers}` : ''}
              ${edge.relationship ? `Relationship: ${edge.relationship}` : ''}
              ${edge.has_full_text ? '✓ Has full text evidence' : ''}
            `.trim(),
            color: {
              color: edgeColor,
              highlight: '#1a1a1a',
              hover: edgeColor
            },
            width: edgeWidth,
            arrows: {
              to: {
                enabled: true,
                scaleFactor: 0.5
              }
            },
            smooth: {
              type: 'cubicBezier',
              roundness: 0.4
            },
            dashes: strength < 2,
            ...edge
          };
        })
      );

      // Network options (same as before)
      const networkOptions = {
        nodes: {
          shapeProperties: {
            useBorderWithImage: true
          },
          scaling: {
            min: 10,
            max: 50,
            label: {
              enabled: true,
              min: 8,
              max: 30,
              maxVisible: 30,
              drawThreshold: 5
            }
          }
        },
        edges: {
          scaling: {
            min: 1,
            max: 10
          },
          selectionWidth: function (width) { return width * 2; },
          font: {
            size: 11,
            align: 'top'
          }
        },
        physics: mergedOptions.physics ? {
          enabled: true,
          stabilization: {
            enabled: true,
            iterations: 1000,
            updateInterval: 100
          },
          barnesHut: {
            gravitationalConstant: -2000,
            centralGravity: 0.3,
            springLength: 200,
            springConstant: 0.04,
            damping: 0.09,
            avoidOverlap: 0.5
          },
          forceAtlas2Based: {
            gravitationalConstant: -50,
            centralGravity: 0.01,
            springConstant: 0.08,
            springLength: 100,
            damping: 0.4,
            avoidOverlap: 0
          },
          repulsion: {
            centralGravity: 0.2,
            springLength: 200,
            springConstant: 0.05,
            nodeDistance: 100,
            damping: 0.09
          },
          hierarchicalRepulsion: {
            centralGravity: 0.0,
            springLength: 100,
            springConstant: 0.01,
            nodeDistance: 120,
            damping: 0.09
          },
          maxVelocity: 50,
          minVelocity: 0.1,
          solver: 'barnesHut',
          timestep: 0.5,
          adaptiveTimestep: true
        } : {
          enabled: false
        },
        interaction: {
          hover: true,
          hoverConnectedEdges: true,
          selectConnectedEdges: true,
          tooltipDelay: 200,
          hideEdgesOnDrag: false,
          hideNodesOnDrag: false,
          zoomView: true,
          dragView: true,
          navigationButtons: true,
          keyboard: {
            enabled: true,
            speed: { x: 10, y: 10, zoom: 0.02 },
            bindToWindow: true
          }
        },
        layout: {
          improvedLayout: true,
          hierarchical: mergedOptions.layout === 'hierarchical' ? {
            enabled: true,
            direction: 'UD',
            sortMethod: 'hubsize',
            nodeSpacing: 200,
            treeSpacing: 200
          } : mergedOptions.layout === 'radial' ? {
            enabled: true,
            direction: 'DU',
            levelSeparation: 200,
            nodeSpacing: 100,
            treeSpacing: 200
          } : {
            enabled: false
          }
        },
        configure: {
          enabled: false,
          filter: 'nodes,edges',
          showButton: false
        }
      };

      // Create the network
      const data = { nodes, edges };
      networkRef.current = new Network(containerRef.current, data, networkOptions);

      // Add event listeners
      networkRef.current.on('click', (params) => {
        if (params.nodes.length > 0) {
          const nodeId = params.nodes[0];
          const node = nodes.get(nodeId);
          if (onNodeSelect) onNodeSelect(node);
        } else if (params.edges.length > 0) {
          const edgeId = params.edges[0];
          const edge = edges.get(edgeId);
          if (onEdgeSelect) onEdgeSelect(edge);
        } else {
          if (onNodeSelect) onNodeSelect(null);
          if (onEdgeSelect) onEdgeSelect(null);
        }
      });

      // Fit to screen
      setTimeout(() => {
        if (networkRef.current) {
          networkRef.current.fit({
            animation: {
              duration: 1000,
              easingFunction: 'easeInOutQuad'
            }
          });
        }
      }, 500);

    }).catch(error => {
      console.error('Failed to load vis-network:', error);
    });

    // Cleanup
    return () => {
      if (networkRef.current) {
        networkRef.current.destroy();
        networkRef.current = null;
      }
    };
  }, [graphData, mergedOptions, onNodeSelect, onEdgeSelect]);

  return (
    <div className="w-full h-full">
      <div 
        ref={containerRef} 
        className="w-full h-full border-0"
        style={{ minHeight: '600px' }}
      />
    </div>
  );
};

export default GraphVisualization;