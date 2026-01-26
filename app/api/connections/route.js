// app/api/connections/route.js
import fs from 'fs';
import path from 'path';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const search = searchParams.get('search') || '';
        const minStrength = parseInt(searchParams.get('minStrength') || '1');
        
        const dataDir = path.join(process.cwd(), 'data');
        const connectionsFile = path.join(dataDir, 'connections.json');
        
        if (!fs.existsSync(connectionsFile)) {
            return Response.json({
                success: true,
                connections: [],
                pagination: {
                    page,
                    limit,
                    total: 0,
                    pages: 0
                }
            });
        }
        
        const connections = JSON.parse(fs.readFileSync(connectionsFile, 'utf8'));
        
        // Filter connections
        let filtered = connections;
        
        if (search) {
            const searchLower = search.toLowerCase();
            filtered = filtered.filter(conn => 
                conn.drug.toLowerCase().includes(searchLower) ||
                conn.health_issue.toLowerCase().includes(searchLower) ||
                (conn.mechanism && conn.mechanism.toLowerCase().includes(searchLower))
            );
        }
        
        if (minStrength > 1) {
            filtered = filtered.filter(conn => conn.strength >= minStrength);
        }
        
        // Paginate
        const total = filtered.length;
        const pages = Math.ceil(total / limit);
        const startIndex = (page - 1) * limit;
        const paginated = filtered.slice(startIndex, startIndex + limit);
        
        return Response.json({
            success: true,
            connections: paginated,
            pagination: {
                page,
                limit,
                total,
                pages
            }
        });
        
    } catch (error) {
        return Response.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const dataDir = path.join(process.cwd(), 'data');
        const connectionsFile = path.join(dataDir, 'connections.json');
        
        let connections = [];
        if (fs.existsSync(connectionsFile)) {
            connections = JSON.parse(fs.readFileSync(connectionsFile, 'utf8'));
        }
        
        const newConnection = {
            ...body,
            id: `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            created_at: new Date().toISOString()
        };
        
        connections.unshift(newConnection);
        fs.writeFileSync(connectionsFile, JSON.stringify(connections, null, 2));
        
        return Response.json({
            success: true,
            connection: newConnection
        });
        
    } catch (error) {
        return Response.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}