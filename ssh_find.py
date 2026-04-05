#!/usr/bin/env python3
import paramiko
import sys

host = '117.50.91.230'
username = 'ubuntu'
password = 'vp85fCzNRJuDCjr7'  # 使用正确的密码

try:
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(host, username=username, password=password, timeout=10)
    
    # 查找项目目录
    stdin, stdout, stderr = client.exec_command(
        "find / -type d \\( -name 'huntlink' -o -name 'maik' -o -name 'app' \\) 2>/dev/null | grep -v -E '(node_modules|.git|proc|sys|boot|run)' | head -30"
    )
    result = stdout.read().decode()
    print(result)
    
    # 检查/home/ubuntu目录结构
    stdin, stdout, stderr = client.exec_command("ls -la /home/ubuntu/ 2>/dev/null; echo '--- /var/www ---'; ls -la /var/www/ 2>/dev/null")
    print("\n--- 目录结构 ---\n")
    print(stdout.read().decode())
    
    client.close()
except Exception as e:
    print(f"Error: {e}", file=sys.stderr)
    sys.exit(1)