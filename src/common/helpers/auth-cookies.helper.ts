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
    res.cookie(cookieName, value, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge,
    });
  }

  clearCookie(res: Response, cookieName: CookieName) {
    res.clearCookie(cookieName, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
  }
}
