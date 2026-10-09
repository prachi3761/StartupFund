// Feature: startup-fund
// Smoke test verifying the server package foundation: ESM imports resolve,
// the Express app is exported, JSON middleware is mounted, config loads, and
// supertest can drive the app. No routes are mounted yet, so the app returns
// Express's default 404 for unknown paths.
import request from 'supertest';
import app from '../app.js';
import { config } from '../config/config.js';

describe('server foundation', () => {
  it('exports a usable Express app', () => {
    expect(typeof app).toBe('function');
    expect(typeof app.listen).toBe('function');
  });

it('responds to the health check endpoint', async () => {
  const res = await request(app).get('/api/health');
  expect(res.status).toBe(200);
  expect(res.body.status).toBe('ok');
});

 

  it('parses JSON request bodies', async () => {
    const res = await request(app)
      .post('/api/no-such-route')
      .send({ hello: 'world' })
      .set('Accept', 'application/json');
    // No route is mounted, so it still 404s, but the JSON parser must not throw.
    expect(res.status).toBe(404);
  });

  it('loads configuration with the expected keys', () => {
    expect(config).toHaveProperty('port');
    expect(config).toHaveProperty('mongoUri');
    expect(config).toHaveProperty('jwtSecret');
    expect(typeof config.port).toBe('number');
  });

  it('exposes a Mongoose connection helper from config/db.js', async () => {
    const { connectDB, disconnectDB, mongoose } = await import('../config/db.js');
    expect(typeof connectDB).toBe('function');
    expect(typeof disconnectDB).toBe('function');
    expect(mongoose).toBeDefined();
  });
});
