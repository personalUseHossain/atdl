const { connectToDatabase } = require('./db');
const bcrypt = require('bcrypt');

async function initializeDatabase() {
  try {
    await connectToDatabase();
    console.log('Database connected successfully');
    
    // Create initial admin user if not exists
    const User = require('@/models/User');
    const adminEmail = 'admin@example.com';
    
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const admin = new User({
        email: adminEmail,
        name: 'Admin',
        password: hashedPassword,
        role: 'admin',
        workspace: {
          name: 'Admin Workspace',
          description: 'Administrator workspace'
        }
      });
      
      await admin.save();
      console.log('Admin user created:', adminEmail);
    }
    
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

module.exports = { initializeDatabase };