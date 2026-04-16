import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/database/prisma.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  /**
   * Login user (stub implementation)
   */
  async login(email: string, password: string) {
    // This is a stub implementation
    // In a real system, you would verify credentials and return a token
    throw new Error('Not implemented');
  }

  /**
   * Validate user from JWT payload
   */
  async validateUser(payload: any) {
    // Validate user from JWT payload
    return payload;
  }
}
