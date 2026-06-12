// app.js
const express = require('express')
const path = require('path')
const { Pool } = require('pg')

const app = express()
const pool = new Pool({
  host: 'postgres',
  database: 'demodb',
  user: 'postgres',
  password: 'demo'
})

app.use(express.json())

// --- UI ---
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

// --- Health ---
app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

// --- Intentional status codes ---
app.get('/redirect', (req, res) => {
  res.redirect(302, '/health')
})

app.get('/bad-request', (req, res) => {
  res.status(400).json({ error: 'bad request' })
})

app.get('/forbidden', (req, res) => {
  res.status(403).json({ error: 'forbidden' })
})

app.get('/not-found', (req, res) => {
  res.status(404).json({ error: 'not found' })
})

app.get('/always-error', (req, res) => {
  res.status(500).json({ error: 'always broken' })
})

// --- Slow ---
app.get('/slow', async (req, res) => {
  try {
    await pool.query('SELECT pg_sleep(2)')
    res.json({ status: 'slow but done', delay: '2s' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'database error' })
  }
})

// --- Users ---
app.get('/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users ORDER BY id')
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'database error' })
  }
})

app.post('/users', async (req, res) => {
  const { name, email, role = 'user' } = req.body
  if (!name || !email) return res.status(400).json({ error: 'name and email required' })
  try {
    const result = await pool.query(
      'INSERT INTO users (name, email, role) VALUES ($1, $2, $3) RETURNING *',
      [name, email, role]
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'database error' })
  }
})

app.get('/users/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.params.id])
    if (result.rows.length === 0) return res.status(404).json({ error: 'not found' })
    res.json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'database error' })
  }
})

app.put('/users/:id', async (req, res) => {
  const { name, role } = req.body
  try {
    const result = await pool.query(
      'UPDATE users SET name = COALESCE($1, name), role = COALESCE($2, role) WHERE id = $3 RETURNING *',
      [name || null, role || null, req.params.id]
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'not found' })
    res.json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'database error' })
  }
})

app.delete('/users/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [req.params.id])
    if (result.rows.length === 0) return res.status(404).json({ error: 'not found' })
    res.json({ deleted: result.rows[0].id })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'database error' })
  }
})

app.listen(5000, () => {
  console.log('Server running on port 5000')
})