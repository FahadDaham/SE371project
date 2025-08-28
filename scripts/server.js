const express = require('express');
const multer = require('multer');
const { Pool } = require('pg');
const cors = require('cors');
const app = express();
app.use(cors());
const upload = multer({ dest: 'uploads' });
const bodyParser = require('body-parser');
app.use('/uploads', express.static('uploads'));

// PostgreSQL connection
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'recipeshare',
    password: '123',
    port: 5432,
});

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API route to fetch all recipes
app.get('/recipes', async (req, res) => {
    try {
        // Query to get all recipes from the database
        const result = await pool.query('SELECT * FROM recipes');
        res.status(200).json(result.rows); // Send data as JSON response
    } catch (error) {
        console.error('Error fetching recipes:', error);
        res.status(500).json({ error: 'Failed to fetch recipes' }); // Handle errors
    }
});

// search recipe route
app.get('/recipes/search', async (req, res) => {
    const { query } = req.query;

    try {
        if (!query || query.trim() === '') {
            return res.status(400).json({ error: 'Search query is required' });
        }

        const searchQuery = `%${query.toLowerCase()}%`;
        const result = await pool.query(
            `SELECT * FROM recipes WHERE LOWER(title) LIKE $1 OR LOWER(description) LIKE $1`,
            [searchQuery]
        );

        res.status(200).json(result.rows || []); // Always return an array
    } catch (error) {
        console.error('Error searching recipes:', error.message);
        res.status(500).json({ error: 'An error occurred while processing your search.' });
    }
});

// Get a recipe by ID
app.get('/recipes/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM recipes WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Recipe not found' });
        }
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching recipe:', error);
        res.status(500).json({ error: 'Failed to fetch recipe' });
    }
});


// API to save recipe
app.post('/upload', upload.single('image'), async (req, res) => {
    const { title, description, category } = req.body;
    const imagePath = req.file ? req.file.path : null;

    try {
        const result = await pool.query(
            'INSERT INTO recipes (title, description, image_path, category) VALUES ($1, $2, $3, $4) RETURNING *',
            [title, description, imagePath, category]
        );
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update a recipe
app.put('/recipes/:id', async (req, res) => {
    const { id } = req.params; // Recipe ID from the URL
    const { title, description, category } = req.body; // Updated recipe details

    try {
        const result = await pool.query(
            'UPDATE recipes SET title = $1, description = $2, category = $3 WHERE id = $4 RETURNING *',
            [title, description, category, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Recipe not found' });
        }

        res.status(200).json(result.rows[0]); // Return the updated recipe
    } catch (error) {
        console.error('Error updating recipe:', error);
        res.status(500).json({ error: 'Failed to update recipe' });
    }
});

// Delete a recipe by ID
app.delete('/recipes/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query('DELETE FROM recipes WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Recipe not found' });
        }

        res.status(200).json({ message: 'Recipe deleted successfully', recipe: result.rows[0] });
    } catch (error) {
        console.error('Error deleting recipe:', error);
        res.status(500).json({ error: 'Failed to delete recipe' });
    }
});

app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});