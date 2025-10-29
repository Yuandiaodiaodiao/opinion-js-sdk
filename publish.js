#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 读取 .env.test 文件获取 NPM_TOKEN
const envPath = path.join(__dirname, '.env.test');
const envContent = fs.readFileSync(envPath, 'utf-8');
const npmTokenMatch = envContent.match(/NPM_TOKEN=(.+)/);

if (!npmTokenMatch) {
  console.error('❌ NPM_TOKEN not found in .env.test');
  process.exit(1);
}

const npmToken = npmTokenMatch[1].trim();

// 读取 package.json 获取包信息
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf-8'));
console.log(`📦 准备发布 ${packageJson.name}@${packageJson.version}`);

try {
  // 1. 清理旧的构建
  console.log('🧹 清理旧构建...');
  if (fs.existsSync('./dist')) {
    fs.rmSync('./dist', { recursive: true, force: true });
  }

  // 2. 构建项目
  console.log('🔨 构建项目...');
  execSync('npm run build', { stdio: 'inherit' });

  // 3. 配置 npm 认证
  console.log('🔐 配置 npm 认证...');
  const npmrcPath = path.join(require('os').homedir(), '.npmrc');
  const npmrcContent = `//registry.npmjs.org/:_authToken=${npmToken}\n`;

  // 备份现有的 .npmrc（如果存在）
  let backupContent = '';
  if (fs.existsSync(npmrcPath)) {
    backupContent = fs.readFileSync(npmrcPath, 'utf-8');
  }

  // 写入新的认证配置
  fs.writeFileSync(npmrcPath, npmrcContent);

  // 4. 发布到 npm
  console.log('🚀 发布到 npm...');
  execSync('npm publish --access public', { stdio: 'inherit' });

  // 恢复原来的 .npmrc
  if (backupContent) {
    fs.writeFileSync(npmrcPath, backupContent);
  }

  console.log(`\n✅ 成功发布 ${packageJson.name}@${packageJson.version}`);
  console.log(`📝 查看: https://www.npmjs.com/package/${packageJson.name}`);
} catch (error) {
  console.error('❌ 发布失败:', error.message);
  process.exit(1);
}
