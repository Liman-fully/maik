#!/usr/bin/env python3
import paramiko
from scp import SCPClient
import os
import sys

host = '117.50.91.230'
username = 'ubuntu'
password = 'vp85fCzNRJuDCjr7'
remote_path = '/var/www/maik'
local_path = '/Users/liman/Desktop/maik/server_maik'

try:
    print("正在连接远程服务器...")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(host, username=username, password=password, timeout=30)
    
    # 创建本地目录
    os.makedirs(local_path, exist_ok=True)
    
    # 使用transport
    transport = client.get_transport()
    
    print("正在复制文件...")
    with SCPClient(transport) as scp:
        scp.get(remote_path, local_path, recursive=True)
    
    print("文件复制完成!")
    
    # 验证
    print("\n--- 复制的文件结构 ---")
    for item in os.listdir(local_path)[:20]:
        full_path = os.path.join(local_path, item)
        if os.path.isdir(full_path):
            print(f"📁 {item}/")
        else:
            print(f"📄 {item}")
    
    client.close()
    print("\n✅ 项目代码已复制到桌面 maik 工作区!")
    
except Exception as e:
    print(f"Error: {e}", file=sys.stderr)
    import traceback
    traceback.print_exc()
    sys.exit(1)