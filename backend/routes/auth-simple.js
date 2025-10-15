const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwtUtils = require('../utils/jwt');

// Hardcoded test users for now
const testUsers = {
  'teacher1@alnoor.edu': {
    id: 'teacher-1',
    email: 'teacher1@alnoor.edu',
    password: '$2a$10$YourHashedPasswordHere', // Will be set below
    role: 'teacher',
    full_name: 'Teacher One',
    school_id: 'school-1'
  },
  'student1@alnoor.edu': {
    id: 'student-1',
    email: 'student1@alnoor.edu',
    password: '$2a$10$YourHashedPasswordHere',
    role: 'student',
    full_name: 'Student One',
    school_id: 'school-1'
  },
  'admin@alnoor.edu': {
    id: 'admin-1',
    email: 'admin@alnoor.edu',
    password: '$2a$10$YourHashedPasswordHere',
    role: 'admin',
    full_name: 'Admin User',
    school_id: 'school-1'
  },
  'parent1@alnoor.edu': {
    id: 'parent-1',
    email: 'parent1@alnoor.edu',
    password: '$2a$10$YourHashedPasswordHere',
    role: 'parent',
    full_name: 'Parent One',
    school_id: 'school-1'
  }
};

// Hash the default password for all test users
const defaultPassword = 'password123';
const hashedPassword = bcrypt.hashSync(defaultPassword, 10);
Object.values(testUsers).forEach(user => {
  user.password = hashedPassword;
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required' 
      });
    }

    // Find user
    const user = testUsers[email.toLowerCase()];
    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid email or password' 
      });
    }

    // Check password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ 
        error: 'Invalid email or password' 
      });
    }

    // Generate tokens
    const tokens = jwtUtils.generateTokens(user);
    
    // Return success
    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.full_name,
        schoolId: user.school_id
      },
      ...tokens
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Login failed',
      details: error.message 
    });
  }
});

// Register endpoint (for schools only)
router.post('/register', async (req, res) => {
  try {
    const {
      email,
      password,
      displayName,
      role,
      schoolName,
      schoolId,
      phone
    } = req.body;

    // Validate required fields
    if (!email || !password || !displayName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if user already exists
    if (testUsers[email]) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = {
      id: `user-${Date.now()}`,
      email,
      password: hashedPassword,
      role: role || 'owner',
      full_name: displayName,
      school_id: schoolId || `school-${Date.now()}`,
      school_name: schoolName,
      phone
    };

    // Add to test users
    testUsers[email] = newUser;

    // Generate tokens
    const { accessToken, refreshToken } = jwtUtils.generateTokens({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role
    });

    res.json({
      message: 'Registration successful',
      user: {
        id: newUser.id,
        email: newUser.email,
        full_name: newUser.full_name,
        role: newUser.role,
        school_id: newUser.school_id
      },
      token: accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Logout endpoint
router.post('/logout', (req, res) => {
  res.json({ message: 'Logout successful' });
});

// Get current user
router.get('/me', (req, res) => {
  res.json({ message: 'Auth check endpoint' });
});

module.exports = router;