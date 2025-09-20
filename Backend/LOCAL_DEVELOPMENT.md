# Local Backend Development Setup

This guide helps you set up the local backend server for mobile app development.

## Quick Start

### Option 1: Using the startup script (Recommended)
```bash
cd Backend
node start-local-server.js
```

### Option 2: Manual setup
```bash
cd Backend
npm install
npm start
```

## Mobile App Configuration

### For Android Emulator
The mobile app is configured to connect to `http://10.0.2.2:5000` by default.

### For Physical Device
1. Find your computer's IP address:
   - Windows: `ipconfig`
   - Mac/Linux: `ifconfig` or `ip addr show`

2. Update the IP in `mathematico/src/config.ts`:
   ```typescript
   const BACKEND = 'http://YOUR_IP:5000';
   ```

### For iOS Simulator
The mobile app should connect to `http://localhost:5000` automatically.

## API Endpoints

Once the server is running, you can access:

- **Auth API**: `http://localhost:5000/api/v1/auth`
- **Admin API**: `http://localhost:5000/api/v1/admin`
- **Student API**: `http://localhost:5000/api/v1`

## Test Credentials

- **Admin User**: 
  - Email: `dc2006089@gmail.com`
  - Password: `Myname*321`

- **Regular User**: 
  - Email: `any@email.com`
  - Password: `anypassword`

## Troubleshooting

### "Route not found" Error
1. Make sure the backend server is running on port 5000
2. Check the console logs for any errors
3. Verify the mobile app is connecting to the correct IP address

### Network Connection Issues
1. Ensure your mobile device and computer are on the same network
2. Check firewall settings
3. Try using the production backend URL as fallback

### Database Connection Issues
The server will use fallback data if the database connection fails, so the app should still work.

## Production vs Development

- **Development**: Uses local server at `http://localhost:5000` or your IP
- **Production**: Uses Vercel deployment at `https://mathematico-backend-new.vercel.app`

The mobile app automatically switches between development and production based on the `__DEV__` flag.

## Environment Variables

Create a `.env` file in the Backend directory:

```env
# Database Configuration
DB_HOST=your_database_host
DB_PORT=your_database_port
DB_USERNAME=your_database_username
DB_PASSWORD=your_database_password
DB_DATABASE=your_database_name

# Server Configuration
PORT=5000
NODE_ENV=development
```

## Support

If you encounter issues:
1. Check the server console logs
2. Verify network connectivity
3. Try the production backend URL
4. Check the mobile app console logs
