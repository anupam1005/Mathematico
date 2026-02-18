// Trust proxy configuration for Vercel and production environments
const configureTrustProxy = (app) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const isVercel = process.env.VERCEL === '1';
  
  if (isProduction || isVercel) {
    // Trust the first proxy hop (Vercel's edge network)
    app.set('trust proxy', 1);
    
    console.log('✅ Trust proxy configured for production/Vercel environment');
    console.log(`   - Environment: ${isProduction ? 'production' : 'development'}`);
    console.log(`   - Vercel: ${isVercel ? 'yes' : 'no'}`);
    console.log(`   - Trust proxy level: 1`);
  } else {
    console.log('⚠️ Trust proxy not configured (development mode)');
  }
};

module.exports = configureTrustProxy;
