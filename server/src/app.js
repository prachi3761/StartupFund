
import express from 'express';
import authRoutes from './routes/authRoutes.js';
import startupRoutes from './routes/startupRoutes.js';
import discoveryRoutes from './routes/discoveryRoutes.js';
import shortlistRoutes from './routes/shortlistRoutes.js';

const app = express();

app.use((req, res, next) => {
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
  ];

  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PATCH, DELETE, OPTIONS'
  );

  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
});


app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'StartupFund API is running.' });
});

app.use('/api/auth', authRoutes);
app.use('/api/startups', startupRoutes);
app.use('/api/discover', discoveryRoutes);
app.use('/api/shortlist', shortlistRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found.' });
});

app.use((err, req, res, next) => {
  console.error(err);

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Validation failed.',
      errors: Object.values(err.errors).map((item) => item.message),
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid ID.' });
  }

  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({ message: 'Invalid JSON body.' });
  }

  res.status(err.status || 500).json({
    message: err.status && err.status < 500
      ? err.message
      : 'Internal server error.',
  });
});

export default app;
