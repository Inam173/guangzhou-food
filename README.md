# 🍜 广州美食地图

一个个人美食探店收藏网站，用于记录和展示在广州发现的美食小店。

## 🚀 快速开始

### 第一步：创建 GitHub 仓库

1. 登录 [GitHub](https://github.com)（用 Google 登录也可以）
2. 点击右上角 **+** → **New repository**
3. 仓库名填 `guangzhou-food`（或你喜欢的名字）
4. 选 **Public**（公开）
5. **不要**勾选 "Add a README file"
6. 点 **Create repository**

### 第二步：创建 Personal Access Token

1. 打开 [https://github.com/settings/tokens/new](https://github.com/settings/tokens/new?scopes=repo&description=gzfood-manager)
2. Note 填 `gzfood-manager`
3. Expiration 选 **No expiration**（永不过期）
4. 勾选 **repo** 权限（会自动勾选 repo 下的所有子项）
5. 拉到最下面点 **Generate token**
6. ⚠️ **立刻复制 Token**（只显示一次！），保存好

### 第三步：上传代码

在项目目录下运行以下命令：

```bash
cd guangzhou-food
git init
git add .
git commit -m "🎉 初始化广州美食地图"
git branch -M main
git remote add origin https://github.com/你的用户名/guangzhou-food.git
git push -u origin main
```

### 第四步：开启 GitHub Pages

1. 打开仓库页面 → **Settings** → **Pages**
2. Source 选 **Deploy from a branch**
3. Branch 选 **main**，目录选 **/ (root)**
4. 点 **Save**
5. 等待 1-2 分钟，页面会显示 `Your site is live at https://xxx.github.io/guangzhou-food/`

### 第五步：配置管理后台

1. 打开 `https://你的用户名.github.io/guangzhou-food/admin.html`
2. 填写配置：
   - **用户名**：你的 GitHub 用户名
   - **仓库名**：`guangzhou-food`
   - **分支名**：`main`
   - **Token**：第二步生成的 `ghp_...`
3. 点 **测试连接** → 确认显示「连接成功」
4. 点 **保存配置**

一切就绪！现在你可以在管理后台新增店铺了。

## 📱 使用方式

### 浏览
- 打开 `index.html`（或 GitHub Pages 地址）查看所有店铺
- 手机、平板、电脑都自适应

### 新增店铺
1. 打开管理后台
2. 点「➕ 新增店铺」
3. 填写表单
4. 点「💾 保存到 GitHub」
5. 等约 1 分钟后主页即可看到新卡片

### 图片
- 填写图片的 URL 链接即可
- 推荐使用 [imgur](https://imgur.com)、微博图床等免费图床

### 地图
- 在表单中填写店铺的经纬度坐标
- 可用 [高德坐标拾取](https://lbs.amap.com/tools/picker) 获取坐标
- 不填坐标也能用，会自动用地址搜索

### 备份
- 管理后台点「📥 导出」下载完整 JSON 备份
- 点「📤 导入」可以从备份文件恢复

## 🛠 技术说明

- 纯静态网站：HTML + CSS + JavaScript
- 样式：Tailwind CSS（CDN 引入，无需安装）
- 数据存储：GitHub 仓库中的 `data.json`
- 数据写入：GitHub Contents API（需要 Personal Access Token）
- 部署：GitHub Pages（免费）

## 📂 文件结构

```
├── index.html      # 主页面 - 卡片画廊
├── admin.html      # 管理后台 - 增删改查
├── app.js          # 主页逻辑
├── admin.js        # 管理后台逻辑
├── style.css       # 自定义样式
├── data.json       # 店铺数据
└── README.md       # 本文件
```
