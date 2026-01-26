// app/api/connections/[id]/route.js
import fs from 'fs';
import path from 'path';

export async function GET(request, { params }) {
    try {
        const { id } = params;
        const dataDir = path.join(process.cwd(), 'data');
        const connectionsFile = path.join(dataDir, 'connections.json');
        
        if (!fs.existsSync(connectionsFile)) {
            return Response.json({
                success: false,
                error: 'Connection not found'
            }, { status: 404 });
        }
        
        const connections = JSON.parse(fs.readFileSync(connectionsFile, 'utf8'));
        const connection = connections.find(conn => conn.id === id);
        
        if (!connection) {
            return Response.json({
                success: false,
                error: 'Connection not found'
            }, { status: 404 });
        }
        
        return Response.json({
            success: true,
            connection
        });
        
    } catch (error) {
        return Response.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}