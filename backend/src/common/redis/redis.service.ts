import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;
  private pubClient: Redis;
  private subClient: Redis;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const redisConfig = {
      host: this.configService.get('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
      password: this.configService.get('REDIS_PASSWORD'),
      db: this.configService.get<number>('REDIS_DB', 0),
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: false,
    };

    this.client = new Redis(redisConfig);
    this.pubClient = new Redis(redisConfig);
    this.subClient = new Redis(redisConfig);

    // 测试连接
    try {
      await this.client.ping();
      console.log('Redis连接成功');
    } catch (error) {
      console.error('Redis连接失败:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await Promise.all([
      this.client?.quit(),
      this.pubClient?.quit(),
      this.subClient?.quit(),
    ]);
  }

  /**
   * 获取缓存值
   */
  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  /**
   * 获取缓存值并解析为JSON
   */
  async getJson<T>(key: string): Promise<T | null> {
    const value = await this.client.get(key);
    return value ? JSON.parse(value) : null;
  }

  /**
   * 设置缓存值
   */
  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.client.setex(key, ttl, value);
    } else {
      await this.client.set(key, value);
    }
  }

  /**
   * 设置缓存值（JSON格式）
   */
  async setJson(key: string, value: any, ttl?: number): Promise<void> {
    await this.set(key, JSON.stringify(value), ttl);
  }

  /**
   * 删除缓存
   */
  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  /**
   * 批量删除缓存（支持通配符）
   */
  async delPattern(pattern: string): Promise<void> {
    const keys = await this.client.keys(pattern);
    if (keys.length > 0) {
      await this.client.del(...keys);
    }
  }

  /**
   * 检查键是否存在
   */
  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }

  /**
   * 设置过期时间
   */
  async expire(key: string, ttl: number): Promise<void> {
    await this.client.expire(key, ttl);
  }

  /**
   * 获取剩余过期时间
   */
  async ttl(key: string): Promise<number> {
    return this.client.ttl(key);
  }

  /**
   * 递增计数器
   */
  async incr(key: string, by = 1): Promise<number> {
    if (by === 1) {
      return this.client.incr(key);
    } else {
      return this.client.incrby(key, by);
    }
  }

  /**
   * 递减计数器
   */
  async decr(key: string, by = 1): Promise<number> {
    if (by === 1) {
      return this.client.decr(key);
    } else {
      return this.client.decrby(key, by);
    }
  }

  /**
   * 获取哈希表字段值
   */
  async hget(key: string, field: string): Promise<string | null> {
    return this.client.hget(key, field);
  }

  /**
   * 设置哈希表字段值
   */
  async hset(key: string, field: string, value: string): Promise<void> {
    await this.client.hset(key, field, value);
  }

  /**
   * 获取哈希表所有字段
   */
  async hgetall(key: string): Promise<Record<string, string>> {
    return this.client.hgetall(key);
  }

  /**
   * 删除哈希表字段
   */
  async hdel(key: string, field: string): Promise<void> {
    await this.client.hdel(key, field);
  }

  /**
   * 设置集合
   */
  async sadd(key: string, member: string): Promise<void> {
    await this.client.sadd(key, member);
  }

  /**
   * 获取集合所有成员
   */
  async smembers(key: string): Promise<string[]> {
    return this.client.smembers(key);
  }

  /**
   * 检查集合成员是否存在
   */
  async sismember(key: string, member: string): Promise<boolean> {
    const result = await this.client.sismember(key, member);
    return result === 1;
  }

  /**
   * 从集合移除成员
   */
  async srem(key: string, member: string): Promise<void> {
    await this.client.srem(key, member);
  }

  /**
   * 发布消息
   */
  async publish(channel: string, message: string): Promise<void> {
    await this.pubClient.publish(channel, message);
  }

  /**
   * 订阅频道
   */
  async subscribe(channel: string, callback: (message: string) => void): Promise<void> {
    this.subClient.subscribe(channel);
    this.subClient.on('message', (ch, msg) => {
      if (ch === channel) {
        callback(msg);
      }
    });
  }

  /**
   * 取消订阅
   */
  async unsubscribe(channel: string): Promise<void> {
    await this.subClient.unsubscribe(channel);
  }

  /**
   * 获取Redis客户端实例
   */
  getClient(): Redis {
    return this.client;
  }

  /**
   * 获取发布客户端实例
   */
  getPubClient(): Redis {
    return this.pubClient;
  }

  /**
   * 获取订阅客户端实例
   */
  getSubClient(): Redis {
    return this.subClient;
  }

  /**
   * 缓存包装器 - 简化缓存操作
   */
  async cached<T>(key: string, fn: () => Promise<T>, ttl = 300): Promise<T> {
    const cached = await this.getJson<T>(key);
    if (cached !== null) {
      return cached;
    }

    const result = await fn();
    await this.setJson(key, result, ttl);
    return result;
  }

  /**
   * 批量缓存包装器
   */
  async batchCached<T>(
    keys: string[],
    fn: (missingKeys: string[]) => Promise<Record<string, T>>,
    ttl = 300,
  ): Promise<Record<string, T>> {
    const results: Record<string, T> = {};
    const missingKeys: string[] = [];

    // 尝试从缓存获取
    for (const key of keys) {
      const cached = await this.getJson<T>(key);
      if (cached !== null) {
        results[key] = cached;
      } else {
        missingKeys.push(key);
      }
    }

    // 如果所有数据都在缓存中，直接返回
    if (missingKeys.length === 0) {
      return results;
    }

    // 获取缺失的数据
    const missingData = await fn(missingKeys);

    // 将新数据写入缓存并添加到结果中
    for (const key of missingKeys) {
      const data = missingData[key];
      if (data !== undefined) {
        await this.setJson(key, data, ttl);
        results[key] = data;
      }
    }

    return results;
  }

  /**
   * 清除特定模式的所有缓存
   */
  async clearPattern(pattern: string): Promise<number> {
    const keys = await this.client.keys(pattern);
    if (keys.length > 0) {
      await this.client.del(...keys);
    }
    return keys.length;
  }

  /**
   * 获取缓存统计信息
   */
  async getStats(): Promise<{
    totalKeys: number;
    memoryUsage: number;
    connectedClients: number;
  }> {
    const [info, clients] = await Promise.all([
      this.client.info(),
      this.client.client('LIST'),
    ]);

    // 解析info命令的输出
    const lines = info.split('\n');
    const stats: Record<string, string> = {};

    for (const line of lines) {
      const [key, value] = line.split(':');
      if (key && value) {
        stats[key.trim()] = value.trim();
      }
    }

    return {
      totalKeys: parseInt(stats['db0']?.split(',')[0]?.split('=')[1] || '0', 10),
      memoryUsage: parseInt(stats['used_memory'] || '0', 10),
      connectedClients: clients && typeof clients === 'string' ? clients.split('\n').filter((l: string) => l).length : 0,
    };
  }
}