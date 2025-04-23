import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        // Handle arrays
        if (Array.isArray(data)) {
          return data.map((item) => this.transformResponse(item));
        }
        // Handle single objects
        return this.transformResponse(data);
      }),
    );
  }

  private transformResponse(data: any) {
    if (data && typeof data === 'object') {
      // Remove sensitive fields
      const { password, role, ...safeData } = data;

      // If the object has nested user data, clean that too
      if (safeData.user) {
        const { password, role, ...safeUser } = safeData.user;
        safeData.user = safeUser;
      }

      return safeData;
    }
    return data;
  }
}
