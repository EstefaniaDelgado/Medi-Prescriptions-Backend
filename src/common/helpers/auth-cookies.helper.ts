import { Injectable } from '@nestjs/common';
import { Response } from 'express';
import { CookieName } from '../interfaces/cookies.interface';

@Injectable()
export class AuthCookiesHelper {
  constructor() {}

  clearCookies(res: Response) {
    this.clearCookie(res, 'accessToken');
    this.clearCookie(res, 'refreshToken');
  }

  setCookies(
    res: Response,
    accessToken: string,
    cookieAccessTTL: number,
    refreshToken: string,
    cookieRefreshTTL: number,
  ) {
    this.setCookie(res, 'accessToken', accessToken, cookieAccessTTL);
    this.setCookie(res, 'refreshToken', refreshToken, cookieRefreshTTL);
  }

  setCookie(
    res: Response,
    cookieName: CookieName,
    value: string,
    maxAge: number,
  ) {
    const isProduction = process.env.NODE_ENV === 'production';

    res.cookie(cookieName, value, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge,
    });
  }

  clearCookie(res: Response, cookieName: CookieName) {
    const isProduction = process.env.NODE_ENV === 'production';

    res.clearCookie(cookieName, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
    });
  }
}
