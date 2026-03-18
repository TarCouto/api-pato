import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { MagicLinkDto, VerifyTokenDto } from './dto/magic-link.dto';
import { Request } from 'express';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('magic-link')
  @ApiOperation({
    summary: 'Solicitar magic link',
    description:
      'Envia um magic link para o email informado. Cria o usuário automaticamente se não existir.',
  })
  @ApiResponse({ status: 201, description: 'Magic link gerado com sucesso' })
  async requestMagicLink(@Body() body: MagicLinkDto) {
    const { token } = await this.authService.createMagicLink(body.email);

    // Em produção, aqui você enviaria o email com o link
    // Por enquanto, retornamos o token para testes
    return {
      message: 'Magic link gerado com sucesso',
      // TODO: remover token da resposta quando integrar serviço de email
      token,
      verifyUrl: `/auth/verify?token=${token}`,
    };
  }

  @Get('verify')
  @ApiOperation({
    summary: 'Verificar magic link',
    description:
      'Valida o token do magic link, marca email como verificado e cria uma sessão.',
  })
  @ApiResponse({ status: 200, description: 'Autenticação bem sucedida' })
  @ApiResponse({ status: 401, description: 'Link inválido ou expirado' })
  async verifyMagicLink(@Query() query: VerifyTokenDto) {
    return this.authService.verifyMagicLink(query.token);
  }

  @Post('logout')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Logout',
    description: 'Encerra a sessão atual do usuário.',
  })
  @ApiResponse({ status: 200, description: 'Logout realizado' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  async logout(@Req() req: Request) {
    const token = req.headers.authorization!.split(' ')[1];
    return this.authService.logout(token);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Dados do usuário logado',
    description: 'Retorna os dados do usuário autenticado.',
  })
  @ApiResponse({ status: 200, description: 'Dados do usuário' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  async me(@Req() req: Request) {
    return this.authService.getMe(req['user'].id);
  }
}
