const express = require('express'); 
const router = express.Router(); 
const bcrypt = require('bcryptjs'); 
const jwt = require('jsonwebtoken'); 
const User = require('../models/User'); 
const logger = require('../config/logger'); 
 
// POST /api/auth/register 
router.post('/register', async (req, res) => { 
  try { 
    const { email, password } = req.body; 
    if (!email || !password) { 
      return res.status(400).json({ error: 'Email and password are required' }); 
    } 
 
    const existingUser = await User.findOne({ email }); 
    if (existingUser) { 
      return res.status(400).json({ error: 'User already exists' }); 
    } 
 
    const salt = await bcrypt.genSalt(10); 
    const hashedPassword = await bcrypt.hash(password, salt); 
 
    const newUser = new User({ email, password: hashedPassword }); 
    await newUser.save(); 
 
    logger.info({ route: '/api/auth/register', statusCode: 201, userId: newUser._id }); 
    res.status(201).json({ message: 'User registered successfully' }); 
  } catch (error) { 
    logger.error({ route: '/api/auth/register', error: error.message }); 
    res.status(500).json({ error: 'Registration failed' }); 
  } 
}); 
 
// POST /api/auth/login 
router.post('/login', async (req, res) => { 
  try { 
    const { email, password } = req.body; 
    const user = await User.findOne({ email }); 
    if (!user) { 
      return res.status(400).json({ error: 'Invalid credentials' }); 
    } 
 
    const isMatch = await bcrypt.compare(password, user.password); 
    if (!isMatch) { 
      return res.status(400).json({ error: 'Invalid credentials' }); 
    } 
 
    const token = jwt.sign( 
      { id: user._id.toString(), email: user.email }, 
      process.env.JWT_SECRET, 
      { expiresIn: '8h' } 
    ); 
 
    logger.info({ route: '/api/auth/login', statusCode: 200, userId: user._id }); 
    res.json({ token, message: 'Login successful' }); 
  } catch (error) { 
    logger.error({ route: '/api/auth/login', error: error.message }); 
    res.status(500).json({ error: 'Login failed' }); 
  } 
}); 
 
module.exports = router;

