import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { map, Observable } from 'rxjs';

@Injectable()
export class ResponseFormatInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        const response = context.switchToHttp().getResponse();
        if (typeof data?.error !== 'boolean') {
          const auxData = {
            error: false,
            message: 'Respuesta exitosa',
            response: {
              data: data,
            },
            status: 200,
          };
          response.status(auxData.status);
          return auxData;
        } else {
          if (typeof data.status == 'number' && data.status > 200) response.status(data.status);
          else if (!data.error) {
            data.status = 200;
            response.status(200);
          } else {
            data.status = 422;
            response.status(422);
          }
          return data;
        }
      }),
    );
  }
}
