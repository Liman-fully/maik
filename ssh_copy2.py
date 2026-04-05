#!/usr/bin/env python3
import paramiko
import os
import sys

host = '117.50.91.230'
username = 'ubuntu'
password = 'vp85fCzNRJuDCjr7'
remote_path = '/var/www/maik'
local_base = '/Users/liman/Desktop/maik'

# 使用scp命令下载
os.system(f"sshpass -p '{password}' scp -r -o StrictHostKeyChecking=no ubuntu@{host}:{remote_path} {local_base}/server_maik")
print("完成")