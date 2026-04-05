#!/usr/bin/env python3
import paramiko
import os
import sys

host = '117.50.91.230'
username = 'ubuntu'
password = 'vp85fCzNRJuDCjr7'
remote_base = '/var/www/maik'
local_base = '/Users/liman/Desktop/maik/server_maik'

try:
    print("正在连接远程服务器...")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(host, username=username, password=password, timeout=30)
    
    # 创建本地根目录
    os.makedirs(local_base, exist_ok=True)
    
    # 获取远程目录列表
    print("获取远程目录列表...")
    stdin, stdout, stderr = client.exec_command(f"find {remote_base} -maxdepth 3 -type d 2>/dev/null")
    dirs = [d for d in stdout.read().decode().strip().split('\n') if d]
    print(f"找到 {len(dirs)} 个目录")
    
    # 创建所有目录
    for d in dirs:
        rel_path = d.replace(remote_base, '').lstrip('/')
        local_dir = os.path.join(local_base, rel_path)
        os.makedirs(local_dir, exist_ok=True)
    
    print(f"创建了 {len(dirs)} 个目录")
    
    # 获取文件列表
    print("获取文件列表...")
    stdin, stdout, stderr = client.exec_command(f"find {remote_base} -type f 2>/dev/null | head -500")
    files = [f for f in stdout.read().decode().strip().split('\n') if f]
    print(f"找到 {len(files)} 个文件")
    
    # 下载文件
    sftp = client.open_sftp()
    downloaded = 0
    for f in files:
        rel_path = f.replace(remote_base, '').lstrip('/')
        local_file = os.path.join(local_base, rel_path)
        try:
            # 确保父目录存在
            os.makedirs(os.path.dirname(local_file), exist_ok=True)
            sftp.get(f, local_file)
            downloaded += 1
            if downloaded % 20 == 0:
                print(f"已下载 {downloaded}/{len(files)} 个文件...")
        except Exception as e:
            print(f"⚠️ 跳过 {os.path.basename(f)}: {e}")
    
    sftp.close()
    print(f"\n✅ 共下载 {downloaded} 个文件")
    
    # 验证
    print("\n--- 复制的目录结构 ---")
    for item in sorted(os.listdir(local_base))[:15]:
        full_path = os.path.join(local_base, item)
        if os.path.isdir(full_path):
            print(f"📁 {item}/")
        else:
            print(f"📄 {item}")
    
    client.close()
    print("\n✅ 项目代码已复制到桌面 maik 工作区!")
    print(f"📂 路径: {local_base}")
    
except Exception as e:
    print(f"Error: {e}", file=sys.stderr)
    import traceback
    traceback.print_exc()
    sys.exit(1)