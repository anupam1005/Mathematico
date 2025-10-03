// Simple test serverless function
module.exports = (req, res) => {
  res.json({
    success: true,
    message: 'Test serverless function is working!',
    method: req.method,
    url: req.url,
    timestamp: new Date().toISOString()
  });
};
