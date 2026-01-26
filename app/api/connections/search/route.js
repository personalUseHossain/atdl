// app/api/connections/search/route.js
import fs from 'fs';
import path from 'path';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q') || '';
        
        if (!query) {
            return Response.json({
                success: true,
                results: []
            });
        }
        
        const dataDir = path.join(process.cwd(), 'data');
        const connectionsFile = path.join(dataDir, 'connections.json');
        
        if (!fs.existsSync(connectionsFile)) {
            return Response.json({
                success: true,
                results: []
            });
        }
        
        const connections = JSON.parse(fs.readFileSync(connectionsFile, 'utf8'));
        const queryLower = query.toLowerCase();
        
        const results = connections.filter(conn => 
            conn.drug.toLowerCase().includes(queryLower) ||
            conn.health_issue.toLowerCase().includes(queryLower)
        ).slice(0, 10);
        
        return Response.json({
            success: true,
            results
        });
        
    } catch (error) {
        return Response.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}