import express from "express";
const router = express.Router();

// 模拟权限数据
let permissions = [
  {
    id: 1,
    name: "user:create",
    displayName: "创建用户",
    description: "允许创建用户",
    module: "user",
    action: "create",
    resource: "user",
  },
  {
    id: 2,
    name: "user:read",
    displayName: "查看用户",
    description: "允许查看用户",
    module: "user",
    action: "read",
    resource: "user",
  },
  {
    id: 3,
    name: "news:create",
    displayName: "创建新闻",
    description: "允许创建新闻",
    module: "news",
    action: "create",
    resource: "news",
  },
];

// 获取权限列表
router.get("/", (req, res) => {
  res.json(permissions);
});

// 创建权限
router.post("/", (req, res) => {
  const newPerm = { ...req.body, id: Date.now() };
  permissions.push(newPerm);
  res.json({ data: newPerm });
});

// 更新权限
router.put("/:id", (req, res) => {
  const id = Number(req.params.id);
  const idx = permissions.findIndex((p) => p.id === id);
  if (idx === -1) return res.status(404).json({ message: "权限不存在" });
  permissions[idx] = { ...permissions[idx], ...req.body };
  res.json({ data: permissions[idx] });
});

// 删除权限
router.delete("/:id", (req, res) => {
  const id = Number(req.params.id);
  permissions = permissions.filter((p) => p.id !== id);
  res.json({ data: true });
});

// 权限树接口
router.get("/tree", (req, res) => {
  // 简单分组为模块树
  const tree = {};
  permissions.forEach((p) => {
    if (!tree[p.module]) tree[p.module] = [];
    tree[p.module].push({ ...p });
  });
  res.json({ data: tree });
});

export default router;
