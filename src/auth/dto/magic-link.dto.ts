import { ApiProperty } from '@nestjs/swagger';

export class MagicLinkDto {
  @ApiProperty({
    example: 'usuario@email.com',
    description: 'Email do usuário para enviar o magic link',
  })
  email: string;
}

export class VerifyTokenDto {
  @ApiProperty({
    example: 'abc123...',
    description: 'Token recebido por email',
  })
  token: string;
}
