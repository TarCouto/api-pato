import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { createHash, randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  private readonly MAGIC_LINK_EXPIRY_MINUTES = 15;
  private readonly SESSION_EXPIRY_DAYS = 7;

  constructor(private readonly prisma: PrismaService) {}

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private generateToken(): string {
    return randomBytes(32).toString('hex');
  }

  async createMagicLink(email: string): Promise<{ token: string }> {
    // Cria user se não existe
    await this.prisma.user.upsert({
      where: { email },
      update: {},
      create: { email },
    });

    // Invalida magic links anteriores desse email
    await this.prisma.magicLink.updateMany({
      where: { email, usedAt: null },
      data: { usedAt: new Date() },
    });

    // Gera novo token e salva o hash
    const token = this.generateToken();
    const hashedToken = this.hashToken(token);

    await this.prisma.magicLink.create({
      data: {
        token: hashedToken,
        email,
        expiresAt: new Date(
          Date.now() + this.MAGIC_LINK_EXPIRY_MINUTES * 60 * 1000,
        ),
      },
    });

    // Retorna o token original (não o hash) — esse vai no email
    return { token };
  }

  async verifyMagicLink(token: string) {
    const hashedToken = this.hashToken(token);

    const magicLink = await this.prisma.magicLink.findFirst({
      where: {
        token: hashedToken,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!magicLink) {
      throw new UnauthorizedException('Link inválido ou expirado');
    }

    // Marca como usado
    await this.prisma.magicLink.update({
      where: { id: magicLink.id },
      data: { usedAt: new Date() },
    });

    // Marca email como verificado
    const user = await this.prisma.user.update({
      where: { email: magicLink.email },
      data: { emailVerified: new Date() },
    });

    // Cria session
    const sessionToken = this.generateToken();
    const hashedSessionToken = this.hashToken(sessionToken);

    await this.prisma.session.create({
      data: {
        token: hashedSessionToken,
        userId: user.id,
        expiresAt: new Date(
          Date.now() + this.SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
        ),
      },
    });

    return {
      sessionToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
      },
    };
  }

  async validateSession(token: string) {
    const hashedToken = this.hashToken(token);

    const session = await this.prisma.session.findFirst({
      where: {
        token: hashedToken,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!session) {
      throw new UnauthorizedException('Sessão inválida ou expirada');
    }

    return {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role,
      avatar: session.user.avatar,
    };
  }

  async logout(token: string) {
    const hashedToken = this.hashToken(token);

    await this.prisma.session.deleteMany({
      where: { token: hashedToken },
    });

    return { message: 'Logout realizado com sucesso' };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
    };
  }
}
