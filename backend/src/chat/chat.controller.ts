import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';

@ApiTags('消息')
@Controller('messages')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('conversations')
  @ApiOperation({ summary: '获取会话列表' })
  async getConversations(
    @Req() req: Request,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    const userId = (req.user as any).id;
    return this.chatService.getConversationsPaginated(
      userId,
      parseInt(page, 10) || 1,
      parseInt(limit, 10) || 20,
    );
  }

  @Get('conversations/:conversationId/messages')
  @ApiOperation({ summary: '获取会话消息列表' })
  async getMessages(
    @Param('conversationId') conversationId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
  ) {
    return this.chatService.getMessagesPaginated(
      conversationId,
      parseInt(page, 10) || 1,
      parseInt(limit, 10) || 50,
    );
  }

  @Post('conversations/:conversationId/messages')
  @ApiOperation({ summary: '发送消息' })
  async sendMessage(
    @Param('conversationId') conversationId: string,
    @Body() body: { content: string; type?: string },
    @Req() req: Request,
  ) {
    const userId = (req.user as any).id;
    return this.chatService.sendMessage(
      conversationId,
      userId,
      body.content,
      body.type,
    );
  }

  @Post('conversations/:conversationId/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '标记会话消息为已读' })
  async markAsRead(
    @Param('conversationId') conversationId: string,
    @Req() req: Request,
  ) {
    const userId = (req.user as any).id;
    return this.chatService.markConversationAsRead(conversationId, userId);
  }
}
