const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Register a new user
const register = async (req, res) => {
  try {
    const { email, password, displayName } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin' });
    }

    // Check if user already exists
    const userExists = await req.prisma.user.findUnique({
      where: { email }
    });

    if (userExists) {
      return res.status(400).json({ message: 'Email đã được sử dụng' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await req.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        displayName: displayName || email.split('@')[0],
      },
    });

    // Generate token
    const token = generateToken(user.id);

    res.status(201).json({
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      token,
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Lỗi server: ' + error.message });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin' });
    }

    // Check if user exists
    const user = await req.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
    }

    // Check if password matches
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
    }

    // Generate token
    const token = generateToken(user.id);

    res.json({
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Lỗi server: ' + error.message });
  }
};

// Get current user profile
const getMe = async (req, res) => {
  try {
    const user = await req.prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        displayName: true,
        avatarUrl: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Lỗi server: ' + error.message });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const { displayName, avatarUrl, email, currentPassword, newPassword } = req.body;
    
    // Validate input
    if (!displayName && !avatarUrl && !email && !newPassword) {
      return res.status(400).json({ message: 'Không có thông tin nào được cập nhật' });
    }
    
    // Prepare update data
    const updateData = {};
    
    if (displayName) {
      updateData.displayName = displayName;
    }
    
    if (avatarUrl) {
      updateData.avatarUrl = avatarUrl;
    }
    
    // Handle email change if provided
    if (email) {
      // Check if email is already in use
      const existingUser = await req.prisma.user.findUnique({
        where: { email },
      });
      
      if (existingUser && existingUser.id !== req.user.id) {
        return res.status(400).json({ message: 'Email đã được sử dụng bởi tài khoản khác' });
      }
      
      updateData.email = email;
    }
    
    // Handle password change if provided
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Vui lòng nhập mật khẩu hiện tại để thay đổi mật khẩu' });
      }
      
      // Verify current password
      const user = await req.prisma.user.findUnique({
        where: { id: req.user.id },
      });
      
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      
      if (!isMatch) {
        return res.status(401).json({ message: 'Mật khẩu hiện tại không đúng' });
      }
      
      // Hash new password
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(newPassword, salt);
    }
    
    // Update user
    const updatedUser = await req.prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        displayName: true,
        avatarUrl: true,
      },
    });

    res.json({
      message: 'Cập nhật thông tin thành công',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Lỗi server: ' + error.message });
  }
};

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  });
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile
};

