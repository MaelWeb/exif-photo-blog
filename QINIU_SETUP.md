# 七牛云存储配置指南

本指南将帮助您将项目的存储从 Vercel Blob 替换为七牛云存储。

## 1. 七牛云账户设置

### 1.1 注册七牛云账户

1. 访问 [七牛云官网](https://www.qiniu.com/)
2. 注册并完成实名认证
3. 开通对象存储服务

### 1.2 创建存储空间

1. 登录七牛云控制台
2. 进入"对象存储" > "空间管理"
3. 点击"新建空间"
4. 填写空间名称，选择存储区域
5. 设置访问控制为"公开"

### 1.3 获取访问密钥

1. 在控制台右上角点击头像
2. 选择"密钥管理"
3. 创建新的 AccessKey 和 SecretKey
4. 保存好这些密钥信息

### 1.4 配置自定义域名（可选）

1. 在存储空间设置中找到"域名管理"
2. 绑定您的自定义域名
3. 配置 CNAME 记录指向七牛云提供的域名

## 2. 环境变量配置

在您的 `.env.local` 文件中添加以下配置：

```bash
# 七牛云存储配置
QINIU_ACCESS_KEY=your_qiniu_access_key
QINIU_SECRET_KEY=your_qiniu_secret_key
NEXT_PUBLIC_QINIU_BUCKET=your_qiniu_bucket_name
NEXT_PUBLIC_QINIU_REGION=cn-east-1
NEXT_PUBLIC_QINIU_DOMAIN=your-custom-domain.com

# 存储提供商偏好设置
NEXT_PUBLIC_STORAGE_PREFERENCE=qiniu
```

### 环境变量说明

- `QINIU_ACCESS_KEY`: 七牛云 Access Key
- `QINIU_SECRET_KEY`: 七牛云 Secret Key
- `NEXT_PUBLIC_QINIU_BUCKET`: 七牛云存储空间名称
- `NEXT_PUBLIC_QINIU_REGION`: 七牛云存储区域
  - 华北：cn-north-1
  - 华东：cn-east-1
  - 华南：cn-south-1
  - 北美：na0
  - 东南亚：as0
- `NEXT_PUBLIC_QINIU_DOMAIN`: 自定义域名（用于公共访问）
- `NEXT_PUBLIC_STORAGE_PREFERENCE`: 存储提供商偏好，设置为 `qiniu`

## 3. 功能特性

### 3.1 支持的操作

- ✅ 文件上传（客户端和服务端）
- ✅ 文件删除
- ✅ 文件复制
- ✅ 文件列表
- ✅ 图片优化和缓存

### 3.2 安全特性

- 身份验证保护
- 文件类型验证
- 文件大小限制
- 文件名格式验证

## 4. 迁移现有数据

如果您有现有的 Vercel Blob 数据需要迁移到七牛云：

1. 使用管理界面的文件列表功能查看现有文件
2. 下载需要迁移的文件
3. 重新上传到七牛云存储
4. 更新数据库中的文件 URL

## 5. 故障排除

### 5.1 常见问题

**Q: 上传失败，提示认证错误**
A: 检查 `QINIU_ACCESS_KEY` 和 `QINIU_SECRET_KEY` 是否正确

**Q: 文件无法访问**
A: 确认存储空间设置为公开访问，或检查自定义域名配置

**Q: 图片无法显示**
A: 检查 `NEXT_PUBLIC_QINIU_DOMAIN` 配置，确保域名可以正常访问

### 5.2 调试模式

在开发环境中，可以查看浏览器控制台和服务器日志来诊断问题。

## 6. 性能优化

### 6.1 CDN 加速

七牛云提供全球 CDN 加速，建议：

- 选择合适的存储区域
- 配置自定义域名
- 启用 CDN 加速

### 6.2 图片处理

七牛云支持图片处理参数，可以在 URL 中添加参数进行实时处理。

## 7. 成本控制

### 7.1 计费说明

- 存储费用：按实际存储量计费
- 流量费用：按实际下载流量计费
- 请求费用：按 API 调用次数计费

### 7.2 优化建议

- 合理设置图片质量
- 使用适当的图片格式
- 定期清理无用文件

## 8. 技术支持

如果遇到问题，可以：

1. 查看七牛云官方文档
2. 联系七牛云技术支持
3. 查看项目 GitHub Issues
