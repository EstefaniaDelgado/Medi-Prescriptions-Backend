import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from 'src/users/users.module';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from './strategies/local.strategy';
import { LocalAuthGuard } from '../common/guards/local.guard';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { JwtRefreshAuthGuard } from './guards/jwt-refresh.guard';
import { AuthCookiesHelper } from 'src/common/helpers/auth-cookies.helper';
// import { EmailModule } from 'src/email/email.module';
import { assertValidExpires } from 'src/common/utils/assertValidExpires';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const jwtSecret = configService.get<string>('JWT_ACCESS_SECRET');
        const jwtExpiration = configService.get<string>('JWT_ACCESS_TTL');
        assertValidExpires(jwtExpiration!);
        return {
          secret: jwtSecret ?? 'fallback-secret',
          signOptions: {
            expiresIn: jwtExpiration ?? '3600s',
          },
        };
      },
    }),
    PassportModule,
    UsersModule,
    PrismaModule,
    // EmailModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    LocalStrategy,
    LocalAuthGuard,
    JwtStrategy,
    JwtAuthGuard,
    JwtRefreshStrategy,
    JwtRefreshAuthGuard,
    AuthCookiesHelper,
  ],
})
export class AuthModule {}
