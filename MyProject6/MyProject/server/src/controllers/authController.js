import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const createToken = (user) => {
  const secret = process.env.JWT_SECRET || 'dev-secret';
  return jwt.sign(
    {
      id: user._id.toString(),
      account: user.account,
      role: user.role
    },
    secret,
    { expiresIn: '7d' }
  );
};

const sanitizeUser = (user) => ({
  id: user._id.toString(),
  account: user.account,
  name: user.name,
  role: user.role
});

export const register = async (req, res, next) => {
  try {
    const { account, password, name } = req.body;

    if (!account || !password || !name) {
      return res.status(400).json({ message: 'Account, password, and name are required' });
    }

    // Registration API only allows customer role
    const role = 'customer';

    const existingUser = await User.findOne({ account });
    if (existingUser) {
      return res.status(409).json({ message: 'Account already exists, please try another account' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      account,
      passwordHash,
      name,
      role
    });

    const token = createToken(user);
    res.status(201).json({ user: sanitizeUser(user), token });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { account, password, role } = req.body;

    if (!account || !password) {
      return res.status(400).json({ message: 'Account and password cannot be empty' });
    }

    const user = await User.findOne({ account });
    if (!user) {
      return res.status(401).json({ message: 'Invalid account or password' });
    }

    // Verify role match
    if (role && user.role !== role) {
      return res.status(403).json({ message: 'Role mismatch, please select the correct role to login' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid account or password' });
    }

    const token = createToken(user);
    res.json({ user: sanitizeUser(user), token });
  } catch (error) {
    next(error);
  }
};



