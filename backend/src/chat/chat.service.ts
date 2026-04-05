import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { Conversation } from './entities/conversation.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,
  ) {}

  async getMessages(conversationId: string): Promise<Message[]> {
    return this.messageRepository.find({
      where: { conversationId },
      order: { createdAt: 'ASC' },
    });
  }

  async getConversations(userId: string): Promise<Conversation[]> {
    // 兼容旧接口
    const result = await this.getConversationsPaginated(userId, 1, 100);
    return result.items as unknown as Conversation[];
  }

  async createConversation(
    senderId: string,
    receiverId: string,
    initialMessage?: string,
  ): Promise<Conversation> {
    const conversation = this.conversationRepository.create({
      type: 'direct' as any,
      category: 'job_hunting' as any,
      createdById: senderId,
      participants: [{ id: senderId } as any, { id: receiverId } as any],
      settings: {} as any,
      unreadCounts: {},
    });

    const savedConv = await this.conversationRepository.save(conversation);

    if (initialMessage) {
      await this.sendMessage(savedConv.id, senderId, initialMessage);
    }

    return savedConv;
  }

  async sendMessage(
    conversationId: string,
    senderId: string,
    content: string,
    type?: string,
  ): Promise<Message> {
    const message = this.messageRepository.create({
      conversationId,
      senderId,
      content,
      type: (type as any) || undefined,
    });

    const savedMessage = await this.messageRepository.save(message);

    // 更新对话的最后消息和时间
    await this.conversationRepository.update(conversationId, {
      lastMessagePreview: content.substring(0, 100),
      lastMessageSenderId: senderId,
      lastMessageCreatedAt: new Date(),
      updatedAt: new Date(),
    });

    return savedMessage;
  }

  async markAsRead(messageId: string): Promise<void> {
    await this.messageRepository.update(messageId, { status: 'read' as any });
  }

  async getConversationById(id: string): Promise<Conversation | null> {
    return this.conversationRepository.findOne({ where: { id } });
  }

  /**
   * 分页获取用户的会话列表
   */
  async getConversationsPaginated(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ) {
    const conversations = await this.conversationRepository
      .createQueryBuilder('conv')
      .leftJoinAndSelect('conv.participants', 'participant')
      .where(
        'EXISTS (SELECT 1 FROM conversation_participants cp WHERE cp."conversationId" = conv.id AND cp."userId" = :userId)',
        { userId },
      )
      .andWhere('conv.isActive = :isActive', { isActive: true })
      .orderBy('conv.updatedAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    const total = await this.conversationRepository
      .createQueryBuilder('conv')
      .where(
        'EXISTS (SELECT 1 FROM conversation_participants cp WHERE cp."conversationId" = conv.id AND cp."userId" = :userId)',
        { userId },
      )
      .andWhere('conv.isActive = :isActive', { isActive: true })
      .getCount();

    const items = conversations.map((conv) => {
      const otherUser = conv.participants?.find((p) => p.id !== userId);
      const unreadCount = (conv.unreadCounts && conv.unreadCounts[userId]) || 0;

      return {
        id: conv.id,
        type: conv.type,
        category: conv.category,
        name: conv.name,
        avatar: conv.avatar,
        otherParticipant: otherUser
          ? {
              id: otherUser.id,
              username: otherUser.username,
              avatar_url: otherUser.avatar_url,
              role: otherUser.role,
            }
          : null,
        lastMessage: conv.lastMessagePreview || null,
        lastMessageType: conv.lastMessageType || null,
        lastMessageSenderId: conv.lastMessageSenderId || null,
        lastMessageCreatedAt: conv.lastMessageCreatedAt || null,
        unreadCount,
        isActive: conv.isActive,
        isPinned: conv.isPinned,
        isMuted: conv.isMuted,
        updatedAt: conv.updatedAt,
        createdAt: conv.createdAt,
      };
    });

    return {
      items,
      total,
      page,
      limit,
      has_more: page * limit < total,
    };
  }

  /**
   * 分页获取会话消息
   */
  async getMessagesPaginated(
    conversationId: string,
    page: number = 1,
    limit: number = 50,
  ) {
    const [messages, total] = await this.messageRepository.findAndCount({
      where: {
        conversationId,
        isDeleted: false,
      },
      relations: ['sender'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    // 翻转为正序（时间升序）
    messages.reverse();

    const items = messages.map((msg) => ({
      id: msg.id,
      conversationId: msg.conversationId,
      senderId: msg.senderId,
      sender: msg.sender
        ? {
            id: msg.sender.id,
            username: msg.sender.username,
            avatar_url: msg.sender.avatar_url,
          }
        : null,
      type: msg.type,
      content: msg.content,
      structuredContent: msg.structuredContent,
      status: msg.status,
      isEdited: msg.isEdited,
      preview: msg.preview,
      createdAt: msg.createdAt,
    }));

    return {
      items,
      total,
      page,
      limit,
      has_more: page * limit < total,
    };
  }

  /**
   * 标记会话中所有消息为已读
   */
  async markConversationAsRead(conversationId: string, userId: string) {
    // 将该用户在此对话中的所有未读消息标记为已读
    await this.messageRepository
      .createQueryBuilder()
      .update(Message)
      .set({ status: 'read' as any })
      .where('conversationId = :conversationId', { conversationId })
      .andWhere('senderId != :userId', { userId })
      .andWhere('status != :status', { status: 'read' })
      .execute();

    // 重置该用户的未读计数
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
    });

    if (conversation) {
      const unreadCounts = { ...conversation.unreadCounts };
      unreadCounts[userId] = 0;
      await this.conversationRepository.update(conversationId, {
        unreadCounts,
      });
    }

    return { success: true, message: '已标记为已读' };
  }
}
