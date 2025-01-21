const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const ROLES = ['owner', 'consumer'];

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true, enum: ROLES },
});

// Static method to find user by email
userSchema.statics.findUserByEmail = async function (email) {
  return this.findOne({ email });
};

// Static method to create a new user
userSchema.statics.createUser = async function (name, email, password, role) {
  if (!ROLES.includes(role)) {
    throw new Error('Invalid role. Role must be either "owner" or "consumer".');
  }

  const existingUser = await this.findOne({ email });
  if (existingUser) {
    throw new Error('Email already exists. Please choose a different email.');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await this.create({ name, email, password: hashedPassword, role });
  return newUser;
};

// Create a model from the schema
const User = mongoose.model('User', userSchema);

module.exports = User;
