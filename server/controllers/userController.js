// userController.js - 用户控制器
import User from "../models/User.js";

// 获取所有用户
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-__v");
    res.status(200).json({
      status: "success",
      results: users.length,
      data: {
        users,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};

// 获取单个用户
export const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-__v");

    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "未找到此用户",
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        user,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};

// 更新用户
export const updateUser = async (req, res) => {
  try {
    // 确保不能通过此路由更新密码
    if (req.body.password) {
      return res.status(400).json({
        status: "fail",
        message: "此路由不用于密码更新，请使用 /updatePassword",
      });
    }

    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).select("-__v");

    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "未找到此用户",
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        user,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }
};

// 删除用户
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "未找到此用户",
      });
    }

    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};

// 更新当前登录用户的密码
export const updatePassword = async (req, res) => {
  try {
    // 1) 获取当前用户
    const user = await User.findById(req.user._id).select("+password");

    // 2) 检查提交的当前密码是否正确
    if (!(await user.comparePassword(req.body.currentPassword))) {
      return res.status(401).json({
        status: "fail",
        message: "当前密码不正确",
      });
    }

    // 3) 如果是正确的，则更新密码
    user.password = req.body.newPassword;
    await user.save();

    // 4) 重新登录用户，发送新JWT
    res.status(200).json({
      status: "success",
      message: "密码更新成功",
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }
};

// 获取当前登录的用户信息
export const getMe = (req, res) => {
  res.status(200).json({
    status: "success",
    data: {
      user: req.user,
    },
  });
};
