// Dedicated favicon handler for Vercel
module.exports = (req, res) => {
  console.log(`Favicon requested: ${req.url}`);
  res.status(204).end();
};
