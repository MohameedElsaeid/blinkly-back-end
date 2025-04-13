import { ApiProperty } from '@nestjs/swagger';

export interface IJwtPayload {
  sub: string;
  email?: string;
}

export class AuthResponse {
  @ApiProperty({
    example: true,
    description: 'Whether the operation was successful',
  })
  success: boolean;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT access token for authenticated requests',
  })
  accessToken?: string;

  @ApiProperty({
    example: 'Operation completed successfully',
    description: 'A message describing the result of the operation',
  })
  message: string;

  @ApiProperty({
    example: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'user@example.com',
      name: 'John Doe',
      isEmailVerified: true,
      isPhoneVerified: false,
      createdAt: '2024-03-21T10:00:00Z',
    },
    description: 'User data returned on successful authentication',
  })
  user?: Record<string, any>;
}

export interface IAuthResponse {
  success: boolean;
  message: string;
  user?: Record<string, any>;
}
