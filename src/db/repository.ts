import { eq, and, or, inArray, asc, desc } from 'drizzle-orm';
import { db } from './index';
import { users, groups, groupMembers, messages, messageReactions } from './schema';
import { User, Group, Message } from '../types';

export class DatabaseRepository {
  // Initialize and seed default data if database is empty
  static async seedIfEmpty() {
    try {
      const existingUsers = await db.select().from(users).limit(1);
      if (existingUsers.length > 0) {
        return;
      }

      console.log('Seeding initial school database records into Cloud SQL...');

      // Default Users
      const defaultUsers = [
        {
          id: 'u_principal',
          personnelCode: '10001356',
          mobile: '09121112233',
          fullName: 'دکتر محمد رضایی (مدیر مدرسه)',
          subject: 'مدیر آموزشگاه',
          role: 'principal',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          password: 'bbp13156', // Initial requested password
          isOnline: true,
        },
        {
          id: 'u_deputy',
          personnelCode: '10002244',
          mobile: '09122223344',
          fullName: 'مهندس علیرضا حسینی (معاون)',
          subject: 'معاونت آموزشی و پرورشی',
          role: 'deputy',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
          password: 'deputy_pass_99',
          isOnline: false,
        },
        {
          id: 'u_101',
          personnelCode: '10003355',
          mobile: '09123334455',
          fullName: 'استاد حمید کاویانی',
          subject: 'دبیر ریاضیات و هندسه',
          role: 'teacher',
          avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
          password: 'math_pass_123',
          isOnline: true,
        },
        {
          id: 'u_102',
          personnelCode: '10004466',
          mobile: '09124445566',
          fullName: 'سرکار خانم مریم سعیدی',
          subject: 'دبیر زبان و ادبیات فارسی',
          role: 'teacher',
          avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
          password: 'lit_pass_456',
          isOnline: false,
        },
        {
          id: 'u_103',
          personnelCode: '10005577',
          mobile: '09125556677',
          fullName: 'دکتر بهزاد احمدی',
          subject: 'دبیر فیزیک و آزمایشگاه',
          role: 'teacher',
          avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
          password: 'phys_pass_789',
          isOnline: true,
        },
      ];

      for (const u of defaultUsers) {
        await db.insert(users).values(u).onConflictDoNothing();
      }

      // Default Groups
      const defaultGroups = [
        {
          id: 'g_announcements',
          name: 'کانال رسمی بخشنامه‌ها و اعلانات',
          description: 'کانال ارسال فوری مصوبات، بخشنامه‌های اداری و اطلاعیه‌های رسمی مدرسه',
          avatar: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=150&auto=format&fit=crop&q=80',
          isAnnouncementOnly: true,
          createdBy: 'u_principal',
        },
        {
          id: 'g_all_teachers',
          name: 'شورای عمومی معلمان و دبیران',
          description: 'اتاق هم‌اندیشی و گفتگوی عمومی تمامی همکاران آموزشی و اداری',
          avatar: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=150&auto=format&fit=crop&q=80',
          isAnnouncementOnly: false,
          createdBy: 'u_principal',
        },
        {
          id: 'g_science_dept',
          name: 'گروه آموزشی علوم پایه و ریاضی',
          description: 'هماهنگی آزمون‌ها، طرح درس و امتحانات هماهنگ دروس تخصصی',
          avatar: 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=150&auto=format&fit=crop&q=80',
          isAnnouncementOnly: false,
          createdBy: 'u_principal',
        },
      ];

      for (const g of defaultGroups) {
        await db.insert(groups).values(g).onConflictDoNothing();
      }

      // Group Members
      const allUserIds = defaultUsers.map(u => u.id);
      for (const uid of allUserIds) {
        await db.insert(groupMembers).values({
          groupId: 'g_announcements',
          userId: uid,
        });
        await db.insert(groupMembers).values({
          groupId: 'g_all_teachers',
          userId: uid,
        });
      }

      // Science dept members
      for (const uid of ['u_principal', 'u_101', 'u_103']) {
        await db.insert(groupMembers).values({
          groupId: 'g_science_dept',
          userId: uid,
        });
      }

      // Default Messages
      await db.insert(messages).values([
        {
          id: 'm_1',
          chatId: 'g_announcements',
          senderId: 'u_principal',
          senderName: 'دکتر محمد رضایی (مدیر مدرسه)',
          senderRole: 'principal',
          senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          content: 'همکاران گرامی و دبیران ارجمند، با سلام و آرزوی توفیق؛ لطفاً نمرات مستمر ماهانه را تا پایان هفته جاری در سامانه ثبت فرمایید.',
          type: 'circular',
          isPinned: true,
        },
        {
          id: 'm_2',
          chatId: 'g_all_teachers',
          senderId: 'u_principal',
          senderName: 'دکتر محمد رضایی (مدیر مدرسه)',
          senderRole: 'principal',
          senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          content: 'جلسه شورای معلمان روز سه‌شنبه ساعت ۱۲:۳۰ در محل سالن اجتماعات برگزار خواهد شد.',
          type: 'text',
          isPinned: false,
        },
        {
          id: 'm_3',
          chatId: 'g_all_teachers',
          senderId: 'u_101',
          senderName: 'استاد حمید کاویانی',
          senderRole: 'teacher',
          senderAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
          content: 'سلام جناب دکتر رضایی، هماهنگی‌های گروه ریاضی انجام شده و گزارش پیشرفت دروس آماده ارائه می‌باشد.',
          type: 'text',
          isPinned: false,
        },
      ]);

      console.log('Cloud SQL seed complete!');
    } catch (error) {
      console.error('Error during database seed:', error);
    }
  }

  // Users
  static async getAllUsers(): Promise<User[]> {
    try {
      const rows = await db.select().from(users).orderBy(asc(users.createdAt));
      return rows.map(r => ({
        id: r.id,
        personnelCode: r.personnelCode,
        mobile: r.mobile,
        fullName: r.fullName,
        subject: r.subject,
        role: r.role as 'principal' | 'deputy' | 'teacher',
        avatar: r.avatar,
        password: r.password,
        isOnline: r.isOnline || false,
        createdAt: r.createdAt ? r.createdAt.toISOString() : new Date().toISOString(),
      }));
    } catch (error) {
      console.error('Failed to get users from db:', error);
      throw new Error('Database error retrieving users', { cause: error });
    }
  }

  static async findUserByPersonnelCode(code: string): Promise<User | null> {
    try {
      const rows = await db.select().from(users).where(eq(users.personnelCode, code)).limit(1);
      if (rows.length === 0) return null;
      const r = rows[0];
      return {
        id: r.id,
        personnelCode: r.personnelCode,
        mobile: r.mobile,
        fullName: r.fullName,
        subject: r.subject,
        role: r.role as 'principal' | 'deputy' | 'teacher',
        avatar: r.avatar,
        password: r.password,
        isOnline: r.isOnline || false,
        createdAt: r.createdAt ? r.createdAt.toISOString() : new Date().toISOString(),
      };
    } catch (error) {
      console.error('Failed to find user by code:', error);
      throw new Error('Database error finding user', { cause: error });
    }
  }

  static async createUser(userData: {
    personnelCode: string;
    mobile: string;
    fullName: string;
    subject: string;
    role?: 'principal' | 'deputy' | 'teacher';
    avatar?: string;
    password?: string;
  }): Promise<User> {
    try {
      const newId = 'u_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      const role = userData.role || 'teacher';
      const password = userData.password || 'pass_' + Math.floor(100000 + Math.random() * 900000);
      const avatar = userData.avatar || `https://images.unsplash.com/photo-${1535713875002 + Math.floor(Math.random() * 100)}?w=150&auto=format&fit=crop&q=80`;

      const inserted = await db.insert(users).values({
        id: newId,
        personnelCode: userData.personnelCode,
        mobile: userData.mobile,
        fullName: userData.fullName,
        subject: userData.subject,
        role,
        avatar,
        password,
        isOnline: true,
      }).returning();

      const r = inserted[0];

      // Auto-add new user to public groups
      const publicGroups = await db.select().from(groups);
      for (const g of publicGroups) {
        await db.insert(groupMembers).values({
          groupId: g.id,
          userId: r.id,
        }).onConflictDoNothing();
      }

      return {
        id: r.id,
        personnelCode: r.personnelCode,
        mobile: r.mobile,
        fullName: r.fullName,
        subject: r.subject,
        role: r.role as any,
        avatar: r.avatar,
        password: r.password,
        isOnline: r.isOnline || false,
        createdAt: r.createdAt ? r.createdAt.toISOString() : new Date().toISOString(),
      };
    } catch (error) {
      console.error('Failed to create user in db:', error);
      throw new Error('Database error creating user', { cause: error });
    }
  }

  static async updatePassword(userId: string, newPass: string): Promise<boolean> {
    try {
      await db.update(users).set({ password: newPass }).where(eq(users.id, userId));
      return true;
    } catch (error) {
      console.error('Failed to update password:', error);
      throw new Error('Database error updating password', { cause: error });
    }
  }

  // Groups
  static async getGroups(userId?: string): Promise<Group[]> {
    try {
      const allGroups = await db.select().from(groups).orderBy(desc(groups.createdAt));
      const result: Group[] = [];

      for (const g of allGroups) {
        const members = await db.select({ userId: groupMembers.userId })
          .from(groupMembers)
          .where(eq(groupMembers.groupId, g.id));
        const memberIds = members.map(m => m.userId);

        // If filtering by user membership
        if (userId && !memberIds.includes(userId)) {
          continue;
        }

        result.push({
          id: g.id,
          name: g.name,
          description: g.description || '',
          avatar: g.avatar,
          memberIds,
          adminIds: [g.createdBy || 'u_principal'],
          isAnnouncementOnly: g.isAnnouncementOnly || false,
          createdBy: g.createdBy || '',
          createdAt: g.createdAt ? g.createdAt.toISOString() : new Date().toISOString(),
        });
      }

      return result;
    } catch (error) {
      console.error('Failed to get groups from db:', error);
      throw new Error('Database error retrieving groups', { cause: error });
    }
  }

  static async createGroup(groupData: {
    name: string;
    description?: string;
    avatar?: string;
    memberIds?: string[];
    isAnnouncementOnly?: boolean;
    createdBy: string;
  }): Promise<Group> {
    try {
      const newId = 'g_' + Date.now();
      const avatar = groupData.avatar || 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=150&auto=format&fit=crop&q=80';

      const inserted = await db.insert(groups).values({
        id: newId,
        name: groupData.name,
        description: groupData.description || '',
        avatar,
        isAnnouncementOnly: groupData.isAnnouncementOnly || false,
        createdBy: groupData.createdBy,
      }).returning();

      const g = inserted[0];
      const memberIds = Array.from(new Set([groupData.createdBy, ...(groupData.memberIds || [])]));

      for (const uid of memberIds) {
        await db.insert(groupMembers).values({
          groupId: g.id,
          userId: uid,
        });
      }

      return {
        id: g.id,
        name: g.name,
        description: g.description || '',
        avatar: g.avatar,
        memberIds,
        adminIds: [groupData.createdBy],
        isAnnouncementOnly: g.isAnnouncementOnly || false,
        createdBy: g.createdBy || '',
        createdAt: g.createdAt ? g.createdAt.toISOString() : new Date().toISOString(),
      };
    } catch (error) {
      console.error('Failed to create group in db:', error);
      throw new Error('Database error creating group', { cause: error });
    }
  }

  static async updateGroupMembers(groupId: string, memberIds: string[]): Promise<string[]> {
    try {
      // Delete existing memberships
      await db.delete(groupMembers).where(eq(groupMembers.groupId, groupId));

      // Insert new memberships
      for (const uid of memberIds) {
        await db.insert(groupMembers).values({
          groupId,
          userId: uid,
        });
      }

      return memberIds;
    } catch (error) {
      console.error('Failed to update group members in db:', error);
      throw new Error('Database error updating group members', { cause: error });
    }
  }

  // Messages
  static async getMessages(chatId: string): Promise<Message[]> {
    try {
      const rows = await db.select()
        .from(messages)
        .where(eq(messages.chatId, chatId))
        .orderBy(asc(messages.createdAt));

      const messageIds = rows.map(r => r.id);
      let reactionsByMsgId: Record<string, Record<string, string[]>> = {};

      if (messageIds.length > 0) {
        const reactionsList = await db.select()
          .from(messageReactions)
          .where(inArray(messageReactions.messageId, messageIds));

        for (const rx of reactionsList) {
          if (!reactionsByMsgId[rx.messageId]) {
            reactionsByMsgId[rx.messageId] = {};
          }
          if (!reactionsByMsgId[rx.messageId][rx.emoji]) {
            reactionsByMsgId[rx.messageId][rx.emoji] = [];
          }
          reactionsByMsgId[rx.messageId][rx.emoji].push(rx.userId);
        }
      }

      return rows.map(r => {
        const d = r.createdAt ? new Date(r.createdAt) : new Date();
        const timeStr = d.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
        return {
          id: r.id,
          chatId: r.chatId,
          senderId: r.senderId,
          senderName: r.senderName,
          senderRole: r.senderRole as any,
          senderAvatar: r.senderAvatar,
          content: r.content,
          type: r.type as any,
          timestamp: timeStr,
          fileUrl: r.fileUrl || undefined,
          fileName: r.fileName || undefined,
          voiceDuration: r.voiceDuration || undefined,
          isPinned: r.isPinned || false,
          reactions: reactionsByMsgId[r.id] || {},
          readBy: [r.senderId],
          replyTo: r.replyToId ? {
            id: r.replyToId,
            content: r.replyToContent || '',
            senderName: r.replyToSender || '',
          } : undefined,
        };
      });
    } catch (error) {
      console.error('Failed to get messages from db:', error);
      throw new Error('Database error retrieving messages', { cause: error });
    }
  }

  static async insertMessage(msg: {
    chatId: string;
    senderId: string;
    senderName: string;
    senderRole: string;
    senderAvatar: string;
    content: string;
    type?: 'text' | 'voice' | 'circular' | 'file';
    fileUrl?: string;
    fileName?: string;
    voiceDuration?: number;
    replyTo?: { id: string; content: string; senderName: string };
  }): Promise<Message> {
    try {
      const newId = 'm_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5);
      const inserted = await db.insert(messages).values({
        id: newId,
        chatId: msg.chatId,
        senderId: msg.senderId,
        senderName: msg.senderName,
        senderRole: msg.senderRole,
        senderAvatar: msg.senderAvatar,
        content: msg.content,
        type: msg.type || 'text',
        fileUrl: msg.fileUrl,
        fileName: msg.fileName,
        voiceDuration: msg.voiceDuration,
        isPinned: false,
        replyToId: msg.replyTo?.id,
        replyToContent: msg.replyTo?.content,
        replyToSender: msg.replyTo?.senderName,
      }).returning();

      const r = inserted[0];
      const d = r.createdAt ? new Date(r.createdAt) : new Date();
      const timeStr = d.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });

      return {
        id: r.id,
        chatId: r.chatId,
        senderId: r.senderId,
        senderName: r.senderName,
        senderRole: r.senderRole as any,
        senderAvatar: r.senderAvatar,
        content: r.content,
        type: r.type as any,
        timestamp: timeStr,
        fileUrl: r.fileUrl || undefined,
        fileName: r.fileName || undefined,
        voiceDuration: r.voiceDuration || undefined,
        isPinned: r.isPinned || false,
        reactions: {},
        readBy: [r.senderId],
        replyTo: msg.replyTo,
      };
    } catch (error) {
      console.error('Failed to insert message into db:', error);
      throw new Error('Database error inserting message', { cause: error });
    }
  }

  static async togglePin(messageId: string): Promise<boolean> {
    try {
      const rows = await db.select().from(messages).where(eq(messages.id, messageId)).limit(1);
      if (rows.length === 0) return false;
      const newPinned = !rows[0].isPinned;
      await db.update(messages).set({ isPinned: newPinned }).where(eq(messages.id, messageId));
      return newPinned;
    } catch (error) {
      console.error('Failed to toggle pin:', error);
      throw new Error('Database error toggling pin', { cause: error });
    }
  }

  static async reactToMessage(messageId: string, userId: string, emoji: string): Promise<Record<string, string[]>> {
    try {
      // Check if reaction already exists
      const existing = await db.select()
        .from(messageReactions)
        .where(
          and(
            eq(messageReactions.messageId, messageId),
            eq(messageReactions.userId, userId),
            eq(messageReactions.emoji, emoji)
          )
        );

      if (existing.length > 0) {
        // Remove reaction
        await db.delete(messageReactions).where(eq(messageReactions.id, existing[0].id));
      } else {
        // Add reaction
        await db.insert(messageReactions).values({
          messageId,
          userId,
          emoji,
        });
      }

      // Fetch all updated reactions for this message
      const allRx = await db.select()
        .from(messageReactions)
        .where(eq(messageReactions.messageId, messageId));

      const reactions: Record<string, string[]> = {};
      for (const r of allRx) {
        if (!reactions[r.emoji]) {
          reactions[r.emoji] = [];
        }
        reactions[r.emoji].push(r.userId);
      }

      return reactions;
    } catch (error) {
      console.error('Failed to react to message:', error);
      throw new Error('Database error reacting to message', { cause: error });
    }
  }
}
