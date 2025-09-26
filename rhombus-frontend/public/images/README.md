# 背景图片设置说明

## 如何更换背景图片

1. **放置图片文件**
   - 将你的图片文件放在这个文件夹中：`public/images/`
   - 支持的格式：jpg, png, webp, gif

2. **修改CSS文件**
   - 打开文件：`src/App.css`
   - 找到第28行的 `background-image` 属性
   - 将URL改为：`url('/images/你的图片名.jpg')`

## 示例

```css
/* 原来的在线图片 */
background-image: url('https://images.unsplash.com/photo-1557804506-669a67965ba0...');

/* 改为本地图片 */
background-image: url('/images/my-background.jpg');
```

## 建议

- **图片尺寸**：建议使用1920x1080或更高分辨率的图片
- **文件大小**：建议压缩到1MB以下以提高加载速度
- **图片主题**：科技、数据、抽象图案效果较好

## 目前使用的图片

当前使用的是Unsplash上的一张科技主题图片，展示数据可视化和现代科技感。