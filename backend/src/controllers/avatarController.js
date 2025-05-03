const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Không tìm thấy file ảnh' });
    }

    // Tạo URL cho ảnh
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    // Cập nhật avatarUrl trong database
    const updatedUser = await req.prisma.user.update({
      where: { id: req.user.id },
      data: { avatarUrl },
      select: {
        id: true,
        email: true,
        displayName: true,
        avatarUrl: true,
      },
    });

    res.json({
      message: 'Cập nhật ảnh đại diện thành công',
      avatarUrl: updatedUser.avatarUrl
    });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({ message: 'Lỗi server: ' + error.message });
  }
};

module.exports = {
  uploadAvatar
}; 