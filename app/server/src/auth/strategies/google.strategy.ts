import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import {
  Strategy as GoogleStrategyBase,
  Profile,
} from 'passport-google-oauth20';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(
  GoogleStrategyBase,
  'google',
) {
  constructor(private authService: AuthService) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      scope: ['profile', 'email'],
    });
  }

  authorizationParams(options: any): any {
    return {
      prompt: 'select_account',
    };
  }
  
  async validate(accessToken: string, refreshToken: string, profile: Profile) {
    const { emails, displayName, photos } = profile;
    return this.authService.validateOAuthLogin({
      email: emails?.[0].value,
      name: displayName,
      picture: photos?.[0].value,
    });
  }
}
