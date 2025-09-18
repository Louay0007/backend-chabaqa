import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CookieUtil } from '../../common/utils/cookie.util';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  getRequest(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    
    // Si le token n'est pas dans les headers, chercher dans les cookies
    if (!request.headers.authorization) {
      const tokenFromCookie = request.cookies[CookieUtil.COOKIE_NAMES.ACCESS_TOKEN];
      if (tokenFromCookie) {
        request.headers.authorization = `Bearer ${tokenFromCookie}`;
      }
    }
    
    return request;
  }
} 