const express = require('express');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3000;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || 'taskflow',
  user: process.env.DB_USER || 'taskflow',
  password: process.env.DB_PASSWORD || 'taskflowpass'
});

function log(level, message, extra = {}) {
  console.log(JSON.stringify({ level, message, timestamp: new Date().toISOString(), ...extra }));
}

app.use(express.json());
app.use((req, res, next) => {
  const startedAt = Date.now();
  res.on('finish', () => {
    log('info', 'request_completed', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      durationMs: Date.now() - startedAt
    });
  });
  next();
});

async function initializeDatabase() {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      done BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const retries = 10;
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      await pool.query(createTableQuery);
      log('info', 'database_ready');
      return;
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }
      log('warn', 'database_unavailable_retrying', { attempt, error: error.message });
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }
}

function mapTask(row) {
  return {
    id: row.id,
    title: row.title,
    done: row.done,
    createdAt: row.created_at.toISOString()
  };
}

app.get('/healthz', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.get('/tasks', async (_req, res, next) => {
  try {
    const result = await pool.query('SELECT id, title, done, created_at FROM tasks ORDER BY created_at ASC');
    res.json(result.rows.map(mapTask));
  } catch (error) {
    next(error);
  }
});

app.get('/tasks/:id', async (req, res, next) => {
  try {
    const result = await pool.query('SELECT id, title, done, created_at FROM tasks WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    return res.json(mapTask(result.rows[0]));
  } catch (error) {
    return next(error);
  }
});

app.post('/tasks', async (req, res, next) => {
  try {
    const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const result = await pool.query(
      'INSERT INTO tasks (title, done) VALUES ($1, $2) RETURNING id, title, done, created_at',
      [title, false]
    );
    return res.status(201).json(mapTask(result.rows[0]));
  } catch (error) {
    return next(error);
  }
});

app.put('/tasks/:id', async (req, res, next) => {
  try {
    const id = req.params.id;
    const title = req.body?.title;
    const done = req.body?.done;

    if (title !== undefined && (typeof title !== 'string' || title.trim() === '')) {
      return res.status(400).json({ error: 'Title must be a non-empty string' });
    }

    if (done !== undefined && typeof done !== 'boolean') {
      return res.status(400).json({ error: 'Done must be a boolean' });
    }

    if (title === undefined && done === undefined) {
      return res.status(400).json({ error: 'At least one field is required' });
    }

    const updates = [];
    const values = [];

    if (title !== undefined) {
      updates.push(`title = $${values.length + 1}`);
      values.push(title.trim());
    }

    if (done !== undefined) {
      updates.push(`done = $${values.length + 1}`);
      values.push(done);
    }

    values.push(id);
    const result = await pool.query(
      `UPDATE tasks SET ${updates.join(', ')} WHERE id = $${values.length} RETURNING id, title, done, created_at`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    return res.json(mapTask(result.rows[0]));
  } catch (error) {
    return next(error);
  }
});

app.delete('/tasks/:id', async (req, res, next) => {
  try {
    const result = await pool.query('DELETE FROM tasks WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

app.use((err, _req, res, _next) => {
  log('error', 'request_failed', { error: err.message, stack: err.stack });
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({ error: 'Internal server error' });
});

initializeDatabase()
  .then(() => {
    app.listen(port, () => {
      log('info', 'server_listening', { port });
    });
  })
  .catch((error) => {
    log('error', 'startup_failed', { error: error.message });
    process.exit(1);
  });
