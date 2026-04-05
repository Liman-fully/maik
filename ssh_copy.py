#!/usr/bin/env python3
import paramiko
import os
import tarfile
import io
import sys

host = '117.50.91.230'
username = 'ubuntu'
password = 'vp85fCzNRJuDCjr7'
remote_path = '/var/www/maik'
local_path = '/Users/liman/Desktop/maik/server_maik'

try:
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(host, username=username, password=password, timeout=30)
    
    # 查看远程目录结构
    stdin, stdout, stderr = client.exec_command(f"ls -la {remote_path}")
    print("--- 远程目录结构 ---")
    print(stdout.read().decode())
    
    # 创建tar包并读取
    print("\n正在打包...")
    stdin, stdout, stderr = client.exec_command(f"cd {remote_path} && tar -czf - . 2>/dev/null")
    
    # 读取tar包数据
    tar_data = stdout.read()
    print(f"打包完成，大小: {len(tar_data)} bytes")
    
    # 保存到本地
    os.makedirs(local_path, exist_ok=True)
    tar_path = os.path.join(local_path, 'maik.tar.gz')
    with open(tar_path, 'wb') as f:
        f.write(tar_data)
    print(f"已保存: {tar_path}")
    
    # 解压
    print("正在解压...")
    with tarfile.open(tar_path, 'gz') as tar:
        tar.extractall(local_path)
    
    # 删除tar包
    os.remove(tar_path)
    print("解压完成!")
    
    # 验证
    for root, dirs, files in os.walk(local_path):
        # 跳过node_modules等大目录
        dirs[:] = [d for d in dirs if d not in ['node_modules', '.next', '.git']]
        for f in files[:10]:  # 只显示前10个
            print(os.path.join(root, f))
        if len(files) > 10:
            print(f"... 还有 {len(files)-10} 个文件")
        break
    
    client.close()
    print("\n✅ 代码复制完成!")
    
except Exception as e:
    print(f"Error: {e}", file=sys.stderr)
    import traceback
    traceback.print_exc()
    sys.exit(1)